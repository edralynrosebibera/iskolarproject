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
      alert(successMessage);

      const newPostId = data.data && data.data.length > 0 ? data.data[0].id : null;


      if (!newPostId) {
        alert("⚠️ Post saved but no post ID was returned.");
        return;
      }

      // ✅ Ask if user wants to create a description page now
      const goToDescription = confirm("Do you want to create a Description Page for this post?");
      if (goToDescription) {
        // Auto redirect and pass the post ID
        window.location.href = `/admin-page/create-description/?id=${newPostId}`;
      } else {
        window.location.href = "/admin-page/posts/";
      }
    } else {
      alert("❌ Failed: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("⚠️ Error saving post.");
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
      alert("⚠️ Please save the scholarship post first before creating a description page.");
    }
  });
}
