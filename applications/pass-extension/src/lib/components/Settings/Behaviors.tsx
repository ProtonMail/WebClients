import type { ReactNode } from 'react';
import { type FC, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { Dispatch } from 'redux';
import { c } from 'ttag';

import { Checkbox } from '@proton/components/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { settingsEditRequest } from '@proton/pass/store/actions/requests';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { selectProxiedSettings, selectRequestInFlight } from '@proton/pass/store/selectors';
import type { RecursivePartial } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { PauseList } from './PauseList';
import { VaultSetting } from './VaultSetting';

type SettingDefinition = {
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    hidden?: boolean;
    onChange: (value: boolean) => void;
};

type SettingsSection = {
    label: string;
    description?: string;
    settings: SettingDefinition[];
    extra?: ReactNode;
};

const getSettings =
    (settings: ProxiedSettings, identityEnabled: boolean) =>
    (dispatch: Dispatch): SettingsSection[] => {
        const { onTelemetry } = usePassCore();
        const onSettingsUpdate = (update: RecursivePartial<ProxiedSettings>) =>
            dispatch(settingsEditIntent('behaviors', update));

        return [
            {
                label: c('Label').t`Autofill`,
                settings: [
                    {
                        label: c('Label').t`Display ${PASS_APP_NAME} icon on autofillable fields`,
                        description: c('Info')
                            .t`You can quickly autofill your credentials by clicking on the ${PASS_APP_NAME} icon.`,
                        checked: settings.autofill.inject,
                        onChange: (checked) => onSettingsUpdate({ autofill: { inject: checked } }),
                    },
                    {
                        label: c('Label').t`Automatically open autofill when a login field is focused`,
                        description: c('Info')
                            .t`The autofill dropdown will automatically open when you click or focus on the field.`,
                        checked: settings.autofill.openOnFocus,
                        onChange: (checked) => onSettingsUpdate({ autofill: { openOnFocus: checked } }),
                    },
                    {
                        label: c('Label').t`Identity autofill`,
                        description: c('Info').t`Quickly autofill your identities.`,
                        checked: settings.autofill.identity ?? false,
                        /** identity autofill is disabled if no injection or "open on focus" */
                        disabled: !(settings.autofill.inject || settings.autofill.openOnFocus),
                        hidden: !identityEnabled,
                        onChange: (checked) => onSettingsUpdate({ autofill: { identity: checked } }),
                    },
                    {
                        label: c('Label').t`2FA autofill`,
                        description: c('Info').t`Quickly autofill your 2FA tokens.`,
                        checked: settings.autofill.twofa,
                        onChange: (checked) => onSettingsUpdate({ autofill: { twofa: checked } }),
                    },
                ],
            },
            {
                label: c('Label').t`Autosave`,
                settings: [
                    {
                        label: c('Label').t`Prompt for auto-save`,
                        description: c('Info').t`${PASS_APP_NAME} will prompt you to save or update credentials.`,
                        checked: settings.autosave.prompt,
                        onChange: (checked) =>
                            onSettingsUpdate({
                                autosave: {
                                    prompt: checked,
                                    passwordSuggest: checked,
                                },
                            }),
                    },
                    {
                        label: c('Label').t`Prompt for auto-save when generating passwords`,
                        description: c('Info')
                            .t`${PASS_APP_NAME} will prompt you as soon as generated passwords are autofilled.`,
                        checked: settings.autosave.prompt && settings.autosave.passwordSuggest,
                        disabled: !settings.autosave.prompt,
                        onChange: (checked) => onSettingsUpdate({ autosave: { passwordSuggest: checked } }),
                    },
                ],
                extra: <VaultSetting onSubmit={({ shareId }) => onSettingsUpdate({ autosave: { shareId } })} />,
            },
            {
                label: c('Label').t`Autosuggest`,
                settings: [
                    {
                        label: c('Label').t`Passwords`,
                        description: c('Info')
                            .t`${PASS_APP_NAME} will suggest creating strong passwords on sign-up forms.`,
                        checked: settings.autosuggest.password,
                        onChange: (checked) => onSettingsUpdate({ autosuggest: { password: checked } }),
                    },
                    {
                        label: c('Label').t`Copy password`,
                        description: c('Info').t`Automatically copy the generated password to the clipboard`,
                        checked: settings.autosuggest.passwordCopy,
                        disabled: !settings.autosuggest.password,
                        onChange: (checked) => onSettingsUpdate({ autosuggest: { passwordCopy: checked } }),
                    },
                    {
                        label: c('Label').t`Email aliases`,
                        description: c('Info')
                            .t`${PASS_APP_NAME} will suggest creating an email alias on sign-up forms.`,
                        checked: settings.autosuggest.email,
                        onChange: (checked) => onSettingsUpdate({ autosuggest: { email: checked } }),
                    },
                ],
            },
            {
                label: c('Label').t`Passkeys`,
                settings: [
                    {
                        label: c('Label').t`Save passkeys`,
                        description: c('Info').t`${PASS_APP_NAME} will suggest saving passkeys.`,
                        checked: settings.passkeys.create,
                        onChange: (checked) => onSettingsUpdate({ passkeys: { create: checked } }),
                    },
                    {
                        label: c('Label').t`Authenticate with passkeys`,
                        description: c('Info').t`${PASS_APP_NAME} will suggest authenticating using saved passkeys`,
                        checked: settings.passkeys.get,
                        onChange: (checked) => onSettingsUpdate({ passkeys: { get: checked } }),
                    },
                ],
            },
            {
                label: c('Label').t`Display`,
                settings: [
                    {
                        label: c('Label').t`Show website favicons`,
                        description: c('Info')
                            .t`${PASS_APP_NAME} will display the item favicon via ${BRAND_NAME} anonymized image proxy.`,
                        checked: settings.loadDomainImages,
                        onChange: (loadDomainImages) => onSettingsUpdate({ loadDomainImages }),
                    },
                    {
                        label: c('Label').t`Always show username field`,
                        description: c('Info')
                            .t`When creating/editing a Login on ${PASS_APP_NAME} the 'username' input will always be visible.`,
                        checked: Boolean(settings.showUsernameField),
                        onChange: (showUsernameField) => {
                            onSettingsUpdate({ showUsernameField });
                            onTelemetry(
                                TelemetryEventName.PassSettingsDisplayUsername,
                                { checked: showUsernameField },
                                {}
                            );
                        },
                    },
                ],
            },
        ];
    };

export const Behaviors: FC = () => {
    const dispatch = useDispatch();
    const settings = useSelector(selectProxiedSettings);
    const loading = useSelector(selectRequestInFlight(settingsEditRequest('behaviors')));
    const identityEnabled = useFeatureFlag(PassFeature.PassIdentityV1);

    return (
        <>
            {useMemo(
                () => getSettings(settings, identityEnabled),
                [settings, identityEnabled]
            )(dispatch).map((section, i) => (
                <SettingsPanel key={`settings-section-${i}`} title={section.label}>
                    {section.settings
                        .filter((setting) => !setting.hidden)
                        .map((setting, j) => (
                            <Checkbox
                                key={`setting-${i}-${j}`}
                                className={clsx(j !== section.settings.length - 1 && 'mb-4')}
                                checked={setting.checked}
                                disabled={setting.disabled || loading}
                                loading={loading}
                                onChange={() => setting.onChange(!setting.checked)}
                            >
                                <span>
                                    {setting.label}
                                    <span className="block color-weak text-sm">{setting.description}</span>
                                </span>
                            </Checkbox>
                        ))}
                    {section.extra && <hr className="mt-2 mb-4 border-weak" />}
                    {section.extra}
                </SettingsPanel>
            ))}

            <PauseList />
        </>
    );
};
