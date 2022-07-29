import svg from '@proton/styles/assets/img/icons/email-sprite-icons.svg';

import { locateHead } from '../../../helpers/message/messageHead';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { MESSAGE_IFRAME_PRINT_FOOTER_ID, MESSAGE_IFRAME_PRINT_HEADER_ID, MESSAGE_IFRAME_ROOT_ID } from '../constants';

import cssStyles from '../MessageIframe.raw.scss';

const getIframeHtml = (
    emailContent: string,
    message: MessageState,
    isPlainText: boolean,
    themeCSSVariables: string
) => {
    const messageHead = locateHead(message.messageDocument?.document) || '';

    const bodyStyles = message.messageDocument?.document?.querySelector('body')?.getAttribute('style');
    const bodyClasses = message.messageDocument?.document?.querySelector('body')?.getAttribute('class');

    /**
     * About this line:
     * <div style="width: 100% !important;padding-bottom:10px;!important">${emailContent}</div>
     * Padding bottom is needed for the scrollbar
     */
    // Plain text needs content needs to have no spaces in order to be correctly displayed
    if (isPlainText) {
        const emailHead = `<head><style>${themeCSSVariables}</style><style>${cssStyles}</style>${messageHead}</head>`;
        const emailBody = `<body><div id="${MESSAGE_IFRAME_ROOT_ID}" class="proton-plain-text"><div id="${MESSAGE_IFRAME_PRINT_HEADER_ID}"></div><div style="width: 100% !important;padding-bottom:10px;!important">${emailContent}</div><div id="${MESSAGE_IFRAME_PRINT_FOOTER_ID}"></div></div></body>`;

        return `<html>${emailHead}${emailBody}</html>`;
    }

    /**
     * Some infos about those `!important` values:
     * In order to compute correctly the height and avoid any kind of override
     * we had to put those inline style values with important on two divs.
     *
     * About this line:
     * <div style="width: 100% !important;padding-bottom:10px;!important">${emailContent}</div>
     * Padding bottom is needed for the scrollbar
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
          <div id="${MESSAGE_IFRAME_PRINT_HEADER_ID}"></div>
          <div style="display: flex !important; width: 100% !important;">
          <div style="width: 100% !important;padding-bottom:10px;!important">
            ${bodyStyles || bodyClasses ? `<div class="${bodyClasses}" style="${bodyStyles}">` : ''}
            ${emailContent}
            ${bodyStyles || bodyClasses ? '</div>' : ''}
          </div>
          </div>
          <div id="${MESSAGE_IFRAME_PRINT_FOOTER_ID}"></div>
        </div>
        </body>
      </html>
    `;
};

export default getIframeHtml;
