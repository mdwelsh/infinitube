// TODO
//
// Multiple lives
// Parachutes

var PlayState = function () {};

PlayState.prototype = {
  preload: preload,
  create: create,
  update: update,
  render: render,
};


const godMode = false;
const maxLives = 3;
const screenWidth = 40;
const screenHeight = 20;
const worldWidth = 40;
const worldHeight = 40;
const tileSize = 32;
const scoreTextX = (worldWidth - 8) * tileSize;
const scoreTextY = 20;
const livesX = (worldWidth - 8) * tileSize;
const livesY = 70;
const defaultSeed = 12345;

const platformProb = 0.02;
const spikeProb = 0.5;
const fanProb = 0.0;
const fuelProb = 0.4;
const floatySpikeProb = 0.01;
const wormProb = 0.01;

const minObstacleGap = 4;
const maxGears = 12;
const baseFanVelocity = 300;
const gearBenefit = 20;
const fanSpin = 1000;
const spinRate = 800;
const energySize = 70;
const checkpointGap = 50;
const tickRate = 100;
const jetpackFuelRate = 1;
const jetpackReplenishRate = 1;
const jetpackRechargeTime = 1000;
const fuelbarWidth = 20;
const fuelbarHeight = 400;
const fuelbarX = (screenWidth * tileSize) - 50; 
const fuelbarY = (screenHeight * tileSize) - fuelbarHeight - 30;
const fuelbarTextX = (screenWidth * tileSize) - 90; 
const fuelbarTextY = (screenHeight * tileSize) - 30;
const collectedGearsHeight = 400;
const collectedGearsX = (screenWidth * tileSize) - 120; 
const collectedGearsY = (screenHeight * tileSize) - 30;
const collectedGearsTextX = (screenWidth * tileSize) - 150; 
const collectedGearsTextY = (screenHeight * tileSize) - 30;
const floatySpikeWidth = 3;
const initialFallRate = 300;
const fallRateIncrease = 50;
const maxFallRate = 1000;

const WALL = 29;
const PLATFORM_LEFT = 'platformIndustrial_035.png';
const PLATFORM_CENTER = 'platformIndustrial_036.png';
const PLATFORM_RIGHT = 'platformIndustrial_037.png';

var numLives = maxLives;
var invincible = true;
var playerDead = false;
var curLayer = -1;
var lastPopulatedLayer = 0;
var lastCheckpointLastPopulatedLayer = 0;
var debugString = '';
var fallRate = 0;
var numGearsCollected = 0;
var fallDistance = 0;
var lastCheckpointCreated = 0;
var lastCheckpointTraversed = 0;
var checkpointsTraversed = 0;
var checkpointSeed = [ defaultSeed ];
var lastTick = 0;
var jetpackFuel = 100;
var lastJetpackUse = 0;

function preload() {
  game.load.spritesheet('player', 'assets/player/p1_spritesheet.png',
      72, 97, -1, 0, 1);
  game.load.image('arrow','assets/arrow.png');
  game.load.image('spikes','assets/spikesBottomAlt2.png');
  game.load.image('energy','assets/energywave.png');
  game.load.atlasXML('platformer', 'assets/platformer-tiles.png',
      'assets/platformer-tiles.xml');
  game.load.atlasXML('platformerIndustrial',
      'assets/platformIndustrial_sheet.png',
      'assets/platformIndustrial_sheet.xml');
  game.load.spritesheet('platformerRequest', 'assets/platformer-request.png',
      70, 70, -1, 0, 0);
  game.load.image('whitepuff','assets/smoke/whitePuff00.png');
  game.load.image('gascan','assets/gascan.png');
  game.load.image('parachute','assets/parachute.png');
  game.load.image('background','assets/spaceship_bg_2.png');
  game.load.spritesheet('flame', 'assets/flame/sparkling-fireball-small.png',
      256, 256, -1, 0, 1);
  game.load.atlasXML('enemies', 'assets/player/enemies.png',
      'assets/player/enemies.xml');

  game.load.audio('bump', 'assets/sounds/sfx_sounds_impact13.wav');
  game.load.audio('die', 'assets/sounds/sfx_sounds_negative1.wav');
  game.load.audio('gear', 'assets/sounds/sfx_coin_cluster3.wav');
  game.load.audio('checkpoint', 'assets/sounds/sfx_menu_select1.wav');
  game.load.audio('music', 'assets/awake10_megaWall.mp3');
}

var worldRnd;
var player;
var jetpack;
var cursors;
var markers;
var platforms;
var spikes;
var floatySpikes;
var worms;
var items;
var collectedGears;
var fans;
var walls;
var fuelbar;
var lives;
var tapControls;
var leftFanWalls;
var rightFanWalls;
var lights;
var floatySpike;
var scoreText;
var bumpSound;
var dieSound;
var gearSound;
var checkpointSound;
var timer;
var glow;
var energy;
var killKey; // Don't press this!
var music;
var background;
var pauseText;
var pauseScreen;
var leftArrow;
var rightArrow;
var pauseButton;

