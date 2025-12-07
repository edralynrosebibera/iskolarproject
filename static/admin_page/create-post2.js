const saveBtn = document.getElementById("savePostBtn");
const editingIdField = document.getElementById("editingId");

const preview = {
  title: document.getElementById("preview-title"),
  description: document.getElementById("preview-description"),
  location: document.getElementById("preview-location"),
  qualifications: document.getElementById("preview-qualifications"),
  deadline: document.getElementById("preview-deadline"),
  // posted: document.getElementById("preview-posted"),
  // remaining: document.getElementById("preview-remaining"),
  link: document.getElementById("preview-link"),
};

let postedDate = new Date();
let deadlineDate = null;

window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");

  console.log("Edit ID detected:", editId);

  if (editId) {
    // Pre-fill form from query parameters
    document.getElementById("title").value = params.get("title") || "";
    document.getElementById("description").value = params.get("description") || "";
    document.getElementById("location").value = params.get("location") || "";
    document.getElementById("qualifications").value = params.get("qualifications") || "";
    document.getElementById("deadline").value = params.get("deadline") || "";
    document.getElementById("scholarshipLink").value = params.get("link") || "";
    editingIdField.value = editId;

    saveBtn.textContent = "Update Scholarship";
    postedDate = new Date();
  }

  updatePreview();
});

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function updatePreview() {
  const title = document.getElementById("title").value || "Your Scholarship Title";
  const descriptionText = document.getElementById("description").value || "Add a compelling description for your scholarship...";
  const location = document.getElementById("location").value || "Your City or Country";
  const qualificationsText = document.getElementById("qualifications").value || "Eligibility criteria will appear here.";
  const deadlineVal = document.getElementById("deadline").value;
  const link = document.getElementById("scholarshipLink").value || "#";

  preview.title.textContent = title;
  preview.description.innerHTML = descriptionText.replace(/\n/g, "<br>");
  preview.location.textContent = location;
  preview.qualifications.innerHTML = qualificationsText.replace(/\n/g, "<br>");
  preview.link.href = link;

  if (deadlineVal) {
    deadlineDate = new Date(deadlineVal);
    preview.deadline.textContent = deadlineDate.toDateString();
  } else {
    preview.deadline.textContent = "No deadline yet";
  }
}

function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const text = document.getElementById("confirmMessage");
    const yesBtn = document.getElementById("confirmYes");
    const noBtn = document.getElementById("confirmNo");

    text.textContent = message;
    modal.style.display = "flex";

    yesBtn.onclick = () => {
      modal.style.display = "none";
      resolve(true);
    };

    noBtn.onclick = () => {
      modal.style.display = "none";
      resolve(false);
    };
  });
}

function updateTimers() {
  const now = new Date();
}

// setInterval(updateTimers, 1000);
document.querySelectorAll("input, textarea").forEach(el => el.addEventListener("input", updatePreview));



saveBtn.addEventListener("click", async e => {
  e.preventDefault();

  const post = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    location: document.getElementById("location").value.trim(),
    qualifications: document.getElementById("qualifications").value.trim(),
    postedDate: new Date().toISOString(),
    deadline: document.getElementById("deadline").value,
    scholarshipLink: document.getElementById("scholarshipLink").value.trim(),
  };

  const editId = editingIdField.value;
  let endpoint = "/admin-page/create-post/";
  let successMessage = "🎉 Scholarship created successfully!";

  if (editId) {
    endpoint = `/admin-page/edit-post/${editId}/`;
    successMessage = "✅ Scholarship updated successfully!";
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });

    const data = await res.json();
    console.log("FRONTEND RECEIVED:", data);

    if (data.success) {
        showToast(successMessage);

        const newPostId = data.data && data.data.length > 0 ? data.data[0].id : null;

        if (!newPostId) {
            showToast("⚠️ Post saved but no post ID was returned.");
            return;
        }

        // 🔥 <-- INSERT SMART LOGIC HERE
        let descriptionPrompt = "";

        if (editId) {
            let hasDescription = false;

            try {
                const check = await fetch("/admin-page/get-posts/");
                const response = await check.json();

                if (response.success && response.data) {
                    const match = response.data.find(p => p.id === editId);
                    hasDescription = match?.has_description === true;
                }
            } catch (e) {
                console.error("Description check failed:", e);
            }

            descriptionPrompt = hasDescription
                ? "This post already has a Description Page. Do you want to EDIT it now?"
                : "This post has NO Description Page yet. Do you want to CREATE one now?";
        } else {
            descriptionPrompt = "Do you want to create a Description Page for this post?";
        }

        const goToDescription = await showConfirm(descriptionPrompt);

        if (goToDescription) {
            window.location.href = `/admin-page/create-description/?id=${newPostId}`;
        } else {
            window.location.href = "/admin-page/posts/";
        }
    } else {
      showToast("❌ Failed: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    showToast("⚠️ Error saving post.");
  }
});



function viewAllPosts() {
  window.location.href = "/admin-page/posts/";
}

const createDescBtn = document.getElementById("createDescriptionBtn");
if (createDescBtn) {
  createDescBtn.addEventListener("click", e => {
    e.preventDefault();

    // Get the post ID from the hidden editing field (if editing)
    const editId = document.getElementById("editingId").value;

    if (editId) {
      // If editing an existing post, link it directly to the description builder
      window.open(`/admin-page/create-description/?id=${editId}`, "_blank");
    } else {
      showToast("⚠️ Please save the scholarship post first before creating a description page.");
    }
  });
}

function showToast(message, type = "success", duration = 3000) {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");

  toast.className = `toast ${type}`;
  toast.innerHTML = message;

  container.appendChild(toast);

  setTimeout(() => toast.remove(), duration);
}



