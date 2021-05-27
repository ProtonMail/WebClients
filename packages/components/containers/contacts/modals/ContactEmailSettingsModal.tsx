import React, { useState, useEffect } from 'react';
import { c } from 'ttag';

import { prepareContacts } from 'proton-shared/lib/contacts/encrypt';
import { hasCategories, reOrderByPref } from 'proton-shared/lib/contacts/properties';
import { addContacts } from 'proton-shared/lib/api/contacts';
import getPublicKeysEmailHelper from 'proton-shared/lib/api/helpers/getPublicKeysEmailHelper';
import { extractScheme } from 'proton-shared/lib/api/helpers/mailSettings';
import {
    sortPinnedKeys,
    sortApiKeys,
    getContactPublicKeyModel,
    getIsValidForSending,
} from 'proton-shared/lib/keys/publicKeys';
import { uniqueBy } from 'proton-shared/lib/helpers/array';
import { getKeyInfoFromProperties, toKeyProperty } from 'proton-shared/lib/contacts/keyProperties';
import { DecryptedKey, Api, ContactPublicKeyModel } from 'proton-shared/lib/interfaces';
import { ContactProperties, ContactProperty } from 'proton-shared/lib/interfaces/contacts/Contact';
import { AddContactsApiResponses } from 'proton-shared/lib/interfaces/contacts/Import';

import { VCARD_KEY_FIELDS, CATEGORIES } from 'proton-shared/lib/contacts/constants';
import { API_CODES, CONTACT_MIME_TYPES, MIME_TYPES, MIME_TYPES_MORE, PGP_SCHEMES } from 'proton-shared/lib/constants';
import { noop } from 'proton-shared/lib/helpers/function';

