// All code for the robot game will go here.

// Game Variables
let gameAnimation;
let game;
let score = 0;
let highScore = 0;
let payloadRestingPosY = 0;     // This is the resting y coordinate for the payload if it is placed on the payload
let payloadHeight = 25;
let payloadWidth = 25;

// Global State Variables
let GameStates = ['title', 'info1', 'info2', 'info3', 'info4', 'info5', 'game', 'gameover'];     // List of all possible game states
let pause = true;
// Global Constants:

const primaryArmMass = 1;
const secondaryArmMass = 1;
const primaryArmI = 1;
const secondaryArmI = 1;

// Physics Constants and Variables:
const g = 9.81;    // Acceleration due to gravity
const deltaT = 0.0025        
const frameTime = 1000/60    //Time step for 60 calculations per second. Will need to pair this with the animation function for it to work right


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

// Calculated constant robot variables based on the input variables
// See one note diagrams for definition of points. I will try to save screenshots or a pdf of these to the game directory.
// NOTE - All of these values are in robot coordinates. They will need to be converted to canvas coordinates before drawing.
var L1x = -motorOffset + primaryArmLength * Math.cos(maxThetaL);
var L1y = primaryArmLength * Math.sin(maxThetaL);
var L2x = -motorOffset + primaryArmLength * Math.cos(minThetaL);
var L2y = primaryArmLength * Math.sin(minThetaL);

var R1x = motorOffset + primaryArmLength * Math.cos(minThetaR);
var R1y = primaryArmLength * Math.sin(minThetaR);
var R2x = motorOffset + primaryArmLength * Math.cos(maxThetaR);
var R2y = primaryArmLength * Math.sin(maxThetaR);

// canvas coordinates
var L1_canvas = convertRobotCoord_2_CanvasCoord([L1x, L1y]);
var L2_canvas = convertRobotCoord_2_CanvasCoord([L2x, L2y]);
var R1_canvas = convertRobotCoord_2_CanvasCoord([R1x, R1y]);
var R2_canvas = convertRobotCoord_2_CanvasCoord([R2x, R2y]);


// Debug Print Statements for Robot Coordinates
    //console.log('A = L1x = ' + L1x);
    //console.log('B = L1y = ' + L1y);
    //console.log('C = R2x = ' + R2x);
    //console.log('D = R2y = ' + R2y);
    //console.log('R = secondary arm lenght = ' + secondaryArmLength);

//Debug Print Statements for Canvas Coordinates
    //console.log('L1 = ' + L1_canvas);
    //console.log('L2 = ' + L2_canvas);
    //console.log('R1 = ' + R1_canvas);
    //console.log('R2 = ' + R2_canvas);
    

// Working Area Calculations - all values in robot coordinat system
// Multiplying by 0.9 to give ourselves a little bit of a safety factor. Everything should be well within the working range in this case.
var workingRangeLeftBound = findWorkingAreaXIntersect(L1x, L1y, R2x, R2y, secondaryArmLength) * 0.9;
var workingRangeRightBound = -1 * workingRangeLeftBound;

var test = generateReachablePosition()

// Initial angle for the right and left arms.
var thetaStartR = 0;
var thetaStartL = Math.PI;

// Key Listener Variables
let isUpKeyPressed = false;
let isDownKeyPressed = false;
let isSpaceKeyPressed = false;
let isRightKeyPressed = false;
let isLeftKeyPressed = false;

var gripperPosition;

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

