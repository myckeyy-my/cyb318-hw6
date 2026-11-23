![Apex Rush Logo](elements/game%20logo.png)
# 🏎️ Apex Rush – F1 Arcade Qualifying

**A 2D Top-Down Formula 1 Arcade Racing Game**

Apex Rush is a browser-based, single-player Formula 1-inspired arcade racing game. Players compete in a qualifying challenge across multiple racing circuits, attempting to set their fastest valid lap time before running out of attempts.

The game combines arcade-style driving mechanics, timed qualifying sessions, collision detection, and progressive difficulty to create a competitive racing experience.

Built with **HTML, CSS, and JavaScript**, Apex Rush runs directly in a web browser without requiring a dedicated game engine or backend server.

---

## 🎮 1. Game Overview

The objective of Apex Rush is simple: complete each qualifying circuit as quickly as possible and beat the target lap time.

Players control a Formula 1-style racing car from a top-down perspective. They must navigate the circuit, manage acceleration and braking, steer through corners, and avoid collisions.

Each qualifying session provides five attempts to achieve the target time. Only valid laps count toward the player's best time.

### Key Features

- **Arcade Racing Mechanics:** Accelerate, brake, and steer through racing circuits.
- **Three Racing Levels:** Progress through increasingly challenging circuits.
- **Qualifying System:** Complete five attempts to achieve the target lap time.
- **Lap Timer:** Automatically tracks lap completion and records valid lap times.
- **Collision Detection:** Collisions invalidate the current attempt.
- **Best Lap Tracking:** Keeps track of the fastest valid lap.
- **HUD:** Displays the current level, lap information, remaining attempts, current time, best time, and target time.
- **Progressive Difficulty:** Each level introduces a different racing challenge.

---

## 💻 2. Required Software

Before running Apex Rush locally, make sure the following software is installed.