function makeWalls(y) {
  var wall;
  for (x = 0; x < 10; x++) {
    wall = walls.getFirstDead(true, x * tileSize, y * tileSize,
        'platformerRequest', 29);
    wall.width = tileSize;
    wall.height = tileSize;
    wall.body.immovable = true;
    wall.checkWorldBounds = true;
    wall.outOfBoundsKill = true;
    var shade = worldRnd.integerInRange(10, 50);
    wall.tint = (shade << 16) | (shade << 8) | shade;
  }
  for (x = worldWidth - 10; x < worldWidth; x++) {
    wall = walls.getFirstDead(true, x * tileSize, y * tileSize,
        'platformerRequest', 29);
    wall.width = tileSize;
    wall.height = tileSize;
    wall.body.immovable = true;
    wall.checkWorldBounds = true;
    wall.outOfBoundsKill = true;
    var shade = worldRnd.integerInRange(10, 50);
    wall.tint = (shade << 16) | (shade << 8) | shade;
  }

  // Liner
  wall = walls.getFirstDead(true, (10 * tileSize) - 4, y * tileSize,
      'platformerIndustrial', 'platformIndustrial_065.png');
  wall.anchor.setTo(.5,.5);
  wall.angle = 90;
  wall.width = tileSize * 2;
  wall.height = tileSize;
  wall.body.immovable = true;
  wall.checkWorldBounds = true;
  wall.outOfBoundsKill = true;

  // Liner
  wall = walls.getFirstDead(true, ((worldWidth - 10) * tileSize) + 5,
      y * tileSize, 'platformerIndustrial', 'platformIndustrial_065.png');
  wall.anchor.setTo(.5,.5);
  wall.angle = 90;
  wall.width = tileSize * 2;
  wall.height = tileSize;
  wall.body.immovable = true;
  wall.checkWorldBounds = true;
  wall.outOfBoundsKill = true;
}

function makePlatform(x, y, width, onLeft, hasSpikes, hasGear) {
  var left = PLATFORM_LEFT;
  var center = PLATFORM_CENTER;
  var right = PLATFORM_RIGHT;
  var offset = 0;
  if (onLeft) {
    left = PLATFORM_CENTER;
    offset = 10;
  } else {
    right = PLATFORM_CENTER;
    offset = -10;
  }

  for (var i = 0; i < width; i++) {
    var side = center;
    if (i == 0) {
      side = left;
    } else if (i == width-1) {
      side = right;
    }
    var c = platforms.create(((x + i) * tileSize) + offset, y * tileSize,
        'platformerIndustrial', side);
    c.width = tileSize;
    c.height = tileSize/2;
    c.body.immovable = true;
    c.checkWorldBounds = true;
    c.outOfBoundsKill = true;
    c._layer = curLayer;

    if (hasSpikes) {
      c = spikes.getFirstDead(true, ((x + i) * tileSize) + offset,
          (y-1) * tileSize, 'spikes');
      c.width = tileSize;
      c.height = tileSize;
      c.body.immovable = true;
      c.checkWorldBounds = true;
      c.outOfBoundsKill = true;
      c._layer = curLayer;
    }
  }

  if (!hasSpikes && hasGear) {
    var leftpos = x * tileSize;
    var rightpos = (x + width) * tileSize;
    var middle = (leftpos + ((rightpos - leftpos)/2)) + offset;
    c = items.create(middle, (y-1) * tileSize, 'platformerIndustrial',
        'platformIndustrial_067.png');
    c.anchor.setTo(.5,.5);
    c.width = tileSize * 1.5;
    c.height = tileSize * 1.5;
    c.body.immovable = true;
    c.checkWorldBounds = true;
    c.outOfBoundsKill = true;
    c._itemType = 'gear';
    c._layer = curLayer;
  }
}

function makeFan(x, y, onLeft) {
  // Start with an empty sprite to anchor things.
  var p = fans.getFirstDead(true, x * tileSize, y * tileSize,
      'platformerIndustrial', 'platformIndustrial_067.png');
  p.anchor.setTo(.5,.5);
  p.body.immovable = true;
  p.checkWorldBounds = true;
  p.outOfBoundsKill = true;
  p._layer = curLayer;

  var c = game.add.sprite(0, 0, 'platformerIndustrial',
      'platformIndustrial_067.png');
  if (c.fresh) {
    var r = new Phaser.Rectangle(1, 1, 68, 68);
    c.crop(r);
  }
  game.physics.arcade.enable(c);
  c.anchor.setTo(.5,.5);
  c.body.immovable = true;
  c.checkWorldBounds = true;
  c.outOfBoundsKill = true;
  p.addChild(c);

  var fw;
  if (onLeft) {
    c.body.angularVelocity = fanSpin;
    c.angle = 90;
    fw = leftFanWalls.create(0, y * tileSize);
  } else {
    c.body.angularVelocity = -1 * fanSpin;
    c.angle = 90;
    fw = rightFanWalls.create(0, y * tileSize);
  }
  // Stretch fan wall across the world.
  fw.scale.x = game.world.width;

  // Fan emitter
  var fe = game.add.emitter(onLeft ? 50 : -50, 0, 50);
  fe.makeParticles(energy, 0, 1000, false, false);
  fe.gravity = 0;
  //fe.angle = 0;
  fe.setAlpha(1, 0, 600);
  fe.setScale(0.01, 0.4, 0.01, 0.4, 200);
  fe.start(true, 2000, 250);
  var mult = onLeft ? -1 : 1;
  fe.setRotation(0, 0);
  fe.minParticleSpeed.set(-400 * mult, 0);
  fe.maxParticleSpeed.set(-800 * mult, 0);
  fe.on = true;
  p.addChild(fe);

  p.update = function() { c.update(); fe.update(); }
}

