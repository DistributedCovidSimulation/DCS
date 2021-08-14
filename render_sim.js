async function start_render() {
    const model = workFn({ render_mode: true });
    
    const canvas = document.getElementById("outputCanvas");
    canvas.width = 400;
    canvas.height = 400;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled= false

    ctx.font = "700 14px Consolas";
    ctx.fillStyle = "#0000ff";

    // That's how you define the value of a pixel //
    function drawPixel(canvasData, x, y, r, g, b, a=255) {
      const index = (Math.floor(x * canvasWidth) + Math.floor(y * canvasHeight) * canvasWidth) * 4;

      canvasData.data[index + 0] = r;
      canvasData.data[index + 1] = g;
      canvasData.data[index + 2] = b;
      canvasData.data[index + 3] = a;
    }

    const maxTime = 500;
    let time = 0;
    const t = setInterval(() => {
      if (time >= maxTime) {
        clearInterval(t);
        return;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      const canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      model.tick(time);
      model.tick(time);
      time += 2;

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
  
      ctx.fillText(`Tick: ${time}`, 10, 20);
      ctx.fillText(`S: ${model.people.filter(i => i.status === 0).length}`, 10, 35);
      ctx.fillText(`I: ${model.people.filter(i => i.status > 0).length}`, 10, 50);
      ctx.fillText(`R: ${model.people.filter(i => i.status === -1).length}`, 10, 65);            
      
      const last = model.people
      // .filter(
      //     p => p.infectTime >= 0 
      //         && p.infectTime > time - 50
      //         && p.status === -1,
      // );
      const trans = last.reduce((p, i) => i.infectedOthers + p, 0);
      const transFullySus = last.reduce((p, i) => i.infectedOthersFullySus + p, 0);

      ctx.fillText(`Effective Reproduction Number: ${Math.round((trans / last.length || 0) * 100) / 100}`, 10, 80);            
      ctx.fillText(`Basic Reproduction Number:     ${Math.round((transFullySus / last.length || 0) * 100) / 100}`, 10, 95);            
    }, 1000/60);
  }
