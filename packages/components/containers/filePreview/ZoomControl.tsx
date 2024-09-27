import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
}

const ZoomControl = ({ className, scale, onZoomIn, onZoomOut, onReset }: Props) => {
    const isZoomOutDisabled = scale <= 0.005;
    const isZoomInDisabled = scale >= 10;

    const displayedZoomValueInPercent = `${Math.round(scale * 100)}%`;

    return (
        <div className={clsx(['w-full p-7 flex', className])}>
            <div className="mx-auto flex items-center">
                <Button
                    icon
                    shape="ghost"
                    disabled={isZoomOutDisabled}
                    onClick={onZoomOut}
                    title={c('Action').t`Zoom out`}
                >
                    <Icon name="minus" size={3} alt={c('Action').t`Zoom out`} />
                </Button>
                <Button shape="ghost" title={c('Action').t`Fit to window`} className="mx-2" onClick={onReset}>
                    <span>{displayedZoomValueInPercent}</span>
                </Button>
                <Button
                    icon
                    shape="ghost"
                    disabled={isZoomInDisabled}
                    onClick={onZoomIn}
                    title={c('Action').t`Zoom in`}
                >
                    <Icon name="plus" size={3} alt={c('Action').t`Zoom in`} />
                </Button>
            </div>
        </div>
    );
};

export default ZoomControl;
