import { setupSpriteAnimation } from "../sprite-player.js";

const spriteSheet = "images/robocop-sprites.png?v=2";

function setupWeaponActions({ canvas, demo, player, actionStatus }, settings) {
  demo.querySelector('[data-action="draw"]').addEventListener("click", () => {
    player.playSequence(0, settings.drawEnd, {
      offsetX: settings.drawOffsetX,
      status: "Drawing weapon…",
      onComplete: () => {
        actionStatus.textContent = "Weapon drawn";
      },
    });
  });

  demo
    .querySelector('[data-action="holster"]')
    .addEventListener("click", () => {
      player.playSequence(settings.holsterStart, player.frameCount - 1, {
        offsetX: settings.holsterOffsetX,
        status: "Holstering weapon…",
        onComplete: () => {
          player.showFrame(settings.returnFrame, {
            offsetX: settings.returnOffsetX,
          });
          actionStatus.textContent = "Weapon holstered";
        },
      });
    });

  player.showFrame(settings.returnFrame, { offsetX: settings.returnOffsetX });
}

const animations = [
  {
    id: "robocop-walk",
    configuration: {
      src: spriteSheet,
      canvasWidth: 40,
      canvasHeight: 72,
      frameWidth: 40,
      frameHeight: 72,
      frameCount: 8,
      loop: true,
    },
  },
  {
    id: "robocop-weapon",
    configuration: {
      src: spriteSheet,
      canvasWidth: 50,
      canvasHeight: 68,
      frameWidth: 40,
      frameHeight: 72,
      frameCount: 17,
      paddingX: 4,
      offsetY: -8,
      startY: 800,
      extendFrameIndex: 6,
      extendFrameBy: 4,
      offsetStartFrame: 7,
      frameXOffset: 16,
    },
    setupBehavior: (context) =>
      setupWeaponActions(context, {
        drawEnd: 6,
        holsterStart: 7,
        returnFrame: 0,
        drawOffsetX: -5,
        holsterOffsetX: 3,
        returnOffsetX: -5,
      }),
  },
  {
    id: "ed209-walk",
    configuration: {
      src: "images/sprites-ed209.png",
      canvasWidth: 111,
      canvasHeight: 144,
      frameWidth: 111,
      frameHeight: 144,
      frameCount: 8,
      framePositions: [16, 128, 235, 346, 449, 561, 668, 779],
      frameWidths: [104, 99, 103, 95, 104, 99, 103, 95],
      loop: true,
    },
  },
];

export function setupRobocopPage() {
  for (const { id, configuration, setupBehavior } of animations) {
    const canvas = document.getElementById(id);
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`Missing sprite canvas: #${id}`);
    }
    setupSpriteAnimation(canvas, configuration, setupBehavior);
  }
}
