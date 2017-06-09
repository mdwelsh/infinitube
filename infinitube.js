var screenWidth = 40;
var screenHeight = 20;
var worldWidth = 40;
var worldHeight = 40;
var tileSize = 32;
var minPlatformGap = tileSize * 4;
var minFanGap = tileSize * 4;
var debugString = 'MDW';

var platformProb = 0.1;
var fanProb = 0.1;
var spikeProb = 0.0;
var gearProb = 1.0;

var game = new Phaser.Game(screenWidth * tileSize, screenHeight * tileSize,
    Phaser.AUTO, '', 
    { preload: preload, create: create, update: update, render: render });

function preload() {
  game.load.spritesheet('player', 'assets/player/p1_spritesheet.png', 72, 97, -1, 0, 1);
  game.load.image('spikes','assets/spikesBottomAlt2.png');
  game.load.atlasXML('platformer', 'assets/platformer-tiles.png', 'assets/platformer-tiles.xml');
  game.load.atlasXML('platformerIndustrial', 'assets/platformIndustrial_sheet.png',
      'assets/platformIndustrial_sheet.xml');
  game.load.spritesheet('platformerRequest', 'assets/platformer-request.png', 70, 70, -1, 0, 0);

  game.load.audio('bump', 'assets/sounds/sfx_sounds_impact13.wav');
  game.load.audio('die', 'assets/sounds/sfx_sounds_negative1.wav');
  game.load.audio('gear', 'assets/sounds/sfx_coin_cluster3.wav');
}

var player;
var cursors;
var platforms;
var spikes;
var gears;
var collectedGears;
var fans;
var walls;
var leftFanWalls;
var rightFanWalls;
var bumpSound;
var dieSound;
var gearSound;
var fallRate = 0;

var WALL = 29;
var PLATFORM_LEFT = 'castleHalfLeft.png';
var PLATFORM_CENTER = 'castleHalfMid.png';
var PLATFORM_RIGHT = 'castleHalfRight.png';

function makeWalls(y) {
  var wall;
  for (x = 0; x < 10; x++) {
    wall = walls.getFirstDead(true, x * tileSize, y * tileSize, 'platformerRequest', 29);
    wall.width = tileSize;
    wall.height = tileSize;
    wall.body.immovable = true;
    wall.checkWorldBounds = true;
    wall.outOfBoundsKill = true;
    wall.tint = 0x303030;
  }
  for (x = worldWidth - 10; x < worldWidth; x++) {
    wall = walls.getFirstDead(true, x * tileSize, y * tileSize, 'platformerRequest', 29);
    wall.width = tileSize;
    wall.height = tileSize;
    wall.body.immovable = true;
    wall.checkWorldBounds = true;
    wall.outOfBoundsKill = true;
    wall.tint = 0x303030;
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

  var hasSpikes = (game.rnd.frac() <= spikeProb);
  var hasGear = (game.rnd.frac() <= gearProb);

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

    if (hasSpikes) {
      c = spikes.getFirstDead(true, (x + i) * tileSize, (y-1) * tileSize, 'spikes');
      c.width = tileSize;
      c.height = tileSize;
      c.body.immovable = true;
      c.checkWorldBounds = true;
      c.outOfBoundsKill = true;
    }
  }

  if (!hasSpikes && hasGear) {
    var leftpos = x * tileSize;
    var rightpos = (x + width) * tileSize;
    var middle = leftpos + ((rightpos - leftpos)/2);
    c = gears.getFirstDead(true, middle, (y-1) * tileSize, 'platformerIndustrial', 'platformIndustrial_067.png');
    c.anchor.setTo(.5,.5);
    c.width = tileSize;
    c.height = tileSize;
    c.body.immovable = true;
    c.checkWorldBounds = true;
    c.outOfBoundsKill = true;
  }
}

function makeFan(x, y, onLeft) {
  //var c = fans.create(x * tileSize, y * tileSize, 'platformerIndustrial', 'platformIndustrial_068.png');
  var c = fans.getFirstDead(true, x * tileSize, y * tileSize,
      'platformerIndustrial', 'platformIndustrial_067.png');
  if (c.fresh) {
    var r = new Phaser.Rectangle(1, 1, 68, 68);
    c.crop(r);
  }

  var fw;
  if (onLeft) {
    c.body.angularVelocity = 1000;
    c.angle = 90;
    fw = leftFanWalls.create(0, y * tileSize);
  } else {
    c.body.angularVelocity = -1000;
    c.angle = 270;
    fw = rightFanWalls.create(0, y * tileSize);
  }
  c.anchor.setTo(.5,.5);
  c.body.immovable = true;
  c.checkWorldBounds = true;
  c.outOfBoundsKill = true;
  // Stretch fan wall across the world.
  fw.scale.x = game.world.width;
  //fw.scale.y = tileSize;
}

function makeLayer(y, platformOk, fanOk) {
  maxplatform = lowest(platforms);
  maxfan = lowest(fans);
  platformOk = (y * tileSize) - maxplatform >= minPlatformGap;
  fanOk = (y * tileSize) - maxplatform >= minFanGap;

  // Make random platforms.
  if (platformOk && game.rnd.frac() < platformProb) {
    var width = game.rnd.integerInRange(3, 8);
    if (game.rnd.frac() < 0.5) {
      makePlatform(10, y, width, true);
    } else {
      makePlatform(worldWidth - (10 + width), y, width, false);
    }
  }

  // Make random fans.
  if (fanOk && game.rnd.frac() < fanProb) {
    if (game.rnd.frac() < 0.5) {
      makeFan(10, y, true);
    } else {
      makeFan(worldWidth - 10, y, false);
    }
  }
}

