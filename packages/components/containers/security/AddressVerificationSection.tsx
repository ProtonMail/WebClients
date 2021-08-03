import * as React from 'react';
import { c } from 'ttag';
import { updatePromptPin } from '@proton/shared/lib/api/mailSettings';
import { Info, Toggle } from '../../components';
import { useApi, useLoading, useMailSettings, useEventManager, useNotifications } from '../../hooks';

import { SettingsSection, SettingsParagraph } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

const AddressVerificationSection = () => {
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [{ PromptPin = 0 } = {}] = useMailSettings();

    const handleChange = async ({ target }: React.ChangeEvent<HTMLInputElement>) => {
        await api(updatePromptPin(+target.checked));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <SettingsSection>
            <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/address-verification/">
                {c('Info')
                    .t`Address verification is an advanced security feature. Only turn this on if you know what it does.`}
            </SettingsParagraph>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="trustToggle" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Prompt to trust keys`}</span>
                        <Info
                            url="https://protonmail.com/support/knowledge-base/address-verification/"
                            title={c('Tooltip prompt to trust keys')
                                .t`When receiving an email from another ProtonMail user who does not have trusted keys in your contacts, a banner will ask if you want to enable trusted keys.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <Toggle
                        id="trustToggle"
                        loading={loading}
                        checked={!!PromptPin}
                        onChange={(e) => withLoading(handleChange(e))}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};

export default AddressVerificationSection;
