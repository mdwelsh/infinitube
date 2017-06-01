var screenWidth = 40;
var screenHeight = 20;
var worldWidth = 40;
var worldHeight = 40; // XXX Probably want this to be bigger to support wrapping.
var tileSize = 32;

var game = new Phaser.Game(screenWidth * tileSize, screenHeight * tileSize,
    Phaser.AUTO, '', 
    { preload: preload, create: create, update: update, render: render });

function preload() {
  game.load.spritesheet('player', 'assets/player/p1_spritesheet.png', 72, 97, -1, 0, 1);
  game.load.image('spikes','assets/spikesBottomAlt2.png');
  game.load.atlasXML('platformer', 'assets/platformer-tiles.png', 'assets/platformer-tiles.xml');
  game.load.atlasXML('platformerIndustrial', 'assets/platformIndustrial_sheet.png',
      'assets/platformIndustrial_sheet.xml');

  game.load.audio('bump', 'assets/sounds/sfx_sounds_impact13.wav');
  game.load.audio('die', 'assets/sounds/sfx_sounds_negative1.wav');

}

var player;
var cursors;
var platforms;
var spikes;
var fans;
var walls;
var bumpSound;
var dieSound;

var WALL = 'castleCenter.png';
var PLATFORM_LEFT = 'castleHalfLeft.png';
var PLATFORM_CENTER = 'castleHalfMid.png';
var PLATFORM_RIGHT = 'castleHalfRight.png';

function makeWalls(y) {
  var wall;
  for (x = 0; x < 10; x++) {
    wall = walls.getFirstDead(true, x * tileSize, y * tileSize, 'platformer', WALL);
    wall.width = tileSize;
    wall.height = tileSize;
    wall.body.immovable = true;
    wall.checkWorldBounds = true;
    wall.outOfBoundsKill = true;
  }
  for (x = worldWidth - 10; x < worldWidth; x++) {
    wall = walls.getFirstDead(true, x * tileSize, y * tileSize, 'platformer', WALL);
    wall.width = tileSize;
    wall.height = tileSize;
    wall.body.immovable = true;
    wall.checkWorldBounds = true;
    wall.outOfBoundsKill = true;
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
    var c = platforms.getFirstDead(true, (x + i) * tileSize, y * tileSize, 'platformer', side);
    c.width = tileSize;
    c.height = tileSize;
    c.body.immovable = true;
    c.checkWorldBounds = true;
    c.outOfBoundsKill = true;

    c = spikes.getFirstDead(true, (x + i) * tileSize, (y-1) * tileSize, 'spikes');
    c.width = tileSize;
    c.height = tileSize;
    c.body.immovable = true;
    c.checkWorldBounds = true;
    c.outOfBoundsKill = true;
  }
}

function makeFan(x, y, onLeft) {
  var c = fans.create(x * tileSize, y * tileSize, 'platformerIndustrial', 'platformIndustrial_068.png');
  if (onLeft) {
    c.angle = 90;
  } else {
    c.angle = 270;
  }
}

function buildWorld() {
  for (y = 0; y < worldHeight; y++) {
    makeWalls(y);

    // Make random platforms.
    if (game.rnd.frac() < 0.1) {
      var width = game.rnd.integerInRange(3, 8);
      if (game.rnd.frac() < 0.5) {
        makePlatform(10, y, width, true);
      } else {
        makePlatform(worldWidth - (10 + width), y, width, false);
      }
    }

    // Make random fans.
    if (game.rnd.frac() < 0.1) {
      if (game.rnd.frac() < 0.5) {
        makeFan(11, y, true);
      } else {
        makeFan(worldWidth - 11, y, false);
      }
    }
  }
}

function create() {
    // We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Make the world bigger than the game view.
    game.world.setBounds(0, 0, worldWidth * tileSize, worldHeight * tileSize);

    game.stage.backgroundColor = '202020';

    // Add sounds
    bumpSound = game.add.audio('bump');
    bumpSound.allowMultiple = false;
    dieSound = game.add.audio('die');
    dieSound.allowMultiple = false;

    // The player and its settings
    player = game.add.sprite((worldWidth / 2) * tileSize, 30, 'player');
    player.animations.add('walk', [0, 1, 2, 3, 4, 5], 10, true);
    player.anchor.setTo(.5,.5);

    walls = game.add.group();
    walls.enableBody = true;

    platforms = game.add.group();
    platforms.enableBody = true;
    spikes = game.add.group();
    spikes.enableBody = true;
    fans = game.add.group();
    fans.enableBody = true;

    buildWorld();

    //  We need to enable physics on the player
    game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.bounce.y = 0.5;
    player.body.gravity.y = 200;
    //player.body.collideWorldBounds = true;

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();

    game.camera.follow(player);

}

function update() {

    // First, destroy anything that has gone off-screen.
    //
    // XXX MDW - Hmm, another idea.
    // This tutorial creates a 'Pole' object with its own update() function.
    // That function destroys the Pole (and creates new ones) when it goes
    // off the edge of the world.
    //
    // http://www.emanueleferonato.com/2015/03/16/html5-prototype-of-an-endless-runner-game-like-spring-ninja/
    //
    // However, like a couple of the other games, it works by moving the poles to the left.
    //
    // Still, all sprites can have an update() method of their own and we can use that
    // to have each object check for itself whether it needs to be destroyed when it goes
    // off-camera.
    //
    // What we can do here in the global update function is create new objects below the
    // current camera view. So, we always create below the camera, and destroy above it.
    //
    // I need to understand wrapping, though. Can the camera actually show portions of
    // the world across the wrap boundary? Reading the docs, I think not!
    //
    // So ... this suggests that the right approach is, after all, to set the velocity
    // on the platforms, spikes, etc. so they are moving up, and let them get destroyed
    // as they fall off the top of the world. This is not hard if each sprite has an update()
    // method which checks the "virtual y-velocity" of the player and sets the sprite's
    // own velocity to the inverse of that. I think this is probably the best approach.
    //
    // Alternately, we could just rely on setting negative gravity for all game objects
    // other than the player.
    //
    //
    //
    //
    
    walls.forEach(function(c) {
      if (c.world.y < game.camera.y - (tileSize*2)) {
        console.log('Wall at ' + c.world.y + ' is off screen for ' + game.camera.y);
        //c.tint = Math.random() * 0xffffff;
        c.kill();
      }
    });

    var hitWalls = game.physics.arcade.collide(player, walls);
    var hitPlatform = game.physics.arcade.collide(player, platforms, function() {
      bumpSound.play('', 0, 1, false, false);
    });
    var hitSpikes = game.physics.arcade.overlap(player, spikes, function() {
      player.tint = Math.random() * 0xffffff;
      dieSound.play('', 0, 1, false, false);
    });

    // XXX MDW - This approach doesn't really do what I want.
    // I think I want to follow this pattern instead:
    // https://www.joshmorony.com/how-to-create-an-infinite-climbing-game-in-phaser/
    // which pre-creates a bunch of tiles and then repositions them as needed.

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
      // Stand still
      player.animations.stop();
      player.frame = 4;
    }

    // XXX MDW - Probably need to use the padding here...
    // game.world.wrap(player, -(game.height/2), false, false, true);
    game.world.wrap(player, 0, false, false, true);
}

function render() {
  game.debug.cameraInfo(game.camera, 32, 32);
  game.debug.spriteCoords(player, 32, 500);
}

