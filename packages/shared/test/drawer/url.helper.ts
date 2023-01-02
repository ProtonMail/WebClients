import * as exports from '../../lib/window';

const initialWindowLocation: Location = window.location;
const initialExports = exports.default;

export const mockWindowLocation = (origin = 'https://mail.proton.pink', hostname = 'mail.proton.pink') => {
    Object.defineProperty(exports, 'default', {
        writable: true,
        value: { location: { ...initialWindowLocation, hostname, origin } },
    });
};

export const resetWindowLocation = () => {
    Object.defineProperty(exports, 'default', {
        writable: false,
        value: initialExports,
    });
};
