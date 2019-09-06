import React from 'react';
import PropTypes from 'prop-types';
import windowsSvg from 'design-system/assets/img/pm-images/windows.svg';
import iosSvg from 'design-system/assets/img/pm-images/iOS.svg';
import linuxSvg from 'design-system/assets/img/pm-images/linux.svg';
import androidSvg from 'design-system/assets/img/pm-images/android.svg';
import macosSvg from 'design-system/assets/img/pm-images/macOS.svg';

const OSIcon = ({ os }) => {
    const src = {
        windows: windowsSvg,
        ios: iosSvg,
        linux: linuxSvg,
        android: androidSvg,
        macos: macosSvg
    };
    return <img src={src[os]} width={20} className="ml0-25" />;
};

OSIcon.propTypes = {
    os: PropTypes.string
};

export default OSIcon;
