class FileSystem {
    constructor() {
        if (FileSystem.instance) {
            return FileSystem.instance;
        }

        this.fs = {
            notes: {
                type: "folder",
                content: {
                    "welcome.txt": {
                        type: "file",
                        content:
                            "Welcome to Harshit WebOS! (Psst.. Easter egg when you set your year to 2007 in Tweak!)",
                        modified: new Date().toISOString(),
                    },
                },
            },
            art: {
                type: "folder",
                content: {},
            },
        };

        FileSystem.instance = this;
    }

    saveFile(path, content) {
        const [folder, filename] = path.split("/");

        if (!this.fs[folder]) {
            alert("Please save in notes/ or art/ folder");
            return false;
        }

        if (!filename) {
            alert("Please provide a valid filename.");
            return false;
        }

        this.fs[folder].content[filename] = {
            type: "file",
            content: content,
            modified: new Date().toISOString(),
        };

        return true;
    }

    loadFile(path) {
        const [folder, filename] = path.split("/");
        if (!filename) {
            alert("Invalid file path.");
            return "";
        }
        return this.fs[folder]?.content[filename]?.content || "";
    }

    getStructure() {
        return this.fs;
    }
}

const fileSystem = new FileSystem();

class AppManager {
    static apps = {
        "File Nest": {
            create: () => {
                const structure = fileSystem.getStructure();

                return `
                    <div class="file-explorer">
                        ${Object.entries(structure)
                        .map(
                            ([folder, data]) => `
                            <div class="folder">
                                <div class="folder-header">
                                    <img src="icons/file.png" width="32" height="32">
                                    <span>${folder}</span>
                            </div>
                                <div class="folder-content">
                                    ${Object.entries(data.content)
                                    .map(
                                        ([filename, file]) => `
                                        <div class="file-item" data-path="${folder}/${filename}">
                                            <img src="${filename
                                                .toLowerCase()
                                                .endsWith(".png")
                                                ? "icons/picture.png"
                                                : "icons/notepad.png"
                                            }" width="32" height="32">
                                            <span>${filename}</span>
                                        </div>
                                    `
                                    )
                                    .join("")}
                                </div>
                            </div>
                        `
                        )
                        .join("")}
                    </div>`;
            },
            init: (window) => {
                const fileList = window.querySelector(".file-explorer");

                fileList.addEventListener("dblclick", (e) => {
                    const fileItem = e.target.closest(".file-item");
                    if (fileItem) {
                        const path = fileItem.dataset.path;
                        const [folder, ...rest] = path.split("/");
                        const filename = rest.join("/");

                        const extension = filename.split(".").pop().toLowerCase();
                        const imageExtensions = ["png", "jpg", "jpeg", "gif", "bmp"];
                        const textExtensions = ["txt", "md", "js", "html", "css"];

                        if (imageExtensions.includes(extension)) {
                            const imageSrc = fileSystem.loadFile(path);
                            const imageViewerContent = AppManager.apps["Gallery"].create(imageSrc);
                            windowManager.createWindow(filename, imageViewerContent);
                        } else if (textExtensions.includes(extension)) {
                            const notepadContent = AppManager.apps["Text Pad"].create();
                            const notepadWindow = windowManager.createWindow(filename, notepadContent);
                            AppManager.apps["Text Pad"].init(notepadWindow, true);
                            const textarea = notepadWindow.querySelector(".notepad-content");
                            textarea.value = fileSystem.loadFile(path);
                        }
                    }
                });
            },
        },
        "Web Start": {
            create: () => {
                return `
    <div class="retro-browser">
        <div class="browser-banner">
            <img src="browserbanner.png" alt="Browser Banner" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <div class="browser-toolbar">
            <input type="text" class="search-bar" placeholder="Search the web..." />
            <button class="search-btn">Search</button>
        </div>
    </div>
`;
            },
            init: (appWindow) => {
                const searchBtn = appWindow.querySelector(".search-btn");
                const searchBar = appWindow.querySelector(".search-bar");

                searchBtn.onclick = () => {
                    const query = searchBar.value.trim();
                    if (query === "") {
                        showModal(`
                <h3>Error</h3>
                <p>Please enter a search query.</p>
                <button id="modal-close-btn">Close</button>
              `);
                        document.getElementById("modal-close-btn").onclick = hideModal;
                        return;
                    }

                    const url =
                        "https://duckduckgo.com/?q=" + encodeURIComponent(query);
                    window.open(url, "_blank");
                };
            },
        },
        "Text Pad": {
            create: () => {
                return `
      <div class="notepad">
        <div class="toolbar">
          <button class="save-btn">Save</button>
        </div>
        <textarea class="notepad-content"></textarea>
      </div>`;
            },
            init: (window, readOnly = false) => {
                const textarea = window.querySelector(".notepad-content");
                const saveBtn = window.querySelector(".save-btn");
                const defaultFolder = "notes";

                if (readOnly) {
                    textarea.disabled = true;
                    saveBtn.style.display = "none";
                }

                saveBtn.onclick = () => {
                    showModal(`
                <h3>Save File</h3>
                <input type="text" id="modal-filename" placeholder="filename.txt" />
                <button id="modal-save-btn">Save</button>
            `);

                    document.getElementById("modal-save-btn").onclick = () => {
                        const filename = document
                            .getElementById("modal-filename")
                            .value.trim();
                        if (!filename) {
                            showModal(`
                        <h3>Error</h3>
                        <p>Please enter a filename.</p>
                        <button id="modal-close-btn">Close</button>
                    `);
                            document.getElementById("modal-close-btn").onclick = hideModal;
                            return;
                        }

                        const path = `${defaultFolder}/${filename}`;
                        const content = textarea.value;

                        if (fileSystem.saveFile(path, content)) {
                            showModal(`
                        <h3>Success</h3>
                        <p>File saved successfully!</p>
                        <button id="modal-close-btn">Close</button>
                    `);
                            document.getElementById("modal-close-btn").onclick = hideModal;
                            windowManager.refreshAppWindow("My Files");
                        } else {
                            showModal(`
                        <h3>Error</h3>
                        <p>Failed to save file. Ensure you are saving in the correct folder.</p>
                        <button id="modal-close-btn">Close</button>
                    `);
                            document.getElementById("modal-close-btn").onclick = hideModal;
                        }
                    };
                };
            },
        },
        "NumPad": {
            create: () => {
                return `
            <div class="calculator">
                <input type="text" class="calc-display" readonly value="0">
                <div class="calc-buttons">
                    ${[7, 8, 9, "+"]
                        .map(
                            (btn) =>
                                `<button class="calc-btn" data-value="${btn}">${btn}</button>`
                        )
                        .join("")}
                    <br>
                    ${[4, 5, 6, "-"]
                        .map(
                            (btn) =>
                                `<button class="calc-btn" data-value="${btn}">${btn}</button>`
                        )
                        .join("")}
                    <br>
                    ${[1, 2, 3, "*"]
                        .map(
                            (btn) =>
                                `<button class="calc-btn" data-value="${btn}">${btn}</button>`
                        )
                        .join("")}
                    <br>
                    ${[0, "C", "=", "/"]
                        .map(
                            (btn) =>
                                `<button class="calc-btn" data-value="${btn}">${btn}</button>`
                        )
                        .join("")}
                        </div>
                    </div>`;
            },
            init: (window) => {
                const display = window.querySelector(".calc-display");
                const calculator = new Calculator();

                window.querySelectorAll(".calc-btn").forEach((btn) => {
                    btn.addEventListener("click", () => {
                        const value = btn.dataset.value;
                        display.value = calculator.handleInput(value);
                    });
                });
            },
        },
        "Canvas": {
            create: () => {
                return `
      <div class="paint">
        <div class="paint-tools">
          <input type="color" value="#000000">
          <input type="range" min="1" max="20" value="5">
          <button class="clear-btn">Clear</button>
          <button class="save-btn">Save</button>
        </div> <br>
        <canvas class="paint-canvas"></canvas>
      </div>`;
            },
            init: (window) => {
                const canvas = window.querySelector(".paint-canvas");
                const ctx = canvas.getContext("2d");
                let painting = false;
                let lastX, lastY;

                canvas.width = window.clientWidth - 40;
                canvas.height = window.clientHeight - 100;

                function draw(e) {
                    if (!painting) return;
                    const color = window.querySelector('input[type="color"]').value;
                    const size = window.querySelector('input[type="range"]').value;

                    ctx.lineWidth = size;
                    ctx.lineCap = "round";
                    ctx.strokeStyle = color;

                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    ctx.beginPath();
                    ctx.moveTo(lastX, lastY);
                    ctx.lineTo(x, y);
                    ctx.stroke();

                    [lastX, lastY] = [x, y];
                }

                canvas.onmousedown = (e) => {
                    painting = true;
                    const rect = canvas.getBoundingClientRect();
                    [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
                };

                canvas.onmouseup = () => (painting = false);
                canvas.onmousemove = draw;
                canvas.onmouseleave = () => (painting = false);

                window.querySelector(".clear-btn").onclick = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                };

                window.querySelector(".save-btn").onclick = () => {
                    showModal(`
        <h3>Save Drawing</h3>
        <input type="text" id="modal-filename" placeholder="drawing.png" />
        <button id="modal-save-btn">Save</button>
      `);

                    document.getElementById("modal-save-btn").onclick = () => {
                        const filename = document
                            .getElementById("modal-filename")
                            .value.trim();
                        if (!filename) {
                            showModal(`
            <h3>Error</h3>
            <p>Please enter a filename.</p>
            <button id="modal-close-btn">Close</button>
          `);
                            document.getElementById("modal-close-btn").onclick = hideModal;
                            return;
                        }

                        const defaultFolder = "art";
                        const imageData = canvas.toDataURL("image/png");
                        const path = `${defaultFolder}/${filename}`;

                        if (fileSystem.saveFile(path, imageData)) {
                            showModal(`
            <h3>Success</h3>
            <p>Image saved successfully!</p>
            <button id="modal-close-btn">Close</button>
          `);
                            document.getElementById("modal-close-btn").onclick = hideModal;
                            windowManager.refreshAppWindow("My Files");
                        } else {
                            showModal(`
            <h3>Error</h3>
            <p>Failed to save image. Ensure you are saving in the correct folder.</p>
            <button id="modal-close-btn">Close</button>
          `);
                            document.getElementById("modal-close-btn").onclick = hideModal;
                        }
                    };
                };
            },
        },
        "Timer": {
            create: () => {
                return `
            <div class="timer-app">
                <div class="timer-display">
                    <span id="minutes">00</span>:<span id="seconds">00</span>
                </div>
                <div class="timer-controls">
                    <div class="timer-input">
                        <label>Minutes:</label>
                        <input type="number" id="set-minutes" min="0" max="99" value="0">
                    </div>
                    <div class="timer-buttons">
                        <button id="start-timer" class="timer-btn">Start</button>
                        <button id="pause-timer" class="timer-btn" disabled>Pause</button>
                        <button id="reset-timer" class="timer-btn">Reset</button>
                    </div>
                </div>
                <div class="timer-presets">
                    <button class="preset-btn" data-minutes="1">1m</button>
                    <button class="preset-btn" data-minutes="3">3m</button>
                    <button class="preset-btn" data-minutes="5">5m</button>
                    <button class="preset-btn" data-minutes="10">10m</button>
                </div>
            </div>`;
            },
            init: (window) => {
                const minutesDisplay = window.querySelector("#minutes");
                const secondsDisplay = window.querySelector("#seconds");
                const minutesInput = window.querySelector("#set-minutes");
                const startBtn = window.querySelector("#start-timer");
                const pauseBtn = window.querySelector("#pause-timer");
                const resetBtn = window.querySelector("#reset-timer");
                const presetBtns = window.querySelectorAll(".preset-btn");

                let timeLeft = 0;
                let timerId = null;
                let isPaused = false;

                function updateDisplay(totalSeconds) {
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds % 60;
                    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
                    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
                }

                function startTimer() {
                    if (timeLeft === 0) {
                        timeLeft = parseInt(minutesInput.value) * 60;
                    }

                    if (timeLeft > 0 && !timerId) {
                        startBtn.disabled = true;
                        pauseBtn.disabled = false;
                        minutesInput.disabled = true;

                        timerId = setInterval(() => {
                            timeLeft--;
                            updateDisplay(timeLeft);

                            if (timeLeft === 0) {
                                clearInterval(timerId);
                                timerId = null;
                                const alarm = new Audio("sfx/error.mp3");
                                alarm.play();
                                showModal(`
                            <h3>Time's Up!</h3>
                            <p>Timer has finished.</p>
                            <button id="modal-close-btn">Close</button>
                        `);
                                document.getElementById("modal-close-btn").onclick = hideModal;
                                resetTimer();
                            }
                        }, 1000);
                    }
                }

                function pauseTimer() {
                    if (timerId) {
                        clearInterval(timerId);
                        timerId = null;
                        startBtn.disabled = false;
                        startBtn.textContent = "Resume";
                        pauseBtn.disabled = true;
                        isPaused = true;
                    }
                }

                function resetTimer() {
                    clearInterval(timerId);
                    timerId = null;
                    timeLeft = 0;
                    updateDisplay(0);
                    startBtn.disabled = false;
                    startBtn.textContent = "Start";
                    pauseBtn.disabled = true;
                    minutesInput.disabled = false;
                    minutesInput.value = "0";
                    isPaused = false;
                }

                startBtn.addEventListener("click", startTimer);
                pauseBtn.addEventListener("click", pauseTimer);
                resetBtn.addEventListener("click", resetTimer);

                presetBtns.forEach(btn => {
                    btn.addEventListener("click", () => {
                        minutesInput.value = btn.dataset.minutes;
                        resetTimer();
                    });
                });
            }
        },
        "Gallery": {
            create: (imageSrc) => {
                return `
            <div class="image-viewer">
              <img src="${imageSrc}" alt="No file opened" style="max-width: 100%; max-height: 100%;" />
            </div>`;
            },
        },
        "Creator": {
            create: () => {
                window.open("https://itsharshitgoat.github.io/Website/", "_blank");
                return `<div class="codedex">Redirecting to creator's Website...</div>`;
            },
        },
        "Arcade": {
            create: () => {
                return `
                    <div class="game-container">
                        <div class="game-instructions">Press SPACE to start/pause. Use arrow keys to move.</div>
                        <canvas id="snake"></canvas>
                    </div>`;
            },
            init: (window) => {
                const canvas = window.querySelector("#snake");
                if (!canvas) {
                    console.error("Canvas with id 'snake' not found.");
                    return;
                }
                const ctx = canvas.getContext("2d");
                const gridSize = 20;
                let snake = [{ x: 10, y: 10 }];
                let food = { x: 15, y: 15 };
                let direction = "right";
                let score = 0;
                let gameRunning = false;
                let gameLoop;

                canvas.width = 400;
                canvas.height = 400;

                document.addEventListener("keydown", (e) => {
                    if (e.code === "Space" && window.style.zIndex === (windowManager.zIndex - 1).toString()) {
                        e.preventDefault();
                        gameRunning = !gameRunning;
                        if (gameRunning) {
                            gameLoop = setInterval(() => {
                                updateGame();
                                drawGame();
                            }, 100);
                        } else {
                            clearInterval(gameLoop);
                        }
                    }
                    if (gameRunning) {
                        switch (e.key.toLowerCase()) {
                            case "w":
                                if (direction !== "down") direction = "up";
                                break;
                            case "s":
                                if (direction !== "up") direction = "down";
                                break;
                            case "a":
                                if (direction !== "right") direction = "left";
                                break;
                            case "d":
                                if (direction !== "left") direction = "right";
                                break;
                        }
                    }
                });

                function drawGame() {
                    ctx.fillStyle = "black";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    ctx.fillStyle = "lime";
                    snake.forEach((segment) => {
                        ctx.fillRect(
                            segment.x * gridSize,
                            segment.y * gridSize,
                            gridSize - 2,
                            gridSize - 2
                        );
                    });

                    ctx.fillStyle = "red";
                    ctx.fillRect(
                        food.x * gridSize,
                        food.y * gridSize,
                        gridSize - 2,
                        gridSize - 2
                    );

                    ctx.fillStyle = "white";
                    ctx.font = "20px Arial";
                    ctx.fillText(`Score: ${score}`, 10, 30);
                }

                function updateGame() {
                    const head = { ...snake[0] };

                    switch (direction) {
                        case "up":
                            head.y--;
                            break;
                        case "down":
                            head.y++;
                            break;
                        case "left":
                            head.x--;
                            break;
                        case "right":
                            head.x++;
                            break;
                    }

                    if (
                        head.x < 0 ||
                        head.x >= canvas.width / gridSize ||
                        head.y < 0 ||
                        head.y >= canvas.height / gridSize
                    ) {
                        return gameOver();
                    }

                    if (
                        snake.some(
                            (segment) => segment.x === head.x && segment.y === head.y
                        )
                    ) {
                        return gameOver();
                    }

                    snake.unshift(head);

                    if (head.x === food.x && head.y === food.y) {
                        score += 10;
                        spawnFood();
                    } else {
                        snake.pop();
                    }
                }

                function spawnFood() {
                    food = {
                        x: Math.floor(Math.random() * (canvas.width / gridSize)),
                        y: Math.floor(Math.random() * (canvas.height / gridSize)),
                    };

                    if (
                        snake.some(
                            (segment) => segment.x === food.x && segment.y === food.y
                        )
                    ) {
                        spawnFood();
                    }
                }

                function gameOver() {
                    clearInterval(gameLoop);
                    showModal(`
                        <h3>Game Over!</h3>
                        <p>Your Score: ${score}</p>
                        <button id="modal-close-btn">Close</button>
                    `);
                    document.getElementById("modal-close-btn").onclick = () => {
                        hideModal();
                        snake = [{ x: 10, y: 10 }];
                        direction = "right";
                        score = 0;
                        spawnFood();
                        drawGame();
                        gameRunning = false;
                    };
                }

                drawGame();
            },
        },
        Messenger: {
            create: () => {
                return `
        <div class="messenger-app">
            <div class="messenger-box">
                <div class="messenger-title">New Message</div>
                <form action="https://formsubmit.co/itsharshitgoat@gmail.com" method="POST">
                    <div class="messenger-input-group">
                        <label for="name">From:</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    
                    <div class="messenger-input-group">
                        <label for="email">Reply To:</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    
                    <div class="messenger-input-group">
                        <label for="message">Message:</label>
                        <textarea id="message" name="message" rows="6" required></textarea>
                    </div>
                    
                    <button type="submit" class="messenger-btn">Send Message</button>
                </form>
            </div>
        </div>`;
            },
            init: (window) => {
                const style = document.createElement('style');
                style.textContent = `
            .messenger-app {
                padding: 15px;
                background: var(--window-bg);
                font-family: 'MS Sans Serif', sans-serif;
                color: #000;
            }

            .messenger-box {
                border: 2px solid var(--button-color);
                background: #fff;
                box-shadow: inset 1px 1px 0 #fff, inset -1px -1px 0 #888;
            }

            .messenger-title {
                background: var(--window-title-color);
                color: white;
                padding: 6px 10px;
                font-weight: bold;
                text-shadow: 1px 1px #000;
            }

            .messenger-input-group {
                margin: 15px;
            }

            .messenger-input-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }

            .messenger-input-group input,
            .messenger-input-group textarea {
                width: calc(100% - 16px);
                padding: 8px;
                border: 2px inset #fff;
                background: #fff;
                font-family: 'MS Sans Serif', sans-serif;
                font-size: 14px;
                box-shadow: inset 1px 1px 3px rgba(0,0,0,0.2);
            }

            .messenger-input-group textarea {
                resize: vertical;
                min-height: 100px;
            }

            .messenger-btn {
                margin: 15px;
                padding: 8px 16px;
                background: var(--button-color);
                border: 2px outset #fff;
                color: #000;
                font-family: 'MS Sans Serif', sans-serif;
                font-weight: bold;
                cursor: pointer;
                width: calc(100% - 30px);
                text-align: center;
                font-size: 14px;
            }

            .messenger-btn:hover {
                background: var(--window-title-color);
                color: #fff;
            }

            .messenger-btn:active {
                border-style: inset;
                padding: 9px 15px 7px 17px;
            }
        `;
                document.head.appendChild(style);

                const form = window.querySelector('form');
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    form.submit();
                    showModal(`
                <h3>Message Sent!</h3>
                <p>Your message has been sent successfully.</p>
                <button id="modal-close-btn">Close</button>
            `);
                    document.getElementById("modal-close-btn").onclick = hideModal;
                });
            }
        },
        "Tweak": {
            create: () => {
                return `
                <div class="settings">
                    <div class="settings-section">
                        <h3>System Colors</h3>
                        <div class="color-grid">
                            <div class="color-option">
                                <label for="button-color">Button Color:</label>
                                <input type="color" id="button-color" name="button-color" value="#c0c0c0">
                            </div>
                            <div class="color-option">
                                <label for="taskbar-color">Taskbar Color:</label>
                                <input type="color" id="taskbar-color" name="taskbar-color" value="#d2a4a4">
                            </div>
                            <div class="color-option">
                                <label for="window-title-color">Window Title Color:</label>
                                <input type="color" id="window-title-color" name="window-title-color" value="#f2426b">
                            </div>
                            <div class="color-option">
                                <label for="close-btn-color">Close Button Color:</label>
                                <input type="color" id="close-btn-color" name="close-btn-color" value="#eeeb12">
                            </div>
                            <div class="color-option">
                                <label for="min-btn-color">Minimize Button Color:</label>
                                <input type="color" id="min-btn-color" name="min-btn-color" value="#c0c0c0">
                            </div>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>Date & Time</h3>
                        <div class="date-settings">                            
                            <label for="custom-year">Set Year:</label>
                            <input type="number" id="custom-year" min="1970" max="2100" value="1999">
                        </div>
                    </div>
                    <button id="save-settings-btn">Save Settings</button>
                </div>`;
            },
            init: (window) => {
                const inputs = {
                    buttonColor: window.querySelector("#button-color"),
                    taskbarColor: window.querySelector("#taskbar-color"),
                    windowTitleColor: window.querySelector("#window-title-color"),
                    closeBtnColor: window.querySelector("#close-btn-color"),
                    minBtnColor: window.querySelector("#min-btn-color"),
                    customYear: window.querySelector("#custom-year"),
                };

                const saveBtn = window.querySelector("#save-settings-btn");

                saveBtn.onclick = () => {
                    Object.entries(inputs).forEach(([key, input]) => {
                        updateColor(key, input.value);
                    });

                    checkY2K(inputs.customYear.value);

                    showModal(`
                    <h3>Success</h3>
                    <p>Settings have been saved.</p>
                    <button id="modal-close-btn">Close</button>
                `);
                    document.getElementById("modal-close-btn").onclick = hideModal;
                };

                function updateColor(key, value) {
                    const cssVarMap = {
                        buttonColor: "--button-color",
                        taskbarColor: "--taskbar-color",
                        windowTitleColor: "--window-title-color",
                        closeBtnColor: "--close-btn-color",
                        minBtnColor: "--min-btn-color",
                    };

                    if (cssVarMap[key]) {
                        document.documentElement.style.setProperty(cssVarMap[key], value);
                    }
                }

                function checkY2K(year) {
                    if (year === "2007") {
                        triggerY2KEvent();
                    }
                }

                function createFireworks() {
                    const fireworksContainer = document.querySelector(".fireworks");
                    const canvas = document.createElement("canvas");
                    fireworksContainer.appendChild(canvas);
                    const ctx = canvas.getContext("2d");
                    canvas.width = fireworksContainer.offsetWidth;
                    canvas.height = fireworksContainer.offsetHeight;

                    window.addEventListener("resize", () => {
                        canvas.width = fireworksContainer.offsetWidth;
                        canvas.height = fireworksContainer.offsetHeight;
                    });

                    const particles = [];
                    const fireworks = [];
                    const gravity = 0.05;

                    class Particle {
                        constructor(x, y, color) {
                            this.x = x;
                            this.y = y;
                            this.radius = 2;
                            this.color = color;
                            this.speed = Math.random() * 3 + 1;
                            this.angle = Math.random() * Math.PI * 2;
                            this.velocityX = Math.cos(this.angle) * this.speed;
                            this.velocityY = Math.sin(this.angle) * this.speed;
                            this.alpha = 1;
                        }

                        update() {
                            this.velocityY += gravity;
                            this.x += this.velocityX;
                            this.y += this.velocityY;
                            this.alpha -= 0.01;
                        }

                        draw() {
                            ctx.save();
                            ctx.globalAlpha = this.alpha;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                            ctx.fillStyle = this.color;
                            ctx.fill();
                            ctx.restore();
                        }
                    }

                    class Firework {
                        constructor(x, y) {
                            this.x = x;
                            this.y = y;
                            this.targetY = (Math.random() * canvas.height) / 2;
                            this.exploded = false;
                            this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
                        }

                        update() {
                            this.y -= 2;
                            if (this.y <= this.targetY && !this.exploded) {
                                this.exploded = true;
                                this.explode();
                            }
                        }

                        explode() {
                            const particleCount = 100;
                            new Audio("sfx/blast.mp3").play();
                            for (let i = 0; i < particleCount; i++) {
                                particles.push(new Particle(this.x, this.y, this.color));
                            }
                        }

                        draw() {
                            if (!this.exploded) {
                                ctx.beginPath();
                                ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                                ctx.fillStyle = this.color;
                                ctx.fill();
                            }
                        }
                    }

                    function launchFirework() {
                        const x = Math.random() * canvas.width;
                        const y = canvas.height;
                        fireworks.push(new Firework(x, y));
                    }

                    function animate() {
                        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        fireworks.forEach((firework, index) => {
                            firework.update();
                            firework.draw();
                            if (firework.exploded) {
                                fireworks.splice(index, 1);
                            }
                        });

                        particles.forEach((particle, index) => {
                            particle.update();
                            particle.draw();
                            if (particle.alpha <= 0) {
                                particles.splice(index, 1);
                            }
                        });

                        requestAnimationFrame(animate);
                    }

                    launchFirework();
                    setInterval(launchFirework, 500);
                    animate();
                }

                function triggerY2KEvent() {
                    const errors = [
                        "CRITICAL ERROR: System time corruption detected",
                        "WARNING: Date overflow imminent",
                        "FATAL ERROR: Memory allocation failed",
                        "ERROR: Operating system crash detected",
                        "SYSTEM FAILURE: Time paradox detected",
                    ];
                    let errorIndex = 0;

                    function showNextError() {
                        if (errorIndex < errors.length) {
                            showModal(`
                            <h3 style="color:red">SYSTEM ERROR</h3>
                            <p>${errors[errorIndex]}</p>
                            <div class="error-code">Code: Harshit WebOS-${Math.floor(
                                Math.random() * 9999
                            )}</div>
                        `);
                            const errorSound = new Audio("sfx/error.mp3");
                            errorSound.play().catch(() => { });
                            errorIndex++;
                            setTimeout(showNextError, 1000);
                        } else {
                            hideModal();
                            startDramaticSequence();
                        }
                    }

                    function startDramaticSequence() {
                        const messages = [
                            { text: "But wait", delay: 1000 },
                            { text: "But wait.", delay: 1000 },
                            { text: "But wait..", delay: 1000 },
                            { text: "But wait...", delay: 2000 },
                        ];
                        let messageIndex = 0;

                        function showMessage() {
                            if (messageIndex < messages.length) {
                                document.body.innerHTML = `
                                <div style="color:black; font-family:monospace; font-size:24px; text-align:center; margin-top:40vh;">
                                    ${messages[messageIndex].text}
                                </div>
                            `;
                                messageIndex++;
                                setTimeout(showMessage, messages[messageIndex - 1].delay);
                            } else {
                                startBlackout();
                            }
                        }
                        showMessage();
                    }

                    function startBlackout() {
                        document.body.style.transition = "all 1s";
                        document.body.style.background = "#000";
                        document.body.style.backgroundImage = "none";
                        document.body.innerHTML = "";

                        setTimeout(showCelebration, 5000);

                        new Audio("sfx/grand.mp3").play();
                    }

                    function showCelebration() {
                        document.body.innerHTML = `
        <div class="y2k-celebration" style="
            text-align: center; 
            padding-top: 10vh;
            position: relative;
            overflow: hidden;
            background: black;
            height: 100vh;
        ">
            <div class="fireworks" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
            "></div>
            <div class="celebration-text" style="
                position: relative;
                z-index: 2;
                pointer-events: none;
            ">
                <h1 style="
                    color: gold; 
                    font-size: 48px; 
                    text-shadow: 0 0 10px #fff;
                    opacity: 0;
                    transition: opacity 3s;
                ">Welcome to 2007!</h1>
                <h2 style="
                    color: silver;
                    opacity: 0;
                    transition: opacity 3s;
                    transition-delay: 2s;
                    margin-top: 20px;
                ">Fun Fact — This was the year Harshit was born</h2>
            </div>
        </div>
    `;

                        setTimeout(() => {
                            const h1 = document.querySelector(".celebration-text h1");
                            const h2 = document.querySelector(".celebration-text h2");
                            if (h1) h1.style.opacity = "1";
                            if (h2) h2.style.opacity = "1";
                        }, 100);

                        createFireworks();

                        setTimeout(showEndScreen, 20000);
                    }

                    function showEndScreen() {
                        document.body.innerHTML = `
                        <div style="
                            text-align:center; 
                            padding-top:30vh; 
                            background:black; 
                            height:100vh;
                            transition: opacity 2s;
                        ">
                            <h1 style="color:white; font-size:36px;">Thanks for Useing!</h1>
                            <p style="color:#888;">Created by Harshit </p>
                            <button onclick="location.reload()" style="
                                margin-top:20px; 
                                padding:10px 20px;
                                background: #333;
                                color: white;
                                border: 1px solid #fff;
                                cursor: pointer;
                            ">
                                Let’s do a reboot
                            </button>
                        </div>
                    `;
                    }

                    showNextError();
                }
            },
        },
        "Timer": {
            create: () => {
                return `
            <div class="timer-app">
                <div class="timer-display">
                    <span id="minutes">00</span>:<span id="seconds">00</span>
                </div>
                <div class="timer-controls">
                    <div class="timer-input">
                        <label>Minutes:</label>
                        <input type="number" id="set-minutes" min="0" max="99" value="0">
                    </div>
                    <div class="timer-buttons">
                        <button id="start-timer" class="timer-btn">Start</button>
                        <button id="pause-timer" class="timer-btn" disabled>Pause</button>
                        <button id="reset-timer" class="timer-btn">Reset</button>
                    </div>
                </div>
                <div class="timer-presets">
                    <button class="preset-btn" data-minutes="1">1m</button>
                    <button class="preset-btn" data-minutes="3">3m</button>
                    <button class="preset-btn" data-minutes="5">5m</button>
                    <button class="preset-btn" data-minutes="10">10m</button>
                </div>
            </div>`;
            },
            init: (window) => {
                const minutesDisplay = window.querySelector("#minutes");
                const secondsDisplay = window.querySelector("#seconds");
                const minutesInput = window.querySelector("#set-minutes");
                const startBtn = window.querySelector("#start-timer");
                const pauseBtn = window.querySelector("#pause-timer");
                const resetBtn = window.querySelector("#reset-timer");
                const presetBtns = window.querySelectorAll(".preset-btn");

                let timeLeft = 0;
                let timerId = null;
                let isPaused = false;

                function updateDisplay(totalSeconds) {
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds % 60;
                    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
                    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
                }

                function startTimer() {
                    if (timeLeft === 0) {
                        timeLeft = parseInt(minutesInput.value) * 60;
                    }

                    if (timeLeft > 0 && !timerId) {
                        startBtn.disabled = true;
                        pauseBtn.disabled = false;
                        minutesInput.disabled = true;

                        timerId = setInterval(() => {
                            timeLeft--;
                            updateDisplay(timeLeft);

                            if (timeLeft === 0) {
                                clearInterval(timerId);
                                timerId = null;
                                const alarm = new Audio("sfx/error.mp3");
                                alarm.play();
                                showModal(`
                            <h3>Time's Up!</h3>
                            <p>Timer has finished.</p>
                            <button id="modal-close-btn">Close</button>
                        `);
                                document.getElementById("modal-close-btn").onclick = hideModal;
                                resetTimer();
                            }
                        }, 1000);
                    }
                }

                function pauseTimer() {
                    if (timerId) {
                        clearInterval(timerId);
                        timerId = null;
                        startBtn.disabled = false;
                        startBtn.textContent = "Resume";
                        pauseBtn.disabled = true;
                        isPaused = true;
                    }
                }

                function resetTimer() {
                    clearInterval(timerId);
                    timerId = null;
                    timeLeft = 0;
                    updateDisplay(0);
                    startBtn.disabled = false;
                    startBtn.textContent = "Start";
                    pauseBtn.disabled = true;
                    minutesInput.disabled = false;
                    minutesInput.value = "0";
                    isPaused = false;
                }

                startBtn.addEventListener("click", startTimer);
                pauseBtn.addEventListener("click", pauseTimer);
                resetBtn.addEventListener("click", resetTimer);

                presetBtns.forEach(btn => {
                    btn.addEventListener("click", () => {
                        minutesInput.value = btn.dataset.minutes;
                        resetTimer();
                    });
                });
            }
        },
        "Tunebox": {
            create: () => {
                return `
                <div class="music-player">
                    <div class="player-info">
                        <div class="track-art"></div>
                        <div class="track-info">
                            <div class="track-name">Select a track</div>
                            <div class="track-artist">Tunebox</div>
                        </div>
                    </div>
                    <div class="player-controls">
                        <div class="control-buttons">
                            <button class="prev-btn">⏮</button>
                            <button class="play-btn">▶</button>
                            <button class="next-btn">⏭</button>
                        </div>
                        <div class="progress-area">
                            <div class="progress-bar">
                                <div class="progress"></div>
                            </div>
                            <div class="time">
                                <span class="current">0:00</span>
                                <span class="duration">0:00</span>
                            </div>
                        </div>
                        <div class="volume-control">
                            <span>🔊</span>
                            <input type="range" min="0" max="100" value="100" class="volume-slider">
                        </div>
                    </div>
                    <div class="playlist">
                        <div class="playlist-item" data-track="music/track1.mp3">Track 1</div>
                        <div class="playlist-item" data-track="music/track2.mp3">Track 2</div>
                        <div class="playlist-item" data-track="music/track3.mp3">Track 3</div>
                    </div>
                </div>`;
            },
            init: (window) => {
                const player = window.querySelector('.music-player');
                const audio = new Audio();
                const playBtn = player.querySelector('.play-btn');
                const prevBtn = player.querySelector('.prev-btn');
                const nextBtn = player.querySelector('.next-btn');
                const trackName = player.querySelector('.track-name');
                const progress = player.querySelector('.progress');
                const progressBar = player.querySelector('.progress-bar');
                const currentTime = player.querySelector('.current');
                const duration = player.querySelector('.duration');
                const volumeSlider = player.querySelector('.volume-slider');
                const playlist = player.querySelector('.playlist');
                
                let isPlaying = false;
                let currentTrack = 0;
                const tracks = Array.from(player.querySelectorAll('.playlist-item'));

                // Style for active track
                function updateActiveTrack() {
                    tracks.forEach(track => track.classList.remove('active'));
                    tracks[currentTrack].classList.add('active');
                }

                // Play/Pause function
                function togglePlay() {
                    if (isPlaying) {
                        audio.pause();
                        playBtn.textContent = '▶';
                    } else {
                        audio.play();
                        playBtn.textContent = '⏸';
                    }
                    isPlaying = !isPlaying;
                }

                // Load and play track
                function loadTrack(trackIndex) {
                    const track = tracks[trackIndex];
                    audio.src = track.dataset.track;
                    trackName.textContent = track.textContent;
                    audio.load();
                    if (isPlaying) {
                        audio.play();
                    }
                    updateActiveTrack();
                }

                // Event listeners
                playBtn.addEventListener('click', togglePlay);

                prevBtn.addEventListener('click', () => {
                    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
                    loadTrack(currentTrack);
                });

                nextBtn.addEventListener('click', () => {
                    currentTrack = (currentTrack + 1) % tracks.length;
                    loadTrack(currentTrack);
                });

                // Playlist click handler
                playlist.addEventListener('click', (e) => {
                    const trackItem = e.target.closest('.playlist-item');
                    if (trackItem) {
                        currentTrack = tracks.indexOf(trackItem);
                        loadTrack(currentTrack);
                        if (!isPlaying) {
                            togglePlay();
                        }
                    }
                });

                // Progress bar handling
                progressBar.addEventListener('click', (e) => {
                    const width = progressBar.clientWidth;
                    const clickX = e.offsetX;
                    const duration = audio.duration;
                    audio.currentTime = (clickX / width) * duration;
                });

                // Volume control
                volumeSlider.addEventListener('input', (e) => {
                    audio.volume = e.target.value / 100;
                });

                // Audio event listeners
                audio.addEventListener('timeupdate', () => {
                    const currentTimeVal = audio.currentTime;
                    const durationVal = audio.duration;
                    
                    const progressPercent = (currentTimeVal / durationVal) * 100;
                    progress.style.width = `${progressPercent}%`;

                    const currentMin = Math.floor(currentTimeVal / 60);
                    const currentSec = Math.floor(currentTimeVal % 60);
                    currentTime.textContent = `${currentMin}:${currentSec.toString().padStart(2, '0')}`;

                    if (!isNaN(durationVal)) {
                        const durationMin = Math.floor(durationVal / 60);
                        const durationSec = Math.floor(durationVal % 60);
                        duration.textContent = `${durationMin}:${durationSec.toString().padStart(2, '0')}`;
                    }
                });

                audio.addEventListener('ended', () => {
                    currentTrack = (currentTrack + 1) % tracks.length;
                    loadTrack(currentTrack);
                });

                // Load first track
                loadTrack(currentTrack);
            }
        },
    };
}

