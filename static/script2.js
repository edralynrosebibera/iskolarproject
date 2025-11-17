import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

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
    profileDropdown.style.display =
      profileDropdown.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('click', () => {
    if (profileDropdown) profileDropdown.style.display = 'none';
  });

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

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error loading posts:', error);
      scholarshipsContainer.innerHTML = `<div class="empty"><p>Failed to load scholarships.</p></div>`;
      return;
    }

    if (!posts || posts.length === 0) {
      scholarshipsContainer.innerHTML = `<div class="empty"><p>No scholarships available yet.</p></div>`;
      return;
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
          <a href="${safeLink}" target="_blank" class="view-link">View Scholarship Details</a>
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
  // search filter
  // ------------------------------
  searchInput?.addEventListener('input', function (e) {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.scholarship-card');
    let anyVisible = false;

    cards.forEach((card) => {
      const title =
        card.querySelector('.scholarship-title')?.textContent.toLowerCase() ||
        '';
      const description =
        card
          .querySelector('.scholarship-description')
          ?.textContent.toLowerCase() || '';

      if (title.includes(searchTerm) || description.includes(searchTerm)) {
        card.style.display = 'block';
        anyVisible = true;
      } else {
        card.style.display = 'none';
      }
    });

    let noMsg = document.querySelector('.no-scholarships');
    if (!anyVisible) {
      if (!noMsg) {
        const msg = document.createElement('div');
        msg.className = 'no-scholarships';
        msg.innerHTML = '<p>No scholarships found.</p>';
        scholarshipsContainer.appendChild(msg);
      }
    } else {
      if (noMsg) noMsg.remove();
    }
  });

  // sidebar closes when clicking a link
  document.addEventListener('click', function (e) {
    if (e.target.matches('.sidebar-btn')) closeSidebar();
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
    const ok = await updatePostStatus(id, { is_applied: true });
    if (ok) {
      showToast('Applied!', 'success');
      window.location.href = '/applications/';
    }
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
