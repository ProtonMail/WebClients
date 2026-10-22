import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { useOrganization } from '@proton/account/organization/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import { LUMO_APP_NAME } from '@proton/shared/lib/constants';
import type { OrganizationSettings } from '@proton/shared/lib/interfaces/Organization';

import { AccessToggle } from './AccessToggle';

export const AccessToggleLumoApi = () => {
    const api = useApi();
    const dispatch = useDispatch();
    const [organization] = useOrganization();
    const { createNotification } = useNotifications();

    const [loading, withLoading] = useLoading();

    const handleToggleLumoApi = async () => {
        const organizationSettings = await api<OrganizationSettings>(
            updateOrganizationSettings({
                LumoApiEnabled: !organization?.Settings.LumoApiEnabled,
            })
        );
        dispatch(organizationActions.updateOrganizationSettings({ value: organizationSettings }));

        createNotification({ text: c('Success notification').t`Preferences updated` });
    };

    return (
        <AccessToggle
            id="lumo-api-toggle"
            icon={<span className="h-6 w-6 shrink-0" />}
            title={c('Title').t`${LUMO_APP_NAME} API`}
            checked={!!organization?.Settings.LumoApiEnabled}
            loading={loading}
            onChange={() => withLoading(handleToggleLumoApi())}
            className="mt-4"
        >
            <span className="text-sm">{c('Info').t`Allow your organization to use the ${LUMO_APP_NAME} API`}</span>
        </AccessToggle>
    );
};
