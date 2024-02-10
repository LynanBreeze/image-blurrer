import { encode, decode } from "blurhash";
import { imageToGradient } from "./image-to-gradient.js";

export const canvasSize = 32;

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
        max_size = maxWidth, // TODO : pull max size from a site config
        width = image.width,
        height = image.height;
      if (width > height) {
        if (width > max_size) {
          height *= max_size / width;
          width = max_size;
        }
      } else {
        if (height > max_size) {
          width *= max_size / height;
          height = max_size;
        }
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
  const image = await loadImage(imageUrl);
  const imageData = getImageData(image);
  return encode(imageData.data, imageData.width, imageData.height, 4, 3);
};

export const generateGradient = async (imageUrl) => {
  var options = {
    angle: 0, // gradient angle in degrees
    steps: 6, // number of steps
  };
  return new Promise((resolve) => {
    imageToGradient(imageUrl, options, function (err, cssGradient) {
      if (err) throw err;
      resolve(cssGradient);
    });
  });
};

export const decodeBlurhash = async (blurhash) => {
  const width = canvasSize;
  const height = canvasSize;
  const pixels = decode(blurhash, width, height);
  return pixels;
};

export const getImgContentType = async (src) => {
  let res = "";
  try {
    res = await fetch(src, { method: "HEAD" }).then((response) =>
      response.headers.get("Content-type")
    );
  } catch (error) {
    res = await fetch(src, { method: "GET" }).then((response) =>
      response.headers.get("Content-type")
    );
  }
  return res;
};
