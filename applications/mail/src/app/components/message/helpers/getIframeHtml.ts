import svg from '@proton/styles/assets/img/icons/email-sprite-icons.svg';
import { MESSAGE_IFRAME_ROOT_ID, MESSAGE_IFRAME_PRINT_ID } from '../constants';

import cssStyles from '../MessageIframe.raw.scss';

const getIframeHtml = (emailContent: string, messageHead = '', isPlainText: boolean, themeCSSVariables: string) => {
    // Plain text needs content needs to have no spaces in order to be correctly displayed
    if (isPlainText) {
        const emailHead = `<head><style>${themeCSSVariables}</style><style>${cssStyles}</style>${messageHead}</head>`;
        const emailBody = `<body><div id="${MESSAGE_IFRAME_ROOT_ID}" class="proton-plain-text"><div id="${MESSAGE_IFRAME_PRINT_ID}"></div>${emailContent}</div></body>`;

        return `<html>${emailHead}${emailBody}</html>`;
    }

    /**
     * Some infos about those `!important` values:
     * In order to compute correctly the height and avoid any kind of override
     * we had to put those inline style values with important on two divs.
     */
    return `
      <html>
        <head>
          <style>${themeCSSVariables}</style>
          <meta name="viewport" content="width=device-width">
          <style>${cssStyles}</style>
          ${messageHead}
        </head>
        <body>
        ${svg}
        <div id="${MESSAGE_IFRAME_ROOT_ID}">
          <div id="${MESSAGE_IFRAME_PRINT_ID}"></div>
          <div style="display: flex !important; width: 100% !important;">
            <div style="width: 100% !important">${emailContent}</div>
          </div>
        </div>
        </body>
      </html>
    `;
};

export default getIframeHtml;
