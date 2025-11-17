// --- Supabase Connection ---
const supabaseUrl = "https://ionsrqiqludrojmpbhfa.supabase.co";
const supabaseAnonKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbnNycWlxbHVkcm9qbXBiaGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTIxNjYsImV4cCI6MjA3NDM4ODE2Nn0.RTrfB5Og1gDARYQGDb6maqekH6DHfZykP55FGAY8gDs";
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

console.log("🔌 Connected to Supabase project:", supabaseUrl);

const container = document.getElementById("descriptionListContainer");

async function loadDescriptions() {
  console.log("🟡 Fetching data from `descriptionpage` table...");

  const { data, error } = await supabase
    .from("descriptionpage")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("📦 Raw Supabase Response:", { data, error });

  if (error) {
    container.innerHTML = `<p>❌ Error: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `<p>⚠️ No data found in Supabase.</p>`;
    return;
  }

  // Render all entries
  container.innerHTML = data
    .map((desc, index) => {
      let parsedContent = desc.content;
      if (typeof parsedContent === "string") {
        try {
          parsedContent = JSON.parse(parsedContent);
        } catch (e) {
          console.warn("⚠️ Failed to parse content for row:", index, e);
          parsedContent = {};
        }
      }

      console.log(`✅ Parsed content for row ${index}:`, parsedContent);

      const sections = parsedContent.sections || [];
      const title =
        sections.length > 0 && sections[0].title
          ? sections[0].title
          : "(No section title)";

      return `
        <div class="requirement-row">
          <div>
            <strong>${title}</strong><br>
            <span class="text-muted">Post ID: ${desc.post_id}</span><br>
            <span class="text-muted">Created: ${new Date(
              desc.created_at
            ).toLocaleString()}</span>
          </div>
          <div class="row">
            <button onclick="viewDescription('${desc.post_id}')">👁️ View</button>
            <button onclick="editDescription('${desc.post_id}')">✏️ Edit</button>
            <button class="ghost" onclick="deleteDescription('${desc.id}')">🗑️ Delete</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function viewDescription(postId) {
  window.location.href = `/admin-page/view-description/${postId}/`;
}

function editDescription(postId) {
  window.location.href = `/admin-page/create-description/?id=${postId}`;
}

async function deleteDescription(id) {
  if (!confirm("Are you sure you want to delete this description page?")) return;

  const { error } = await supabase.from("descriptionpage").delete().eq("id", id);

  if (error) {
    alert("❌ Failed to delete description page.");
  } else {
    alert("🗑️ Description deleted successfully!");
    loadDescriptions();
  }
}

loadDescriptions();



// // --- Initialize Supabase ---
// const supabaseUrl = "https://ionsrqiqludrojmpbhfa.supabase.co";
// const supabaseAnonKey =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbnNycWlxbHVkcm9qbXBiaGZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgxMjE2NiwiZXhwIjoyMDc0Mzg4MTY2fQ.7aePHEM6jZbTf1Iivrv2n4KxX9LmHSdCu9SDjuAJHEg";
// const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// // --- DOM Reference ---
// const container = document.getElementById("descriptionPostsContainer");

// // --- Load all description pages ---
// async function loadDescriptionPosts() {
//   const { data, error } = await supabase
//     .from("descriptionpage")
//     .select("*")
//     .order("created_at", { ascending: false });

//   if (error) {
//     console.error("❌ Error loading description pages:", error);
//     container.innerHTML = `<p class="text-muted">⚠️ Error loading data.</p>`;
//     return;
//   }

//   if (!data || data.length === 0) {
//     container.innerHTML = `<p class="text-muted">No description pages created yet.</p>`;
//     return;
//   }

//   // --- Render all description pages ---
//   container.innerHTML = data
//     .map(
//       (desc) => `
//     <div class="requirement-row">
//       <div>
//         <strong>📄 Description Page</strong><br>
//         <span class="text-muted">Linked Post ID: ${desc.post_id || "N/A"}</span><br>
//         <span class="text-muted">Created: ${new Date(
//           desc.created_at
//         ).toLocaleString()}</span>
//       </div>
//       <div class="row">
//         <button onclick="viewDescription('${desc.post_id}')">👁️ View</button>
//         <button onclick="editDescription('${desc.post_id}')">✏️ Edit</button>
//         <button class="ghost" onclick="deleteDescription('${desc.id}')">🗑️ Delete</button>
//       </div>
//     </div>
//   `
//     )
//     .join("");
// }

// // --- View description ---
// function viewDescription(postId) {
//   window.location.href = `/admin-page/view-description/${postId}/`;
// }

// // --- Edit description ---
// function editDescription(postId) {
//   window.location.href = `/admin-page/create-description/?id=${postId}`;
// }

// // --- Delete description ---
// async function deleteDescription(id) {
//   if (!confirm("Are you sure you want to delete this description page?")) return;

//   const { error } = await supabase.from("descriptionpage").delete().eq("id", id);

//   if (error) {
//     console.error("❌ Failed to delete description:", error);
//     alert("Failed to delete description page.");
//   } else {
//     alert("🗑️ Description page deleted successfully!");
//     loadDescriptionPosts();
//   }
// }

// // --- Run on load ---
// loadDescriptionPosts();


