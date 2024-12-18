import type { ReactElement } from 'react';
import { type FC } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/components/index';

type MaybeOrganizationTooltipProps = { children: ReactElement; show: boolean };

export const MaybeOrgSettingTooltip: FC<MaybeOrganizationTooltipProps> = ({ children, show }) =>
    show ? (
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
