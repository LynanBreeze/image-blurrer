import { encode, decode } from "blurhash";
import { imageToGradient } from "./image-to-gradient.js";

export const defaultCanvasWidth = 24;

export const resize = (
  url: string,
  options?: { maxWidth?: number; type?: string; fillStyle?: string }
) => {
  const { maxWidth = 300, fillStyle } = options || {};
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "";
    image.onload = () => {
      let canvas = document.createElement("canvas"),
        max_size = maxWidth,
        width = image.width,
        height = image.height;
      if (width > maxWidth || height > maxWidth) {
        height *= max_size / width;
        width = max_size;
      }
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (fillStyle) {
        context.fillStyle = fillStyle;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/png");
      resolve(dataUrl);
    };
    image.onerror = (e) => reject(e);
    image.src = url;
  });
};

export const loadImage = async (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });

export const getImageData = (image) => {
  const canvas = document.createElement("canvas");
  const width = image.width;
  const height = image.height;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, width, height);
};

export const encodeImageToBlurhash = async (imageUrl) => {
  console.time("generateBlurhash");
  const image = await loadImage(imageUrl);
  const imageData = getImageData(image);
  const res = encode(imageData.data, imageData.width, imageData.height, 4, 4);
  console.timeEnd("generateBlurhash");

  return res;
};

export const generateGradient = async (imageUrl) => {
  console.time("generateGradient");
  var options = {
    angle: 0, // gradient angle in degrees
    steps: 6, // number of steps
  };
  return new Promise((resolve) => {
    imageToGradient(imageUrl, options, function (err, cssGradient) {
      if (err) throw err;
      console.timeEnd("generateGradient");
      resolve(cssGradient);
    });
  });
};

export const decodeBlurhash = async (blurhash, canvasWidth) => {
  const width = canvasWidth;
  const height = canvasWidth;
  const pixels = decode(blurhash, width, height);
  return pixels;
};

export const getImgContentType = async (src) => {
  let res = "";
  try {
    res = await fetch(src, { method: /blob/.test(src) ? "GET" : "HEAD" }).then(
      (response) => response.headers.get("Content-type")
    );
  } catch (error) {
    res = await fetch(src, { method: "GET" }).then((response) =>
      response.headers.get("Content-type")
    );
  }
  return res;
};

export const getBase64Size = (base64String) => {
  const bodyString = base64String.split(",")[1];
  return humanFileSize(Math.round((bodyString.length * 3) / 4));
};

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
export function humanFileSize(bytes, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
}

export const downloadBase64File = (contentBase64, fileName) => {
  const linkSource = `${contentBase64}`;
  const downloadLink = document.createElement("a");
  document.body.appendChild(downloadLink);

  downloadLink.href = linkSource;
  downloadLink.target = "_self";
  downloadLink.download = fileName;
  downloadLink.click();
};