import ContactMIMETypeSelect from '../../../components/contacts/ContactMIMETypeSelect';
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
    LinkButton,
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
    const [model, setModel] = useState<ContactPublicKeyModel>({} as ContactPublicKeyModel);
    const [showPgpSettings, setShowPgpSettings] = useState(false);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [mailSettings, loadingMailSettings] = useMailSettings();

    const isLoading = loading || loadingMailSettings;
    const isMimeTypeFixed = model?.isPGPInternal ? false : model?.isPGPExternalWithWKDKeys ? true : !!model?.sign;
    const hasPGPInline = model && mailSettings ? extractScheme(model, mailSettings) === PGP_INLINE : false;

    /**
     * Initialize the key model for the modal
     * @returns {Promise}
     */
    const prepare = async (api: Api) => {
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
    const getKeysProperties = (group: string) => {
        const allKeys = model?.isPGPInternal
            ? [...model?.publicKeys.apiKeys]
            : [...model?.publicKeys.apiKeys, ...model?.publicKeys?.pinnedKeys];
        const trustedKeys = allKeys.filter((publicKey) => model?.trustedFingerprints.has(publicKey.getFingerprint()));
        const uniqueTrustedKeys = uniqueBy(trustedKeys, (publicKey) => publicKey.getFingerprint());
        return uniqueTrustedKeys.map((publicKey, index) => toKeyProperty({ publicKey, group, index }));
    };

    /**
     * Save relevant key properties in the vCard
     * @returns {Promise}
     */
    const handleSubmit = async () => {
        const otherProperties = properties.filter(({ field, group }) => {
            return !['email', ...VCARD_KEY_FIELDS].includes(field) || (group && group !== emailGroup);
        });

        const emailProperties = [emailProperty, ...getKeysProperties(emailGroup || '')];

        if (model?.mimeType) {
            emailProperties.push({ field: 'x-pm-mimetype', value: model?.mimeType, group: emailGroup });
        }
        if (model?.isPGPExternalWithoutWKDKeys && model?.encrypt !== undefined) {
            emailProperties.push({ field: 'x-pm-encrypt', value: `${model?.encrypt}`, group: emailGroup });
        }
        if (model?.isPGPExternalWithoutWKDKeys && model?.sign !== undefined) {
            emailProperties.push({ field: 'x-pm-sign', value: `${model?.sign}`, group: emailGroup });
        }
        if (model?.isPGPExternalWithoutWKDKeys && model?.scheme) {
            emailProperties.push({ field: 'x-pm-scheme', value: model?.scheme, group: emailGroup });
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
        } = await api<AddContactsApiResponses>(
            addContacts({ Contacts, Overwrite: +!!contactID as 0 | 1, Labels: labels })
        );
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
        if (!model) {
            return;
        }

        const abortController = new AbortController();
        const apiWithAbort = (config: any): Promise<any> => api({ ...config, signal: abortController.signal });
        // prepare the model once mail settings have been loaded
        if (!loadingMailSettings) {
            withLoading(prepare(apiWithAbort));
        }
        return () => {
            abortController.abort();
        };
    }, [loadingMailSettings]);

    useEffect(() => {
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

        setModel((model: ContactPublicKeyModel) => ({
            ...model,
            encrypt: !noPinnedKeyCanSend && !!model?.publicKeys?.pinnedKeys.length && model.encrypt,
            publicKeys: {
                apiKeys: sortApiKeys(
                    model?.publicKeys?.apiKeys,
                    model.trustedFingerprints,
                    model.verifyOnlyFingerprints
                ),
                pinnedKeys: sortPinnedKeys(
                    model?.publicKeys?.pinnedKeys,
                    model.expiredFingerprints,
                    model.revokedFingerprints
                ),
            },
        }));
    }, [
        model?.trustedFingerprints,
        model?.expiredFingerprints,
        model?.revokedFingerprints,
        model?.verifyOnlyFingerprints,
    ]);

    useEffect(() => {
        // take into account rules relating email format and cryptographic scheme
        if (!isMimeTypeFixed) {
            return;
        }
        // PGP/Inline should force the email format to plaintext
        if (hasPGPInline) {
            return setModel(
                (model: ContactPublicKeyModel) =>
                    ({ ...model, mimeType: MIME_TYPES.PLAINTEXT } as ContactPublicKeyModel)
            );
        }
        // If PGP/Inline is not selected, go back to automatic
        setModel((model: ContactPublicKeyModel) => ({ ...model, mimeType: MIME_TYPES_MORE.AUTOMATIC }));
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
                    <Icon name="close" alt={c('Action').t`Close modal`} />
                </Button>
                <h1 id="modalTitle" className="modal-title text-ellipsis">
                    {c('Title').t`Email settings (${emailAddress})`}
                </h1>
            </header>
            <ContentModal onSubmit={() => withLoading(handleSubmit())} onReset={onClose}>
                <InnerModal>
                    {!isMimeTypeFixed ? (
                        <Alert>
                            {c('Info')
                                .t`Select the email format you want to be used by default when sending an email to this email address.`}
                        </Alert>
                    ) : hasPGPInline ? (
                        <Alert>
                            {c('Info')
                                .t`PGP/Inline is only compatible with Plain Text format. Please note that ProtonMail always signs encrypted messages.`}
                        </Alert>
                    ) : (
                        <Alert>
                            {c('Info')
                                .t`PGP/MIME automatically sends the message using the current composer mode. Please note that ProtonMail always signs encrypted messages`}
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
                                disabled={isLoading || isMimeTypeFixed}
                                value={model?.mimeType || ''}
                                onChange={(mimeType: CONTACT_MIME_TYPES) => setModel({ ...model, mimeType })}
                            />
                        </Field>
                    </Row>
                    <div className="mb1">
                        <LinkButton onClick={() => setShowPgpSettings(!showPgpSettings)} disabled={isLoading}>
                            {showPgpSettings
                                ? c('Action').t`Hide advanced PGP settings`
                                : c('Action').t`Show advanced PGP settings`}
                        </LinkButton>
                    </div>
                    {showPgpSettings && model ? (
                        <ContactPgpSettings model={model} setModel={setModel} mailSettings={mailSettings} />
                    ) : null}
                </InnerModal>
                <FooterModal>
                    <Button type="reset">{c('Action').t`Cancel`}</Button>
                    <PrimaryButton loading={isLoading} type="submit">
                        {c('Action').t`Save`}
                    </PrimaryButton>
                </FooterModal>
            </ContentModal>
        </DialogModal>
    );
};

export default ContactEmailSettingsModal;
