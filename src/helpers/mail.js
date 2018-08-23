import { toList } from './arrayHelper';
// TODO migrate to import instead of window variable.
const { MailParser } = pmcrypto;

/**
 * Parse a mail into an object format, splitting, headers, html, text/plain and attachments. The result is defined
 * by the MailParser. This function wraps the mailparser to make it a promise.
 * @param data
 * @return {Promise}
 */
export const parseMail = (data) => {
    return new Promise((resolve) => {
        const mailparser = new MailParser({ defaultCharset: 'UTF-8' });
        mailparser.on('end', resolve);
        mailparser.write(data);
        mailparser.end();
    });
};

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
    const body = mail.substring(headersEnd).trimLeft();
    return { headers, body };
};
