import { BASE_SIZE } from '../../constants';

/* @ngInject */
function bytes(gettextCatalog) {
    const KB = BASE_SIZE;
    return (bytes, precision = 1) => {
        const i18n = gettextCatalog.getPlural(bytes, 'byte', 'bytes', {}, 'Size of a file');
        const UNITS = [i18n, 'KB', 'MB', 'GB', 'TB', 'PB'];

        if (isNaN(parseFloat(bytes)) || !isFinite(bytes) || bytes === 0) {
            return '-';
        }
        const number = Math.floor(Math.log(bytes) / Math.log(KB));
        const digits = number === 0 ? 0 : precision;
        const value = (bytes / KB ** Math.floor(number)).toFixed(digits);
        return `${value} ${UNITS[number]}`;
    };
}
export default bytes;
