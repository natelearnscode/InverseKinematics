import * as THREE from '../lib/three.module.js';

export class Arm {
    constructor(limits, r, useFABRIK) {
        this.useFABRIK = useFABRIK;
        this.material = new THREE.MeshBasicMaterial({color: "rgb(150, 150, 150)"});
        this.geometry;
        this.mesh;
        this.root = new THREE.Vector3(0,0,0);
        this.root.copy(r);
        this.numberOfJoints = 4;
        this.arrows = [];
        this.joints = [];
        this.lengths = [];
        this.angles = [];
        //init joints
        for (let i = 0; i < this.numberOfJoints; i++) {
            const joint = new THREE.Vector3();
            const length = 1 - 0.20 * i;
            const angle = THREE.MathUtils.degToRad(0.0);

            this.joints.push(joint);
            this.lengths.push(length);
            this.angles.push(angle);
        }

        //init joint limits

        this.jointLimits = limits;

        this.fk();

        //init arrow helpers to visualize
        let prev_joint = new THREE.Vector3(0,0,0);
        prev_joint.copy(this.root);
        for (let i = 0; i < this.joints.length; i++) {
            const dir = new THREE.Vector3(0,0,0);
            dir.subVectors(this.joints[i], prev_joint);
            dir.normalize();
            const arrowHelper = new THREE.ArrowHelper( dir, prev_joint, this.lengths[i], 0x000000 );
            this.arrows.push(arrowHelper);
            prev_joint.copy(this.joints[i]);
        }
    }


    // forward kinematics
    fk() { 
        let prev_joint = new THREE.Vector3(0,0,0);
        prev_joint.copy(this.root);
        let angle_sum = 0;
        for (let i = 0; i < this.joints.length; i++) {
            angle_sum += this.angles[i];
            this.joints[i] = new THREE.Vector3(Math.cos(angle_sum) * this.lengths[i], Math.sin(angle_sum) * this.lengths[i],0).add(prev_joint);
            prev_joint.copy(this.joints[i]);
        }
    }

    // inverse kinematics solver using ccd algorithm
    IKSolverCCD(goal) {

        let prev_joint = new THREE.Vector3(0,0,0);
        prev_joint.copy(this.root);

        //iteratively solve for each joint
        for (let i = this.joints.length-2; i > -1; i--) {
            const startToGoal = new THREE.Vector3(0,0,0);
            const startToEndEffector = new THREE.Vector3(0,0,0);
            startToGoal.subVectors(goal, this.joints[i]);
            startToEndEffector.subVectors(this.joints[this.joints.length-1], this.joints[i]);

    
            //get normalized versions
            const startToGoalNorm = new THREE.Vector3(0,0,0);
            startToGoalNorm.copy(startToGoal);
            startToGoalNorm.normalize();
            const startToEndEffectorNorm = new THREE.Vector3(0,0,0);
            startToEndEffectorNorm.copy(startToEndEffector);
            startToEndEffectorNorm.normalize();
    
            // get dot product
            let dotProd = startToGoalNorm.dot(startToEndEffectorNorm);
            dotProd = THREE.MathUtils.clamp(dotProd, -1, 1);
    
            // use cross product to get direction of rotation
            let crossProd = new THREE.Vector3(0,0,0);
            crossProd.copy(startToGoal);
            crossProd.cross(startToEndEffector);
            if(crossProd.z < 0) {
                this.angles[i+1] += Math.acos(dotProd);
            }
            else {
                this.angles[i+1] -= Math.acos(dotProd);
            }

            this.angles[i+1] = THREE.MathUtils.clamp(this.angles[i+1], this.jointLimits[i+1][0], this.jointLimits[i+1][1]);

            // update
            this.fk();
        }

        // solve for root to first joint 
        const startToGoal = new THREE.Vector3(0,0,0);
        const startToEndEffector = new THREE.Vector3(0,0,0);
        startToGoal.subVectors(goal, this.root);
        startToEndEffector.subVectors(this.joints[0], this.root);


        //get normalized versions
        const startToGoalNorm = new THREE.Vector3(0,0,0);
        startToGoalNorm.copy(startToGoal);
        startToGoalNorm.normalize();
        const startToEndEffectorNorm = new THREE.Vector3(0,0,0);
        startToEndEffectorNorm.copy(startToEndEffector);
        startToEndEffectorNorm.normalize();

        // get dot product
        let dotProd = startToGoalNorm.dot(startToEndEffectorNorm);
        dotProd = THREE.MathUtils.clamp(dotProd, -1, 1);

        // use cross product to get direction of rotation
        let crossProd = new THREE.Vector3(0,0,0);
        crossProd.copy(startToGoal);
        crossProd.cross(startToEndEffector);
        if(crossProd.z < 0) {
            this.angles[0] += Math.acos(dotProd);
        }
        else {
            this.angles[0] -= Math.acos(dotProd);
        }

        //limit first angle
        this.angles[0] = THREE.MathUtils.clamp(this.angles[0], this.jointLimits[0][0], this.jointLimits[0][1]);

        // update end effector based on new angle
        this.fk();

    }

    // inverse kinematics solver using FABRIK algorithm
    IKSolverFabrik(goal) {
        const numOfIterations = 5;

        for (let itr = 0; itr < numOfIterations; itr++) {
            // backwards calculations
            // set end effector to goal
            this.joints[this.joints.length -1].copy(goal);

            // compute goal to end vector
            for (let i = this.joints.length - 2; i > -1; i--) {
                const dir = new THREE.Vector3();
                dir.subVectors(this.joints[i], this.joints[i+1]);
                dir.normalize();
                dir.multiplyScalar(this.lengths[i+1]);
                this.joints[i].copy(this.joints[i+1]);
                this.joints[i].add(dir);
            }

            // forwards calculations
            //root to first joint calc
            const initdir = new THREE.Vector3();
            initdir.subVectors(this.joints[0], this.root);
            initdir.normalize();
            initdir.multiplyScalar(this.lengths[0]);
            this.joints[0].copy(this.root);
            this.joints[0].add(initdir);

            for (let i = 1; i < this.joints.length; i++) {
                const dir = new THREE.Vector3();
                dir.subVectors(this.joints[i], this.joints[i-1]);
                dir.normalize();
                dir.multiplyScalar(this.lengths[i]);
                this.joints[i].copy(this.joints[i-1]);
                this.joints[i].add(dir);
            }
            
        }

    }

    update(dt, goal) {
        if(this.useFABRIK) {
            this.IKSolverFabrik(goal);
        }
        else {
            this.IKSolverCCD(goal);
        }
        this.updateSkeleton();
        //console.log("Angle 0: ", this.angles[0],"Angle 1: ", this.angles[1],"Angle 2: ", this.angles[2]);
    }

    //update skeleton visuals based on new ik solver values
    updateSkeleton(){
        let prev_joint = new THREE.Vector3(0,0,0);
        prev_joint.copy(this.root);
        for (let i = 0; i < this.joints.length; i++) {
            const dir = new THREE.Vector3(0,0,0);
            dir.subVectors(this.joints[i], prev_joint);
            dir.normalize();
            this.arrows[i].position.copy(prev_joint);
            this.arrows[i].setDirection(dir);
            prev_joint.copy(this.joints[i]);
        }
    }
}