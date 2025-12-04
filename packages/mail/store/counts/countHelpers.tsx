import type { CountParams } from '@proton/shared/lib/api/interface';
import type { MailSettings, OrganizationExtended } from '@proton/shared/lib/interfaces';

export const getCountQueryParams = (organization: OrganizationExtended, mailSettings: MailSettings): CountParams => {
    if (!organization.Settings.MailCategoryViewEnabled) {
        return { OnlyInInboxForCategories: undefined };
    }

    return { OnlyInInboxForCategories: mailSettings.MailCategoryView ? 1 : 0 };
};
