const sheetCache = new Map();

function loadSpriteSheet(src) {
  if (!sheetCache.has(src)) {
    const sheet = new Image();
    sheet.src = src;
    sheetCache.set(src, sheet);
  }
  return sheetCache.get(src);
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
  const framePositions = canvas.dataset.framePositions
    ?.split(",")
    .map(Number);
  const frameWidths = canvas.dataset.frameWidths?.split(",").map(Number);
  const paddingX = Number(canvas.dataset.paddingX || 0);
  const extendFrameIndex = Number(canvas.dataset.extendFrameIndex ?? -1);
  const extendFrameBy = Number(canvas.dataset.extendFrameBy || 0);
  const offsetStartFrame = Number(
    canvas.dataset.offsetStartFrame ?? frameCount,
  );
  const frameXOffset = Number(canvas.dataset.frameXOffset || 0);
  const holsterStartFrame = Number(canvas.dataset.holsterStart ?? frameCount);
  const returnFrame = Number(canvas.dataset.returnFrame);
  const hasReturnFrame = canvas.dataset.returnFrame !== undefined;
  const drawOffsetX = Number(canvas.dataset.drawOffsetX || 0);
  const holsterOffsetX = Number(canvas.dataset.holsterOffsetX || 0);
  const returnOffsetX = Number(canvas.dataset.returnOffsetX || 0);
  const loops = canvas.dataset.loop === "true";
  const speed = demo.querySelector(".speed");
  const speedValue = demo.querySelector(".speed-value");
  const actionButtons = demo.querySelectorAll("[data-action]");
  const actionStatus = demo.querySelector(".action-status");
  const isActionAnimation = actionButtons.length > 0;

  let frame = 0;
  let playing = !isActionAnimation;
  let showingReturnPose = isActionAnimation && hasReturnFrame;
  let sequenceEnd = frameCount - 1;
  let lastFrameAt = 0;
  let onSequenceEnd = null;

  context.imageSmoothingEnabled = false;

  function drawFrame(timestamp = 0) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const sourceWidth =
      frameWidths?.[frame] ??
      (frame === extendFrameIndex ? frameWidth + extendFrameBy : frameWidth);
    const sourceX =
      framePositions?.[frame] ??
      startX +
        frame * frameWidth +
        (frame >= offsetStartFrame ? frameXOffset : 0);
    const sequenceOffsetX = showingReturnPose
      ? returnOffsetX
      : frame >= holsterStartFrame
        ? holsterOffsetX
        : drawOffsetX;
    context.drawImage(
      sheet,
      sourceX,
      startY,
      sourceWidth,
      frameHeight,
      paddingX +
        extendFrameBy / 2 +
        sequenceOffsetX +
        (frameWidths ? (canvas.width - sourceWidth) / 2 : 0),
      0,
      sourceWidth,
      canvas.height,
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
    endMessage,
    returnToFrame = null,
  ) {
    frame = firstFrame;
    showingReturnPose = false;
    sequenceEnd = lastFrame;
    playing = true;
    lastFrameAt = 0;
    onSequenceEnd = () => {
      actionStatus.textContent = endMessage;
      if (returnToFrame !== null) {
        frame = returnToFrame;
        showingReturnPose = true;
        drawFrame();
      }
    };
    actionStatus.textContent =
      endMessage === "Weapon drawn" ? "Drawing weapon…" : "Holstering weapon…";
    drawFrame();
  }

  function updateToggle(toggle, isPlaying) {
    toggle.setAttribute("aria-pressed", String(isPlaying));
    toggle.querySelector(".button-icon").textContent = isPlaying ? "Ⅱ" : "▶";
    toggle.querySelector(".button-label").textContent = isPlaying
      ? "Pause"
      : "Play";
  }

  sheet.addEventListener("load", drawFrame, { once: true });
  if (sheet.complete && sheet.naturalWidth) drawFrame();

  if (isActionAnimation) {
    const drawEnd = Number(canvas.dataset.drawEnd);
    const holsterStart = Number(canvas.dataset.holsterStart);
    demo.querySelector('[data-action="draw"]').addEventListener("click", () => {
      playSequence(0, drawEnd, "Weapon drawn");
    });
    demo
      .querySelector('[data-action="holster"]')
      .addEventListener("click", () => {
        playSequence(
          holsterStart,
          frameCount - 1,
          "Weapon holstered",
          hasReturnFrame ? returnFrame : null,
        );
      });
  } else {
    const toggle = demo.querySelector(".toggle");
    toggle.addEventListener("click", () => {
      playing = !playing;
      if (playing) lastFrameAt = 0;
      updateToggle(toggle, playing);
    });
  }

  speed.addEventListener("input", () => {
    speedValue.textContent = `${speed.value} ms`;
  });

  function animate(timestamp) {
    let frameChanged = false;

    if (
      playing &&
      sheet.complete &&
      sheet.naturalWidth &&
      timestamp - lastFrameAt >= Number(speed.value)
    ) {
      if (frame < sequenceEnd) {
        frame += 1;
        frameChanged = true;
      } else if (loops) {
        frame = 0;
        frameChanged = true;
      } else {
        playing = false;
        if (onSequenceEnd) {
          onSequenceEnd();
          onSequenceEnd = null;
        }
      }
      lastFrameAt = timestamp;
    }

    if (
      pulseColor !== null &&
      sheet.complete &&
      sheet.naturalWidth
    ) {
      drawFrame(timestamp);
    } else if (frameChanged) {
      drawFrame();
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

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