| Software | Purpose | Download |
|---|---|---|
| Git | Clone and manage the project repository | [Git](https://git-scm.com/downloads) |
| Visual Studio Code | Code editor for development | [VS Code](https://code.visualstudio.com/) |
| Google Chrome / Firefox | Run and test the game | [Chrome](https://www.google.com/chrome/) |
| Python 3 | Optional local development server and supporting scripts | [Python](https://www.python.org/downloads/) |

**Note:** Python is not required to run the game's core functionality. The game runs using JavaScript in the browser and does not require a Python backend.

---

## 📥 3. Installation

### Step 1: Clone the Repository

Open a terminal or command prompt and navigate to the directory where you want to store the project.

Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
```

Navigate into the project directory:

```bash
cd YOUR-REPOSITORY
```

### Step 2: Open the Project in VS Code

Run:

```bash
code .
```

Alternatively, open Visual Studio Code and select:

**File → Open Folder → Select the project directory.**

### Step 3: Install Dependencies

Apex Rush uses native HTML, CSS, and JavaScript functionality.

The core game does not require additional JavaScript packages or a separate game engine.

---

## 🚀 4. Running the Game

Apex Rush is a browser-based application. You can run it using a local development server.

### Option 1: Using the web application

Navigate to: https://myckeyy-my.github.io/cyb318-hw6/


### Option 2: Using Python HTTP Server (Locally)

Python's built-in HTTP server provides a simple way to serve the game locally.

From the project root directory, run:

```bash
python -m http.server 8000
```

Open your browser and navigate to:

```text
http://localhost:8000
```

The game should now load in your browser.

To stop the local server, return to the terminal and press:

```text
CTRL + C
```

### Option 3: Using VS Code Live Server (Locally)

1. Open Visual Studio Code.
2. Navigate to the Extensions marketplace.
3. Search for **Live Server**.
4. Install the extension.
5. Open the game's `index.html` file.
6. Right-click and select **Open with Live Server**.

The game will automatically open in your default browser.

---

## ⌨️ 5. Keyboard Controls

Apex Rush uses keyboard input to control the racing car.

| Key | Action |
|---|---|
| ↑ Up Arrow | Accelerate |
| ↓ Down Arrow | Reverse / slow down |
| ← Left Arrow | Steer left |
| → Right Arrow | Steer right |
| Space | Accelerate |
| D | Brake |
| R | Restart the current level |

**Driving Tips:**
- Reduce speed before entering sharp corners.
- Avoid hitting track boundaries and obstacles.
- Use smooth steering movements to maintain control.
- Balance acceleration and braking to achieve faster lap times.

---

## 🏁 6. How to Play

Follow these steps to complete a qualifying challenge.

**Step 1: Start the Game**

Launch Apex Rush in your browser and enter the game.

**Step 2: Learn the Controls**

Before starting Level 1, review the introductory tutorial. It explains the basic driving mechanics, including steering, acceleration, and braking.

**Step 3: Complete the Circuit**

Drive around the circuit and cross the start/finish line to complete a lap.

**Step 4: Beat the Target Time**

Your objective is to complete a valid lap within the target time displayed on the HUD.

**Step 5: Manage Your Attempts**

Each qualifying session provides five attempts.

- A valid lap records your lap time.
- Your fastest valid lap becomes your best time.
- A collision invalidates the current lap.
- An invalid lap consumes one attempt.
- After an invalid lap, the next timing attempt begins when you cross the start/finish line again.

**Step 6: Complete the Qualifying Challenge**

Beat the target time to successfully qualify and progress to the next level.

If all five attempts are exhausted without achieving the objective, the qualifying challenge is unsuccessful.

---

## 🏆 7. Level Progression

Apex Rush features three racing levels with progressively increasing difficulty.

Each level introduces a different circuit and challenges players to improve their driving performance.

| Level | Circuit | Objective Time | Difficulty |
|---|---|---|---|
| Level 1 | Circuit 1 | 50 seconds | Beginner |
| Level 2 | Circuit 2 | 50 seconds | Intermediate |
| Level 3 | Circuit 3 | Configured target | Advanced |

### Level 1 – Beginner

The first level introduces players to the fundamental driving mechanics.

Players learn how to accelerate, brake, steer, and navigate the circuit while attempting to achieve the qualifying objective.

### Level 2 – Intermediate

The second level introduces a different racing circuit and a more challenging driving experience.

Players must apply the skills learned in Level 1 to navigate the new track and beat the qualifying target.

### Level 3 – Advanced

The final level provides the most challenging racing experience.

Players must demonstrate consistent driving, effective cornering, and speed management to complete the qualifying challenge.

### Qualifying Rules

- Each level provides five attempts.
- The objective is to achieve a valid lap faster than the target time.
- Collisions invalidate the current attempt.
- The fastest valid lap is recorded.
- Successful qualification unlocks progression to the next level.

---

## ⚙️ 8. Technology Stack and JavaScript Functionality

Apex Rush is developed using standard web technologies.

| Technology | Role |
|---|---|
| HTML5 | Provides the application's structure and game interface. |
| CSS3 | Handles visual styling, layout, menus, HUD, and interface elements. |
| JavaScript | Implements the game logic, driving mechanics, collision detection, timers, and level progression. |
| Python 3 | Supports optional development utilities and track configuration tasks. |
| Git / GitHub | Version control, source code management, and project hosting. |
| GitHub Pages | Hosts the game as a static web application. |

### What JavaScript Does in the Application

JavaScript is the primary programming language responsible for the game's functionality.

It connects player input, game mechanics, and visual updates to create an interactive racing experience.

Its main responsibilities include:

**1. Game Loop and Rendering**

JavaScript manages the continuous game loop, updating the game state and rendering the racing environment as the game progresses.

**2. Player Input and Car Physics**

JavaScript processes keyboard input and controls the car's movement, including acceleration, braking, steering, speed, and direction.

**3. Collision Detection**

JavaScript detects collisions between the player's car and track boundaries or obstacles. It determines whether a lap is valid and applies the qualifying rules.

**4. Lap Timing and Qualifying System**

JavaScript manages the lap timer, detects start/finish line crossings, tracks attempts, and records the fastest valid lap.

**5. Level Management**

JavaScript manages circuit selection, level progression, qualifying objectives, and success or failure conditions.

**6. User Interface Updates**

JavaScript dynamically updates the HUD, timers, attempt counters, menus, tutorial screens, and other game interface elements.

---

## 🤖 9. AI Development Tools

AI-assisted development tools were used throughout the development of Apex Rush to improve productivity, assist with implementation, and support debugging.

### Cursor AI

[Cursor](https://cursor.com/) was used as the primary AI-assisted development environment.

It helped with:
- Planning and implementing game features.
- Generating and modifying JavaScript code.
- Developing game mechanics and gameplay systems.
- Identifying and troubleshooting programming issues.
- Refining existing code and improving implementation.

### GitHub Copilot

[GitHub Copilot](https://github.com/features/copilot) was used as an additional AI coding assistant.

It helped with:
- Code suggestions and completion.
- Generating code snippets.
- Assisting with JavaScript implementation.
- Explaining existing code and programming concepts.
- Identifying potential errors and suggesting improvements.

**Important:** AI tools were used as development assistants. Generated code and suggestions were reviewed, tested, and refined during implementation to ensure they met the project's requirements.

---

## 🌐 10. Deployment

Apex Rush is designed to run as a static web application and can be hosted using GitHub Pages.

To deploy the game:

1. Push the project files to a GitHub repository.
2. Open the repository on GitHub.
3. Navigate to **Settings → Pages**.
4. Under Build and deployment, select **Deploy from a branch**.
5. Select the `main` branch and the appropriate root directory.
6. Click **Save**.

Once deployment is complete, GitHub Pages will provide a public URL where players can access the game directly through their web browsers.

No dedicated backend server is required.

---

## 📂 11. Project Structure

The project follows a web application structure.

```text
Apex-Rush/
│
├── index.html
├── css/
│   └── style.css
│
├── js/
│   ├── main.js
│   ├── game.js
│   ├── player.js
│   ├── physics.js
│   ├── collision.js
│   └── levels.js
│
├── assets/
│   ├── images/
│   └── audio/
│
├── README.md
└── requirements.txt
```

*Note: This is an illustrative structure. Actual filenames and directories should reflect the implemented project.*

---

## 📌 12. Project Goals

Apex Rush was developed to demonstrate the application of web development and programming concepts through an interactive browser-based game.

The project focuses on:

- Applying JavaScript to develop interactive applications.
- Implementing basic arcade-style vehicle physics.
- Developing real-time game loops and rendering.
- Using collision detection and game-state management.
- Implementing a timed qualifying and progression system.
- Deploying a functional web application using GitHub Pages.

---

## 👨‍💻 Author

**Developer:** [Your Name]

**Project:** Apex Rush – F1 Arcade Qualifying

**Technologies:** HTML5, CSS3, JavaScript, Python

**AI Development Tools:** Cursor AI and GitHub Copilot

---

*Thank you for playing Apex Rush. Can you beat the clock and qualify for the next level?* 🏁