class Calculator {
    constructor() {
        this.display = "";
        this.previousValue = null;
        this.operation = null;
        this.newNumber = true;
    }

    clear() {
        this.display = "";
        this.previousValue = null;
        this.operation = null;
        this.newNumber = true;
        return "0";
    }

    calculate() {
        if (this.previousValue === null || this.operation === null)
            return this.display;

        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.display);
        let result = 0;

        switch (this.operation) {
            case "+":
                result = prev + current;
                break;
            case "-":
                result = prev - current;
                break;
            case "*":
                result = prev * current;
                break;
            case "/":
                result = current !== 0 ? prev / current : "Error";
                break;
        }

        this.previousValue = null;
        this.operation = null;
        this.newNumber = true;
        return result.toString();
    }

    handleInput(value) {
        if (value === "C") {
            return this.clear();
        }

        if (value === "=") {
            this.display = this.calculate();
            return this.display;
        }

        if ("+-*/".includes(value)) {
            if (this.previousValue !== null) {
                this.display = this.calculate();
            }
            this.previousValue = this.display;
            this.operation = value;
            this.newNumber = true;
            return this.display;
        }

        if (this.newNumber) {
            this.display = value;
            this.newNumber = false;
        } else {
            this.display += value;
        }
        return this.display;
    }
}