function makeCheckpoint(y) {
  // Left light.
  var ll = lights.create(10.5 * tileSize, y * tileSize,
      'platformerIndustrial', 'platformIndustrial_041.png');
  ll.anchor.setTo(.5,.5);
  ll.angle = 90;
  ll.body.immovable = true;
  ll.checkWorldBounds = true;
  ll.outOfBoundsKill = true;
  ll._layer = curLayer;

  // Left light glow.
  var llg = lights.create(11.1 * tileSize, y * tileSize, glow);
  llg.anchor.setTo(.5,.5);
  llg.body.immovable = true;
  llg.checkWorldBounds = true;
  llg.outOfBoundsKill = true;
  game.add.tween(llg).to( { alpha: 0 }, 250, Phaser.Easing.Linear.None, true,
      0, -1, true);
  llg._layer = curLayer;

  // Right light.
  var rl = lights.create((worldWidth - 10.5) * tileSize,
      y * tileSize, 'platformerIndustrial', 'platformIndustrial_041.png');
  rl.anchor.setTo(.5,.5);
  rl.angle = 270;
  rl.body.immovable = true;
  rl.checkWorldBounds = true;
  rl.outOfBoundsKill = true;
  rl._layer = curLayer;

  // Right light glow.
  var rlg = lights.create((worldWidth - 11.2) * tileSize,
      y * tileSize, glow);
  rlg.anchor.setTo(.5,.5);
  rlg.body.immovable = true;
  rlg.checkWorldBounds = true;
  rlg.outOfBoundsKill = true;
  game.add.tween(rlg).to( { alpha: 0 }, 250, Phaser.Easing.Linear.None, true,
      0, -1, true);
  rlg._layer = curLayer;

  // Invisible checkpoint wall.
  var cw;
  cw = lights.create(0, y * tileSize);
  cw.scale.x = game.world.width;
  cw._ll = ll;
  cw._llg = llg;
  cw._rl = rl;
  cw._rlg = rlg;
  cw._layer = curLayer;
  cw._lastPopulatedLayer = lastPopulatedLayer;

  // Save the PRNG state associated with this checkpoint, so we can restore
  // it when reanimating.
  cw._seed = worldRnd.state();
  return cw._seed;
}

function makeFuel(y) {
  var c = items.create((screenWidth / 2) * tileSize, y * tileSize, 'gascan');
  c.anchor.setTo(.5,.5);
  c.width = tileSize * 1.5;
  c.height = tileSize * 2;
  c.body.immovable = true;
  c.checkWorldBounds = true;
  c.outOfBoundsKill = true;
  c._itemType = 'fuel';

  // Make it bounce back and forth.
  game.physics.arcade.enable(c);
  c.body.velocity.setTo(200, 0);
  c.body.bounce.set(0.8);
  //game.add.tween(c).to( { alpha: 0 }, 250, Phaser.Easing.Linear.None, true, 0, -1, true);
}

function makeFloatySpike(y) {
  var fs = floatySpikes.create((worldWidth/2) * tileSize, y * tileSize,
      floatySpike);
  fs.checkWorldBounds = true;
  fs.outOfBoundsKill = true;
  game.physics.arcade.enable(fs);
  fs.body.velocity.setTo(200, 0);
  fs.body.bounce.set(0.8);
}

function makeWorm(y, onleft) {
  var xpos;
  if (onleft) {
    xpos = 15 * tileSize;
  } else {
    xpos = (worldWidth - 15) * tileSize;
  }

  var worm = worms.create(xpos, y * tileSize, 'enemies', 'snakeSlime.png');
  var wiggle = worm.animations.add('wiggle', ['snakeSlime.png',
      'snakeSlime_ani.png'], 5, true, false);
  game.physics.arcade.enable(worm);
  worm.angle = onleft ? 90 : -90;
  worm.body.immovable = true;
  worm.checkWorldBounds = true;
  worm.outOfBoundsKill = true;
  wiggle.play();
  // Make the worm stretch in and out
  game.add.tween(worm.scale).to({ y: 3.0 }, 2000, Phaser.Easing.Linear.None,
      true, 0, -1, true);
  if (onleft) {
    game.add.tween(worm).to({ x: 24 * tileSize }, 2000,
        Phaser.Easing.Linear.None, true, 0, -1, true);
  } else {
    game.add.tween(worm).to({ x: (worldWidth - 24) * tileSize }, 2000,
        Phaser.Easing.Linear.None, true, 0, -1, true);
  }
}

