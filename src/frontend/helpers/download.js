import env from '@front/helpers/env';

export default {
    download(encodeURIContent, filename) {
        if (env.isPlugin()) {
            window.$PAPI.download(
              encodeURIContent,
              'Сохранение файла',
              'Выберите файл для сохранения',
              filename.split('.').slice(-1)[0]
            );
          } else {
            const link = document.createElement('a');
            document.body.appendChild(link);
            link.href = encodeURIContent;
            link.download = filename;
            link.click();
            setTimeout(() => document.body.removeChild(link), 50);
          }
    },
    downloadSVGAsPNG(svg, filename) {
        const svgImage = document.createElement('img');
        svgImage.style.position = 'fixed';
        svgImage.style.left = 0;
        svgImage.style.top = 0;
        svgImage.style.zIndex = '-999';
        svgImage.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = svgImage.naturalWidth;
          canvas.height = svgImage.naturalHeight;
          const canvasCtx = canvas.getContext('2d');
          canvasCtx.drawImage(svgImage, 0, 0);
          const imgData = canvas.toDataURL('image/png');
          document.body.removeChild(svgImage);
          this.download(imgData, filename || `${Date.now()}.png`);
        };
        document.body.appendChild(svgImage);
        const encode = window.btoa(unescape(encodeURIComponent(svg)));
        svgImage.src = `data:image/svg+xml;base64,${encode}`;
    },
    downloadSVG(svg, filename) {
        const encode = window.btoa(unescape(encodeURIComponent(svg)));
        this.download(`data:image/svg+xml;base64,${encode}`, filename  || `${Date.now()}.svg`);
    },
    downloadExcalidraw(json, filename) {
        const encode = window.btoa(unescape(encodeURIComponent(json)));
        this.download(`data:application/json;base64,${encode}`, filename  || `${Date.now()}.excalidraw`);
    }
};
