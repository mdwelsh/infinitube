// Boot state.

var BootState = function () {};

BootState.prototype = {
  preload: function() {
    game.load.spritesheet('player', 'assets/player/p1_spritesheet.png',
        72, 97, -1, 0, 1);
    game.load.spritesheet('platformerRequest', 'assets/platformer-request.png',
        70, 70, -1, 0, 0);
  },

  makeLine: function(s, y, size='72px', font='Bubbler One') {
    var t = game.add.text(game.world.centerX, y, s,
        { font: font, fontSize: size, fill: '#ffffff' });
    t.anchor.setTo(0.5);
    return t;
  },

  startGame: function() {
  },

  credits: [
    'a game by Team Sidney',
    'Concept and design by Sidney Welsh',
    'Programming by Matt Welsh',
  ],

  creditsIndex: 0,

  showCredits: function() {
    var cline = this.makeLine(
        this.credits[this.creditsIndex % this.credits.length],
        400, '30px', 'Bubbler One');
    cline.alpha = 0;

    var fadeIn = game.add.tween(cline).to({ alpha: 1.0 }, 200,
        Phaser.Easing.Linear.None, false, 0, 0, false);
    var fadeOut = game.add.tween(cline).to({ alpha: 0 }, 200,
        Phaser.Easing.Linear.None, false, 2000, 0, false);
    var stuff = this;
    fadeOut.onComplete.add(function() {
      stuff.creditsIndex++;
      stuff.showCredits();
    });
    fadeIn.chain(fadeOut);
    fadeIn.start();
  },

  create: function() {

    for (x = 0; x < worldWidth; x++) {
      for (y = 0; y < screenHeight; y++) {
        wall = game.add.sprite(x * tileSize, y * tileSize,
         'platformerRequest', 29);
        wall.width = tileSize;
        wall.height = tileSize;
        var shade = game.rnd.integerInRange(10, 50);
        wall.tint = (shade << 16) | (shade << 8) | shade;
      }
    }

    player = game.add.sprite(50, 300, 'player');
    player.frame = 4;
    player.anchor.setTo(.5,.5);
    game.physics.arcade.enableBody(player);
    player.body.bounce.y = 0;
    game.add.tween(player).to({ angle: 720 }, 5000, Phaser.Easing.Linear.None,
        true, 0, -1, false);
    game.add.tween(player).to({ x: (screenWidth * tileSize) - 50 }, 7000,
        Phaser.Easing.Linear.None, true, 0, -1, true);

    this.makeLine('Infinitube', 150, '200px', 'Russo One');
    if (!game.device.desktop) {
      this.makeLine('Tap arrows to move left or right', 450, '20px',
        'Bubbler One');
    } else {
      this.makeLine('Use arrows to move left or right', 450, '20px',
          'Bubbler One');
    }
    this.makeLine('Collect gears to increase power', 480, '20px',
        'Bubbler One');
    this.makeLine('Use parachutes to slow down', 510, '20px', 'Bubbler One');
    this.showCredits();

    var startLine = this.makeLine('start game', 570, '40px', 'Bubbler One');
    startLine.fill = '#f04040';
    startLine.inputEnabled = true;
    startLine.events.onInputDown.add(function() {
      game.time.events.add(Phaser.Timer.SECOND, function() {
        game.state.start('play');
      }, this);
    });

    var creditsLine = this.makeLine('credits', 620, '30px', 'Bubbler One');
    creditsLine.fill = '#a0a0ff';
    creditsLine.inputEnabled = true;
    creditsLine.events.onInputDown.add(function() {
      game.time.events.add(Phaser.Timer.SECOND, function() {
        game.state.start('credits');
      }, this);
    });
  },


};
