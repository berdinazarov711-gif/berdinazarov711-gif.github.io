// Game Variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameState = {
    snake: [{x: 10, y: 10}],
    food: {x: 15, y: 15},
    powerUps: [],
    enemies: [],
    obstacles: [],
    direction: {x: 1, y: 0},
    nextDirection: {x: 1, y: 0},
    score: 0,
    level: 1,
    gameRunning: false,
    gamePaused: false,
    gameMode: 'classic',
    gridSize: 20,
    speed: 100,
    messages: []
};

// Messages from Berdi
const berdiMessages = {
    start: {
        emoji: '🐍',
        text: 'Merhaba! Cosmic Snake\'e hoş geldin. Başarılar!'
    },
    10: {
        emoji: '💪',
        text: 'Güzel başlangıç yapıyorsun! Devam et!'
    },
    50: {
        emoji: '🎯',
        text: 'Dikkatli oynuyorsun! Harika!'
    },
    100: {
        emoji: '⭐',
        text: 'Harika performans! Kendini geliştiriyorsun!'
    },
    200: {
        emoji: '🔥',
        text: 'Çok iyi! Bu seviyede az oyuncu kalıyor!'
    },
    300: {
        emoji: '👑',
        text: 'İnanılmaz! Gerçek bir uzman gibi oynuyorsun!'
    },
    500: {
        emoji: '🚀',
        text: 'Efsanevi performans! Harika iş çıkarıyorsun!'
    },
    gameOver: {
        emoji: '💭',
        text: 'Yanlış bir hamle... Tekrar dene! Başarıyı sen getireceksin!'
    },
    highScore: {
        emoji: '🎉',
        text: 'YENİ REKOR! Tebrikler! Harika bir başarı!'
    }
};

// High Scores
let highScores = JSON.parse(localStorage.getItem('cosmicSnakeHighScores')) || [];

// Resize Canvas
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const maxWidth = Math.min(600, container.offsetWidth - 40);
    canvas.width = maxWidth;
    canvas.height = maxWidth;
    gameState.gridSize = maxWidth / 30; // 30x30 grid
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Show Message
function showMessage(messageKey) {
    const message = berdiMessages[messageKey];
    if (!message) return;

    const messageBox = document.createElement('div');
    messageBox.className = 'message-box';
    messageBox.innerHTML = `
        <span class="emoji">${message.emoji}</span>
        <span>${message.text}</span>
    `;

    document.getElementById('messageContainer').appendChild(messageBox);

    // Auto remove after 4 seconds
    setTimeout(() => {
        messageBox.classList.add('fade-out');
        setTimeout(() => messageBox.remove(), 500);
    }, 4000);
}

// Game Start
function startGame() {
    if (gameState.gameRunning) return;

    gameState.gameRunning = true;
    gameState.gamePaused = false;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('modeSelect').disabled = true;

    showMessage('start');
    gameLoop();
}

// Pause Game
function pauseGame() {
    gameState.gamePaused = !gameState.gamePaused;
    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn.textContent = gameState.gamePaused ? '▶ Resume' : '⏸ Pause';
}

