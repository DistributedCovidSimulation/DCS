async function start_render() {
    config = JSON.parse(document.getElementById("config").value || "{}");
    const model = workFn({ ...config, render_mode: true });
    
    const maxTime = 1000;

    const canvas = document.getElementById("outputCanvas");
    canvas.width = 400;
    canvas.height = 400;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled= false

    const canvas2 = document.getElementById("outputCanvas2");
    canvas2.width = maxTime;
    canvas2.height = 100;
    const canvas2Width = canvas2.width;
    const canvas2Height = canvas2.height;
    const ctx2 = canvas2.getContext("2d");
    ctx2.imageSmoothingEnabled= false
    ctx2.clearRect(0, 0, canvas2Width, canvas2Height);


    ctx.font = "700 14px Consolas";
    ctx.fillStyle = "#0000ff";

    // That's how you define the value of a pixel //
    function drawPixel(canvasData, x, y, r, g, b, a=255, width=canvasWidth, height=canvasHeight) {
      const index = (Math.floor(x * width) + Math.floor(y * height) * width) * 4;

      canvasData.data[index + 0] = r;
      canvasData.data[index + 1] = g;
      canvasData.data[index + 2] = b;
      canvasData.data[index + 3] = a;
    }

    let time = 0;
    const t = setInterval(() => {
      if (time >= maxTime) {
        clearInterval(t);
        return;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      const canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      const canvas2Data = ctx2.getImageData(0, 0, canvas2Width, canvas2Height);
      model.tick(time);
      time += 1;

      console.log(time/maxTime, 1 - (model.results[model.results.length - 1].S / 5000))
      drawPixel(canvas2Data, time/maxTime, 1 - (model.results[model.results.length - 1].S / 5000), 0, 0, 0, 255, canvas2Width, canvas2Height)
      drawPixel(canvas2Data, time/maxTime, 1 - (model.results[model.results.length - 1].I / 5000), 200, 200, 200, 255, canvas2Width, canvas2Height)
      drawPixel(canvas2Data, time/maxTime, 1 - (model.results[model.results.length - 1].R / 5000), 255, 0, 0, 255, canvas2Width, canvas2Height)

      model.tick(time);
      time += 1;

      drawPixel(canvas2Data, time/maxTime, 1 - (model.results[model.results.length - 1].S / 5000), 0, 0, 0, 255, canvas2Width, canvas2Height)
      drawPixel(canvas2Data, time/maxTime, 1 - (model.results[model.results.length - 1].I / 5000), 200, 200, 200, 255, canvas2Width, canvas2Height)
      drawPixel(canvas2Data, time/maxTime, 1 - (model.results[model.results.length - 1].R / 5000), 255, 0, 0, 255, canvas2Width, canvas2Height)
      
      for (person of model.people) {
        if (person.status === 0) {
          drawPixel(canvasData, person.x, person.y, 0, 0, 0);
        } else if (person.status === -1) {
          drawPixel(canvasData, person.x, person.y, 200, 200, 200);
        } else {
          drawPixel(canvasData, person.x, person.y, 255, 0, 0);
        }
      }

      ctx.putImageData(canvasData, 0, 0);
      ctx2.putImageData(canvas2Data, 0, 0);
  
      ctx.fillText(`Distributed Covid Simulation [SIM]`, 10, 20);
      ctx.fillText(`Day:         ${time}`, 10, 35);
      ctx.fillText(`Susceptible: ${model.people.filter(i => i.status === 0).length}`, 10, 50);
      ctx.fillText(`Infected:    ${model.people.filter(i => i.status > 0).length}`, 10, 65);
      ctx.fillText(`Recovered:   ${model.people.filter(i => i.status === -1).length}`, 10, 80);            
      
      const last = model.people
        .filter(
            p => p.infectTime >= 0 
                // && p.infectTime > time - 50
                && p.status === -1,
        );
      const trans = last.reduce((p, i) => i.infectedOthers + p, 0);
      const transFullySus = last.reduce((p, i) => i.infectedOthersFullySus + p, 0);

      ctx.fillText(`Effective Reproduction Number: ${Math.round((trans / last.length || 0) * 100) / 100}`, 10, 95);            
      ctx.fillText(`Basic Reproduction Number:     ${Math.round((transFullySus / last.length || 0) * 100) / 100}`, 10, 110);            
    }, 1000/40);
  }
