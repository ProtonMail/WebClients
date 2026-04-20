import type { FC } from 'react';

import { c } from 'ttag';

import type { Organization } from '@proton/shared/lib/interfaces';
import capitalize from '@proton/utils/capitalize';

export const AdminPanelLabel: FC<Pick<Organization, 'Name' | 'UsedMembers' | 'MaxMembers'>> = ({
    Name,
    UsedMembers,
    MaxMembers,
}) => (
    <div className="flex flex-column flex-nowrap">
        <span className="text-ellipsis">{c('Action').t`Admin panel`}</span>
        {Name && UsedMembers > 1 && (
            <div className="flex flex-row flex-nowrap gap-1 color-weak text-sm">
                <span className="text-ellipsis">{capitalize(Name)}</span>
                <span className="shrink-0">
                    ({UsedMembers}/{MaxMembers})
                </span>
            </div>
        )}
    </div>
);
