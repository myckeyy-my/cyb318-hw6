# Program Requirements Document (PRD)

**Project:** Apex Rush -- F1 Arcade Qualifying  
**Version:** 1.0

## 1. Project Title and Overview

**Project Title: Apex Rush -- F1 Arcade Qualifying**

Apex Rush is a browser-based, 2D top-down Formula racing game inspired
by the circuits and qualifying format of Formula 1. Players control an
original Formula-style racing car, navigate racing circuits, avoid track
barriers and obstacles, and attempt to achieve a qualifying lap time
faster than a predefined benchmark.

The game uses an arcade-style driving system that balances accessibility
with some realistic driving characteristics, including acceleration,
braking, speed-dependent steering, and vehicle momentum.

Players progress through a sequential championship of three levels.
Each level has an original fictional circuit and a fixed qualifying
benchmark. Vehicle physics and qualifying rules remain consistent.

The game will be designed to run entirely in a web browser and be
deployable through GitHub Pages. Python, HTML, CSS, and JavaScript will
be used to meet the assignment's technical requirements.

**Core gameplay concept:** - Race against the clock rather than AI
opponents. - Complete five timed lap attempts per qualifying session. -
Achieve a fastest valid lap below the predefined target time. - Avoid
obstacles and track barriers to preserve valid lap times. - Qualify
successfully to unlock the next circuit.

## 2. Target Audience

**Primary audience:** Students and casual gamers who enjoy arcade-style
racing games.

**Target user characteristics:** - Familiar with basic keyboard
controls. - Interested in Formula 1 and motorsport. - Enjoys time-trial
challenges and progressive difficulty. - Prefers short, accessible
gaming sessions. - Does not require prior experience with professional
racing simulators.

The game should be easy to understand for first-time players while
offering enough challenge to encourage repeated attempts.

## 3. Goals and Objectives

The project has the following goals:

1. Develop a functional 2D arcade racing game that runs directly in a

   web browser.
2. Implement keyboard-based vehicle controls with responsive driving

   mechanics.
3. Create a top-down racing environment with a player-centered,

   rotating camera.
4. Implement lap detection, lap timing, collision detection, and

   qualifying logic.
5. Design at least three distinct racing stages with progressively

   increasing difficulty.
6. Establish a qualifying system based on fixed benchmark times

   determined by the game.
7. Create a simple but polished retro-modern arcade visual experience.
8. Deploy the finished game through GitHub Pages.
9. Use AI-assisted development through Cursor while understanding,

   testing, and documenting the generated code.

**Development constraint:** The project must be achievable within five
days. Core gameplay functionality takes priority over visual complexity
and optional enhancements.

## 4. Core Features (Detailed List)

The following requirements define the minimum viable game.

### 4.1 Player Vehicle and Controls

The player controls an original Formula-style racing car using keyboard
input.

  Keyboard      Function

  ------------- ------------------------------------

  Left Arrow         Steer left
  Right Arrow        Steer right
  Spacebar           Accelerate
  D                  Brake

-------------------------------------------------------

**Vehicle behavior:** 

- The car must move continuously according to its current speed and direction. 
- Acceleration gradually increases vehicle speed. 
- Braking reduces speed. 
- Steering changes the vehicle's direction. 
- Steering responsiveness should vary with vehicle speed. 
- The vehicle should gradually lose speed through friction when acceleration is not applied. 
- The car should have a maximum speed.

### 4.2 Driving Physics

The game will use simplified arcade physics rather than a realistic
Formula 1 simulation.

Required mechanics: - Acceleration and deceleration. - Maximum speed
limitation. - Steering and vehicle rotation. - Speed-dependent
cornering. - Basic momentum and friction. - Track-boundary collision
detection.

The objective is to create responsive handling that rewards players for
slowing down before difficult corners.

### 4.3 Camera System

The game will use a player-centered rotating camera.