class WindowManager {
    constructor() {
        this.windows = new Map();
        this.zIndex = 100;
        this.taskbarItems = new Map();
        this.setupTaskbar();
    }

    setupTaskbar() {
        const taskbar = document.getElementById('taskbar');
        const taskbarApps = document.createElement('div');
        taskbarApps.className = 'taskbar-apps';
        taskbar.insertBefore(taskbarApps, taskbar.firstChild);
    }

    createTaskbarItem(win, title) {
        const taskbarApps = document.querySelector('.taskbar-apps');
        const item = document.createElement('div');
        item.className = 'taskbar-item';
        
        const icon = document.createElement('div');
        icon.className = 'taskbar-icon';
        icon.style.backgroundImage = `url(icons/${this.getAppIcon(title)})`;
        
        const label = document.createElement('span');
        label.textContent = title;
        
        item.appendChild(icon);
        item.appendChild(label);
        
        item.addEventListener('click', () => {
            if (win.style.display === 'none') {
                this.restoreWindow(win);
            } else {
                this.minimizeWindow(win);
            }
        });
        
        taskbarApps.appendChild(item);
        this.taskbarItems.set(win, item);
    }

    getAppIcon(title) {
        const iconMap = {
            "File Nest": "file.png",
            "Web Start": "browser.png",
            "Text Pad": "notepad.png",
            "NumPad": "calculator.png",
            "Canvas": "paint.png",
            "Gallery": "picture.png",
            "Creator": "code.png",
            "Arcade": "snake.png",
            "Tweak": "gear.png",
            "Messenger": "chat.png",
            "Timer": "time.png",
            "Tunebox": "music.png"
        };
        return iconMap[title] || "default.png";
    }