function makeLayer(y) {
  // Create a new layer.
  curLayer++;
  var marker = markers.create(0, y * tileSize);
  marker.body.immovable = true;
  marker.checkWorldBounds = true;
  marker.outOfBoundsKill = true;
  marker._layer = curLayer;

  if ((curLayer - lastCheckpointCreated >= checkpointGap) &&
      (curLayer - lastPopulatedLayer >= minObstacleGap)) {
    var seed = makeCheckpoint(y);
    lastCheckpointCreated = curLayer;
    lastPopulatedLater = curLayer;
    return;
  }

  // Next check if we have had enough free space between obstacles.
  var ok = (curLayer - lastPopulatedLayer) >= minObstacleGap;
  if (!ok) {
    return;
  }
  
  // This code is a little funky since we want to ensure that the PRNG
  // is called the same number of times for each codepath.
  // (This is probably not necessary.)
  var platformWidth = worldRnd.integerInRange(3, 8);
  var onleft = (worldRnd.frac() <= 0.5);
  var hasSpikes = (worldRnd.frac() <= spikeProb);
  var hasGear = !hasSpikes;

  if (worldRnd.frac() < platformProb) {
    if (onleft) {
      makePlatform(10, y, platformWidth, true, hasSpikes, hasGear);
    } else {
      makePlatform(worldWidth - (10 + platformWidth), y, platformWidth, false,
          hasSpikes, hasGear);
    }
    lastPopulatedLayer = curLayer;
    return;
  }

  if (worldRnd.frac() < fanProb) {
    if (onleft) {
      makeFan(10, y, true);
    } else {
      makeFan(worldWidth - 10, y, false);
    }
    lastPopulatedLayer = curLayer;
    return;
  }

  if (worldRnd.frac() < floatySpikeProb) {
    makeFloatySpike(y);
    lastPopulatedLayer = curLayer;
    return;
  }

  if (worldRnd.frac() < wormProb) {
    makeWorm(y, onleft);
    lastPopulatedLayer = curLayer;
    return;
  }

  if (worldRnd.frac() < fuelProb) {
    makeFuel(y);
    lastPopulatedLayer = curLayer;
    return;
  }
}

function buildWorld() {
  for (y = 0; y < worldHeight; y++) {
    makeWalls(y);
    makeLayer(y);
  }
}

function highest(group) {
  var miny = game.world.height;
  group.forEachAlive(function(c) {
    if (c.y < game.world.height) {
      min = Math.min(c.y, miny);
    }
  });
  return miny;
}

function lowest(groups) {
  var low = null;
  var maxy = 0;
  groups.forEach(function(g) {
    g.forEachAlive(function(c) {
      if (c.y < game.world.height) {
        if (c.y > maxy) {
          maxy = c.y;
          low = c;
        }
      }
    });
  });
  return low;
}

function addToWorld() {
  // Find the lowest marker and add tiles below it.
  var lowestMarker = lowest([markers]);
  var lowestTile = Math.floor(lowestMarker.y / tileSize);
  for (var y = lowestTile+1; y < worldHeight; y++) {
    makeLayer(y);
  }
}

// Used to resume after death as well as restart in a clean state.
function restartGame(clean) {
  if (!playerDead) {
    return;
  }

  if (clean) {
    // Clean start.
    numLives = maxLives;
    curLayer = -1;
    lastPopulatedLayer = 0;
    lastCheckpointLastPopulatedLayer = 0;
    fallDistance = 0;
    lastCheckpointCreated = 0;
    lastCheckpointTraversed = 0;
    checkpointsTraversed = 0;
    checkpointSeed = null;
    lastTick = 0;

    console.log('Clean start, numLives is ' + numLives);
    console.log('Clean start, checkpoints is ' + checkpointsTraversed);

  } else {
    // Resume from death.
    //
    // Want to ensure we start building the world from the last checkpoint.
    // Reset curLayer to be the last checkpoint traversed minus one (so buildWorld
    // will start by creating that layer), and reset lastCheckpointCreated to be
    // just behind checkpointGap so it will force the checkpoint to be the
    // first thing created. Also set lastPopulatedLayer to the value at the
    // last checkpoint we traversed.
    curLayer = lastCheckpointTraversed - 1;
    lastPopulatedLayer = lastCheckpointLastPopulatedLayer - 1;
    lastCheckpointCreated = curLayer - (checkpointGap + 2);
  }

  numGearsCollected = 0;
  fallRate = 0;
  jetpackFuel = 100;
  lastJetpackUse = 0;
  playerDead = false;
  game.state.start('play');
}

