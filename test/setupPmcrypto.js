import { init } from 'pmcrypto';

const openpgp = {
    config: { versionstring: { indexOf: () => 0 } },
    util: {
        str_to_Uint8Array(str) {
            const bytes = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) {
                bytes[i] = str.charCodeAt(i);
            }
            return bytes;
        },
        Uint8Array_to_str(arr) {
            const result = [];
            for (let i = 0; i < arr.length; i++) {
                result[i] = String.fromCharCode(arr[i]);
            }
            return result.join('');
        }
    },
    initWorker () {}
};

init(openpgp);
