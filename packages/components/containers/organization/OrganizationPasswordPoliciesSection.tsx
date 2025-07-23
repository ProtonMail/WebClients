import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { Button } from '@proton/atoms';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import Info from '@proton/components/components/link/Info';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import '@proton/shared/lib/api/passwordPolicies';
import { BRAND_NAME, MIN_PASSWORD_LENGTH } from '@proton/shared/lib/constants';
import { omit } from '@proton/shared/lib/helpers/object';
import { getBlogURL } from '@proton/shared/lib/helpers/url';
import {
    type OrganizationExtended,
    type PasswordPoliciesState,
    type PasswordPolicyName,
    type PasswordPolicySetting,
    type PasswordPolicySettings,
    PasswordPolicyState,
} from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import SettingsParagraph from '../account/SettingsParagraph';

const serializePolicyState = (state: PasswordPoliciesState): PasswordPolicySetting[] => {
    return Object.entries(state).map(([_key, value]): PasswordPolicySetting => {
        const key = _key as keyof typeof state;

        if (key === 'AtLeastXCharacters') {
            return {
                PolicyName: key,
                State: PasswordPolicyState.ENABLED,
                Parameters: {
                    MinimumCharacters: Number(value),
                },
            };
        }

        return {
            PolicyName: key,
            State: value as PasswordPolicyState,
            Parameters: null,
        };
    });
};

const defaultLabel = <span className="color-hint ml-0.5">{c('Info').t`(default)`}</span>;

const MIN_CHARS = MIN_PASSWORD_LENGTH;
const MAX_CHARS = 70;

interface RadioSetting {
    key: Exclude<PasswordPolicyName, 'AtLeastXCharacters'>;
    label: string;
    options: { value: PasswordPolicyState; label: ReactNode }[];
    tooltip?: ReactNode;
}

const SettingsField = ({
    label,
    tooltip,
    name,
    value,
    options,
    onChange,
}: {
    label: string;
    tooltip: ReactNode;
    name: string;
    value: PasswordPolicyState;
    options: RadioSetting['options'];
    onChange: (v: PasswordPolicyState) => void;
}) => (
    <SettingsLayout>
        <SettingsLayoutLeft>
            <label className="text-semibold flex items-center" id={`${name}-label`}>
                <span className="mr-0.5">{label}</span>
                {tooltip && <Info title={tooltip} />}
            </label>
        </SettingsLayoutLeft>
        <SettingsLayoutRight>
            <RadioGroup
                aria-labelledby={`${name}-label`}
                name={name}
                onChange={onChange}
                value={value}
                options={options}
                className="mb-0 mt-2"
            />
        </SettingsLayoutRight>
    </SettingsLayout>
);

interface OrganizationProtonAccountPasswordRulesProps {
    organization?: OrganizationExtended;
}

const getDefaultPolicyState = (policies: PasswordPolicySettings = []): PasswordPoliciesState => {
    const defaultPolicyState: PasswordPoliciesState = {
        AtLeastXCharacters: String(MIN_CHARS),
        AtLeastOneNumber: PasswordPolicyState.OPTIONAL,
        AtLeastOneSpecialCharacter: PasswordPolicyState.OPTIONAL,
        AtLeastOneUpperCaseAndOneLowercase: PasswordPolicyState.OPTIONAL,
        DisallowSequences: PasswordPolicyState.OPTIONAL,
        DisallowCommonPasswords: PasswordPolicyState.OPTIONAL,
    };

    for (const policy of policies) {
        const key = policy.PolicyName as keyof PasswordPoliciesState;

        if (key in defaultPolicyState) {
            if (key === 'AtLeastXCharacters') {
                const min = policy.Parameters?.MinimumCharacters;
                if (min != null) {
                    defaultPolicyState[key] = String(min);
                }
            } else {
                defaultPolicyState[key] = policy.State;
            }
        }
    }

    return defaultPolicyState;
};

