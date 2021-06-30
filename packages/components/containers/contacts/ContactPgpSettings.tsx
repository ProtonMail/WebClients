import React, { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';

import { getIsValidForSending, getKeyEncryptionCapableStatus } from '@proton/shared/lib/keys/publicKeys';
import { MailSettings, ContactPublicKeyModel } from '@proton/shared/lib/interfaces';

import { CONTACT_PGP_SCHEMES, MIME_TYPES_MORE } from '@proton/shared/lib/constants';
import ContactSchemeSelect from '../../components/contacts/ContactSchemeSelect';
import ContactKeysTable from '../../components/contacts/ContactKeysTable';
import { useNotifications } from '../../hooks';
import { Alert, Row, Label, Info, Field, Toggle } from '../../components';
import SelectKeyFiles from '../keys/shared/SelectKeyFiles';

interface Props {
    model: ContactPublicKeyModel;
    setModel: Dispatch<SetStateAction<ContactPublicKeyModel>>;
    mailSettings?: MailSettings;
}

const ContactPgpSettings = ({ model, setModel, mailSettings }: Props) => {
    const { createNotification } = useNotifications();

    const hasApiKeys = !!model.publicKeys.apiKeys.length;
    const hasPinnedKeys = !!model.publicKeys.pinnedKeys.length;

    const isPrimaryPinned = hasApiKeys && model.trustedFingerprints.has(model.publicKeys.apiKeys[0].getFingerprint());
    const noPinnedKeyCanSend =
        hasPinnedKeys &&
        !model.publicKeys.pinnedKeys.some((publicKey) => getIsValidForSending(publicKey.getFingerprint(), model));
    const askForPinning = hasPinnedKeys && hasApiKeys && (noPinnedKeyCanSend || !isPrimaryPinned);

    /**
     * Add / update keys to model
     * @param {Array<PublicKey>} files
     */
    const handleUploadKeys = async (files: OpenPGPKey[]) => {
        if (!files.length) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Invalid public key file`,
            });
        }
        const pinnedKeys = [...model.publicKeys.pinnedKeys];
        const trustedFingerprints = new Set(model.trustedFingerprints);
        const encryptionCapableFingerprints = new Set(model.encryptionCapableFingerprints);

        await Promise.all(
            files.map(async (publicKey) => {
                if (!publicKey.isPublic()) {
                    // do not allow to upload private keys
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Invalid public key file`,
                    });
                    return;
                }
                const fingerprint = publicKey.getFingerprint();
                const canEncrypt = await getKeyEncryptionCapableStatus(publicKey);
                if (canEncrypt) {
                    encryptionCapableFingerprints.add(fingerprint);
                }
                if (!trustedFingerprints.has(fingerprint)) {
                    trustedFingerprints.add(fingerprint);
                    pinnedKeys.push(publicKey);
                    return;
                }
                const indexFound = pinnedKeys.findIndex((publicKey) => publicKey.getFingerprint() === fingerprint);
                createNotification({ text: c('Info').t`Duplicate key updated`, type: 'warning' });
                pinnedKeys.splice(indexFound, 1, publicKey);
            })
        );

        setModel({
            ...model,
            publicKeys: { ...model.publicKeys, pinnedKeys },
            trustedFingerprints,
            encryptionCapableFingerprints,
        });
    };

    return (
        <>
            {!hasApiKeys && (
                <Alert learnMore="https://protonmail.com/support/knowledge-base/how-to-use-pgp/">
                    {c('Info')
                        .t`Setting up PGP allows you to send end-to-end encrypted emails with a non-ProtonMail user that uses a PGP compatible service.`}
                </Alert>
            )}
            {!!model.publicKeys.pinnedKeys.length && askForPinning && (
                <Alert type="error">{c('Info')
                    .t`Address Verification with Trusted Keys is enabled for this address. To be able to send to this address, first trust public keys that can be used for sending.`}</Alert>
            )}
            {model.pgpAddressDisabled && (
                <Alert type="warning">{c('Info')
                    .t`This address is disabled. To be able to send to this address, the owner must first enable the address.`}</Alert>
            )}
            {hasApiKeys && (
                <Alert learnMore="https://protonmail.com/support/knowledge-base/address-verification/">{c('Info')
                    .t`To use Address Verification, you must trust one or more available public keys, including the one you want to use for sending. This prevents the encryption keys from being faked.`}</Alert>
            )}
            {!hasApiKeys && !model.sign && (
                <Alert learnMore="https://protonmail.com/support/knowledge-base/how-to-use-pgp/">{c('Info')
                    .t`Only change these settings if you are using PGP with non-ProtonMail recipients.`}</Alert>
            )}
            {model.isPGPExternalWithoutWKDKeys && noPinnedKeyCanSend && (
                <Alert type="error" learnMore="https://protonmail.com/support/knowledge-base/how-to-use-pgp/">{c('Info')
                    .t`None of the uploaded keys are valid for encryption. Encryption is automatically disabled.`}</Alert>
            )}
            {!hasApiKeys && (
                <Row>
                    <Label htmlFor="encrypt-toggle">
                        {c('Label').t`Encrypt emails`}
                        <Info
                            className="ml0-5"
                            title={c('Tooltip')
                                .t`Email encryption forces email signature to help authenticate your sent messages`}
                        />
                    </Label>
                    <Field className="pt0-5">
                        <Toggle
                            id="encrypt-toggle"
                            checked={model.encrypt}
                            disabled={!model.publicKeys.pinnedKeys.length || noPinnedKeyCanSend}
                            onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                setModel({
                                    ...model,
                                    encrypt: target.checked,
                                    sign: target.checked ? true : model.sign,
                                })
                            }
                        />
                    </Field>
                </Row>
            )}
            {!hasApiKeys && (
                <Row>
                    <Label htmlFor="sign-toggle">
                        {c('Label').t`Sign emails`}
                        <Info
                            className="ml0-5"
                            title={c('Tooltip')
                                .t`Digitally signing emails helps authenticating that messages are sent by you`}
                        />
                    </Label>
                    <Field className="pt0-5">
                        <Toggle
                            id="sign-toggle"
                            checked={model.sign}
                            disabled={model.encrypt}
                            onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                setModel({
                                    ...model,
                                    sign: target.checked,
                                    mimeType: MIME_TYPES_MORE.AUTOMATIC,
                                })
                            }
                        />
                    </Field>
                </Row>
            )}
            {!model.isPGPInternal && (
                <Row>
                    <Label>
                        {c('Label').t`Cryptographic scheme`}
                        <Info
                            className="ml0-5"
                            title={c('Tooltip')
                                .t`Select the PGP scheme to be used when signing or encrypting to a user. Note that PGP/Inline forces plain text messages`}
                        />
                    </Label>
                    <Field>
                        <ContactSchemeSelect
                            value={model.scheme}
                            mailSettings={mailSettings}
                            onChange={(scheme: CONTACT_PGP_SCHEMES) => setModel({ ...model, scheme })}
                        />
                    </Field>
                </Row>
            )}
            <Row>
                <Label>
                    {c('Label').t`Public keys`}
                    <Info
                        className="ml0-5"
                        title={c('Tooltip')
                            .t`Upload a public key to enable sending end-to-end encrypted emails to this email`}
                    />
                </Label>
                <Field className="on-mobile-mt0-5">
                    {model.isPGPExternalWithoutWKDKeys && <SelectKeyFiles onFiles={handleUploadKeys} multiple />}
                </Field>
            </Row>
            {(hasApiKeys || hasPinnedKeys) && <ContactKeysTable model={model} setModel={setModel} />}
        </>
    );
};

export default ContactPgpSettings;
