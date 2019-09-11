import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import loadingSvg from 'design-system/assets/img/shared/loading-atom.svg';
import loadingSmallerSvg from 'design-system/assets/img/shared/loading-atom-smaller.svg';

const IMAGES = {
    small: loadingSmallerSvg,
    medium: loadingSvg,
    big: loadingSvg
};

const MEDIUM_WIDTH = '80';
const MEDIUM_HEIGHT = '80';

const Loader = ({ size = 'small' }) => {
    return (
        <div className="center mb2 mt2">
            <img
                src={IMAGES[size]}
                width={size === 'medium' && MEDIUM_WIDTH}
                height={size === 'medium' && MEDIUM_HEIGHT}
                alt={c('Info').t`Loading`}
            />
        </div>
    );
};

Loader.propTypes = {
    size: PropTypes.oneOf(['small', 'medium', 'big'])
};

export default Loader;
