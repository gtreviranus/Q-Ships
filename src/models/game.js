var Player = require("./player.js")
var Shrapnel = require("./shrapnel.js")
var Asteroid = require("./asteroid.js")
var Debris = require("./debris.js")


  //Game Class and associated functions
  function Game() {

     this.width = 2500;
     this.height = 2500;
     this.players = [];
     this.shrapnel =[];
     this.asteroids = [];
     this.debris = [];
     this.nukes = [];
     for (var i = 0; i < 4; i++){
        this.spawnAsteroid();
     }
     this.scores = [];
  }

//Create collection of snapshots of all objects in game packaged for renderer.
Game.prototype.items = function() {
  var gameItems = [];
  var currentScores = [];
  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i].ship){
      if (this.players[i].state === 1 || this.players[i].state === 2) {
        gameItems.push(this.players[i].ship.snapshot());
        if (this.players[i].ship.nuke.length === 1) {
          gameItems.push(this.players[i].ship.nuke[0].snapshot());
        }
      }
      for (var j = 0; j < this.players[i].ship.pewBay.length; j++) {
        gameItems.push(this.players[i].ship.pewBay[j].snapshot());
      }
    }
    // build scores object
    currentScores.push({
      id: this.players[i].uuid,
      name: this.players[i].name,
      score: this.players[i].score
    })
  }
  for (var k = 0; k < this.shrapnel.length; k++) {
    gameItems.push(this.shrapnel[k].snapshot())
  }
  for (var l = 0; l < this.asteroids.length; l++) {
    gameItems.push(this.asteroids[l].snapshot())
  }
  for (var m = 0; m < this.debris.length; m++) {
    gameItems.push(this.debris[m].snapshot())
  }
  this.scores = currentScores;
  return gameItems;
}

Game.prototype.sortScores = function() {
  if (this.scores.length > 0) {
    return this.scores.sort(function (a, b) {
      return b.score - a.score;
    });
  } else {
    return [{
      id: 420,
      name: "Jobin Savin",
      score: 420
    }]
  }
}

Game.prototype.snapshot = function(clientID) {
  thisPlayer = this.players[this.findPlayerIndex(clientID)]
  var canNuke = (thisPlayer.ship.nuked === false && thisPlayer.score > 9)
  gameAssets = []
  gameAssets.push({
    scores: this.sortScores(),
    player: {
      id: clientID,
      state: thisPlayer.state,
      x: thisPlayer.ship.x,
      y: thisPlayer.ship.y,
      arsenal: thisPlayer.ship.rocketStock
    },
    items: this.items()
  });
  if (canNuke) {
    gameAssets[0].player.canNuke = true;
  }
  return JSON.stringify(gameAssets[0]);
}

Game.prototype.findPlayerIndex = function(uuid) {
  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i].uuid === uuid) {
      return i;
    }
  }
}

Game.prototype.addPlayer = function(uuid) {
  //ws connection created
  var noob = new Player(uuid);
  this.players.push(noob);
  return noob.uuid;
}

Game.prototype.removePlayer = function(uuid) {
  //when ws connection broken
  var quitter = this.findPlayerIndex(uuid);
  this.players.splice(quitter, 1);
}


//Master function to make all objects move (active and passive).
Game.prototype.makeTheWorldMove = function() {
  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i].state === 1 || this.players[i].state === 2) {
      this.players[i].ship.navigateTheStars();
      this.players[i].ship.move(this.width, this.height);

      // moving de nuke :)
      if(this.players[i].ship.nuke.length === 1 ){
        this.players[i].ship.nuke[0].move(this.width, this.height);
      }
    }
    for (var j = 0; j < this.players[i].ship.pewBay.length; j++) {
      this.players[i].ship.pewBay[j].move(this.width, this.height)
    };
  }

  for(var k = 0; k < this.shrapnel.length; k++){
    this.shrapnel[k].move(this.width, this.height)
  };

  for(var l = 0; l < this.asteroids.length; l++){
    this.asteroids[l].move(this.width, this.height)
  };

  for(var l = 0; l < this.debris.length; l++){
    this.debris[l].move(this.width, this.height)
  };
}

//game loop will run 50 fps and run new frame and checkers
Game.prototype.gameLoop = function() {
  var that = this;
  setInterval(function(){
    that.makeTheWorldMove();
    that.checkers();
  },1000/50);
}


