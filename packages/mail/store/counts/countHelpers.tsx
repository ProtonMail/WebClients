import type { CountParams } from '@proton/shared/lib/api/interface';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';

export const getCountQueryParams = (organization: OrganizationExtended, mailSettings: MailSettings): CountParams => {
    if (!organization.Settings.MailCategoryViewEnabled) {
        return { OnlyInInboxForCategories: undefined };
    }

    return { OnlyInInboxForCategories: mailSettings.MailCategoryView ? 1 : 0 };
};
