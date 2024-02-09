import { ReactElement, useState } from "react";
import styles from "./index.module.scss";
import FileDrop from "./FileDrop";
import BluryZone from "./BluryZone";
import {
  resize,
  encodeImageToBlurhash,
  generateGradient,
  loadImage,
} from "../utils";
import { Toaster, toast } from "sonner";
import { Image } from "./types";

export default function Index(): ReactElement {
  const [blurhash, setBlurhash] = useState<string>("");
  const [gradient, setGradient] = useState<string>("");
  const [image, setImage] = useState<Image | null>(null);

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

  const onFileChange = async (url) => {
    try {
      const resizedUrl = (await resize(url)) as string;
      getBlurHash(resizedUrl);
      getGradient(resizedUrl);
      const image = (await loadImage(url)) as HTMLImageElement;
      setImage({
        width: image.width,
        height: image.height,
        url: resizedUrl,
        originalUrl: /blob/.test(url) ? "" : url,
      });
    } catch (error) {
      toast(error.message);
    }
  };

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
            {image && (
              <>
                <div className={styles.arrow}></div>
                <img className={styles.originalImg} src={image.url} />
                <div className={styles.arrow}></div>
              </>
            )}
          </div>
          <div className={styles.row}>
            <BluryZone image={image} blurhash={blurhash}></BluryZone>

            <BluryZone image={image} gradient={gradient}></BluryZone>
          </div>
        </div>
      </div>
    </>
  );
}
