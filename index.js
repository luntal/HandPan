const startButton = document.getElementById('start-button');
const metallophoneButton = document.getElementById('metallophone-button');
const xylophoneButton = document.getElementById('xylophone-button');
const handpanButton = document.getElementById('handpan-button');
const exercise1Button = document.getElementById('exercise1-button');
const exercise2Button = document.getElementById('exercise2-button');

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const infoParagraphs = document.getElementById('info-paragraphs');

let cameraStarted = false;
let soundID = 0;

let exerciseIsRunning = false;
let exerciseID = 0;
// let exerciseIsRunning = false;
let soundOffset = 0;
const numAreas = 11;
const gray = 'hsl(0, 0%, 90%)';
const green = 'hsl(120, 50%, 80%)';
metallophoneButton.style.backgroundColor = green;



// Canvas Setup --------------------------------------
function resizeCanvas() {
    const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight || 1280 / 720; // Use video aspect ratio, or default to 16:9 if not available

    let canvasWidth = window.innerWidth;
    let canvasHeight = canvasWidth / videoAspectRatio;

    if (canvasHeight > window.innerHeight) {
        canvasHeight = window.innerHeight;
        canvasWidth = canvasHeight * videoAspectRatio;
    }

    canvasElement.width = canvasWidth;
    canvasElement.height = canvasHeight;

    // Ensure the video element is also sized correctly
    videoElement.width = canvasWidth;
    videoElement.height = canvasHeight;

    // Set the style to match the internal canvas size
    canvasElement.style.width = `${canvasWidth}px`;
    canvasElement.style.height = `${canvasHeight}px`;

    if (!cameraStarted) {
    showCameraInactiveMessage();
  }
}

// Call resizeCanvas initially to set up the canvas size
resizeCanvas();
// Adjust the canvas size when the window is resized
window.onresize = resizeCanvas;

function drawRectangleAndFadeOut(areaIndex) {
    const distance = canvasElement.width / numAreas;
    const rectX = areaIndex * distance;
    const rectY = canvasElement.height - canvasElement.height/ 3;
    const rectWidth = canvasElement.width / numAreas;
    const rectHeight = canvasElement.height/ 3;
    const fadeDuration = 1000; // 1 second
    const fadeSteps = 30; // Assuming 60 frames per second
    const fadeInterval = fadeDuration / fadeSteps;
    let alpha = 1.0; // Initial opacity
    const alphaDecrement = 1 / fadeSteps;
    let step = 0; // Start at step 0

    // Function to compute logarithmic fade
    function computeLogarithmicAlpha(step, totalSteps) {
        const normalizedStep = step / totalSteps;
        return 1 - Math.log(1 + 9 * normalizedStep) / Math.log(10);
    }

    // Draw the initial rectangle
    function drawRectangle(alpha) {
        // canvasCtx.clearRect(rectX, rectY, rectWidth, rectHeight); // Clear the previous rectangle
        canvasCtx.globalAlpha = alpha; // Set the current opacity
        canvasCtx.fillStyle = 'blue';
        canvasCtx.fillRect(rectX, rectY, rectWidth, rectHeight);
        canvasCtx.globalAlpha = 1.0; // Reset alpha for other drawings
    }

    // Function to gradually reduce the alpha
    // Function to gradually reduce the alpha
    function fadeOut() {
                if (step <= fadeSteps) {
                    const alpha = computeLogarithmicAlpha(step, fadeSteps);
                    drawRectangle(alpha);
                    step++;
                    requestAnimationFrame(fadeOut);
                }
            }

    // Draw the initial rectangle and start fading out
    drawRectangle(alpha);
    setTimeout(fadeOut, fadeInterval);
}

