# Requirements Document

## Introduction

Flappy Kiro is a retro-styled, browser-based endless scroller game. The player guides a ghost character (Ghosty) through a series of pipe obstacles by tapping or clicking to make the ghost jump. The game features a hand-drawn/sketchy visual aesthetic, ambient cloud obstacles, sound effects, and persistent high score tracking. The game runs entirely in the browser with no server-side dependencies.

## Glossary

- **Game**: The Flappy Kiro browser application as a whole.
- **Ghosty**: The player-controlled ghost character sprite rendered using `assets/ghosty.png`.
- **Pipe_Pair**: A pair of green pipes — one extending downward from the top of the viewport and one extending upward from the bottom — with a gap between them for Ghosty to fly through.
- **Gap**: The vertical opening between the top and bottom pipes of a Pipe_Pair through which Ghosty must pass.
- **Cloud**: A decorative, floating obstacle rendered in the sketchy hand-drawn style that moves across the screen as part of the background.
- **Score**: The integer count of Pipe_Pairs successfully passed by Ghosty in the current session.
- **High_Score**: The highest Score achieved across all sessions, persisted in browser local storage.
- **Score_Bar**: The UI element at the bottom of the viewport displaying the current Score and High_Score.
- **Game_Loop**: The continuous update-and-render cycle that drives game physics, collision detection, and rendering.
- **Physics_Engine**: The component responsible for applying gravity and jump velocity to Ghosty.
- **Collision_Detector**: The component responsible for detecting contact between Ghosty and pipes, clouds, the top boundary, or the ground.
- **Renderer**: The component responsible for drawing all game elements to the HTML5 Canvas each frame.
- **Audio_Manager**: The component responsible for loading and playing sound effects.
- **Score_Manager**: The component responsible for tracking Score, updating High_Score, and persisting High_Score to local storage.
- **Input_Handler**: The component responsible for capturing keyboard, mouse, and touch input to trigger jumps.
- **Start_Screen**: The initial screen shown before the first game session begins.
- **Game_Over_Screen**: The overlay shown when Ghosty collides with an obstacle or boundary.

---

## Requirements

### Requirement 1: Game Initialization and Start Screen

**User Story:** As a player, I want to see a start screen when I open the game, so that I know how to begin playing.

#### Acceptance Criteria

1. WHEN the browser loads the Game, THE Renderer SHALL display the Start_Screen showing the game title, Ghosty in a hovering state, and a prompt to press Space, click, or tap to begin.
2. WHILE the Start_Screen is displayed, THE Renderer SHALL keep Ghosty's vertical position fixed at the vertical center of the canvas.
3. WHILE the Start_Screen is displayed, WHEN the player presses Space, clicks, or taps, THE Game SHALL initialize state (Score = 0, Ghosty at starting position, no active Pipe_Pairs or Clouds) and SHALL block the transition to the active gameplay state and the Game_Loop until initialization is fully complete, regardless of how long initialization takes.

---

### Requirement 2: Ghosty Physics and Player Input

**User Story:** As a player, I want to control Ghosty by pressing a button or tapping the screen, so that I can navigate through the pipes.

#### Acceptance Criteria

1. WHILE the Game_Loop is active, THE Physics_Engine SHALL apply a constant downward gravitational acceleration to Ghosty each frame.
2. WHILE the Game_Loop is active, WHEN the player presses Space, clicks, or taps, THE Physics_Engine SHALL apply a fixed upward velocity impulse to Ghosty, replacing any current vertical velocity.
3. WHEN a jump input is received, THE Audio_Manager SHALL play `assets/jump.wav`; IF the audio system is unavailable or the audio file is missing, THEN THE Physics_Engine SHALL still apply the jump impulse and the game SHALL continue without audio.
4. WHILE the Game_Loop is active, THE Renderer SHALL update Ghosty's vertical position on the canvas each frame based on the Physics_Engine output.
5. THE Physics_Engine SHALL clamp Ghosty's downward velocity so that Ghosty cannot travel more than one canvas height per second in the downward direction.
6. THE Physics_Engine SHALL clamp Ghosty's upward velocity so that rapid repeated jump inputs do not cause Ghosty to accelerate beyond the fixed impulse speed in the upward direction.

