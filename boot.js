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

  create: function() {
    this.makeLine('Infinitube', 150, '200px', 'Russo One');
    this.makeLine('a game by', 300, '30px', 'Bubbler One');
    this.makeLine('Sidney Welsh', 350, '50px', 'Bubbler One');
    this.makeLine('Use arrows to move left or right', 450, '20px', 'Bubbler One');
    this.makeLine('Collect gears to increase power', 480, '20px', 'Bubbler One');
    this.makeLine('Don\'t die', 510, '20px', 'Bubbler One');
    this.makeLine('press any key to begin', 600, '20px');

    this.game.input.keyboard.onDownCallback = function() {
      this.game.input.keyboard.onDownCallback = function() {};
      game.time.events.add(Phaser.Timer.SECOND, function() {
        game.state.start('play');
      }, this);
    };
  },

};
