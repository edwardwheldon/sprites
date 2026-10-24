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
  const context = canvas.getContext("2d");
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

  function drawFrame() {
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
    if (
      playing &&
      sheet.complete &&
      sheet.naturalWidth &&
      timestamp - lastFrameAt >= Number(speed.value)
    ) {
      if (frame < sequenceEnd) {
        frame += 1;
        drawFrame();
      } else if (loops) {
        frame = 0;
        drawFrame();
      } else {
        playing = false;
        if (onSequenceEnd) {
          onSequenceEnd();
          onSequenceEnd = null;
        }
      }
      lastFrameAt = timestamp;
    }
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

document.querySelectorAll(".sprite-animation").forEach(setupAnimation);