    minimizeWindow(win) {
        const taskbarItem = this.taskbarItems.get(win);
        if (!taskbarItem) return;

        const winRect = win.getBoundingClientRect();
        const taskbarRect = taskbarItem.getBoundingClientRect();

        // Create a clone for animation
        const clone = win.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.left = winRect.left + 'px';
        clone.style.top = winRect.top + 'px';
        clone.style.width = winRect.width + 'px';
        clone.style.height = winRect.height + 'px';
        clone.style.margin = '0';
        clone.style.transition = 'all 0.3s ease-in-out';
        clone.style.zIndex = '10000';
        clone.style.pointerEvents = 'none';
        document.body.appendChild(clone);

        // Start animation
        requestAnimationFrame(() => {
            clone.style.transform = `translate(${taskbarRect.left - winRect.left}px, ${taskbarRect.top - winRect.top}px) scale(0.2)`;
            clone.style.opacity = '0';
        });

        // Hide original window
        win.style.display = 'none';
        taskbarItem.classList.add('active');

        // Remove clone after animation
        setTimeout(() => {
            clone.remove();
        }, 300);
    }

    restoreWindow(win) {
        const taskbarItem = this.taskbarItems.get(win);
        if (!taskbarItem) return;

        const taskbarRect = taskbarItem.getBoundingClientRect();
        const winRect = {
            left: parseInt(win.style.left),
            top: parseInt(win.style.top),
            width: win.offsetWidth,
            height: win.offsetHeight
        };

        // Create clone for animation
        const clone = win.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.left = taskbarRect.left + 'px';
        clone.style.top = taskbarRect.top + 'px';
        clone.style.width = taskbarRect.width + 'px';
        clone.style.height = taskbarRect.height + 'px';
        clone.style.transform = 'scale(0.2)';
        clone.style.opacity = '0';
        clone.style.transition = 'all 0.3s ease-in-out';
        clone.style.zIndex = '10000';
        clone.style.pointerEvents = 'none';
        document.body.appendChild(clone);

        // Start animation
        requestAnimationFrame(() => {
            clone.style.transform = 'scale(1)';
            clone.style.opacity = '1';
            clone.style.left = winRect.left + 'px';
            clone.style.top = winRect.top + 'px';
            clone.style.width = winRect.width + 'px';
            clone.style.height = winRect.height + 'px';
        });

        // Show original window after animation
        setTimeout(() => {
            win.style.display = 'flex';
            win.style.zIndex = this.zIndex++;
            clone.remove();
        }, 300);

        taskbarItem.classList.remove('active');
    }