**Camera requirements:** - Keep the player's car approximately centered
on the screen. - Keep the car's forward direction pointing toward the
top of the screen. - Rotate the surrounding track based on the car's
steering direction. - Follow the car as it travels around the circuit. -
Use smooth camera movement to avoid abrupt visual changes.

The intended result is that the player always steers relative to the
car's forward direction, regardless of the circuit's orientation.

### 4.4 Racing Tracks and Levels

The game must contain at least three distinct levels.

Development will begin with a simple square-shaped test circuit
featuring relatively gentle corners.

This initial circuit will be used to test: - Vehicle movement. -
Steering and acceleration. - Camera rotation. - Track boundaries. -
Collision detection. - Lap timing. - Start/finish-line detection.

For championship progression, each level has a separate fictional
circuit. All three use the original 16-world-unit asphalt width.
Level 2 is a compact, corner-heavy street circuit; Level 3 combines long
straights with four tight, rounded corners. These are original layouts, not
reproductions of real-world circuits. Vehicle physics and boundary
rules are identical across levels.

**Level progression:**

| Level | Track | Difficulty | Target lap time |
| --- | --- | --- | --- |
| Level 1 | Apex GP Circuit | Easy | 45.000 seconds |
| Level 2 | Harbor Street Circuit | Medium | 38.000 seconds |
| Level 3 | Velocity GP Circuit | Hard | 32.000 seconds |

Keep the qualifying benchmarks in centralized level configuration rather
than in the track geometry data.

### 4.5 Qualifying System

Each level will feature a five-attempt qualifying session.

**Qualifying rules:** 1. The player begins a qualifying session with
five available attempts. 2. Each attempt consists of one timed lap. 3.
The lap timer starts when the player crosses the start/finish line. 4.
The timer stops when the player completes the lap or invalidates it. 5.
Only valid completed laps contribute to the player's fastest lap. 6. The
fastest valid lap is compared against the game's predefined benchmark.
7. The player qualifies if their fastest valid lap beats the benchmark.

The target time must be fixed for each level and must not be calculated
from the player's previous performance.

**Example qualifying benchmarks (illustrative, subject to balancing):**

  Level       Target lap time

  --------- -----------------

  Level 1      45.000 seconds
  Level 2      38.000 seconds
  Level 3      32.000 seconds

These are initial design placeholders, not final calibrated times.

### 4.6 Collision and Invalid Lap System

The game must detect collisions with: - Track barricades and
boundaries. - Obstacles placed on the circuit.

**Collision behavior:** 

1. When the player hits a barrier or obstacle,the current lap becomes invalid.
2. The current lap timer immediately stops.
3. The player loses one of their five available attempts.
4. The player's car remains at the collision location.
5. The player can continue driving.
6. The timer remains stopped until the player crosses the start/finish line.
7. Crossing the start/finish line begins the next timed lap, provided attempts remain.

An invalid lap must never count toward the fastest valid lap.

The game must distinguish between: - A lap that has not started. - A lap
currently in progress. - A completed valid lap. - An invalid lap.

This is important to prevent incorrect lap timing and attempt counting.

### 4.7 Progression and Championship System

The game will use sequential level progression.

**Progression requirements:** - Level 1 is available when the game
starts. - Levels 2 and 3 remain locked until the player qualifies for
the preceding level. - Successful qualification unlocks the next
level. - Players cannot skip levels. - Completing Level 3 triggers the
championship victory screen.

If the player fails to achieve the required benchmark within five
attempts, the qualifying session ends in failure.

The player must be able to restart the failed session and try again.

### 4.8 Obstacles and Track Challenges

Each circuit should contain obstacles that make driving more
challenging.

Examples include: - Trackside barriers. - Roadside obstacles. -
Chicanes. - Narrow sections of track. - Other static hazards.

Obstacles must be visually distinguishable from the drivable track.

For the initial implementation, static obstacles are sufficient. Moving
obstacles are optional and should only be considered if time permits.

