import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { Button } from '@proton/atoms/index';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import Info from '@proton/components/components/link/Info';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import type { AllPasswordPolicyKeys, PolicyStateType } from '@proton/shared/lib/api/passwordPolicies';
import { PasswordPolicyState, serializePolicyState } from '@proton/shared/lib/api/passwordPolicies';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getBlogURL } from '@proton/shared/lib/helpers/url';
import type { OrganizationWithSettings } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import SettingsParagraph from '../account/SettingsParagraph';

const defaultLabel = <span className="color-hint ml-0.5">{c('Info').t`(default)`}</span>;

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

const MIN_CHARS = 16;
const MAX_CHARS = 100;

const SettingsField = ({
    key,
    label,
    tooltip,
    name,
    value,
    options,
    onChange,
}: {
    key: string;
    label: string;
    tooltip: string | ReactNode;
    name: string;
    value: PasswordPolicyState;
    options: typeof optionsOptionalLabel | typeof optionsAllowedLabel;
    onChange: (v: PasswordPolicyState) => void;
}) => (
    <SettingsLayout key={key}>
        <SettingsLayoutLeft>
            <label className="text-semibold flex items-center" id={`${key}-label`}>
                <span className="mr-0.5">{label}</span>
                {tooltip && <Info title={tooltip} />}
            </label>
        </SettingsLayoutLeft>
        <SettingsLayoutRight>
            <RadioGroup
                aria-labelledby={`${key}-label`}
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
    organization?: OrganizationWithSettings;
}

const OrganizationProtonAccountPasswordRules = ({ organization }: OrganizationProtonAccountPasswordRulesProps) => {
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();

    const [defaultPolicyState, setDefaultPolicyState] = useState<PolicyStateType>({
        AtLeastXCharacters: String(MIN_CHARS),
        AtLeastOneNumber: PasswordPolicyState.OPTIONAL,
        AtLeastOneSpecialCharacter: PasswordPolicyState.OPTIONAL,
        AtLeastOneUpperCaseAndOneLowercase: PasswordPolicyState.OPTIONAL,
        DisallowSequences: PasswordPolicyState.OPTIONAL,
        DisallowCommonPasswords: PasswordPolicyState.OPTIONAL,
    });
    const [policyState, setPolicyState] = useState<PolicyStateType>(defaultPolicyState);

    useEffect(() => {
        const policies = organization?.Settings?.PasswordPolicies ?? [];
        const updated: Partial<PolicyStateType> = {};

        for (const policy of policies) {
            if (policy.PolicyName in defaultPolicyState) {
                const key = policy.PolicyName as keyof PolicyStateType;

                if (key === 'AtLeastXCharacters') {
                    const min = policy.Parameters?.MinimumCharacters;
                    if (min != null) {
                        updated[key] = String(min);
                    }
                } else {
                    updated[key] = policy.State;
                }
            }
        }

        setPolicyState((prev) => ({
            ...prev,
            ...updated,
        }));

        setDefaultPolicyState((prev) => ({
            ...prev,
            ...updated,
        }));
    }, [organization]);

    const updatePolicyState = <K extends keyof PolicyStateType>(key: K, value: PolicyStateType[K]) => {
        setPolicyState((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const charCount = Number(policyState.AtLeastXCharacters);

    const isModified = useMemo(() => {
        return Object.entries(defaultPolicyState).some(([key, defaultValue]) => {
            return policyState[key as keyof PolicyStateType] !== defaultValue;
        });
    }, [policyState]);

    const canSave = useMemo(() => {
        return isModified && charCount >= MIN_CHARS && charCount < MAX_CHARS;
    }, [isModified, policyState.AtLeastXCharacters]);

    const handleMinCharacterLengthChange = (value: string) => {
        const parsed = Number(value);
        if (!isNaN(parsed)) {
            updatePolicyState('AtLeastXCharacters', String(parsed));
        }
    };

    type Setting = {
        key: AllPasswordPolicyKeys;
        label: string;
        options: typeof optionsOptionalLabel;
        tooltip?: ReactNode;
    };

    const settings: Setting[] = [
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
        const serializedPolicies = serializePolicyState(policyState);

        try {
            dispatch(
                organizationActions.updateOrganizationSettings({ value: { PasswordPolicies: serializedPolicies } })
            );
            await api(updateOrganizationSettings({ PasswordPolicies: serializedPolicies }));
            createNotification({ text: c('Info').t`Preference saved` });
        } catch (error) {
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
                    if (!canSave || !onFormSubmit()) {
                        return;
                    }
                    void withLoading(handleSave()).catch(noop);
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
                            value={policyState.AtLeastXCharacters}
                            onChange={(e) => handleMinCharacterLengthChange(e.target.value)}
                            suffix={charCount === MIN_CHARS ? defaultLabel : undefined}
                            min={MIN_CHARS}
                            max={MAX_CHARS}
                            error={validator([
                                charCount < MIN_CHARS ? c('Label').t`Minimum number of characters is ${MIN_CHARS}` : '',
                                charCount >= MAX_CHARS
                                    ? c('Label').t`Maximum number of characters is ${MAX_CHARS}`
                                    : '',
                            ])}
                            assistContainerClassName="empty:hidden"
                        />
                    </SettingsLayoutRight>
                </SettingsLayout>

                {settings.map(({ key, label, tooltip, options }) => (
                    <SettingsField
                        key={key}
                        name={key}
                        label={label}
                        tooltip={tooltip}
                        value={policyState[key as keyof PolicyStateType] as PasswordPolicyState}
                        options={options}
                        onChange={(value: PasswordPolicyState) =>
                            updatePolicyState(key as keyof PolicyStateType, value)
                        }
                    />
                ))}

                <Button type="submit" color="norm" disabled={!canSave} loading={loading}>
                    {c('Action').t`Save`}
                </Button>
            </form>
        </>
    );
};

export default OrganizationProtonAccountPasswordRules;
