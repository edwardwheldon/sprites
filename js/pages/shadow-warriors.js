import { setupSpriteAnimation } from "../sprite-player.js";

const animation = {
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
};

export function setupShadowWarriorsPage() {
  const canvas = document.getElementById(animation.id);
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error(`Missing sprite canvas: #${animation.id}`);
  }
  setupSpriteAnimation(canvas, animation.configuration);
}