    createWindow(title, content) {
        const win = document.createElement("div");
        win.className = "window";
        win.style.zIndex = this.zIndex++;
        win.style.left = "50px";
        win.style.top = "50px";

        win.innerHTML = `
            <div class="window-title">
                <span>${title}</span>
                <div class="window-controls">
                    <div class="window-button minimize-button"></div>
                    <div class="window-button close-button"></div>
                </div>
            </div>
            <div class="window-content">${content}</div>
        `;

        document.getElementById("desktop").appendChild(win);
        this.makeDraggable(win);
        this.setupControls(win);
        this.windows.set(win, title);
        this.createTaskbarItem(win, title);

        if (AppManager.apps[title]?.init) {
            AppManager.apps[title].init(win);
        }

        return win;
    }

    makeDraggable(win) {
        const title = win.querySelector(".window-title");
        let pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;
        let dragTimeout = null;

        title.onmousedown = dragMouseDown;

        const self = this;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDragChoppy;
            win.style.zIndex = self.zIndex++;
        }

        function elementDrag(e) {
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            win.style.top = win.offsetTop - pos2 + "px";
            win.style.left = win.offsetLeft - pos1 + "px";
        }

        function elementDragChoppy(e) {
            if (!dragTimeout) {
                dragTimeout = setTimeout(() => {
                    elementDrag(e);
                    dragTimeout = null;
                }, 50);
            }
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            if (dragTimeout) {
                clearTimeout(dragTimeout);
                dragTimeout = null;
            }
        }
    }

    setupControls(win) {
        win.querySelector(".close-button").onclick = () => {
            const title = this.windows.get(win);
            if (title === "Tunebox") {
                const audio = win.querySelector('.music-player audio') || 
                             Array.from(win.querySelectorAll('audio')).pop();
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
            const taskbarItem = this.taskbarItems.get(win);
            if (taskbarItem) {
                taskbarItem.remove();
                this.taskbarItems.delete(win);
            }
            win.remove();
            this.windows.delete(win);
            const icon = document.querySelector(`.icon[data-app="${title}"]`);
            if (icon) {
                icon.style.backgroundColor = "";
            }
        };

        win.querySelector(".minimize-button").onclick = () => {
            this.minimizeWindow(win);
        };
    }

    refreshAppWindow(appName) {
        this.windows.forEach((title, win) => {
            if (title === appName) {
                win.querySelector(".window-content").innerHTML =
                    AppManager.apps[appName].create();
                AppManager.apps[appName].init(win);
            }
        });
    }
}

