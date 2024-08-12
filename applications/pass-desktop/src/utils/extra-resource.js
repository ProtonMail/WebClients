const { type } = require('os');

const getExtraResource = () => {
    switch (type()) {
        case 'Darwin':
            return ['./src/uninstallers/macos/uninstall.sh'];
        case 'Windows_NT':
            return ['./src/uninstallers/windows/uninstall.bat'];
        default:
            return [];
    }
};

module.exports = getExtraResource;
