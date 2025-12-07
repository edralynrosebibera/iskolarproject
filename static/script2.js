//import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://ionsrqiqludrojmpbhfa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbnNycWlxbHVkcm9qbXBiaGZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgxMjE2NiwiZXhwIjoyMDc0Mzg4MTY2fQ.7aePHEM6jZbTf1Iivrv2n4KxX9LmHSdCu9SDjuAJHEg";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ------------------------------
// countdown timer
// ------------------------------
function startDeadlineTimer(elementId, endDate) {
  const deadlineEl = document.getElementById(elementId);
  if (!deadlineEl) return;

  const targetDate = new Date(endDate).getTime();

  function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      deadlineEl.innerHTML = `<i class="fa-regular fa-calendar-check"></i> Deadline Passed`;
      clearInterval(interval);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    deadlineEl.innerHTML = `<i class="fa-regular fa-calendar-check"></i> Due in ${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  updateTimer();
  const interval = setInterval(updateTimer, 1000);
}

document.addEventListener('DOMContentLoaded', function () {
  const menuToggleBtn = document.getElementById('menuToggleBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const profileToggle = document.getElementById('profileToggle');
  const profileDropdown = document.getElementById('profileDropdown');

  // --- Apply stored avatar (if any) to header avatars on page load ---
  function applyStoredAvatarToHeaders() {
    try {
      const saved = localStorage.getItem('userProfile');
      if (!saved) return;
      const data = JSON.parse(saved);
      const avatarBg = data.avatar || '';
      // avatarBg expected like: url("data:...") or url(data:...)
      const m = avatarBg.match(/url\((?:\"|')?(.*?)(?:\"|')?\)/i);
      const src = m ? m[1] : null;
      if (!src) return;

      // update all avatars in header/profile areas
      const headerAvatars = Array.from(document.querySelectorAll('.header .avatar, .profile-btn .avatar, .profile-dropdown .avatar'));
      headerAvatars.forEach(el => {
        if (!el) return;
        if (el.tagName && el.tagName.toLowerCase() === 'img') {
          el.src = src;
        } else {
          el.style.backgroundImage = `url(${src})`;
          el.innerHTML = '';
        }
      });
    } catch (err) {
      console.debug('applyStoredAvatarToHeaders error', err);
    }
  }

  // run on load
  applyStoredAvatarToHeaders();

  const scholarshipsContainer =
    document.querySelector('.saved-scholarships-grid') ||
    document.querySelector('.scholarships-grid');

  const searchInput = document.querySelector('.search-input');

  // ------------------------------
  // sidebar toggle
  // ------------------------------
  function openSidebar() {
    sidebar?.classList.add('active');
    sidebarOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar?.classList.remove('active');
    sidebarOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  menuToggleBtn?.addEventListener('click', openSidebar);
  closeSidebarBtn?.addEventListener('click', closeSidebar);
  sidebarOverlay?.addEventListener('click', closeSidebar);

  // ------------------------------
  // profile dropdown
  // ------------------------------
  profileToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!profileDropdown) return;
    try {
      const r = profileToggle.getBoundingClientRect();
      const midX = r.left + r.width / 2;
      const midY = r.top + r.height / 2;
      const elAt = document.elementFromPoint(midX, midY);
      console.debug('[debug] profileToggle click — top element at center:', elAt);
    } catch (err) {
      console.debug('[debug] profileToggle elementFromPoint error', err);
    }
    profileDropdown.style.display =
      profileDropdown.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('click', () => {
    if (profileDropdown) profileDropdown.style.display = 'none';
  });

  // Debug helper: when clicking near the top area, log which element is top-most at the pointer
  document.addEventListener('click', (e) => {
    try {
      if (e.clientY <= 120) { // header area
        const el = document.elementFromPoint(e.clientX, e.clientY);
        console.info('[debug] click at top area - elementFromPoint:', el);
        if (el) {
          console.info('[debug] element classes/id:', el.id, el.className);
        }
      }
    } catch (err) {
      console.debug('[debug] elementFromPoint error', err);
    }
  }, true);

  // Capture-phase handler: if any stacked element at the click point is the profile toggle
  // (or contains it), toggle the dropdown. This bypasses overlays that are above the header.
  document.addEventListener('click', function(e) {
    try {
      if (!profileToggle || !profileDropdown) return;
      // only consider clicks near the header area to avoid interfering with other clicks
      if (e.clientY > 140) return;
      const stacked = document.elementsFromPoint(e.clientX, e.clientY) || [];
      const found = stacked.find(el => el && (el.id === 'profileToggle' || el.closest && el.closest('#profileToggle')));
      if (found) {
        e.stopPropagation();
        e.preventDefault();
        console.info('[debug] capture: toggling profileDropdown due to stacked element match', found);
        profileDropdown.style.display = profileDropdown.style.display === 'block' ? 'none' : 'block';
        return;
      }
    } catch (err) {
      console.debug('[debug] capture handler error', err);
    }
  }, true);

  // ------------------------------
  // fade-in animation
  // ------------------------------
  setTimeout(() => {
    document.querySelector('.welcome-section')?.classList.add('fade-in');
    document.querySelectorAll('.stat-card').forEach((card, index) => {
      setTimeout(() => card.classList.add('fade-in'), index * 100);
    });
  }, 100);

  // ------------------------------
  // Load Scholarships (Main Logic)
  // ------------------------------
  async function loadScholarships() {
    if (!scholarshipsContainer) return;

    scholarshipsContainer.innerHTML = `<div class="empty"><p>Loading scholarships...</p></div>`;

    // detect current page
    const path = window.location.pathname;

    let query = supabase.from('posts').select('*');

    if (path.includes('/saved_scholarships')) {
      query = query.eq('is_saved', true);
    } else if (path.includes('/archives')) {
      query = query.eq('is_archived', true);
    } else if (path.includes('/applications')) {
      query = query.eq('is_applied', true);
    } else {
      query = query.eq('is_archived', false);
    }

    let { data: posts, error } = await query;

    if (error) {
      console.error('Error loading posts:', error);
      scholarshipsContainer.innerHTML = `<div class="empty"><p>Failed to load scholarships.</p></div>`;
      return;
    }

    if (!posts || posts.length === 0) {
      scholarshipsContainer.innerHTML = `<div class="empty"><p>No scholarships available yet.</p></div>`;
      return;
    }
    // If we're on the homepage (not saved, applications, or archives),
    // automatically archive any posts whose deadline already passed so
    // they won't appear on the homepage but will be available on /archives.
    // This updates Supabase and removes them from the local posts array.
    if (path && !path.includes('/saved_scholarships') && !path.includes('/archives') && !path.includes('/applications')) {
      try {
        const now = new Date();
        const expired = posts.filter(p => p.deadline && new Date(p.deadline) < now && !p.is_archived);
        if (expired.length > 0) {
          console.info(`Auto-archiving ${expired.length} expired post(s)`);
          // mark them archived in the DB in parallel
          await Promise.all(expired.map(p => updatePostStatus(p.id, { is_archived: true })));
          // remove expired posts from the local list so they don't render on homepage
          posts = posts.filter(p => !(p.deadline && new Date(p.deadline) < now));
        }
      } catch (err) {
        console.error('Error auto-archiving expired posts:', err);
      }
    }

    scholarshipsContainer.innerHTML = posts
      .map((post) => {
        const deadline = post.deadline ? new Date(post.deadline) : null;
        const safeLink =
          post.scholarship_link && post.scholarship_link.trim() !== ''
            ? post.scholarship_link
            : '#';

        return `
        <div class="scholarship-card">
          <div class="card-header">
            <h3 class="scholarship-title">${post.title ?? ''}</h3>
            <div class="card-buttons">
              <div class="tooltip">
                <button class="icon-btn save-btn" data-id="${post.id}">
                  <i class="fa-regular fa-bookmark"></i>
                </button>
                <span class="tooltiptext">Save this scholarship</span>
              </div>
              <div class="tooltip">
                <button class="icon-btn archive-btn" data-id="${post.id}">
                  <i class="fa-solid fa-box-archive"></i>
                </button>
                <span class="tooltiptext">Archive this scholarship</span>
              </div>
              <div class="tooltip">
                <button class="icon-btn apply-btn" data-id="${post.id}">
                  <i class="fa-regular fa-circle-check"></i>
                </button>
                <span class="tooltiptext">Apply for this scholarship</span>
              </div>
            </div>
          </div>

          <p class="scholarship-description">${post.description ?? ''}</p>
          <p><i class="fa-solid fa-location-dot"></i> Location: ${post.location ?? 'N/A'}</p>
          <div class="deadline-tag" id="deadline-${post.id}">
            <i class="fa-regular fa-calendar-check"></i> ${
              deadline ? 'Due: ' + deadline.toDateString() : 'No deadline'
            }
          </div>

          <!-- ✅ always show button -->
<a href="/admin-page/view-description/${post.id}/" class="view-link">
    View Scholarship Details
</a>
        </div>
      `;
      })
      .join('');

    // start countdowns
    posts.forEach((post) => {
      if (post.deadline) {
        startDeadlineTimer(`deadline-${post.id}`, post.deadline);
      }
    });
  }

  loadScholarships();

  // ------------------------------
  // search filter + suggestions dropdown
  // ------------------------------
  function debounce(fn, delay = 200) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // create suggestions container (placed inside the search-container if available)
  let suggestionsRoot = null;
  function ensureSuggestionsRoot() {
    if (suggestionsRoot) return suggestionsRoot;
    const container = searchInput?.closest('.search-container') || document.body;
    const root = document.createElement('div');
    root.className = 'search-suggestions';
    root.setAttribute('aria-hidden', 'true');
    // basic inline styles so it appears; you can move to CSS file later
    root.style.position = 'absolute';
    root.style.zIndex = 9999;
    root.style.minWidth = '40rem';
    root.style.maxWidth = '560px';
    root.style.boxSizing = 'border-box';
    root.style.background = '#eef7fb';
    root.style.borderRadius = '10px';
    root.style.boxShadow = '0 6px 18px rgba(10,20,40,0.08)';
    root.style.padding = '12px';
    root.style.display = 'none';

    // append to container's parent so absolute positioning works
    container.style.position = container.style.position || 'relative';
    container.appendChild(root);
    suggestionsRoot = root;
    return suggestionsRoot;
  }

  let suggestionItems = [];
  let selectedSuggestionIndex = -1;

  function positionSuggestions() {
    const root = ensureSuggestionsRoot();
    if (!searchInput || !root) return;
    const rect = searchInput.getBoundingClientRect();
    // position relative to the search container
    // position and size to match the search input exactly
    root.style.top = (searchInput.offsetTop + searchInput.offsetHeight + 8) + 'px';
    root.style.left = searchInput.offsetLeft + 'px';
    // use the input's computed width so the suggestion box matches it exactly
    const inputWidth = Math.round(searchInput.getBoundingClientRect().width);
    root.style.width = inputWidth + 'px';
  }

  function buildSuggestions(matches) {
    const root = ensureSuggestionsRoot();
    root.innerHTML = '';
    suggestionItems = [];
    selectedSuggestionIndex = -1;

    if (!matches || matches.length === 0) {
      root.style.display = 'none';
      root.setAttribute('aria-hidden', 'true');
      return;
    }

    matches.slice(0, 6).forEach((m, i) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.style.padding = '12px 14px';
      item.style.borderRadius = '8px';
      item.style.cursor = 'pointer';
      item.style.marginBottom = '6px';
      item.style.color = '#0f0f0fff';
      item.style.fontSize = '15px';
      item.innerHTML = `<div style="font-weight:600;margin-bottom:4px">Scholarship ${i+1}: ${escapeHtml(m.title)}</div>`;
      item.addEventListener('click', () => selectSuggestion(i));
      item.addEventListener('mousemove', () => setSelectedSuggestion(i));
      root.appendChild(item);
      suggestionItems.push({ el: item, targetCard: m.card });
    });

    positionSuggestions();
    root.style.display = 'block';
    root.setAttribute('aria-hidden', 'false');
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c];
    });
  }

  function setSelectedSuggestion(index) {
    if (index < -1 || index >= suggestionItems.length) return;
    suggestionItems.forEach((s, i) => {
      s.el.style.background = i === index ? 'rgba(10,40,60,0.06)' : 'transparent';
    });
    selectedSuggestionIndex = index;
  }

  function selectSuggestion(index) {
    const s = suggestionItems[index];
    if (!s) return;
    const title = s.el.textContent.replace(/^Result \d+:\s*/, '').trim();
    searchInput.value = title;
    // hide suggestions
    const root = ensureSuggestionsRoot();
    root.style.display = 'none';
    root.setAttribute('aria-hidden', 'true');
    // show only the selected card and scroll to it
    if (s.targetCard) {
      document.querySelectorAll('.scholarship-card').forEach((c) => (c.style.display = 'none'));
      s.targetCard.style.display = '';
      s.targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      s.targetCard.classList.add('highlighted-search-result');
      setTimeout(() => s.targetCard.classList.remove('highlighted-search-result'), 2000);
    }
  }

  // performSearch: filters cards and returns an array of matches {title, card}
  function performSearch(query) {
    const searchTerm = (query || '').trim().toLowerCase();
    const cards = Array.from(document.querySelectorAll('.scholarship-card'));
    if (!cards || cards.length === 0) return buildSuggestions([]);

    let anyVisible = false;
    const matches = [];

    cards.forEach((card) => {
      const title = (card.querySelector('.scholarship-title')?.textContent || '').toLowerCase();
      const description = (card.querySelector('.scholarship-description')?.textContent || '').toLowerCase();

      const isMatch = searchTerm === '' || title.includes(searchTerm) || description.includes(searchTerm);
      card.style.display = isMatch ? '' : 'none';
      if (isMatch) anyVisible = true;
      if (isMatch && title) matches.push({ title: card.querySelector('.scholarship-title')?.textContent || title, card });
    });

    let noMsg = document.querySelector('.no-scholarships');
    if (!anyVisible) {
      if (!noMsg && scholarshipsContainer) {
        const msg = document.createElement('div');
        msg.className = 'no-scholarships';
        msg.innerHTML = '<p>No scholarships found.</p>';
        scholarshipsContainer.appendChild(msg);
      }
    } else {
      if (noMsg) noMsg.remove();
    }

    // build suggestions from matches (titles)
    buildSuggestions(matches.map(m => ({ title: m.title, card: m.card })));
  }

  // wire input with debounce
  if (searchInput) {
    // update position on resize/scroll
    window.addEventListener('resize', debounce(positionSuggestions, 150));
    window.addEventListener('scroll', debounce(positionSuggestions, 150), true);

    // unified input handler: run appropriate search for the current page
    function filterCardsGrid(query) {
      const q = (query || '').trim().toLowerCase();
      const cards = Array.from(document.querySelectorAll('.cards-card'));
      if (!cards || cards.length === 0) return;
      let anyVisible = false;
      cards.forEach(card => {
        const title = (card.querySelector('.card-title')?.textContent || '').toLowerCase();
        const desc = (card.querySelector('.card-desc')?.textContent || '').toLowerCase();
        const meta = (card.querySelector('.card-meta')?.textContent || '').toLowerCase();
        const isMatch = q === '' || title.includes(q) || desc.includes(q) || meta.includes(q);
        card.style.display = isMatch ? '' : 'none';
        if (isMatch) anyVisible = true;
        if (isMatch) {
          card.classList.add('highlighted-search-result');
          setTimeout(() => card.classList.remove('highlighted-search-result'), 1000);
        }
      });
      const noMsg = document.querySelector('.no-cards');
      if (!anyVisible) {
        if (!noMsg && document.querySelector('.cards-grid')) {
          const msg = document.createElement('p');
          msg.className = 'no-cards';
          msg.textContent = 'No results found.';
          document.querySelector('.cards-grid').appendChild(msg);
        }
      } else {
        if (noMsg) noMsg.remove();
      }
    }

    searchInput.addEventListener('input', debounce((e) => {
      const val = e.target.value;
      // homepage/dynamic scholarships
      if (document.querySelectorAll('.scholarship-card').length > 0) {
        performSearch(val);
      }
      // cards pages (applications, saved, archives)
      if (document.querySelectorAll('.cards-card').length > 0) {
        filterCardsGrid(val);
      }
    }, 180));

    // keyboard navigation for suggestions
    searchInput.addEventListener('keydown', (e) => {
      const root = ensureSuggestionsRoot();
      if (!root || root.style.display === 'none') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(Math.min(selectedSuggestionIndex + 1, suggestionItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(Math.max(selectedSuggestionIndex - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          selectSuggestion(selectedSuggestionIndex);
        }
      } else if (e.key === 'Escape') {
        root.style.display = 'none';
        root.setAttribute('aria-hidden', 'true');
      }
    });

    // click outside to close
    document.addEventListener('click', (ev) => {
      const root = ensureSuggestionsRoot();
      if (!root) return;
      if (ev.target === searchInput || root.contains(ev.target)) return;
      root.style.display = 'none';
      root.setAttribute('aria-hidden', 'true');
    });
  }

  // sidebar closes when clicking a link
  document.addEventListener('click', function (e) {
    if (e.target.matches('.sidebar-btn')) closeSidebar();
  });

  // listen for profile updates in other tabs/windows (storage event)
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'userProfile') applyStoredAvatarToHeaders();
  });
});

// ------------------------------
// toast messages
// ------------------------------
function showToast(message, type = 'info') {
  console.log(`${type.toUpperCase()}: ${message}`);
}

// ------------------------------
// update post status in supabase
// ------------------------------
async function updatePostStatus(id, data) {
  try {
    const { error } = await supabase.from('posts').update(data).eq('id', id);
    if (error) {
      console.error('Supabase update error:', error);
      showToast('Failed to update post', 'error');
      return false;
    }
    return true;
  } catch (err) {
    console.error('Update error:', err);
    showToast('Failed to update post', 'error');
    return false;
  }
}

// ------------------------------
// button handlers (save, apply, archive)
// ------------------------------
document.addEventListener('click', async function (e) {
  const saveBtn = e.target.closest('.save-btn');
  const archiveBtn = e.target.closest('.archive-btn');
  const applyBtn = e.target.closest('.apply-btn');
  const viewLink = e.target.closest('.view-link');

  // SAVE
  if (saveBtn) {
    const id = saveBtn.dataset.id;
    const currentlySaved = saveBtn.classList.contains('saved');
    const ok = await updatePostStatus(id, { is_saved: !currentlySaved });
    if (ok) {
      if (!currentlySaved) {
        showToast('Saved!', 'success');
        saveBtn.classList.add('saved');
        saveBtn.querySelector('i').classList.replace('fa-regular', 'fa-solid');
      } else {
        showToast('Unsaved!', 'info');
        saveBtn.classList.remove('saved');
        saveBtn.querySelector('i').classList.replace('fa-solid', 'fa-regular');
      }
    }
  }

  // APPLY
  if (applyBtn) {
    const id = applyBtn.dataset.id;
    // Redirect to the scholarship details page so the user can submit
    // requirements there (the submission endpoint will create the
    // application record). Do not mark as applied here.
    window.location.href = `/admin-page/view-description/${id}/?from=apply`;
  }

  // ARCHIVE
  if (archiveBtn) {
    const id = archiveBtn.dataset.id;
    const ok = await updatePostStatus(id, { is_archived: true });
    if (ok) {
      showToast('Archived!', 'success');
      archiveBtn.closest('.scholarship-card')?.remove();
      window.location.href = '/archives/';
    }
  }

  // VIEW BUTTON — prevent click if no real link
  if (viewLink && (viewLink.getAttribute('href') === '#' || viewLink.getAttribute('href') === '')) {
    e.preventDefault();
    showToast('This scholarship has no link yet.', 'info');
  }
});
