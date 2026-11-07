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
}, {
  id: "shadow-warriors-fight",
  configuration: {
    src: "images/shadow-warriors-sprites.png",
    canvasWidth: 70,
    canvasHeight: 70,
    frameWidth: 70,
    frameHeight: 70,
    frameCount: 13,
    framePositions: Array.from({ length: 13 }, (_, index) => index * 80),
    startY: 151,
  },
  setupBehavior: ({ demo, player, actionStatus }) => {
    const button = demo.querySelector('[data-action="fight"]');
    player.showFrame(0);

    button.addEventListener("click", () => {
      button.disabled = true;
      button.textContent = "Fighting…";
      player.playSequence(0, player.frameCount - 1, {
        status: "Fight in progress…",
        onComplete: () => {
          player.showFrame(0);
          button.disabled = false;
          button.textContent = "Fight again";
          actionStatus.textContent = "Fight complete";
        },
      });
    });
  },
}];

export function setupShadowWarriorsPage() {
  animation.forEach((anim) => {
    const canvas = document.getElementById(anim.id);
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`Missing sprite canvas: #${anim.id}`);
    }
    setupSpriteAnimation(canvas, anim.configuration, anim.setupBehavior);
  });
}
