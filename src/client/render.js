(function(){
  //constructor definition - Client side render model
  function Renderer(canvas){

    //grab given html canvas object
    this.canvas = canvas;
    this.canvas.height = window.innerHeight
    this.canvas.width = window.innerWidth

    //start lawn mower
    this.ctx = this.canvas.getContext("2d");

    this.ticker = 0
  }

  //iterate through all of the snapshot assets and run draw and each one
  Renderer.prototype.populateUniverse = function(){
    //clear the canvas before very frame
    this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height)
    //check if there is any input from WS
    if(this.objectsArray){
      //iterate through all the objects set in controller from on message WS
      for(var i = 0; i < this.objectsArray.length; i++){
        //run draw function for each individual object
        this.draw(this.objectsArray[i]);
      }
    }
  };

  Renderer.prototype.shipImages = function(thrustStatus,state,ticker){

    var image = new Image();
    var ticker = ticker || 0;

    if(state === "spawning" || state === "full"){
      image.src = Renderer.images.full[thrustStatus][ticker]
    } else if(state === "medium"){
      image.src = Renderer.images.medium[thrustStatus][ticker]
    } else if(state === "low"){
      image.src = Renderer.images.low[thrustStatus][ticker]
    }
    return image;
  };

  Renderer.prototype.extraImages = function(type){
    var image = new Image();
    if(type === "astroid"){
      image.src = Renderer.images.astroid
    } else if(type === "pew"){
      image.src = Renderer.images.pew
    }
    return image
  }

  // for an individual asset, run canvas methods to place on canvas


  Renderer.prototype.draw = function(object){
    // get the dimensions of the object
    var dims = this.dimensions(object);

    // for testing purpose only
    this.ctx.fillStyle = "white";

    // translate the object center point
    this.ctx.translate(dims.midpointX, dims.midpointY);

    // rotate at the object's center point
    this.ctx.rotate(dims.rad - (Math.PI/2));

    var img = new Image()
    if(object.type === "ship"){


      //run ship images if its a ship to get appropriate frames
      if(object.thrustStatus === "pumpYourBrakes" || object.thrustStatus === "stationary"){
        img = this.shipImages(object.thrustStatus, object.state)  
      } else {
        img = this.shipImages(object.thrustStatus, object.state, this.ticker)
      }
      
      if(object.state === "spawning") {
        //make opaque
        this.ctx.globalAlpha = 0.3

      }
      this.ctx.drawImage(img, dims.width/(-2), dims.height/(-2))
      this.ctx.globalAlpha = 1.0
      this.ticker === 4 ? this.ticker = 0 : this.ticker += 1
    
    } else if (object.type === "astroid" || object.type === "pew"){
        img = this.extraImages(object.type)
        this.ctx.drawImage(img, dims.width/(-2), dims.height/(-2))
    } else {
        this.ctx.fillRect(dims.width/(-2),dims.height/(-2), dims.width, dims.height);
    }




    // rotate the canvas back to its original state
    this.ctx.rotate((dims.rad-(Math.PI/2))/-1);

    // translate the canvas back to where the img is center is the center of the canvas
    this.ctx.translate(dims.midpointX/-1, dims.midpointY/-1);
  }

  // takes in a snapshot asset (each asset has an x, y, rad - width and height are accessed from itemKey object literal)
  Renderer.prototype.dimensions = function(currentAsset){
    return {
      width: itemKey[currentAsset.type].width,
      height: itemKey[currentAsset.type].height,
      rad: currentAsset.rad,
      x: currentAsset.x,
      y: currentAsset.y,
      midpointX: currentAsset.x + (itemKey[currentAsset.type].width/2),
      midpointY: currentAsset.y + (itemKey[currentAsset.type].height/2)
    }
  }

  //runs populateUniverse in a repeated loop
  //takes in a snapshotAssetArray to update itself
  Renderer.prototype.tickTock = function(){
    var that = this;
    function execute(){
      window.requestAnimationFrame(execute);
      that.populateUniverse();
    }
    execute();
  }

  // welcome the users
  Renderer.prototype.showState = function(state) {
    var welcome = document.getElementById("welcome");
    var score = document.getElementById("score");
    if (state !== 0) {
      welcome.setAttribute("class", "hidden");
      score.setAttribute("style", "opacity: 0.4");
    } else {
      welcome.removeAttribute("class");
      // score.removeAttribute("class");
    }
  }

  // rendering the scores to the screen
  Renderer.prototype.showScores = function(scoresArray) {
    var scoreDiv = document.getElementById("score");
    scoreDiv.innerHTML = '';
    var scoresDisplay = document.createElement('ol');
    var newHTML = '';
    for (var i = 0; i < scoresArray.length; i++){
      var score = scoresArray[i].score
      var dots = 40 - (scoresArray[i].name.length + score.toString().length)
      var dotString = '';
      for (var j = 0; j < dots; j++) {
        dotString += "."
      }
      newHTML += "<li>" + scoresArray[i].name + dotString + scoresArray[i].score + "</li>";
    }
    scoresDisplay.innerHTML = newHTML;
    scoreDiv.appendChild(scoresDisplay);
  }


  // item keys to identify their dimensions
  var itemKey = {

    ship:     {width: 65, height: 59},
    pew:      {width: 4, height: 10},
    astroid:  {width: 45, height: 49},
    debris:  {width: 7, height: 7},
    shrapnel: {width: 3, height: 3},
    star_one: {width: 2, height: 2},
    star_two: {width: 4, height: 4},
    star_three: {width: 6, height: 6}
  }
//---------------------images----------------------------

  Renderer.images = {
    full: { 
      upShip: ["http://i.imgur.com/OjQL9nk.png","http://i.imgur.com/Ice0ahG.png","http://i.imgur.com/LPSjtUm.png","http://i.imgur.com/dDo84hf.png","http://i.imgur.com/xeSWbGW.png"],
      upLeftShip: ["http://i.imgur.com/HB35u91.png","http://i.imgur.com/YigBqAN.png","http://i.imgur.com/utjjT1j.png","http://i.imgur.com/jIrky4d.png","http://i.imgur.com/jIrky4d.png"],
      upRightShip: ["http://i.imgur.com/dIf6OBS.png","http://i.imgur.com/8CuW90w.png","http://i.imgur.com/2LHj4HA.png","http://i.imgur.com/6GdvCm6.png","http://i.imgur.com/6GdvCm6.png"],
      leftShip: ["http://i.imgur.com/dPVBJQf.png","http://i.imgur.com/xEy0DFC.png","http://i.imgur.com/asyEDMw.png","http://i.imgur.com/Ji7Y4sk.png","http://i.imgur.com/wDOXFjK.png"],
      rightShip: ["http://i.imgur.com/7LUcTQ9.png","http://i.imgur.com/R17dabw.png","http://i.imgur.com/F9ZJVCJ.png","http://i.imgur.com/5s52V4w.png","http://i.imgur.com/IuQkhWJ.png"],
      pumpYourBrakes: ["http://i.imgur.com/h6kWQjf.png"],
      stationary:["http://i.imgur.com/JDMrHaJ.png"]
    },
    medium:{
      upShip:["http://i.imgur.com/ilRT5sh.png","http://i.imgur.com/fYIkFQW.png","http://i.imgur.com/2sD9KWe.png","http://i.imgur.com/6TDANKi.png","http://i.imgur.com/up6kPHE.png"],
      upLeftShip:["http://i.imgur.com/SwQRPTD.png","http://i.imgur.com/9k4vXS4.png","http://i.imgur.com/mW00pvw.png","http://i.imgur.com/PaXxsvX.png","http://i.imgur.com/htCN2oH.png"],
      upRightShip:["http://i.imgur.com/htCN2oH.png","http://i.imgur.com/PaXxsvX.png","http://i.imgur.com/mW00pvw.png","http://i.imgur.com/9k4vXS4.png","http://i.imgur.com/SwQRPTD.png"],
      leftShip:["http://i.imgur.com/NdErAPq.png","http://i.imgur.com/45tSJYz.png","http://i.imgur.com/PNlJEqV.png","http://i.imgur.com/rrfeH7Y.png","http://i.imgur.com/uoYvUzd.png"],
      rightShip:["http://i.imgur.com/AttlUbL.png","http://i.imgur.com/sXga3WL.png","http://i.imgur.com/Qsrv7yK.png","http://i.imgur.com/B12oya6.png","http://i.imgur.com/ozVmgPt.png"],
      pumpYourBrakes:["http://i.imgur.com/TiEaDqK.png"],
      stationary:["http://i.imgur.com/PQsXuAG.png"]
    },
    low:{
      upShip:["http://i.imgur.com/lPNJFJJ.png","http://i.imgur.com/2t0KFG7.png","http://i.imgur.com/ZDGNdXv.png","http://i.imgur.com/xhf4Ye2.png","http://i.imgur.com/pPIY2dX.png"],
      upLeftShip:["http://i.imgur.com/Zj88mgl.png","http://i.imgur.com/Yvmv5Kx.png","http://i.imgur.com/h2MrYAL.png","http://i.imgur.com/FpZQCPY.png","http://i.imgur.com/dupbe2I.png"],
      upRightShip:["http://i.imgur.com/NasSsEW.png","http://i.imgur.com/UxTeSJh.png","http://i.imgur.com/mjGubGk.png","http://i.imgur.com/dIwjqhW.png","http://i.imgur.com/7zDJCl5.png"],
      leftShip:["http://i.imgur.com/PzeqDqO.png","http://i.imgur.com/Cvc5xd8.png","http://i.imgur.com/KGNss2f.png","http://i.imgur.com/hvjuMr3.png","http://i.imgur.com/UQlXhbs.png"],
      rightShip:["http://i.imgur.com/o35Ofpx.png","http://i.imgur.com/9HujO7e.png","http://i.imgur.com/QKmRLRw.png","http://i.imgur.com/Uqwcu8p.png","http://i.imgur.com/KoJtlDu.png"],
      pumpYourBrakes:["http://i.imgur.com/O6JWmEo.png"],
      stationary:["http://i.imgur.com/UQlXhbs.png"]
    },
    astroid: "http://i.imgur.com/8i5gG51.png",
    pew: "http://i.imgur.com/VioerDV.png"
  }

  window.Renderer = Renderer;
})()
