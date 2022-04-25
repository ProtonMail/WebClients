import PropTypes from 'prop-types';
import windowsSvg from '@proton/styles/assets/img/os-icons/windows.svg';
import iosSvg from '@proton/styles/assets/img/os-icons/iOS.svg';
import linuxSvg from '@proton/styles/assets/img/os-icons/linux.svg';
import androidSvg from '@proton/styles/assets/img/os-icons/android.svg';
import macosSvg from '@proton/styles/assets/img/os-icons/macOS.svg';

const OSIcon = ({ os }) => {
    const src = {
        windows: windowsSvg,
        ios: iosSvg,
        linux: linuxSvg,
        android: androidSvg,
        macos: macosSvg,
    };
    return <img src={src[os]} width={20} className="ml0-25" />;
};

OSIcon.propTypes = {
    os: PropTypes.string,
};

export default OSIcon;
