import { ReactElement, useRef, useEffect, useState } from "react";
import styles from "./index.module.scss";
import {
  decodeBlurhash,
  getBase64Size,
  humanFileSize,
  loadImage,
  resize,
  getImageData,
} from "../../utils/index.js";
import { toast } from "sonner";
import copy from "copy-to-clipboard";
import { Image } from "../types.js";
import * as StackBlur from "../../../node_modules/stackblur-canvas/dist/stackblur-es.min.js";
import Slider from "rc-slider";
import glur from "glur";
import "rc-slider/assets/index.css";

interface IProps {
  image: Image;
  blurhash?: string;
  gradient?: string;
  sizes: {
    width?: number;
    height?: number;
  };
  isMarkdownMode: boolean;
  canvasWidth: number;
  isStackBlur?: boolean;
  isGlur?: boolean;
}

export default function BluryZone({
  image,
  blurhash,
  gradient,
  sizes,
  isMarkdownMode,
  canvasWidth,
  isStackBlur,
  isGlur,
}: IProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const base64 = useRef<string>("");
  const [base64Size, setBase64Size] = useState<string>("");
  const [stackBlurRadius, setStackBlurRadius] = useState<number>(1);

  // test output size
  // @ts-ignore
  const testFunc = async () => {
    let res = "";
    for (let i = 4; i <= 32; i += 2) {
      const resizedUrl = (await resize(image.url, {
        maxWidth: i,
        fillStyle: "rgba(255, 255, 255, 1)",
      })) as string;
      const img = (await loadImage(resizedUrl)) as HTMLImageElement;
      StackBlur.image(img, canvasRef.current, stackBlurRadius, false);
      const jpg = canvasRef.current.toDataURL("image/jpeg");
      const png = canvasRef.current.toDataURL("image/png");
      const bmp = await new Promise(async (resolve) => {
        const img1 = await (window as any).Jimp.read(resizedUrl);
        img1.getBase64Async("image/bmp").then((res) => {
          resolve(res);
        });
      });
      res += `| ${i}     | ${getBase64Size(jpg)} | ${getBase64Size(
        png
      )}    | ${getBase64Size(bmp)}  |\n`;
    }
    console.log(res);
  };

  const generateBase64 = (canvas): Promise<string> => {
    return new Promise(async (resolve) => {
      let targetType = "image/jpeg";
      if (canvasWidth <= 10) {
        targetType = "image/bmp";
      } else if (canvasWidth <= 22) {
        targetType = "image/png";
      }
      const base64string = canvas.toDataURL(targetType);
      if (targetType === "image/bmp") {
        // generate bmp imaeg for smaller size
        const img = await (window as any).Jimp.read(base64string);
        img.getBase64Async("image/bmp").then((res) => {
          resolve(res);
        });
      } else {
        resolve(base64string);
      }
    });
  };

  const renderBlurhash = async (blurhash) => {
    const pixels = await decodeBlurhash(blurhash, canvasWidth);
    const width = canvasWidth;
    const height = canvasWidth;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
    base64.current = await generateBase64(canvas);
    setBase64Size(getBase64Size(base64.current));
  };

  const renderStackBlur = async () => {
    console.time("renderStackBlur");
    const resizedUrl = (await resize(image.url, {
      maxWidth: canvasWidth,
      fillStyle: "rgba(255, 255, 255, 1)",
    })) as string;
    const img = (await loadImage(resizedUrl)) as HTMLImageElement;
    StackBlur.image(img, canvasRef.current, stackBlurRadius, false);
    console.timeEnd("renderStackBlur");
    base64.current = await generateBase64(canvasRef.current);
    setBase64Size(getBase64Size(base64.current));
    // testFunc()
    //   .then((res) => {})
    //   .catch((error) => {
    //     console.log(error);
    //   });
  };

  const renderGlur = async () => {
    console.time("renderGlur");
    const resizedUrl = (await resize(image.url, {
      maxWidth: canvasWidth,
      fillStyle: "rgba(255, 255, 255, 1)",
    })) as string;
    const img = (await loadImage(resizedUrl)) as HTMLImageElement;
    // StackBlur.image(img, canvasRef.current, stackBlurRadius, false);
    let imageData = getImageData(img);
    glur(imageData.data, img.width, img.height, stackBlurRadius);
    console.timeEnd("renderGlur");
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.putImageData(imageData, 0, 0);
    base64.current = await generateBase64(canvasRef.current);
    setBase64Size(getBase64Size(base64.current));
    // testFunc()
    //   .then((res) => {})
    //   .catch((error) => {
    //     console.log(error);
    //   });
  };

  useEffect(() => {
    if (blurhash) {
      renderBlurhash(blurhash);
    }
  }, [blurhash, canvasWidth]);

  useEffect(() => {
    if (isGlur && image) {
      renderGlur();
    }
  }, [image, isStackBlur, canvasWidth, stackBlurRadius]);

  useEffect(() => {
    setStackBlurRadius(1);
  }, [image]);

  useEffect(() => {
    if (isStackBlur && image) {
      renderStackBlur();
    }
  }, [image, isStackBlur, canvasWidth, stackBlurRadius]);

  const copyBlurVariable = async (e) => {
    if (
      e.target.tagName === "A" ||
      /output|base64|rc|blurRadius/.test(e.target.className)
    ) {
      return;
    }

    const bluryVar = `${blurhash ? "blurhash:" : ""}${
      blurhash || gradient || base64.current
    }`;
    if (isMarkdownMode) {
      if (/\[|\]/.test(bluryVar)) {
        await copy(
          `<img src="${
            image.originalUrl || ""
          }" data-placeholderimg="${bluryVar}" style="aspect-ratio: ${
            image.width
          }/${image.height}" alt="">`
        );
      } else {
        await copy(
          `![$placeholder=${bluryVar}=placeholder$aspect-ratio=${image.width}/${
            image.height
          }=aspect-ratio](${image.originalUrl || ""})`
        );
      }
    } else {
      await copy(bluryVar);
    }
    toast("Copied to Clipboard");
  };

  const getType = (): { name: string; link: string } => {
    const res = {
      name: "",
      link: "",
    };
    if (blurhash) {
      res.name = `blurhash(${humanFileSize(blurhash.length)})`;
      res.link = "https://blurha.sh/";
    } else if (gradient) {
      res.name = "gradient";
      res.link = "https://github.com/peterekepeter/image-to-gradient";
    } else if (isGlur) {
      res.name = "Gaussian Blur";
      res.link = "https://github.com/nodeca/glur";
    } else if (isStackBlur) {
      res.name = "Stack Blur";
      res.link = "https://github.com/flozz/StackBlur";
    }
    return res;
  };

  const copyBase64 = async () => {
    if (isMarkdownMode) {
      if (blurhash && /\[|\]/.test(blurhash)) {
        await copy(
          `<img src="${image.originalUrl || ""}" data-placeholderimg="${
            base64.current
          }" style="aspect-ratio: ${image.width}/${image.height}" alt="">`
        );
      } else {
        await copy(
          `![$placeholder=${base64.current}=placeholder$aspect-ratio=${
            image.width
          }/${image.height}=aspect-ratio](${image.originalUrl || ""})`
        );
      }
    } else {
      await copy(base64.current);
    }
    toast("Copied to Clipboard");
  };

  const currentType = getType();

  const outputString = blurhash || gradient;

  return (
    <div
      className={styles.bluryZone}
      style={{
        opacity: image && image.url ? 1 : 0,
        ...sizes,
      }}
      onClick={copyBlurVariable}
    >
      <a
        className={`${styles.type} ${
          isGlur || isStackBlur ? styles.onLeftTop : ""
        }`}
        href={currentType.link}
        target='_blank'
      >
        {currentType.name}
      </a>
      {(blurhash || isGlur || isStackBlur) && (
        <div
          className={`${styles.base64} ${isStackBlur ? styles.onLeft : ""}`}
          onClick={copyBase64}
        >
          {`Copy Base64(${base64Size})`}
        </div>
      )}
      {gradient && (
        <div className={styles.css}>
          {`Copy CSS(${humanFileSize(gradient.length)})`}
        </div>
      )}
      {!isGlur && outputString && (
        <div
          className={styles.output}
          contentEditable
          suppressContentEditableWarning
        >
          {outputString}
        </div>
      )}
      <div className={styles.after}>
        <div
          className={styles.bluryImg}
          style={{
            backgroundImage: gradient ? gradient : "",
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasWidth}
            style={{
              display: gradient ? "none" : "block",
            }}
          ></canvas>
          {(isStackBlur || isGlur) && (
            <div className={styles.blurRadius}>
              <Slider
                value={stackBlurRadius}
                min={1}
                max={Math.min(canvasWidth, isGlur ? 100 : 180)}
                marks={{ number: <span></span> }}
                onChange={(radius: number) => setStackBlurRadius(radius)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
