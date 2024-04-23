// TODO: drop pmcrypto import, see https://jira.protontech.ch/projects/CRYPTO/issues/CRYPTO-101
// eslint-disable-next-line no-restricted-imports
import { parseMail } from 'pmcrypto-v6-canary/lib/message/parseMail';

/**
 * Overwrites the headers in baseHeader by the headers defined in extraHeaders.
 */
export const combineHeaders = async (baseHeader: string, extraHeaders: string) => {
    const { headers: parsedExtras } = await parseMail(extraHeaders);
    const extraHeaderKeys = Object.keys(parsedExtras);
    return extraHeaderKeys.reduce((inputHeader, key) => {
        const capsKey = key.replace(/(^|-)./g, (letter) => letter.toUpperCase());
        const values = parsedExtras[key];
        const headerLine = values.map((val) => `${capsKey}: ${val}`).join('\r\n');
        const outputHeader = inputHeader.replace(new RegExp(`^${key}:.*(?=$[^ ])`, 'im'), headerLine);
        if (outputHeader.indexOf(capsKey) === -1) {
            return `${inputHeader + headerLine}\r\n`;
        }
        return outputHeader;
    }, baseHeader);
};

/**
 * Splits the mail into header and body.
 */
export const splitMail = (mail: string) => {
    // double new line separates message body and the headers
    const headersEnd = mail.search(/\r?\n\r?\n/);
    if (headersEnd === -1) {
        return { headers: mail, body: '' };
    }
    const headers = mail.substring(0, headersEnd);
    // remove leading newlines
    const body = mail.substring(headersEnd).trimStart();
    return { headers, body };
};
