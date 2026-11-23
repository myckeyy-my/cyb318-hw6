// Holds which driving keys are currently down.
// The game loop reads this once per frame. Physics never listens to the DOM itself.

const held = new Set();
const DRIVE_CODES = new Set(["ArrowLeft", "ArrowRight", "Space", "KeyD"]);

window.addEventListener("keydown", (event) => {
  if (!DRIVE_CODES.has(event.code)) {
    return;
  }
  event.preventDefault();
  held.add(event.code);
});

window.addEventListener("keyup", (event) => {
  held.delete(event.code);
});

// If the tab loses focus while a key is down, the matching keyup never arrives.
window.addEventListener("blur", () => {
  held.clear();
});

export function readInput() {
  return {
    left: held.has("ArrowLeft"),
    right: held.has("ArrowRight"),
    accelerate: held.has("Space"),
    brake: held.has("KeyD")
  };
}

export function clearInput() {
  held.clear();
}
