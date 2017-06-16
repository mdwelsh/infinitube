// Play state.

var PlayState = function () {};

PlayState.prototype = {
  preload: function() {
  },

  create: function() {
    var scoreText = game.add.text(32, 32, 'Now you\'re playing!',
        { font: 'Bubbler One', fontSize: '32px', fill: '#ffffff' });
    this.game.input.keyboard.onDownCallback = function() {
      game.state.start('boot');
    };
  },
};
