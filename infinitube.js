var worldWidth = 40;
var worldHeight = 40;
var tileSize = 32;

var game = new Phaser.Game(worldWidth * tileSize, worldHeight * tileSize,
    Phaser.AUTO, '', 
    { preload: preload, create: create, update: update, render: render });

function preload() {
  game.load.spritesheet('player', 'assets/player/p1_spritesheet.png', 72, 97, -1, 0, 1);
  game.load.image('spikes','assets/spikesBottomAlt2.png');
  game.load.atlasXML('platformer', 'assets/platformer-tiles.png', 'assets/platformer-tiles.xml');
}

var player;
var cursors;
var platforms;
var spikes;
var walls;

var WALL = 'castleCenter.png';
var PLATFORM_LEFT = 'castleHalfLeft.png';
var PLATFORM_CENTER = 'castleHalfMid.png';
var PLATFORM_RIGHT = 'castleHalfRight.png';

function makeSlice(y) {
  var c;
  for (x = 0; x < 10; x++) {
    c = walls.create(x * tileSize, y * tileSize, 'platformer', WALL);
    c.width = tileSize;
    c.height = tileSize;
    c.body.immovable = true;
  }
  for (x = worldWidth - 10; x < worldWidth; x++) {
    c = walls.create(x * tileSize, y * tileSize, 'platformer', WALL);
    c.width = tileSize;
    c.height = tileSize;
    c.body.immovable = true;
  }
}

function makePlatform(x, y, width, onLeft) {

  var left = PLATFORM_LEFT;
  var center = PLATFORM_CENTER;
  var right = PLATFORM_RIGHT;
  if (onLeft) {
    left = PLATFORM_CENTER;
  } else {
    right = PLATFORM_CENTER;
  }

  for (var i = 0; i < width; i++) {
    var side = center;
    if (i == 0) {
      side = left;
    } else if (i == width-1) {
      side = right;
    }
    var c = platforms.create((x + i) * tileSize, y * tileSize, 'platformer', side);
    c.width = tileSize;
    c.height = tileSize;
    c.body.immovable = true;

    c = spikes.create((x + i) * tileSize, (y-1) * tileSize, 'spikes');
    c.width = tileSize;
    c.height = tileSize;
    c.body.immovable = true;
  }
}

function create() {
    //  We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //game.add.tileSprite(0, 0, 1920, 1920, 'background');
    game.world.setBounds(0, 0, 1920, 1920);

    // The player and its settings
    player = game.add.sprite((worldWidth / 2) * tileSize, 30, 'player');
    player.animations.add('walk', [0, 1, 2, 3, 4, 5], 10, true);
    player.anchor.setTo(.5,.5);

    walls = game.add.group();
    walls.enableBody = true;
    for (y = 0; y < worldHeight; y++) {
      makeSlice(y);
    }

    platforms = game.add.group();
    platforms.enableBody = true;
    spikes = game.add.group();
    spikes.enableBody = true;

    // Make some random platforms.
    for (i = 0; i < 10; i++) {
      var yval = game.rnd.integerInRange(0, worldHeight);
      var width = game.rnd.integerInRange(1, 8);
      if (game.rnd.frac() < 0.5) {
        makePlatform(10, yval, width, true);
      } else {
        makePlatform(worldWidth - (10 + width), yval, width, false);
      }
    }

    //  We need to enable physics on the player
    game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.bounce.y = 0.5;
    player.body.gravity.y = 30;
    player.body.collideWorldBounds = true;

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();

    game.camera.follow(player);

}

function update() {

    var hitWalls = game.physics.arcade.collide(player, walls);
    var hitPlatform = game.physics.arcade.collide(player, platforms);

    player.body.velocity.x = 0;

    if (cursors.left.isDown) {
        //  Move to the left
        player.body.velocity.x = -150;

        // Flip to point left
        player.scale.x = -1;
        player.animations.play('walk');
    } else if (cursors.right.isDown) {
        //  Move to the right
        player.body.velocity.x = 150;

        // Flip to point right
        player.scale.x = 1;
        player.animations.play('walk');
    } else if (cursors.down.isDown) {
        // Move down
        player.body.velocity.y = 150;
    } else if (cursors.up.isDown) {
        // Move down
        player.body.velocity.y = -150;
    } else {
        //  Stand still
        player.animations.stop();
        player.frame = 4;
    }
}

function render() {
  game.debug.cameraInfo(game.camera, 32, 32);
  game.debug.spriteCoords(player, 32, 500);
}

