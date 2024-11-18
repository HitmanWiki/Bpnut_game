// Initialize Telegram WebApp API
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) {
    tg.ready(); // Initialize Telegram WebApp
    console.log("Telegram WebApp API initialized");

    // Main Button to restart or submit data
    tg.MainButton.text = "Restart Game";
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
        location.reload(); // Restart game
    });
} else {
    console.warn("Telegram WebApp API not found. Running in a non-Telegram context.");
}

// Phaser Game Configuration
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#88CFFA",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    plugins: {
        scene: [
            {
                key: 'rexvirtualjoystickplugin',
                plugin: window.rexvirtualjoystickplugin,
                mapping: 'rexVirtualJoystick', // Adds joystick to the scene
            },
        ],
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

const game = new Phaser.Game(config);

let score = 0; // Initialize score variable

function preload() {
    // Load assets
    this.load.image("background", "assets/background.png");
    this.load.spritesheet("squirrel", "assets/squirrel_spritesheet.png", {
        frameWidth: 100,
        frameHeight: 100,
    });
    this.load.image("coin", "assets/coin.png");
    this.load.image("obstacle", "assets/obstacle.png");
    this.load.image("powerup", "assets/powerup_acorn.png");
    this.load.image("monster", "assets/monster.png");

    this.load.audio("jump", "assets/sounds/jump.wav");
    this.load.audio("collect", "assets/sounds/collect.mp3");
    this.load.audio("hit", "assets/sounds/hit.wav");

    // Handle asset loading errors
    this.load.on("fileerror", (file) => {
        console.error(`Error loading file: ${file.key} (${file.url})`);
    });
}

function create() {
    // Add scrolling background
    this.background = this.add.tileSprite(400, 300, window.innerWidth, window.innerHeight, "background");

    // Add the squirrel character
    this.babypnut = this.physics.add.sprite(100, 300, "squirrel");
    this.babypnut.setCollideWorldBounds(true);

    // Add animations
    this.anims.create({
        key: "run",
        frames: this.anims.generateFrameNumbers("squirrel", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
    });
    this.anims.create({
        key: "jump",
        frames: this.anims.generateFrameNumbers("squirrel", { start: 4, end: 6 }),
        frameRate: 10,
        repeat: -1,
    });

    this.babypnut.play("run");

    // Add score text
    this.scoreText = this.add.text(10, 10, "Score: 0", { fontSize: "20px", fill: "#fff" });

    // Add virtual joystick for mobile
    this.joystick = this.rexVirtualJoystick.add(this, {
        x: 100,
        y: window.innerHeight - 100,
        radius: 50,
        base: this.add.circle(0, 0, 50, 0x888888),
        thumb: this.add.circle(0, 0, 25, 0xcccccc),
    });

    // Handle joystick movement
    this.joystick.on("update", () => {
        const cursorKeys = this.joystick.createCursorKeys();
        if (cursorKeys.up.isDown) this.babypnut.setVelocityY(-200);
        if (cursorKeys.down.isDown) this.babypnut.setVelocityY(200);
        if (cursorKeys.left.isDown) this.babypnut.setVelocityX(-200);
        if (cursorKeys.right.isDown) this.babypnut.setVelocityX(200);
    });

    // Add coin group
    this.coins = this.physics.add.group();
    this.time.addEvent({
        delay: 1000,
        callback: () => {
            const coin = this.coins.create(800, Phaser.Math.Between(50, 550), "coin");
            coin.setVelocityX(-200);
        },
        loop: true,
    });

    // Add obstacles
    this.obstacles = this.physics.add.group();
    this.time.addEvent({
        delay: 1500,
        callback: () => {
            const obstacle = this.obstacles.create(800, Phaser.Math.Between(50, 550), "obstacle");
            obstacle.setVelocityX(-300);
        },
        loop: true,
    });

    // Add collision detection
    this.physics.add.overlap(this.babypnut, this.coins, collectCoin, null, this);
    this.physics.add.collider(this.babypnut, this.obstacles, hitObstacle, null, this);

    // Add Telegram button to submit score
    if (tg) {
        tg.MainButton.text = "Submit Score";
        tg.MainButton.show();
        tg.MainButton.onClick(() => {
            tg.sendData(JSON.stringify({ score }));
        });
    }
}

function update() {
    // Scroll background
    this.background.tilePositionX += 5;
}

function collectCoin(player, coin) {
    coin.destroy();
    this.sound.play("collect");
    score += 10; // Increment score
    this.scoreText.setText("Score: " + score);
}

function hitObstacle(player, obstacle) {
    this.physics.pause(); // Stop all movements
    this.babypnut.setTint(0xff0000); // Change character color to red
    this.sound.play("hit");
    this.add.text(300, 250, "Game Over!", { fontSize: "40px", fill: "#fff" });

    if (tg) {
        tg.MainButton.text = "Restart Game";
        tg.MainButton.show();
    }
}
