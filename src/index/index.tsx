import { ReactElement, useState } from "react";
import styles from "./index.module.scss";
import FileDrop from "./FileDrop";
import BluryZone from "./BluryZone";
import {
  resize,
  encodeImageToBlurhash,
  generateGradient,
  loadImage,
  getImageData,
} from "../utils";
import { Toaster, toast } from "sonner";
import { Image } from "./types";
import glur from "glur";

export default function Index(): ReactElement {
  const [blurhash, setBlurhash] = useState<string>("");
  const [gradient, setGradient] = useState<string>("");
  const [image, setImage] = useState<Image | null>(null);
  const [glurData, setGlurData] = useState<any>("");

  const getBlurHash = async (url) => {
    const hash = await encodeImageToBlurhash(url);
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
    const resizedUrl = (await resize(url, 32)) as string;
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
    try {
      const resizedUrl = (await resize(url)) as string;
      const previewUrl = (await resize(url, 800)) as string;
      getBlurHash(resizedUrl);
      getGradient(resizedUrl);
      const img = (await loadImage(url)) as HTMLImageElement;
      const imgObj = {
        width: img.width,
        height: img.height,
        url: resizedUrl,
        previewUrl,
        originalUrl: /blob/.test(url) ? "" : url,
      };
      setImage(imgObj);
      generateGlur(url);
    } catch (error) {
      toast(error.message);
    }
  };

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
        <div className={styles.content}>
          <FileDrop onChange={onFileChange} image={image} />
          <a
            href='https://github.com/lynanBreeze'
            target='_blank'
            className={styles.github}
          ></a>
          <div className={styles.row}>
            <div>
              {image && (
                <>
                  <img
                    className={styles.originalImg}
                    src={image.previewUrl}
                    style={{
                      ...sizes,
                    }}
                  />
                </>
              )}
            </div>
            <BluryZone
              image={image}
              glurData={glurData}
              sizes={sizes}
            ></BluryZone>
          </div>
          <div className={styles.row}>
            <BluryZone
              image={image}
              blurhash={blurhash}
              sizes={sizes}
            ></BluryZone>
            <BluryZone
              image={image}
              gradient={gradient}
              sizes={sizes}
            ></BluryZone>
          </div>
        </div>
      </div>
    </>
  );
}
