import React from 'react';
import {toSvg} from 'html-to-image';
import {message} from '../../utils/toasts';
import './index.scss';

function downloadImage(dataUrl, filename) {
  if (!filename) {
    message.error('Please enter a filename');
    return;
  }

  const a = document.createElement('a');

  a.setAttribute('download', `${filename}.svg`);
  a.setAttribute('href', dataUrl);
  a.click();
}

export const DownloadPipelineImage = () => {
  const [filename, setFilename] = React.useState('');

  const onChange = (e) => {
    setFilename(e.target.value);
  };

  const onClick = () => {
    toSvg(document.querySelector('.react-flow'), {
      filter: (node) => {
        return !(node?.classList?.contains('react-flow__minimap') ||
          node?.classList?.contains('react-flow__controls'));
      },
    }).then((res) => downloadImage(res, filename));
  };

  return (
    <div className="download-image__box">
      <input className="default-input" type="text" placeholder="Image name" value={filename} onChange={onChange}/>
      <button className="default-button" onClick={onClick}>
        Download Image
      </button>
    </div>
  );
};
