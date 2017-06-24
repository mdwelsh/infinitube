// TODO
//
// Checkpoints -- this will require resetting random number generator so we can re-create the world
//   from that point.
// Death (go back to last checkpoint)
// Middle platforms (also moving platforms)
// Parachutes
// Worms
// Lasers
// Music
// Pause

var PlayState = function () {};

PlayState.prototype = {
  preload: preload,
  create: create,
  update: update,
  render: render,
};

const godMode = true;

const screenWidth = 40;
const screenHeight = 20;
const worldWidth = 40;
const worldHeight = 40;
const tileSize = 32;

const platformProb = 1.0;
const fanProb = 1.0;
const spikeProb = 1.0;
const gearProb = 0.0;
const fuelProb = 1.0;
const floatySpikeProb = 0.0;

const minObstacleGap = 4;
const maxGears = 10;
const baseFanVelocity = 300;
const gearBenefit = 20;
const fanSpin = 1000;
const spinRate = 800;
const checkpointGap = 50;
const tickRate = 100;
const jetpackFuelRate = 1;
const fuelbarWidth = 20;
const fuelbarHeight = 400;
const fuelbarX = (screenWidth * tileSize) - 100
const fuelbarY = (screenHeight * tileSize) - fuelbarHeight - 30;
const floatySpikeWidth = 3;

const WALL = 29;
const PLATFORM_LEFT = 'platformIndustrial_035.png';
const PLATFORM_CENTER = 'platformIndustrial_036.png';
const PLATFORM_RIGHT = 'platformIndustrial_037.png';

var playerDead = false;
var curLayer = -1;
var debugString = 'MDW';
var fallRate = 0;
var numGearsCollected = 0;
var fallDistance = 0;
var lastCheckpoint = 0;
var checkpointsTraversed = 0;
var checkpointSeed = null;
var lastTick = 0;
var jetpackFuel = 100;


function preload() {
  game.load.spritesheet('player', 'assets/player/p1_spritesheet.png', 72, 97, -1, 0, 1);
  game.load.image('spikes','assets/spikesBottomAlt2.png');
  game.load.atlasXML('platformer', 'assets/platformer-tiles.png', 'assets/platformer-tiles.xml');
  game.load.atlasXML('platformerIndustrial', 'assets/platformIndustrial_sheet.png',
      'assets/platformIndustrial_sheet.xml');
  game.load.spritesheet('platformerRequest', 'assets/platformer-request.png', 70, 70, -1, 0, 0);
  game.load.image('whitepuff','assets/smoke/whitePuff00.png');
  game.load.image('gascan','assets/gascan.png');
  game.load.spritesheet('flame', 'assets/flame/sparkling-fireball-small.png', 256, 256, -1, 0, 1);

  game.load.audio('bump', 'assets/sounds/sfx_sounds_impact13.wav');
  game.load.audio('die', 'assets/sounds/sfx_sounds_negative1.wav');
  game.load.audio('gear', 'assets/sounds/sfx_coin_cluster3.wav');
  game.load.audio('checkpoint', 'assets/sounds/sfx_menu_select1.wav');
}

var worldRnd;
var player;
var jetpack;
var cursors;
var markers;
var platforms;
var spikes;
var items;
var collectedGears;
var fans;
var walls;
var ui;
var leftFanWalls;
var rightFanWalls;
var lights;
var scoreText;
var bumpSound;
var dieSound;
var gearSound;
var checkpointSound;
var timer;
var glow;
var killKey;
var restartKey;

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

  // Liner
  wall = walls.getFirstDead(true, (10 * tileSize) - 4, y * tileSize, 'platformerIndustrial', 'platformIndustrial_036.png');
  wall.anchor.setTo(.5,.5);
  wall.angle = 90;
  wall.width = tileSize;
  wall.height = tileSize/2;
  wall.body.immovable = true;
  wall.checkWorldBounds = true;
  wall.outOfBoundsKill = true;

  // Liner
  wall = walls.getFirstDead(true, ((worldWidth - 10) * tileSize) + 5, y * tileSize, 'platformerIndustrial', 'platformIndustrial_036.png');
  wall.anchor.setTo(.5,.5);
  wall.angle = 90;
  wall.width = tileSize;
  wall.height = tileSize/2;
  wall.body.immovable = true;
  wall.checkWorldBounds = true;
  wall.outOfBoundsKill = true;
}

