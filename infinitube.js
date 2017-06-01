var screenWidth = 40;
var screenHeight = 20;
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
  var c;
  for (x = 0; x < 10; x++) {
    // XXX MDW - Should use game.add.tileSprite here I think
    c = walls.create(x * tileSize, y * tileSize, 'platformer', WALL);
    c.width = tileSize;
    c.height = tileSize;
    c.body.immovable = true;
  }
  for (x = screenWidth - 10; x < screenWidth; x++) {
    // XXX MDW - Should use game.add.tileSprite here I think
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

function makeFan(x, y, onLeft) {
  var c = fans.create(x * tileSize, y * tileSize, 'platformerIndustrial', 'platformIndustrial_068.png');
  if (onLeft) {
    c.angle = 90;
  } else {
    c.angle = 270;
  }
}

function buildWorld() {

  for (y = 0; y < screenHeight * 2; y++) {
    makeWalls(y);

    // Make random platforms.
    if (game.rnd.frac() < 0.05) {
      var width = game.rnd.integerInRange(3, 8);
      if (game.rnd.frac() < 0.5) {
        makePlatform(10, y, width, true);
      } else {
        makePlatform(screenWidth - (10 + width), y, width, false);
      }
    }

    // Make random fans.
    if (game.rnd.frac() < 0.05) {
      if (game.rnd.frac() < 0.5) {
        makeFan(11, y, true);
      } else {
        makeFan(screenWidth - 11, y, false);
      }
    }
  }
}

function create() {
    // We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Make the world bigger than the game view.
    game.world.setBounds(0, 0, game.width, game.height * 2);

    game.stage.backgroundColor = '202020';

    // Add sounds
    bumpSound = game.add.audio('bump');
    bumpSound.allowMultiple = false;
    dieSound = game.add.audio('die');
    dieSound.allowMultiple = false;

    // The player and its settings
    player = game.add.sprite((screenWidth / 2) * tileSize, 30, 'player');
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
    player.body.collideWorldBounds = true;

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();

    game.camera.follow(player);

}

var wrapping = true;

function update() {

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

    // See if we have wrapped.
    if (!wrapping && player.y < game.height) {
      wrapping = true;
      console.log('MDW: Wrapping!');
//      walls.destroy();
//      platforms.destroy();
//      spikes.destroy();
      buildWorld();
    } else if (player.y >= game.height) {
      wrapping = false;
    }

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

    game.world.wrap(player, -(game.height/2), false, false, true);
}

function render() {
  game.debug.cameraInfo(game.camera, 32, 32);
  game.debug.spriteCoords(player, 32, 500);
}

