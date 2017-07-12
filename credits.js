// Boot state.

var CreditsState = function () {};

CreditsState.prototype = {
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
    { text: '(c) 2017 Team Sidney', url: null },
    { text: 'Licensed under CC BY 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/'},
    { text: 'Concept and design by Sidney Welsh', url: null },
    { text: 'Programming by Matt Welsh', url: null },
    { text: 'Contribute on GitHub',
      url: 'https://github.com/mdwelsh/infinitube' },
    { text: 'made with phaser.io', url: 'http://phaser.io/' },
    { text: 'sprites by Kenney Vleugels',
      url: 'http://www.kenney.nl',
    },
    { text: 'flames by rubberduck',
      url: 'https://opengameart.org/users/rubberduck',
    },
    { text: 'sound fx by Juhani Junkala',
      url: 'https://juhanijunkala.com/',
    },
    { text: 'music by cynicmusic',
      url: 'https://opengameart.org/content/awake-megawall-10',
    },
    { text: 'background by Game Art Guppy',
      url: 'https://www.gameartguppy.com/shop/space-ship-background-repeatable-vertical/',
    },
    { text: 'gasoline can by ProSymbols from the Noun Project',
      url: 'https://thenounproject.com/search/?q=fuel%20can&i=797581',
    },
  ],

  creditsIndex: 0,

  showCredits: function() {
    var centry = this.credits[this.creditsIndex % this.credits.length];
    var cline = this.makeLine(centry.text, 500, '30px', 'Bubbler One');
    if (centry.url != null) {
      var underline = this.game.add.graphics(0, 15);
      underline.lineStyle(2, 0xE21838);
      underline.moveTo(-cline.width / 2, 0);
      underline.lineTo(cline.width / 2, 0);
      cline.addChild(underline);
      cline.inputEnabled = true;
      cline.events.onInputDown.add(function() {
        window.location = centry.url;
      }, this);
    }
    game.physics.arcade.enableBody(cline);
    cline.alpha = 0;
    cline.body.velocity.y = -40;

    var fadeIn = game.add.tween(cline).to({ alpha: 1.0 }, 200,
        Phaser.Easing.Linear.None, false, 0, 0, false);

    var stuff = this;
    fadeIn.onComplete.add(function() {
      game.time.events.add(2 * Phaser.Timer.SECOND, function() {
        stuff.creditsIndex++;
        stuff.showCredits();
      }, this);
    });

    var fadeOut = game.add.tween(cline).to({ alpha: 0 }, 200,
        Phaser.Easing.Linear.None, false, 5 * Phaser.Timer.SECOND, 0, false);
    fadeOut.onComplete.add(function() {
      cline.destroy();
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

    this.makeLine('Infinitube', 150, '200px', 'Russo One');

    this.showCredits();

    var backLine = this.makeLine('>> back <<', 600, '40px', 'Bubbler One');
    backLine.fill = '#f04040';
    backLine.inputEnabled = true;
    backLine.events.onInputDown.add(function() {
      game.time.events.add(Phaser.Timer.SECOND, function() {
        game.state.start('boot');
      }, this);
    });

  },

};
