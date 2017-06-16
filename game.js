var screenWidth = 40;
var screenHeight = 20;
var worldWidth = 40;
var worldHeight = 40;
var tileSize = 32;

// https://github.com/MattMcFarland/phaser-menu-system

var game = new Phaser.Game(screenWidth * tileSize, screenHeight * tileSize,
    Phaser.AUTO, '');

game.state.add('boot', BootState);
game.state.add('play', PlayState);

WebFont.load({
  google: {
    families: ['Bubbler One']
  },
  active: function() { 
    game.state.start('boot');
  },
});