### 4.9 Game Feedback and Information Display

The game must provide players with clear information throughout the
qualifying session.

Required information: - Current level. - Current lap number. - Remaining
attempts. - Current lap time. - Fastest valid lap. - Target qualifying
time. - Qualification status.

The game should also provide feedback for: - Lap completion. - Invalid
laps. - Successful qualification. - Failed qualifying sessions. -
Championship completion.

### 4.10 Restart Mechanism

The player must be able to restart a qualifying session.

Restarting must: - Reset the vehicle to its starting position. - Reset
vehicle speed. - Reset lap timing. - Restore all five attempts. - Clear
the fastest lap for the current session. - Preserve previously unlocked
levels if applicable.

### 4.11 Browser-Based Gameplay

The game must run in a modern web browser without requiring players to
install Python or understand the source code.

The final project must be accessible through GitHub Pages.

The interface should support desktop keyboard input and a reasonably
sized browser window.

## 5. User Interface Description

The game will use a retro-modern arcade aesthetic with a simple and
readable interface.

### 5.1 Main Menu

The main menu should display: - Game title: Apex Rush. - Start Game
button. - Brief game instructions. - Keyboard control reference.

### 5.2 Main Racing Screen

The racing screen will be the primary gameplay interface.

The car should remain centered while the circuit rotates around it.

**HUD layout:**

  HUD element    Information

  -------------- -----------------------------

  Level          Current circuit
  Lap            Current lap / 5
  Attempts       Remaining attempts
  Current Time   Time elapsed on current lap
  Best Lap       Fastest valid lap
  Target         Required qualifying time

### 5.3 Qualification Results Screen

After five attempts, the game should display: - Fastest valid lap. -
Target qualifying time. - Number of valid laps. - Number of invalid
laps. - Qualification result. - Continue or Retry option.

### 5.4 Championship Victory Screen

After successfully completing all three levels, the game should display
a championship completion message.

The screen should include an option to restart the championship.

### 5.5 Visual Design Guidelines

- Dark asphalt background.
- Clearly marked track boundaries.
- Brightly colored Formula-style car.
- Contrasting obstacle colors.
- Readable HUD typography.
- Simple visual effects and animations.
- Consistent color scheme across all levels.

Visual simplicity is intentional to keep development achievable within
five days.

## 6. Technical Requirements

### 6.1 Required Technologies

  -----------------------------------------------------------------------

  Technology                          Purpose

  ----------------------------------- -----------------------------------

  Python                              Meaningful game-related logic,
                                      track configuration, or development
                                      tooling

  HTML                                Structure of the web application

  CSS                                 Styling, layout, menus, and HUD

  JavaScript                          Real-time browser gameplay,
                                      keyboard input, rendering,
                                      collision detection, and animation

  Cursor                              AI-assisted coding, debugging, and
                                      development

##   GitHub Pages                        Hosting and deployment

### 6.2 Technical Architecture

The game will use a browser-first architecture.

GitHub Pages does not execute Python server-side code, so the browser
gameplay must run using JavaScript.

Python must still have a meaningful and documented role in the project
to satisfy the assignment requirement.

A possible project structure:

```text
apex-rush/
│
├── app.py
├── requirements.txt
├── README.md
│
├── index.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── game.js
│   ├── player.js
│   ├── physics.js
│   ├── track.js
│   ├── collision.js
│   └── gameState.js
│
├── assets/
│   ├── images/
│   └── sounds/
│
└── data/
    └── tracks.json
```

This structure is a starting proposal, not a mandatory architecture.

Python could be used to generate and validate track configuration data,
while JavaScript consumes that data during browser gameplay. The Python
contribution must be substantial enough to be explained and documented;
simply including an unused Python file is insufficient.

### 6.3 Browser Requirements

- Must run in a modern desktop browser.
- Must not require a local Python server to play.
- Must support GitHub Pages deployment.
- Must load its assets using compatible relative paths.
- Must support keyboard input.
- Must provide a functional game interface without external backend
dependencies.

