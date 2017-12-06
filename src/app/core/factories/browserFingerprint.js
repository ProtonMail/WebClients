/* @ngInject */
function browserFingerprint() {
    function get() {
        return new Promise((resolve, reject) => {
            try {
                new window.Fingerprint2().get((fingerprint, components) => {
                    resolve({ fingerprint, components });
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    return { get };
}
export default browserFingerprint;
