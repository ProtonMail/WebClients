import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import SentinelDescription from './SentinelDescription';
import SentinelToggle from './SentinelToggle';
import SentinelUpgradeButton from './SentinelUpgradeButton';
import { useSentinel } from './useSentinel';

interface Props {
    app: APP_NAMES;
    variant?: 'user' | 'organization';
}

export const SentinelSection = ({ app, variant = 'user' }: Props) => {
    const {
        state: { loading, eligible, checked, enforcedByOrganization },
        loadingSentinel,
        setSentinel,
    } = useSentinel(variant);

    return (
        <SettingsSectionWide>
            <SentinelDescription variant={variant} eligible={eligible} />

            {eligible ? (
                <SentinelToggle
                    checked={checked}
                    isInherited={
                        /* org variant should always be able to edit, so ignore enforced */ enforcedByOrganization &&
                        variant === 'user'
                    }
                    loading={loadingSentinel || loading}
                    onChange={(checked) => setSentinel(checked)}
                />
            ) : (
                <SentinelUpgradeButton app={app} variant={variant} />
            )}
        </SettingsSectionWide>
    );
};
