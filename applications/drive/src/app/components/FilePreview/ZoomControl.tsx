import React from 'react';
import { Icon, classnames } from 'react-components';
import { c } from 'ttag';

interface Props {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
}

const ZoomControl = ({ scale, onZoomIn, onZoomOut, onReset }: Props) => {
    const isZoomOutDisabled = scale <= 0.005;
    const isZoomInDisabled = scale >= 10;

    return (
        <div className="w100 p2 flex">
            <div className="center flex flex-items-center">
                <button
                    disabled={isZoomOutDisabled}
                    onClick={onZoomOut}
                    title={c('Action').t`Zoom out`}
                    className={classnames(['flex p0-5 color-white', isZoomOutDisabled && 'opacity-50'])}
                >
                    <Icon name="minus" size={12} />
                </button>
                <button title={c('Action').t`Reset zoom`} className="color-white ml0-5 mr0-5" onClick={onReset}>
                    <span>{Math.round(scale * 100)}%</span>
                </button>
                <button
                    disabled={isZoomInDisabled}
                    onClick={onZoomIn}
                    title={c('Action').t`Zoom in`}
                    className={classnames(['flex p0-5 color-white', isZoomInDisabled && 'opacity-50'])}
                >
                    <Icon name="plus" size={12} />
                </button>
            </div>
        </div>
    );
};

export default ZoomControl;
