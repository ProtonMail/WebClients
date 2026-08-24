import { useRef } from 'react';

import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

import Toggle from '../../components/toggle/Toggle';
import useSearchParamsEffect from '../../hooks/useSearchParamsEffect';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import { getEnableString } from '../credentialLeak/helpers';
import { EnforcedByOrganization } from '../organization/EnforcedByOrganization';

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
