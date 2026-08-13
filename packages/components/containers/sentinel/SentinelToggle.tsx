import { useRef } from 'react';

import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import { getEnableString } from '@proton/components/containers/credentialLeak/helpers';
import { EnforcedByOrganization } from '@proton/components/containers/organization/EnforcedByOrganization';
import useSearchParamsEffect from '@proton/components/hooks/useSearchParamsEffect';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

interface Props {
    checked: boolean;
    isInherited: boolean;
    loading: boolean;
    onChange: (checked: boolean) => void;
}

const SentinelToggle = ({ checked, isInherited, loading, onChange }: Props) => {
    const sentinelToggleRef = useRef<HTMLInputElement | null>(null);

    const checkedRef = useRef(checked);
    checkedRef.current = checked;

    useSearchParamsEffect((params) => {
        if (!sentinelToggleRef.current) {
            return;
        }

        const enableSentinelParam = params.get('enable-sentinel');
        params.delete('enable-sentinel');
        if (!enableSentinelParam) {
            return params;
        }

        if (checkedRef.current) {
            return params;
        }

        sentinelToggleRef.current.click();

        return params;
    }, []);

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor="high-security-toggle">
                    <span className="mr-2">{getEnableString(PROTON_SENTINEL_NAME)}</span>
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <EnforcedByOrganization enforced={isInherited}>
                    <Toggle
                        ref={sentinelToggleRef}
                        id="high-security-toggle"
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

export default SentinelToggle;
