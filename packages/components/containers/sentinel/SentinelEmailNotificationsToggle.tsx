import { useRef } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';

import useSearchParamsEffect from '../../hooks/useSearchParamsEffect';
import { EnforcedByOrganization } from "@proton/components/containers/sentinel/EnforcedByOrganization";

interface Props {
    checked: boolean;
    isInherited: boolean;
    loading: boolean;
    onChange: (checked: boolean) => void;
}

const SentinelEmailNotificationsToggle = ({ checked, isInherited, loading, onChange }: Props) => {
    const sentinelNotificationsToggleRef = useRef<HTMLInputElement | null>(null);

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useSearchParamsEffect(
        (params) => {
            const unsubscribeParam = 'sentinel-unsubscribe';
            const unsubscribe = params.get(unsubscribeParam) === 'true';
            params.delete(unsubscribeParam);

            if (unsubscribe) {
                onChangeRef.current(false);
            }

            return params;
        },
        []
    );

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="high-security-notifications-toggle">
                    <span className="mr-2">{c('Info').t`Enable email notifications`}</span>
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <EnforcedByOrganization enforced={isInherited}>
                    <Toggle
                        ref={sentinelNotificationsToggleRef}
                        id="high-security-notifications-toggle"
                        disabled={isInherited}
                        loading={loading}
                        checked={checked}
                        onChange={({ target }) => onChange(target.checked)}
                    />
                </EnforcedByOrganization>
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default SentinelEmailNotificationsToggle;
