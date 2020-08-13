import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { isURL } from 'proton-shared/lib/helpers/validators';
import Button from '../button/Button';
import { useMailSettings } from '../../hooks';

const RemoteImage = ({ src, text = c('Action').t`Load image`, ...rest }) => {
    const [{ ShowImages }, loading] = useMailSettings();
    const [showAnyways, setShowAnyways] = useState(!isURL(src));

    const handleClick = () => setShowAnyways(true);

    if ((!loading && ShowImages & SHOW_IMAGES.REMOTE) || showAnyways) {
        return <img src={src} referrerPolicy="no-referrer" {...rest} />;
    }
    return <Button onClick={handleClick}>{text}</Button>;
};

RemoteImage.propTypes = {
    src: PropTypes.string.isRequired,
    text: PropTypes.string,
};

export default RemoteImage;
