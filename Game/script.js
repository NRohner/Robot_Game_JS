// All code for the robot game will go here.

// Game Variables
let gameAnimation;
let game;

// Global Constants:

const primaryArmMass = 1;
const secondaryArmMass = 1;
const primaryArmI = 1;
const secondaryArmI = 1;

// Physics Constants and Variables:
const g = 9.81;    // Acceleration due to gravity
const deltaT = 0.003;        
const frameTime = 1000/60;    //Time step for 60 calculations per second. Will need to pair this with the animation function for it to work right

// Canvas Constants:

var canvas = document.getElementById("Canvas1");
var ctx = canvas.getContext("2d");

// Adjustable Input Variables:

const primaryArmLength = 40 * 2.5;
const secondaryArmLength = 85 * 2.5;
const motorOffset = 15 * 2.5;
const minThetaR = -0.523599;
const minThetaL = 1.480039;
const maxThetaR = 1.661553;
const maxThetaL = Math.PI + 0.523599;
const motorTorque = 800;


// Initial angle for the right and left arms.
var thetaStartR = 0;
var thetaStartL = Math.PI;

// Key Listener Variables
let isUpKeyPressed = false;
let isDownKeyPressed = false;
let isSpaceKeyPressed = false;
let isRightKeyPressed = false;
let isLeftKeyPressed = false;


// Global Functions
function findArcIntersect(primaryArmR, primaryArmL) {   // Finds the connection point for the secondary arms.
    let a = primaryArmR.pos2[0];
    let b = primaryArmR.pos2[1];
    let c = primaryArmL.pos2[0];
    let d = primaryArmL.pos2[1];
    let r = secondaryArmLength;
    let x;

    let under_the_root =
        Math.pow(
            -4 * Math.pow(a, 3) +
                4 * Math.pow(a, 2) * c -
                4 * a * Math.pow(b, 2) +
                8 * a * b * d +
                4 * a * Math.pow(c, 2) -
                4 * a * Math.pow(d, 2) -
                4 * Math.pow(b, 2) * c + 8 * b * c * d - 4 * Math.pow(c, 3) - 4 * c * Math.pow(d, 2), 2,) - 4 *
                (   4 * Math.pow(a, 2) -
                8 * a * c +
                4 * Math.pow(b, 2) -
                8 * b * d +
                4 * Math.pow(c, 2) +
                4 * Math.pow(d, 2)) *
                (Math.pow(a, 4) +
                2 * Math.pow(a, 2) * Math.pow(b, 2) -
                4 * Math.pow(a, 2) * b * d -
                2 * Math.pow(a, 2) * Math.pow(c, 2) +
                2 * Math.pow(a, 2) * Math.pow(d, 2) +
                Math.pow(b, 4) - 4 * Math.pow(b, 3) * d + 2 * Math.pow(b, 2) * Math.pow(c, 2) + 6 * Math.pow(b, 2) * Math.pow(d, 2) - 4 * Math.pow(b, 2) * Math.pow(r, 2) - 4 * b * Math.pow(c, 2) * d - 4 * b * Math.pow(d, 3) + 8 * b * d * Math.pow(r, 2) + Math.pow(c, 4) + 2 * Math.pow(c, 2) * Math.pow(d, 2) + Math.pow(d, 4) - 4 * Math.pow(d, 2) * Math.pow(r, 2));
    if (under_the_root < 0) {
        under_the_root = 0;
    }

    let numerator =
        4 * Math.pow(a, 3) - 4 * Math.pow(a, 2) * c + Math.sqrt(under_the_root) + 4 * a * Math.pow(b, 2) - 8 * a * b * d - 4 * a * Math.pow(c, 2) + 4 * a * Math.pow(d, 2) + 4 * Math.pow(b, 2) * c - 8 * b * c * d + 4 * Math.pow(c, 3) + 4 * c * Math.pow(d, 2);
    let numerator2 = 4 * Math.pow(a, 3) - 4 * Math.pow(a, 2) * c - Math.sqrt(under_the_root) + 4 * a * Math.pow(b, 2) - 8 * a * b * d - 4 * a * Math.pow(c, 2) + 4 * a * Math.pow(d, 2) + 4 * Math.pow(b, 2) * c - 8 * b * c * d + 4 * Math.pow(c, 3) + 4 * c * Math.pow(d, 2);

    let denominator = 2 * (4 * Math.pow(a, 2) - 8 * a * c + 4 * Math.pow(b, 2) - 8 * b * d + 4 * Math.pow(c, 2) + 4 * Math.pow(d, 2));

    let x1 = numerator / denominator; // Positive X
    let x2 = numerator2 / denominator; // Negative X

    if (Math.PI - primaryArmL.theta > primaryArmR.theta) {
        x = x1;
    } else {
        x = x2;
    }

    var y = b + Math.sqrt(-Math.pow(a, 2) + 2 * a * x + Math.pow(r, 2) - Math.pow(x, 2));

    return [x, y];

}

