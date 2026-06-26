window.MotherMap = window.MotherMap || {};

function applyMosaicRegions(sourceImage, regions, blockSize = 12) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = sourceImage.naturalWidth;
  canvas.height = sourceImage.naturalHeight;
  ctx.drawImage(sourceImage, 0, 0);

  regions.forEach((region) => {
    const x = Math.max(0, Math.round(region.x));
    const y = Math.max(0, Math.round(region.y));
    const width = Math.min(canvas.width - x, Math.round(region.width));
    const height = Math.min(canvas.height - y, Math.round(region.height));
    if (width < 4 || height < 4) return;

    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;

    for (let row = 0; row < height; row += blockSize) {
      for (let col = 0; col < width; col += blockSize) {
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let yOffset = 0; yOffset < blockSize && row + yOffset < height; yOffset += 1) {
          for (let xOffset = 0; xOffset < blockSize && col + xOffset < width; xOffset += 1) {
            const index = ((row + yOffset) * width + (col + xOffset)) * 4;
            r += data[index];
            g += data[index + 1];
            b += data[index + 2];
            count += 1;
          }
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        for (let yOffset = 0; yOffset < blockSize && row + yOffset < height; yOffset += 1) {
          for (let xOffset = 0; xOffset < blockSize && col + xOffset < width; xOffset += 1) {
            const index = ((row + yOffset) * width + (col + xOffset)) * 4;
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
          }
        }
      }
    }

    ctx.putImageData(imageData, x, y);
  });

  return canvas.toDataURL('image/jpeg', 0.92);
}

function createMosaicEditor(overlay, callbacks) {
  const { openModal, closeModal } = window.MotherMapShell || {};
  if (!openModal || !closeModal) return null;

  const rootStyles = getComputedStyle(document.documentElement);
  const regionStroke = rootStyles.getPropertyValue('--color-primary').trim();

  const canvas = overlay.querySelector('[data-mm-mosaic-canvas]');
  const ctx = canvas.getContext('2d');
  const resetButton = overlay.querySelector('[data-mm-mosaic-reset]');
  const applyButton = overlay.querySelector('[data-mm-mosaic-apply]');

  let sourceImage = null;
  let regions = [];
  let draftRegion = null;
  let dragStart = null;
  let scale = 1;

  const redraw = () => {
    if (!sourceImage) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    [...regions, draftRegion].filter(Boolean).forEach((region) => {
      ctx.strokeStyle = regionStroke;
      ctx.fillStyle = regionStroke;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(region.x, region.y, region.width, region.height);
      ctx.globalAlpha = 1;
      ctx.strokeRect(region.x, region.y, region.width, region.height);
    });
    ctx.restore();
  };

  const resetState = () => {
    sourceImage = null;
    regions = [];
    draftRegion = null;
    dragStart = null;
  };

  const scheduleReset = () => {
    window.setTimeout(resetState, 260);
  };

  const close = () => {
    if (overlay.classList.contains('is-open')) {
      closeModal(overlay);
    }
    scheduleReset();
  };

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.closest('[data-modal-close]')) {
      scheduleReset();
    }
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (!sourceImage) return;
    const rect = canvas.getBoundingClientRect();
    dragStart = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
    draftRegion = { x: dragStart.x, y: dragStart.y, width: 0, height: 0 };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!dragStart) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    draftRegion = {
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width: Math.abs(x - dragStart.x),
      height: Math.abs(y - dragStart.y),
    };
    redraw();
  });

  const finishDrag = () => {
    if (!draftRegion || draftRegion.width < 8 || draftRegion.height < 8) {
      draftRegion = null;
      dragStart = null;
      redraw();
      return;
    }
    regions.push({ ...draftRegion });
    draftRegion = null;
    dragStart = null;
    redraw();
  };

  canvas.addEventListener('pointerup', finishDrag);
  canvas.addEventListener('pointercancel', finishDrag);

  resetButton.addEventListener('click', () => {
    regions = [];
    draftRegion = null;
    dragStart = null;
    redraw();
  });

  applyButton.addEventListener('click', () => {
    if (!sourceImage) return;
    const naturalRegions = regions.map((region) => ({
      x: region.x / scale,
      y: region.y / scale,
      width: region.width / scale,
      height: region.height / scale,
    }));
    const output = applyMosaicRegions(sourceImage, naturalRegions);
    close();
    queueMicrotask(() => {
      callbacks.onApply(output);
    });
  });

  return {
    open(imageSrc) {
      const image = new Image();
      image.onload = () => {
        sourceImage = image;
        regions = [];
        const maxWidth = 860;
        scale = image.naturalWidth > maxWidth ? maxWidth / image.naturalWidth : 1;
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        redraw();
        openModal(overlay);
      };
      image.src = imageSrc;
    },
  };
}

window.MotherMap.mosaic = {
  applyMosaicRegions,
  createMosaicEditor,
};
