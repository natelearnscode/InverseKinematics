import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';

export class IKScene {
    constructor(canvasWidth, canvasHeight) {
        // set up renderer
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( canvasWidth, canvasHeight );
        this.renderer.setClearColor("#D4F1F4");
        this.renderer.shadowMap.enabled = true;

        // set up scene
        this.scene = new THREE.Scene();
        
        // set up camera
        this.camera = new THREE.PerspectiveCamera( 75, canvasWidth / canvasHeight, 0.5, 5000 );
        this.camera.position.set( 0, 2, 15 );

        // set up camera controls
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );

        this.wall;
    }

    //add object to scene
    add(object) {
        this.scene.add(object);
    }

    //remove object from scene
    remove(object) {
        this.scene.remove(object);
    }

    // method that runs every time the window is resized (used for automatically setting the new size and aspect ratio )
    onWindowResize(canvasWidth, canvasHeight) {

        this.renderer.setSize( canvasWidth, canvasHeight );

        this.camera.aspect = canvasWidth / canvasHeight;
        this.camera.updateProjectionMatrix();

        //render();
    }

    AddLights() {
        console.log('adding lights to scene')
        // set up lights
        const light =  new THREE.DirectionalLight( 0xffffff, 0.5 );
        light.castShadow = true; // default false
        //light.position.set(-2, 5, 0)
        this.scene.add(light);

        // add hemisphere light
        const hemisphereLight =  new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.5 );
        this.scene.add(hemisphereLight);
    }

    AddWall() {
        // Create wall
        const wallGeometry = new THREE.BoxGeometry(20, 12, 0.1);
        const wallMaterial = new THREE.MeshBasicMaterial({color: "rgb(150, 150, 150)", transparent: true, opacity: 0.5});

        this.wall = new THREE.Mesh(wallGeometry, wallMaterial);
        this.wall.receiveShadow = true;
        this.wall.position.set(0,0.5,-0.5);
        this.scene.add(this.wall)
    }

    AddGround() {
        // Create Floor
        const floorGeometry = new THREE.BoxGeometry(50, 0.5, 50);
        const floorMaterial = new THREE.MeshLambertMaterial({color: "rgb(200, 255, 200)"});

        // load floor texture
        const texture = new THREE.TextureLoader().load('./Vol_42_1_Base_Color.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 4, 4 );
        floorMaterial.map = texture;

        // load floor normal map texture
        const normalTexture = new THREE.TextureLoader().load('./Vol_42_1_Normal.png');
        normalTexture.wrapS = THREE.RepeatWrapping;
        normalTexture.wrapT = THREE.RepeatWrapping;
        normalTexture.repeat.set( 4, 4 );
        floorMaterial.normalMap = normalTexture;



        const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        floorMesh.receiveShadow = true;
        floorMesh.position.set(0,-3,0);

        this.scene.add(floorMesh);
    }

    render() {
        this.renderer.render( this.scene, this.camera )
    }
}