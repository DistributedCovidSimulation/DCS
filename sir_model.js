function workFn(config) {
    Array.prototype.remove = function() {
        var what, a = arguments, L = a.length, ax;
        while (L && this.length) {
            what = a[--L];
            while ((ax = this.indexOf(what)) !== -1) {
                this.splice(ax, 1);
            }
        }
        return this;
    };
    
    class Person {
        constructor(x, y, status) {
            this.x = x;
            this.y = y;
            this.status = status;
            this.infectTime = -1;
            this.infectedOthers = 0;
            this.infectedOthersFullySus = 0;
        }
        
        move(dx, dy, index) {
            index.remove(this);
            this.x = Math.abs((this.x + dx) % 1);
            this.y = Math.abs((this.y + dy) % 1);
            index.add(this);
        }
    }
    
    class SpaceIndex {
        constructor() {
            this.index = [];
            this.index.length = 101*101;
            for (let i = 0; i < this.index.length; i++) {
                this.index[i] = [];
            }
        }
    
        add(person) {
            this.pos(person.x, person.y).push(person);
        }
    
        remove(person) {
            this.pos(person.x, person.y).remove(person);
        }
        
        forRadius(person, radius, func) {
            for (let i = person.x - radius; i <= person.x + radius + 0.01; i+=0.01) {
                for (let j = person.y - radius; j <= person.y + radius + 0.01; j+=0.01) {
                    for (const p of (this.pos(i, j) || [])) {
                        if (Math.pow(p.x - person.x, 2) + Math.pow(p.y - person.y, 2) < radius * radius) {
                            func(person, p);
                        }
                    }
                }
            }
        }
    
        pos(x, y) {
            return this.index[Math.floor(x * 100) * 100 + Math.floor(y * 100)];
        }
    }
    
    class SIRModel {
        config = {
            S0: 5000,
            I0: 25,
            R0: 0,
    
            infection_radius: 0.02,
            infection_chance: 0.01,
        
            recovery_rate: 0.05,
            recovery_delay: 30,
    
            movement_chance: 0.22,
            movement_max_amt: 0.005,
        };
    
        results = [];
    
        constructor(config) {
            this.config = {...this.config, ...config};
            this.n = this.config.S0 + this.config.I0 + this.config.R0;
            this.rng = Math.random
    
            // Spread people around in a box
            this.people = [];
            this.people.length = this.n;
            
            for (let i = 0; i < this.config.S0; i++) {
                this.people[i] = new Person(this.rng(), this.rng(), 0);
            }
            
            for (let i = 0; i < this.config.I0; i++) {
                this.people[i + this.config.S0] = new Person(this.rng(), this.rng(), 1);
                this.people[i + this.config.S0].infectTime = 0;
            }
            
            for (let i = 0; i < this.config.R0; i++) {
                this.people[i + this.config.I0 + this.config.S0] = new Person(this.rng(), this.rng(), -1);
            }
    
            this.space_index = new SpaceIndex();
            for (let i = 0; i < this.n; i++) {
                this.space_index.add(this.people[i]);
            }
    
            this.summarize_results(0);
        }
    
        summarize_results(time) {
            const last = this.people.filter(
                p => p.infectTime >= 0 
                    // && p.infectTime > time - 50
                    && p.status === -1,
            );
            const trans = last.reduce((p, i) => i.infectedOthers + p, 0);
            const transFullySus = last.reduce((p, i) => i.infectedOthersFullySus + p, 0);
    
            this.results.push({
                'S': this.people.filter(i => i.status === 0).length,
                'I': this.people.filter(i => i.status > 0).length,
                'R': this.people.filter(i => i.status === -1).length,
                'rate': trans / last.length || 0,
                'rateFullySus': transFullySus / last.length || 0,
            });
        }
    
        tick(time) {

            for (let i = 0; i < this.n; i++) {
                if (this.rng() < this.config.movement_chance) {
                    const angle = this.rng() * Math.PI * 2;
                    const mag = this.rng() * this.config.movement_max_amt;

                    this.people[i].move(
                        Math.sin(angle) * mag,
                        Math.cos(angle) * mag,
                        this.space_index,
                    );
                }
            }
    
            // Heal people
            for (let i = 0; i < this.n; i++) {
                const p = this.people[i];
                if (p.status > this.config.recovery_delay && this.rng() < this.config.recovery_rate) {
                    p.status = -1;
                } else if (p.status > 0) {
                    p.status++;
                }
            }
    
            // Infect some people
            for (let i = 0; i < this.n; i++) {
                const p = this.people[i];
                if (p.status > 0) {
                    this.space_index.forRadius(p, this.config.infection_radius, (inf, sus) => {
                        if (inf !== sus && this.rng() < this.config.infection_chance) {
                            p.infectedOthersFullySus++;
                            if (sus.status === 0) {
                                sus.status = 1;
                                sus.infectTime = time;
                                p.infectedOthers++;
                            }
                        }
                    });
                }
            }
    
            this.summarize_results(time);
        }
    
        // Run and return results
        run_model(n_ticks = 500) {
            for (let i = 1; i < n_ticks; i++) {
                this.tick(i);
            }

            // Use this to configure what gets returned
            // return this.results;
            let last = this.results[n_ticks - 1];
            return JSON.stringify({
                lS: last.S,
                lI: last.I,
                lR: last.R,
                maxRt: this.results.reduce((a, i) => Math.max(a, i.rate), 0),
                maxR0: this.results.reduce((a, i) => Math.max(a, i.rateFullySus), 0),
            });
        }
    }
    
    const results = [];
    for (let i = 0; i <= (config.iters || 10); i++) {
        const model = new SIRModel(config);
        if (config.render_mode) {
            return model
        }

        progress(1 / (config.iters || 10));
        
        results.push(model.run_model());
    }

    return results;
}
