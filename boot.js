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
  },

  startGame: function() {
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
    this.makeLine('a game by Team Sidney', 400, '30px', 'Bubbler One');
    if (!game.device.desktop) {
      this.makeLine('Tap arrows to move left or right', 450, '20px',
        'Bubbler One');
    } else {
      this.makeLine('Use arrows to move left or right', 450, '20px',
          'Bubbler One');
    }
    this.makeLine('Collect gears to increase power', 480, '20px',
        'Bubbler One');
    this.makeLine('Try not to get hurt', 510, '20px', 'Bubbler One');

    // Go fullscreen on mobile.
    if (!game.device.desktop) {
      this.makeLine('tap anywhere to begin', 600, '20px');
      game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
      this.game.input.onDown.add(function() {
        game.scale.startFullScreen(false);
        game.time.events.add(Phaser.Timer.SECOND, function() {
          game.state.start('play');
        }, this);
      }, this);
    } else {
      this.makeLine('press any key to begin', 600, '20px');
    }

  },


};
