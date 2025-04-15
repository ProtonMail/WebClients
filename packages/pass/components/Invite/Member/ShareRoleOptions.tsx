import { c } from 'ttag';

import type { InviteLabels } from '@proton/pass/components/Invite/useInviteLabels';
import { AccessTarget } from '@proton/pass/lib/access/types';
import { ShareRole } from '@proton/pass/types';

export const getShareRoleDefinition = (
    target: AccessTarget,
    labels: InviteLabels
): Record<ShareRole, { title: string; description: string }> => ({
    [ShareRole.READ]: {
        title: c('Info').t`Viewer`,
        description:
            target === AccessTarget.Vault
                ? c('Info').t`Can view items in this vault.`
                : c('Info').t`Can view this item.`,
    },
    [ShareRole.WRITE]: {
        title: c('Info').t`Editor`,
        description:
            target === AccessTarget.Vault
                ? c('Info').t`Can create, edit, and delete items in this vault.`
                : c('Info').t`Can create, edit, and delete this item.`,
    },
    [ShareRole.MANAGER]: {
        title: labels.title,
        description:
            target === AccessTarget.Vault
                ? c('Info').t`Can grant and revoke access to this vault.`
                : c('Info').t`Can grant and revoke access to this item.`,
    },
});
