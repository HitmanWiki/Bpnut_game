// Initialize Telegram WebApp API
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) {
    tg.ready(); // Initialize Telegram WebApp
} else {
    console.warn("Telegram WebApp API not found. Running in a non-Telegram context.");
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#88CFFA",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

const game = new Phaser.Game(config);

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
    this.load.image("monster", "assets/cartoon_monster_enemy.png");

    // Load sounds
    this.load.audio("jump", "assets/sounds/jump.wav");
    this.load.audio("collect", "assets/sounds/collect.mp3");
    this.load.audio("hit", "assets/sounds/hit.wav");

    // Debug loading errors
    this.load.on("fileerror", (file) => {
        console.error(`Error loading file: ${file.key} (${file.url})`);
    });
}

function create() {
    // Add scrolling background
    this.background = this.add.tileSprite(400, 300, 800, 600, "background");

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

    // Add squirrel character
    this.babypnut = this.physics.add.sprite(100, 300, "squirrel");
    this.babypnut.setCollideWorldBounds(true);

    // Play "run" animation if it exists
    if (this.anims.exists("run")) {
        this.babypnut.play("run");
    } else {
        console.error("Run animation not found! Check the sprite sheet or animation setup.");
    }

    // Add score text
    this.score = 0;
    this.scoreText = this.add.text(10, 10, "Score: 0", { fontSize: "20px", fill: "#fff" });

    // Add keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();

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

    // Add obstacle group
    this.obstacles = this.physics.add.group();
    this.time.addEvent({
        delay: 1500,
        callback: () => {
            const obstacle = this.obstacles.create(800, Phaser.Math.Between(50, 550), "obstacle");
            obstacle.setVelocityX(-300);
        },
        loop: true,
    });

    // Add power-ups
    this.powerups = this.physics.add.group();
    this.time.addEvent({
        delay: 5000,
        callback: () => {
            const powerup = this.powerups.create(800, Phaser.Math.Between(50, 550), "powerup");
            powerup.setVelocityX(-150);
        },
        loop: true,
    });

    // Add monster enemies
    this.monsters = this.physics.add.group();
    this.time.addEvent({
        delay: 7000,
        callback: () => {
            const monster = this.monsters.create(800, Phaser.Math.Between(50, 550), "monster");
            monster.setVelocityX(-150);
            monster.setScale(0.8);
        },
        loop: true,
    });

    // Collision detection
    this.physics.add.overlap(this.babypnut, this.coins, collectCoin, null, this);
    this.physics.add.collider(this.babypnut, this.obstacles, hitObstacle, null, this);
    this.physics.add.overlap(this.babypnut, this.powerups, collectPowerup, null, this);
    this.physics.add.collider(this.babypnut, this.monsters, hitMonster, null, this);

    // Add Telegram button
    if (tg) {
        const endGameButton = this.add.text(650, 550, "End Game", { fontSize: "20px", fill: "#fff" });
        endGameButton.setInteractive();
        endGameButton.on("pointerdown", () => {
            tg.sendData(JSON.stringify({ score: this.score }));
        });
    }

    // Sound flag
    this.isJumping = false;
}

function update() {
    // Scroll background
    this.background.tilePositionX += 5;

    // Control squirrel movement
    if (this.cursors.up.isDown) {
        this.babypnut.setVelocityY(-200);
        if (!this.isJumping) {
            this.sound.play("jump");
            this.isJumping = true;
        }
        if (this.anims.exists("jump")) {
            this.babypnut.play("jump", true);
        }
    } else {
        this.isJumping = false;
        if (this.anims.exists("run")) {
            this.babypnut.play("run", true);
        }
    }
}

function collectCoin(player, coin) {
    coin.destroy();
    this.sound.play("collect");
    this.score += 10; // Increment score
    this.scoreText.setText("Score: " + this.score);
}

function hitObstacle(player, obstacle) {
    this.physics.pause(); // Stop all movements
    this.babypnut.setTint(0xff0000); // Change character color to red
    this.sound.play("hit");
    this.add.text(300, 250, "Game Over!", { fontSize: "40px", fill: "#fff" });
}

function collectPowerup(player, powerup) {
    powerup.destroy();
    this.babypnut.setTint(0x00ff00); // Temporary color change for effect
    this.sound.play("collect");
    this.time.delayedCall(3000, () => {
        this.babypnut.clearTint(); // Revert after 3 seconds
    });
}

function hitMonster(player, monster) {
    this.physics.pause(); // Stop all game physics
    this.babypnut.setTint(0xff0000); // Turn squirrel red
    this.sound.play("hit"); // Play hit sound
    this.add.text(300, 250, "Game Over!", { fontSize: "40px", fill: "#fff" });
}
