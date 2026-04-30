/**
 * AdminUploader — reusable image upload widget for all admin pages.
 * Usage: AdminUploader.open({ supabaseUrl, supabaseKey, getToken, onSave })
 */
window.AdminUploader = (() => {

  let _cfg = null;

  // ── Inject modal HTML once ─────────────────────────────────────────────
  function ensureModal() {
    if (document.getElementById('au-modal')) return;
    const el = document.createElement('div');
    el.innerHTML = `
      <style>
        #au-modal {
          display: none; position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.65);
          align-items: center; justify-content: center; padding: 20px;
        }
        #au-modal.open { display: flex; }
        #au-box {
          background: white; border-radius: 14px; padding: 32px;
          max-width: 500px; width: 100%;
          box-shadow: 0 24px 64px rgba(0,0,0,0.35);
          animation: aupop 0.16s ease;
        }
        @keyframes aupop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        #au-box h2 { margin: 0 0 20px; font-size: 18px; font-family: inherit; }
        #au-close { float: right; background: none; border: none; font-size: 22px; cursor: pointer; color: #aaa; line-height: 1; margin-top: -4px; }
        #au-close:hover { color: #333; }

        /* Current image preview */
        #au-current { margin-bottom: 20px; text-align: center; display: none; }
        #au-current img { max-height: 120px; max-width: 100%; border-radius: 8px; border: 1px solid #eee; }
        #au-current p { margin: 6px 0 0; font-size: 12px; color: #999; }

        /* Drop zone */
        #au-drop {
          border: 2.5px dashed #c8d8ff; border-radius: 12px;
          padding: 32px 20px; text-align: center; cursor: pointer;
          transition: all 0.15s; background: #f7f9ff; position: relative;
          margin-bottom: 20px;
        }
        #au-drop.drag-over { border-color: #3366ff; background: #eef2ff; }
        #au-drop.uploading { pointer-events: none; opacity: 0.7; }
        #au-drop-icon { font-size: 40px; margin-bottom: 10px; line-height: 1; }
        #au-drop-title { font-size: 15px; font-weight: 600; color: #333; margin: 0 0 4px; }
        #au-drop-sub { font-size: 13px; color: #999; margin: 0 0 14px; }
        #au-browse {
          display: inline-block; padding: 8px 22px;
          background: var(--primary, #3366ff); color: white;
          border: none; border-radius: 7px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: inherit;
        }
        #au-browse:hover { opacity: 0.9; }
        #au-file-input { display: none; }

        /* Progress */
        #au-progress { display: none; margin: -10px 0 16px; }
        #au-progress-bar-wrap {
          height: 6px; background: #eee; border-radius: 3px; overflow: hidden;
        }
        #au-progress-bar {
          height: 100%; background: var(--primary, #3366ff);
          border-radius: 3px; transition: width 0.1s; width: 0;
        }
        #au-progress-label { font-size: 12px; color: #666; margin-top: 5px; text-align: center; }

        /* URL fallback */
        #au-url-wrap { margin-bottom: 16px; }
        #au-url-wrap label { display: block; font-size: 12px; font-weight: 600; color: #999; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px; }
        #au-url-input {
          width: 100%; padding: 9px 12px; border: 1px solid #ddd; border-radius: 7px;
          box-sizing: border-box; font-size: 13px; font-family: inherit;
        }
        #au-url-input:focus { border-color: var(--primary, #3366ff); outline: none; }

        /* Message */
        #au-msg { padding: 9px 13px; border-radius: 6px; font-size: 13px; display: none; margin-bottom: 14px; }

        /* Actions */
        #au-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        #au-cancel { padding: 12px; background: #f0f0f0; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; font-family: inherit; }
        #au-save { padding: 12px; background: var(--primary, #3366ff); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; font-family: inherit; }
        #au-delete { display: none; width: 100%; margin-top: 10px; padding: 10px; background: #fff0f0; border: 1px solid #fca5a5; border-radius: 8px; color: #dc2626; font-weight: 600; cursor: pointer; font-size: 13px; font-family: inherit; }
        #au-delete:hover { background: #fee2e2; }
      </style>

      <div id="au-modal">
        <div id="au-box">
          <button id="au-close">✕</button>
          <h2 id="au-title">Fotografie</h2>

          <div id="au-current">
            <img id="au-current-img" src="" alt="Fotografie curentă" />
            <p>Fotografie curentă</p>
          </div>

          <div id="au-drop">
            <input type="file" id="au-file-input" accept="image/jpeg,image/png,image/webp,image/gif" />
            <div id="au-drop-icon">🖼️</div>
            <p id="au-drop-title">Trage fotografia aici</p>
            <p id="au-drop-sub">JPG, PNG, WEBP sau GIF · max 10 MB</p>
            <button id="au-browse" type="button">Alege din folder</button>
          </div>

          <div id="au-progress">
            <div id="au-progress-bar-wrap"><div id="au-progress-bar"></div></div>
            <p id="au-progress-label">Se încarcă... 0%</p>
          </div>

          <div id="au-url-wrap">
            <label>sau introdu URL direct</label>
            <input type="text" id="au-url-input" placeholder="https://..." />
          </div>

          <div id="au-msg"></div>

          <div id="au-actions">
            <button id="au-cancel" type="button">Anulează</button>
            <button id="au-save" type="button">Salvează ✓</button>
          </div>
          <button id="au-delete" type="button">🗑️ Șterge fotografia</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    bindEvents();
  }

  function bindEvents() {
    const modal = document.getElementById('au-modal');
    const drop = document.getElementById('au-drop');
    const fileInput = document.getElementById('au-file-input');

    document.getElementById('au-close').onclick = close;
    document.getElementById('au-cancel').onclick = close;
    document.getElementById('au-save').onclick = saveUrl;
    document.getElementById('au-delete').onclick = deleteImage;
    modal.onclick = (e) => { if (e.target === modal) close(); };

    document.getElementById('au-browse').onclick = () => fileInput.click();
    fileInput.onchange = (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); };

    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drag-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) handleFile(file);
      else showMsg('Selectează o imagine (JPG, PNG, WEBP, GIF)', 'err');
    });
  }

  async function handleFile(file) {
    if (file.size > 10 * 1024 * 1024) { showMsg('Imaginea este prea mare (max 10 MB)', 'err'); return; }

    const drop = document.getElementById('au-drop');
    drop.classList.add('uploading');
    setProgress(true, 0);
    showMsg('', '');

    try {
      const url = await uploadToSupabase(file, (pct) => setProgress(true, pct));
      setProgress(false);
      document.getElementById('au-url-input').value = url;

      // Show preview
      setCurrentImage(url);
      showMsg('✓ Fotografie încărcată cu succes!', 'ok');
    } catch (e) {
      setProgress(false);
      showMsg('Eroare la încărcare: ' + e.message, 'err');
    } finally {
      drop.classList.remove('uploading');
    }
  }

  function uploadToSupabase(file, onProgress) {
    return new Promise((resolve, reject) => {
      const token = _cfg.getToken();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `images/${Date.now()}-${safeName}`;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${_cfg.supabaseUrl}/storage/v1/object/media/${path}`);
      xhr.setRequestHeader('apikey', _cfg.supabaseKey);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg');
      xhr.setRequestHeader('x-upsert', 'false');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          resolve(`${_cfg.supabaseUrl}/storage/v1/object/public/media/${path}`);
        } else {
          try { reject(new Error(JSON.parse(xhr.responseText).error || `HTTP ${xhr.status}`)); }
          catch { reject(new Error(`HTTP ${xhr.status}`)); }
        }
      };
      xhr.onerror = () => reject(new Error('Eroare de rețea'));
      xhr.send(file);
    });
  }

  function normalizeUrl(url) {
    if (!url) return url;
    // Google Drive: https://drive.google.com/file/d/FILE_ID/view → direct image
    const m1 = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
    if (m1) return `https://drive.google.com/uc?export=view&id=${m1[1]}`;
    // Google Drive open?id= form
    const m2 = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (m2) return `https://drive.google.com/uc?export=view&id=${m2[1]}`;
    return url;
  }

  async function saveUrl() {
    const raw = document.getElementById('au-url-input').value.trim();
    if (!raw) { showMsg('Adaugă o fotografie sau un URL', 'err'); return; }
    const url = normalizeUrl(raw);
    if (url !== raw) {
      document.getElementById('au-url-input').value = url;
      setCurrentImage(url);
    }
    showMsg('Se salvează...', 'info');
    try {
      if (_cfg.onSave) await _cfg.onSave(url);
      showMsg('✓ Salvat!', 'ok');
      setTimeout(close, 700);
    } catch(e) {
      showMsg('Eroare: ' + e.message, 'err');
    }
  }

  async function deleteImage() {
    if (!confirm('Ștergi fotografia? Acțiunea nu poate fi anulată.')) return;
    showMsg('Se șterge...', 'info');
    try {
      if (_cfg.onSave) await _cfg.onSave('');
      showMsg('✓ Fotografie ștearsă!', 'ok');
      setTimeout(close, 700);
    } catch(e) {
      showMsg('Eroare: ' + e.message, 'err');
    }
  }

  function setCurrentImage(url) {
    const wrap = document.getElementById('au-current');
    const img = document.getElementById('au-current-img');
    const del = document.getElementById('au-delete');
    if (url) { img.src = url; wrap.style.display = 'block'; del.style.display = 'block'; }
    else { wrap.style.display = 'none'; del.style.display = 'none'; }
  }

  function setProgress(show, pct) {
    const el = document.getElementById('au-progress');
    el.style.display = show ? 'block' : 'none';
    if (show) {
      document.getElementById('au-progress-bar').style.width = pct + '%';
      document.getElementById('au-progress-label').textContent = `Se încarcă... ${pct}%`;
    }
  }

  function showMsg(text, type) {
    const el = document.getElementById('au-msg');
    if (!text) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.style.background = type === 'ok' ? '#edfaed' : type === 'err' ? '#fdecea' : '#eef0ff';
    el.style.color = type === 'ok' ? '#276227' : type === 'err' ? '#b33' : '#335';
    el.textContent = text;
  }

  function close() {
    document.getElementById('au-modal').classList.remove('open');
    _cfg = null;
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return {
    /**
     * Open the upload modal.
     * @param {object} cfg
     *   supabaseUrl  - Supabase project URL
     *   supabaseKey  - anon key
     *   getToken     - function() → access_token string
     *   currentUrl   - existing image URL (shown as preview)
     *   title        - modal title (default: "Fotografie")
     *   onSave       - async function(url) called with the final URL
     */
    open(cfg) {
      ensureModal();
      _cfg = cfg;

      document.getElementById('au-title').textContent = cfg.title || 'Fotografie';
      document.getElementById('au-url-input').value = cfg.currentUrl || '';
      document.getElementById('au-file-input').value = '';
      document.getElementById('au-progress').style.display = 'none';
      showMsg('', '');
      setCurrentImage(cfg.currentUrl || '');
      document.getElementById('au-modal').classList.add('open');
    },
  };
})();