function makePlatform(x, y, width, onLeft, hasSpikes, hasGear) {
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
    var c = platforms.create((x + i) * tileSize, y * tileSize, 'platformerIndustrial', side);
    c.width = tileSize;
    c.height = tileSize/2;
    c.body.immovable = true;
    c.checkWorldBounds = true;
    c.outOfBoundsKill = true;
    c._layer = curLayer;

    if (hasSpikes) {
      c = spikes.getFirstDead(true, (x + i) * tileSize, (y-1) * tileSize, 'spikes');
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
    var middle = leftpos + ((rightpos - leftpos)/2);
    c = items.create(middle, (y-1) * tileSize, 'platformerIndustrial', 'platformIndustrial_067.png');
    c.anchor.setTo(.5,.5);
    c.width = tileSize;
    c.height = tileSize;
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

  var c = game.add.sprite(0, 0, 'platformerIndustrial', 'platformIndustrial_067.png');
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
  fe.makeParticles('flame', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1000, false, false);
  fe.forEach(function(particle) { particle.tint = 0x000040; });
  fe.gravity = 0;
  fe.setAlpha(1, 0, 2000);
  fe.setScale(0.4, 0, 0.4, 0, 2000);
  fe.start(true, 2000, 250);
  var mult = onLeft ? -1 : 1;
  fe.minParticleSpeed.set(-400 * mult, 100);
  fe.maxParticleSpeed.set(-800 * mult, -100);
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
  cw._passed = false;
  cw._layer = curLayer;

  // Save the PRNG state associated with this checkpoint, so we can restore
  // it when reanimating.
  cw._seed = worldRnd.state();
  return cw._seed;
}

function makeFuel(y) {
  var c = items.create((screenWidth / 2) * tileSize, y * tileSize, 'gascan');
  c.anchor.setTo(.5,.5);
  c.tint = 0xf04040;
  c.width = tileSize * 2;
  c.height = tileSize * 2;
  //c.body.immovable = true;
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
  var left = PLATFORM_LEFT;
  var center = PLATFORM_CENTER;
  var right = PLATFORM_RIGHT;
  var x = (worldWidth / 2);

  for (var i = 0; i < floatySpikeWidth; i++) {
    var side = center;
    if (i == 0) {
      side = left;
    } else if (i == floatySpikeWidth-1) {
      side = right;
    }
    var c = platforms.create((x + i) * tileSize, y * tileSize, 'platformerIndustrial', side);
    c.width = tileSize;
    c.height = tileSize/2;
    c.checkWorldBounds = true;
    c.outOfBoundsKill = true;

    game.physics.arcade.enable(c);
    c.body.velocity.setTo(200, 0);
    c.body.bounce.set(0.8);

    var s = spikes.getFirstDead(true, (x + i) * tileSize, (y-1) * tileSize, 'spikes');
    s.width = tileSize;
    s.height = tileSize;
    s.checkWorldBounds = true;
    s.outOfBoundsKill = true;

    game.physics.arcade.enable(s);
    s.body.velocity.setTo(200, 0);
    s.body.bounce.set(0.8);
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
  debugString = 'curLayer ' + curLayer + ' lc ' + lastCheckpoint + ' gap ' + checkpointGap;

  console.log('MAKE LAYER ' + curLayer + ' lc ' + lastCheckpoint);
  if (curLayer - lastCheckpoint > checkpointGap) {
    var seed = makeCheckpoint(y);
    lastCheckpoint = curLayer;
    console.log('  - checkpoint seed=' + seed);
    return;
  }

  // Next check if we have had enough free space between obstacles.
  var maxobs = lowest([platforms, fans, lights, items]);
  var maxLayer = 0;
  if (maxobs && maxobs._layer) {
    maxLayer = maxobs._layer;
  }
  var ok = (curLayer - maxLayer) >= minObstacleGap;
  if (!ok) {
    return;
  }
  
  // This code is a little funky since we want to ensure that the PRNG
  // is called the same number of times for each codepath.
  // (This is probably not necessary.)
  console.log('CALLING WORLDRND - SEED ' + worldRnd.state());
  var platformWidth = worldRnd.integerInRange(3, 8);
  var onleft = (worldRnd.frac() <= 0.5);
  var hasSpikes = (worldRnd.frac() <= spikeProb);
  var hasGear = (worldRnd.frac() <= gearProb);

  if (worldRnd.frac() < platformProb) {
    if (onleft) {
      console.log('  - platform left ' + platformWidth);
      makePlatform(10, y, platformWidth, true, hasSpikes, hasGear);
    } else {
      console.log('  - platform right ' + platformWidth);
      makePlatform(worldWidth - (10 + platformWidth), y, platformWidth, false,
          hasSpikes, hasGear);
    }
    return;
  }

  if (worldRnd.frac() < fanProb) {
    if (onleft) {
      console.log('  - fan left');
      makeFan(10, y, true);
    } else {
      console.log('  - fan right');
      makeFan(worldWidth - 10, y, false);
    }
    return;
  }

  if (worldRnd.frac() < floatySpikeProb) {
    console.log('  - floaty');
    makeFloatySpike(y);
    return;
  }

  if (worldRnd.frac() < fuelProb) {
    console.log('  - fuel');
    makeFuel(y);
    return;
  }

  console.log('  - i got nuthin');
}

function buildWorld() {
  console.log('BUILDWORLD START --------------');
  for (y = 0; y < worldHeight; y++) {
    makeWalls(y);
    makeLayer(y);
  }
  console.log('BUILDWORLD END --------------');
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

function restartGame() {
  if (!playerDead) {
    return;
  }
  console.log('---- RESTART ----');

  // Want to ensure we start building the world from the last checkpoint.
  // Reset curLayer to be the last checkpoint layer minus one (so buildWorld
  // will start by creating that layer), and reset lastCheckpoint to be just
  // behind checkpointGap so it will force the checkpoint to be the first
  // thing created.
  curLayer = lastCheckpoint-1;
  lastCheckpoint = curLayer - (checkpointGap + 2);

  fallRate = 0;
  numGearsCollected = 0;
  jetpackFuel = 100;
  playerDead = false;
  game.state.start('play');
}

function create() {
    if (checkpointSeed != null) {
      // Set PRNG seed
      console.log('SETTING SEED: ' + checkpointSeed);
      //worldRnd.sow(checkpointSeed);
      worldRnd = new Phaser.RandomDataGenerator(checkpointSeed);
      console.log('SEED NOW: ' + worldRnd.state());
      console.log('SEED NOW 2: ' + worldRnd.state());
    } else {
      worldRnd = new Phaser.RandomDataGenerator([123]);
    }

    // We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.world.setBounds(0, 0, worldWidth * tileSize, worldHeight * tileSize);
    game.stage.backgroundColor = '202020';

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


    // Add sounds
    bumpSound = game.add.audio('bump');
    bumpSound.allowMultiple = false;
    dieSound = game.add.audio('die');
    dieSound.allowMultiple = false;
    gearSound = game.add.audio('gear');
    gearSound.allowMultiple = false;
    checkpointSound = game.add.audio('checkpoint');
    checkpointSound.allowMultiple = false;

    // The player and its settings
    player = game.add.sprite((worldWidth / 2) * tileSize, 150, 'player');
    //player.animations.add('walk', [0, 1, 2, 3, 4, 5], 10, true);
    player.anchor.setTo(.5,.5);
    game.physics.arcade.enableBody(player);
    player.body.bounce.y = 0;

    jetpack = game.add.emitter((worldWidth / 2) * tileSize, 150);
    jetpack.makeParticles('flame', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1000, false, false);
    jetpack.gravity = 0;
    jetpack.setAlpha(1, 0, 1000);
    jetpack.setScale(0.4, 0, 0.4, 0, 1000);
    //jetpack.lifespan = 500;
    //jetpack.maxParticleSpeed = new Phaser.Point(-100,50);
    //jetpack.minParticleSpeed = new Phaser.Point(-200,-50);
    // Force jetpack to update with player.
    //player.addChild(jetpack);
    //player.update = function() { jetpack.update(); }
    jetpack.start(false, 1000, 20);
    jetpack.on = false;

    ui = game.add.group();
    ui.enableBody = false;

    walls = game.add.group();
    walls.enableBody = true;
    markers = game.add.group();
    markers.enableBody = true;
    platforms = game.add.group();
    platforms.enableBody = true;
    spikes = game.add.group();
    spikes.enableBody = true;
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

    scoreText = game.add.text(16, 16, 'Checkpoints: 0',
        { font: 'Bubbler One', fontSize: '32px', fill: '#ffffff' });

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();
    killKey = game.input.keyboard.addKey(Phaser.Keyboard.K);
    killKey.onDown.add(killPlayer, this);
    restartKey = game.input.keyboard.addKey(Phaser.Keyboard.G);
    restartKey.onDown.add(restartGame, this);

    // Stack things.
    game.world.bringToTop(walls);
    game.world.bringToTop(collectedGears);
    game.world.bringToTop(platforms);
    game.world.bringToTop(ui);

    game.camera.follow(player);

    timer = game.time.create(false);
    timer.loop(tickRate, tick);
    lastTick = new Date();
    timer.start();
}

function tick() {
  var now = new Date();
  var elapsed = (now - lastTick) / 1000.0;
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
  gearSound.play('', 0, 1, false, false);

  // First, let's destroy the gear we just collected.
  var startx = gear.x;
  var starty = gear.y;
  gear.kill();

  if (numGearsCollected >= maxGears) {
    return;
  }

  numGearsCollected++;

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
  col = collectedGears.getFirstDead(true, startx, starty, 'gascan');
  col.anchor.setTo(.5,.5);
  col.width = tileSize * 2;
  col.height = tileSize * 2;
  col.checkWorldBounds = true;
  col.outOfBoundsKill = true;
  col.tint = 0xf08080;
  var t = game.add.tween(col.body).to({ x: endx, y: endy, }, 250, Phaser.Easing.Linear.None, true);
  t.onComplete.add(function() {
    col.kill();
  });
}

function killPlayer() {
  if (playerDead) {
    return;
  }
  console.log('---- KILL PLAYER ----');
  playerDead = true;
  // Play the sound
  dieSound.play('', 0, 1, false, false);

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
  colorChange.start();
}

function hitCheckpoint(p, cw) {
  if (cw._passed) {
    return;
  }
  console.log('HIT CHECKPOINT ' + cw._layer + ' seed ' + cw._seed);
  cw._passed = true;
  checkpointsTraversed++;
  checkpointSeed = cw._seed;

  if (scoreText != null) {
    scoreText.destroy();
  }
  scoreText = game.add.text(16, 16, 'Checkpoints: ' + checkpointsTraversed,
        { font: 'Bubbler One', fontSize: '32px', fill: '#ffffff' });

  checkpointSound.play('', 0, 1, false, false);

  // Change the color of the checkpoint lights. This is a bit crude; each light
  // should probably be its own object.
  lights.forEachAlive(function(c) {
    if (c && c._ll) {
      c._ll.loadTexture('platformerIndustrial', 'platformIndustrial_056.png');
    }
    if (c && c._llg) {
      c._llg.tint = 0xff0000;
    }
    if (c && c._rl) {
      c._rl.loadTexture('platformerIndustrial', 'platformIndustrial_056.png');
    }
    if (c && c._rlg) {
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
  //ctx.roundRect(0, y, fuelbarWidth, fuelbarHeight, 20).fill();
  ctx.roundRect(0, y, fuelbarWidth, fuelbarHeight - y, 10).fill();

  // Replace group with the new sprite.
  ui.forEach(function(c) {
    c.destroy();
  });
  ui.getFirstDead(true, fuelbarX, fuelbarY, fi);
}

function useJetpack(goleft) {
  if (jetpackFuel == 0) {
    return;
  }
  jetpackFuel = Math.max(0, jetpackFuel - jetpackFuelRate);
  debugString = 'Jetpack ' + jetpackFuel;
  drawFuelbar();

  var mult = goleft ? -1 : 1;
  player.body.velocity.x = 150 * mult;
  player.body.angularVelocity = (spinRate / 2) * mult;
  player.body.angularDrag = spinRate * 4;
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
  game.physics.arcade.collide(platforms, walls);
  game.physics.arcade.collide(spikes, walls);
  if (!godMode) {
    game.physics.arcade.overlap(player, spikes, killPlayer);
  }
  game.physics.arcade.overlap(player, items, collectItem);
  game.physics.arcade.overlap(player, leftFanWalls, function() {
    player.body.velocity.x = baseFanVelocity - (numGearsCollected * gearBenefit);
    player.body.angularVelocity = spinRate;
    player.body.angularDrag = spinRate * 4;
    player.scale.x = 1;
  });
  game.physics.arcade.overlap(player, rightFanWalls, function() {
    player.body.velocity.x = -1 * (baseFanVelocity - (numGearsCollected * gearBenefit));
    player.body.angularVelocity = -1 * spinRate;
    player.body.angularDrag = spinRate * 4;
    player.scale.x = -1;
  });
  game.physics.arcade.overlap(player, lights, hitCheckpoint);

  // Handle controls.
  if (!playerDead) {
    if (cursors.left.isDown) {
      useJetpack(true);
    } else if (cursors.right.isDown) {
      useJetpack(false);
    } else if (cursors.down.isDown) {
      fallRate += 100;
    } else if (cursors.up.isDown) {
      fallRate = 0; // Stop immediately for debugging.
      jetpackFuel = 100;
      player.body.velocity.x = 0;
      jetpack.on = false;
      drawFuelbar();
    } else {
      // Stand still
      player.frame = 4;
      jetpack.on = false;
    }
  }

  // Slide platforms and fans up.
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
  //game.debug.cameraInfo(game.camera, 32, 32);
//  game.debug.spriteCoords(player, 32, 500);
//  game.debug.spriteInfo(jetpack, 32, 500);
//  game.debug.spriteCoords(jetpack, 32, 600);
//  debugString = 'cp seed ' + checkpointSeed;
  game.debug.text(debugString, 32, 150);
}
