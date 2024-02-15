import { ReactElement, useRef, useEffect, useState } from "react";
import styles from "./index.module.scss";
import {
  decodeBlurhash,
  getBase64Size,
  humanFileSize,
} from "../../utils/index.js";
import { toast } from "sonner";
import copy from "copy-to-clipboard";
import { Image, GlurData } from "../types.js";

interface IProps {
  image: Image;
  blurhash?: string;
  gradient?: string;
  glurData?: GlurData;
  sizes: {
    width?: number;
    height?: number;
  };
  isMarkdownMode: boolean;
  canvasWidth: number;
}

export default function BluryZone({
  image,
  blurhash,
  gradient,
  glurData,
  sizes,
  isMarkdownMode,
  canvasWidth,
}: IProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const base64 = useRef<string>("");
  const [base64Size, setBase64Size] = useState<string>("");

  const generateBase64 = (canvas): Promise<string> => {
    return new Promise(async (resolve) => {
      let targetType = "image/jpeg";
      if (glurData && /png|svg/.test(image.type)) {
        targetType = "image/png";
      } else if (blurhash) {
        targetType = canvasWidth <= 12 ? "image/bmp" : "image/jpeg";
      }
      const base64string = canvas.toDataURL(targetType);
      if (canvasWidth > 16) {
        resolve(base64string);
      } else {
        // generate bmp imaeg for smaller size
        const img = await (window as any).Jimp.read(base64string);
        img.getBase64Async("image/bmp").then((res) => {
          resolve(res);
        });
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

  const renderGlur = async (glurData) => {
    const { imageData, width, height } = glurData;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(imageData, 0, 0);
    base64.current = await generateBase64(canvas);
    setBase64Size(getBase64Size(base64.current));
  };

  useEffect(() => {
    if (blurhash) {
      renderBlurhash(blurhash);
    }
  }, [blurhash, canvasWidth]);

  useEffect(() => {
    if (glurData) {
      renderGlur(glurData);
    }
  }, [glurData]);

  const copyBlurVariable = async (e) => {
    if (e.target.tagName === "A" || /output|base64/.test(e.target.className)) {
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
    } else if (glurData) {
      res.name = "Gaussian Blur";
      res.link = "https://github.com/nodeca/glur";
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
        className={`${styles.type} ${glurData ? styles.isGlur : ""}`}
        href={currentType.link}
        target='_blank'
      >
        {currentType.name}
      </a>
      {(blurhash || glurData) && (
        <div className={styles.base64} onClick={copyBase64}>
          {`Copy Base64(${base64Size})`}
        </div>
      )}
      {gradient && (
        <div className={styles.css}>
          {`Copy CSS(${humanFileSize(gradient.length)})`}
        </div>
      )}
      {!glurData && (
        <div
          className={styles.output}
          contentEditable
          suppressContentEditableWarning
        >
          {blurhash || gradient || ""}
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
        </div>
      </div>
    </div>
  );
}
