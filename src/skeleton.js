import * as THREE from '../lib/three.module.js';
import { Arm } from './arm.js';

export class Skeleton {
    constructor(r, useFABRIK) {
        this.root = new THREE.Vector3();
        this.root.copy(r);
        //init left arm joint limits
        const leftLimit0 = [THREE.MathUtils.degToRad(130), THREE.MathUtils.degToRad(230)];
        const leftLimit1 = [THREE.MathUtils.degToRad(-50), THREE.MathUtils.degToRad(50)];
        const leftLimit2 = [THREE.MathUtils.degToRad(-40), THREE.MathUtils.degToRad(40)];
        const leftLimit3 = [THREE.MathUtils.degToRad(-30), THREE.MathUtils.degToRad(30)];
        const leftJointLimits = [leftLimit0, leftLimit1, leftLimit2, leftLimit3];

        //init right arm joint limits
        const rightLimit0 = [THREE.MathUtils.degToRad(-50), THREE.MathUtils.degToRad(50)];
        const rightLimit1 = [THREE.MathUtils.degToRad(-50), THREE.MathUtils.degToRad(50)];
        const rightLimit2 = [THREE.MathUtils.degToRad(-40), THREE.MathUtils.degToRad(40)];
        const rightLimit3 = [THREE.MathUtils.degToRad(-30), THREE.MathUtils.degToRad(30)];
        const rightJointLimits = [rightLimit0, rightLimit1, rightLimit2, rightLimit3];

        this.leftArm = new Arm(leftJointLimits, this.root, useFABRIK);
        this.rightArm = new Arm(rightJointLimits, this.root, useFABRIK);

        // movement params
        this.moveLeft = false;
        this.moveRight = false;
        this.jump = false;
        this.jumping = false;
        this.velY = 0;

        //visuals of person
        const material = new THREE.MeshBasicMaterial({color: "rgb(0,0,0)"})

        //head
        const headGeometry = new THREE.SphereGeometry(0.5,32,16);
        this.headMesh = new THREE.Mesh(headGeometry, material);
        this.headMesh.position.copy(this.root);
        this.headMesh.position.setY(this.root.y + 1);

        //torso
        const torsoGeometry = new THREE.BoxGeometry(0.25,2,0.1);
        this.torsoMesh = new THREE.Mesh(torsoGeometry, material);
        this.torsoMesh.position.copy(this.root);

        //left leg
        const leftLegGeometry = new THREE.BoxGeometry(0.25,2,0.1);
        this.leftLegMesh = new THREE.Mesh(leftLegGeometry, material);
        this.leftLegMesh.position.copy(this.root);
        this.leftLegMesh.position.setY(this.root - 2);
        this.leftLegMesh.position.setX(this.root.y - 0.5);
        this.leftLegMesh.rotateZ(THREE.MathUtils.degToRad(150));

        //right leg
        const rightLegGeometry = new THREE.BoxGeometry(0.25,2,0.1);
        this.rightLegMesh = new THREE.Mesh(rightLegGeometry, material);
        this.rightLegMesh.position.copy(this.root);
        this.rightLegMesh.position.setY(this.root - 2);
        this.rightLegMesh.position.setX(this.root.y + 0.5);
        this.rightLegMesh.rotateZ(THREE.MathUtils.degToRad(-150));
    }

    update(dt, goal) {
        this.leftArm.update(dt, goal);
        this.rightArm.update(dt, goal);

        //compute root movement positions
        const speed = 5;
        if(this.moveLeft) {
            const amount = this.root.x - (speed * dt);
            this.root.setX(amount);
        }

        if(this.moveRight) {
            const amount = this.root.x + (speed * dt);
            this.root.setX(amount);
        }

        //gravity
        this.velY += -9.8 * dt;
        this.root.setY(this.root.y + this.velY * dt);

        if(this.root.y < 0) {
            this.root.setY(0);
            this.velY = 0;
            this.jumping = false;
        }

        if(this.jump) {
            if(!this.jumping) {
                this.velY = 5;
                this.jumping = true;
            }
        }

        //set arm roots to be skeleton root
        this.leftArm.root.copy(this.root);
        this.rightArm.root.copy(this.root);

        //set mesh position to root
        this.torsoMesh.position.copy(this.root);
        this.headMesh.position.copy(this.root);
        this.headMesh.position.setY(this.root.y + 1);
        this.leftLegMesh.position.copy(this.root);
        this.leftLegMesh.position.setX(this.root.x - 0.5);
        this.leftLegMesh.position.setY(this.root.y - 1.9);
        this.rightLegMesh.position.copy(this.root);
        this.rightLegMesh.position.setX(this.root.x + 0.5);
        this.rightLegMesh.position.setY(this.root.y - 1.9);
    }

}