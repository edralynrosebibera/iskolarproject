const postsContainer = document.getElementById("postsContainer");
const dialog = document.getElementById("confirmDialog");
const cancelBtn = document.getElementById("cancelBtn");
const deleteBtn = document.getElementById("deleteBtn");
let deleteId = null;
const searchInput = document.getElementById("searchInput");
const archiveBtn = document.getElementById("archiveExpired");
let archiveFilterActive = false;

// CSRF helper for Django: read csrftoken cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

const csrftoken = getCookie('csrftoken');

function goToCreatePost() {
  window.location.href = "/admin-page/create-post/";
}

function goToAnalytics() {
    // This matches the URL name we will set up in Step 2
    window.location.href = "/analytics/";
}

function logout() {
  window.location.href = "/admin-page/logout/";
}

async function fetchPosts() {
  const res = await fetch("/admin-page/get-posts/");
  const data = await res.json();
  postsContainer.innerHTML = "";

  if (data.success && data.data.length > 0) {
    // store posts for search/filtering
    window._adminPosts = data.data;
    renderTableRows(data.data);
  } else {
    postsContainer.innerHTML = `<tr class="empty-row"><td colspan="5" class="empty">No posts found.</td></tr>`;
  }
}

function renderTableRows(posts) {
  postsContainer.innerHTML = "";
  posts.forEach(post => {
    const postedDate = new Date(post.created_at || Date.now());
    const deadlineDate = post.deadline ? new Date(post.deadline) : null;

    const countdownId = `countdown-${post.id}`;
    const postedAgoId = `posted-${post.id}`;

    const applicants = post.applicants_count != null ? post.applicants_count : "-";
    const status = post.status || (deadlineDate && deadlineDate < new Date() ? 'expired' : 'active');

    const tr = document.createElement('tr');
    tr.setAttribute('data-id', String(post.id));

    tr.innerHTML = `
      <td>
        <div class="post-title">
          <div class="title-text">${escapeHtml(post.title || '')}</div>
          <div class="post-sub">${escapeHtml(post.location || '')}</div>
        </div>
      </td>
      <td class="td-deadline" id="${countdownId}">${post.deadline || 'N/A'}</td>
      <td>${escapeHtml(String(applicants))}</td>
      <td>
        <span id="status-${post.id}" class="status-pill ${(
          (String(status||'').toLowerCase().includes('arch')) ? 'archived' :
          (String(status||'').toLowerCase() === 'expired') ? 'expired' :
          (String(status||'').toLowerCase() === 'active') ? 'active' : 'neutral'
        )}">${escapeHtml(status)}</span>
      </td>
      <td>
        <div class="actions-cell">
          <button type="button" class="icon-btn edit" title="Edit" data-tooltip="Edit" data-id="${post.id}" aria-label="Edit">
            <svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="2.5" y="3.5" width="15" height="15" rx="3" stroke="currentColor" stroke-width="1.6" fill="none" />
              <path d="M8.5 13.5l6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M14.5 6.5l2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button type="button" class="icon-btn delete" title="Delete" data-tooltip="Delete" data-id="${post.id}" aria-label="Delete">
            <svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 6h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </td>
    `;

    postsContainer.appendChild(tr);
    // attach event listeners instead of using inline onclick (avoids quoting/escaping issues)
    const editBtn = tr.querySelector('button.icon-btn.edit');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        editPost(post.id, post.title || '', post.description || '', post.location || '', post.qualifications || '', post.deadline || '', post.link || '');
      });
    }
    const delBtn = tr.querySelector('button.icon-btn.delete');
    if (delBtn) {
      delBtn.addEventListener('click', () => confirmDelete(post.id));
    }

    startTimers(postedAgoId, countdownId, postedDate, deadlineDate, post.id);
  });
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function startTimers(postedId, remainingId, postedDate, deadlineDate, postId) {
  function update() {
    const postedEl = document.getElementById(postedId);
    const remainingEl = document.getElementById(remainingId);
    const now = new Date();

    if (postedEl) {
      const diffPosted = now - postedDate;
      postedEl.textContent = `Posted ${formatTime(diffPosted)} ago`;
    }

    if (remainingEl && deadlineDate) {
      const diffDeadline = deadlineDate - now;
      if (diffDeadline <= 0) {
        // mark as expired in UI (show archived status locally)
        remainingEl.textContent = "Expired";
        remainingEl.classList.add("expired");

        // update status pill to archived (local UI only)
        if (postId) {
          const statusEl = document.getElementById(`status-${postId}`);
          if (statusEl) {
            statusEl.textContent = 'archived';
            statusEl.className = 'status-pill expired';
          }
        }
      } else {
        remainingEl.textContent = `Remaining ${formatTime(diffDeadline)}`;
        const daysLeft = Math.floor(diffDeadline / (1000 * 60 * 60 * 24));
        remainingEl.classList.remove("expired", "warning");
        if (daysLeft <= 3) remainingEl.classList.add("warning");
      }
    }
  }

  update();
  setInterval(update, 1000);
}

