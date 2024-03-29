import {
  ReactElement,
  ChangeEvent,
  KeyboardEvent,
  useRef,
  useEffect,
} from "react";
import styles from "./index.module.scss";
import { Image } from "../types";

interface IProps {
  onChange: (url: string) => void;
  image: Image;
}

export default function FileDrop({ onChange, image }: IProps): ReactElement {
  const blobURL = useRef<string>("");
  const fileURLInput = useRef<HTMLInputElement>(null);

  const onKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.code !== "Enter") return;
    const fileURL = (e.target as HTMLInputElement).value;
    onChange(fileURL);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const currentFile = e.target.files[0];
    fileURLInput.current.value = "";
    if (!currentFile) return;
    if (blobURL.current) {
      URL.revokeObjectURL(blobURL.current);
    }
    blobURL.current = URL.createObjectURL(currentFile);
    onChange(blobURL.current);
  };

  const onPaste = async (event) => {
    if (event.target.tagName === "INPUT") return;
    var items = event.clipboardData && event.clipboardData.items;
    var file = null;
    if (items && items.length) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          file = items[i].getAsFile();
          break;
        }
      }
    }
    blobURL.current = URL.createObjectURL(file);
    onChange(blobURL.current);
    fileURLInput.current.value = "";
  };

  useEffect(() => {
    document.addEventListener("paste", onPaste);
  }, []);

  return (
    <div className={`${styles.fileDrop} ${image ? styles.hasImage : ""}`}>
      <div
        className={styles.icon}
        style={{
          backgroundImage: image ? `url(${image.url})` : "",
        }}
      >
        {!image && (
          <svg viewBox='0 0 1024 1024' width='200' height='200'>
            <path
              d='M420.384 64.672H974.4c24.288 0 46.176 21.952 46.176 49.44v733.152c0 27.456-19.424 49.44-46.176 49.44H46.176C21.856 896.672 0 874.72 0 847.264V114.112c0-27.456 19.424-49.44 46.176-49.44h374.208z'
              fill='#FFFFFF'
            ></path>
            <path
              d='M974.4 81.312H46.176C21.856 81.312 0 103.296 0 130.752v733.152c0 27.456 19.424 49.44 46.176 49.44h930.688c24.288 0 46.176-21.952 46.176-49.44V130.752c-2.464-27.456-21.888-49.44-48.64-49.44'
              fill='#74B3F8'
            ></path>
            <path
              d='M1020.48 890.592c0 13.632-15.392 22.72-35.904 22.72H35.904c-20.512 0-35.904-11.36-35.904-22.72v-88.608s117.952-177.216 205.12-172.672c41.024 2.272 184.608 93.152 287.168 93.152s148.704-193.152 287.168-193.152c74.368 0 243.584 118.144 243.584 118.144v243.136h-2.56z'
              fill='#BBDFFF'
            ></path>
            <path
              d='M279.296 479.04c-33.152 0-60.288-12.096-81.408-33.312-21.088-21.184-33.152-51.456-30.144-78.688 0-60.544 51.264-112 111.552-112 33.152 0 60.288 12.096 81.408 33.312 21.088 21.184 33.152 51.456 30.144 78.688 0 63.584-51.264 112-111.552 112'
              fill='#FFFFFF'
            ></path>
          </svg>
        )}
      </div>
      <div className={styles.tipText}>Choose/Drop/Paste an Image File</div>
      <input
        id='fileURLInput'
        ref={fileURLInput}
        className={styles.fileURL}
        placeholder='Or Input Image URL in Here'
        onKeyUp={onKeyUp}
      />
      <input
        className={styles.fileInput}
        type='file'
        accept='image/*'
        onChange={onFileChange}
      />
    </div>
  );
}
