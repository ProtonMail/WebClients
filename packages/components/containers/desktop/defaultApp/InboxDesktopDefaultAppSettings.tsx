import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { useElectronDefaultApp } from './useElectronDefaultApp';

export function InboxDesktopDefaultAppSettings() {
    const { enabled, isDefault, shouldCheck, setShouldCheck, triggerPrompt, Prompt } = useElectronDefaultApp();

    if (!isElectronMail || !enabled) {
        return null;
    }

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor="electronDefaultApp">
                    <span className="pr-2 text-semibold">{c('Title').t`Check your default mail application`}</span>
                    <Info
                        url={getKnowledgeBaseUrl('/set-default-email-handler')}
                        title={c('Info')
                            .t`When enabled, we will check if ${MAIL_APP_NAME} is your default mail application and notify you if it is not.`}
                    />
                </label>
                <p className="color-weak m-0 text-sm">
                    {isDefault ? (
                        c('Description').t`${MAIL_APP_NAME} is your default mail application.`
                    ) : (
                        <>
                            {c('Description').t`${MAIL_APP_NAME} is not your default mail application.`}{' '}
                            <InlineLinkButton onClick={triggerPrompt}>{c('Action')
                                .t`Set as default mail application`}</InlineLinkButton>
                        </>
                    )}
                </p>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <Toggle
                    disabled={isDefault}
                    id="electronDefaultApp"
                    checked={isDefault || shouldCheck}
                    onChange={(event) => setShouldCheck(event.target.checked)}
                />
            </SettingsLayoutRight>

            {Prompt}
        </SettingsLayout>
    );
}

export default InboxDesktopDefaultAppSettings;