function findWorkingAreaXIntersect(A, B, C, D, R) {
    // A and B are the X and Y coordinates of the center of circle 1
    // C and D are the X and Y coordinates of the center of circle 2
    // R is the radius (which both should be the secondary arm length)
    X = (4 * A**3 - 4 * A**2 * C - Math.sqrt((-4 * A**3 + 4 * A**2 * C - 4 * A * B**2 + 8 * A * B * D + 4 * A * 
        C**2 - 4 * A * D**2 - 4 * B**2 * C + 8 * B * C * D - 4 * C**3 - 4 * C * D**2)**2 - 4 * (4 * A**2 - 8 * 
            A * C + 4 * B**2 - 8 * B * D + 4 * C**2 + 4 * D**2) * (A**4 + 2 * A**2 * B**2 - 4 * A**2 * B * D - 
                2 * A**2 * C**2 + 2 * A**2 * D**2 + B**4 - 4 * B**3 * D + 2 * B**2 * C**2 + 6 * B**2 * D**2 - 
                4 * B**2 * R**2 - 4 * B * C**2 * D - 4 * B * D**3 + 8 * B * D * R**2 + C**4 + 2 * C**2 * D**2 + 
                D**4 - 4 * D**2 * R**2)) + 4 * A * B**2 - 8 * A * B * D - 4 * A * C**2 + 4 * A * D**2 + 4 * 
                B**2 * C - 8 * B * C * D + 4 * C**3 + 4 * C * D**2)/(2 * (4 * A**2 - 8 * A * C + 4 * B**2 - 8 * 
                    B * D + 4 * C**2 + 4 * D**2));

    return X;
}

function randomSign() {     // Returns either 1 or -1 randomly
    // Generate a random number between 0 (inclusive) and 1 (exclusive)
    const randomValue = Math.random();
  
    // Return 1 if the random value is greater than or equal to 0.5, otherwise return -1
    return randomValue >= 0.5 ? 1 : -1;
}


function generateReachablePosition() {  // Generates a random position within the robots working area (range it can reach)
    // PROBLEMS:
    // Sometimes the Y coordinate will be invalid "NaN"
        // It seems like it is always the yLowerLimit that is causing this.


    // This function works in a few specific steps
    // 1. Generate a random value between the left working range limit and 0
    // 2. Calculate the upper and lower Y limit for the working range at that X location (with a 0.9 saftey factor multiplier)
    // 3. Generate a random Y value between those two bounds
    // 4. Randomly multiply the X value by 1 or -1. This way the position could be on either the left or right side of the working range.
    // 5. Convert X and Y values from robot coordinates to canvas coordinates.

    // 1. Generate a random value between left working range limit and 0
    var xRange = (0 - workingRangeLeftBound) + 1;  // we add 1 at the end to make it inclusive
    var random_decimal = Math.random();
    var negXCoord = -1 * random_decimal * xRange;

    // 2. Calculate upper and lower Y limits with a 0.9 multiplier on the lower limit
    var yLowerLimit = 1.1 * (L1y + Math.sqrt((-1 * L1x**2) + (2 * L1x * negXCoord) + (secondaryArmLength**2) - negXCoord**2));
    var yUpperLimit = (R2y + Math.sqrt((-1 * R2x**2) + (2 * R2x * negXCoord) + (secondaryArmLength**2) - negXCoord**2));

    // 3. Generate random number between upper and lower Y bounds
    var yRange = (yUpperLimit - yLowerLimit) + 1;
    random_decimal = Math.random();
    var yCoord = random_decimal * yRange + (yLowerLimit);

    // Checking the YUpperLimit is correct
    //ar yCoord = yLowerLimit;

    // 4. Multiply negative X coord by a random 1 or -1
    var xCoord = randomSign() * negXCoord;

    
    
    // 5. Convert X and Y coords to canvas coords
    return convertRobotCoord_2_CanvasCoord([xCoord, yCoord]);

}

// Funciton to reset the score after a game over
function resetScore() {
    if (score > highScore) {
        highScore = score;
    }
    score = 0;
}

// How to play popup handling functions 
function showHowToPlayPopup() {
    document.getElementById("howToPlayPopup").style.display = "block";
  }
  
  // Function to close the popup
  function closePopup() {
    document.getElementById("howToPlayPopup").style.display = "none";
    pause = false;
  }