// moving blocks --------------------------------
const bluishColor = '#4A90E2'; // Fixed bluish color for the rectangles
let xPositions = getFixedXPositions(); // Calculate the 11 fixed x positions
// let positionSequence = [4,5,6,4,7,5,6,4,7,4,5,6,4,7,5,6,4,7,4,5,6,4,7,5,6,4,7];
let positionSequence = [4,4,6,5,7,4,4,6,5,7,4,4,6,5,8,4,4,6,5,8]
const initialPositionSequence = [...positionSequence]; // Save the initial sequence
let rectangles = [];
let animationId;
let animationRunning = false; // Track if the animation is running
let rectangleCreationTimeout;

// Define the time intervals (in milliseconds) for creating rectangles
// const timeIntervals = [0, 750, 250, 500, 500, 250, 500,250, 500,500]; 
let timeIntervals = [0,750,500,250,250,250,750,500,250,250,250,750,500,250,250,250 ,750,500,250,250,250]
let currentIntervalIndex = 0;

function getFixedXPositions() {
    const positions = [];
    const step = canvasElement.width / 11;
    for (let i = 0; i < 11; i++) {
        positions.push(i * step + step / 2);
    }
    return positions;
}

async function createRectangle() {
    if (positionSequence.length > 0) {
        const index = positionSequence.shift(); // Get the next position index from the sequence
        const rect = {
            x: xPositions[index], // Use the predefined x position
            y: -20, // Start just above the canvas
            width: 60, // Fixed width
            height: 30, // Fixed height
            speed: 2, // speed
            color: bluishColor // Fixed bluish color
        };
        rectangles.push(rect);

        // update the timeIntervals according to the choosen exercise
        // -->>>>
        const bpm = 60;
        let quarter = 60/bpm * 1000;
        let sixteen = quarter / 2;
        if (exerciseID == 0){
            timeIntervals = [quarter, quarter, quarter, quarter, quarter, quarter, quarter, quarter, quarter, quarter, quarter, quarter, quarter, quarter, quarter, 1]
        } else if (exerciseID == 1){
            timeIntervals = [sixteen, sixteen, sixteen, quarter, quarter, quarter, quarter, quarter, sixteen, sixteen, quarter, quarter, sixteen, sixteen, sixteen]   
        }

        // Schedule the creation of the next rectangle based on the next time interval
        currentIntervalIndex = (currentIntervalIndex + 1) % timeIntervals.length;
        if (positionSequence.length > 0) {
            rectangleCreationTimeout = setTimeout(createRectangle, timeIntervals[currentIntervalIndex]*1);
        }
    }
}

async function updateRectangles() {
    // ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    for (let i = 0; i < rectangles.length; i++) {
        const rect = rectangles[i];
        rect.y += rect.speed; // Move the rectangle down
        canvasCtx.fillStyle = rect.color;
        canvasCtx.fillRect(rect.x - rect.width / 2, rect.y, rect.width, rect.height);

        if (rect.y > canvasElement.height) { // Remove rectangles that are off-screen
            rectangles.splice(i, 1);
            i--;
        }
    }
    // decide when to create the next rect
    // if (rectangles.length < 5 && positionSequence.length > 0) {
    //     createRectangle();
    // }
    
    // Check if animation is over
    if (rectangles.length === 0 && positionSequence.length === 0) {
            stopAnimation();
            console.log('Animation is over');
            animationRunning = false; // Set the variable to false
            exerciseIsRunning = false;
            blocksButton.textContent = 'Start Blocks';
        } else {
            animationId = requestAnimationFrame(updateRectangles); // Continue the animation
        }
}

// Audio setup --------------------------------------
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioBuffers = [];

async function loadAudio(url, index) {
const response = await fetch(url);
const arrayBuffer = await response.arrayBuffer();
audioBuffers[index] = await audioContext.decodeAudioData(arrayBuffer);
}

async function playSound(buffer) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    // Create a gain node
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5; // Set initial volume to 50% (range: 0 to 1)

    // Connect the source to the gain node, and then to the destination
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
}

