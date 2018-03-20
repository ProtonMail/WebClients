import { parseURL } from '../../../helpers/browser';

/* @ngInject */
function mailUtils(sanitize) {
    /**
     * Split an addresses string to a list of addresses
     * @param {String} emailsStr
     * @return {Array}
     */
    function toAddresses(emailsStr) {
        const emails = sanitize.input(emailsStr).split(',');
        return emails.map((Address) => ({ Address, Name: Address }));
    }

    /**
     * Parse a mailto string
     * @param {String} mailto Mailto string to parse
     * @return {Object} Object formated from mailto string
     */
    function mailtoParser(mailto) {
        if (mailto.toLowerCase().indexOf('mailto:') !== 0) {
            return;
        }

        event.preventDefault();

        let j = mailto.indexOf('?');

        // If no `?` detected
        if (j < 0) {
            j = mailto.length;
        }

        const to = sanitize.input(mailto.substring(7, j));
        const { searchObject = {} } = parseURL(mailto.replace(/&amp;/g, '&'));
        const message = {};

        if (to) {
            message.ToList = toAddresses(to);
        }

        if (searchObject.subject) {
            message.Subject = sanitize.input(searchObject.subject);
        }

        if (searchObject.cc) {
            message.CCList = toAddresses(searchObject.cc);
        }

        if (searchObject.bcc) {
            message.BCCList = toAddresses(searchObject.bcc);
        }

        if (searchObject.body) {
            message.DecryptedBody = sanitize.message(searchObject.body);
        }

        return message;
    }

    return { mailtoParser };
}
export default mailUtils;