const windowManager = new WindowManager();

const desktopIcons = [
    { name: "File Nest", icon: "icons/file.png" },
    { name: "Tweak", icon: "icons/gear.png" },
    { name: "Text Pad", icon: "icons/notepad.png" },
    { name: "NumPad", icon: "icons/calculator.png" },
    { name: "Canvas", icon: "icons/paint.png" },
    { name: "Timer", icon: "icons/time.png" },
    { name: "Web Start", icon: "icons/browser.png" },
    { name: "Gallery", icon: "icons/picture.png" },
    { name: "Tunebox", icon: "icons/music.png" },
    { name: "Arcade", icon: "icons/snake.png" },
    { name: "Messenger", icon: "icons/chat.png" },
    { name: "Creator", icon: "icons/code.png" },
];

const iconsPerColumn = 6;
const columns = Math.ceil(desktopIcons.length / iconsPerColumn);

document.getElementById("desktop").innerHTML = Array(columns)
    .fill()
    .map(
        (_, colIndex) => `
        <div class="icon-column" style="position: absolute; left: ${colIndex * 100
            }px;">
            ${desktopIcons
                .slice(colIndex * iconsPerColumn, (colIndex + 1) * iconsPerColumn)
                .map(
                    ({ name, icon }) => `
                    <div class="icon" data-app="${name}">
                        <div class="icon-image" style="background-image: url('${icon}')"></div>
                        <span>${name}</span>
                    </div>
                `
                )
                .join("")}
        </div>
    `
    )
    .join("");

