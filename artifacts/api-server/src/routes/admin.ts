import { Router, type Request, type Response } from "express";

const router = Router();

const adminHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>90s Music Stream - Admin Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0d14;
      --card-bg: rgba(22, 27, 46, 0.7);
      --card-border: rgba(255, 255, 255, 0.1);
      --accent-cyan: #00f3ff;
      --accent-gold: #ffb703;
      --accent-rose: #ff2a6d;
      --accent-purple: #9d4edd;
      --text: #f0f4f8;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background: var(--bg);
      background-image: 
        radial-gradient(at 0% 0%, rgba(157, 78, 221, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(0, 243, 255, 0.1) 0px, transparent 50%);
      color: var(--text);
      min-height: 100vh;
      padding-bottom: 3rem;
    }
    .glass {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: 16px;
    }
    header {
      padding: 1.25rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 2rem;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 800;
      font-size: 1.4rem;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #00f3ff, #ffb703);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      background: rgba(0, 243, 255, 0.1);
      color: var(--accent-cyan);
      border: 1px solid rgba(0, 243, 255, 0.3);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    /* Auth Form */
    .auth-container {
      max-width: 420px;
      margin: 5rem auto;
      padding: 2.5rem;
      text-align: center;
    }
    .auth-title { font-size: 1.8rem; margin-bottom: 0.5rem; font-weight: 700; }
    .auth-sub { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 2rem; }
    .form-group {
      margin-bottom: 1.25rem;
      text-align: left;
    }
    label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
    input[type="text"], input[type="email"], input[type="password"], input[type="number"], select {
      width: 100%;
      padding: 12px 16px;
      background: rgba(10, 14, 26, 0.8);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      color: #fff;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s;
    }
    input:focus { border-color: var(--accent-cyan); box-shadow: 0 0 10px rgba(0,243,255,0.2); }
    .btn {
      width: 100%;
      padding: 12px 20px;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--accent-cyan), #00a8ff);
      color: #0b0d14;
      font-weight: 700;
    }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-gold {
      background: linear-gradient(135deg, var(--accent-gold), #ff8800);
      color: #0b0d14;
      font-weight: 700;
    }
    .btn-danger {
      background: rgba(255, 42, 109, 0.15);
      color: var(--accent-rose);
      border: 1px solid rgba(255, 42, 109, 0.3);
    }
    .btn-danger:hover { background: rgba(255, 42, 109, 0.3); }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
    /* Dashboard Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(0, 243, 255, 0.1);
      color: var(--accent-cyan);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .stat-val { font-size: 2rem; font-weight: 800; line-height: 1; }
    .stat-lbl { color: var(--text-muted); font-size: 0.85rem; margin-top: 4px; }
    /* Controls Bar */
    .controls-bar {
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1;
      min-width: 250px;
      position: relative;
    }
    /* Songs Table */
    .table-responsive { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 14px 18px; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--card-border); }
    td { padding: 14px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 0.95rem; vertical-align: middle; }
    tr:hover { background: rgba(255, 255, 255, 0.02); }
    .song-cover { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; background: #1a1e2e; }
    .audio-player { height: 32px; max-width: 200px; }
    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1.5rem;
    }
    .modal-overlay.active { display: flex; }
    .modal-card {
      width: 100%;
      max-width: 560px;
      padding: 2rem;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .modal-title { font-size: 1.3rem; font-weight: 700; }
    .close-btn { background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer; }
    .file-drop {
      border: 2px dashed var(--card-border);
      border-radius: 10px;
      padding: 1.25rem;
      text-align: center;
      background: rgba(0,0,0,0.2);
      cursor: pointer;
      margin-bottom: 1rem;
    }
    .file-drop:hover { border-color: var(--accent-cyan); }
    .alert {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.9rem;
      margin-bottom: 1.25rem;
      display: none;
    }
    .alert-error { background: rgba(255, 42, 109, 0.15); border: 1px solid var(--accent-rose); color: var(--accent-rose); }
    .alert-success { background: rgba(0, 243, 255, 0.15); border: 1px solid var(--accent-cyan); color: var(--accent-cyan); }
    .spinner {
      border: 3px solid rgba(255,255,255,0.1);
      border-top: 3px solid #00f3ff;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>

  <header class="glass">
    <div class="logo">
      <span>🎵 90s MUSIC STREAM</span>
      <span class="badge">ADMIN</span>
    </div>
    <div id="user-nav" style="display: none; align-items: center; gap: 1rem;">
      <span id="admin-email-display" style="font-size: 0.9rem; color: var(--text-muted);"></span>
      <button class="btn btn-danger" style="width: auto; padding: 8px 16px;" onclick="handleLogout()">Logout</button>
    </div>
  </header>

  <div class="container">

    <!-- Auth View -->
    <div id="view-login" class="glass auth-container">
      <h2 class="auth-title">Admin Sign In</h2>
      <p class="auth-sub">Enter credentials to access catalog management</p>
      
      <div id="login-alert" class="alert alert-error"></div>

      <form id="login-form" onsubmit="handleLogin(event)">
        <div class="form-group">
          <label>Admin Email</label>
          <input type="email" id="login-email" required placeholder="admin@example.com" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="login-password" required placeholder="••••••••" />
        </div>
        <button type="submit" id="login-btn" class="btn btn-primary">Sign In</button>
      </form>
    </div>

    <!-- Dashboard View -->
    <div id="view-dashboard" style="display: none;">

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="glass stat-card">
          <div class="stat-icon">🎶</div>
          <div>
            <div class="stat-val" id="stat-count">0</div>
            <div class="stat-lbl">Songs in MongoDB</div>
          </div>
        </div>
        <div class="glass stat-card">
          <div class="stat-icon" style="color: var(--accent-gold); background: rgba(255, 183, 3, 0.1);">☁️</div>
          <div>
            <div class="stat-val" style="color: var(--accent-gold);">Cloudinary</div>
            <div class="stat-lbl">Media Storage Active</div>
          </div>
        </div>
        <div class="glass stat-card">
          <div class="stat-icon" style="color: var(--accent-purple); background: rgba(157, 78, 221, 0.1);">⚡</div>
          <div>
            <div class="stat-val" style="color: var(--accent-purple);">MongoDB</div>
            <div class="stat-lbl">Connected via Mongoose</div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="glass controls-bar">
        <div class="search-box">
          <input type="text" id="search-input" placeholder="Search by title, artist, album, genre..." oninput="renderTable()" />
        </div>
        <button class="btn btn-gold" style="width: auto;" onclick="openUploadModal()">
          <span>+ Upload New Song</span>
        </button>
      </div>

      <!-- Songs Table -->
      <div class="glass table-responsive">
        <table>
          <thead>
            <tr>
              <th>Cover</th>
              <th>Title</th>
              <th>Artist</th>
              <th>Album</th>
              <th>Year</th>
              <th>Genre</th>
              <th>Audio Preview</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="songs-tbody">
            <!-- Rendered dynamically -->
          </tbody>
        </table>
      </div>

    </div>
  </div>

  <!-- Upload Modal -->
  <div id="upload-modal" class="modal-overlay">
    <div class="glass modal-card">
      <div class="modal-header">
        <h3 class="modal-title">Upload New 90s Track</h3>
        <button class="close-btn" onclick="closeUploadModal()">&times;</button>
      </div>

      <div id="upload-alert" class="alert"></div>

      <form id="upload-form" onsubmit="handleUploadSong(event)">
        <div class="form-group">
          <label>Song Title *</label>
          <input type="text" id="up-title" required placeholder="e.g. Wonderwall" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label>Artist *</label>
            <input type="text" id="up-artist" required placeholder="e.g. Oasis" />
          </div>
          <div class="form-group">
            <label>Album *</label>
            <input type="text" id="up-album" required placeholder="e.g. (What's the Story) Morning Glory?" />
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label>Release Year *</label>
            <input type="number" id="up-year" required value="1995" min="1900" max="2010" />
          </div>
          <div class="form-group">
            <label>Genre *</label>
            <input type="text" id="up-genre" required placeholder="e.g. Britpop / Alternative" />
          </div>
        </div>
        
        <div class="form-group">
          <label>Cover Image File (JPG, PNG, WebP) *</label>
          <input type="file" id="up-cover" accept="image/*" required />
        </div>

        <div class="form-group">
          <label>Audio File (MP3, WAV, M4A) *</label>
          <input type="file" id="up-audio" accept="audio/*" required />
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-secondary" onclick="closeUploadModal()">Cancel</button>
          <button type="submit" id="upload-submit-btn" class="btn btn-primary">
            <span>Upload & Save</span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let allSongs = [];

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated) {
          document.getElementById('view-login').style.display = 'none';
          document.getElementById('view-dashboard').style.display = 'block';
          document.getElementById('user-nav').style.display = 'flex';
          document.getElementById('admin-email-display').innerText = data.user.email;
          fetchSongs();
        } else {
          document.getElementById('view-login').style.display = 'block';
          document.getElementById('view-dashboard').style.display = 'none';
          document.getElementById('user-nav').style.display = 'none';
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const btn = document.getElementById('login-btn');
      const alert = document.getElementById('login-alert');

      alert.style.display = 'none';
      btn.innerHTML = '<span class="spinner"></span> Signing in...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          checkAuth();
        } else {
          alert.innerText = data.message || 'Login failed';
          alert.style.display = 'block';
        }
      } catch (err) {
        alert.innerText = 'Network error during login';
        alert.style.display = 'block';
      } finally {
        btn.innerHTML = 'Sign In';
        btn.disabled = false;
      }
    }

    async function handleLogout() {
      await fetch('/api/auth/logout', { method: 'POST' });
      checkAuth();
    }

    async function fetchSongs() {
      try {
        const res = await fetch('/api/songs');
        if (res.ok) {
          allSongs = await res.json();
          document.getElementById('stat-count').innerText = allSongs.length;
          renderTable();
        }
      } catch (err) {
        console.error('Error fetching songs:', err);
      }
    }

    function renderTable() {
      const q = document.getElementById('search-input').value.toLowerCase();
      const tbody = document.getElementById('songs-tbody');

      const filtered = allSongs.filter(s => 
        (s.title || '').toLowerCase().includes(q) ||
        (s.artist || '').toLowerCase().includes(q) ||
        (s.album || '').toLowerCase().includes(q) ||
        (s.genre || '').toLowerCase().includes(q)
      );

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">No songs found</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(s => {
        const songId = s.id || s._id;
        return \`
          <tr>
            <td><img src="\${s.coverImage}" class="song-cover" alt="Cover" /></td>
            <td style="font-weight: 600;">\${escapeHtml(s.title)}</td>
            <td>\${escapeHtml(s.artist)}</td>
            <td>\${escapeHtml(s.album)}</td>
            <td>\${s.year}</td>
            <td><span class="badge" style="font-size:0.65rem">\${escapeHtml(s.genre)}</span></td>
            <td><audio controls src="\${s.audioUrl}" class="audio-player"></audio></td>
            <td>
              <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.8rem;" onclick="deleteSong('\${songId}')">Delete</button>
            </td>
          </tr>
        \`;
      }).join('');
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
      });
    }

    function openUploadModal() {
      document.getElementById('upload-modal').classList.add('active');
    }
    function closeUploadModal() {
      document.getElementById('upload-modal').classList.remove('active');
      document.getElementById('upload-form').reset();
      document.getElementById('upload-alert').style.display = 'none';
    }

    async function handleUploadSong(e) {
      e.preventDefault();
      const alert = document.getElementById('upload-alert');
      const btn = document.getElementById('upload-submit-btn');

      alert.style.display = 'none';
      btn.innerHTML = '<span class="spinner"></span> Uploading to Cloudinary & MongoDB...';
      btn.disabled = true;

      const formData = new FormData();
      formData.append('title', document.getElementById('up-title').value);
      formData.append('artist', document.getElementById('up-artist').value);
      formData.append('album', document.getElementById('up-album').value);
      formData.append('year', document.getElementById('up-year').value);
      formData.append('genre', document.getElementById('up-genre').value);

      const coverFile = document.getElementById('up-cover').files[0];
      const audioFile = document.getElementById('up-audio').files[0];

      formData.append('cover', coverFile);
      formData.append('audio', audioFile);

      try {
        const res = await fetch('/api/songs', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (res.ok) {
          closeUploadModal();
          fetchSongs();
        } else {
          alert.className = 'alert alert-error';
          alert.innerText = data.message || 'Upload failed';
          alert.style.display = 'block';
        }
      } catch (err) {
        alert.className = 'alert alert-error';
        alert.innerText = 'Network error during file upload';
        alert.style.display = 'block';
      } finally {
        btn.innerHTML = 'Upload & Save';
        btn.disabled = false;
      }
    }

    async function deleteSong(id) {
      if (!confirm('Are you sure you want to delete this song from MongoDB?')) return;

      try {
        const res = await fetch(\`/api/songs/\${id}\`, { method: 'DELETE' });
        if (res.ok) {
          fetchSongs();
        } else {
          alert('Failed to delete song');
        }
      } catch (err) {
        alert('Network error while deleting song');
      }
    }

    // Initial check
    checkAuth();
  </script>
</body>
</html>`;

router.get("/", (_req: Request, res: Response) => {
  res.send(adminHtml);
});

router.get("/login", (_req: Request, res: Response) => {
  res.send(adminHtml);
});

export default router;
