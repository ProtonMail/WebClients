import { type VFC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { Checkbox } from '@proton/components/components';
import { selectProxiedSettings, selectRequestInFlight } from '@proton/pass/store';
import { settingEditIntent } from '@proton/pass/store/actions';
import { settingsEdit } from '@proton/pass/store/actions/requests';
import type { ProxiedSettings, SettingsState } from '@proton/pass/store/reducers/settings';
import type { RecursivePartial } from '@proton/pass/types';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

type SettingDefinition = {
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (value: boolean) => void;
};

type SettingsSection = {
    label: string;
    description?: string;
    settings: SettingDefinition[];
};

const getSettings = (
    settings: SettingsState,
    onSettingsUpdate: (setting: RecursivePartial<ProxiedSettings>) => void
): SettingsSection[] => [
    {
        label: c('Label').t`Autofill`,
        settings: [
            {
                label: c('Label').t`Display ${PASS_APP_NAME} icon on login fields`,
                description: c('Info')
                    .t`If enabled, you can quickly autofill your credentials by clicking on the ${PASS_APP_NAME} icon.`,
                checked: settings.autofill.inject,
                onChange: (checked) =>
                    onSettingsUpdate({ autofill: { inject: checked, ...(!checked ? { openOnFocus: false } : {}) } }),
            },
            {
                label: c('Label').t`Automatically open autofill when focusing login fields`,
                description: c('Info').t`If enabled, the autosave dropdown will automatically open on field focus.`,
                checked: settings.autofill.inject && settings.autofill.openOnFocus,
                disabled: !settings.autofill.inject,
                onChange: (checked) => onSettingsUpdate({ autofill: { openOnFocus: checked } }),
            },
        ],
    },
    {
        label: c('Label').t`Autosave`,
        settings: [
            {
                label: c('Label').t`Prompt for auto-save`,
                description: c('Info')
                    .t`If disabled, ${PASS_APP_NAME} will not prompt you to save or update credentials.`,
                checked: settings.autosave.prompt,
                onChange: (checked) => onSettingsUpdate({ autosave: { prompt: checked } }),
            },
        ],
    },
    {
        label: c('Label').t`Autosuggest`,
        settings: [
            {
                label: c('Label').t`Passwords`,
                description: c('Info')
                    .t`If disabled, ${PASS_APP_NAME} will not suggest creating strong passwords on sign-up forms.`,
                checked: settings.autosuggest.password,
                onChange: (checked) => onSettingsUpdate({ autosuggest: { password: checked } }),
            },
            {
                label: c('Label').t`Email aliases`,
                description: c('Info')
                    .t`If disabled, ${PASS_APP_NAME} will not suggest creating an email alias on sign-up forms.`,
                checked: settings.autosuggest.email,
                onChange: (checked) => onSettingsUpdate({ autosuggest: { email: checked } }),
            },
        ],
    },
    {
        label: c('Label').t`Display`,
        settings: [
            {
                label: c('Label').t`Show website thumbnails`,
                description: c('Info')
                    .t`If disabled, ${PASS_APP_NAME} will not display the item favicon via ${BRAND_NAME} anonymised image proxy.`,
                checked: settings.loadDomainImages,
                onChange: (loadDomainImages) => onSettingsUpdate({ loadDomainImages }),
            },
        ],
    },
];

export const SettingsPanel: VFC = () => {
    const settings = useSelector(selectProxiedSettings);
    const dispatch = useDispatch();
    const loading = useSelector(selectRequestInFlight(settingsEdit('general')));

    return (
        <>
            {getSettings(settings, (update) => dispatch(settingEditIntent(update))).map((section, i) => (
                <Card key={`settings-section-${i}`} rounded className="mb-4 p-3">
                    <strong className="color-norm block">{section.label}</strong>

                    <hr className="my-2 border-weak" />
                    {section.settings.map((setting, j) => (
                        <Checkbox
                            key={`setting-${i}-${j}`}
                            className={clsx(j !== section.settings.length - 1 && 'mb-4')}
                            checked={setting.checked}
                            disabled={setting.disabled || loading}
                            loading={loading}
                            onChange={() => setting.onChange(!setting.checked)}
                        >
                            <span className="ml-3">
                                {setting.label}
                                <span className="block color-weak text-sm">{setting.description}</span>
                            </span>
                        </Checkbox>
                    ))}
                </Card>
            ))}
        </>
    );
};
