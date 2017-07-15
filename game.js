var game = new Phaser.Game(screenWidth * tileSize, screenHeight * tileSize,
    Phaser.AUTO, 'game-container');

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

var fullScreen = false;
function goFullScreen() {
  if (fullScreen) {
    return;
  }
  game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.startFullScreen();
}
