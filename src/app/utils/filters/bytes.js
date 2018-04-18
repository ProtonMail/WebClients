import { BASE_SIZE } from '../../constants';

/* @ngInject */
function bytes() {
    const KB = BASE_SIZE;
    const UNITS = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    return (bytes, precision = 1) => {
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
