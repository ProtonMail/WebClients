import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { PopperPlacement } from '@proton/components/index';

type Props = { children: React.ReactElement; title?: string; delay?: number; placement?: PopperPlacement };

export const ConditionalTooltip = ({ children, title, delay = 200, placement = 'bottom' }: Props) => {
    if (!title) {
        return children;
    }

    // Allow tooltip to work on disabled children
    const wrappedChild =
        children?.props?.disabled === true ? <span className="inline-block">{children}</span> : children;

    return (
        <Tooltip title={title} openDelay={delay} closeDelay={delay} originalPlacement={placement}>
            {wrappedChild}
        </Tooltip>
    );
};