// Preload audio files
async function preloadAudioFiles() {
    // load Metallophone with id 0-10
    for (let i = 0; i < numAreas; i++) {
        await loadAudio(`samples/M${(i+1).toString().padStart(2, '0')}.wav`, i); 
    }
    // load xylophone with id 11-20
    for (let i = 0; i < numAreas; i++) {
        await loadAudio(`samples/X${(i+1).toString().padStart(2, '0')}.wav`, i+numAreas);
    }
    // load handpan with id 21-30
    for (let i = 0; i < numAreas; i++) {
        await loadAudio(`samples/sample-${(i+1).toString().padStart(2, '0')}.wav`, i+numAreas*2);
    }
}
preloadAudioFiles();

// General Setup --------------------------------------
let lastTriggeredArea = -1;
let previousLeft = 0;
let previousRight = 0;
let previousAreaLeft = -1;
let previousAreaRight = -1; 

function drawGrid(ctx, width, height) {
    const gridHeight = height / 3;
    const startY = height - gridHeight;
    const cellWidth = width / numAreas;

    // draw transparent background:
    ctx.globalAlpha = 0.18; // Set the current opacity
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, canvasElement.height - canvasElement.height / 3, canvasElement.width, canvasElement.height / 3);
    ctx.globalAlpha = 1.0; // Reset alpha for other drawings

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 5;

    // Draw vertical lines
    for (let i = 0; i <= numAreas; i++) {
        const x = i * cellWidth;
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Draw horizontal lines (top and bottom of grid)
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.lineTo(width, startY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.stroke();
}

let cooldownActiveLeft = false;
let cooldownActiveRight = false;
const cooldownTimeMs = 40;

async function trigger(areaIndex, handIndex) {
    // Determine which hand triggered the sound
    let cooldownActive = (handIndex === 0) ? cooldownActiveLeft : cooldownActiveRight;

    if (!cooldownActive) {
        // Set the cooldown for the corresponding hand
        if (handIndex === 0) {
        cooldownActiveLeft = true;
        } else {
        cooldownActiveRight = true;
        }

        const adjustedIndex = (areaIndex + soundOffset);
        playSound(audioBuffers[adjustedIndex]);

        setTimeout(() => {
        // Reset the cooldown for the corresponding hand
        if (handIndex === 0) {
            cooldownActiveLeft = false;
        } else {
            cooldownActiveRight = false;
        }
        }, cooldownTimeMs);
    }
}

function drawTextInRectangle(text, x, y, width, height) {
    canvasCtx.font = '20px Arial'; // Set font style
    canvasCtx.fillStyle = 'white'; // Set text color
    canvasCtx.textAlign = 'center'; // Center text horizontally
    canvasCtx.textBaseline = 'middle'; // Center text vertically

    // Calculate text position
    const textX = x + width / 2;
    const textY = y + height / 2;

    canvasCtx.fillText(text, textX, textY);
}

// Hand Tracking --------------------------------------
function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Flip the canvas horizontally to create a selfie view
  canvasCtx.scale(-1, 1);
  canvasCtx.translate(-canvasElement.width, 0);

  // Draw the flipped image
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  // Reset transformations so the grid and text are not flipped
  canvasCtx.setTransform(1, 0, 0, 1, 0, 0);

  // Draw the grid
  drawGrid(canvasCtx, canvasElement.width, canvasElement.height);

  if (cameraStarted) {
    const cellWidth = canvasElement.width / numAreas;
    const gridHeight = canvasElement.height / 3;
    const startY = canvasElement.height - gridHeight;
    let notes = []
    if (soundID == 0 || soundID == 1){
        notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E', 'F']
    } else {
        notes = ['G', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']
    }
    for (let i = 0; i < numAreas; i++) {
        const rectX = i * cellWidth;
        drawTextInRectangle(notes[i], rectX, startY, cellWidth, gridHeight);
    }
  }
  // Start the animation
  // updateRectangles(canvasCtx);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];
      let handedness = results.multiHandedness[i].label;
      handedness = (handedness === 'Left') ? 'Right' : (handedness === 'Right') ? 'Left': 'Right';
      const handIndex = (handedness === 'Left') ? 0 : (handedness === 'Right') ? 1 : -1;
      
      // Flip landmarks for drawing since the canvas was flipped
      const flippedLandmarks = landmarks.map(landmark => {
        return {
          x: 1 - landmark.x,
          y: landmark.y,
          z: landmark.z
        };
      });

      drawConnectors(canvasCtx, flippedLandmarks, HAND_CONNECTIONS,
                     {color: '#90EE90', lineWidth: 3});
      drawLandmarks(canvasCtx, flippedLandmarks, {color: '#006400', lineWidth: 1, radius: 2});
      

      // Draw a red point at the index tip position
      if (flippedLandmarks[8] && typeof flippedLandmarks[8] === 'object'){
        const indexTipX = flippedLandmarks[8].x * canvasElement.width;
        const indexTipY = flippedLandmarks[8].y * canvasElement.height; 
        canvasCtx.beginPath();
        canvasCtx.arc(indexTipX, indexTipY, 10, 0, 2 * Math.PI); // 5 is the radius of the point
        canvasCtx.fillStyle = 'red'; // Set the color to red
        canvasCtx.fill();

        // Display normalized index finger tip coordinates and check for audio trigger
        const indexTip = flippedLandmarks[8];
        const normalizedX = indexTip.x.toFixed(3);
        const normalizedY = indexTip.y.toFixed(3);
        const displayX = indexTip.x * canvasElement.width;
        const displayY = indexTip.y * canvasElement.height;
        
        // checkAndTriggerAudio(displayX, displayY, canvasElement.width, canvasElement.height);
        const cellWidth = canvasElement.width / numAreas;
        const areaIndex = Math.floor(displayX / cellWidth);
        const gridHeight = canvasElement.height / 3;
        const startY = canvasElement.height - gridHeight;
        
        const isInGrid = (displayY >= startY) ? 1: 0;
        
        // register transition:
        if (handIndex == 0){
          const transition = ((isInGrid - previousLeft) == 1) ? 1: 0;
          previousLeft = isInGrid;
          
          if (transition == 1){
            // console.log('Left Hand transition detected!');
            trigger(areaIndex, handIndex);
            // Draw and fade out the rectangle
            drawRectangleAndFadeOut(areaIndex);
          }
          
          // Slide for left hand
          if (transition == 0 && isInGrid && areaIndex != previousAreaLeft){
            trigger(areaIndex, handIndex);
            drawRectangleAndFadeOut(areaIndex);
          }
          previousAreaLeft = areaIndex;


        } else {
          const transition = ((isInGrid - previousRight) == 1) ? 1: 0;
          previousRight = isInGrid;
          if (transition == 1){
            // console.log('Right Hand transition detected!');
            trigger(areaIndex, handIndex);
            drawRectangleAndFadeOut(areaIndex);

          }

          // Slide for right hand
          if (transition == 0 && isInGrid && areaIndex != previousAreaRight){
            trigger(areaIndex, handIndex);
            drawRectangleAndFadeOut(areaIndex);
          }
          previousAreaRight = areaIndex;
        }
      }
      
      
      
    }
  }
  canvasCtx.restore();
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 0,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});
hands.onResults(onResults);


