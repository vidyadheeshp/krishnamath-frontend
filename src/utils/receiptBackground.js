// Optional faded background picture for printed receipts (the Udupi Krishna Vishwaroopa image).
//
// Put the picture at  frontend/public/receipt-background.jpg  (JPG, PNG or WebP all work). If the file is
// missing, receipts are simply printed without a background.
//
// The picture is shrunk, feathered at the edges and washed out onto white here (so text on top stays readable
// and the PDF stays small), once per page load.
const FILE = `${import.meta.env.BASE_URL}receipt-background.jpg`;
const MAX_HEIGHT = 900; // pixels - plenty for a faded print
const OPACITY = 0.13;

let pending;

async function fetchBackground() {
  const response = await fetch(FILE, { cache: 'force-cache' });

  // A missing file can come back as the app's own HTML page (single-page-app fallback), so check the type.
  if (!response.ok || !(response.headers.get('content-type') || '').startsWith('image/')) {
    return null;
  }

  const bitmap = await createImageBitmap(await response.blob());
  const scale = Math.min(1, MAX_HEIGHT / bitmap.height);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  // 1) The picture on its own canvas, with its edges feathered to transparent so it melts into the paper
  //    instead of ending in a visible rectangle (two gradient masks multiply: left/right, then top/bottom).
  const art = document.createElement('canvas');
  art.width = width;
  art.height = height;
  const artContext = art.getContext('2d');
  artContext.drawImage(bitmap, 0, 0, width, height);
  artContext.globalCompositeOperation = 'destination-in';
  const feather = (gradient) => {
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.22, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.78, 'rgba(0,0,0,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    artContext.fillStyle = gradient;
    artContext.fillRect(0, 0, width, height);
  };
  feather(artContext.createLinearGradient(0, 0, width, 0));
  feather(artContext.createLinearGradient(0, 0, 0, height));

  // 2) Washed out onto white, so black text on top stays crisp and prints well.
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.globalAlpha = OPACITY;
  context.drawImage(art, 0, 0);

  return { dataUrl: canvas.toDataURL('image/jpeg', 0.82), width, height };
}

// Resolves to { dataUrl, width, height }, or null when there is no background picture.
export const loadReceiptBackground = () => {
  pending ??= fetchBackground().catch(() => null);
  return pending;
};
