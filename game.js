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
  console.log('mdw - goFullScreen called, fullScreen is ' + fullScreen);

  if (fullScreen) {
    return;
  }
  game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.onFullScreenInit.add(function(e, target) {
    console.log('mdw - onFullScreenInit');
    console.log(e);
    console.log(target);
  });
  game.scale.onFullScreenError.add(function(e) {
    console.log('mdw - onFullScreenError');
    console.log(e);
  });
  game.scale.onFullScreenChange.add(function(e) {
    console.log('mdw - onFullScreenChange');
    console.log(e);
  });
  console.log('Trying to go full screen');
  ret = game.scale.startFullScreen();
  console.log('startFullScreen returned ' + ret);
  fullScreen = true;
}
