/**
 * Compress an image file to a target max dimension and quality.
 * Returns a base64 string (without the data URI prefix).
 */
export function compressImage(file, maxDimension = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Scale down if needed
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height / width) * maxDimension);
            width = maxDimension;
          } else {
            width = Math.round((width / height) * maxDimension);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Get base64 (strip the data:image/...;base64, prefix)
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = dataUrl.split(",")[1];

        resolve({
          base64,
          mimeType: "image/jpeg",
          width,
          height,
          dataUrl,
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a data URL to a base64 string.
 */
export function dataUrlToBase64(dataUrl) {
  return dataUrl.split(",")[1];
}

/**
 * Create a preview URL from a file.
 */
export function createPreviewUrl(file) {
  return URL.createObjectURL(file);
}