// Game class - Overarching class that runs the entire game
class Game {
    #drawList
    constructor() {
        this.Robot = new Robot;
        this.Payload = new Payload(1, payloadWidth, payloadHeight, 250, 360);
        this.DropOff = new DropOff(250, 275);
        this.DropOff.reset(250, 275);   // Immediately re-setting it so we lock in the correct resting Y position for the payload if it lands on the platform.
        this.scoreCounter = new ScoreCounter();

        // Debugging
        //this.Debugger = new Debugger;

        // Draw List
        this.#drawList = [this.scoreCounter, this.Robot, this.Payload, this.DropOff];
        this.lastFrameTime = 0;
        this.timer = 0;
        this.payloadDropOffCounter = 0;

        // Debugging
        this.Debugger = new Debugger;

    }

    #animate(timeStamp) {
        const deltaTime = timeStamp - this.lastFrameTime;
        this.lastFrameTime = timeStamp;

        if (this.timer > frameTime) {  // If the timer is greater than the interval mark, draw a frame
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Looping through all the items in draw list
            for (var element of this.#drawList) {
                element.draw();
                if (!pause) {   // Only update the positions when the game isnt paused.
                    element.updatePos();
                }
            }

            this.eventChecker();

            // If statement to control payload reset. It only triggers if the payload goes out of bounds. The effect of this is the score resets and the payload resets to a new random position within the grab range of the robot.
            // The payload dropoff point also resets to a new position

        } else {
            this.timer += frameTime;
        }

        gameAnimation = requestAnimationFrame(this.#animate.bind(this));

    }

    eventChecker() {
        // Function to check for game over and successfull pick and place.

        // Chekcing for out of bounds. We make the window oversized to give some time between throwing it out to respawn
        let leftBoundry = 0 - 800;
        let rightBoundry = 500 + 800;
        let bottomBoundry = 400 + 800;


        if (this.Payload.posX < leftBoundry) {
            // Game Over
            resetScore();
            this.Payload.reset(1, 25, 25, 250, 360);
            this.DropOff.reset(250, 275);
        }
        if (this.Payload.posX > rightBoundry) {
            // Game Over
            resetScore();
            this.Payload.reset(1, 25, 25, 250, 360);
            this.DropOff.reset(250, 275);
        }
        if (this.Payload.posY > bottomBoundry) {
            // Game Over
            resetScore();
            this.Payload.reset(1, 25, 25, 250, 360);
            this.DropOff.reset(250, 275);
        }


        // Checking for land on platform
        let dropOffLeftBound = this.DropOff.posX - (this.DropOff.length / 2);
        let dropOffRightBound = this.DropOff.posX + (this.DropOff.length / 2);
        let dropOffTopBound = this.DropOff.posY - (this.DropOff.thickness / 2);

        // Creating a counter to see how long the payload is on the platform for. If it has been on the platform for
        // 1 second, then the score goes up by 1 and the payload and dropoff positions reset.

        if (this.Payload.isGrabbed == false &&          // Payload is released
            this.Payload.posX > dropOffLeftBound &&     // within the left bound of the dropoff
            this.Payload.posX < dropOffRightBound &&    // within the right bound of the dropoff
            (this.Payload.posY + this.Payload.sizeY) <= dropOffTopBound &&      // Bottom of the payload above top of the platform
            (this.Payload.posY + this.Payload.sizeY) >= (dropOffTopBound - 10))    // Bottom of the payload only a few pxles above the top of the platform
            { 

                this.Payload.onDropOff = true;
                this.payloadDropOffCounter++;

                if (this.payloadDropOffCounter > 30) {   //30 frames = 0.5 second at 60fps
                    score = score + 1;
                    let newPayloadPoint = generateReachablePosition();
                    let newDropOffPoint = generateReachablePosition();

                    this.Payload.reset(1, payloadWidth, payloadHeight, newPayloadPoint[0], newPayloadPoint[1]);   // Eventually these will need to be dynamic position values.
                    this.DropOff.reset(newDropOffPoint[0], newDropOffPoint[1]);   // Will need to be dynamnic values in the future.
                    this.payloadDropOffCounter = 0;
                }

        } else {
            this.Payload.onDropOff = false;
        }
    }

