// public/app.js
let oscConnected = false;

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.poseLandmarks) {
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
    
    if (oscConnected) {
      sendPoseData(results.poseLandmarks);
    }
  }
  canvasCtx.restore();
}


function sendPoseData(landmarks) {
  const importantLandmarks = {
    leftShoulder: landmarks[11],
    rightShoulder: landmarks[12],
    leftHip: landmarks[23],
    rightHip: landmarks[24],
    leftKnee: landmarks[25],
    rightKnee: landmarks[26]
  };

  for (const [part, landmark] of Object.entries(importantLandmarks)) {
    if (landmark) {
      sendOscMessage(`/pose/${part}/x`, landmark.x);
      sendOscMessage(`/pose/${part}/y`, landmark.y);
      sendOscMessage(`/pose/${part}/z`, landmark.z);
    }
  }
}

function sendOscMessage(address, value) {
  if (value !== undefined && value !== null) {
    fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, value })
    }).catch(error => console.error(`Error sending OSC data for ${address}:`, error));
  } else {
    console.warn(`Skipping OSC message for ${address} due to undefined or null value`);
  }
}
const pose = new Pose({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});
pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
pose.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
camera.start();

document.getElementById('connectOsc').addEventListener('click', () => {
  const ip = document.getElementById('oscIp').value;
  const port = document.getElementById('oscPort').value;

  fetch('/api/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip, port })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      oscConnected = true;
      console.log('Connected to OSC');
    } else {
      console.error('Failed to connect to OSC');
    }
  })
  .catch(error => console.error('Error connecting to OSC:', error));
});

// Offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
