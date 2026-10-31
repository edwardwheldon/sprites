const sheetCache = new Map();

function loadSpriteSheet(src) {
  if (!sheetCache.has(src)) {
    const sheet = new Image();
    sheet.src = src;
    sheetCache.set(src, sheet);
  }
  return sheetCache.get(src);
}

function updateToggle(toggle, isPlaying) {
  toggle.setAttribute("aria-pressed", String(isPlaying));
  toggle.querySelector(".button-icon").textContent = isPlaying ? "Ⅱ" : "▶";
  toggle.querySelector(".button-label").textContent = isPlaying
    ? "Pause"
    : "Play";
}

function setupAnimation(canvas) {
  const demo = canvas.closest(".demo");
  const pulseColor =
    canvas.dataset.pulseColor === undefined
      ? null
      : Number.parseInt(canvas.dataset.pulseColor, 16);
  const context = canvas.getContext("2d", {
    willReadFrequently: pulseColor !== null,
  });
  const sheet = loadSpriteSheet(canvas.dataset.src);
  const frameWidth = Number(canvas.dataset.frameWidth);
  const frameHeight = Number(canvas.dataset.frameHeight);
  const frameCount = Number(canvas.dataset.frameCount);
  const startX = Number(canvas.dataset.startX);
  const startY = Number(canvas.dataset.startY);
  const tripStartY = Number(canvas.dataset.tripStartY);
  const tripFrameCount = Number(canvas.dataset.tripFrameCount || 0);
  const tripFrameHeight = Number(canvas.dataset.tripFrameHeight || frameHeight);
  const tripFrameXOffsets = canvas.dataset.tripFrameXOffsets
    ?.split(",")
    .map(Number);
  const framePositions = canvas.dataset.framePositions?.split(",").map(Number);
  const frameWidths = canvas.dataset.frameWidths?.split(",").map(Number);
  const paddingX = Number(canvas.dataset.paddingX || 0);
  const extendFrameIndex = Number(canvas.dataset.extendFrameIndex ?? -1);
  const extendFrameBy = Number(canvas.dataset.extendFrameBy || 0);
  const offsetStartFrame = Number(
    canvas.dataset.offsetStartFrame ?? frameCount,
  );
  const frameXOffset = Number(canvas.dataset.frameXOffset || 0);
  const loops = canvas.dataset.loop === "true";
  const speed = demo.querySelector(".speed");
  const speedValue = demo.querySelector(".speed-value");
  const toggle = demo.querySelector(".toggle");
  const actionStatus = demo.querySelector(".action-status");

  let frame = 0;
  let activeStartY = startY;
  let activeFrameHeight = frameHeight;
  let activeFrameXOffsets = null;
  let activeOffsetX = 0;
  let activeLoops = loops;
  let playing = loops;
  let sequenceEnd = frameCount - 1;
  let lastFrameAt = 0;
  let onSequenceEnd = null;

  context.imageSmoothingEnabled = false;

  function drawFrame(timestamp = 0) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!sheet.complete || !sheet.naturalWidth) return;
    const sourceWidth =
      frameWidths?.[frame] ??
      (frame === extendFrameIndex ? frameWidth + extendFrameBy : frameWidth);
    const sourceX =
      framePositions?.[frame] ??
      startX +
        frame * frameWidth +
        (frame >= offsetStartFrame ? frameXOffset : 0);
    context.drawImage(
      sheet,
      sourceX,
      activeStartY,
      sourceWidth,
      activeFrameHeight,
      paddingX +
        extendFrameBy / 2 +
        activeOffsetX +
        (activeFrameXOffsets?.[frame] ?? 0) +
        (frameWidths ? (canvas.width - sourceWidth) / 2 : 0),
      (canvas.height - activeFrameHeight) / 2,
      sourceWidth,
      activeFrameHeight,
    );

    if (pulseColor !== null) {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const sourceRed = (pulseColor >> 16) & 255;
      const sourceGreen = (pulseColor >> 8) & 255;
      const sourceBlue = pulseColor & 255;
      const pulse = (Math.sin((timestamp / 1400) * Math.PI * 2) + 1) / 2;
      const red = Math.round(75 + pulse * 180);
      const green = Math.round(12 + pulse * 34);
      const blue = Math.round(20 + pulse * 25);

      for (let index = 0; index < pixels.data.length; index += 4) {
        if (
          pixels.data[index] === sourceRed &&
          pixels.data[index + 1] === sourceGreen &&
          pixels.data[index + 2] === sourceBlue
        ) {
          pixels.data[index] = red;
          pixels.data[index + 1] = green;
          pixels.data[index + 2] = blue;
        }
      }

      context.putImageData(pixels, 0, 0);
    }
  }

  function playSequence(
    firstFrame,
    lastFrame,
    {
      startY: sequenceStartY = startY,
      frameHeight: sequenceFrameHeight = frameHeight,
      frameXOffsets = null,
      offsetX = 0,
      loop = false,
      status = null,
      onComplete = null,
    } = {},
  ) {
    frame = firstFrame;
    activeStartY = sequenceStartY;
    activeFrameHeight = sequenceFrameHeight;
    activeFrameXOffsets = frameXOffsets;
    activeOffsetX = offsetX;
    activeLoops = loop;
    sequenceEnd = lastFrame;
    playing = true;
    lastFrameAt = 0;
    onSequenceEnd = onComplete;
    if (status !== null && actionStatus) actionStatus.textContent = status;
    drawFrame();
  }

  function showFrame(
    frameIndex,
    {
      startY: poseStartY = startY,
      frameHeight: poseFrameHeight = frameHeight,
      frameXOffsets = null,
      offsetX = 0,
    } = {},
  ) {
    frame = frameIndex;
    activeStartY = poseStartY;
    activeFrameHeight = poseFrameHeight;
    activeFrameXOffsets = frameXOffsets;
    activeOffsetX = offsetX;
    activeLoops = false;
    sequenceEnd = frameIndex;
    playing = false;
    onSequenceEnd = null;
    drawFrame();
  }

  const player = {
    frameCount,
    loops,
    playSequence,
    showFrame,
    toggle() {
      playing = !playing;
      if (playing) lastFrameAt = 0;
      return playing;
    },
  };

  sheet.addEventListener("load", drawFrame, { once: true });
  if (sheet.complete && sheet.naturalWidth) drawFrame();

  if (toggle) {
    toggle.addEventListener("click", () => {
      updateToggle(toggle, player.toggle());
    });
  }

  const behaviorName = canvas.dataset.behavior;
  if (behaviorName) {
    const setupBehavior = animationBehaviors[behaviorName];
    if (!setupBehavior) {
      throw new Error(`Unknown sprite behavior: ${behaviorName}`);
    }
    setupBehavior({ canvas, demo, player, actionStatus });
  }

  if (canvas.dataset.static === "true" && pulseColor === null) return;

  function animate(timestamp) {
    let frameChanged = false;

    if (
      playing &&
      sheet.complete &&
      sheet.naturalWidth &&
      timestamp - lastFrameAt >= Number(speed?.value || 120)
    ) {
      if (frame < sequenceEnd) {
        frame += 1;
        frameChanged = true;
      } else if (activeLoops) {
        frame = 0;
        frameChanged = true;
      } else {
        playing = false;
        if (onSequenceEnd) {
          const complete = onSequenceEnd;
          onSequenceEnd = null;
          complete();
        }
      }
      lastFrameAt = timestamp;
    }

    if (pulseColor !== null && sheet.complete && sheet.naturalWidth) {
      drawFrame(timestamp);
    } else if (frameChanged) {
      drawFrame();
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

function setupRobocopWeapon({ canvas, demo, player, actionStatus }) {
  const drawEnd = Number(canvas.dataset.drawEnd);
  const holsterStart = Number(canvas.dataset.holsterStart);
  const returnFrame = Number(canvas.dataset.returnFrame);
  const drawOffsetX = Number(canvas.dataset.drawOffsetX || 0);
  const holsterOffsetX = Number(canvas.dataset.holsterOffsetX || 0);
  const returnOffsetX = Number(canvas.dataset.returnOffsetX || 0);

  demo.querySelector('[data-action="draw"]').addEventListener("click", () => {
    player.playSequence(0, drawEnd, {
      offsetX: drawOffsetX,
      status: "Drawing weapon…",
      onComplete: () => {
        actionStatus.textContent = "Weapon drawn";
      },
    });
  });

  demo
    .querySelector('[data-action="holster"]')
    .addEventListener("click", () => {
      player.playSequence(holsterStart, player.frameCount - 1, {
        offsetX: holsterOffsetX,
        status: "Holstering weapon…",
        onComplete: () => {
          player.showFrame(returnFrame, { offsetX: returnOffsetX });
          actionStatus.textContent = "Weapon holstered";
        },
      });
    });

  player.showFrame(returnFrame, { offsetX: returnOffsetX });
}

function setupSpaceHarrierTrip({ canvas, demo, player, actionStatus }) {
  const tripStartY = Number(canvas.dataset.tripStartY);
  const tripFrameCount = Number(canvas.dataset.tripFrameCount || 0);
  const tripFrameHeight = Number(
    canvas.dataset.tripFrameHeight || canvas.dataset.frameHeight,
  );
  const tripFrameXOffsets = canvas.dataset.tripFrameXOffsets
    ?.split(",")
    .map(Number);
  const toggle = demo.querySelector(".toggle");
  const screenCaption = demo.querySelector(".screen-caption");

  demo.querySelector('[data-action="trip"]').addEventListener("click", () => {
    player.playSequence(0, tripFrameCount - 1, {
      startY: tripStartY,
      frameHeight: tripFrameHeight,
      frameXOffsets: tripFrameXOffsets,
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

const animationBehaviors = {
  "robocop-weapon": setupRobocopWeapon,
  "space-harrier-trip": setupSpaceHarrierTrip,
};

document.querySelectorAll(".sprite-animation").forEach(setupAnimation);

const stage = document.querySelector(".stage");
const gamePages = [...document.querySelectorAll(".game-page")];
const gameLinks = [...document.querySelectorAll(".game-link")];

function showGame(hash) {
  const activePage =
    gamePages.find((page) => `#${page.id}` === hash) ?? gamePages[0];

  gamePages.forEach((page) => {
    page.hidden = page !== activePage;
  });
  gameLinks.forEach((link) => {
    if (link.hash === `#${activePage.id}`) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  stage.dataset.game = activePage.id;
  document.title =
    activePage.id === "space-harrier"
      ? "Space Harrier — Animations"
      : "RoboCop — Animations";
}

window.addEventListener("hashchange", () => showGame(window.location.hash));
showGame(window.location.hash);
