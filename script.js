//Elaborado por Justin Yak
const video = document.querySelector('.input_video');
const canvas = document.querySelector('.output_canvas');
const ctx = canvas.getContext('2d');
const toggleDraw = document.getElementById('toggleDraw');

canvas.width = 1280;
canvas.height = 720;

const hands = new Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
   minTrackingConfidence: 0.5
 });

 /* ---------------------- FUNCIÓN: detectar like ----------------------
    El dedo pulgar debe estar extendido y los demás cerrados.
 --------------------------------------------------------------------- */
 function isLike(landmarks){
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const wrist = landmarks[0];

    // Distancia del pulgar
    const dThumb = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y);
    // Distancias de los otros dedos
    const dOthers = [indexTip, middleTip, ringTip, pinkyTip].map(p => Math.hypot(p.x - wrist.x, p.y - wrist.y));

    const thumbExtended = dThumb > 0.13;
    const othersFolded = dOthers.every(d => d < 0.1);

    return thumbExtended && othersFolded;
    }

/* ---------------------- Mostrar emoji like ------------------------ */
function spawnLikeEmoji(x, y){
    const div = document.createElement('div');
    div.textContent = '👍';
    div.style.position = 'fixed';
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    div.style.fontSize = '60px';
    div.style.opacity = '0';
    div.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    div.style.transform = 'scale(0.5)';
    document.body.appendChild(div);

    // Animación aparecer
    setTimeout(() => {
        div.style.opacity = '1';
        div.style.transform = 'scale(1)';
    }, 20);

    // Desaparecer después de 3s
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'scale(0.5)';
        setTimeout(() => div.remove(), 600);
    }, 3000);
    }

    let lastLikeTime = 0;

    /* ---------------------- MANEJO DE RESULTADOS ---------------------- */
    hands.onResults(results => {
        ctx.save();
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if(results.multiHandLandmarks){
        for(const lm of results.multiHandLandmarks){

          // Si está activado dibujar las manos
          if(toggleDraw.checked){
            drawConnectors(ctx, lm, HAND_CONNECTIONS, { lineWidth:4 });
            drawLandmarks(ctx, lm, { lineWidth:2, radius:4 });
          }

          // Detectar gesto "like"
          if(isLike(lm)){
            const now = performance.now();
            if(now - lastLikeTime > 2000){
              lastLikeTime = now;

              // Convertir coordenadas normalizadas del pulgar a píxeles
              const px = lm[4].x * canvas.width;
              const py = lm[4].y * canvas.height;

              // Convertir a coordenadas de pantalla
              const rect = canvas.getBoundingClientRect();
              spawnLikeEmoji(rect.left + px, rect.top + py);
            }
          }
        }
      }

      ctx.restore();
    });

    /* ---------------------- Cámara ---------------------- */
    const camera = new Camera(video, {
      onFrame: async () => { await hands.send({image: video}); },
      width: 1280,
      height: 720
    });
    camera.start();

    /* ---------------------- Ajuste automático del canvas ---------------------- */
    function fitCanvas(){
      const rect = document.querySelector('.wrap').getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    window.addEventListener('resize', fitCanvas);
    fitCanvas();