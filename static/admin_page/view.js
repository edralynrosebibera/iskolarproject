// --- CONNECT TO SUPABASE ---
const supabaseUrl = "https://ionsrqiqludrojmpbhfa.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbnNycWlxbHVkcm9qbXBiaGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTIxNjYsImV4cCI6MjA3NDM4ODE2Nn0.RTrfB5Og1gDARYQGDb6maqekH6DHfZykP55FGAY8gDs";
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
// --- LOAD LOGGED-IN USER FROM DJANGO ---


// --- GET POST ID FROM URL ---
const pathParts = window.location.pathname.split("/");
const postId = pathParts[pathParts.length - 2];
console.log("✅ Loaded post ID:", postId);

const container = document.getElementById("contentContainer");
const requirementsContainer = document.getElementById("requirementsContainer");
const progressFill = document.querySelector(".total-progress-fill");
const progressText = document.getElementById("progressText");

if (!postId) {
  container.innerHTML = `<p>⚠️ Missing post ID.</p>`;
  throw new Error("No post_id found in URL");
}

let requirements = [];

// --- LOAD SCHOLARSHIP DETAILS ---
async function loadDescription() {
  const { data, error } = await supabase
    .from("descriptionpage")
    .select("content")
    .eq("post_id", postId)
    .maybeSingle();

  if (error) {
    console.error("❌ Error loading description:", error);
    container.innerHTML = "<p>⚠️ Failed to load scholarship details.</p>";
    return;
  }

  if (!data || !data.content) {
    container.innerHTML = "<p>⚠️ No description found for this post.</p>";
    return;
  }

  const content = data.content;
  console.log("✅ Loaded content:", content);

  renderSections(content.sections || []);
  renderRequirements(content.requirements || []);
}

// --- RENDER SECTIONS ---
function renderSections(sections) {
  const container = document.getElementById("contentContainer");
  container.innerHTML = "";

  sections.forEach((sec) => {
    const validColors = ["blue", "pink", "green", "orange", "purple", "gray"];
    const colorClass = validColors.includes(sec.color) ? sec.color : "gray";

    const wrapper = document.createElement("div");
    wrapper.className = "view-box";

    const tinted = document.createElement("div");
    tinted.className = `tint-${colorClass}`;
    tinted.style.padding = "16px";
    tinted.style.borderRadius = "12px";

    tinted.innerHTML = `
      <h2 style="font-weight:700;margin-bottom:6px;">${sec.title || ""}</h2>
      <p>${(sec.description || "").replace(/\n/g, "<br>")}</p>
    `;

    wrapper.appendChild(tinted);
    container.appendChild(wrapper);
  });
}

// --- RENDER REQUIREMENTS ---
function renderRequirements(reqs) {
  requirementsContainer.innerHTML = "";
  requirements = [];

  if (!reqs.length) {
    requirementsContainer.innerHTML = "<p>No file requirements for this scholarship.</p>";
    return;
  }

  requirements = reqs.map((r) => ({
    name: r.name,
    uploaded: false,
    file_url: null
  }));

  reqs.forEach((r, i) => {
    const row = document.createElement("div");
    row.className = "requirement-row";
    row.innerHTML = `
      <div class="label">${r.name}</div>
      <input type="file" id="file-${i}" accept=".pdf,.jpg,.png,.jpeg" style="display:none;">
      <div class="row">
        <button class="upload-btn" onclick="selectFile(${i})">Upload</button>
        <button class="ghost" id="viewBtn-${i}" style="display:none;" onclick="viewFile(${i})">View</button>
        <button class="ghost" id="deleteBtn-${i}" style="display:none;color:red;" onclick="deleteFile(${i})">Delete</button>
        <span id="status-${i}" class="text-muted"></span>
      </div>
    `;
    requirementsContainer.appendChild(row);
  });

  updateProgress();
}

// --- FILE SELECTION ---
function selectFile(i) {
  const input = document.getElementById(`file-${i}`);
  input.click();
  input.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) await uploadFile(i, file);
  });
}