---

### Requirement 3: Pipe Generation and Scrolling

**User Story:** As a player, I want pipes to scroll toward me continuously, so that the game presents an ongoing challenge.

#### Acceptance Criteria

1. WHILE the Game_Loop is active, THE Game SHALL spawn Pipe_Pairs at a leading-edge-to-leading-edge horizontal interval of 200px beyond the right edge of the viewport.
2. WHILE the Game_Loop is active, THE Renderer SHALL scroll all active Pipe_Pairs leftward at 150 pixels per second, independent of frame rate.
3. WHEN a new Pipe_Pair is spawned and the Gap height is smaller than the viewport height, THE Game SHALL randomize the vertical center of the Gap to a position between 20% and 80% of the canvas height; WHEN the Gap height equals or exceeds the viewport height, THE Game SHALL center the Gap vertically.
4. WHEN a Pipe_Pair is spawned, THE Gap height SHALL be at least twice Ghosty's rendered height.
5. WHEN a Pipe_Pair has scrolled completely past the left edge of the viewport so that no part of it remains visible, THE Game SHALL complete the removal of that Pipe_Pair from the active set before spawning any new Pipe_Pair, to avoid memory or rendering conflicts.

---

### Requirement 4: Cloud Obstacles and Background

**User Story:** As a player, I want a visually rich hand-drawn background with moving clouds, so that the game feels alive and retro.

#### Acceptance Criteria

1. WHILE the Game_Loop is active, THE Renderer SHALL draw a light blue sketchy/hand-drawn style background on the canvas each frame.
2. WHILE the Game_Loop is active, THE Renderer SHALL render Clouds scrolling leftward at 40–60% of the Pipe_Pair scroll speed to create a visible parallax effect.
3. WHILE the Game_Loop is active, THE Game SHALL spawn Clouds at randomized vertical positions between 20% and 80% of the canvas height and at randomized horizontal intervals between 200px and 400px beyond the right edge of the viewport.
4. WHEN a Cloud has scrolled completely past the left edge of the viewport so that no part of it remains visible, THE Game SHALL remove it from the active set.
5. THE Renderer SHALL draw all game elements — background, Clouds, Pipe_Pairs, and Ghosty — using visible stroke outlines with no solid color fills, consistent with the sketchy/hand-drawn visual style.

---

### Requirement 5: Collision Detection and Game Over

**User Story:** As a player, I want the game to end when Ghosty hits a pipe, cloud, or boundary, so that there is a meaningful challenge and consequence.

#### Acceptance Criteria

1. WHEN the Collision_Detector determines that Ghosty's rectangular bounding box overlaps a Pipe_Pair, THE Audio_Manager SHALL play `assets/game_over.wav`, THE Game_Loop SHALL halt all scrolling and physics updates, and THE Renderer SHALL display the Game_Over_Screen, regardless of whether a formal Game_Over state transition occurs.
2. WHEN the Collision_Detector determines that Ghosty's rectangular bounding box overlaps a Cloud, THE Audio_Manager SHALL play `assets/game_over.wav`, THE Game_Loop SHALL halt all scrolling and physics updates, and THE Renderer SHALL display the Game_Over_Screen, regardless of whether a formal Game_Over state transition occurs.
3. WHEN the top edge of Ghosty's bounding box reaches or crosses y ≤ 0, THE Audio_Manager SHALL play `assets/game_over.wav`, THE Game_Loop SHALL halt all scrolling and physics updates, and THE Renderer SHALL display the Game_Over_Screen, regardless of whether a formal Game_Over state transition occurs.
4. WHEN the bottom edge of Ghosty's bounding box reaches or crosses y ≥ canvas height, THE Audio_Manager SHALL play `assets/game_over.wav`, THE Game_Loop SHALL halt all scrolling and physics updates, and THE Renderer SHALL display the Game_Over_Screen, regardless of whether a formal Game_Over state transition occurs.
5. WHEN the Game transitions to the Game_Over state, THE Audio_Manager SHALL play `assets/game_over.wav`.
6. WHEN the Game transitions to the Game_Over state, THE Game_Loop SHALL halt all scrolling and physics updates.
7. WHEN the Game transitions to the Game_Over state, THE Renderer SHALL display the Game_Over_Screen showing the final Score, the High_Score, and a prompt indicating that pressing Space, clicking, or tapping will restart the game.

