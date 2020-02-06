import React from 'react';
import { c } from 'ttag';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import loadingSvgLight from 'design-system/assets/img/shared/loading-atom.svg';
import loadingSvgDark from 'design-system/assets/img/shared/loading-atom-dark.svg';
import loadingSmallerSvgLight from 'design-system/assets/img/shared/loading-atom-smaller.svg';
import loadingSmallerSvgDark from 'design-system/assets/img/shared/loading-atom-smaller-dark.svg';

const MEDIUM_WIDTH = '80';
const MEDIUM_HEIGHT = '80';

interface Props {
    size?: 'small' | 'medium' | 'big';
}

const Loader = ({ size = 'small' }: Props) => {
    const loadingSvg = getLightOrDark(loadingSvgLight, loadingSvgDark);
    const loadingSmallerSvg = getLightOrDark(loadingSmallerSvgLight, loadingSmallerSvgDark);
    const IMAGES = {
        small: loadingSmallerSvg,
        medium: loadingSvg,
        big: loadingSvg
    };

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
