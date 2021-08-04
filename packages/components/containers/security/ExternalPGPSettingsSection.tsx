import * as React from 'react';
import { c } from 'ttag';

import { PACKAGE_TYPE } from '@proton/shared/lib/constants';
import { updateAttachPublicKey, updatePGPScheme, updateSign } from '@proton/shared/lib/api/mailSettings';

import { ConfirmModal, Alert, Info, Toggle } from '../../components';
import { useMailSettings, useEventManager, useApi, useLoading, useNotifications, useModals } from '../../hooks';

import { SettingsSection, SettingsParagraph } from '../account';

import PGPSchemeSelect from './PGPSchemeSelect';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

const ExternalPGPSettingsSection = () => {
    const [{ Sign = 0, AttachPublicKey = 0, PGPScheme = PACKAGE_TYPE.SEND_PGP_MIME } = {}] = useMailSettings();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const [loadingSign, withLoadingSign] = useLoading();
    const [loadingAttach, withLoadingAttach] = useLoading();
    const [loadingScheme, withLoadingScheme] = useLoading();

    const handleChangeSign = async ({ target }: React.ChangeEvent<HTMLInputElement>) => {
        await api(updateSign(+target.checked));
        await call();
        createNotification({ text: c('Info').t`Encryption setting updated` });
    };

    const askSign = () => {
        return new Promise((resolve) => {
            createModal(
                <ConfirmModal
                    confirm={c('Action').t`Yes`}
                    cancel={c('Action').t`No`}
                    title={c('Title').t`Automatically sign outgoing messages?`}
                    onConfirm={() => resolve(true)}
                    onClose={() => resolve(false)}
                >
                    <Alert>
                        {c('Info')
                            .t`PGP clients are more likely to automatically detect your PGP keys if outgoing messages are signed.`}
                    </Alert>
                </ConfirmModal>
            );
        });
    };

    const handleChangeAttach = async ({ target }: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = +target.checked;
        if (newValue && !Sign && (await askSign())) {
            await api(updateSign(1));
        }
        await api(updateAttachPublicKey(newValue));
        await call();
        createNotification({ text: c('Info').t`Encryption setting updated` });
    };

    const handleChangeScheme = async ({ target }: React.ChangeEvent<HTMLSelectElement>) => {
        await api(updatePGPScheme(+target.value));
        await call();
        createNotification({ text: c('Info').t`Encryption setting updated` });
    };

    return (
        <SettingsSection>
            <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/how-to-use-pgp/">
                {c('Info').t`Only change these settings if you are using PGP with non-ProtonMail recipients.`}
            </SettingsParagraph>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="signToggle" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Sign external messages`}</span>
                        <Info
                            url="https://protonmail.com/support/knowledge-base/what-is-a-digital-signature/"
                            title={c('Tooltip sign external messages')
                                .t`Automatically sign all your outgoing messages so users can verify the authenticity of your messages. This is done in combination with the default PGP settings which can be configured below.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <Toggle
                        id="signToggle"
                        checked={!!Sign}
                        onChange={(e) => withLoadingSign(handleChangeSign(e))}
                        loading={loadingSign}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="attachPublicKeyToggle" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Attach public key`}</span>
                        <Info
                            url="https://protonmail.com/support/knowledge-base/how-to-use-pgp"
                            title={c('Tooltip automatically attach public key')
                                .t`This automatically adds your public key to each message you send. Recipients can use this to verify the authenticity of your messages and send encrypted messages to you.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <Toggle
                        id="attachPublicKeyToggle"
                        checked={!!AttachPublicKey}
                        onChange={(e) => withLoadingAttach(handleChangeAttach(e))}
                        loading={loadingAttach}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="PGPSchemeSelect" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Default PGP settings`}</span>
                        <Info
                            url="https://protonmail.com/support/knowledge-base/pgp-mime-pgp-inline/"
                            title={c('Tooltip default pgp scheme')
                                .t`Select the default PGP settings used to sign or encrypt messages with non-ProtonMail PGP users. Note that Inline PGP forces plain text messages. Learn more`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <PGPSchemeSelect
                        id="PGPSchemeSelect"
                        pgpScheme={PGPScheme}
                        onChange={(e) => withLoadingScheme(handleChangeScheme(e))}
                        disabled={loadingScheme}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};

export default ExternalPGPSettingsSection;
