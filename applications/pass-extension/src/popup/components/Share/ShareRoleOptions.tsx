import { c } from 'ttag';

import { ShareRole } from '@proton/pass/types';

export const getShareRoleDefinition = (): Record<ShareRole, { title: string; description: string }> => ({
    [ShareRole.READ]: {
        title: c('Info').t`Viewer`,
        description: c('Info').t`Can view items in this vault.`,
    },
    [ShareRole.WRITE]: {
        title: c('Info').t`Editor`,
        description: c('Info').t`Can create, edit, delete, and export items in this vault.`,
    },
    [ShareRole.ADMIN]: {
        title: c('Info').t`Admin`,
        description: c('Info').t`Can grant and revoke access to this vault.`,
    },
});

export const shareRoleOptions = () =>
    Object.entries(getShareRoleDefinition())
        .reverse()
        .map(([value, { title, description }]) => ({
            value: value as ShareRole,
            label: (
                <div>
                    <div>{title}</div>
                    <div className="color-weak">{description}</div>
                </div>
            ),
        }));
