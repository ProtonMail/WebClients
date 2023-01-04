import * as exports from '../../lib/window';

const initialWindow = window;
const initialWindowLocation: Location = initialWindow.location;
const initialExports = exports.default;

export const mockWindowLocation = (origin = 'https://mail.proton.pink', hostname = 'mail.proton.pink') => {
    Object.defineProperty(exports, 'default', {
        writable: true,
        value: {
            location: { ...initialWindowLocation, hostname, origin, port: '' },
            parent: { ...initialWindow.parent },
        },
    });
};

export const resetWindowLocation = () => {
    Object.defineProperty(exports, 'default', {
        writable: false,
        value: initialExports,
    });
};
