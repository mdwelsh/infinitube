// Boot state.

var BootState = function () {};

BootState.prototype = {
  preload: function() {
  },

  makeLine: function(s, y, size='72px', font='Bubbler One') {
    var t = game.add.text(game.world.centerX, y, s,
        { font: font, fontSize: size, fill: '#ffffff' });
    t.anchor.setTo(0.5);
  },

  startGame: function() {
  },

  create: function() {
    this.makeLine('Infinitube', 150, '200px', 'Russo One');
    this.makeLine('a game by', 300, '30px', 'Bubbler One');
    this.makeLine('Sidney Welsh', 350, '50px', 'Bubbler One');
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
      this.makeLine('tap to begin', 600, '20px');
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
