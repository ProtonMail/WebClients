/**
 * Opens a window to login to a non-private member.
 * @param {String} UID
 * @param {String} mailboxPassword - The admin mailbox password
 * @param {String} url - Absolute URL path
 * @param {Number} [timeout]
 * @return {Promise}
 */
export default ({ UID, mailboxPassword, url: urlString, timeout = 20000 }) => {
    return new Promise((resolve, reject) => {
        const url = new URL(urlString);
        const child = window.open(`${url}`, '_blank');

        const receive = ({ origin, data, source }) => {
            if (origin !== url.origin || source !== child) {
                return;
            }
            if (data === 'ready') {
                child.postMessage({ UID, mailboxPassword }, url.origin);
                window.removeEventListener('message', receive);
                resolve();
            }
        };

        window.addEventListener('message', receive, false);

        setTimeout(() => {
            window.removeEventListener('message', receive);
            reject();
        }, timeout);
    });
};
