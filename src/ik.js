import * as THREE from '../lib/three.module.js';
import { GUI } from '../lib/dat.gui.module.js';
import * as STATS from '../lib/stats.js';
import { IKScene } from './IKScene.js';
import { Skeleton } from './skeleton.js';
import { GLTFLoader } from '../lib/GLTFLoader.js';

const contentDiv = document.getElementById("content");

const stats = STATS.default();
contentDiv.appendChild(stats.dom);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const modelLoader = new GLTFLoader();

let ikScene, skeleton, pointerHelper, soccerGoal;
let gui;

// Simulation Parameters /////////////////
let parameters = {
    useFABRIK: false,
    ResetSimulation: restart,
}

///////////////////////////////////


// initialize simulation on page load
window.onload=init;

// function that initializes and runs simulation
function init() {
    //set up Threejs components
    setupThreejs();

    // set up GUI
    gui = new GUI();

    //environment parameters
    const parametersFolder = gui.addFolder('Parameters');
    parametersFolder.add(parameters, 'useFABRIK');
    parametersFolder.open();

    // restart simulation
    const resetSimulationFolder = gui.addFolder('Restart Simulation');
    resetSimulationFolder.add(parameters, 'ResetSimulation').name("Click To Restart The Simulation");
    resetSimulationFolder.open();

    console.log("running simulation");
    // run the simulation
    runSimulation();

    // render scene
    render();
}

// function that initializes and runs the simulation
function runSimulation() {
    //skeleton
    skeleton = new Skeleton(new THREE.Vector3(0,0,0), parameters.useFABRIK);

    // add skeleton arrow helpers to scene
    // left arm
    for (let i = 0; i < skeleton.leftArm.arrows.length; i++) {
        ikScene.add(skeleton.leftArm.arrows[i]);
    }

    //right arm
    for (let i = 0; i < skeleton.rightArm.arrows.length; i++) {
        ikScene.add(skeleton.rightArm.arrows[i]);
    }

    //add skeleton body to scene
    ikScene.add(skeleton.headMesh);
    ikScene.add(skeleton.torsoMesh);
    ikScene.add(skeleton.leftLegMesh);
    ikScene.add(skeleton.rightLegMesh);

}

//function that sets up all the threejs components for rendering a scene
function setupThreejs() {
    ikScene = new IKScene(contentDiv.clientWidth, contentDiv.clientHeight);
    ikScene.AddLights();
    ikScene.AddGround();
    ikScene.AddWall();

    modelLoader.load('./Soccergoal.glb', function(gltf) {
        console.log(gltf.scene.children[0]);
        soccerGoal = gltf.scene;
        soccerGoal.children[0].scale.set(7,5,5);
        soccerGoal.children[0].position.set(0,-3,0);

        soccerGoal.children[1].scale.set(7,5,5);
        soccerGoal.children[1].position.set(0,-3,0);

        ikScene.add(soccerGoal);
    },undefined, function ( error ) {

        console.error( error );
    
    });

    // add threejs renderer to html dom element
    contentDiv.appendChild( ikScene.renderer.domElement );


    // set up pointer helper object
    const pointerHelperMat = new THREE.MeshBasicMaterial({color: "rgb(250,250,250)", transparent: true, opacity: 0.75});
    const pointerHelperGeometry = new THREE.SphereGeometry(0.5,32,16)
    pointerHelper = new THREE.Mesh(pointerHelperGeometry, pointerHelperMat);
    pointerHelper.position.copy(new THREE.Vector3(0,0,0));
    ikScene.add(pointerHelper);
    
    /* set up event listeners */

    // set up listener for window resizing
    window.addEventListener( 'resize', onWindowResize );

    // set up listener to track keydown event
    window.addEventListener( 'keydown', onKeyDown );

    // set up listener to track keyup event
    window.addEventListener('keyup', onKeyUp);

    // set up listener to track mouse move event
    window.addEventListener('mousemove', onMouseMove);
}

// function that runs everytime the window is resized (used for automatically setting the new size and aspect ratio )
function onWindowResize() {
    ikScene.onWindowResize(contentDiv.clientWidth, contentDiv.clientHeight);
    render();
}

// function that runs each time a key is pressed down
function onKeyDown( event ) {
    if (event.key == "w") {
        skeleton.jump = true;
    }
    else if (event.key == "a") {
        skeleton.moveLeft = true;
    }
    else if (event.key == "d") {
        skeleton.moveRight = true;
    }
}

// function that runs each time a key is released
function onKeyUp( event ) {
    if (event.key == "w") {
        skeleton.jump = false;
    }
    else if (event.key == "a") {
        skeleton.moveLeft = false;
    }
    else if (event.key == "d") {
        skeleton.moveRight = false;
    }
}

// function that runs each time a key is released
function onMouseMove( event ) {
    pointer.x = (event.clientX/contentDiv.clientWidth) * 2 - 1;
    pointer.y = -(event.clientY/contentDiv.clientHeight) * 2 + 1;
}

// function that is called every frame and renders the scene
function render() {
    stats.begin();
    let dt = clock.getDelta();
    ikScene.controls.update();

    // update the picking ray with the camera and pointer position
	raycaster.setFromCamera( pointer, ikScene.camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObject( ikScene.wall );

    if(intersects.length > 0) {
        pointerHelper.position.copy(intersects[0].point);
    }

    if(dt != Infinity || dt > 1 || dt == 0) { // initially dt is infinity so need to account for this
        // ik solver works in 2D so ignore z direction
        const goal = new THREE.Vector3(pointerHelper.position.x, pointerHelper.position.y, 0);

        skeleton.update(dt, goal);
    }

    ikScene.render( ikScene.scene, ikScene.camera );
    stats.end();

    requestAnimationFrame(render);
}


//function that restarts the simulation
function restart () {
    console.log("resetting simulation");

    // remove skeleton arrow helpers to scene
    for (let i = 0; i < skeleton.leftArm.arrows.length; i++) {
        ikScene.remove(skeleton.leftArm.arrows[i]);
    }

    for (let i = 0; i < skeleton.rightArm.arrows.length; i++) {
        ikScene.remove(skeleton.rightArm.arrows[i]);
    }

    ikScene.remove(skeleton.headMesh);
    ikScene.remove(skeleton.torsoMesh);
    ikScene.remove(skeleton.leftLegMesh);
    ikScene.remove(skeleton.rightLegMesh);

    runSimulation();
}