### 6.4 Development Requirements

Development will follow an iterative vibe-coding process:

**Describe → Generate → Run → Observe → Diagnose → Modify → Test →
Refine**

Cursor and AI assistance will be used to: - Establish the project
architecture. - Generate individual gameplay features. - Explain
important program components. - Diagnose bugs. - Improve existing
functionality. - Refactor code where necessary.

All generated code must be reviewed and tested by the student.

Significant AI-generated contributions and debugging activities must be
documented.

### 6.5 Development Timeline

  -----------------------------------------------------------------------

  Day                                 Development priority

  ----------------------------------- -----------------------------------

  Day 1                               Project setup, basic car movement,
                                      acceleration, braking, and steering

  Day 2                               Track environment, camera rotation,
                                      collisions, and lap detection

  Day 3                               Qualifying system, lap timing,
                                      attempts, and benchmark logic

  Day 4                               Three levels, level progression,
                                      HUD, and game screens

  Day 5                               Testing, debugging, balancing,
                                      documentation, and GitHub Pages
                                  deployment

  -----------------------------------------------------------------------

This timeline prioritizes a working prototype before adding additional
content.

## 7. Success Criteria

The project will be considered successful when the following criteria
are met.

### 7.1 Functional Requirements

- [ ] The game opens and runs in a web browser.
- [ ] The player can control the car using the specified keyboard
    controls.
- [ ] Acceleration, braking, and steering work correctly.
- [ ] The car's handling responds to changes in speed.
- [ ] The camera follows and rotates around the player.
- [ ] The player can navigate a closed-loop racing circuit.
- [ ] The game detects completed laps.
- [ ] The game accurately records lap times.
- [ ] The game provides five timed lap attempts.
- [ ] The game detects collisions with obstacles and barriers.
- [ ] Invalid laps stop their timers and consume one attempt.
- [ ] Invalid laps do not contribute to the fastest lap.
- [ ] The game compares the fastest valid lap against a fixed
    benchmark.
- [ ] Successful qualification unlocks the next level.
- [ ] At least three distinct levels are playable.
- [ ] The game has clear winning and losing conditions.
- [ ] The player can restart a qualifying session.
- [ ] The game displays relevant racing information through its HUD.

### 7.2 Technical Requirements

- [ ] Python plays a meaningful role in the implementation.
- [ ] HTML, CSS, and JavaScript are used appropriately.
- [ ] The project is developed using Cursor.
- [ ] The game works without requiring a Python backend.
- [ ] The game is successfully deployed through GitHub Pages.
- [ ] The source code is organized and sufficiently documented.

### 7.3 Educational Requirements

- [ ] The student can explain the major components of the program.
- [ ] The student can explain how keyboard input affects game state.
- [ ] The student can explain basic collision detection and lap
    timing.
- [ ] AI-generated code has been tested and debugged.
- [ ] Significant AI contributions are documented.
- [ ] The student can discuss the strengths and limitations of vibe
    coding.

## Final Project Scope

**Apex Rush -- F1 Arcade Qualifying** is a three-level, top-down
arcade racing game featuring: - Top-down Formula-style racing. - Five
timed qualifying attempts per level. - Fixed benchmark lap times. -
Collision-based lap invalidation. - One shared test circuit with
progressively shorter qualifying targets. - Sequential championship
progression. - Browser-based
deployment through GitHub Pages.

**Development constraint:** Five days. Prioritize working mechanics,
accurate timing, and reliable gameplay over decorative features.

**Professional recommendation:** Treat the first square circuit as your
technical prototype. Do not start recreating famous F1 circuits until
the car physics, camera rotation, collision detection, and lap-timing
system work reliably. Those four systems are the technical foundation of
this entire game. Also, confirm with your instructor that
Python-generated track data or configuration is sufficient for the
Python requirement before committing to the architecture.
