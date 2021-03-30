import React from 'react';
import { c } from 'ttag';
import { updateAttachPublicKey, updatePGPScheme, updateSign } from 'proton-shared/lib/api/mailSettings';
import { ConfirmModal, Alert, Row, Field, Label, Info, Toggle } from '../../components';
import { useMailSettings, useEventManager, useApi, useLoading, useNotifications, useModals } from '../../hooks';

import PGPSchemeSelect from './PGPSchemeSelect';

const ExternalPGPSettingsSection = () => {
    const [{ Sign, AttachPublicKey, PGPScheme } = {}] = useMailSettings();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const [loadingSign, withLoadingSign] = useLoading();
    const [loadingAttach, withLoadingAttach] = useLoading();
    const [loadingScheme, withLoadingScheme] = useLoading();

    const handleChangeSign = async ({ target }) => {
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

    const handleChangeAttach = async ({ target }) => {
        const newValue = +target.checked;
        if (newValue && !Sign && (await askSign(newValue))) {
            await api(updateSign(1));
        }
        await api(updateAttachPublicKey(newValue));
        await call();
        createNotification({ text: c('Info').t`Encryption setting updated` });
    };

    const handleChangeScheme = async ({ target }) => {
        await api(updatePGPScheme(+target.value));
        await call();
        createNotification({ text: c('Info').t`Encryption setting updated` });
    };

    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/how-to-use-pgp/">
                {c('Info').t`Only change these settings if you are using PGP with non-ProtonMail recipients.`}
            </Alert>
            <Row>
                <Label htmlFor="signToggle">
                    <span className="mr0-5">{c('Label').t`Sign external messages`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/what-is-a-digital-signature/"
                        title={c('Tooltip sign external messages')
                            .t`Automatically sign all your outgoing messages so users can verify the authenticity of your messages. This is done in combination with the Default PGP Scheme that is selected down below.`}
                    />
                </Label>
                <Field className="pt0-5">
                    <Toggle
                        id="signToggle"
                        checked={!!Sign}
                        onChange={(e) => withLoadingSign(handleChangeSign(e))}
                        loading={loadingSign}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="attachPublicKeyToggle">
                    <span className="mr0-5">{c('Label').t`Attach public key`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/how-to-use-pgp"
                        title={c('Tooltip automatically attach public key')
                            .t`This automatically adds your public key to each message you send. Recipients can use this to verify the authenticity of your messages and send encrypted messages to you.`}
                    />
                </Label>
                <Field className="pt0-5">
                    <Toggle
                        id="attachPublicKeyToggle"
                        checked={!!AttachPublicKey}
                        onChange={(e) => withLoadingAttach(handleChangeAttach(e))}
                        loading={loadingAttach}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="PGPSchemeSelect">
                    <span className="mr0-5">{c('Label').t`Default PGP Scheme`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/pgp-mime-pgp-inline/"
                        title={c('Tooltip default pgp scheme')
                            .t`Select the default PGP scheme to be used when signing or encrypting to an user. Note that PGP/Inline forces plain text messages. Click for more info.`}
                    />
                </Label>
                <Field>
                    <PGPSchemeSelect
                        id="PGPSchemeSelect"
                        pgpScheme={PGPScheme}
                        onChange={(e) => withLoadingScheme(handleChangeScheme(e))}
                        disabled={loadingScheme}
                    />
                </Field>
            </Row>
        </>
    );
};

export default ExternalPGPSettingsSection;