let camera;
camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  // width: 1280,
  // height: 720
  width: 960,
  height: 540
});

function showCameraInactiveMessage() {
    const message1 = "Camera is inactive.";
    const message2 = "Please click 'Webcam Start' in the top left corner to begin.";
    const fontSize = "30px Arial"; // You can adjust the font size
    canvasCtx.font = fontSize;
    canvasCtx.fillStyle = "black";
    canvasCtx.textAlign = "center";

    // Calculate the vertical position for each line
    const lineHeight = parseInt(fontSize, 10); // Get line height from font size
    const message1Y = canvasElement.height / 2 - lineHeight / 2; // Center the first line
    const message2Y = message1Y + lineHeight; // Place the second line below

    canvasCtx.fillText(message1, canvasElement.width / 2, message1Y);
    canvasCtx.fillText(message2, canvasElement.width / 2, message2Y);
}

// Call this function initially to show the message if the camera is not started
if (!cameraStarted) {
    canvasElement.style.display = 'none';  // Hide the canvas
    infoParagraphs.style.display = 'block'; // Show the paragraphs
}

startButton.addEventListener('click', async () => {
    if (cameraStarted) {
      //try {
        startButton.style.backgroundColor = 'hsl(0, 0%, 90%)';
        canvasElement.style.display = 'none';  // Hide the canvas
        infoParagraphs.style.display = 'block'; // Show the paragraphs
        await camera.stop()
    } else {
        startButton.style.backgroundColor = 'hsl(120, 50%, 80%)';
        camera.start();
        canvasElement.style.display = 'block'; // Show the canvas
        infoParagraphs.style.display = 'none';  // Hide the paragraphs
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }
    cameraStarted = !cameraStarted;
});



