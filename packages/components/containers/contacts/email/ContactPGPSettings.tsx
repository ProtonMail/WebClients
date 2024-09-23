import type { ChangeEvent, Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Label from '@proton/components/components/label/Label';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import { CryptoProxy } from '@proton/crypto';
import type { CONTACT_PGP_SCHEMES } from '@proton/shared/lib/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { ContactPublicKeyModelWithApiKeySource, MailSettings } from '@proton/shared/lib/interfaces';
import type { ArmoredKeyWithInfo } from '@proton/shared/lib/keys';
import { getIsValidForSending, getKeyEncryptionCapableStatus } from '@proton/shared/lib/keys/publicKeys';

import Field from '../../../components/container/Field';
import Row from '../../../components/container/Row';
import { useNotifications } from '../../../hooks';
import SelectKeyFiles from '../../keys/shared/SelectKeyFiles';
import ContactKeysTable from './ContactKeysTable';
import ContactSchemeSelect from './ContactSchemeSelect';
import SignEmailsSelect from './SignEmailsSelect';

interface Props {
    model: ContactPublicKeyModelWithApiKeySource;
    setModel: Dispatch<SetStateAction<ContactPublicKeyModelWithApiKeySource | undefined>>;
    mailSettings?: MailSettings;
}

const ContactPGPSettings = ({ model, setModel, mailSettings }: Props) => {
    const { createNotification } = useNotifications();

    const hasApiKeys = !!model.publicKeys.apiKeys.length; // internal or WKD keys
    const hasPinnedKeys = !!model.publicKeys.pinnedKeys.length;

    const isPrimaryPinned = hasApiKeys && model.trustedFingerprints.has(model.publicKeys.apiKeys[0].getFingerprint());
    const noPinnedKeyCanSend =
        hasPinnedKeys &&
        !model.publicKeys.pinnedKeys.some((publicKey) => getIsValidForSending(publicKey.getFingerprint(), model));
    const noApiKeyCanSend =
        hasApiKeys &&
        !model.publicKeys.apiKeys.some((publicKey) => getIsValidForSending(publicKey.getFingerprint(), model));
    const askForPinning = hasPinnedKeys && hasApiKeys && (noPinnedKeyCanSend || !isPrimaryPinned);
    const hasCompromisedPinnedKeys = model.publicKeys.pinnedKeys.some((key) =>
        model.compromisedFingerprints.has(key.getFingerprint())
    );
    const canUploadKeys = model.isPGPExternalWithoutExternallyFetchedKeys;

    /**
     * Add / update keys to model
     * @param {Array<PublicKey>} keys
     */
    const handleUploadKeys = async (keys: ArmoredKeyWithInfo[]) => {
        if (!keys.length) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Invalid public key file`,
            });
        }
        const pinnedKeys = [...model.publicKeys.pinnedKeys];
        const trustedFingerprints = new Set(model.trustedFingerprints);
        const encryptionCapableFingerprints = new Set(model.encryptionCapableFingerprints);

        // Each promise returns true if the corresponding key was processed successfully
        const successStatuses = await Promise.all(
            keys.map(async ({ keyIsPrivate, armoredKey }) => {
                if (keyIsPrivate) {
                    // do not allow to upload private keys
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Invalid public key file`,
                    });
                    return false;
                }

                try {
                    const publicKey = await CryptoProxy.importPublicKey({ armoredKey, checkCompatibility: true });

                    const fingerprint = publicKey.getFingerprint();
                    const canEncrypt = await getKeyEncryptionCapableStatus(publicKey);
                    if (canEncrypt) {
                        encryptionCapableFingerprints.add(fingerprint);
                    }
                    if (!trustedFingerprints.has(fingerprint)) {
                        trustedFingerprints.add(fingerprint);
                        pinnedKeys.push(publicKey);
                        return true;
                    }
                    const indexFound = pinnedKeys.findIndex((publicKey) => publicKey.getFingerprint() === fingerprint);
                    createNotification({ text: c('Info').t`Duplicate key updated`, type: 'warning' });
                    pinnedKeys.splice(indexFound, 1, publicKey);
                    return true;
                } catch (e: any) {
                    createNotification({
                        type: 'error',
                        text: e.message,
                    });
                    return false;
                }
            })
        );

        setModel({
            ...model,
            // automatically enable encryption on (successful) key upload
            encrypt: model.encrypt || successStatuses.some(Boolean),
            publicKeys: { ...model.publicKeys, pinnedKeys },
            trustedFingerprints,
            encryptionCapableFingerprints,
        });
    };

    return (
        <>
            {!hasApiKeys && (
                <Alert className="mb-4">
                    {c('Info')
                        .t`Setting up PGP allows you to send end-to-end encrypted emails with a non-${BRAND_NAME} user that uses a PGP compatible service.`}
                    <div>
                        <Href href={getKnowledgeBaseUrl('/how-to-use-pgp')}>{c('Link').t`Learn more`}</Href>
                    </div>
                </Alert>
            )}
            {!!model.publicKeys.pinnedKeys.length && askForPinning && (
                <Alert className="mb-4" type="error">{c('Info')
                    .t`Address Verification with Trusted Keys is enabled for this address. To be able to send to this address, first trust public keys that can be used for sending.`}</Alert>
            )}
            {hasCompromisedPinnedKeys && (
                <Alert className="mb-4" type="warning">{c('Info')
                    .t`One or more of your trusted keys were marked "compromised" by their owner. We recommend that you "untrust" these keys.`}</Alert>
            )}
            {model.pgpAddressDisabled && (
                <Alert className="mb-4" type="warning">{c('Info')
                    .t`This address is disabled. To be able to send to this address, the owner must first enable the address.`}</Alert>
            )}
            {model.isInternalWithDisabledE2EEForMail && (
                <Alert className="mb-4" type="warning">{c('Info')
                    .t`The owner of this address has disabled end-to-end encryption. To be able to send encrypted emails to this address, the owner must re-enable end-to-end encryption.`}</Alert>
            )}
            {hasApiKeys && !hasPinnedKeys && !model.isInternalWithDisabledE2EEForMail && (
                <Alert className="mb-4">
                    {c('Info')
                        .t`To use Address Verification, you must trust one or more available public keys, including the one you want to use for sending. This prevents the encryption keys from being faked.`}
                    <div>
                        <Href href={getKnowledgeBaseUrl('/address-verification')}>{c('Link').t`Learn more`}</Href>
                    </div>
                </Alert>
            )}
            {model.isPGPExternal && (noPinnedKeyCanSend || noApiKeyCanSend) && model.encrypt && (
                <Alert className="mb-4" type="error">
                    {c('Info')
                        .t`None of the uploaded keys are valid for encryption. To be able to send messages to this address, please upload a valid key or disable "Encrypt emails".`}
                    <div>
                        <Href href={getKnowledgeBaseUrl('/how-to-use-pgp')}>{c('Link').t`Learn more`}</Href>
                    </div>
                </Alert>
            )}
            {model.isPGPExternal && (
                <>
                    <Row>
                        <Label htmlFor="encrypt-toggle">
                            {c('Label').t`Encrypt emails`}
                            <Info
                                className="ml-2"
                                title={c('Tooltip')
                                    .t`Email encryption forces email signature to help authenticate your sent messages`}
                            />
                        </Label>
                        <Field className="pt-2 flex items-center">
                            <Toggle
                                className="mr-2"
                                id="encrypt-toggle"
                                checked={model.encrypt}
                                disabled={!hasPinnedKeys && !hasApiKeys}
                                onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                    setModel({
                                        ...model,
                                        encrypt: target.checked,
                                    })
                                }
                            />
                            <div className="flex-1">
                                {model.encrypt && c('Info').t`Emails are automatically signed`}
                            </div>
                        </Field>
                    </Row>
                    <Row>
                        <Label htmlFor="sign-select">
                            {c('Label').t`Sign emails`}
                            <Info
                                className="ml-2"
                                title={c('Tooltip')
                                    .t`Digitally signing emails helps authenticating that messages are sent by you`}
                            />
                        </Label>
                        <Field>
                            <SignEmailsSelect
                                id="sign-select"
                                value={model.encrypt ? true : model.sign}
                                mailSettings={mailSettings}
                                disabled={model.encrypt}
                                onChange={(sign?: boolean) => setModel({ ...model, sign })}
                            />
                        </Field>
                    </Row>
                    <Row>
                        <Label>
                            {c('Label').t`PGP scheme`}
                            <Info
                                className="ml-2"
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
                </>
            )}
            {canUploadKeys && (
                <Row>
                    <Label>
                        {c('Label').t`Public keys`}
                        {
                            <Info
                                className="ml-2"
                                title={c('Tooltip')
                                    .t`Upload a public key to enable sending end-to-end encrypted emails to this email`}
                            />
                        }
                    </Label>
                    <Field className="mt-2 md:mt-0">
                        <SelectKeyFiles onUpload={handleUploadKeys} multiple />
                    </Field>
                </Row>
            )}
            {!canUploadKeys && (
                <Row>
                    <Label>{c('Label').t`Public keys`}</Label>
                </Row>
            )}
            {(hasApiKeys || hasPinnedKeys) && <ContactKeysTable model={model} setModel={setModel} />}
        </>
    );
};

export default ContactPGPSettings;