document.querySelectorAll(".icon").forEach((icon) => {
    icon.addEventListener("click", () => {
        const appName = icon.dataset.app;
        let existingWindow = null;

        windowManager.windows.forEach((title, win) => {
            if (title === appName) {
                existingWindow = win;
            }
        });

        if (existingWindow) {
            existingWindow.style.display = "block";
            existingWindow.style.zIndex = windowManager.zIndex++;
        } else {
            const app = AppManager.apps[appName];
            let content = app.create();

            icon.style.backgroundColor = "rgba(255,255,255,0.2)";
            windowManager.createWindow(appName, content);
        }
    });
});

function showModal(contentHTML) {
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modal-body");
    modalBody.innerHTML = contentHTML;
    modal.style.display = "block";
}

function hideModal() {
    const modal = document.getElementById("modal");
    modal.style.display = "none";
}

document.getElementById("modal-close").onclick = hideModal;

window.onclick = function (event) {
    const modal = document.getElementById("modal");
    if (event.target === modal) {
        hideModal();
    }
};

function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString();
    const defaultDate = new Date(now);
    defaultDate.setFullYear(1999);
    const date = window.customDate || defaultDate.toLocaleDateString();
    document.querySelector(".taskbar-right").innerHTML = `
        <div>${time}</div>
        <div>${date}</div>
    `;
}

