const notesList = document.getElementById("notesList");
const noteForm = document.getElementById("noteForm");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const clearAllBtn = document.getElementById("clearAll");

let notes = JSON.parse(localStorage.getItem("notes") || "[]");

function saveNotes() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function renderNotes() {
  notesList.innerHTML = "";
  notes.forEach((note, index) => {
    const noteDiv = document.createElement("div");
    noteDiv.className = "note";
    noteDiv.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.content}</p>
      <button onclick="deleteNote(${index})">Delete</button>
    `;
    notesList.appendChild(noteDiv);
  });
}

function deleteNote(index) {
  notes.splice(index, 1);
  saveNotes();
  renderNotes();
}

noteForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = noteTitle.value.trim();
  const content = noteContent.value.trim();
  if (title && content) {
    notes.push({ title, content });
    saveNotes();
    renderNotes();
    noteForm.reset();
  }
});

clearAllBtn.addEventListener("click", () => {
  notes = [];
  saveNotes();
  renderNotes();
});

renderNotes();