function create() {
    if (checkpointSeed != null) {
      worldRnd = new Phaser.RandomDataGenerator(checkpointSeed);
    } else {
      worldRnd = new Phaser.RandomDataGenerator();
    }

    // We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.world.setBounds(0, 0, worldWidth * tileSize, worldHeight * tileSize);

    background = game.add.tileSprite(10 * tileSize, 0,
        (screenWidth - 20) * tileSize, screenHeight * tileSize, 'background');
    background.tint = 0x202020;

    // Glow effect for lights
    glow = new Phaser.Graphics(game, 0, 0)
      .beginFill(0xa0a0a0, 0.25)
      .drawCircle(0, 0, 40)
      .endFill()
      .beginFill(0xffffff, 0.25)
      .drawCircle(0, 0, 30)
      .endFill()
      .beginFill(0x0000ff, 0.25)
      .drawCircle(0, 0, 20)
      .endFill()
      .generateTexture();

    // Fan energy
    var energygr = new Phaser.Graphics(game, 0, 0)
      .lineStyle(10, 0xf02020, 0.5)
      .moveTo(energySize/1.5, 0)
      .bezierCurveTo(energySize/1.5, 0, energySize/1.5, energySize/1.5, 0, energySize/1.5)
      .lineStyle(7, 0x702020, 0.5)
      .moveTo(energySize/2, 0)
      .bezierCurveTo(energySize/2, 0, energySize/2, energySize/2, 0, energySize/2)
      .lineStyle(6, 0x402020, 0.5)
      .moveTo(energySize/3, 0)
      .bezierCurveTo(energySize/3, 0, energySize/3, energySize/3, 0, energySize/3)
      .generateTexture();
    energy = game.add.bitmapData(energySize*2, energySize*2);
    var te = game.add.sprite(0, 0, energygr);
    te.angle = -35;
    energy.draw(te, 50, 50);

    // Floaty spike sprite
    var left = PLATFORM_LEFT;
    var center = PLATFORM_CENTER;
    var right = PLATFORM_RIGHT;
    var x = (worldWidth / 2);
    floatySpike = game.add.bitmapData(tileSize * floatySpikeWidth,
        tileSize * 2);
    for (var i = 0; i < floatySpikeWidth; i++) {
      var side = center;
      if (i == 0) {
        side = left;
      } else if (i == floatySpikeWidth-1) {
        side = right;
      }
      var c = game.add.sprite(0, 0, 'platformerIndustrial', side);
      c.width = tileSize;
      c.height = tileSize/2;
      floatySpike.draw(c, i * tileSize, tileSize);
      var s = game.add.sprite(0, 0, 'spikes');
      s.width = tileSize;
      s.height = tileSize;
      floatySpike.draw(s, i * tileSize, 0);
    }

    // Add sounds
    bumpSound = game.add.audio('bump');
    bumpSound.allowMultiple = false;
    dieSound = game.add.audio('die');
    dieSound.allowMultiple = false;
    gearSound = game.add.audio('gear');
    gearSound.allowMultiple = false;
    checkpointSound = game.add.audio('checkpoint');
    checkpointSound.allowMultiple = false;

    jetpack = game.add.emitter((worldWidth / 2) * tileSize, 150);
    jetpack.makeParticles('flame', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1000, false, false);
    jetpack.gravity = 0;
    jetpack.setAlpha(1, 0, 1000);
    jetpack.setScale(0.4, 0, 0.4, 0, 1000);
    jetpack.start(false, 1000, 20);
    jetpack.on = false;

    fuelbar = game.add.group();
    fuelbar.enableBody = false;
    lives = game.add.group();
    lives.enableBody = false;
    tapControls = game.add.group();
    tapControls.enableBody = false;

    walls = game.add.group();
    walls.enableBody = true;
    markers = game.add.group();
    markers.enableBody = true;
    platforms = game.add.group();
    platforms.enableBody = true;
    spikes = game.add.group();
    spikes.enableBody = true;
    floatySpikes = game.add.group();
    floatySpikes.enableBody = true;
    worms = game.add.group();
    worms.enableBody = true;
    items = game.add.group();
    items.enableBody = true;
    collectedGears = game.add.group();
    collectedGears.enableBody = true;
    fans = game.add.group();
    fans.enableBody = true;
    leftFanWalls = game.add.group();
    leftFanWalls.enableBody = true;
    rightFanWalls = game.add.group();
    rightFanWalls.enableBody = true;
    lights = game.add.group();
    lights.enableBody = true;

    buildWorld();
    drawFuelbar();
    drawLives();

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();
    killKey = game.input.keyboard.addKey(Phaser.Keyboard.K);
    killKey.onDown.add(killPlayer, this);
    pauseKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    pauseKey.onDown.add(pauseGame, this);

    // Add touch controls.
    var arrow = new Phaser.Graphics(game, 0, 0)
      .lineStyle(10, 0xffffff, 1.0)
      .drawCircle(0, 0, 100)
      .moveTo(10, -20)
      .lineTo(-15, 0)
      .lineTo(10, 20)
      .generateTexture();

    leftArrow = tapControls.create(5 * tileSize,
        (screenHeight - 4) * tileSize, arrow);
    leftArrow.inputEnabled = true;

    rightArrow = tapControls.create((worldWidth - 5) * tileSize,
        (screenHeight - 4) * tileSize, arrow);
    rightArrow.scale.x = -1;
    rightArrow.inputEnabled = true;

    var pause = new Phaser.Graphics(game, 0, 0)
      .lineStyle(10, 0xffffff, 1.0)
      .drawCircle(0, 0, 100)
      .moveTo(10, -20)
      .lineTo(10, 20)
      .moveTo(-10, -20)
      .lineTo(-10, 20)
      .generateTexture();
    pauseButton = tapControls.create(1 * tileSize,
        (screenHeight - 4) * tileSize, pause);
    pauseButton.inputEnabled = true;
    pauseButton.events.onInputDown.add(pauseGame);

    // Music.
    music = new Phaser.Sound(game, 'music', 1, true);
    game.time.events.add(Phaser.Timer.SECOND, function() {
      music.loopFull();
    });

    // Stack things.
    game.world.bringToTop(walls);
    game.world.bringToTop(collectedGears);
    game.world.bringToTop(platforms);
    game.world.bringToTop(fuelbar);
    game.world.bringToTop(lives);
    game.world.bringToTop(tapControls);

    timer = game.time.create(false);
    timer.loop(tickRate, tick);
    lastTick = new Date();
    timer.start();

    logoText = game.add.text(12, 350, 'Infinitube',
        { font: 'Russo One', fontSize: '64px', fill: '#ffffff' });
    logoText.angle = -90;

    var fuelText = game.add.text(fuelbarTextX, fuelbarTextY, 'Fuel',
        { font: 'Bubbler One', fontSize: '24px', fill: '#ffffff' });
    fuelText.angle = -90;

    var collectedGearsText = game.add.text(collectedGearsTextX,
        collectedGearsTextY, 'Gears',
        { font: 'Bubbler One', fontSize: '24px', fill: '#ffffff' });
    collectedGearsText.angle = -90;

    scoreText = game.add.text(scoreTextX, scoreTextY,
        'Checkpoints: ' + checkpointsTraversed,
        { font: 'Bubbler One', fontSize: '24px', fill: '#ffffff' });

    // Create player.
    player = game.add.sprite((worldWidth / 2) * tileSize, -100, 'player');
    player.anchor.setTo(.5,.5);
    player.frame = 4;
    game.physics.arcade.enableBody(player);
    player.body.bounce.y = 0;

    invincible = true;
    var warpInPlayer = game.add.tween(player).to({ y: 150, angle: 720 }, 1000,
        Phaser.Easing.Linear.None, false, 0, 0, false);
    warpInPlayer.onComplete.add(function() {
      fallRate = initialFallRate;
    });
    var blinkPlayer = game.add.tween(player).to({ alpha: 0.4 }, 200,
        Phaser.Easing.Linear.None, false, 0, 10, true);
    blinkPlayer.onComplete.add(function() {
      player.alpha = 1.0;
      invincible = false;
    });

    warpInPlayer.chain(blinkPlayer);
    warpInPlayer.start();
}

