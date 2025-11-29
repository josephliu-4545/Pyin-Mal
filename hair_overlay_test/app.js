// Hair Overlay Demo using MediaPipe FaceMesh
// - Plain JS + CDN only; runs from file:// by opening index.html
// - Starts webcam, detects face landmarks, estimates forehead point and face width
// - Positions a hair image accordingly each frame

(function () {
  // DOM references
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const hair = document.getElementById('hair');
  const stage = document.querySelector('.stage');

  // Debug drawing toggles
  // - DRAW_ALL_LANDMARKS: render every FaceMesh landmark as a small dot
  // - DRAW_LANDMARK_INDICES: label each landmark with its index (may be cluttered/slow)
  const DRAW_ALL_LANDMARKS = false;
  const DRAW_LANDMARK_INDICES = false;

  // Small placeholder hair (simple rounded shape) as a base64 PNG
  // This acts as a fallback in case hair.png is missing
  const fallbackHairDataUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAABaCAYAAACWmK3xAAAACXBIWXMAAAsSAAALEgHS3X78AAABcUlEQVR4nO3cS27CQBBA0XH//2bq0X8rQ8vCwqg3xG0S1g9Yp8q9m2w1l0mE3q6wQXc7gqf3v6b2y9J5p4kF0i0g8O2gAQLKxNw8c7zvC+v5bq5cS9Qm1pQm1pQm1pQm1pQm1pQm1pQm1pQm1pQm1pQm1pQm1pQm3J6t5l7rI6fC6y7z4z0h3mV8yP0qkz2k9o3b2l3vXz5m+g1r6vF7m7b4f0g3fV9k7wz9m8wO9aH4s8c7d0Fqj9hGgqvK5u+gGm1t8c3yYF6kO+9gH0eM9d1mW9iG+N0V9z2m1T2Z5z7a8b7rQ3Yl4m7QZpQm1pQm1pQm1pQm1pQm1pQm1pQm1pQm1pQm1pQm1pQm1pQm2l6wEw3p5A2h6j6Q7o6b6Q3o6b6Q3o6b6Q3o6b6Q3o6b6Q3o6b6Q3o6b6Q3o6b6Q3o6b6Q/oR2g0kHk3v9lU8qk7k5r0i4AAAAAElFTkSuQmCC';

  // If hair.png fails to load, use fallback data URL
  hair.onerror = () => {
    if (!hair.dataset.fallbackApplied) {
      hair.src = fallbackHairDataUrl;
      hair.dataset.fallbackApplied = '1';
    }
  };

  // Ensure canvas matches the display size of the stage
  function resizeCanvasToStage() {
    const rect = stage.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  window.addEventListener('resize', resizeCanvasToStage);
  resizeCanvasToStage();

  // Start the webcam
  async function startCamera() {
    // We initialize the native stream; MediaPipe Camera helper will read from video element
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = stream;
    await video.play();
  }

  // Compute Euclidean distance between 2D points
  function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  // Using FaceMesh landmark indices we need for geometry:
  // - Forehead: 10
  // - Eyes (outer/inner corners): Left 33/133, Right 263/362
  // - Mouth (corners and inner top/bottom): 61/291 and 13/14
  // - Face sides near ears (approx): Left 234, Right 454
  const FOREHEAD_INDEX = 10;
  const LEFT_EYE_OUT = 33;
  const LEFT_EYE_IN = 133;
  const RIGHT_EYE_OUT = 263;
  const RIGHT_EYE_IN = 362;
  const MOUTH_LEFT = 61;
  const MOUTH_RIGHT = 291;
  const MOUTH_TOP = 13;
  const MOUTH_BOTTOM = 14;
  const LEFT_SIDE = 234;
  const RIGHT_SIDE = 454;

  // Choose which anchor to use for positioning the image center
  // Options: 'nose' | 'forehead' | 'eyes_mid' | 'left_eye' | 'right_eye' | 'mouth' | 'left_ear' | 'right_ear'
  const anchorMode = 'nose';

  function onResults(results) {
    const rect = stage.getBoundingClientRect();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];

    // Optionally draw ALL landmarks for debugging/inspection
    if (DRAW_ALL_LANDMARKS) {
      ctx.fillStyle = 'rgba(0, 170, 255, 0.9)';
      ctx.font = '10px sans-serif';
      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];
        const x = lm.x * rect.width;
        const y = lm.y * rect.height;
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        if (DRAW_LANDMARK_INDICES) {
          ctx.fillText(String(i), x + 2, y - 2);
        }
      }
    }

    // Landmarks are normalized [0..1]; convert to pixel space within the stage box
    const forehead = landmarks[FOREHEAD_INDEX];
    const leftEyeOut = landmarks[LEFT_EYE_OUT];
    const leftEyeIn = landmarks[LEFT_EYE_IN];
    const rightEyeOut = landmarks[RIGHT_EYE_OUT];
    const rightEyeIn = landmarks[RIGHT_EYE_IN];
    const mouthL = landmarks[MOUTH_LEFT];
    const mouthR = landmarks[MOUTH_RIGHT];
    const mouthT = landmarks[MOUTH_TOP];
    const mouthB = landmarks[MOUTH_BOTTOM];
    const leftSide = landmarks[LEFT_SIDE];
    const rightSide = landmarks[RIGHT_SIDE];

    const foreheadPx = { x: forehead.x * rect.width, y: forehead.y * rect.height };
    const leftEyeOutPx = { x: leftEyeOut.x * rect.width, y: leftEyeOut.y * rect.height };
    const leftEyeInPx = { x: leftEyeIn.x * rect.width, y: leftEyeIn.y * rect.height };
    const rightEyeOutPx = { x: rightEyeOut.x * rect.width, y: rightEyeOut.y * rect.height };
    const rightEyeInPx = { x: rightEyeIn.x * rect.width, y: rightEyeIn.y * rect.height };
    const mouthLPx = { x: mouthL.x * rect.width, y: mouthL.y * rect.height };
    const mouthRPx = { x: mouthR.x * rect.width, y: mouthR.y * rect.height };
    const mouthTPx = { x: mouthT.x * rect.width, y: mouthT.y * rect.height };
    const mouthBPx = { x: mouthB.x * rect.width, y: mouthB.y * rect.height };
    const leftSidePx = { x: leftSide.x * rect.width, y: leftSide.y * rect.height };
    const rightSidePx = { x: rightSide.x * rect.width, y: rightSide.y * rect.height };

    // 1) Head roll (tilt) using the line between the two eyes
    // dx, dy in pixel space and roll angle in radians, then convert to degrees
    const leftEyeCenter = { x: (leftEyeOutPx.x + leftEyeInPx.x) / 2, y: (leftEyeOutPx.y + leftEyeInPx.y) / 2 };
    const rightEyeCenter = { x: (rightEyeOutPx.x + rightEyeInPx.x) / 2, y: (rightEyeOutPx.y + rightEyeInPx.y) / 2 };
    const dx = rightEyeCenter.x - leftEyeCenter.x;
    const dy = rightEyeCenter.y - leftEyeCenter.y;
    const roll = Math.atan2(dy, dx);
    const angleDeg = roll * (180 / Math.PI);

    // 2) Scale
    // Previous: scale by inter-ocular distance. Request: make hair 50% of page/stage width.
    const faceWidth = Math.hypot(dx, dy);
    const hairWidth = rect.width * 1; // 70% of the visible stage width (bigger)

    // 3) Position: compute a generic anchor point based on the chosen mode
    // Helpers
    const upX = -Math.sin(roll); // face up unit vector (perpendicular to eye line)
    const upY = Math.cos(roll);
    const downX = -upX;
    const downY = -upY;
    const eyesMidX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const eyesMidY = (leftEyeCenter.y + rightEyeCenter.y) / 2;

    let anchorX = eyesMidX;
    let anchorY = eyesMidY;
    switch (anchorMode) {
      case 'forehead':
        anchorX = foreheadPx.x;
        anchorY = foreheadPx.y;
        break;
      case 'eyes_mid':
        anchorX = eyesMidX;
        anchorY = eyesMidY;
        break;
      case 'left_eye':
        anchorX = leftEyeCenter.x;
        anchorY = leftEyeCenter.y;
        break;
      case 'right_eye':
        anchorX = rightEyeCenter.x;
        anchorY = rightEyeCenter.y;
        break;
      case 'mouth': {
        const mouthCenterX = (mouthLPx.x + mouthRPx.x) / 2;
        const mouthCenterY = (mouthTPx.y + mouthBPx.y) / 2; // vertical mid from inner lips
        anchorX = mouthCenterX;
        anchorY = mouthCenterY;
        break;
      }
      case 'left_ear':
        anchorX = leftSidePx.x;
        anchorY = leftSidePx.y;
        break;
      case 'right_ear':
        anchorX = rightSidePx.x;
        anchorY = rightSidePx.y;
        break;
      case 'nose':
      default: {
        // Estimate nose using eyes midpoint moved down along face direction
        const noseShift = faceWidth * 0.40;
        anchorX = eyesMidX + downX * noseShift;
        anchorY = eyesMidY + downY * noseShift;
        break;
      }
    }

    // Place the image so its CENTER sits at the anchor; use CSS translate to center
    const targetLeft = anchorX;
    const targetTop = anchorY;

    // Optional debug markers: eyes midpoint and anchor point
    ctx.fillStyle = 'rgba(0, 255, 180, 0.9)';
    ctx.beginPath();
    ctx.arc(eyesMidX, eyesMidY, 3, 0, Math.PI * 2); // eyes midpoint
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
    ctx.beginPath();
    ctx.arc(targetLeft, targetTop, 4, 0, Math.PI * 2); // current anchor point
    ctx.fill();

    // 4) Apply updates every frame
    // - size from inter-ocular width
    // - position from forehead anchor + vertical offset
    // - rotation from head roll (tilt)
    hair.style.width = `${hairWidth}px`;
    hair.style.left = `${targetLeft}px`;
    hair.style.top = `${targetTop}px`;
    hair.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg)`;
    hair.style.transformOrigin = 'center center';
  }

  async function main() {
    try {
      await startCamera();

      // Initialize MediaPipe FaceMesh from CDN (global constructor)
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(onResults);

      // Use MediaPipe Camera helper for frame pumping (global constructor)
      const camera = new Camera(video, {
        onFrame: async () => {
          await faceMesh.send({ image: video });
        },
        width: 640,
        height: 480,
      });

      camera.start();

      // If hair.png isn't present, set fallback so demo still works
      if (!hair.getAttribute('src')) {
        hair.src = fallbackHairDataUrl;
      }
    } catch (err) {
      console.error('Initialization failed:', err);
      alert('Could not start camera. Please allow camera access.');
    }
  }

  main();
})();
