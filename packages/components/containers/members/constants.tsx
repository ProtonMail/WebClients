import { c } from 'ttag';

export const adminTooltipText = (isSubsidiaryOrg?: boolean) => {
    if (isSubsidiaryOrg) {
        return c('Tooltip').t`Admins can manage user accounts and give admin privileges to other users.`;
    }
    return c('Tooltip')
        .t`Admins can manage user accounts and give admin privileges to other users. Only the primary admin can edit the plan of the organization.`;
};
