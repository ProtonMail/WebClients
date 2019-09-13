import _ from 'lodash';
import { parseMail } from 'pmcrypto';

import { toList } from './arrayHelper';

/**
 * Overwrites the headers in baseHeader by the headers defined in extraHeaders.
 * @param {String} baseHeader
 * @param {String} extraHeaders
 * @return {Promise.<*>}
 */
export const combineHeaders = async (baseHeader, extraHeaders) => {
    const { headers: parsedExtras } = await parseMail(extraHeaders);
    const extraHeaderKeys = Object.keys(parsedExtras);
    return extraHeaderKeys.reduce((inputHeader, key) => {
        const capsKey = key.replace(/(^|-)./g, (letter) => letter.toUpperCase());
        const values = toList(parsedExtras[key]);
        const headerLine = values.map((val) => `${capsKey}: ${val}`).join('\r\n');
        const outputHeader = inputHeader.replace(new RegExp('^' + key + ':.*(?=$[^ ])', 'im'), headerLine);
        if (outputHeader.indexOf(capsKey) === -1) {
            return inputHeader + headerLine + '\r\n';
        }
        return outputHeader;
    }, baseHeader);
};

/**
 * Splits the mail into header and body.
 * @param {String} mail
 * @return {{headers: (String), body: (String)}}
 */
export const splitMail = (mail) => {
    // double new line separates message body and the headers
    const headersEnd = mail.search(/\r?\n\r?\n/);
    if (headersEnd === -1) {
        return { headers: mail, body: '' };
    }
    const headers = mail.substring(0, headersEnd);
    // remove leading newlines
    const body = _.trimStart(mail.substring(headersEnd));
    return { headers, body };
};
