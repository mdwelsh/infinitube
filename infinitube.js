var worldWidth = 60;
var worldHeight = 40;
var tileSize = 16;

var game = new Phaser.Game(worldWidth * tileSize, worldHeight * tileSize,
    Phaser.AUTO, '', 
    { preload: preload, create: create, update: update, render: render });

function preload() {
  //game.load.image('background','assets/debug-grid-1920x1920.png');
  game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
  game.load.spritesheet('rogue', 'assets/roguelikeSheet_transparent.png',
      16, 16, -1, 0, 1);
}

var player;
var cursors;
var platforms;
var walls;

// The rogue spritesheet is 57 sprites per row.
function rogueSpriteFrame(row, col) {
  return (row * 57) + col;
}

var GREEN_WALL = rogueSpriteFrame(16, 3);
var PLATFORM_LEFT = rogueSpriteFrame(11, 19);
var PLATFORM_CENTER = rogueSpriteFrame(11, 20);
var PLATFORM_RIGHT = rogueSpriteFrame(11, 21);
var TORCH = rogueSpriteFrame(7, 17);

function makeSlice(y) {
  var c;
  for (x = 0; x < 10; x++) {
    c = walls.create(x * tileSize, y * tileSize, 'rogue', GREEN_WALL);
    c.body.immovable = true;
  }
  for (x = worldWidth - 10; x < worldWidth; x++) {
    c = walls.create(x * tileSize, y * tileSize, 'rogue', GREEN_WALL);
    c.body.immovable = true;
  }
}

function makePlatform(x, y) {
  var c = platforms.create((x-1) * tileSize, y * tileSize, 'rogue', PLATFORM_LEFT);
  c.body.immovable = true;
  c = platforms.create(x * tileSize, y * tileSize, 'rogue', PLATFORM_CENTER);
  c.body.immovable = true;
  c = platforms.create((x+1) * tileSize, y * tileSize, 'rogue', PLATFORM_RIGHT);
  c.body.immovable = true;
  c = platforms.create((x-1) * tileSize, (y-1) * tileSize, 'rogue', TORCH);
  c.body.immovable = true;
  c = platforms.create(x * tileSize, (y-1) * tileSize, 'rogue', TORCH);
  c.body.immovable = true;
  c = platforms.create((x+1) * tileSize, (y-1) * tileSize, 'rogue', TORCH);
  c.body.immovable = true;
}

function create() {

    //  We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //game.add.tileSprite(0, 0, 1920, 1920, 'background');
    game.world.setBounds(0, 0, 1920, 1920);

    // The player and its settings
    player = game.add.sprite((worldWidth / 2) * tileSize, 30, 'dude');


    walls = game.add.group();
    walls.enableBody = true;
    for (y = 0; y < worldHeight; y++) {
      makeSlice(y);
    }

    platforms = game.add.group();
    platforms.enableBody = true;
    for (i = 0; i < 10; i++) {
      var yval = game.rnd.integerInRange(0, worldHeight);
      if (game.rnd.frac() < 0.5) {
        makePlatform(11, yval);
      } else {
        makePlatform(worldWidth - 12, yval);
      }
    }

    //var s = game.add.sprite(game.world.centerX + (i * 16), 100, 'rogue');
    //s.animations.add('walk');
    //s.animations.play('walk', 2, true);

    //  We need to enable physics on the player
    game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.bounce.y = 0.5;
    //player.body.gravity.y = 300;
    player.body.collideWorldBounds = true;

    //  Our two animations, walking left and right.
    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);

    // makePlatforms();

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();

    game.camera.follow(player);

}

function update() {

    var hitWalls = game.physics.arcade.collide(player, walls);
    var hitPlatform = game.physics.arcade.collide(player, platforms);

    player.body.velocity.x = 0;
    player.body.velocity.y = 0;

    if (cursors.left.isDown)
    {
        //  Move to the left
        player.body.velocity.x = -150;

        player.animations.play('left');
    }
    else if (cursors.right.isDown)
    {
        //  Move to the right
        player.body.velocity.x = 150;

        player.animations.play('right');
    }
    else if (cursors.down.isDown)
    {
        // Move down
        player.body.velocity.y = 150;
    }
    else
    {
        //  Stand still
        player.animations.stop();

        player.frame = 4;
    }

}

function render() {
  game.debug.cameraInfo(game.camera, 32, 32);
  game.debug.spriteCoords(player, 32, 500);
}