function selectMetallophone (){
    metallophoneButton.style.backgroundColor = green;
    xylophoneButton.style.backgroundColor = gray;
    handpanButton.style.backgroundColor = gray;
    soundID = 0;
    soundOffset =0;
}
function selectXylophone (){
    metallophoneButton.style.backgroundColor = gray;
    xylophoneButton.style.backgroundColor = green;
    handpanButton.style.backgroundColor = gray;
    soundID = 1;
    soundOffset = numAreas * 1 ;
}
function selectHandpan(){
    metallophoneButton.style.backgroundColor = gray;
    xylophoneButton.style.backgroundColor = gray;
    handpanButton.style.backgroundColor = green;
    soundID = 2;
    soundOffset = numAreas * 2;
}






function stopAnimation() {
        if (animationId) {
            cancelAnimationFrame(animationId); // Cancel the animation loop
        }
        clearTimeout(rectangleCreationTimeout); // Cancel any scheduled rectangle creation
        exercise1Button.style.backgroundColor = gray;
        exercise2Button.style.backgroundColor = gray;
    }



function startAnimation(){
    rectangles = [];
    if (exerciseID == 0){positionSequence = [7, 4, 7, 4, 7, 4, 7, 4, 6, 4, 6, 4, 6, 3, 7, 2]; // Reset the position sequence
        }else if(exerciseID == 1){positionSequence = [2,3,4,2,2,3,1,1,2,3,1,5,5,4];}
    
    xPositions = getFixedXPositions(); // Recalculate positions in case of a resize
    currentIntervalIndex = 0; // Reset the interval index
    animationRunning = true; // Set the variable to true
    updateRectangles(canvasCtx);
    createRectangle();
}

function exercise1 (){
    exerciseID = 0;
    if(exerciseIsRunning && exerciseID == 0){
        exerciseIsRunning = false;
        stopAnimation();
        // exercise1Button.style.backgroundColor = gray;
        // exercise2Button.style.backgroundColor = gray;
    }
    else{
        exerciseIsRunning = true;
        if (exerciseIsRunning){stopAnimation();}
        exercise1Button.style.backgroundColor = green;
        exercise2Button.style.backgroundColor = gray;
        startAnimation();

    }
    
    
}
function exercise2() {
    exerciseID = 1;
    if (exerciseIsRunning && exerciseID == 1){
        exerciseIsRunning = false;
        stopAnimation();
        // exercise1Button.style.backgroundColor = gray;
        // exercise2Button.style.backgroundColor = gray;
    } else {
        exerciseIsRunning = true;
        if (exerciseIsRunning){stopAnimation();}
        exercise1Button.style.backgroundColor = gray;
        exercise2Button.style.backgroundColor = green;
        startAnimation();
    }
    
    
}