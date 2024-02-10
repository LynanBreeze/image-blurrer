import { ReactElement, useState, InputEvent } from "react";
import styles from "./index.module.scss";
import FileDrop from "./FileDrop";
import BluryZone from "./BluryZone";
import {
  resize,
  encodeImageToBlurhash,
  generateGradient,
  loadImage,
  getImageData,
  getImgContentType,
  defaultCanvasWidth,
} from "../utils";
import { Toaster, toast } from "sonner";
import { Image } from "./types";
import glur from "glur";
import CheckBox from "./CheckBox";
import { useUpdateEffect } from "ahooks";
import queryString from "query-string";

const previewImageWidth = 500;
const initialCanvasWidth = queryString.parse(location.search).canvasWidth;
const initialIsMarkdownMode = queryString.parse(location.search).mode === "md";

export default function Index(): ReactElement {
  const [blurhash, setBlurhash] = useState<string>("");
  const [gradient, setGradient] = useState<string>("");
  const [image, setImage] = useState<Image | null>(null);
  const [glurData, setGlurData] = useState<any>("");
  const [canvasWidth, setCanvasWidth] = useState<number>(
    initialCanvasWidth ? Number(initialCanvasWidth) : defaultCanvasWidth
  );
  const [isMarkdownMode, setIsMarkdownMode] = useState<boolean>(
    initialIsMarkdownMode
  );

  useUpdateEffect(() => {
    const newLocation = new URL(location.href);
    const query = queryString.parse(newLocation.search);
    if (isMarkdownMode) {
      query.mode = "md";
    } else {
      delete query.mode;
    }
    newLocation.search = `?${queryString.stringify(query)}`;
    history.replaceState(null, "", newLocation.href);
  }, [isMarkdownMode]);

  useUpdateEffect(() => {
    const newLocation = new URL(location.href);
    const query = queryString.parse(newLocation.search);
    if (canvasWidth) {
      query.canvasWidth = `${canvasWidth}`;
    }
    newLocation.search = `?${queryString.stringify(query)}`;
    history.replaceState(null, "", newLocation.href);
  }, [canvasWidth]);

  const getBlurHash = async (url) => {
    const resizedUrl = (await resize(url, {
      fillStyle: "rgba(255, 255, 255, 1)",
    })) as string;
    const hash = await encodeImageToBlurhash(resizedUrl);
    setBlurhash(hash);
  };

  const getGradient = async (url) => {
    const gradientString = (await generateGradient(url)) as string;
    setGradient(gradientString);
  };

  const onFileDrop = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const file = Array.prototype.find.call(e.dataTransfer.files, (items) =>
      items.type.startsWith("image")
    );
    if (file) {
      const url = URL.createObjectURL(file);
      onFileChange(url);
      (document.getElementById("fileURLInput") as HTMLInputElement).value = "";
    }
  };

  const generateGlur = async (url) => {
    const resizedUrl = (await resize(url, {
      maxWidth: canvasWidth,
    })) as string;
    const img = (await loadImage(resizedUrl)) as HTMLImageElement;
    let imageData = getImageData(img);
    glur(imageData.data, img.width, img.height, img.width / 10);
    setGlurData({
      imageData,
      width: img.width,
      height: img.height,
    });
  };

  const onFileChange = async (url) => {
    const loadingToastId = toast.loading("loading image");
    const task = async (retry?: boolean) => {
      const loadUrl = retry
        ? `https://cors-image-proxy.lynanbreeze.workers.dev/${url}`
        : url;
      const img = (await loadImage(loadUrl)) as HTMLImageElement;
      const resizedUrl = (await resize(loadUrl, {
        maxWidth: previewImageWidth,
      })) as string;
      const type = await getImgContentType(loadUrl);
      getBlurHash(loadUrl);
      getGradient(resizedUrl);
      const imgObj = {
        width: img.width,
        height: img.height,
        type,
        url: resizedUrl,
        originalUrl: /blob/.test(url) ? "" : url,
      };
      setImage(imgObj);
      generateGlur(resizedUrl);
    };
    try {
      await task();
      toast.dismiss(loadingToastId);
    } catch (error) {
      toast.dismiss(loadingToastId);
      const errorToastId = toast(
        error.message || "error loading image, retry once now..."
      );
      await task(true);
      toast.dismiss(errorToastId);
    }
  };

  const onCanvasWidthChange = () => {
    if (!image) return;
    if (!canvasWidth) return;
    onFileChange(image.url);
  };

  useUpdateEffect(() => {
    onCanvasWidthChange();
  }, [canvasWidth]);

  const calculateSize = (image) => {
    const baseWidth = 400;
    const baseHeight = 300;
    const ratio = image ? image.height / image.width : 0;
    if (image) {
      if (image.width >= image.height) {
        const calcHeight = baseWidth * ratio;

        return {
          width: calcHeight > baseHeight ? baseHeight / ratio : baseWidth,
          height: calcHeight > baseHeight ? baseHeight : calcHeight,
        };
      } else {
        return {
          width: baseHeight / ratio,
          height: baseHeight,
        };
      }
    }
    return {};
  };

  const sizes = calculateSize(image);

  return (
    <>
      <Toaster closeButton />
      <div
        className={styles.bg}
        onDrop={onFileDrop}
        onDragOver={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <div className={styles.settings}>
          <span className={styles.label}>Markdown Mode:</span>
          <CheckBox
            value={isMarkdownMode}
            onChange={setIsMarkdownMode}
          ></CheckBox>
          <div>
            <span className={styles.label}>Canvas Width:</span>
            <input
              type='text'
              className={styles.canvasWidthInput}
              defaultValue={canvasWidth}
              pattern='[0-9]+'
              onKeyUp={(e: InputEvent<HTMLInputElement>) => {
                if (e.code === "Enter") {
                  const newCanvasWidth = Number(e.target.value);
                  if (newCanvasWidth <= 0 || newCanvasWidth > 1024) {
                    e.target.value = canvasWidth;
                    return toast.warning("Canvas width should with 1 ~ 1024");
                  } else {
                    setCanvasWidth(Number(e.target.value));
                  }
                }
              }}
            />
          </div>
        </div>
        <div className={`${styles.content} ${image ? styles.hasImg : ""}`}>
          <FileDrop onChange={onFileChange} image={image} />
          <a
            href='https://github.com/lynanBreeze'
            target='_blank'
            className={styles.github}
          ></a>
          <div className={styles.row}>
            <div className={styles.itemWrap}>
              {image && (
                <>
                  <img
                    className={styles.originalImg}
                    src={image.url}
                    style={{
                      ...sizes,
                    }}
                  />
                  <div className={styles.tag}>Original</div>
                </>
              )}
            </div>
            <div className={styles.itemWrap}>
              <BluryZone
                image={image}
                glurData={glurData}
                sizes={sizes}
                isMarkdownMode={isMarkdownMode}
                canvasWidth={canvasWidth}
              ></BluryZone>
              <div className={styles.tag}>Best Shape</div>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.itemWrap}>
              <BluryZone
                image={image}
                blurhash={blurhash}
                sizes={sizes}
                isMarkdownMode={isMarkdownMode}
                canvasWidth={canvasWidth}
              ></BluryZone>
              <div className={styles.tag}>Smallest Size</div>
            </div>
            <div className={styles.itemWrap}>
              <div className={styles.tag}>Fastest Rendering</div>
              <BluryZone
                image={image}
                gradient={gradient}
                sizes={sizes}
                isMarkdownMode={isMarkdownMode}
                canvasWidth={canvasWidth}
              ></BluryZone>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
