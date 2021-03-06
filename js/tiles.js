  function copy(object) {
      if (!object || typeof (object) != 'object' || object instanceof Class) {
        return object;
      } else if (object instanceof Array) {
        var c = [];
        for (var i = 0, l = object.length; i < l; i++) {
            c[i] = copy(object[i]);
        }
        return c;
      } else {
        var c = {};
        for (var i in object) {
            c[i] = copy(object[i]);
        }
        return c;
      }
    }
    //-----------------------------------------------------------------------------
    // Class object based on John Resigs code; inspired by base2 and Prototype
    // http://ejohn.org/blog/simple-javascript-inheritance/
    (function () {
      var initializing = false,
        fnTest = /xyz/.test(function () {
            xyz;
        }) ? /\bparent\b/ : /.*/;

      this.Class = function () {};
      var inject = function (prop) {
        var proto = this.prototype;
        var parent = {};
        for (var name in prop) {
            if (typeof (prop[name]) == "function" && typeof (proto[name]) ==
                "function" && fnTest.test(prop[name])) {
                parent[name] = proto[name]; // save original function
                proto[name] = (function (name, fn) {
                    return function () {
                        var tmp = this.parent;
                        this.parent = parent[name];
                        var ret = fn.apply(this, arguments);
                        this.parent = tmp;
                        return ret;
                    };
                })(name, prop[name]);
            } else {
                proto[name] = prop[name];
            }
        }
      };

      this.Class.extend = function (prop) {
        var parent = this.prototype;

        initializing = true;
        var prototype = new this();
        initializing = false;

        for (var name in prop) {
            if (typeof (prop[name]) == "function" && typeof (parent[name]) ==
                "function" && fnTest.test(prop[name])) {
                prototype[name] = (function (name, fn) {
                    return function () {
                        var tmp = this.parent;
                        this.parent = parent[name];
                        var ret = fn.apply(this, arguments);
                        this.parent = tmp;
                        return ret;
                    };
                })(name, prop[name]);
            } else {
                prototype[name] = prop[name];
            }
        }

        function Class() {
            if (!initializing) {

                // If this class has a staticInstantiate method, invoke it
                // and check if we got something back. If not, the normal
                // constructor (init) is called.
                if (this.staticInstantiate) {
                    var obj = this.staticInstantiate.apply(this, arguments);
                    if (obj) {
                        return obj;
                    }
                }

                for (var p in this) {
                    if (typeof (this[p]) == 'object') {
                        this[p] = copy(this[p]); // deep copy!
                    }
                }

                if (this.init) {
                    this.init.apply(this, arguments);
                }
            }

            return this;
        }

        Class.prototype = prototype;
        Class.constructor = Class;
        Class.extend = arguments.callee;
        Class.inject = inject;

        return Class;
      };

    })();
   
    // Base class to run the chessboard
    EngineClass = Class.extend({
      tiles: [],
      factory: {},
     
      spawnTile: function (typename) {
        var tile = new (this.factory[typename])();

        this.tiles.push(tile);

        return tile;
      },

      update: function() {
        for (var i = 0; i < this.tiles.length; i++) {
          var tile = this.tiles[i];
          if (!tile._killed)
            tile.update();
        }
      },

      setup: function() {
        canvas = document.getElementById("board");
        ctx = canvas.getContext('2d');
        canvas.width = 460;
        canvas.height = 460;
      
        ctx.font = '12pt Calibri';
        ctx.fillStyle = 'black';

        sources = {
          chessboard: 'img/chessboard.png',
          horizTile: 'img/horiztile.png',
          vertTile: 'img/verttile.png'
        };

        loadImages(sources, function(images) {
          ctx.drawImage(images.chessboard, 0, 0);
          ctx.drawImage(images.horizTile, 0, 410);
          ctx.drawImage(images.vertTile, 410, 0);
        });
        
        //var horiz = this.spawnTile('Horiz');
        //var vert = this.spawnTile('Vert');
        
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("click", onClick); 
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        //intervalId = setInterval(this.draw, 20);

      },

      draw: function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(images.chessboard, 0, 0);
        ctx.drawImage(images.horizTile, 0, 410);
        ctx.drawImage(images.vertTile, 410, 0);
        ctx.fillText(message, 370, 430);
        // should not be gEngine below...
        gEngine.update();
      }

    });

    // Base class for horizontal and vertical tiles
    TileClass = Class.extend({
      pos: {x:0,y:0},
      size: {x:0,y:0},
      mid: {x:0, y:0},
      image: null,
      _killed: false,
      currTile: null,
      selected: false,

      update: function() { },
    
      draw: function() {
        if (this.currTile) {
          ctx.drawImage(this.image, this.pos.x, this.pos.y);
        }
      }
      
    });
    
    // Horizontal tile class
    HorizClass = TileClass.extend({
      pos: {x:0, y:410},
      size: {x:100, y:50}, 
      mid: {x:50, y:410},
      kill: function() {
        this._killed = true;
        gEngine.removeTile(this);   
      },

      update: function() {
        // keep in bounds
        if (this.pos.x > 300)
          this.pos.x = 300;
        if (this.pos.y > 350)
          this.pos.y = 350;

        // keep out of bottom corner
        if(this.pos.x > 250) {
          if (this.pos.y > 300)
            this.pos.y = 300;
          //else if (this.pos.y > 250)// && this.pos.y > this.pos.x)
          //  this.pos.x = 300;
        }
        this.mid.x = this.pos.x + 50;
        this.mid.y = this.pos.y;
        ctx.drawImage(images.horizTile, this.pos.x, this.pos.y);
      }
    });
    
     // Vertical tile class
    VertClass = TileClass.extend({
      pos: {x:410, y:0},
      size: {x:50, y:100},
      mid: {x:410, y:50},
      kill: function() {
        gEngine.removeTile(this);
      },
      
      update: function() {
        // Keep in bounds
        if (this.pos.x > 350)
          this.pos.x = 350;

        if (this.pos.y > 300)
          this.pos.y = 300;
        
        // keep out of bottom corner
        if(this.pos.x > 300) {
          if (this.pos.y > 250)
            this.pos.y = 250;
        //else if (posy > 250 && posy > posx)
        //  posx = 300;
        }
 
        this.mid.x = this.pos.x;
        this.mid.y = this.pos.y + 50;
        ctx.drawImage(images.vertTile, this.pos.x, this.pos.y);
      }
    }); 
    
    // Setup engine
    var gEngine = new EngineClass();        
    gEngine.factory['Horiz'] = HorizClass;
    gEngine.factory['Vert'] = VertClass;

    // Setup variables
    var canvas = null;
    var ctx = null;
    var intervalId;
    var sources = {};
    var images = {};
    var posx = 0;
    var posy = 0;
    var centerX = -30;
    var centerY = -50;
    var MAXTILES = 30;  // makes 31 tiles
    var message = "Total: 0";
    var selected = null;
    var shft = 0;

    function onKeyDown(event) {
      if (event.shiftKey) {
        shft = 1;
      }
    }

    function onKeyUp(event) {
      if (event.keyCode == 16) {
        shft = 0;
      }
    }

    function onMouseMove(event)
    {
      var bounds = canvas.getBoundingClientRect();
      var x = event.clientX - bounds.left;
      var xm10 = x%10;
      var xm100 = x%100-xm10;

      var y = event.clientY - bounds.top;
      var ym10 = y%10;
      var ym100 = y%100 - ym10;

      // snap to grid
      if ((xm100) < 50)
        posx = (x - xm10 - xm100);
      else
        posx = (x - xm10 - xm100)  + 50;
      
      if ((ym100) < 50)
        posy = (y - ym10 - ym100);
      else
        posy = (y - ym10 - ym100) + 50;

      // keep out of top corner
      if (posx < 50) {
        if (posy < 50)
          posy = 50;
      }
      //else if(posx > 300) {
      //  if (posy > 250)
      //    posy = 250;
      //  else if (posy > 250 && posy > posx)
      //    posx = 300;
      //}

      for (var i = 0; i < gEngine.tiles.length; i++) {
        var tile = gEngine.tiles[i];
        if (tile.selected) {
          //console.log("tile, ", i);
          tile.pos.x = posx;
          tile.pos.y = posy;
        }
      }
      //posx = posx //+ centerX;
      //posy = posy + centerY;
      //console.log("pos: ", posx, ", ", posy);
      //console.log("(realX: ", event.clientX, ", realY: ", event.clientY, ",normalizedX: ", posx, ", ", posy, ")");
    }

    function onClick(event)
    {
      var bounds = canvas.getBoundingClientRect();
      var posx = event.clientX - bounds.left;
      var posy = event.clientY - bounds.top;
      var horiz = {pos: {x:0, y:410}, size: {x:100, y:50}};
      var vert = {pos: {x:410, y:0}, size: {x:50, y:100}};

      // Create a new tile
      if (posx > horiz.pos.x && posx < (horiz.pos.x + horiz.size.x)) {
        if (posy > horiz.pos.y && posy < (horiz.pos.y + horiz.size.y)) {
          // Keep tiles less than MAXTILES
          if (gEngine.tiles.length > MAXTILES) 
            return;

          //console.log("create horiz");
          // create a new horiz tile and select it
          var htile = gEngine.spawnTile("Horiz");
          htile.pos.x = 0;
          htile.pos.y = 410;
          htile.selected = true;
          selected = htile;

          // update total message
          message = "Total: " + gEngine.tiles.length;

          return;
        }
      }
      else if (posx > vert.pos.x && posx < (vert.pos.x + vert.size.x)) {
        if (posy > vert.pos.y && posy < (vert.pos.y + vert.size.y)) {
          // keep tiles less than MAXTILES
          if (gEngine.tiles.length > MAXTILES)
            return;

          //console.log("create vert");
          var vtile = gEngine.spawnTile("Vert");
          vtile.pos.x = 410;
          vtile.pos.y = 0;
          vtile.selected = true;
          selected = vtile;
        
          // update total message
          message = "Total: " + gEngine.tiles.length;

          return;
        }
      }

      // Select a tile
      if (selected) {
        // remove tile if middle click
        if (event.which == 2 || shft == 1) { 
          gEngine.tiles.splice(gEngine.tiles.indexOf(selected),1);
          message = "Total: " + gEngine.tiles.length;
          selected = null;
          return;
        }
        for (var j = 0; j < gEngine.tiles.length; j++) {
          if (!gEngine.tiles[j].selected) {
            var begx = selected.pos.x;
            var begy = selected.pos.y;
            var endx = selected.mid.x;
            var endy = selected.mid.y;
            var begTileX = gEngine.tiles[j].pos.x;
            var begTileY = gEngine.tiles[j].pos.y;
            var endTileX = gEngine.tiles[j].mid.x;
            var endTileY = gEngine.tiles[j].mid.y;

            //console.log("begx: ", begx, " begTileX: ", begTileX);
            //console.log("begy: ", begy, " begTileY: ", begTileY);
            //console.log("endx: ", endx, " endTileX: ", endTileX);
            //console.log("endy: ", endy, " endTileY: ", endTileY);
            if (begx == begTileX && begy == begTileY)
              return;
            if (endx == endTileX && endy == endTileY)
              return;
            if (begx == endTileX && begy == endTileY)
              return;
            if (endx == begTileX && endy == begTileY)
              return;
          }
        }
          selected.selected = false;
          selected = null;
          //console.log("deselected, ", i);
          return;
      }
      else {
        for (var i = 0; i < gEngine.tiles.length; i++) {
          var tile = gEngine.tiles[i];
          if (posx > tile.pos.x && posx < (tile.pos.x + tile.size.x)) {
            if (posy > tile.pos.y && posy < (tile.pos.y + tile.size.y)){
              // remove tile if middle click
              if (event.which == 2 || shft == 1) {
                gEngine.tiles.splice(i,1);
                message = "Total: " + gEngine.tiles.length;
                return;
              }
              tile.selected = true;
              selected = tile;
              //console.log("selected, ", i);
              return;
            }
          }
        }
      }
        
      //console.log("click: ", posx, posy, event.which);
    }

    function loadImages(sources, callback) 
    {
      var loadedImages = 0;
      var numImages = 0;

      for (var src in sources) {
        images[src] = new Image();
        images[src].onload = function() {
          if (++loadedImages >= numImages) {
            callback(images);
          }
        };
        images[src].src = sources[src];
      }
    }