function buildWorld() {
  for (y = 0; y < worldHeight; y++) {
    makeWalls(y);
    makeLayer(y);
  }
}

function lowest(group) {
  var maxy = 0;
  group.forEachAlive(function(c) {
    if (c.y < game.world.height) {
      maxy = Math.max(c.y, maxy);
    }
  });
  return maxy;
}

function addToWorld() {
  makeLayer(screenHeight + 2);
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
    gearSound = game.add.audio('gear');
    gearSound.allowMultiple = false;

    // The player and its settings
    player = game.add.sprite((worldWidth / 2) * tileSize, 150, 'player');
    player.animations.add('walk', [0, 1, 2, 3, 4, 5], 10, true);
    player.anchor.setTo(.5,.5);

    walls = game.add.group();
    walls.enableBody = true;

    platforms = game.add.group();
    platforms.enableBody = true;
    spikes = game.add.group();
    spikes.enableBody = true;
    gears = game.add.group();
    gears.enableBody = true;
    collectedGears = game.add.group();
    collectedGears.enableBody = true;
    fans = game.add.group();
    fans.enableBody = true;
    leftFanWalls = game.add.group();
    leftFanWalls.enableBody = true;
    rightFanWalls = game.add.group();
    rightFanWalls.enableBody = true;

    buildWorld();

    //  We need to enable physics on the player
    game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.bounce.y = 0;
    //player.body.gravity.y = 200;
    //player.body.collideWorldBounds = true;

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();

    game.world.bringToTop(walls);

    game.camera.follow(player);

}

var numGearsCollected = 0;

function collectGear(player, gear) {
  gearSound.play('', 0, 1, false, false);
  numGearsCollected++;

  // First, let's destroy the gear we just collected.
  var startx = gear.x;
  var starty = gear.y;
  gear.kill();

  // Next, create a new one that we're going to collect.
  var endx = (worldWidth - 2) * tileSize;
  var endy = (numGearsCollected * tileSize) + 20;
  col = collectedGears.getFirstDead(true, startx, starty,
      'platformerIndustrial', 'platformIndustrial_067.png');
  col.anchor.setTo(.5,.5);
  col.width = tileSize;
  col.height = tileSize;
  col.body.immovable = true;
  col.checkWorldBounds = true;
  col.outOfBoundsKill = true;
  col.tint = 0xf08080;
  game.add.tween(col.body).to({ x: endx, y: endy, }, 250, Phaser.Easing.Linear.None, true);
}

function update() {

    // http://www.emanueleferonato.com/2015/03/16/html5-prototype-of-an-endless-runner-game-like-spring-ninja/
    debugString = player.body.velocity.x + ' : ' + player.body.velocity.y;
    
    // Slide platforms and fans up.
    platforms.forEachAlive(function(c) {
      c.body.velocity.y = -1 * fallRate;
    });
    spikes.forEachAlive(function(c) {
      c.body.velocity.y = -1 * fallRate;
    });
    gears.forEachAlive(function(c) {
      c.body.velocity.y = -1 * fallRate;
    });
    fans.forEachAlive(function(c) {
      c.body.velocity.y = -1 * fallRate;
    });
    leftFanWalls.forEachAlive(function(c) {
      c.body.velocity.y = -1 * fallRate;
    });
    rightFanWalls.forEachAlive(function(c) {
      c.body.velocity.y = -1 * fallRate;
    });

    // Check for collisions.
    var hitWalls = game.physics.arcade.collide(player, walls);
    var hitPlatform = game.physics.arcade.overlap(player, platforms, function() {
      bumpSound.play('', 0, 1, false, false);
    });
    var hitSpikes = game.physics.arcade.overlap(player, spikes, function() {
      player.tint = Math.random() * 0xffffff;
      dieSound.play('', 0, 1, false, false);
    });
    var hitGears = game.physics.arcade.overlap(player, gears, collectGear);
    game.physics.arcade.overlap(player, leftFanWalls, function() {
      player.body.velocity.x = 300;
      player.body.angularVelocity = 200;
      player.scale.x = 1;
    });
    game.physics.arcade.overlap(player, rightFanWalls, function() {
      player.body.velocity.x = -300;
      player.body.angularVelocity = -200;
      player.scale.x = -1;
    });

    // Handle controls.
    if (cursors.left.isDown) {
      player.body.velocity.x = -150;
      player.scale.x = -1;
      player.animations.play('walk');
    } else if (cursors.right.isDown) {
      player.body.velocity.x = 150;
      player.scale.x = 1;
      player.animations.play('walk');
    } else if (cursors.down.isDown) {
      fallRate += 100;
    } else if (cursors.up.isDown) {
      //fallRate *= 0.75;
      //if (fallRate <= 10) {
      //  fallRate = 10;
      //}
      fallRate = 0; // Stop immediately for debugging.
      player.body.velocity.x = 0;
    } else {
      // Stand still
      player.animations.stop();
      player.frame = 4;
    }

    // Build new world layers.
    addToWorld();
}

function render() {
  game.debug.cameraInfo(game.camera, 32, 32);
  game.debug.spriteCoords(player, 32, 500);
  game.debug.text(debugString, 32, 150);
}

