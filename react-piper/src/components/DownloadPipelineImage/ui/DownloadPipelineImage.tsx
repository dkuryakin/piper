import React, { ChangeEvent, FC } from "react";
import { toSvg } from "html-to-image";
import { message } from "../../../utils/toasts";
import style from "./DownloadPipelineImage.module.css";

function downloadImage(dataUrl: string, filename: string) {
  if (!filename) {
    message.error("Please enter a filename");
    return;
  }

  const a = document.createElement("a");

  a.setAttribute("download", `${filename}.svg`);
  a.setAttribute("href", dataUrl);
  a.click();
}

export const DownloadPipelineImage: FC = () => {
  const [filename, setFilename] = React.useState("");

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilename(e.target.value);
  };

  const onClick = () => {
    toSvg(document.querySelector(".react-flow") as HTMLElement, {
      filter: (node: HTMLElement) => {
        return !(
          node?.classList?.contains("react-flow__minimap") ||
          node?.classList?.contains("react-flow__controls")
        );
      },
    }).then((res: string) => downloadImage(res, filename));
  };

  return (
    <div className={style.downloadImage}>
      <input
        className="default-input"
        type="text"
        placeholder="Image name"
        value={filename}
        onChange={onChange}
      />
      <button className={`${style.button} default-button`} onClick={onClick}>
        Download Image
      </button>
    </div>
  );
};
