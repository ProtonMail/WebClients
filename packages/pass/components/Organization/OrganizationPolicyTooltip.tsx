import type { ReactElement } from 'react';
import { type FC } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/components';

type MaybeOrganizationTooltipProps = { children: ReactElement; enforced: boolean };

export const OrganizationPolicyTooltip: FC<MaybeOrganizationTooltipProps> = ({ children, enforced }) =>
    enforced ? (
        <Tooltip
            openDelay={500}
            originalPlacement="top"
            title={c('Info').t`This setting is enforced by your organization`}
        >
            {children}
        </Tooltip>
    ) : (
        children
    );