function crossProduct(vector1, vector2) {
    if (vector1.length !== 2 || vector2.length !== 2) {
        throw new Error('Cross product is only defined for 2D vectors');
    }
    return vector1[0] * vector2[1] - vector1[1] * vector2[0];
}

function convertRobotCoord_2_CanvasCoord(point) {
    // takes a point in robot coordinates and converts it to canvas coordinates
    // The origin of robot coordinates will map to (250, 100) in canvas coordinates
    let canvasCoords = [point[0] + 250, point[1] + 55];
    return canvasCoords;
}


// Game class - Overarching class that runs the entire game
class Game {
    #Robot
    #drawList
    constructor() {
        this.#Robot = new Robot;
        this.#drawList = [this.#Robot];
        this.lastFrameTime = 0;
        this.timer = 0;

    }

    #animate(timeStamp) {
        const deltaTime = timeStamp - this.lastFrameTime;
        this.lastFrameTime = timeStamp;

        if (this.timer > frameTime) {  // If the timer is greater than the interval mark, draw a frame
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Looping through all the items in draw list
            for (var element of this.#drawList) {
                element.draw();
                element.updatePos();
            }
        } else {
            this.timer += frameTime
        }

        gameAnimation = requestAnimationFrame(this.#animate.bind(this));

    }

    run(){
        this.#animate(0);
    }




}


// Robot Class
class Robot {
    constructor() {
        // Creating our arm objects
        this.RightPrimaryArm = new PrimaryArm(motorOffset, 0);
        this.LeftPrimaryArm = new PrimaryArm(-motorOffset, Math.PI);
        this.RightSecondaryArm = new SecondaryArm(this.RightPrimaryArm);
        this.LeftSecondaryArm = new SecondaryArm(this.LeftPrimaryArm);

        // Setting the starting coordinate for the joint between the two secondary arms
        this.RightSecondaryArm.pos2 = findArcIntersect(this.RightPrimaryArm, this.LeftPrimaryArm);
        this.LeftSecondaryArm.pos2 = this.RightSecondaryArm.pos2;

        // Style Variables
        this.primaryArmStyle = 'black';
        this.secondaryArmStyle = '#464F51';
        this.motorCoverStyle = '#464F51';
        this.secondaryJointStyle = '#464F51';
        this.smileStyle = '#DDBEA8';
        this.eyeBrowStyle = '#B4EDD2';
        this.primaryArmLineWidth = 12;
        this.secondaryArmLineWidth = 3;
        this.motorCoverRadius = 10;
        this.secondaryJointRadius = 4;

    }
    