    grabAttempt(){
        let gripperPosC = convertRobotCoord_2_CanvasCoord(this.Robot.RightSecondaryArm.pos2)
        let payloadPosC = [this.Payload.posX, this.Payload.posY];
        let distanceToPayloadHandle = Math.sqrt(((payloadPosC[0] - gripperPosC[0]) ** 2) + ((payloadPosC[1] - gripperPosC[1]) ** 2))

        if (distanceToPayloadHandle > 20) {     // If the gripper is further than 20px from the handle, it wont pick it up
            //console.log(`Too Far from payload: ${distanceToPayloadHandle}`)

        } else {        // Else if the gripper is within 20px the paylod is picked up
            this.Payload.isGrabbed = true;
        }

    }

    releaseGrab(){
        this.Payload.isGrabbed = false;
        this.Payload.atStartPosition = false;
    }

    run(){
        this.#animate(0);
    }




}

// Debugger Class
class Debugger {
    constructor() {


    }
    drawCircle(x, y, radius, color) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = color; // Color of the circle
        ctx.lineWidth = 6; // Thickness of the line
        ctx.stroke();
    }

    draw() {
        // Drawing L1 - Red
        this.drawCircle(L1_canvas[0], L1_canvas[1], secondaryArmLength, "red");

        // Drawing L2 - Green
        this.drawCircle(L2_canvas[0], L2_canvas[1], secondaryArmLength, "green");

        // Drawing L3 - Blue
        this.drawCircle(R1_canvas[0], R1_canvas[1], secondaryArmLength, "blue");

        // Drawing L4 - Yellow
        this.drawCircle(R2_canvas[0], R2_canvas[1], secondaryArmLength, "yellow");

    }

    updatePos() { 

    }

}

// Robot Class
class Robot {
    #render
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
        gripperPosition = convertRobotCoord_2_CanvasCoord(this.RightSecondaryArm.pos2);


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
class Payload {
    constructor(mass, sizeX, sizeY, posX, posY){
        this.mass = mass;
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.posX = posX;   // the x coordinate of the top center location of the payload in canvas coordinates
        this.posY = posY;   // the y coordinate of the top center location of the payload in canvas coordinates

        // Plot coordinates of the payload
        this.plotPosX = this.posX - (this.sizeX / 2);
        this.plotPosY = this.posY;

        this.topCenter = [this.posX + (this.sizeX / 2), this.posY];
        this.isGrabbed = false;
        this.atStartPosition = true;
        this.velX = 0;
        this.velY = 0;
        this.previousYVel = 0;
        this.previousPosX = 0;
        this.previousPosY = 0;

        this.payloadFillStyle = '#B4EDD2';

        this.onDropOff = false;
    }

    draw(){
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.fillStyle = this.payloadFillStyle;
        ctx.lineWidth = 5;
        ctx.strokeRect(this.plotPosX, this.plotPosY, this.sizeX, this.sizeY);
        ctx.fillRect(this.plotPosX, this.plotPosY, this.sizeX, this.sizeY);
        ctx.stroke();

    }

