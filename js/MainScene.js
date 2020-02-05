class BaseScene extends Phaser.Scene {
    map;
    player;
    cursors;
    camera;
    exitLayer;
    playerOnStairs = false;
    exitScene = false;
    score = 0;
    scoreText;
    gemCount = 0;

    constructor(key) {
        super(key);
    }
    

    create()
    {
        this.gems = this.physics.add.staticGroup();
        this.skulls = this.physics.add.group({
            allowGravity: false
        });

        console.log(this.scene);
        this.scoreText = this.add.text(110,110, "Score: " + this.score ,{
            fontSize: "16px",
            fill: "white"
        }).setScrollFactor(0).setDepth(5);

        this.exitScene = false;
        this.map.landscape = this.map.addTilesetImage("landscape-tileset", "landscape-image");
        this.map.props = this.map.addTilesetImage("props-tileset", "props-image");
        this.map.atlas = this.map.addTilesetImage("atlas-tileset", "atlas-image");
        
        this.physics.world.setBounds(0,0, this.map.widthInPixels, this.map.heightInPixels);

        this.map.createStaticLayer("backGround", [this.map.landscape, this.map.props], 0, 0);
        this.map.createStaticLayer("backGround2", [this.map.landscape, this.map.props], 0, 0);
        this.map.createStaticLayer("platforms", [this.map.landscape, this.map.props], 0, 0);
        this.exitLayer = this.map.createStaticLayer("exit", [this.map.landscape, this.map.props], 0, 0);
        this.map.createStaticLayer("foreground", [this.map.landscape, this.map.props], 0, 0);
        this.stairsLayer = this.map.createStaticLayer("stairs", [this.map.landscape, this.map.atlas], 0, 0);
        this.map.getObjectLayer("objects").objects.forEach(function(object)
        {
            object = this.retrieveCustomProperties(object);

            if(object.type === "playerSpawner")
            {
                this.createPlayer(object);
            }
            else if(object.type === "pickUp")
            {
                this.createGem(object);
            }
            else if(object.type === "enemySpawner")
            {
                this.createSkull(object);
            }
        }, this);
        
        this.createCollision();
        this.setCamera();
    
        this.cursors = this.input.keyboard.createCursorKeys();

        this.anims.create({
            key: 'playerRun',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 9 }),
            frameRate: 20,
            repeat: -1
        });

        this.anims.create({
            key: 'playerRelax',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 1 }),
            frameRate: 20,
            repeat: -1
        });
    }

    update()
    {
        if(this.cursors.up.isDown && this.playerOnStairs)
        {
            this.player.setVelocityY(-150);
        }
        else if(this.cursors.down.isDown && this.playerOnStairs)
        {
            this.player.setVelocityY(150);
        }
        else if(this.playerOnStairs)
        {
            this.player.setVelocityY(0); 
        }
        
        if(this.playerOnStairs)
        {
            this.player.body.setAllowGravity(false);
        }
        else
        {
            this.player.body.setAllowGravity(true);
        }

        if(this.cursors.left.isDown)
        {
            this.player.setFlip(true,false);
            this.player.setVelocityX(-100);
            this.player.anims.play("playerRun", true);
        }
        else if(this.cursors.right.isDown)
        {
            this.player.anims.play("playerRun", true);
            this.player.setFlip(false,false);
            this.player.setVelocityX(100);
        }
        else
        {
            this.player.anims.play("playerRelax", true);
            this.player.setVelocityX(0);
        }

        if(Phaser.Input.Keyboard.JustDown(this.cursors.space) && !this.playerOnStairs)
        {
            this.player.setVelocityY(-200);
        }

        let stairTile = this.stairsLayer.getTileAtWorldXY(this.player.x, this.player.y);
        if(stairTile)
        {
            switch(stairTile.index)
            {
                case 383:
                case 319:
                case 415: 
                case 351:
                case 1375:
                case 1407:
                case 1439:
                case 1343: 
                    this.playerOnStairs = true;
                    break;   
            }
        }
        else
        {
            this.playerOnStairs = false;
        }

    }

    createPlayer(object)
    {
        this.player = this.physics.add.sprite(object.x, object.y, "player", 1);
        this.player.startPos = {x: this.player.x, y: this.player.y};
    }

    createGem(object)
    {
        this.gems.create(object.x, object.y, "gem");
        this.gemCount++;
    }

    createSkull(object)
    {
        let origin = {x: object.x, 
                      y: object.y + object.height/2};
        
        let dest = {x: object.x + object.width,
                    y: object.y + object.height/2};
        
        let line = new Phaser.Curves.Line(origin, dest);
        let skull = this.add.follower(line, origin.x, origin.y, "skull");
        this.physics.add.existing(skull);
        this.skulls.add(skull);

        skull.startFollow(
        {
            duration: 2500,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
    }


    createCollision()
    {
        this.collisionLayer = this.map.getLayer("platforms").tilemapLayer;
        this.collisionLayer.setCollisionBetween(0,1600);
        this.physics.add.collider(this.player, this.collisionLayer);
        this.physics.add.collider(this.skulls, this.collisionLayer);
        this.physics.add.overlap(this.player, this.skulls, function(obj, obj1)
        {
            this.player.x = this.player.startPos.x
            this.player.y = this.player.startPos.y
        },null,this);
        
        this.physics.add.overlap(this.player,this.gems,function(obj1, obj2)
        {
            this.score++;
            this.scoreText.text = "Score: " + this.score;
            obj2.destroy();
        },null, this);

    }

    setCamera()
    {
        this.camera = this.cameras.getCamera("");
        this.camera.startFollow(this.player);
        this.camera.setBounds(0,0, this.map.widthInPixels, this.map.heightInPixels);
        this.camera.setZoom(1.5);
    }

    retrieveCustomProperties(object) {
        if(object.properties) { //Check if the object has custom properties
            if(Array.isArray(object.properties)) { //Check if from Tiled v1.3 and above
                object.properties.forEach(function(element){ //Loop through each property
                    this[element.name] = element.value; //Create the property in the object
                }, object); //Assign the word "this" to refer to the object
            } else {  //Check if from Tiled v1.2.5 and below
                for(var propName in object.properties) { //Loop through each property
                    object[propName] = object.properties[propName]; //Create the property in the object
                }
            }
    
            delete object.properties; //Delete the custom properties array from the object
        }
    
        return object; //Return the new object w/ custom properties
    }
}

class SceneA extends BaseScene
{
    constructor()
    {
        super("sceneA");
    }

    preload() 
    {
        this.load.image("atlas-image", "../assets/atlas-tileset.png");
        this.load.image("landscape-image", "../assets/landscape-tileset.png");
        this.load.image("props-image", "../assets/props-tileset.png");
        this.load.spritesheet("player", "../assets/player.png", {frameWidth: 24, frameHeight: 24});
        this.load.image("gem", "../assets/gem.png");
        this.load.image("skull", "../assets/skull.png");

        //load the tiemap
        this.load.tilemapTiledJSON("level1", "../assets/level1.json");
    }

    create()
    {
        this.map = this.make.tilemap({key: "level1"});
        super.create();
    }

    update()
    {
        super.update();

        let tile = this.exitLayer.getTileAtWorldXY(this.player.x, this.player.y);
        if(tile && this.gemCount == this.score)
        {
            switch(tile.index)
            {
                case 200:
                case 201:
                case 206: 
                case 207:   
                    this.processExit();

                break;
            }
            
        }
    }

    processExit()
    {
        if(!this.sceneExit){
        console.log("exit");
        this.cameras.main.fadeOut(1000, 53, 22, 74);

        this.cameras.main.once('camerafadeoutcomplete', function (camera) {

            this.scene.start("SceneB", {score: this.score});
    
        }, this);
        }
        this.sceneExit = true;
      }
    }

class SceneB extends BaseScene
{
    constructor()
    {
        super("SceneB");
    }
    init(data)
    {
        this.score = data.score;
    }

    preload() 
    {
        this.load.image("landscape-image", "../assets/landscape-tileset.png");
        this.load.image("props-image", "../assets/props-tileset.png");
        this.load.spritesheet("player", "../assets/player.png", {frameWidth: 24, frameHeight: 24});
        
        //load the tiemap
        this.load.tilemapTiledJSON("level2", "../assets/level2.json");
    }

    create()
    {
        this.map = this.make.tilemap({key: "level2"});
        super.create();
        this.cameras.main.fadeFrom(1000, 53, 22, 74);
    }

    loadStart()
    {
        camera.fadeIn(1000, 0, 255, 255);
    }
}