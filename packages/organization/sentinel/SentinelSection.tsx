import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import SentinelDescription from './SentinelDescription';
import SentinelEmailNotificationsToggle from './SentinelEmailNotificationsToggle';
import SentinelToggle from './SentinelToggle';
import SentinelUpgradeButton from './SentinelUpgradeButton';
import { useSentinel } from './useSentinel';

interface Props {
    app: APP_NAMES;
    variant?: 'user' | 'organization';
}

export const SentinelSection = ({ app, variant = 'user' }: Props) => {
    const { state, loadingSentinel, setSentinel, setNotificationEmails, loadingNotifications } = useSentinel(variant);

    const { loading, eligible, checked, enforcedByOrganization } = state;
    const notificationEmails = 'notificationEmails' in state ? state.notificationEmails : undefined;

    return (
        <SettingsSectionWide>
            <SentinelDescription variant={variant} eligible={eligible} />

            {eligible ? (
                <>
                    <SentinelToggle
                        checked={checked}
                        isInherited={
                            /* org variant should always be able to edit, so ignore enforced */ enforcedByOrganization &&
                            variant === 'user'
                        }
                        loading={loadingSentinel || loading}
                        onChange={setSentinel}
                    />
                    {checked && variant === 'user' && !enforcedByOrganization && (
                        <SentinelEmailNotificationsToggle
                            checked={notificationEmails === 1}
                            isInherited={enforcedByOrganization}
                            loading={loadingNotifications}
                            onChange={setNotificationEmails}
                        />
                    )}
                </>
            ) : (
                <SentinelUpgradeButton app={app} variant={variant} />
            )}
        </SettingsSectionWide>
    );
};
