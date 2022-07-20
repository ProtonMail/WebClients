import { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    getVCardProperties,
    fromVCardProperties,
    createContactPropertyUid,
} from '@proton/shared/lib/contacts/properties';
import getPublicKeysEmailHelper from '@proton/shared/lib/api/helpers/getPublicKeysEmailHelper';
import { extractScheme } from '@proton/shared/lib/api/helpers/mailSettings';
import {
    sortPinnedKeys,
    sortApiKeys,
    getContactPublicKeyModel,
    getIsValidForSending,
    getVerifyingKeys,
} from '@proton/shared/lib/keys/publicKeys';
import uniqueBy from '@proton/utils/uniqueBy';
import { getKeyInfoFromProperties, getMimeTypeVcard, toKeyProperty } from '@proton/shared/lib/contacts/keyProperties';
import { ContactPublicKeyModel } from '@proton/shared/lib/interfaces';
import { VCARD_KEY_FIELDS } from '@proton/shared/lib/contacts/constants';
import {
    CONTACT_MIME_TYPES,
    MAIL_APP_NAME,
    MIME_TYPES,
    MIME_TYPES_MORE,
    PGP_SCHEMES,
} from '@proton/shared/lib/constants';
import { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import ContactMIMETypeSelect from './ContactMIMETypeSelect';
import { useApi, useEventManager, useNotifications, useLoading, useMailSettings } from '../../../hooks';
import {
    Alert,
    Label,
    Field,
    Row,
    Info,
    Button,
    UnderlineButton,
    ModalProps,
    ModalTwo,
    ModalTwoHeader,
    ModalTwoContent,
    ModalTwoFooter,
} from '../../../components';
import { useSaveVCardContact } from '../hooks/useSaveVCardContact';
import ContactPGPSettings from './ContactPGPSettings';

const { PGP_INLINE } = PGP_SCHEMES;

export interface ContactEmailSettingsProps {
    contactID: string;
    vCardContact: VCardContact;
    emailProperty: VCardProperty<string>;
    onClose?: () => void;
}

type Props = ContactEmailSettingsProps & ModalProps;

const ContactEmailSettingsModal = ({ contactID, vCardContact, emailProperty, ...rest }: Props) => {
    const { value: emailAddressValue, group: emailGroup } = emailProperty;
    const emailAddress = emailAddressValue as string;

    const api = useApi();
    const { call } = useEventManager();
    const [model, setModel] = useState<ContactPublicKeyModel>();
    const [showPgpSettings, setShowPgpSettings] = useState(false);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [mailSettings] = useMailSettings();

    const saveVCardContact = useSaveVCardContact();

    // Avoid nested ternary
    let isMimeTypeFixed: boolean;
    if (model?.isPGPInternal) {
        isMimeTypeFixed = false;
    } else if (model?.isPGPExternalWithWKDKeys) {
        isMimeTypeFixed = true;
    } else {
        isMimeTypeFixed = !!model?.sign;
    }

    const hasPGPInline = model && mailSettings ? extractScheme(model, mailSettings) === PGP_INLINE : false;

    /**
     * Initialize the key model for the modal
     */
    const prepare = async () => {
        const apiKeysConfig = await getPublicKeysEmailHelper(api, emailAddress, true);
        const pinnedKeysConfig = await getKeyInfoFromProperties(vCardContact, emailGroup || '');
        const publicKeyModel = await getContactPublicKeyModel({
            emailAddress,
            apiKeysConfig,
            pinnedKeysConfig: { ...pinnedKeysConfig, isContact: true },
        });
        setModel(publicKeyModel);
    };

    /**
     * Collect keys from the model to save
     * @param group attached to the current email address
     * @returns key properties to save in the vCard
     */
    const getKeysProperties = (group: string, model: ContactPublicKeyModel) => {
        const allKeys = model?.isPGPInternal
            ? [...model.publicKeys.apiKeys]
            : [...model.publicKeys?.apiKeys, ...model.publicKeys.pinnedKeys];
        const trustedKeys = allKeys.filter((publicKey) => model.trustedFingerprints.has(publicKey.getFingerprint()));
        const uniqueTrustedKeys = uniqueBy(trustedKeys, (publicKey) => publicKey.getFingerprint());
        return uniqueTrustedKeys.map((publicKey, index) => toKeyProperty({ publicKey, group, index }));
    };

    /**
     * Save relevant key properties in the vCard
     */
    const handleSubmit = async (model?: ContactPublicKeyModel) => {
        if (!model) {
            return;
        }
        const properties = getVCardProperties(vCardContact);
        const newProperties = properties.filter(({ field, group }) => {
            return !VCARD_KEY_FIELDS.includes(field) || (group && group !== emailGroup);
        });
        newProperties.push(...getKeysProperties(emailGroup || '', model));

        const mimeType = getMimeTypeVcard(model.mimeType);
        if (mimeType) {
            newProperties.push({
                field: 'x-pm-mimetype',
                value: mimeType,
                group: emailGroup,
                uid: createContactPropertyUid(),
            });
        }

        if (model.isPGPExternalWithoutWKDKeys && model.encrypt !== undefined) {
            newProperties.push({
                field: 'x-pm-encrypt',
                value: `${model.encrypt}`,
                group: emailGroup,
                uid: createContactPropertyUid(),
            });
        }
        if (model.isPGPExternalWithoutWKDKeys && model.sign !== undefined) {
            newProperties.push({
                field: 'x-pm-sign',
                value: `${model.sign}`,
                group: emailGroup,
                uid: createContactPropertyUid(),
            });
        }
        if (model.isPGPExternal && model.scheme) {
            newProperties.push({
                field: 'x-pm-scheme',
                value: model.scheme,
                group: emailGroup,
                uid: createContactPropertyUid(),
            });
        }

        const newVCardContact = fromVCardProperties(newProperties);

        try {
            await saveVCardContact(contactID, newVCardContact);

            await call();

            createNotification({ text: c('Success').t`Preferences saved` });
        } finally {
            rest.onClose?.();
        }
    };

    useEffect(() => {
        /**
         * On the first render, initialize the model
         */
        if (!model) {
            void withLoading(prepare());
            return;
        }
        /**
         * When the list of trusted, expired or revoked keys change,
         * * update the encrypt toggle (off if all keys are expired or no keys are pinned)
         * * re-check if the new keys can send
         * * re-order api keys (trusted take preference)
         * * move expired keys to the bottom of the list
         */
        const noPinnedKeyCanSend =
            !!model?.publicKeys?.pinnedKeys.length &&
            !model?.publicKeys?.pinnedKeys.some((publicKey) => getIsValidForSending(publicKey.getFingerprint(), model));

        setModel((model?: ContactPublicKeyModel) => {
            if (!model) {
                return;
            }
            const {
                publicKeys,
                trustedFingerprints,
                obsoleteFingerprints,
                compromisedFingerprints,
                encryptionCapableFingerprints,
            } = model;
            const apiKeys = sortApiKeys({
                keys: publicKeys.apiKeys,
                trustedFingerprints,
                obsoleteFingerprints,
                compromisedFingerprints,
            });
            const pinnedKeys = sortPinnedKeys({
                keys: publicKeys.pinnedKeys,
                obsoleteFingerprints,
                compromisedFingerprints,
                encryptionCapableFingerprints,
            });
            const verifyingPinnedKeys = getVerifyingKeys(pinnedKeys, model.compromisedFingerprints);

            return {
                ...model,
                encrypt: !noPinnedKeyCanSend && !!model?.publicKeys?.pinnedKeys.length && model.encrypt,
                publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
            };
        });
    }, [
        model?.trustedFingerprints,
        model?.obsoleteFingerprints,
        model?.encryptionCapableFingerprints,
        model?.compromisedFingerprints,
    ]);

    useEffect(() => {
        // take into account rules relating email format and cryptographic scheme
        if (!isMimeTypeFixed) {
            return;
        }
        // PGP/Inline should force the email format to plaintext
        if (hasPGPInline) {
            return setModel((model?: ContactPublicKeyModel) => {
                if (!model) {
                    return;
                }
                return { ...model, mimeType: MIME_TYPES.PLAINTEXT };
            });
        }
        // If PGP/Inline is not selected, go back to automatic
        setModel((model?: ContactPublicKeyModel) => {
            if (!model) {
                return;
            }
            return { ...model, mimeType: MIME_TYPES_MORE.AUTOMATIC };
        });
    }, [isMimeTypeFixed, hasPGPInline]);

    return (
        <ModalTwo size="large" className="contacts-modal" {...rest}>
            <ModalTwoHeader title={c('Title').t`Email settings (${emailAddress})`} titleClassName="text-ellipsis" />
            <ModalTwoContent>
                {!isMimeTypeFixed ? (
                    <Alert className="mb1">
                        {c('Info')
                            .t`Select the email format you want to be used by default when sending an email to this email address.`}
                    </Alert>
                ) : null}
                {isMimeTypeFixed && hasPGPInline ? (
                    <Alert className="mb1">
                        {c('Info')
                            .t`PGP/Inline is only compatible with Plain Text format. Please note that ${MAIL_APP_NAME} always signs encrypted messages.`}
                    </Alert>
                ) : null}
                {isMimeTypeFixed && !hasPGPInline ? (
                    <Alert className="mb1">
                        {c('Info')
                            .t`PGP/MIME automatically sends the message using the current composer mode. Please note that ${ MAIL_APP_NAME } always signs encrypted messages.`}
                    </Alert>
                ) : null}
                <Row>
                    <Label>
                        {c('Label').t`Email format`}
                        <Info
                            className="ml0-5"
                            title={c('Tooltip')
                                .t`Automatic indicates that the format in the composer is used to send to this user. Plain text indicates that the message will always be converted to plain text on send.`}
                        />
                    </Label>
                    <Field>
                        <ContactMIMETypeSelect
                            disabled={loading || isMimeTypeFixed}
                            value={model?.mimeType || ''}
                            onChange={(mimeType: CONTACT_MIME_TYPES) =>
                                setModel((model?: ContactPublicKeyModel) => {
                                    if (!model) {
                                        return;
                                    }
                                    return { ...model, mimeType };
                                })
                            }
                        />
                    </Field>
                </Row>
                <div className="mb1">
                    <UnderlineButton onClick={() => setShowPgpSettings(!showPgpSettings)} disabled={loading}>
                        {showPgpSettings
                            ? c('Action').t`Hide advanced PGP settings`
                            : c('Action').t`Show advanced PGP settings`}
                    </UnderlineButton>
                </div>
                {showPgpSettings && model ? (
                    <ContactPGPSettings model={model} setModel={setModel} mailSettings={mailSettings} />
                ) : null}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" loading={loading} type="submit" onClick={() => withLoading(handleSubmit(model))}>
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactEmailSettingsModal;