const OrganizationPasswordPoliciesSection = ({ organization }: OrganizationProtonAccountPasswordRulesProps) => {
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const defaultPolicyState = getDefaultPolicyState(organization?.Settings?.PasswordPolicies);
    const [policyState, setPolicyState] = useState<Partial<PasswordPoliciesState>>({});

    const updatePolicyState = <K extends keyof PasswordPoliciesState>(key: K, value: PasswordPoliciesState[K]) => {
        setPolicyState((prev) => {
            if (defaultPolicyState[key] === value) {
                return omit(prev, [key]);
            }
            return {
                ...prev,
                [key]: value,
            };
        });
    };

    const getValue = <Key extends keyof typeof defaultPolicyState>(key: Key) =>
        policyState[key] ?? defaultPolicyState[key];

    const charCount = Number(getValue('AtLeastXCharacters'));
    const isModified = Object.keys(policyState).length > 0;
    const canSave = isModified && charCount >= MIN_CHARS && charCount < MAX_CHARS;

    const handleMinCharacterLengthChange = (value: string) => {
        const parsed = Number(value);
        if (!isNaN(parsed) || value === '') {
            updatePolicyState('AtLeastXCharacters', value === '' ? value : String(parsed));
        }
    };

    const optionsOptionalLabel = [
        {
            value: PasswordPolicyState.OPTIONAL,
            label: c('Option').jt`Optional ${defaultLabel}`,
        },
        {
            value: PasswordPolicyState.ENABLED,
            label: c('Option').t`Required`,
        },
    ];

    const optionsAllowedLabel = [
        {
            value: PasswordPolicyState.OPTIONAL,
            label: c('Option').jt`Allowed ${defaultLabel}`,
        },
        {
            value: PasswordPolicyState.ENABLED,
            label: c('Option').t`Not allowed`,
        },
    ];

    const radioSettings: RadioSetting[] = [
        {
            key: 'AtLeastOneNumber',
            label: c('Label').t`Numbers`,
            options: optionsOptionalLabel,
        },
        {
            key: 'AtLeastOneSpecialCharacter',
            label: c('Label').t`Special characters`,
            options: optionsOptionalLabel,
        },
        {
            key: 'AtLeastOneUpperCaseAndOneLowercase',
            label: c('Label').t`Uppercase and lowercase letters`,
            options: optionsOptionalLabel,
        },
        {
            key: 'DisallowSequences',
            label: c('Label').t`Sequences`,
            tooltip: getBoldFormattedText(c('Tooltip').t`For example, **12345, abcde**, etc.`),
            options: optionsAllowedLabel,
        },
        {
            key: 'DisallowCommonPasswords',
            label: c('Label').t`Common passwords`,
            tooltip: getBoldFormattedText(c('Tooltip').t`For example, **password, qwerty**, etc.`),
            options: optionsAllowedLabel,
        },
    ];

    const handleSave = async () => {
        const serializedPolicies = serializePolicyState({ ...defaultPolicyState, ...policyState });

        try {
            dispatch(
                organizationActions.updateOrganizationSettings({ value: { PasswordPolicies: serializedPolicies } })
            );
            setPolicyState({});
            await api(updateOrganizationSettings({ PasswordPolicies: serializedPolicies }));
            createNotification({ text: c('Info').t`Preference saved` });
        } catch (error) {
            setPolicyState(policyState);
            // Revert change on 403 cancellation
            dispatch(
                organizationActions.updateOrganizationSettings({
                    value: { PasswordPolicies: serializedPolicies },
                })
            );
        }
    };

    return (
        <>
            <SettingsParagraph
                learnMoreUrl={getBlogURL('/create-remember-strong-passwords')}
                inlineLearnMore={true}
                learnMoreText={c('Link').t`How to create strong passwords`}
            >
                {c('Info')
                    .t`You can enforce the password rules members of your organization will use when they create or reset the password to their ${BRAND_NAME} Account.`}
            </SettingsParagraph>

            <form
                name="org-password-policies"
                onSubmit={async (e) => {
                    e.preventDefault();
                    if (!canSave) {
                        return;
                    }
                    withLoading(handleSave()).catch(noop);
                }}
            >
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label className="text-semibold flex items-center" id="min-character-length-label">
                            <span className="mr-0.5">{c('Label').t`Minimum number of characters`}</span>
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight>
                        <InputFieldTwo
                            type="number"
                            id="min-character-length"
                            aria-labelledby="min-character-length-label"
                            value={getValue('AtLeastXCharacters')}
                            onChange={(e) => handleMinCharacterLengthChange(e.target.value)}
                            suffix={charCount === MIN_CHARS ? defaultLabel : undefined}
                            min={MIN_CHARS}
                            max={MAX_CHARS}
                            error={(() => {
                                if (charCount < MIN_CHARS) {
                                    return c('Label').t`Minimum number of characters is ${MIN_CHARS}`;
                                }
                                if (charCount >= MAX_CHARS) {
                                    return c('Label').t`Maximum number of characters is ${MAX_CHARS}`;
                                }
                                return undefined;
                            })()}
                            assistContainerClassName="empty:hidden"
                        />
                    </SettingsLayoutRight>
                </SettingsLayout>

                {radioSettings.map(({ key, label, tooltip, options }) => (
                    <SettingsField
                        key={key}
                        name={key}
                        label={label}
                        tooltip={tooltip}
                        value={getValue(key)}
                        options={options}
                        onChange={(value) => updatePolicyState(key, value)}
                    />
                ))}

                <Button type="submit" color="norm" disabled={!canSave} loading={loading}>
                    {c('Action').t`Save`}
                </Button>
            </form>
        </>
    );
};

export default OrganizationPasswordPoliciesSection;
