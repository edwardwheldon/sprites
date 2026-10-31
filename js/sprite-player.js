const sheetCache = new Map();

function loadSpriteSheet(src) {
  if (!sheetCache.has(src)) {
    const sheet = new Image();
    sheet.src = src;
    sheetCache.set(src, sheet);
  }
  return sheetCache.get(src);
}

export function updateToggle(toggle, isPlaying) {
  toggle.setAttribute("aria-pressed", String(isPlaying));
  toggle.querySelector(".button-icon").textContent = isPlaying ? "Ⅱ" : "▶";
  toggle.querySelector(".button-label").textContent = isPlaying
    ? "Pause"
    : "Play";
}

export function setupSpriteAnimation(canvas, configuration, setupBehavior) {
  const demo = canvas.closest(".demo");
  canvas.width = configuration.canvasWidth;
  canvas.height = configuration.canvasHeight;
  const context = canvas.getContext("2d", {
    willReadFrequently: configuration.pulseColor !== undefined,
  });
  const sheet = loadSpriteSheet(configuration.src);
  const {
    frameWidth,
    frameHeight,
    frameCount,
    startX = 0,
    startY = 0,
    paddingX = 0,
    extendFrameIndex = -1,
    extendFrameBy = 0,
    offsetStartFrame = frameCount,
    frameXOffset = 0,
    framePositions,
    frameWidths,
    frameCenters,
    centerSprite = false,
    pulseColor,
    loop = false,
    static: isStatic = false,
  } = configuration;
  const speed = demo.querySelector(".speed");
  const speedValue = demo.querySelector(".speed-value");
  const toggle = demo.querySelector(".toggle");
  const actionStatus = demo.querySelector(".action-status");

  context.imageSmoothingEnabled = false;

  let frame = 0;
  let activeStartY = startY;
  let activeFrameHeight = frameHeight;
  let activeFrameXOffsets = null;
  let activeOffsetX = 0;
  let flipped = false;
  let activeLoops = loop;
  let playing = loop;
  let sequenceEnd = frameCount - 1;
  let lastFrameAt = 0;
  let onSequenceEnd = null;

  function drawFrame(timestamp = 0) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!sheet.complete || !sheet.naturalWidth) return;

    const sourceWidth =
      frameWidths?.[frame] ??
      (frame === extendFrameIndex ? frameWidth + extendFrameBy : frameWidth);
    const sourceX =
      framePositions?.[frame] ??
      startX + frame * frameWidth + (frame >= offsetStartFrame ? frameXOffset : 0);
    const destinationX =
      paddingX +
      extendFrameBy / 2 +
      activeOffsetX +
      (activeFrameXOffsets?.[frame] ?? 0) +
      (frameWidths ? (canvas.width - sourceWidth) / 2 : 0) +
      (centerSprite
        ? canvas.width / 2 - (frameCenters?.[frame] ?? sourceWidth / 2)
        : 0);

    context.save();
    if (flipped) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(
      sheet,
      sourceX,
      activeStartY,
      sourceWidth,
      activeFrameHeight,
      destinationX,
      (canvas.height - activeFrameHeight) / 2,
      sourceWidth,
      activeFrameHeight,
    );
    context.restore();

    if (pulseColor !== undefined) {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const sourceRed = (pulseColor >> 16) & 255;
      const sourceGreen = (pulseColor >> 8) & 255;
      const sourceBlue = pulseColor & 255;
      const pulse = (Math.sin((timestamp / 1000) * Math.PI * 2) + 1) / 2;
      const red = Math.round(140 + pulse * 180);
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
      loop: sequenceLoops = false,
      status = null,
      onComplete = null,
    } = {},
  ) {
    frame = firstFrame;
    activeStartY = sequenceStartY;
    activeFrameHeight = sequenceFrameHeight;
    activeFrameXOffsets = frameXOffsets;
    activeOffsetX = offsetX;
    activeLoops = sequenceLoops;
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
    loops: loop,
    playSequence,
    showFrame,
    setPose(frameIndex, isFlipped = false) {
      const changed = frame !== frameIndex || flipped !== isFlipped;
      frame = frameIndex;
      activeStartY = startY;
      activeFrameHeight = frameHeight;
      activeFrameXOffsets = null;
      activeOffsetX = 0;
      flipped = isFlipped;
      activeLoops = false;
      sequenceEnd = frameIndex;
      playing = false;
      onSequenceEnd = null;
      if (changed) drawFrame();
    },
    toggle() {
      playing = !playing;
      if (playing) lastFrameAt = 0;
      return playing;
    },
  };

  sheet.addEventListener("load", drawFrame, { once: true });
  if (sheet.complete && sheet.naturalWidth) drawFrame();

  if (speed && speedValue) {
    const updateSpeedValue = () => {
      speedValue.textContent = `${speed.value} ms`;
    };
    updateSpeedValue();
    speed.addEventListener("input", updateSpeedValue);
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      updateToggle(toggle, player.toggle());
    });
  }

  const updateBehavior = setupBehavior?.({
    canvas,
    demo,
    player,
    actionStatus,
  });

  if (isStatic && pulseColor === undefined && !updateBehavior) return;

  function animate(timestamp) {
    let frameChanged = false;

    if (sheet.complete && sheet.naturalWidth) updateBehavior?.(timestamp);

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

    if (pulseColor !== undefined && sheet.complete && sheet.naturalWidth) {
      drawFrame(timestamp);
    } else if (frameChanged) {
      drawFrame();
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
