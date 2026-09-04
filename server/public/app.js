(function () {
  'use strict';

  const TOKEN_STORAGE_KEY = 'photobeam_token';

  const banner = document.getElementById('status-banner');
  const queueEl = document.getElementById('queue');
  const sendBtn = document.getElementById('send-btn');
  const progressWrap = document.getElementById('progress-wrap');
  const progressBar = document.getElementById('progress-bar');
  const cameraInput = document.getElementById('camera-input');
  const videoInput = document.getElementById('video-input');
  const galleryInput = document.getElementById('gallery-input');
  const connDot = document.getElementById('conn-dot');
  const connText = document.getElementById('conn-text');

  function pluralPL(n, one, few, many) {
    if (n === 1) return one;
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
    return many;
  }

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
      const isVideo = item.file.type.startsWith('video/');
      const div = document.createElement('div');
      div.className = 'thumb';

      if (isVideo) {
        const video = document.createElement('video');
        video.src = item.url;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        div.appendChild(video);
        const videoBadge = document.createElement('div');
        videoBadge.className = 'video-badge';
        videoBadge.textContent = '▶ film';
        div.appendChild(videoBadge);
      } else {
        const img = document.createElement('img');
        img.src = item.url;
        div.appendChild(img);
      }

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
      ? `Wyslij ${queue.length} ${pluralPL(queue.length, 'plik', 'pliki', 'plikow')}`
      : 'Wyslij';
  }

  function addFiles(fileList) {
    hideBanner();
    Array.from(fileList || []).forEach((file) => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
      queue.push({ file, url: URL.createObjectURL(file) });
    });
    renderQueue();
  }

  document.getElementById('pick-camera-btn').addEventListener('click', () => cameraInput.click());
  document.getElementById('pick-video-btn').addEventListener('click', () => videoInput.click());
  document.getElementById('pick-gallery-btn').addEventListener('click', () => galleryInput.click());

  cameraInput.addEventListener('change', (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  });
  videoInput.addEventListener('change', (e) => {
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
    queue.forEach((item) => formData.append('media', item.file, item.file.name));

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
        showBanner(
          `Wyslano ${body.count} ${pluralPL(body.count, 'plik', 'pliki', 'plikow')} na komputer ✅`,
          'ok'
        );
        queue.forEach((item) => URL.revokeObjectURL(item.url));
        queue = [];
        renderQueue();
      } else {
        showBanner(body.error || 'Nie udalo sie wyslac plikow. Sprobuj ponownie.', 'err');
      }
    });

    xhr.addEventListener('error', () => {
      uploading = false;
      sendBtn.disabled = false;
      progressWrap.classList.remove('show');
      showBanner('Blad polaczenia z komputerem. Sprawdz, czy telefon jest w tej samej sieci WiFi.', 'err');
      setConnected(false);
    });

    xhr.send(formData);
  }

  sendBtn.addEventListener('click', upload);

  // --- Wskaznik polaczenia z komputerem ---
  let serverHostname = null;

  function setConnected(connected) {
    connDot.classList.toggle('online', connected);
    connDot.classList.toggle('offline', !connected);
    connText.textContent = connected
      ? serverHostname
        ? `Polaczono (${serverHostname})`
        : 'Polaczono z komputerem'
      : 'Brak polaczenia z komputerem';
  }

  async function pingServer() {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch('/api/ping', { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(timer);
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      if (data.hostname) serverHostname = data.hostname;
      setConnected(true);
    } catch (e) {
      setConnected(false);
    }
  }

  pingServer();
  setInterval(pingServer, 5000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') pingServer();
  });
  window.addEventListener('online', pingServer);
  window.addEventListener('offline', () => setConnected(false));

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* offline shell is a nice-to-have, ignore failures */
      });
    });
  }
})();
