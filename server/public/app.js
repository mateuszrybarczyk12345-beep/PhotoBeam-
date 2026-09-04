(function () {
  'use strict';

  const TOKEN_STORAGE_KEY = 'lazania_token';

  const banner = document.getElementById('status-banner');
  const queueEl = document.getElementById('queue');
  const sendBtn = document.getElementById('send-btn');
  const progressWrap = document.getElementById('progress-wrap');
  const progressBar = document.getElementById('progress-bar');
  const cameraInput = document.getElementById('camera-input');
  const galleryInput = document.getElementById('gallery-input');

  /** @type {{file: File, url: string}[]} */
  let queue = [];
  let uploading = false;

  function showBanner(message, kind) {
    banner.textContent = message;
    banner.className = 'show ' + (kind || '');
  }

  function hideBanner() {
    banner.className = '';
  }

  function getToken() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('token');
    if (fromUrl) {
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, fromUrl);
      } catch (e) {
        /* ignore storage errors (private mode etc.) */
      }
      return fromUrl;
    }
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  const token = getToken();
  if (!token) {
    showBanner(
      'Brak kodu dostepu. Zeskanuj kod QR wyswietlony w terminalu na komputerze, zeby otworzyc te aplikacje.',
      'err'
    );
    sendBtn.disabled = true;
  }

  function renderQueue() {
    queueEl.innerHTML = '';
    queue.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'thumb';
      const img = document.createElement('img');
      img.src = item.url;
      div.appendChild(img);
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = '✕';
      badge.addEventListener('click', () => {
        URL.revokeObjectURL(item.url);
        queue.splice(i, 1);
        renderQueue();
      });
      div.appendChild(badge);
      queueEl.appendChild(div);
    });
    sendBtn.classList.toggle('show', queue.length > 0);
    sendBtn.textContent = queue.length
      ? `Wyslij ${queue.length} ${queue.length === 1 ? 'zdjecie' : 'zdjec'}`
      : 'Wyslij zdjecia';
  }

  function addFiles(fileList) {
    hideBanner();
    Array.from(fileList || []).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      queue.push({ file, url: URL.createObjectURL(file) });
    });
    renderQueue();
  }

  document.getElementById('pick-camera-btn').addEventListener('click', () => cameraInput.click());
  document.getElementById('pick-gallery-btn').addEventListener('click', () => galleryInput.click());

  cameraInput.addEventListener('change', (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  });
  galleryInput.addEventListener('change', (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  });

  function upload() {
    if (uploading || queue.length === 0 || !token) return;
    uploading = true;
    sendBtn.disabled = true;
    hideBanner();
    progressWrap.classList.add('show');
    progressBar.style.width = '0%';

    const formData = new FormData();
    queue.forEach((item) => formData.append('photos', item.file, item.file.name));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/upload?token=${encodeURIComponent(token)}`);

    xhr.upload.addEventListener('progress', (evt) => {
      if (evt.lengthComputable) {
        const pct = Math.round((evt.loaded / evt.total) * 100);
        progressBar.style.width = pct + '%';
      }
    });

    xhr.addEventListener('load', () => {
      uploading = false;
      sendBtn.disabled = false;
      progressWrap.classList.remove('show');

      let body = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch (e) {
        /* ignore */
      }

      if (xhr.status >= 200 && xhr.status < 300 && body.ok) {
        showBanner(`Wyslano ${body.count} ${body.count === 1 ? 'zdjecie' : 'zdjec'} na komputer ✅`, 'ok');
        queue.forEach((item) => URL.revokeObjectURL(item.url));
        queue = [];
        renderQueue();
      } else {
        showBanner(body.error || 'Nie udalo sie wyslac zdjec. Sprobuj ponownie.', 'err');
      }
    });

    xhr.addEventListener('error', () => {
      uploading = false;
      sendBtn.disabled = false;
      progressWrap.classList.remove('show');
      showBanner('Blad polaczenia z komputerem. Sprawdz, czy telefon jest w tej samej sieci WiFi.', 'err');
    });

    xhr.send(formData);
  }

  sendBtn.addEventListener('click', upload);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* offline shell is a nice-to-have, ignore failures */
      });
    });
  }
})();
