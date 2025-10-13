import { type ReactNode, useRef } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

import useSearchParamsEffect from '../../hooks/useSearchParamsEffect';
import { getEnableString } from '../credentialLeak/helpers';

interface Props {
    checked: boolean;
    isInherited: boolean;
    loading: boolean;
    onChange: (checked: boolean) => void;
}

const EnforcedByOrganization = ({ enforced, children }: { enforced: boolean; children: ReactNode }) => {
    if (!enforced) {
        return children;
    }

    return (
        <Tooltip title={c('Tooltip').t`This setting is managed by your organization`} openDelay={0}>
            <span>{children}</span>
        </Tooltip>
    );
};

const SentinelToggle = ({ checked, isInherited, loading, onChange }: Props) => {
    const sentinelToggleRef = useRef<HTMLInputElement | null>(null);

    useSearchParamsEffect(
        (params) => {
            if (!sentinelToggleRef.current) {
                return;
            }

            const enableSentinelParam = params.get('enable-sentinel');
            params.delete('enable-sentinel');
            if (!enableSentinelParam) {
                return params;
            }

            if (checked) {
                return params;
            }

            sentinelToggleRef.current.click();

            return params;
        },
        [sentinelToggleRef.current]
    );

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