//will check for any pews that need to be removed
//will eventually check for any collisions
Game.prototype.checkers = function() {
  // invoke ouch() to check for collisions and update objects
  this.ouch();

  //  remove all shrapnels & debris
  this.removeShrapnel();
  this.removeDebris();

  // go through each player...
  for (var i = 0; i < this.players.length; i++) {
    // collect all the pews that exploded...
    var explodingPews = this.players[i].ship.removePew();
    for (var j = 0; j < explodingPews.length; j++) {

      // check for either pew or rocket to explode
      if(explodingPews[j].type === "pew"){
        this.explodePew(explodingPews[j]);
      } else if (explodingPews[j].type === "rocket"){
        this.explodeRocket(explodingPews[j])
      }
    }

    //  if the player dropped a nuke and the player gets killed...then what happens?
    if (this.players[i].state === 2 && this.players[i].ship.hp < 1) {
      // if you dropped the nuke and you die or if you reload the page, you lose the nuke
      this.players[i].ship.nuke = [];
      // explode the ship
      this.explodeShip(this.players[i].ship.x, this.players[i].ship.y);
      // reseting player's score and state, game stops taking snapshot of this ship
      this.players[i].score = 0;
      this.players[i].state = 0;

      if (this.players[i].hitby !== 'undefined') {
        var killer = this.players[this.findPlayerIndex(this.players[i].ship.hitby)];
        if (killer) {
          this.bounty(killer, "ship");
        }
      }
    }

    if (this.players[i].ship.nuked && this.players[i].ship.nuke.length === 1) {
       // nuke.hp and nuke.isExpired have conflicting logic, the moment nuke explodes it will affect it's own hp
       if (this.players[i].ship.nuke[0].isExpired){
        this.detonateNuke(this.players[i].ship.nuke[0]);
      }
    }
  }

  for (var i = 0; i < this.asteroids.length; i++){
    if (this.asteroids[i].hp < 1) {
      if (this.asteroids[i].hitby !== "undefined") {
        var killer = this.players[this.findPlayerIndex(this.asteroids[i].hitby)];
        if (killer && killer.ship) {
          this.bounty(killer, "asteroid");
        }
      }
      this.explodeRock(this.asteroids[i].x, this.asteroids[i].y);
      this.asteroids.splice(i, 1);
      this.spawnAsteroid();
    }
  }
};

Game.prototype.bounty = function(hunter, target) {
  switch (target) {
    case "ship":
      hunter.ship.hp += 3;
      hunter.score += 1;
      break;
    case "asteroid":
      hunter.ship.hp += 2;
      // hunter.score += 10;
      break;
  }
}

Game.prototype.spawnAsteroid = function() {
  this.asteroids.push(new Asteroid());
}

Game.prototype.explodePew = function(coordinates) {
  var x = coordinates.x;
  var y = coordinates.y;
  this.shrapnelMaker(8, x, y);
}

Game.prototype.explodeRocket = function(coordinates) {
  var x = coordinates.x;
  var y = coordinates.y;
  var spread = 100
  this.shrapnelMaker(80, x, y, spread);
}

