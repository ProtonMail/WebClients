import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { useOrganization } from '@proton/account/organization/hooks';
import { ButtonLike } from '@proton/atoms';
import {
    Icon,
    SUBSCRIPTION_STEPS,
    SettingsLink,
    useApi,
    useNotifications,
    useSubscriptionModal,
} from '@proton/components';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import type { OrganizationSettings } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';

import { AccessToggle } from './AccessToggle';

export const userAndAddress = (
    <ButtonLike
        shape="underline"
        as={SettingsLink}
        path="/users-addresses"
        app={APPS.PROTONMAIL}
        target="_self"
        className="color-weak p-0"
    >
        {c('Action').t`Users and addresses`}
    </ButtonLike>
);

const AddMoreSeats = () => {
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    const handleGetMoreLicense = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            metrics: {
                /**
                 * The `vpn` in `vpn-um-get-more` is unimportant.
                 * The intention is to observe the user journey, not the specific plan the journey is for.
                 * However changing this would require a new metric schema version.
                 */
                source: 'vpn-um-get-more',
            },
        });
    };

    return (
        <ButtonLike
            shape="underline"
            onClick={handleGetMoreLicense}
            disabled={loadingSubscriptionModal}
            className="color-weak p-0"
        >
            {c('Action').t`add more seats`}
        </ButtonLike>
    );
};

export const AccessToggleScribe = () => {
    const api = useApi();
    const dispatch = useDispatch();
    const [organization] = useOrganization();
    const { createNotification } = useNotifications();

    const isScribeAdminSettingFeatureEnabled = useFlag('ScribeAdminSetting');
    const { paymentsEnabled } = useAssistantFeatureEnabled();

    const [scribeLoading, withScribeLoading] = useLoading();

    const handleToggleScribe = async () => {
        const organizationSettings = await api<OrganizationSettings>(
            updateOrganizationSettings({
                ShowScribeWritingAssistant: !organization?.Settings.ShowScribeWritingAssistant,
            })
        );
        dispatch(organizationActions.updateOrganizationSettings({ value: organizationSettings }));

        createNotification({ text: c('Success notification').t`Preferences updated` });
    };

    if (!(paymentsEnabled && isScribeAdminSettingFeatureEnabled)) {
        return null;
    }

    const addMoreSeats = <AddMoreSeats />;

    return (
        <AccessToggle
            id="scribe-toggle"
            icon={<Icon name="pen-sparks" className="color-weak" size={6} />}
            title={c('Title').t`${BRAND_NAME} Scribe writing assistant`}
            checked={!!organization?.Settings.ShowScribeWritingAssistant}
            loading={scribeLoading}
            onChange={() => withScribeLoading(handleToggleScribe())}
        >
            <p className="m-0 text-sm">
                {
                    // translator: full sentence is: Helps write, reply to, and proofread emails. If disabled only administrators will have access. Manage for individual users in <Users and addresses> or <add more seats>
                    c('Info')
                        .jt`Helps write, reply to, and proofread emails. If disabled only administrators will have access. Manage for individual users in ${userAndAddress} or ${addMoreSeats}`
                }
            </p>
        </AccessToggle>
    );
};
