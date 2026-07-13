import { Tooltip, type Props as TooltipProps } from '@proton/atoms/Tooltip/Tooltip';
import type { PopperPlacement } from '@proton/components/index';

type Props = {
    children: React.ReactElement;
    title?: string;
    placement?: PopperPlacement;
    tooltipClassName?: string;
} & Omit<TooltipProps, 'title' | 'originalPlacement'>;

export const ConditionalTooltip = ({
    children,
    title,
    openDelay = 200,
    closeDelay = 200,
    placement = 'bottom',
    ...props
}: Props) => {
    if (!title) {
        return children;
    }

    // Allow tooltip to work on disabled children
    const wrappedChild =
        children?.props?.disabled === true ? <span className="inline-block">{children}</span> : children;

    return (
        <Tooltip title={title} openDelay={openDelay} closeDelay={closeDelay} originalPlacement={placement} {...props}>
            {wrappedChild}
        </Tooltip>
    );
};
