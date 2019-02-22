import saveAs from 'file-saver';

import { isFileSaverSupported } from './browser';

const downloadFile = (blob, filename) => {
    if (!isFileSaverSupported()) {
        throw new Error('Download requires a newer browser.');
    }

    saveAs(blob, filename);
};

export default downloadFile;