---

### Requirement 6: Score Tracking

**User Story:** As a player, I want to see my current score and high score during and after each run, so that I can track my progress.

#### Acceptance Criteria

1. WHEN Ghosty passes the horizontal midpoint of a Pipe_Pair without collision, THE Score_Manager SHALL increment the Score by one.
2. WHILE the Game_Loop is active, THE Renderer SHALL display the Score_Bar at the bottom of the viewport showing "Score: X | High: X" where X reflects the current values.
3. WHEN the Game transitions to the Game_Over state, THE Score_Manager SHALL compare the final Score to the High_Score and update the High_Score if the final Score is greater.
4. WHEN the High_Score is updated, THE Score_Manager SHALL persist the current High_Score value to browser local storage using the key "flappyKiroHighScore", regardless of whether the value has changed since the last persistence.
5. WHEN the Game initializes, THE Score_Manager SHALL set Score to 0 and load the High_Score from browser local storage under the key "flappyKiroHighScore", defaulting to 0 if no value is stored or if the stored value is not a valid non-negative integer.

---

### Requirement 7: Game Restart

**User Story:** As a player, I want to restart the game quickly after a game over, so that I can try to beat my high score.

#### Acceptance Criteria

1. WHILE the Game_Over_Screen is displayed, WHEN the player presses Space, clicks, or taps, THE Game SHALL within one frame reset the Score to zero, remove all active Pipe_Pairs and Clouds so that the playing field starts empty, reposition Ghosty to the same horizontal and vertical starting position used at game initialization, and resume the Game_Loop; THE Game SHALL then spawn new Pipe_Pairs and Clouds gradually through normal gameplay rather than pre-populating them at restart.
2. WHEN the Game restarts, THE Score_Manager SHALL retain the current High_Score without resetting it.
3. WHEN the Game restarts, THE Renderer SHALL clear the Game_Over_Screen overlay and resume rendering the background, Ghosty, Pipe_Pairs, Clouds, and Score_Bar.

---

### Requirement 8: Audio Management

**User Story:** As a player, I want sound effects for jumps and game over events, so that the game feels responsive and engaging.

#### Acceptance Criteria

1. WHEN the Game initializes successfully, THE Audio_Manager SHALL attempt to preload `assets/jump.wav` and `assets/game_over.wav`; IF preloading fails due to missing files or a network error, THEN THE Audio_Manager SHALL emit a console warning and allow the Game to continue without audio; IF the Game itself fails to initialize, THEN THE Audio_Manager SHALL NOT attempt preloading.
2. WHEN a jump action occurs during active gameplay, THE Audio_Manager SHALL play `assets/jump.wav`; IF audio playback fails at runtime due to codec problems or audio device unavailability, THEN THE Game SHALL continue silently without interruption.
3. WHEN the Game transitions to the Game_Over state, THE Audio_Manager SHALL play `assets/game_over.wav`.
4. WHEN a sound effect is triggered while a previous instance of the same sound is still playing, THE Audio_Manager SHALL restart the sound from the beginning.
5. IF a browser security policy prevents audio autoplay before user interaction, THEN THE Audio_Manager SHALL defer audio playback until the first jump action is received.

---

### Requirement 9: Responsive Canvas and Browser Compatibility

**User Story:** As a player, I want the game to run smoothly in a modern browser on both desktop and mobile, so that I can play anywhere.

#### Acceptance Criteria

1. THE Game SHALL render using an HTML5 Canvas element whose width and height match the browser viewport dimensions with no overflow or scrollbars.
2. WHEN the browser viewport is resized, THE Game SHALL update the canvas dimensions to match the new viewport size, preserve the aspect ratio of game elements via letterboxing, and continue the active game state without interruption.
3. THE Game SHALL support jump actions triggered by keyboard (Space key), mouse (click), and touch (tap) events.
4. THE Game SHALL maintain a minimum of 30 frames per second using `requestAnimationFrame` on modern browsers.
5. THE Game SHALL be implemented as a single HTML file with embedded or co-located JavaScript and CSS, requiring no build step or server-side runtime to play.
