import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import { useSearchParamsEffect } from '@proton/components/hooks';

interface Props {
    enabled: boolean;
    loading: boolean;
    onToggle: (newState: boolean) => void;
    id: string;
    searchParam: string;
    toggleCondition: boolean;
    nextToggleState: boolean;
    title: string;
}

const CredentialLeakToggle = ({
    enabled,
    loading,
    onToggle,
    id,
    searchParam,
    nextToggleState,
    title,
    toggleCondition,
}: Props) => {
    useSearchParamsEffect(
        (params) => {
            const subscribeParams = params.get(searchParam);
            params.delete(searchParam);

            if (!subscribeParams) {
                return params;
            }

            if (toggleCondition) {
                onToggle(nextToggleState);
                return params;
            }

            return params;
        },
        [toggleCondition, searchParam, toggleCondition, nextToggleState]
    );

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label className="text-semibold" htmlFor={id}>
                    <span className="mr-2">{title}</span>
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <Toggle
                    id={id}
                    disabled={false}
                    checked={enabled}
                    loading={loading}
                    onChange={({ target }) => {
                        void onToggle(target.checked);
                    }}
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default CredentialLeakToggle;
