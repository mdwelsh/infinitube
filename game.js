var game = new Phaser.Game(screenWidth * tileSize, screenHeight * tileSize,
    Phaser.AUTO, '');

game.state.add('boot', BootState);
game.state.add('credits', CreditsState);
game.state.add('play', PlayState);

WebFont.load({
  google: {
    families: ['Bubbler One', 'Russo One']
  },
  active: function() { 
    game.state.start('boot');
  },
});
