import React from 'react';
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

interface Props {
    size: 'small' | 'medium' | 'big';
}

const Loader = ({ size = 'small' }: Props) => {
    return (
        <div className="center flex mb2 mt2">
            <img
                className="mauto"
                src={IMAGES[size]}
                width={size === 'medium' ? MEDIUM_WIDTH : undefined}
                height={size === 'medium' ? MEDIUM_HEIGHT : undefined}
                alt={c('Info').t`Loading`}
            />
        </div>
    );
};

export default Loader;
