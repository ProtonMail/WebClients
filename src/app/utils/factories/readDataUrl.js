/* @ngInject */
function readDataUrl() {
    return (url) => {
        if (url.substring(0, 5) !== 'data:') {
            return Promise.reject('The given url is not a data url.');
        }

        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';

            request.onload = () => {
                if (request.response) {
                    resolve(new Uint8Array(request.response));
                }
            };

            request.onerror = reject;

            request.send(null);
        });
    };
}
export default readDataUrl;
