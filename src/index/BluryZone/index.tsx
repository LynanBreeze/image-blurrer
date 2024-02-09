import { ReactElement, useRef, useEffect } from "react";
import styles from "./index.module.scss";
import { decodeBlurhash, canvasSize } from "../../utils";
import { toast } from "sonner";
import copy from "copy-to-clipboard";
import { Image } from "../types";
import qs from "query-string";

interface IProps {
  image: Image;
  blurhash?: string;
  gradient?: string;
  glurData?: any;
  sizes: {
    width?: number;
    height?: number;
  };
}

export default function BluryZone({
  image,
  blurhash,
  gradient,
  glurData,
  sizes,
}: IProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(qs.parse(location.search).mode);

  const renderBlurhash = async (blurhash) => {
    const pixels = await decodeBlurhash(blurhash);
    const width = canvasSize;
    const height = canvasSize;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  };

  const renderGlur = async (glurData) => {
    const { imageData, width, height } = glurData;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(imageData, 0, 0);
  };

  useEffect(() => {
    if (blurhash) {
      renderBlurhash(blurhash);
    }
  }, [blurhash]);

  useEffect(() => {
    if (glurData) {
      renderGlur(glurData);
    }
  }, [glurData]);

  const copyBlurVariable = async (e) => {
    if (glurData) {
      return;
    }
    if (e.target.tagName === "A" || /output|base64/.test(e.target.className)) {
      return;
    }
    const bluryVar = blurhash || gradient || "";
    if (modeRef.current === "md") {
      if (blurhash && /\[|\]/.test(blurhash)) {
        await copy(
          `<img src="${image.originalUrl || ""}" data-placeholderimg="${
            blurhash ? "blurhash:" : ""
          }${bluryVar}" style="aspect-ratio: ${image.width}/${
            image.height
          }" alt="">`
        );
      } else {
        await copy(
          `![$placeholder=${
            blurhash ? "blurhash:" : ""
          }${bluryVar}=placeholder$aspect-ratio=${image.width}/${
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
      res.name = "blurhash";
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
    const base64 = canvasRef.current.toDataURL("image/jpeg");
    if (modeRef.current === "md") {
      if (blurhash && /\[|\]/.test(blurhash)) {
        await copy(
          `<img src="${image.originalUrl || ""}" data-placeholderimg="${
            blurhash ? "blurhash:" : ""
          }${base64}" style="aspect-ratio: ${image.width}/${
            image.height
          }" alt="">`
        );
      } else {
        await copy(
          `![$placeholder=${
            blurhash ? "blurhash:" : ""
          }${base64}=placeholder$aspect-ratio=${image.width}/${
            image.height
          }=aspect-ratio](${image.originalUrl || ""})`
        );
      }
    } else {
      await copy(base64);
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
          Copy Base64
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
            width={canvasSize}
            height={canvasSize}
            style={{
              display: gradient ? "none" : "block",
            }}
          ></canvas>
        </div>
      </div>
    </div>
  );
}
