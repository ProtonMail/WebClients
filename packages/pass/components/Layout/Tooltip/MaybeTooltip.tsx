import type { FC, ReactElement, ReactNode } from 'react';

import type { PopperPlacement } from '@proton/atoms/Popper/interface';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

type Props = {
    children: ReactElement;
    /** When `false`, children render as-is (no tooltip, no wrapper element) */
    active: boolean;
    title?: ReactNode;
    openDelay?: number;
    placement?: PopperPlacement;
};

export const MaybeTooltip: FC<Props> = ({ children, active, title, openDelay = 500, placement }) =>
    active ? (
        <Tooltip openDelay={openDelay} originalPlacement={placement} title={title}>
            {/* Without <div> the tooltip may not always display properly */}
            <div>{children}</div>
        </Tooltip>
    ) : (
        children
    );