// --- UPLOAD FILE ---
async function uploadFile(i, file) {
  const req = requirements[i];
  const filePath = `post_${postId}/${Date.now()}_${file.name}`;
  const status = document.getElementById(`status-${i}`);
  const uploadBtn = document.querySelectorAll(".upload-btn")[i];

  uploadBtn.disabled = true;
  status.textContent = "⏳ Uploading...";

  try {
    const { error: uploadError } = await supabase.storage
      .from("student_uploads")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("student_uploads")
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    req.uploaded = true;
    req.file_url = fileUrl;

    document.getElementById(`viewBtn-${i}`).style.display = "inline-block";
    document.getElementById(`deleteBtn-${i}`).style.display = "inline-block";

   const { data: insertData, error: insertError } = await supabase
  .from("submissions")
  .insert([{
    post_id: postId,
    requirement_name: req.name,
    file_url: fileUrl,
    student_id: window.loggedInUser?.id || null,
    student_name: window.loggedInUser?.name || "Unknown User",
    student_email: window.loggedInUser?.email || null,
    uploaded_at: new Date().toISOString()
  }]);

console.log("📤 SUBMISSIONS INSERT DATA:", insertData);
console.log("❌ SUBMISSIONS INSERT ERROR:", insertError);



    status.textContent = `✅ Uploaded: ${file.name}`;
    uploadBtn.textContent = "Uploaded";
    uploadBtn.disabled = true;
    updateProgress();
  } catch (err) {
    console.error("Upload error:", err);
    status.textContent = "❌ Upload failed.";
    uploadBtn.disabled = false;
  }
}

function viewFile(i) {
  const req = requirements[i];
  if (!req.file_url) return alert("No file to view yet.");
  window.open(req.file_url, "_blank");
}

async function deleteFile(i) {
  const req = requirements[i];
  if (!req.file_url) return alert("No file to delete.");

  if (!confirm("Are you sure you want to delete this file?")) return;

  try {
    const fileName = req.file_url.split("/").pop();
    await supabase.storage.from("student_uploads").remove([`post_${postId}/${fileName}`]);

    await supabase.from("submissions")
      .delete()
      .eq("post_id", postId)
      .eq("requirement_name", req.name);

    req.uploaded = false;
    req.file_url = null;

    document.getElementById(`status-${i}`).textContent = "🗑️ File deleted.";
    document.getElementById(`viewBtn-${i}`).style.display = "none";
    document.getElementById(`deleteBtn-${i}`).style.display = "none";

    const uploadBtn = document.querySelectorAll(".upload-btn")[i];
    uploadBtn.textContent = "Upload";
    uploadBtn.disabled = false;

    updateProgress();
  } catch (err) {
    console.error("❌ Delete error:", err);
    alert("Failed to delete file.");
  }
}

// --- UPDATE PROGRESS BAR ---
function updateProgress() {
  const done = requirements.filter((r) => r.uploaded).length;
  const total = requirements.length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  if (progressText) progressText.textContent = `Progress: ${done}/${total} files uploaded`;
  if (progressFill) progressFill.style.width = percent + "%";
}

// --- SUBMIT ALL FILES TO DJANGO ---
document.getElementById("submitAllBtn").addEventListener("click", async () => {
  if (requirements.some(r => !r.uploaded)) {
    alert("⚠️ Please upload all required files before submitting.");
    return;
  }

  const payload = {
    post_id: postId,
    user_id: window.loggedInUser?.id || null,   // ✅ FIXED
    requirements: requirements.map(r => ({
      name: r.name,
      file_url: r.file_url
    }))
};


  try {
    const res = await fetch(`/admin-page/submit-requirements/${postId}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
});


    // 🔥 FIX #1 — detect redirect BEFORE parsing JSON
    if (res.redirected) {
      window.location.href = res.url;
      return;
    }

    // Parse JSON only if not redirected
    const result = await res.json();

    if (result.success) {
      window.location.href = "/applications/";
      return;
    }

    document.getElementById("submitMsg").textContent = "⚠️ Submission failed.";

  } catch (err) {
    console.error("❌ Submit error:", err);
    document.getElementById("submitMsg").textContent = "⚠️ Submission failed.";
  }
});

// --- START ---
loadDescription();