    draw() {
        // Drawing the Robot Body
        let cBodyOrigin = convertRobotCoord_2_CanvasCoord([-motorOffset * 2, -motorOffset]);
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.fillStyle = this.motorCoverStyle;
        ctx.lineWidth = 10;
        ctx.strokeRect(cBodyOrigin[0], cBodyOrigin[1], 4 * motorOffset, 2 * motorOffset);
        ctx.fillRect(cBodyOrigin[0], cBodyOrigin[1], 4 * motorOffset, 2 * motorOffset);
        ctx.stroke();

        // Drawing the Smile :)
        let smilePoint1 = convertRobotCoord_2_CanvasCoord([-motorOffset * 1.75, 0]);
        let smilePoint2 = convertRobotCoord_2_CanvasCoord([-motorOffset * 1.75, motorOffset * 0.75]);
        let smilePoint3 = convertRobotCoord_2_CanvasCoord([motorOffset * 1.75, motorOffset * 0.75]);
        let smilePoint4 = convertRobotCoord_2_CanvasCoord([ motorOffset * 1.75, 0]);

        ctx.beginPath();
        ctx.strokeStyle = this.smileStyle;
        ctx.lineWidth = 6;
        ctx.moveTo(smilePoint1[0], smilePoint1[1]);
        ctx.lineTo(smilePoint2[0], smilePoint2[1]);
        ctx.lineTo(smilePoint3[0], smilePoint3[1]);
        ctx.lineTo(smilePoint4[0], smilePoint4[1]);
        ctx.stroke();

        // Drawing the Eyebrows
        let browPoint1R = convertRobotCoord_2_CanvasCoord([motorOffset - (motorOffset * 0.5), -motorOffset + (motorOffset * 0.5)]);
        let browPoint2R = convertRobotCoord_2_CanvasCoord([motorOffset + (motorOffset * 0.5), -motorOffset + (motorOffset * 0.25)]);
        let browPoint1L = convertRobotCoord_2_CanvasCoord([(-1 * (motorOffset - (motorOffset * 0.5))), -motorOffset + (motorOffset * 0.5)]);
        let browPoint2L = convertRobotCoord_2_CanvasCoord([(-1 * (motorOffset + (motorOffset * 0.5))), -motorOffset + (motorOffset * 0.25)])

        ctx.beginPath();
        ctx.strokeStyle = this.eyeBrowStyle;
        ctx.lineWidth = 5;
        ctx.moveTo(browPoint1R[0], browPoint1R[1]);
        ctx.lineTo(browPoint2R[0], browPoint2R[1]);
        ctx.moveTo(browPoint1L[0], browPoint1L[1]);
        ctx.lineTo(browPoint2L[0], browPoint2L[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = this.eyeBrowStyle;
        ctx.lineWidth = 5;
        ctx.moveTo(browPoint1L[0], browPoint1L[1]);
        ctx.lineTo(browPoint2L[0], browPoint2L[1]);
        ctx.stroke();


        // Drawing RightPrimaryArm
        ctx.beginPath();
        ctx.lineWidth = 10;
        let cMotorCoverCoord_R = convertRobotCoord_2_CanvasCoord(this.RightPrimaryArm.pos1);

        let cSecondaryJointCoord_R = convertRobotCoord_2_CanvasCoord(this.RightPrimaryArm.pos2);
        ctx.moveTo(cMotorCoverCoord_R[0], cMotorCoverCoord_R[1]);
        ctx.lineTo(cSecondaryJointCoord_R[0], cSecondaryJointCoord_R[1]);

        ctx.strokeStyle = this.primaryArmStyle;
        ctx.lineWidth = this.primaryArmLineWidth;
        ctx.stroke();

        // Drawing LeftPrimaryArm
        ctx.beginPath();
        let cMotorCoverCoord_L = convertRobotCoord_2_CanvasCoord(this.LeftPrimaryArm.pos1);
        let cSecondaryJointCoord_L = convertRobotCoord_2_CanvasCoord(this.LeftPrimaryArm.pos2);
        ctx.moveTo(cMotorCoverCoord_L[0], cMotorCoverCoord_L[1]);
        ctx.lineTo(cSecondaryJointCoord_L[0], cSecondaryJointCoord_L[1]);
                
        ctx.strokeStyle = this.primaryArmStyle;
        ctx.lineWidth = this.primaryArmLineWidth;
        ctx.stroke();

        // Drawing RightSecondaryArm
        ctx.beginPath();
        let cCoord1 = convertRobotCoord_2_CanvasCoord(this.RightSecondaryArm.pos1);
        let cCoord2 = convertRobotCoord_2_CanvasCoord(this.RightSecondaryArm.pos2);
        ctx.moveTo(cCoord1[0], cCoord1[1]);
        ctx.lineTo(cCoord2[0], cCoord2[1]);

        ctx.strokeStyle = this.secondaryArmStyle;
        ctx.lineWidth = this.secondaryArmLineWidth;
        ctx.stroke();

        //Drawing LeftSecondaryArm
        ctx.beginPath();
        cCoord1 = convertRobotCoord_2_CanvasCoord(this.LeftSecondaryArm.pos1);
        cCoord2 = convertRobotCoord_2_CanvasCoord(this.LeftSecondaryArm.pos2);
        ctx.moveTo(cCoord1[0], cCoord1[1]);
        ctx.lineTo(cCoord2[0], cCoord2[1]);

        ctx.strokeStyle = this.secondaryArmStyle;
        ctx.lineWidth = this.secondaryArmLineWidth;
        ctx.stroke();

        //Drawing MotorCovers
        ctx.beginPath()
        ctx.strokeStyle = this.primaryArmStyle;
        ctx.fillStyle = this.motorCoverStyle;
        ctx.lineWidth = 10;
        ctx.arc(cMotorCoverCoord_R[0], cMotorCoverCoord_R[1], this.motorCoverRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.strokeStyle = this.primaryArmStyle;
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = this.primaryArmStyle;
        ctx.fillStyle = this.motorCoverStyle;
        ctx.arc(cMotorCoverCoord_L[0], cMotorCoverCoord_L[1], this.motorCoverRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.strokeStyle = this.primaryArmStyle;
        ctx.fill();

        //Drawing Secondary Joints
        ctx.beginPath();
        ctx.strokeStyle = this.primaryArmStyle;
        ctx.lineWidth = 8;
        ctx.fillStyle = this.secondaryJointStyle;
        ctx.arc(cSecondaryJointCoord_R[0], cSecondaryJointCoord_R[1], this.secondaryJointRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.strokeStyle = this.primaryArmStyle;
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = this.primaryArmStyle;
        ctx.fillStyle = this.secondaryJointStyle
        ctx.lineWidth = 8;
        ctx.arc(cSecondaryJointCoord_L[0], cSecondaryJointCoord_L[1], this.secondaryJointRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.strokeStyle = this.primaryArmStyle;
        ctx.fill();

        
    }

    updatePos() {   // Updates the position of all the objects inside of Robot
        //Updating torque on the primary arms due to gravity and mass of the arm.
        this.RightPrimaryArm.T = crossProduct(this.RightPrimaryArm.cogVector, this.RightPrimaryArm.Grav);
        this.LeftPrimaryArm.T = crossProduct(this.LeftPrimaryArm.cogVector, this.LeftPrimaryArm.Grav);

        // Responding to keyboard input
        if (isRightKeyPressed) {
            this.RightPrimaryArm.T -= motorTorque;
        } else {
            // We intentionaly do nothing if the key is not pressed
        }
        if (isLeftKeyPressed) {
            this.LeftPrimaryArm.T += motorTorque;
        } else {
        }
        
        let w_0_R = this.RightPrimaryArm.w;
        let w_0_L = this.LeftPrimaryArm.w;
        let friction_R = 0;
        let friction_L = 0;

        // Friction calculation right arm
        if (this.RightPrimaryArm.w > 0) {
            friction_R = -1 * w_0_R ** 2 * 0.5;
        } else {
            friction_R = w_0_R ** 2 * 0.5;
        }

        this.RightPrimaryArm.T += friction_R;
        let alpha_R = this.RightPrimaryArm.T / primaryArmI;

        this.RightPrimaryArm.w = w_0_R + alpha_R * deltaT;
        let deltaTheta_R = w_0_R * deltaT + 0.5 * alpha_R * deltaT ** 2;
        this.RightPrimaryArm.theta += deltaTheta_R;

        // Friction calculation left arm
        if (this.LeftPrimaryArm.w > 0) {
            friction_L = -1 * w_0_L ** 2 * 0.5;
        } else {
            friction_L = w_0_L ** 2 * 0.5;
        }

        this.LeftPrimaryArm.T += friction_L;
        let alpha_L = this.LeftPrimaryArm.T / primaryArmI;

        this.LeftPrimaryArm.w = w_0_L + alpha_L * deltaT;
        let deltaTheta_L = w_0_L * deltaT + 0.5 * alpha_L * deltaT ** 2;
        this.LeftPrimaryArm.theta += deltaTheta_L;

        // If statement to ensure the position of the right primary arm is within the acceptable min and max theta
        if (this.RightPrimaryArm.theta > maxThetaR) {
            this.RightPrimaryArm.theta = maxThetaR;
            this.RightPrimaryArm.w = 0;
        } else if (this.RightPrimaryArm.theta < minThetaR) {
            this.RightPrimaryArm.theta = minThetaR;
            this.RightPrimaryArm.w = 0;
        } else {
        }

        // If statement to ensure the position of the left primary arm is within the acceptable min and max theta
        if (this.LeftPrimaryArm.theta > maxThetaL) {
            this.LeftPrimaryArm.theta = maxThetaL;
            this.LeftPrimaryArm.w = 0;
        } else if (this.LeftPrimaryArm.theta < minThetaL) {
            this.LeftPrimaryArm.theta = minThetaL;
            this.LeftPrimaryArm.w = 0;
        } else {
        }

        // Updating the right primary arm positions
        this.RightPrimaryArm.pos2[0] = Math.cos(this.RightPrimaryArm.theta) * primaryArmLength + this.RightPrimaryArm.pos1[0];
        this.RightPrimaryArm.pos2[1] = Math.sin(this.RightPrimaryArm.theta) * primaryArmLength + this.RightPrimaryArm.pos1[1];
        this.RightPrimaryArm.cogVector[0] = Math.cos(this.RightPrimaryArm.theta) * (primaryArmLength / 2);
        this.RightPrimaryArm.cogVector[1] = Math.sin(this.RightPrimaryArm.theta) * (primaryArmLength / 2);

        // Updating the left primary arm positions
        this.LeftPrimaryArm.pos2[0] = Math.cos(this.LeftPrimaryArm.theta) * primaryArmLength + this.LeftPrimaryArm.pos1[0];
        this.LeftPrimaryArm.pos2[1] = Math.sin(this.LeftPrimaryArm.theta) * primaryArmLength + this.LeftPrimaryArm.pos1[1];
        this.LeftPrimaryArm.cogVector[0] = Math.cos(this.LeftPrimaryArm.theta) * (primaryArmLength / 2);
        this.LeftPrimaryArm.cogVector[1] = Math.sin(this.LeftPrimaryArm.theta) * (primaryArmLength / 2);

        // Updating the right secondary arm positions
        this.RightSecondaryArm.pos2 = findArcIntersect(this.RightPrimaryArm, this.LeftPrimaryArm);
        this.LeftSecondaryArm.pos2 = this.RightSecondaryArm.pos2;

    }

}


// Primary Arm Class
class PrimaryArm {
    constructor(motorCoordinate, initialTheta){
        this.theta = initialTheta;
        this.pos1 = [motorCoordinate, 0];
        this.pos2 = [
            primaryArmLength * Math.cos(this.theta) + this.pos1[0], 
            primaryArmLength * Math.sin(this.theta) + this.pos1[1]
        ];
        this.cogVector = [
            Math.cos(this.theta) * (primaryArmLength / 2),
            Math.sin(this.theta) * (primaryArmLength / 2)
        ];

        // Physics Values
        this.T = 0;
        this.w = 0;
        this.m = secondaryArmMass;
        this.Grav = [0, g * this.m];        // Force vector due to gravity.
    }
}


// Secondary Arm Class
class SecondaryArm {    //Need to come back to this once the robot class is defined and the primary arms are actually named and created
    constructor(parentArm){
        this.pos1 = parentArm.pos2;
        this.pos2;
    }
}


// Payload Class




// Dropoff Class



// Event Listeners
// Event listener for right arrow key
window.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") {
        isRightKeyPressed = true;
    }
});

// Event listener for keyup event
window.addEventListener("keyup", function (event) {
    if (event.key === "ArrowRight") {
        isRightKeyPressed = false;
    }
});

// Event listener for left arrow key
window.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
        isLeftKeyPressed = true;
    }
});

// Event listener for keyup event
window.addEventListener("keyup", function (event) {
    if (event.key === "ArrowLeft") {
        isLeftKeyPressed = false;
    }
});



// Actual running of the game
window.onload = function(){     //JS will wait for the entier page to load including all images and external content before trigging the window.onload
    canvas = document.getElementById('Canvas1');  //Creating a constant called canvas and setting it equal to the canvas1 canvas we created back in the HTML file
    ctx = canvas.getContext('2d');

    // Scaling for Retina //
    // 1. Get the device pixel ratio
    let ratio = window.devicePixelRatio || 1;

    // 2. Set the initial canvas.width and canvas.height
    canvas.width = 500;
    canvas.height = 400;

    // 3. Make sure the canvas element stays the same size
    canvas.style.width = canvas.width + "px";
    canvas.style.height = canvas.height + "px";

    // 4. Scale the canvas dims by the pixel ratio
    canvas.width *= ratio;
    canvas.height *= ratio;

    // 5. scale the context by the pixel ratio
    ctx.scale(ratio, ratio);

    game = new Game();
    game.run();

}