    updatePos(){
        if (this.isGrabbed == true) {   // Movement instructions for when the payload is grabbed
            // Storing the previous position. We will need this for the velocity calculation
            this.previousPosX = this.plotPosX;
            this.previousPosY = this.plotPosY;

            // Updating our current X and Y position
            this.posX = gripperPosition[0];
            this.posY = gripperPosition[1];

            // Updating the X and Y plot coordinate
            this.plotPosX = this.posX - (this.sizeX / 2);
            this.plotPosY = this.posY;

            // Calculating our X and Y velocity
            //this.previousYVel = this.velY;
            this.velX = (this.plotPosX - this.previousPosX) / deltaT;
            this.velY = (this.plotPosY - this.previousPosY) / deltaT;

        } else if (this.onDropOff == true) {
            // Just dont update the position if 
            this.posX = this.posX;
            this.posY = payloadRestingPosY + (this.sizeY / 2);
            this.plotPosX = this.plotPosX;
            this.plotPosY = payloadRestingPosY - 1;
            this.velY = 0;
            this.previousYVel = 0;

            // Slowly reducing the x velocity (friction)
            if (this.velX > 0.5) {
                this.velX = this.velX * 0.95;

            } else {
                this.velX = 0;
            }

        } else if (this.isGrabbed == false && this.atStartPosition == false) {  // Movement instructions for falling payload
            this.plotPosX = this.plotPosX + (this.velX * deltaT);   // X velocity does not change once the payload is dropped.
            
            // Handling the Y components of velocity and position
            this.velY = this.velY + 50;
            this.plotPosY = this.plotPosY + (this.velY * deltaT);

            this.posX = this.plotPosX + (this.sizeX / 2);
            this.posY = this.plotPosY;

        }


    }

    reset(mass, sizeX, sizeY, posX, posY) {
        this.mass = mass;
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.posX = posX;   // the x coordinate of the location of the payload. Measured from the top left corner of the rectangel in canvas coords
        this.posY = posY;   // the y coordinate in canvas coords
        this.topCenter = [this.posX + (this.sizeX / 2), this.posY];
        this.isGrabbed = false;
        this.atStartPosition = true;
        this.velX = 0;
        this.velY = 0;
        this.previousYVel = 0;
        this.previousPosX = 0;
        this.previousPosY = 0;
        this.onDropOff = false;

        // Plot coordinates of the payload
        this.plotPosX = this.posX - (this.sizeX / 2);
        this.plotPosY = this.posY;
    }

    grabAttempt(){

    }

    grab(){

    }
}


// Dropoff Class
class DropOff {
    constructor(posX, posY) {
        this.length = 50;
        this.thickness = 10;
        this.posX = posX;   // X position of the center of the platform
        this.posY = posY;   // Y position of the center of the platform
        this.style = '#DDBEA8'; // Color of the dropoff zones

    }

    draw() {
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.fillStyle = this.style;
        ctx.lineWidth = 5;
        ctx.strokeRect(this.posX - (this.length / 2), this.posY - (this.thickness / 2), this.length, this.thickness);
        ctx.fillRect(this.posX - (this.length / 2), this.posY - (this.thickness / 2), this.length, this.thickness);
        ctx.stroke();
    }

    updatePos() {}

    reset(posX, posY) {
        this.posX = posX;
        this.posY = posY;
        payloadRestingPosY = this.posY - (this.thickness / 2) - payloadHeight;
    }
}

// Score Counter Class
class ScoreCounter {
    constructor() {
        this.scoreFontSize = 16;
        this.scoreFontFamily = 'Helvetica';
        this.scoreFontStyle = 'normal';
        this.scoreText = `Score: ${score}`;
        this.scorePosX = 10;
        this.scorePosY = 20;
    }

    draw() {
        // Drawing the score
        ctx.font = this.scoreFontStyle + ' ' + this.scoreFontSize + 'pt ' + this.scoreFontFamily;
        ctx.fillStyle = '#000'; // Text color
        ctx.fillText(this.scoreText, this.scorePosX, this.scorePosY);
        this.scoreText = `Score: ${score}`;
    }

    updatePos() {
    }
}

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

// Event listener for space bar keypress - different from keydown or keyup
window.addEventListener("keydown" , function(event){
    if ((event.key === "Space" || event.key === " ") && game.Payload.isGrabbed == true) {
        game.releaseGrab();
    } else if ((event.key === "Space" || event.key === " ") && game.Payload.isGrabbed == false) {
        game.grabAttempt();
    }
});

window.addEventListener("keydown", function (event) {
    if (event.key === "p") {
        pause = !pause;
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

    // 6. Display how to play popup
    showHowToPlayPopup()
    // 7. Run game 
    game = new Game();
    game.run();

}
