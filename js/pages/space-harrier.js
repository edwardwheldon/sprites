import { setupSpriteAnimation, updateToggle } from "../sprite-player.js";

const spriteSheet = "images/space-harrier-sprites.png";

function setupTripAction({ canvas, demo, player, actionStatus }, settings) {
  const toggle = demo.querySelector(".toggle");
  const screenCaption = demo.querySelector(".screen-caption");

  demo.querySelector('[data-action="trip"]').addEventListener("click", () => {
    player.playSequence(0, settings.frameCount - 1, {
      startY: settings.startY,
      frameHeight: settings.frameHeight,
      frameXOffsets: settings.frameXOffsets,
      status: "Tripping!",
      onComplete: () => {
        player.playSequence(0, player.frameCount - 1, { loop: player.loops });
        canvas.setAttribute("aria-label", "Space Harrier running");
        actionStatus.textContent = "Running";
        screenCaption.textContent = "RUN CYCLE · GROUND";
      },
    });
    updateToggle(toggle, true);
    canvas.setAttribute("aria-label", "Space Harrier tripping");
    screenCaption.textContent = "TRIP · GROUND";
  });
}

function setupFlightCycle({ canvas, player }, settings) {
  const phaseDuration = settings.phaseDuration;
  const cycleDuration = phaseDuration * 6;
  const outboundFrames = [0, 1, 2, 3];
  const returnFrames = [3, 2, 1, 0];
  let startedAt = null;
  let currentLabel = canvas.getAttribute("aria-label");

  return (timestamp) => {
    if (startedAt === null) startedAt = timestamp;

    const elapsed = (timestamp - startedAt) % cycleDuration;
    const phase = Math.floor(elapsed / phaseDuration);
    const progress = (elapsed % phaseDuration) / phaseDuration;
    const frameSequence =
      phase === 1 || phase === 4 ? outboundFrames : returnFrames;
    const activeFrame =
      frameSequence[
        Math.min(
          frameSequence.length - 1,
          Math.floor(progress * frameSequence.length),
        )
      ];
    const isMirrored = phase >= 4 && activeFrame !== 0;
    const isCentered = phase === 0 || phase === 3;
    player.setPose(isCentered ? 0 : activeFrame, isMirrored);
    const label = isCentered
      ? "Space Harrier flying"
      : `Space Harrier turning ${isMirrored ? "the other way" : "left"}`;
    if (label !== currentLabel) {
      canvas.setAttribute("aria-label", label);
      currentLabel = label;
    }
  };
}

const animations = [
  {
    id: "space-harrier-run",
    configuration: {
      src: spriteSheet,
      canvasWidth: 64,
      canvasHeight: 72,
      frameWidth: 64,
      frameHeight: 72,
      frameCount: 4,
      startY: 32,
      pulseColor: 0x41e54b,
      loop: true,
    },
    setupBehavior: (context) =>
      setupTripAction(context, {
        startY: 136,
        frameCount: 9,
        frameHeight: 70,
        frameXOffsets: [0, 0, 0, 0, 0, 5, 5, 14, 21, 25],
      }),
  },
  {
    id: "space-harrier-flight",
    configuration: {
      src: spriteSheet,
      canvasWidth: 112,
      canvasHeight: 72,
      frameWidth: 64,
      frameHeight: 72,
      frameCount: 4,
      startX: 5,
      startY: 252,
      framePositions: [5, 69, 133, 197],
      frameCenters: [41.5, 41.5, 44.5, 40.5],
      centerSprite: true,
      pulseColor: 0x41e54b,
      static: true,
    },
    setupBehavior: (context) =>
      setupFlightCycle(context, { phaseDuration: 2000 }),
  },
];

export function setupSpaceHarrierPage() {
  for (const { id, configuration, setupBehavior } of animations) {
    const canvas = document.getElementById(id);
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`Missing sprite canvas: #${id}`);
    }
    setupSpriteAnimation(canvas, configuration, setupBehavior);
  }
}
