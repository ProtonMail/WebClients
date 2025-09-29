import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { useOrganization } from '@proton/account/organization/hooks';
import { Icon, useApi, useNotifications } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import type { OrganizationSettings } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';

import { AccessToggle } from './AccessToggle';

export const AccessToggleCategoryView = () => {
    const api = useApi();
    const dispatch = useDispatch();
    const [organization] = useOrganization();
    const { createNotification } = useNotifications();

    const isCategoryViewEnabled = useFlag('CategoryView');

    const [categoryLoading, withCategoryLoading] = useLoading();

    const handleToggleCategoryView = async () => {
        const organizationSettings = await api<OrganizationSettings>(
            updateOrganizationSettings({
                MailCategoryViewEnabled: !organization?.Settings.MailCategoryViewEnabled,
            })
        );
        dispatch(organizationActions.updateOrganizationSettings({ value: organizationSettings }));

        createNotification({ text: c('Success notification').t`Preferences updated` });
    };

    if (!isCategoryViewEnabled) {
        return null;
    }

    return (
        <AccessToggle
            id="category-toggle"
            icon={<Icon name="drawer-dividers" className="color-weak" size={6} />}
            title={c('Title').t`Email categories`}
            checked={!!organization?.Settings.MailCategoryViewEnabled}
            loading={categoryLoading}
            onChange={() => withCategoryLoading(handleToggleCategoryView())}
            className="mt-4"
        >
            <p className="m-0 text-sm">
                {c('Info')
                    .t`With email categories, important messages land in a primary inbox. Everything else is organized into categories.`}
            </p>
        </AccessToggle>
    );
};
