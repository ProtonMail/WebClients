import {
    MESSAGE_IFRAME_PRINT_CLASS,
    MESSAGE_IFRAME_PRINT_FOOTER_ID,
    MESSAGE_IFRAME_PRINT_HEADER_ID,
    MESSAGE_IFRAME_ROOT_ID,
} from '@proton/mail-renderer/constants';
import { locateHead } from '@proton/mail/helpers/locateHead';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';

import { transformBodyClasses } from './transforms/transformBodyClasses';

type Options = {
    emailContent: string;
    messageDocument: Required<MessageState>['messageDocument']['document'];
    isPlainText: boolean;
    themeCSSVariables: string;
    isPrint: boolean;
    iframeCSSStyles: string;
    iframeSVG: string;
};

const getIframeHtml = ({
    emailContent,
    messageDocument,
    isPlainText,
    themeCSSVariables,
    isPrint,
    iframeCSSStyles,
    iframeSVG,
}: Options) => {
    const messageHead = locateHead(messageDocument) || '';
    const bodyStyles = messageDocument?.querySelector('body')?.getAttribute('style');

    const bodyClassesRaw = messageDocument?.querySelector('body')?.getAttribute('class');
    const transformedBodyClasses = bodyClassesRaw ? transformBodyClasses(bodyClassesRaw) : null;

    /**
     * About this line:
     * <div style="width: 100% !important;padding-bottom:10px;!important">${emailContent}</div>
     * Padding bottom is needed for the scrollbar
     */
    // Plain text needs content needs to have no spaces in order to be correctly displayed
    if (isPlainText) {
        const emailHead = `<head><style>${themeCSSVariables}</style><style>${iframeCSSStyles}</style>${messageHead}</head>`;
        const emailBody = `<body><div id="${MESSAGE_IFRAME_ROOT_ID}" class="proton-plain-text ${
            isPrint ? MESSAGE_IFRAME_PRINT_CLASS : ''
        }">${
            isPrint ? `<div id="${MESSAGE_IFRAME_PRINT_HEADER_ID}"></div>` : ''
        }<div style="width: 100% !important;padding-bottom:10px;!important">${emailContent}</div>${
            isPrint ? `<div id="${MESSAGE_IFRAME_PRINT_FOOTER_ID}"></div>` : ''
        }</div></body>`;

        return `<html>${emailHead}${emailBody}</html>`;
    }

    let htmlContent = emailContent;

    if (transformedBodyClasses || bodyStyles) {
        const classAttr = transformedBodyClasses ? `class="${transformedBodyClasses.trim()}"` : '';
        const styleAttr = bodyStyles ? `style="${bodyStyles}"` : '';
        const attrs = [classAttr, styleAttr].filter(Boolean).join(' ');
        htmlContent = `<div ${attrs}>${emailContent}</div>`;
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
      <!DOCTYPE html>
      <html>
        <head>
          <style>${themeCSSVariables}</style>
          <meta name="viewport" content="width=device-width">
          <style>${iframeCSSStyles}</style>
          ${messageHead}
        </head>
        ${iframeSVG}
        <div id="${MESSAGE_IFRAME_ROOT_ID}" ${isPrint ? `class="${MESSAGE_IFRAME_PRINT_CLASS}"` : ''}>
          ${isPrint ? `<div id="${MESSAGE_IFRAME_PRINT_HEADER_ID}"></div>` : ''}
          <div ${
              isPrint ? 'class="proton-print-content reset4print"' : ''
          } style="display: block !important; width: 100% !important;">
          <div style="width: 100% !important;padding-bottom:10px;!important">
          ${htmlContent}
          </div>
          </div>
          ${isPrint ? `<div id="${MESSAGE_IFRAME_PRINT_FOOTER_ID}"></div>` : ''}
        </div>
        </body>
      </html>
    `;
};

export default getIframeHtml;
