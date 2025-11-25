const postsContainer = document.getElementById("postsContainer");
const dialog = document.getElementById("confirmDialog");
const cancelBtn = document.getElementById("cancelBtn");
const deleteBtn = document.getElementById("deleteBtn");
let deleteId = null;
const searchInput = document.getElementById("searchInput");
const archiveBtn = document.getElementById("archiveExpired");

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
    postsContainer.innerHTML = `<tr class="empty-row"><td colspan="6" class="empty">No posts found.</td></tr>`;
  }
}

function renderTableRows(posts) {
  postsContainer.innerHTML = "";
  posts.forEach(post => {
    const postedDate = new Date(post.created_at || Date.now());
    const deadlineDate = post.deadline ? new Date(post.deadline) : null;

    const countdownId = `countdown-${post.id}`;
    const postedAgoId = `posted-${post.id}`;

    const amount = post.amount || post.salary || post.stipend || "-";
    const applicants = post.applicants != null ? post.applicants : "-";
    const status = post.status || (deadlineDate && deadlineDate < new Date() ? 'expired' : 'active');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-title">
        <div class="title-line">
          <div class="title-text">${post.title}</div>
          <div class="title-sub">${(post.location || '')}</div>
        </div>
      </td>
      <td class="td-amount">${amount}</td>
      <td class="td-deadline" id="${countdownId}">${post.deadline || 'N/A'}</td>
      <td class="td-applicants">${applicants}</td>
      <td class="td-status"><span class="status-pill ${status === 'active' ? 'active' : status === 'expired' ? 'expired' : 'neutral'}">${status}</span></td>
      <td class="td-actions">
        <button class="icon-btn edit" title="Edit" data-tooltip="Edit" onclick="editPost('${post.id}', '${escapeQuotes(post.title)}', '${escapeQuotes(post.description)}', '${escapeQuotes(post.location)}', '${escapeQuotes(post.qualifications)}', '${post.deadline}', '${post.link}')" aria-label="Edit">
          <svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="2.5" y="3.5" width="15" height="15" rx="3" stroke="currentColor" stroke-width="1.6" fill="none" />
            <path d="M8.5 13.5l6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M14.5 6.5l2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button class="icon-btn delete" title="Delete" data-tooltip="Delete" onclick="confirmDelete('${post.id}')" aria-label="Delete">
          <svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M3 6h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </td>
    `;

    postsContainer.appendChild(tr);
    startTimers(postedAgoId, countdownId, postedDate, deadlineDate);
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

function startTimers(postedId, remainingId, postedDate, deadlineDate) {
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
        remainingEl.textContent = "Expired";
        remainingEl.classList.add("expired");
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
  const res = await fetch(`/admin-page/delete-post/${deleteId}/`, { method: "DELETE" });
  const data = await res.json();
  if (data.success) {
    dialog.classList.add("hidden");
    fetchPosts();
  } else {
    alert("Failed to delete post: " + data.error);
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

// archive expired (client-side toggle or endpoint call if exists)
if (archiveBtn) {
  archiveBtn.addEventListener('click', async () => {
    // try server endpoint, fallback to client-side filter UI
    try {
      const res = await fetch('/admin-page/archive-expired/', { method: 'POST' });
      const data = await res.json();
      if (data.success) fetchPosts();
      else alert(data.error || 'Could not archive expired posts');
    } catch (err) {
      // client-side: remove expired from view
      const all = window._adminPosts || [];
      const remaining = all.filter(p => {
        const d = p.deadline ? new Date(p.deadline) : null;
        return !(d && d < new Date());
      });
      renderTableRows(remaining);
    }
  });
}