function tick() {
  var now = new Date();
  var elapsed = (now - lastTick) / 1000.0;
  if ((jetpackFuel < 100) && (now - lastJetpackUse) >= jetpackRechargeTime) {
    jetpackFuel = Math.min(jetpackFuel + jetpackReplenishRate, 100);
    drawFuelbar();
  }
  fallDistance += fallRate * elapsed;
  lastTick = now;
}

function collectItem(player, item) {
  if (!item || !item._itemType) {
    return;
  }
  if (item._itemType == 'gear') {
    collectGear(item);
  } else if (item._itemType == 'fuel') {
    collectFuel(item);
  }
}

function collectGear(gear) {
  if (numGearsCollected >= maxGears) {
    return;
  }

  gearSound.play('', 0, 1, false, false);

  // First, let's destroy the gear we just collected.
  var startx = gear.x;
  var starty = gear.y;
  gear.kill();

  numGearsCollected++;

  // Next, create a new one that we're going to collect.
  var endx = collectedGearsX;
  var endy = collectedGearsY - (numGearsCollected * tileSize);
  var col = collectedGears.create(startx, starty,
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

function collectFuel(fuel) {
  var startx = fuel.x;
  var starty = fuel.y;
  gearSound.play('', 0, 1, false, false);
  fuel.kill();
  jetpackFuel = 100;
  drawFuelbar();

  // Zap a fuel to the bar.
  var endx = fuelbarX;
  var endy = fuelbarY;
  var col = collectedGears.create(startx, starty, 'gascan');
  col.anchor.setTo(.5,.5);
  col.width = tileSize * 1.0;
  col.height = tileSize * 1.5;
  col.checkWorldBounds = true;
  col.outOfBoundsKill = true;
  var t = game.add.tween(col.body).to({ x: endx, y: endy, }, 250,
      Phaser.Easing.Linear.None, true);
  t.onComplete.add(function() {
    col.kill();
  });
}

function pauseGame() {
  if (!game.paused) {
    pauseScreen = game.add.tileSprite(0, 0, screenWidth * tileSize,
        screenHeight * tileSize, 'platformerRequest', 29);
    pauseScreen.tint = 0x202080;
    pauseScreen.alpha = 0.5;
    pauseText = game.add.text(game.world.centerX, game.world.centerY/2,
        'paused', { font: 'Russo One', fontSize: '64px', fill: '#ffffff' });
    pauseText.anchor.setTo(0.5);
    game.paused = true;
  } else {
    pauseScreen.kill();
    pauseText.kill();
    game.paused = false;
  }
}

function gameOver() {
  gameOverScreen = game.add.tileSprite(0, 0, screenWidth * tileSize,
      screenHeight * tileSize, 'platformerRequest', 29);
  gameOverScreen.tint = 0x802020;
  gameOverScreen.alpha = 0.5;

  gameOverText = game.add.text(game.world.centerX, game.world.centerY/2,
      'game over', { font: 'Russo One', fontSize: '64px', fill: '#ffffff' });
  gameOverText.anchor.setTo(0.5);

  tryAgainText = game.add.text(game.world.centerX, game.world.centerY/2 + 60,
      'try again?', { font: 'Bubbler One', fontSize: '40px', fill: '#f04040' });
  tryAgainText.anchor.setTo(0.5);
  tryAgainText.inputEnabled = true;
  tryAgainText.events.onInputDown.add(function() {
    game.time.events.add(Phaser.Timer.SECOND, function() {
      restartGame(true);
    });
  });
}

function killPlayer() {
  if (playerDead) {
    return;
  }
  playerDead = true;
  dieSound.play('', 0, 1, false, false);
  music.stop();
  numLives--;
  drawLives();

  // Stop the player
  jetpack.on = false;
  player.body.velocity.x = 0;
  player.body.velocity.y = 0;
  fallRate = 0;

  // Change the player's color
  var colorChange = game.add.tween(player).to(
      { tint: Math.random() * 0xffffff }, 100, Phaser.Easing.Linear.None,
      false, 0, 4);
  
  // Fade in the smoke
  smoke = game.add.sprite(player.x, player.y, 'whitepuff');
  smoke.anchor.setTo(.5,.5);
  smoke.alpha = 0;
  var smokeIn = game.add.tween(smoke).to( { alpha: 1 }, 200,
      Phaser.Easing.Linear.None, false);
  var smokeOut = game.add.tween(smoke).to( { alpha: 0 }, 700,
      Phaser.Easing.Linear.None, false);
  smokeIn.onComplete.add(function() {
    player.kill();
  });

  colorChange.chain(smokeIn);
  smokeIn.chain(smokeOut);
  smokeOut.onComplete.add(function() {
    if (numLives == 0) {
      gameOver();
    } else {
      game.time.events.add(Phaser.Timer.SECOND, function() {
        restartGame(false);
      });
    }
  });
  colorChange.start();
}

function hitCheckpoint(p, cw) {
  if (lastCheckpointTraversed >= cw._layer) {
    return;
  }
  lastCheckpointTraversed = cw._layer;
  if (fallRate < maxFallRate) {
    fallRate = Math.min(fallRate + fallRateIncrease, maxFallRate);
  }

  // This is the value of lastPopulatedLayer as seen at this checkpoint.
  // We save it here since if we die before the next checkpoint,
  // we need to restore this value so that the world will be rebuilt
  // correctly.
  lastCheckpointLastPopulatedLayer = cw._lastPopulatedLayer;
  checkpointsTraversed++;
  checkpointSeed = cw._seed;

  if (scoreText != null) {
    scoreText.destroy();
  }
  scoreText = game.add.text(scoreTextX, scoreTextY,
      'Checkpoints: ' + checkpointsTraversed,
      { font: 'Bubbler One', fontSize: '24px', fill: '#ffffff' });

  checkpointSound.play('', 0, 1, false, false);

  // Change the color of the checkpoint lights.
  lights.forEachAlive(function(c) {
    if (c && c._ll && c._layer == cw._layer) {
      c._ll.loadTexture('platformerIndustrial', 'platformIndustrial_056.png');
    }
    if (c && c._llg && c._layer == cw._layer) {
      c._llg.tint = 0xff0000;
    }
    if (c && c._rl && c._layer == cw._layer) {
      c._rl.loadTexture('platformerIndustrial', 'platformIndustrial_056.png');
    }
    if (c && c._rlg && c._layer == cw._layer) {
      c._rlg.tint = 0xff0000;
    }
  });
}

// Stolen from:
// https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x+r, y);
  this.arcTo(x+w, y,   x+w, y+h, r);
  this.arcTo(x+w, y+h, x,   y+h, r);
  this.arcTo(x,   y+h, x,   y,   r);
  this.arcTo(x,   y,   x+w, y,   r);
  this.closePath();
  return this;
}

function drawFuelbar() {
  var fi = game.add.bitmapData(fuelbarWidth, fuelbarHeight);
  var ctx = fi.context;
  var grd = ctx.createLinearGradient(0, 0, fuelbarWidth, fuelbarHeight);
  grd.addColorStop(0, "#00FF00");
  grd.addColorStop(1, "#FF0000");
  ctx.fillStyle = grd;
  var y = fuelbarHeight - (fuelbarHeight * (jetpackFuel / 100));
  ctx.roundRect(0, y, fuelbarWidth, fuelbarHeight - y, 10).fill();

  // Replace group with the new sprite.
  fuelbar.forEach(function(c) {
    c.destroy();
  });
  fuelbar.getFirstDead(true, fuelbarX, fuelbarY, fi);
}

function drawLives() {
  // Replace group with the new sprite.
  lives.forEach(function(c) {
    c.destroy();
  });

  for (var i = 0; i < numLives; i++) {
    var l = lives.create(livesX + (i * 40), livesY, 'player');
    l.scale.x = 0.5;
    l.scale.y = 0.5;
    l.frame = 4;
  }
}

function useJetpack(goleft) {
  if (jetpackFuel < jetpackFuelRate) {
    jetpack.on = false;
    return;
  }
  jetpackFuel = Math.max(0, jetpackFuel - jetpackFuelRate);
  lastJetpackUse = new Date();
  drawFuelbar();

  var mult = goleft ? -1 : 1;
  player.body.velocity.x = 150 * mult;
  player.body.angularVelocity = (spinRate / 2) * mult;
  player.body.angularDrag = spinRate * 0.2;
  player.scale.x = mult;
    
  jetpack.emitX = player.x + (goleft ? 30 : -30);
  jetpack.emitY = player.y;
  jetpack.minParticleSpeed.set(-200 * mult, 30);
  jetpack.maxParticleSpeed.set(-700 * mult, -30);
  jetpack.on = true;
}

function update() {
  // Check for collisions.
  game.physics.arcade.collide(player, walls);
  game.physics.arcade.collide(items, walls);
  game.physics.arcade.collide(floatySpikes, walls);
  game.physics.arcade.collide(platforms, walls);
  game.physics.arcade.collide(spikes, walls);
  if (!invincible && !godMode) {
    game.physics.arcade.overlap(player, spikes, killPlayer);
    game.physics.arcade.overlap(player, floatySpikes, killPlayer);
    game.physics.arcade.overlap(player, worms, killPlayer);
  }
  game.physics.arcade.overlap(player, items, collectItem);
  game.physics.arcade.overlap(player, leftFanWalls, function() {
    player.body.velocity.x = baseFanVelocity -
      (numGearsCollected * gearBenefit);
    player.body.angularVelocity = spinRate;
    player.body.angularDrag = spinRate * 0.2;
    player.scale.x = 1;
  });
  game.physics.arcade.overlap(player, rightFanWalls, function() {
    player.body.velocity.x = -1 * (baseFanVelocity -
        (numGearsCollected * gearBenefit));
    player.body.angularVelocity = -1 * spinRate;
    player.body.angularDrag = spinRate * 0.2;
    player.scale.x = -1;
  });
  game.physics.arcade.overlap(player, lights, hitCheckpoint);

  // Handle controls.
  if (!playerDead) {
    if (cursors.left.isDown ||
        leftArrow.input.checkPointerDown(game.input.activePointer, true)) {
      leftArrow.alpha = 0.5;
      useJetpack(true);
    } else if (cursors.right.isDown ||
        rightArrow.input.checkPointerDown(game.input.activePointer, true)) {
      rightArrow.alpha = 0.5;
      useJetpack(false);
    } else if (godMode && cursors.down.isDown) {
      // Debug only.
      fallRate += 100;
    } else if (godMode && cursors.up.isDown) {
      // Debug only.
      fallRate = 0;
      jetpackFuel = 100;
      player.body.velocity.x = 0;
      jetpack.on = false;
      drawFuelbar();
    } else {
      // Stand still
      leftArrow.alpha = 1.0;
      rightArrow.alpha = 1.0;
      jetpack.on = false;
    }
  }

  // Slide everything up.
  background.tilePosition.y -= fallRate / 1000;
  markers.forEachAlive(function(c) {
    c.body.velocity.y = -1 * fallRate;
  });
  platforms.forEachAlive(function(c) {
    if (c && c.body) {
      c.body.velocity.y = -1 * fallRate;
    } else {
      c.forEachAlive(function(c2) {
        c2.body.velocity.y = -1 * fallRate;
      });
    }
  });
  spikes.forEachAlive(function(c) {
    c.body.velocity.y = -1 * fallRate;
  });
  floatySpikes.forEachAlive(function(c) {
    c.body.velocity.y = -1 * fallRate;
  });
  worms.forEachAlive(function(c) {
    c.body.velocity.y = -1 * fallRate;
  });
  items.forEachAlive(function(c) {
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
  lights.forEachAlive(function(c) {
    c.body.velocity.y = -1 * fallRate;
  });

  // Build new world layers.
  addToWorld();
}

function render() {
  game.debug.text(debugString, 32, 150);
}
