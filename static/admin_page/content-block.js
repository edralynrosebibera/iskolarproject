/* content-block.js - final version with Supabase integration + Add Block fix */

const supabaseUrl = "https://ionsrqiqludrojmpbhfa.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbnNycWlxbHVkcm9qbXBiaGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTIxNjYsImV4cCI6MjA3NDM4ODE2Nn0.RTrfB5Og1gDARYQGDb6maqekH6DHfZykP55FGAY8gDs";
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// document.addEventListener("DOMContentLoaded", () => {
//   const container = document.getElementById("blocksContainer");
//   const addBlockBtn = document.getElementById("addBlockBtn");

//   if (!addBlockBtn) {
//     console.error("⚠️ Add Block button not found!");
//     return;
//   }

//   // Create a default block when page loads
//   createContentBlock();

//   // Add new block on click
//   addBlockBtn.addEventListener("click", () => {
//     createContentBlock();
//   });
// });

document.addEventListener("DOMContentLoaded", async () => {
  const addBlockBtn = document.getElementById("addBlockBtn");
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  // If editing an existing description
  if (postId !== null && postId !== "") {
    const { data: existing, error: fetchError } = await supabase
      .from("descriptionpage")
      .select("*")
      .eq("post_id", postId)
      .maybeSingle();

    // If no existing row → go to CREATE MODE instead
    if (!existing) {
      createContentBlock();
      return;
    }

    // Otherwise → EDIT MODE
    document.getElementById("pageTitle").textContent =
      "Edit Scholarship Description Page";

    createContentBlock(existing.content);

    if (addBlockBtn) addBlockBtn.style.display = "none";

    const postBtn = document.querySelector(".primary-btn:last-of-type");
    postBtn.textContent = "✏ Update Description";
    postBtn.onclick = () => updateDescription(postId);
    
    return;
  }
  // If creating new description
  createContentBlock();

  if (addBlockBtn) {
    addBlockBtn.addEventListener("click", () => {
      createContentBlock();
    });
  }
});



function createContentBlock(editData = null) {
  const container = document.getElementById("blocksContainer");
  if (!container) return;

  const card = document.createElement("div");
  card.className = "card";

  const sectionsContainer = document.createElement("div");
  sectionsContainer.className = "sections-container";

  // default or edit data
  if (editData && Array.isArray(editData.sections)) {
    editData.sections.forEach((sec) => {
      sectionsContainer.appendChild(
        createContentSection(
          `s-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          sec.title || "",
          sec.description || "",
          sec.color || "blue"
        )
      );
    });
  } else {
    sectionsContainer.appendChild(createContentSection(`s-${Date.now()}`, "", "", "blue"));
  }

  const filesContainer = document.createElement("div");
  filesContainer.className = "requirements-container";
  filesContainer.innerHTML = `<h3>Requirements</h3>`;

    // Load requirements when editing
  if (editData && Array.isArray(editData.requirements)) {
    editData.requirements.forEach(req => {
      filesContainer.appendChild(
        createFileRequirement(
          `r-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          req.name || "",
          req.uploaded || false,
          req.filename || ""
        )
      );
    });
  }


  const addSectionBtn = document.createElement("button");
  addSectionBtn.className = "primary-btn";
  addSectionBtn.innerHTML = '<span class="btn-icon">+</span><span class="btn-text">Add Section</span>';
  addSectionBtn.onclick = () => {
    sectionsContainer.appendChild(createContentSection(`s-${Date.now()}`, "", "", "blue"));
  };

  const addFileBtn = document.createElement("button");
  addFileBtn.className = "primary-btn";
  addFileBtn.innerHTML = '<span class="btn-icon">+</span><span class="btn-text">Add Requirement</span>';
  addFileBtn.onclick = () => {
    filesContainer.appendChild(createFileRequirement(`r-${Date.now()}`));
  };

  const progressContainer = document.createElement("div");
  progressContainer.className = "total-progress-container";
  progressContainer.innerHTML = `
    <div class="total-progress-text">Progress</div>
    <div class="total-progress-bar"><div class="total-progress-fill"></div></div>
  `;

  const postBtn = document.createElement("button");
  postBtn.className = "primary-btn";
  postBtn.innerHTML = '<span class="btn-icon">🚀</span><span class="btn-text">Post Description</span>';
  postBtn.onclick = () => {
    saveDescription(sectionsContainer, filesContainer);
  };

  card.appendChild(sectionsContainer);
  card.appendChild(addSectionBtn);
  card.appendChild(addFileBtn);
  card.appendChild(filesContainer);
  card.appendChild(progressContainer);
  card.appendChild(postBtn);

  container.appendChild(card);
}

async function saveDescription(sectionsContainer, filesContainer) {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  if (!postId) {
    alert("⚠️ Missing post ID. Please open this page from the Create Post page.");
    return;
  }

  const sections = [...sectionsContainer.querySelectorAll(".section-item")].map((sec) => ({
    title: sec.querySelector("input").value,
    description: sec.querySelector("textarea").value,
    color: sec.dataset.color || "blue",
  }));

  const requirements = [...filesContainer.querySelectorAll(".file-item")].map((req) => ({
    name: req.querySelector("input").value,
    uploaded: req.dataset.uploaded === "true",
    filename: req.dataset.filename || "",
  }));

  const content = { sections, requirements };

  const { error } = await supabase
    .from("descriptionpage")
    .insert([{ post_id: postId, content }]);

  if (error) {
      console.error("❌ Save error:", error);
      showToast("❌ Failed to save description.", "error");
  } else {
      showToast("✅ Description saved successfully!", "success");
      setTimeout(() => {
          window.location.href = "/admin-page/description-posts/";
      }, 800);
  }

}

function showToast(message, type = "success", duration = 3000) {
  const container = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
      <span>${message}</span>
      <button class="close-btn">&times;</button>
  `;

  // Add to DOM
  container.appendChild(toast);

  // Close on click
  toast.querySelector(".close-btn").onclick = () => toast.remove();

  // Auto-remove
  setTimeout(() => toast.remove(), duration);
}




async function updateDescription(postId) {
  const sectionsContainer = document.querySelector(".sections-container");
  const filesContainer = document.querySelector(".requirements-container");

  const sections = [...sectionsContainer.querySelectorAll(".section-item")].map((sec) => ({
    title: sec.querySelector("input").value,
    description: sec.querySelector("textarea").value,
    color: sec.dataset.color || "blue",
  }));

  const requirements = [...filesContainer.querySelectorAll(".file-item")].map((req) => ({
    name: req.querySelector("input").value,
    uploaded: req.dataset.uploaded === "true",
    filename: req.dataset.filename || "",
  }));

  const content = { sections, requirements };

  const { error } = await supabase
    .from("descriptionpage")
    .update({ content })
    .eq("post_id", postId);

  if (error) {
    alert("❌ Update failed.");
    console.error(error);
    return;
  }

  showToast("Description updated!", "success");
  setTimeout(() => {
    window.location.href = "/admin-page/description-posts/";
}, 800);
}