// Reset Game
function resetGame() {
    gameState = {
        snake: [{x: 10, y: 10}],
        food: {x: 15, y: 15},
        powerUps: [],
        enemies: [],
        obstacles: [],
        direction: {x: 1, y: 0},
        nextDirection: {x: 1, y: 0},
        score: 0,
        level: 1,
        gameRunning: false,
        gamePaused: false,
        gameMode: document.getElementById('modeSelect').value,
        gridSize: canvas.width / 30,
        speed: 100,
        messages: []
    };

    document.getElementById('playBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('pauseBtn').textContent = '⏸ Pause';
    document.getElementById('modeSelect').disabled = false;
    document.getElementById('score').textContent = '0';
    document.getElementById('level').textContent = '1';

    draw();
}

// Change Mode
function changeMode() {
    gameState.gameMode = document.getElementById('modeSelect').value;
    resetGame();
}

// Generate Food
function generateFood() {
    let food;
    let collision = true;
    while (collision) {
        food = {
            x: Math.floor(Math.random() * 30),
            y: Math.floor(Math.random() * 30)
        };
        collision = gameState.snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
    gameState.food = food;
}

// Generate Power-ups
function generatePowerUp() {
    if (Math.random() > 0.95) {
        const powerUpTypes = ['shield', 'speed', 'freeze', 'doublePoints'];
        const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        const powerUp = {
            x: Math.floor(Math.random() * 30),
            y: Math.floor(Math.random() * 30),
            type: type,
            active: true
        };
        gameState.powerUps.push(powerUp);
    }
}

// Game Loop
function gameLoop() {
    if (!gameState.gameRunning) return;

    setTimeout(() => {
        if (!gameState.gamePaused) {
            update();
        }
        draw();
        gameLoop();
    }, gameState.speed);
}

// Update Game State
function update() {
    // Update direction
    gameState.direction = gameState.nextDirection;

    // Calculate new head position
    const head = gameState.snake[0];
    const newHead = {
        x: head.x + gameState.direction.x,
        y: head.y + gameState.direction.y
    };

    // Check Boundaries
    if (gameState.gameMode !== 'endless') {
        if (newHead.x < 0 || newHead.x >= 30 || newHead.y < 0 || newHead.y >= 30) {
            endGame();
            return;
        }
    } else {
        // Endless mode: wrap around
        newHead.x = (newHead.x + 30) % 30;
        newHead.y = (newHead.y + 30) % 30;
    }

    // Check Self Collision
    if (gameState.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        endGame();
        return;
    }

    // Add new head
    gameState.snake.unshift(newHead);

    // Check Food Collision
    if (newHead.x === gameState.food.x && newHead.y === gameState.food.y) {
        gameState.score += 10;
        gameState.level = Math.floor(gameState.score / 100) + 1;
        gameState.speed = Math.max(50, 100 - gameState.level * 5);

        // Show appropriate message
        if (gameState.score === 10) showMessage(10);
        else if (gameState.score === 50) showMessage(50);
        else if (gameState.score === 100) showMessage(100);
        else if (gameState.score === 200) showMessage(200);
        else if (gameState.score === 300) showMessage(300);
        else if (gameState.score === 500) showMessage(500);

        generateFood();
        generatePowerUp();
    } else {
        gameState.snake.pop();
    }

    // Update UI
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
}

// End Game
function endGame() {
    gameState.gameRunning = false;
    document.getElementById('playBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('modeSelect').disabled = false;

    // Check High Score
    const isHighScore = gameState.score > (highScores[0]?.score || 0);

    // Save High Score
    highScores.unshift({
        score: gameState.score,
        level: gameState.level,
        mode: gameState.gameMode,
        date: new Date().toLocaleDateString()
    });
    highScores = highScores.slice(0, 5);
    localStorage.setItem('cosmicSnakeHighScores', JSON.stringify(highScores));

    showMessage('gameOver');
    if (isHighScore) {
        setTimeout(() => showMessage('highScore'), 1000);
    }

    updateLeaderboard();
}

// Update Leaderboard
function updateLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.innerHTML = '';

    if (highScores.length === 0) {
        leaderboard.innerHTML = '<div class="leaderboard-item">No scores yet</div>';
        return;
    }

    highScores.forEach((score, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span class="leaderboard-rank">#${index + 1}</span>
            <div>
                <strong>${score.score}</strong> pts • Level ${score.level} • ${score.mode}
            </div>
            <span class="leaderboard-score">${score.date}</span>
        `;
        leaderboard.appendChild(item);
    });
}

// Draw Game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = canvas.width / 30;
    for (let i = 0; i <= 30; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    // Draw Food (Apple)
    drawApple(gameState.food.x, gameState.food.y, gridSize);

    // Draw Snake
    gameState.snake.forEach((segment, index) => {
        if (index === 0) {
            // Head
            drawSnakeHead(segment.x, segment.y, gridSize);
        } else {
            // Body
            drawSnakeBody(segment.x, segment.y, gridSize, index);
        }
    });

    // Draw Power-ups
    gameState.powerUps.forEach(powerUp => {
        drawPowerUp(powerUp, gridSize);
    });

    // Draw Game Over Screen
    if (!gameState.gameRunning && gameState.score > 0) {
        drawGameOverScreen();
    }
}

// Draw Snake Head
function drawSnakeHead(x, y, size) {
    const posX = x * size + size / 2;
    const posY = y * size + size / 2;
    const radius = size / 2.5;

    // Gradient head
    const gradient = ctx.createRadialGradient(posX - 2, posY - 2, 0, posX, posY, radius);
    gradient.addColorStop(0, '#00ff88');
    gradient.addColorStop(1, '#00cc66');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(posX, posY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Glow effect
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(posX, posY, radius + 2, 0, Math.PI * 2);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#000';
    const eyeRadius = radius / 5;
    ctx.beginPath();
    ctx.arc(posX - 3, posY - 2, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(posX + 3, posY - 2, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
}

// Draw Snake Body
function drawSnakeBody(x, y, size, index) {
    const posX = x * size + size / 2;
    const posY = y * size + size / 2;
    const radius = size / 2.5 * (1 - index * 0.05);

    // Gradient body
    const gradient = ctx.createRadialGradient(posX - 1, posY - 1, 0, posX, posY, radius);
    gradient.addColorStop(0, '#00dd77');
    gradient.addColorStop(1, '#009944');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(posX, posY, radius, 0, Math.PI * 2);
    ctx.fill();
}

// Draw Apple
function drawApple(x, y, size) {
    const posX = x * size + size / 2;
    const posY = y * size + size / 2;
    const radius = size / 2.5;

    // Apple body
    const gradient = ctx.createRadialGradient(posX - 2, posY - 2, 0, posX, posY, radius);
    gradient.addColorStop(0, '#ff6666');
    gradient.addColorStop(1, '#cc0000');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(posX, posY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.strokeStyle = '#228822';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(posX, posY - radius - 2);
    ctx.lineTo(posX, posY - radius - 6);
    ctx.stroke();

    // Shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(posX - 2, posY - 2, radius / 3, 0, Math.PI * 2);
    ctx.fill();
}

// Draw Power-up
function drawPowerUp(powerUp, size) {
    const posX = powerUp.x * size + size / 2;
    const posY = powerUp.y * size + size / 2;
    const radius = size / 2.2;

    // Rotating star
    const angle = (Date.now() / 50) % (Math.PI * 2);
    ctx.save();
    ctx.translate(posX, posY);
    ctx.rotate(angle);

    // Glow
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 15;

    // Star shape
    ctx.fillStyle = '#ffff00';
    drawStar(0, 0, 5, radius, radius / 2);
    ctx.fill();

    ctx.restore();
}

// Draw Star Helper
function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
}

// Draw Game Over Screen
function drawGameOverScreen() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Game Over text
    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold ' + (canvas.width / 8) + 'px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + (canvas.width / 12) + 'px Poppins';
    ctx.fillText('Score: ' + gameState.score, canvas.width / 2, canvas.height / 2 + 20);

    // Level
    ctx.font = (canvas.width / 16) + 'px Poppins';
    ctx.fillText('Level: ' + gameState.level, canvas.width / 2, canvas.height / 2 + 50);
}

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    if (!gameState.gameRunning) return;

    const key = e.key.toLowerCase();
    const keyCode = e.keyCode;

    // Arrow keys
    if (keyCode === 37 || key === 'a') { // Left
        if (gameState.direction.x === 0) gameState.nextDirection = {x: -1, y: 0};
    } else if (keyCode === 38 || key === 'w') { // Up
        if (gameState.direction.y === 0) gameState.nextDirection = {x: 0, y: -1};
    } else if (keyCode === 39 || key === 'd') { // Right
        if (gameState.direction.x === 0) gameState.nextDirection = {x: 1, y: 0};
    } else if (keyCode === 40 || key === 's') { // Down
        if (gameState.direction.y === 0) gameState.nextDirection = {x: 0, y: 1};
    } else if (key === ' ') { // Space to pause
        pauseGame();
    }
});

// Initialize
updateLeaderboard();
draw();
