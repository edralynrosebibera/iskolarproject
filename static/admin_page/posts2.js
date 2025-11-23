const postsContainer = document.getElementById("postsContainer");
const dialog = document.getElementById("confirmDialog");
const cancelBtn = document.getElementById("cancelBtn");
const deleteBtn = document.getElementById("deleteBtn");
let deleteId = null;

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
    data.data.forEach(post => {
      const div = document.createElement("div");
      div.className = "post-card";

      const postedDate = new Date(post.created_at || Date.now());
      const deadlineDate = post.deadline ? new Date(post.deadline) : null;

      const countdownId = `countdown-${post.id}`;
      const postedAgoId = `posted-${post.id}`;

      div.innerHTML = `
        <div class="card-actions" data-id="${post.id}">
          <button onclick="editPost('${post.id}', '${escapeQuotes(post.title)}', '${escapeQuotes(post.description)}', '${escapeQuotes(post.location)}', '${escapeQuotes(post.qualifications)}', '${post.deadline}', '${post.link}')">✏️</button>
          <button onclick="confirmDelete('${post.id}')">🗑️</button>
        </div>

        <div class="post-content">
          <div class="post-title">${post.title}</div>

          

          <div class="post-meta">
            <p><strong>📍 Location:</strong> ${post.location || "Not specified"}</p>
            <p><strong>📅 Posted:</strong> ${postedDate.toISOString().split("T")[0]}</p>
            <p><strong>⏰ Deadline:</strong> ${post.deadline || "N/A"}</p>
          </div>

          <p class="post-desc">${post.description || "No description available."}</p>
          <div class="qualifications"><strong>📄 Qualifications:</strong> ${post.qualifications || "None"}</div>

          <a href="${post.link || "#"}" target="_blank" class="link-btn">Link for Scholarship</a>
        </div>
      `;

      postsContainer.appendChild(div);

      startTimers(postedAgoId, countdownId, postedDate, deadlineDate);
    });
  } else {
    postsContainer.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📭</div>
        <p>No posts found.</p>
      </div>`;
  }
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
