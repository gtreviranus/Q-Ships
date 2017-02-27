(function() {

  //pew class (missiles) and associated functions
  function Pew(uuid, x, y, dx, dy, rad) {
    var pewThrust = 10;
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 10;
    this.dx = dx + pewThrust * Math.cos(rad);
    this.dy = dy + pewThrust * Math.sin(rad);
    this.rad = rad;
    this.uuid = uuid;
    this.isExpired = false;
    this.destructionTimer();
    this.hp = 1;
    this.hitBuffer = 5;
  }

  Pew.prototype.move = function(width, height) {
    this.x += this.dx;
    this.y += this.dy;
    if (this.x > width) {
      this.x = this.x - width;
    } else if (this.x < 0) {
      this.x = this.x + width;
    }
    if (this.y > height) {
      this.y = this.y - height;
    } else if (this.y < 0) {
      this.y = this.y + height;
    }
  }

  Pew.prototype.destructionTimer = function() {
    var that = this
    setTimeout(function() {
      that.isExpired = true
    }, 900);
  };

  Pew.prototype.snapshot = function() {
    return {
      x: this.x,
      y: this.y,
      rad: this.rad,
      type: "pew"
    }
  }

  if (typeof module !== "undefined") {
    module.exports = Pew;
  } else {
    window.Pew = Pew;
  }
})()