const taskbarRight = document.createElement("div");
taskbarRight.className = "taskbar-right";
document.getElementById("taskbar").appendChild(taskbarRight);

setInterval(updateClock, 1000);
updateClock();

function openWelcomeFile() {
    const notepadContent = AppManager.apps["Text Pad"].create();
    const notepadWindow = windowManager.createWindow("welcome.txt", notepadContent);
    AppManager.apps["Text Pad"].init(notepadWindow, true);

    // Set the content after initialization
    const content = fileSystem.loadFile("notes/welcome.txt");
    const textarea = notepadWindow.querySelector(".notepad-content");
    if (textarea) {
        textarea.value = content;
        textarea.disabled = true;
    }
}

// Then in the boot screen code, update the timing:
const bootScreen = document.getElementById("boot-screen");
let bootText = bootScreen.innerHTML;
bootScreen.innerHTML = "";

let charIndex = 0;
const typeSpeed = 10;

function typeText() {
    if (charIndex < bootText.length) {
        bootScreen.innerHTML += bootText.charAt(charIndex);
        charIndex++;
        setTimeout(typeText, typeSpeed);
    } else {
        const boot = new Audio("sfx/boot.mp3");
        setTimeout(() => {
            bootScreen.classList.add("fade-out");
            boot.play();
            setTimeout(() => {
                bootScreen.style.display = "none";  // Ensure boot screen is hidden
                openWelcomeFile();  // Open welcome file after boot screen is hidden
            }, 1500);
        }, 1000);
    }
}

setTimeout(typeText, 500);