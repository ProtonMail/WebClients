import { useState, useEffect } from 'react';
import { c } from 'ttag';

import { prepareContacts } from '@proton/shared/lib/contacts/encrypt';
import { hasCategories, reOrderByPref } from '@proton/shared/lib/contacts/properties';
import { addContacts } from '@proton/shared/lib/api/contacts';
import getPublicKeysEmailHelper from '@proton/shared/lib/api/helpers/getPublicKeysEmailHelper';
import { extractScheme } from '@proton/shared/lib/api/helpers/mailSettings';
import {
    sortPinnedKeys,
    sortApiKeys,
    getContactPublicKeyModel,
    getIsValidForSending,
    getVerifyingKeys,
} from '@proton/shared/lib/keys/publicKeys';
import { uniqueBy } from '@proton/shared/lib/helpers/array';
import { getKeyInfoFromProperties, toKeyProperty } from '@proton/shared/lib/contacts/keyProperties';
import { DecryptedKey, ContactPublicKeyModel } from '@proton/shared/lib/interfaces';
import { ContactProperties, ContactProperty } from '@proton/shared/lib/interfaces/contacts/Contact';
import { AddContactsApiResponses } from '@proton/shared/lib/interfaces/contacts/Import';

import { VCARD_KEY_FIELDS, CATEGORIES } from '@proton/shared/lib/contacts/constants';
import {
    API_CODES,
    CONTACT_MIME_TYPES,
    MAIL_APP_NAME,
    MIME_TYPES,
    MIME_TYPES_MORE,
    PGP_SCHEMES,
} from '@proton/shared/lib/constants';
import { noop } from '@proton/shared/lib/helpers/function';

import ContactMIMETypeSelect from '../ContactMIMETypeSelect';
import ContactPgpSettings from '../ContactPgpSettings';
import { useApi, useEventManager, useNotifications, useLoading, useMailSettings } from '../../../hooks';
import {
    Alert,
    Label,
    Field,
    Row,
    Info,
    DialogModal,
    ContentModal,
    InnerModal,
    FooterModal,
    Button,
    PrimaryButton,
    UnderlineButton,
    Icon,
} from '../../../components';

const { PGP_INLINE } = PGP_SCHEMES;
const { INCLUDE, IGNORE } = CATEGORIES;

interface Props {
    userKeysList: DecryptedKey[];
    contactID: string;
    properties: ContactProperties;
    emailProperty: ContactProperty;
    onClose?: () => void;
}

