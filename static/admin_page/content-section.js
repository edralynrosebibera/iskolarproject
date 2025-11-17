// content-section.js - normal script version
function createContentSection(sectionId, titleVal = "", descVal = "", color = "blue") {
  const section = document.createElement("div");
  section.className = `section-item tint-${color}`;
  section.dataset.sectionId = sectionId;
  section.dataset.color = color;

  const titleInput = document.createElement("input");
  titleInput.placeholder = "Section Title";
  titleInput.value = titleVal;

  const descArea = document.createElement("textarea");
  descArea.placeholder = "Section Description";
  descArea.value = descVal;

  const colors = ["blue", "green", "orange", "pink", "purple", "gray"];
  const palette = document.createElement("div");
  palette.className = "color-palette";
  palette.innerHTML = `<label>Color:</label>`;
  colors.forEach((clr) => {
    const dot = document.createElement("div");
    dot.className = `color-dot ${clr}`;
    if (clr === color) dot.classList.add("selected");
    dot.addEventListener("click", () => {
      section.dataset.color = clr;
      section.className = `section-item tint-${clr}`;
      palette.querySelectorAll(".color-dot").forEach((d) => d.classList.remove("selected"));
      dot.classList.add("selected");
    });
    palette.appendChild(dot);
  });

  section.appendChild(titleInput);
  section.appendChild(descArea);
  section.appendChild(palette);
  return section;
}
