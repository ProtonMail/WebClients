import type { ReactElement, ReactNode } from 'react';
import { type FC } from 'react';

import { c } from 'ttag';

import { type PopperPlacement } from '@proton/components'
import { Tooltip } from '@proton/atoms';

type MaybeOrganizationTooltipProps = {
    children: ReactElement;
    enforced: boolean;
    text?: ReactNode;
    placement?: PopperPlacement;
};

export const OrganizationPolicyTooltip: FC<MaybeOrganizationTooltipProps> = ({
    children,
    enforced,
    text,
    placement,
}) =>
    enforced ? (
        <Tooltip
            openDelay={500}
            originalPlacement={placement}
            title={text ?? c('Info').t`This setting is enforced by your organization`}
        >
            {/* Without <div> the tooltip may not always display properly */}
            <div>{children}</div>
        </Tooltip>
    ) : (
        children
    );