function escapeQuotes(text) {
  return text ? text.replace(/'/g, "\\'").replace(/"/g, '\\"') : "";
}

// small helper to escape HTML inserted into rows
function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/[&<>\"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });
}

function confirmDelete(id) {
  deleteId = id;
  dialog.classList.remove("hidden");
}

cancelBtn.onclick = () => {
  deleteId = null;
  dialog.classList.add("hidden");
};

deleteBtn.onclick = async () => {
  if (!deleteId) return;
  const res = await fetch(`/admin-page/delete-post/${deleteId}/`, {
    method: "DELETE",
    headers: {
      'X-CSRFToken': csrftoken,
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin'
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('Delete failed', res.status, res.statusText, text);
    alert(`Delete failed: ${res.status} ${res.statusText}\n${text}`);
    return;
  }

  const data = await res.json().catch(() => null);
  if (data && data.success) {
    dialog.classList.add("hidden");
    fetchPosts();
  } else {
    console.error('Delete response not success', data);
    alert('Failed to delete post: ' + (data && data.error ? data.error : 'unknown error'));
  }
};

async function editPost(id, title, description, location, qualifications, deadline, link) {
  const params = new URLSearchParams({
    id,
    title,
    description,
    location,
    qualifications,
    deadline,
    link
  });

  window.location.href = `/admin-page/create-post/?${params.toString()}`;
}

document.addEventListener("DOMContentLoaded", fetchPosts);

// debounce helper
function debounce(fn, wait){
  let t = null;
  return function(...args){
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// wire additional search inputs: postsSearch (scholarships), applicationSearch, userSearch
document.addEventListener('DOMContentLoaded', function(){
  // Scholarships pane search (filters _adminPosts)
  const postsSearch = document.getElementById('postsSearch');
  if(postsSearch){
    postsSearch.addEventListener('input', debounce(function(e){
      const q = String(e.target.value || '').trim().toLowerCase();
      const all = window._adminPosts || [];
      if(!q) return renderTableRows(all);
      const filtered = all.filter(p => {
        return (p.title && p.title.toLowerCase().includes(q)) ||
               (p.description && p.description.toLowerCase().includes(q)) ||
               (p.location && p.location.toLowerCase().includes(q));
      });
      renderTableRows(filtered);
    }, 220));
  }

  // Applications pane: filter visible DOM rows
  const applicationSearch = document.getElementById('applicationSearch');
  if(applicationSearch){
    applicationSearch.addEventListener('input', debounce(function(e){
      const q = String(e.target.value || '').trim().toLowerCase();
      const rows = document.querySelectorAll('#applicationsContainer tr');
      rows.forEach(r => {
        const txt = (r.textContent || '').toLowerCase();
        if(!q) r.style.display = '';
        else r.style.display = txt.includes(q) ? '' : 'none';
      });
    }, 160));
  }

  // Users pane: filter visible DOM rows
  const userSearch = document.getElementById('userSearch');
  if(userSearch){
    userSearch.addEventListener('input', debounce(function(e){
      const q = String(e.target.value || '').trim().toLowerCase();
      const rows = document.querySelectorAll('#usersContainer tr');
      rows.forEach(r => {
        // skip empty/fallback rows
        if(r.querySelector('td[colspan]')){ r.style.display = ''; return; }
        const txt = (r.textContent || '').toLowerCase();
        if(!q) r.style.display = '';
        else r.style.display = txt.includes(q) ? '' : 'none';
      });
    }, 160));
  }
});

// wire posts filter (scholarships) to apply client-side filtering similar to applications
const postsFilter = document.getElementById('postsFilter');
if(postsFilter){
  postsFilter.addEventListener('change', function(){
    const val = (this.value || 'all').toLowerCase();
    const all = window._adminPosts || [];
    if(!val || val === 'all') return renderTableRows(all);
    const filtered = all.filter(p => {
      const s = String((p.status||'')).toLowerCase();
      const deadlineDate = p.deadline ? new Date(p.deadline) : null;
      const isExpired = deadlineDate && deadlineDate < new Date();
      if(val === 'expired') return isExpired || s === 'expired';
      if(val === 'active') return s === 'active' || (!s && !isExpired);
      return true;
    });
    renderTableRows(filtered);
  });
}

// client-side search
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const all = window._adminPosts || [];
    if (!q) return renderTableRows(all);
    const filtered = all.filter(p => {
      return (p.title && p.title.toLowerCase().includes(q)) ||
             (p.description && p.description.toLowerCase().includes(q)) ||
             (p.location && p.location.toLowerCase().includes(q));
    });
    renderTableRows(filtered);
  });
}

// show Archive Expired button only when Scholarships tab is active
function updateArchiveBtnVisibility(){
  try{
    const activeTab = document.querySelector('.tabs .tab.active');
    if(!archiveBtn) return;
    if(activeTab && activeTab.dataset && activeTab.dataset.target === '#pane-scholarships'){
      archiveBtn.style.display = '';
    }else{
      archiveBtn.style.display = 'none';
      // also reset archive filter if navigating away
      if(archiveFilterActive){
        archiveFilterActive = false;
        archiveBtn.textContent = 'Archive Expired';
        archiveBtn.classList.remove('active');
        const all = window._adminPosts || [];
        renderTableRows(all);
      }
    }
  }catch(e){ console.error('updateArchiveBtnVisibility', e); }
}

// Attach listeners to tabs so visibility updates when user switches panes
document.querySelectorAll('.tabs .tab').forEach(t => {
  t.addEventListener('click', function(){
    // small timeout to allow other tab handlers to run
    setTimeout(updateArchiveBtnVisibility, 10);
  });
});

// Call once to set initial visibility
updateArchiveBtnVisibility();

// archive expired (client-side toggle or endpoint call if exists)
if (archiveBtn) {
  // Toggle client-side filter: show only archived/expired posts when active
  archiveBtn.addEventListener('click', async () => {
    archiveFilterActive = !archiveFilterActive;
    const all = window._adminPosts || [];
    if (archiveFilterActive) {
      // change button label to allow returning to full list
      archiveBtn.textContent = 'Show All';
      archiveBtn.classList.add('active');

      const now = new Date();
      // Filter posts that are expired (deadline passed) or already marked archived
      const filtered = all
        .filter(p => {
          const deadlineDate = p.deadline ? new Date(p.deadline) : null;
          const isExpired = deadlineDate && deadlineDate < now;
          const isArchived = p.status && p.status.toLowerCase() === 'archived';
          return isExpired || isArchived;
        })
        .map(p => {
          // present expired items as archived in the UI
          const np = Object.assign({}, p);
          const deadlineDate = np.deadline ? new Date(np.deadline) : null;
          if (deadlineDate && deadlineDate < now) np.status = 'archived';
          return np;
        });

      renderTableRows(filtered);
    } else {
      // restore full list
      archiveBtn.textContent = 'Archive Expired';
      archiveBtn.classList.remove('active');
      renderTableRows(all);
    }
  });
}
