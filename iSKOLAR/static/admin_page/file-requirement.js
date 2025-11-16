// file-requirement.js - updated for editing support
function createFileRequirement(reqId, name = "", uploaded = false, filename = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "file-item requirement-row";
  wrapper.dataset.reqId = reqId;
  wrapper.dataset.uploaded = uploaded ? "true" : "false";
  wrapper.dataset.filename = filename;

  const label = document.createElement("input");
  label.type = "text";
  label.placeholder = "Enter requirement name (e.g. Form 137)";
  label.className = "file-name";
  label.value = name; // 🔥 displays the requirement during edit

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "🗑️";
  removeBtn.className = "ghost";
  removeBtn.addEventListener("click", () => wrapper.remove());

  wrapper.appendChild(label);
  wrapper.appendChild(removeBtn);

  return wrapper;
}
