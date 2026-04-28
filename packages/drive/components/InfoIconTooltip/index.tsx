import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcInfoCircleFilled } from '@proton/icons/icons/IcInfoCircleFilled';
import clsx from '@proton/utils/clsx';

export enum InfoIconTooltipRenderMode {
    OUTLINE = 'outline',
    FILLED = 'filled',
}

interface Props {
    title: string;
    renderMode?: InfoIconTooltipRenderMode;
    className?: string;
}

export const InfoIconTooltip = ({ title, renderMode = InfoIconTooltipRenderMode.OUTLINE, className }: Props) => {
    const isFilled = renderMode === InfoIconTooltipRenderMode.FILLED;
    const Icon = isFilled ? IcInfoCircleFilled : IcInfoCircle;

    return (
        <Tooltip title={title}>
            <span className={clsx(isFilled && 'color-disabled', className)}>
                <Icon size={isFilled ? 5 : 3.5} alt={title} />
            </span>
        </Tooltip>
    );
};
