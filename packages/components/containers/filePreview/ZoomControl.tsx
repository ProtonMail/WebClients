import React from 'react';
import { c } from 'ttag';
import Icon from '../../components/icon/Icon';
import { Button } from '../../components';

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
            <div className="center flex flex-align-items-center">
                <Button
                    icon
                    shape="ghost"
                    disabled={isZoomOutDisabled}
                    onClick={onZoomOut}
                    title={c('Action').t`Zoom out`}
                >
                    <Icon name="minus" size={12} alt={c('Action').t`Zoom out`} />
                </Button>
                <Button shape="ghost" title={c('Action').t`Reset zoom`} className="ml0-5 mr0-5" onClick={onReset}>
                    <span>{Math.round(scale * 100)}%</span>
                </Button>
                <Button
                    icon
                    shape="ghost"
                    disabled={isZoomInDisabled}
                    onClick={onZoomIn}
                    title={c('Action').t`Zoom in`}
                >
                    <Icon name="plus" size={12} alt={c('Action').t`Zoom in`} />
                </Button>
            </div>
        </div>
    );
};

export default ZoomControl;