const ContactEmailSettingsModal = ({
    userKeysList,
    contactID,
    properties,
    emailProperty,
    onClose = noop,
    ...rest
}: Props) => {
    const { value: emailAddressValue, group: emailGroup } = emailProperty;
    const emailAddress = emailAddressValue as string;

    const api = useApi();
    const { call } = useEventManager();
    const [model, setModel] = useState<ContactPublicKeyModel>();
    const [showPgpSettings, setShowPgpSettings] = useState(false);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [mailSettings] = useMailSettings();

    const isMimeTypeFixed = model?.isPGPInternal ? false : model?.isPGPExternalWithWKDKeys ? true : !!model?.sign;
    const hasPGPInline = model && mailSettings ? extractScheme(model, mailSettings) === PGP_INLINE : false;

    /**
     * Initialize the key model for the modal
     * @returns {Promise}
     */
    const prepare = async () => {
        const apiKeysConfig = await getPublicKeysEmailHelper(api, emailAddress, true);
        const pinnedKeysConfig = await getKeyInfoFromProperties(properties, emailGroup || '');
        const publicKeyModel = await getContactPublicKeyModel({
            emailAddress,
            apiKeysConfig,
            pinnedKeysConfig: { ...pinnedKeysConfig, isContact: true },
        });
        setModel(publicKeyModel);
    };

    /**
     * Collect keys from the model to save
     * @param {String} group attached to the current email address
     * @returns {Array} key properties to save in the vCard
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
     * @returns {Promise}
     */
    const handleSubmit = async (model?: ContactPublicKeyModel) => {
        if (!model) {
            return;
        }
        const otherProperties = properties.filter(({ field, group }) => {
            return !['email', ...VCARD_KEY_FIELDS].includes(field) || (group && group !== emailGroup);
        });

        const emailProperties = [emailProperty, ...getKeysProperties(emailGroup || '', model)];

        if (model.mimeType) {
            emailProperties.push({ field: 'x-pm-mimetype', value: model.mimeType, group: emailGroup });
        }
        if (model.isPGPExternalWithoutWKDKeys && model.encrypt !== undefined) {
            emailProperties.push({ field: 'x-pm-encrypt', value: `${model.encrypt}`, group: emailGroup });
        }
        if (model.isPGPExternalWithoutWKDKeys && model?.sign !== undefined) {
            emailProperties.push({ field: 'x-pm-sign', value: `${model.sign}`, group: emailGroup });
        }
        if (model.isPGPExternal && model.scheme) {
            emailProperties.push({ field: 'x-pm-scheme', value: model.scheme, group: emailGroup });
        }

        const allProperties = reOrderByPref(otherProperties.concat(emailProperties));
        const Contacts = await prepareContacts([allProperties], userKeysList[0]);
        const labels = hasCategories(allProperties) ? INCLUDE : IGNORE;
        const {
            Responses: [
                {
                    Response: { Code },
                },
            ],
        } = await api<AddContactsApiResponses>(addContacts({ Contacts, Overwrite: contactID ? 1 : 0, Labels: labels }));
        if (Code !== API_CODES.SINGLE_SUCCESS) {
            onClose();
            createNotification({ text: c('Error').t`Preferences could not be saved`, type: 'error' });
            return;
        }
        await call();
        onClose();
        createNotification({ text: c('Success').t`Preferences saved` });
    };

    useEffect(() => {
        /**
         * On the first render, initialize the model
         */
        if (!model) {
            withLoading(prepare());
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
        // we cannot use the FormModal component because we need to introduce the class text-ellipsis inside the header
        <DialogModal modalTitleID="modalTitle" onClose={onClose} {...rest}>
            <header className="modal-header">
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    className="modal-close"
                    title={c('Action').t`Close modal`}
                    onClick={onClose}
                >
                    <Icon name="cross" alt={c('Action').t`Close modal`} />
                </Button>
                <h1 id="modalTitle" className="modal-title text-ellipsis">
                    {c('Title').t`Email settings (${emailAddress})`}
                </h1>
            </header>
            <ContentModal onSubmit={() => withLoading(handleSubmit(model))} onReset={onClose}>
                <InnerModal>
                    {!isMimeTypeFixed ? (
                        <Alert className="mb1">
                            {c('Info')
                                .t`Select the email format you want to be used by default when sending an email to this email address.`}
                        </Alert>
                    ) : hasPGPInline ? (
                        <Alert className="mb1">
                            {c('Info')
                                .t`PGP/Inline is only compatible with Plain Text format. Please note that ${MAIL_APP_NAME} always signs encrypted messages.`}
                        </Alert>
                    ) : (
                        <Alert className="mb1">
                            {c('Info')
                                .t`PGP/MIME automatically sends the message using the current composer mode. Please note that ${MAIL_APP_NAME} always signs encrypted messages`}
                        </Alert>
                    )}
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
                        <ContactPgpSettings model={model} setModel={setModel} mailSettings={mailSettings} />
                    ) : null}
                </InnerModal>
                <FooterModal>
                    <Button type="reset">{c('Action').t`Cancel`}</Button>
                    <PrimaryButton loading={loading} type="submit">
                        {c('Action').t`Save`}
                    </PrimaryButton>
                </FooterModal>
            </ContentModal>
        </DialogModal>
    );
};

export default ContactEmailSettingsModal;
