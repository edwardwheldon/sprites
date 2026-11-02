import { setupSpriteAnimation } from "../sprite-player.js";

const animation = [{
  id: "shadow-warriors-walk",
  configuration: {
    src: "images/shadow-warriors-sprites.png",
    canvasWidth: 60,
    canvasHeight: 66,
    frameWidth: 60,
    frameHeight: 66,
    frameCount: 6,
    startX: 7,
    startY: 7,
    loop: true,
  },
}, {
  id: "shadow-warriors-running",
  configuration: {
    src: "images/shadow-warriors-sprites.png",
    canvasWidth: 60,
    canvasHeight: 66,
    frameWidth: 60,
    frameHeight: 66,
    frameCount: 6,
    startX: 7,
    startY: 78,
    loop: true,
  },
}];

export function setupShadowWarriorsPage() {
  animation.forEach((anim) => {
    const canvas = document.getElementById(anim.id);
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`Missing sprite canvas: #${anim.id}`);
    }
    setupSpriteAnimation(canvas, anim.configuration);
  });
}