Game.prototype.explodeShip = function(x, y) {
  this.shrapnelMaker(40, x, y);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~nuke~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//Nuke creates all the explosions
Game.prototype.explodeNuke = function(nuke) {
  this.shrapnelMaker(50, nuke.x + (Math.random()-.5)*100, nuke.y + (Math.random()-.5)*100);
  this.debrisMaker(50, nuke.x + (Math.random()-.5)*100, nuke.y + (Math.random()-.5)*100);

  // after the nuke explosion, get rid of the nuke from the game universe after 6 seconds
  var that = this;
  setTimeout(function() {
    if (that.players[that.findPlayerIndex(nuke.uuid)]){
      that.players[that.findPlayerIndex(nuke.uuid)].ship.nuke = [];
    }
  }, 6000);
}

//Nuke blew up. everyone ded.
Game.prototype.detonateNuke = function(nuke) {
  var nuker = this.players[this.findPlayerIndex(nuke.uuid)];
  nuker.ship.hp += 100;
  this.explodeNuke(nuke);

  var allObjects = this.collidableObjects();
  for (var i = 0; i < allObjects.length; i++){
    this.bounty(nuker, allObjects[i]);
    allObjects[i].hp -= 40;
  }

  nuker.ship.hp = 25;
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


Game.prototype.shrapnelMaker = function(amount, x, y, spread) {
  var spread = spread || 5
  for (var i = 0; i < amount; i++) {
    this.shrapnel.push(new Shrapnel(x, y, spread));
  }
}

Game.prototype.explodeRock = function(x, y) {
  this.debrisMaker(28, x, y);
}

Game.prototype.debrisMaker = function(amount, x, y) {
  for (var i = 0; i < amount; i++) {
    this.debris.push(new Debris(x, y));
  }
}

// collision detection for all objects
Game.prototype.ouch = function() {
  var allCollidableObjects = this.collidableObjects();

  for (var i = 0; i < allCollidableObjects.length; i++) {
    var ufo1 = allCollidableObjects[i];

    for (var j = i + 1; j < allCollidableObjects.length; j++) {
      var ufo2 = allCollidableObjects[j];


      if (this.isColliding(ufo1, ufo2)) {
        // every collidable object now has a damage attribute
        ufo1.hp -= ufo2.damage;
        ufo2.hp -= ufo1.damage;

        ufo1.hitby = ufo2.uuid;
        ufo2.hitby = ufo1.uuid;

        ufo1.dx *= (1/2);
        ufo1.dy *= (1/2);

        ufo2.dx *= (1/2);
        ufo2.dy *= (1/2);
      }
    }
  }
}

// collect every existing object with hp
Game.prototype.collidableObjects = function() {
  var collidableObjects = [];

  // collect all the astroids
  for (var k = 0; k < this.asteroids.length; k++) {
    collidableObjects.push(this.asteroids[k]);
  }

  // collect all the spaceships and pews
  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i].state === 2) {
      collidableObjects.push(this.players[i].ship);
      for (var j = 0; j < this.players[i].ship.pewBay.length; j++) {
        collidableObjects.push(this.players[i].ship.pewBay[j]);
      }
      if (this.players[i].ship.nuked && this.players[i].ship.nuke.length > 0) {
        collidableObjects.push(this.players[i].ship.nuke[0]);
      }
    }
  }
  return collidableObjects;
}

// check whether two objects are colliding
Game.prototype.isColliding = function(ufo1, ufo2){
  var xcenter = function(ufo) {
    return ufo.x + (ufo.width/2);
  }
  var ycenter = function(ufo) {
    return ufo.y + (ufo.height/2);
  }
  var totalBuffer = ufo1.hitBuffer + ufo2.hitBuffer
  if ( (Math.abs(xcenter(ufo1) - xcenter(ufo2)) <= totalBuffer) && (Math.abs(ycenter(ufo1) - ycenter(ufo2)) <= totalBuffer) ) {
    return true;
  } else {
    return false;
  }
}

// -------------------------------------------------------------------------------

Game.prototype.updateEntity = function(package){
  var package = JSON.parse(package);
  // find the index of the player
  var index = this.findPlayerIndex(package.uuid);

  // if the index exists or it is 0, execute the following...
  if(index || index === 0){
    if (package.name) {
      this.players[index].name = package.name;
    }

    // if the player is in spawning state or alive
    if (this.players[index].state === 1 || this.players[index].state === 2) {
    // update that specific player's ship's movements
      if(package.keys){
        this.players[index].ship.keys.up = package.keys.up;
        this.players[index].ship.keys.down = package.keys.down;
        this.players[index].ship.keys.left = package.keys.left;
        this.players[index].ship.keys.right = package.keys.right;
      }

      // if the player is alive
      if (this.players[index].state === 2){
        if (package.fire) {
          this.players[index].ship.sayPew();
        } else if(package.launch){
          this.players[index].ship.launchRocket()
        }
      }
    }

    // player is going to drop the nuke here | double check it's score
    if (package.nuke && this.players[index].score > 9 && this.players[index].ship.nuked === false) {
      this.players[index].ship.dropNuke();
    }

    // if the player is dead, reset its state to spawning
    if (this.players[index].state === 0) {
      if (package.start) {
        this.players[index].state = 1;
        this.players[index].spawn();
      }
    }
  }
}

// -------------------------------------------------------------------------------
Game.prototype.removeShrapnel = function() {
  var aliveShrapnel = [];
  for(var j = 0; j < this.shrapnel.length; j++){
    if(this.shrapnel[j].isExpired === false){
      aliveShrapnel.push(this.shrapnel[j]);
    }
  }
  this.shrapnel = aliveShrapnel;
};


Game.prototype.removeDebris = function() {
  for(var j = 0; j < this.debris.length; j++){
    if(this.debris[j].isExpired === true){
      this.debris.splice(j,1);
    }
  }
};

module.exports = Game;
