import { ReactElement } from "react";
import styles from "./index.module.scss";

interface IProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function CheckBox({ value, onChange }: IProps): ReactElement {
  return (
    <div className={styles["checkbox-wrapper-5"]}>
      <div className={styles.check}>
        <input
          id='check-5'
          type='checkbox'
          defaultChecked={value}
          onChange={(e) => {
            onChange(e.target.checked);
          }}
        />
        <label htmlFor='check-5'></label>
      </div>
    </div>
  );
}
