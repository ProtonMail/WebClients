import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Label } from '@proton/components/components';
import Alert from '@proton/components/components/alert/Alert';
import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import Field from '@proton/components/components/container/Field';
import Row from '@proton/components/components/container/Row';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useLoading } from '@proton/hooks';
import getPublicKeysEmailHelper from '@proton/shared/lib/api/helpers/getPublicKeysEmailHelper';
import { extractScheme } from '@proton/shared/lib/api/helpers/mailSettings';
import type { CONTACT_MIME_TYPES } from '@proton/shared/lib/constants';
import { MIME_TYPES, MIME_TYPES_MORE, PGP_SCHEMES } from '@proton/shared/lib/constants';
import { VCARD_KEY_FIELDS } from '@proton/shared/lib/contacts/constants';
import { getKeyInfoFromProperties, getMimeTypeVcard, toKeyProperty } from '@proton/shared/lib/contacts/keyProperties';
import {
    createContactPropertyUid,
    fromVCardProperties,
    getVCardProperties,
} from '@proton/shared/lib/contacts/properties';
import type { ContactPublicKeyModelWithApiKeySource } from '@proton/shared/lib/interfaces';
import type { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import {
    getContactPublicKeyModel,
    getVerifyingKeys,
    sortApiKeys,
    sortPinnedKeys,
} from '@proton/shared/lib/keys/publicKeys';
import clsx from '@proton/utils/clsx';
import uniqueBy from '@proton/utils/uniqueBy';

import { useApi, useEventManager, useMailSettings, useNotifications } from '../../../hooks';
import { useKeyTransparencyContext } from '../../keyTransparency/useKeyTransparencyContext';
import { useSaveVCardContact } from '../hooks/useSaveVCardContact';
import ContactMIMETypeSelect from './ContactMIMETypeSelect';
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
    const [model, setModel] = useState<ContactPublicKeyModelWithApiKeySource>();
    const [showPgpSettings, setShowPgpSettings] = useState(false);
    const [loadingPgpSettings, withLoadingPgpSettings] = useLoading(true);
    const [loadingSave, withLoadingSave] = useLoading(false);
    const { createNotification } = useNotifications();
    const [mailSettings] = useMailSettings();
    const { verifyOutboundPublicKeys, ktActivation } = useKeyTransparencyContext();

    const saveVCardContact = useSaveVCardContact();

    // Avoid nested ternary
    let isMimeTypeFixed: boolean;
    if (model?.isPGPInternal) {
        isMimeTypeFixed = false;
    } else {
        isMimeTypeFixed = model?.sign !== undefined ? model.sign : !!mailSettings?.Sign;
    }

    const hasPGPInline = model && mailSettings ? extractScheme(model, mailSettings) === PGP_INLINE : false;

    /**
     * Initialize the key model for the modal
     */
    const prepare = async () => {
        const apiKeysConfig = await getPublicKeysEmailHelper({
            email: emailAddress,
            includeInternalKeysWithE2EEDisabledForMail: true, // the keys are used in the context of calendar sharing, thus users may want to pin them
            api,
            ktActivation,
            verifyOutboundPublicKeys,
            silence: true,
        });
        const apiKeysSourceMap = apiKeysConfig.publicKeys.reduce<
            ContactPublicKeyModelWithApiKeySource['apiKeysSourceMap']
        >((map, { publicKey, source }) => {
            const fingerprint = publicKey.getFingerprint();
            if (!map[source]) {
                map[source] = new Set();
            }
            map[source]!.add(fingerprint);
            return map;
        }, {});
        const pinnedKeysConfig = await getKeyInfoFromProperties(vCardContact, emailGroup || '');
        const publicKeyModel = await getContactPublicKeyModel({
            emailAddress,
            apiKeysConfig,
            pinnedKeysConfig: { ...pinnedKeysConfig, isContact: true },
        });
        setModel({
            ...publicKeyModel,
            // Encryption enforces signing, so we can ignore the signing preference so that if the user
            // disables encryption, the global default signing setting is automatically selected.
            sign: publicKeyModel.encrypt ? undefined : publicKeyModel.sign,
            apiKeysSourceMap,
        });
    };

    /**
     * Collect keys from the model to save
     * @param group attached to the current email address
     * @returns key properties to save in the vCard
     */
    const getKeysProperties = (group: string, model: ContactPublicKeyModelWithApiKeySource) => {
        const allKeys = model?.isPGPInternal
            ? [...model.publicKeys.apiKeys]
            : [...model.publicKeys?.apiKeys, ...model.publicKeys.pinnedKeys];
        const trustedKeys = allKeys.filter((publicKey) => model.trustedFingerprints.has(publicKey.getFingerprint()));
        const uniqueTrustedKeys = uniqueBy(trustedKeys, (publicKey) => publicKey.getFingerprint());
        return Promise.all(uniqueTrustedKeys.map((publicKey, index) => toKeyProperty({ publicKey, group, index })));
    };

    /**
     * Save relevant key properties in the vCard
     */
    const handleSubmit = async (model?: ContactPublicKeyModelWithApiKeySource) => {
        if (!model) {
            return;
        }
        const properties = getVCardProperties(vCardContact);
        const newProperties = properties.filter(({ field, group }) => {
            return !VCARD_KEY_FIELDS.includes(field) || (group && group !== emailGroup);
        });
        newProperties.push(...(await getKeysProperties(emailGroup || '', model)));

        const mimeType = getMimeTypeVcard(model.mimeType);
        if (mimeType) {
            newProperties.push({
                field: 'x-pm-mimetype',
                value: mimeType,
                group: emailGroup,
                uid: createContactPropertyUid(),
            });
        }

        if (model.isPGPExternal) {
            const hasPinnedKeys = model.publicKeys.pinnedKeys.length > 0;
            const hasApiKeys = model.publicKeys.apiKeys.length > 0; // from WKD or other untrusted servers

            if ((hasPinnedKeys || hasApiKeys) && model.encrypt !== undefined) {
                newProperties.push({
                    field: hasPinnedKeys ? 'x-pm-encrypt' : 'x-pm-encrypt-untrusted',
                    value: `${model.encrypt}`,
                    group: emailGroup,
                    uid: createContactPropertyUid(),
                });
            }

            // Encryption automatically enables signing (but we do not store the info for non-pinned WKD keys).
            const sign = model.encrypt || model.sign;
            if (sign !== undefined) {
                newProperties.push({
                    field: 'x-pm-sign',
                    value: `${sign}`,
                    group: emailGroup,
                    uid: createContactPropertyUid(),
                });
            }

            if (model.scheme) {
                newProperties.push({
                    field: 'x-pm-scheme',
                    value: model.scheme,
                    group: emailGroup,
                    uid: createContactPropertyUid(),
                });
            }
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
            void withLoadingPgpSettings(prepare());
            return;
        }
        /**
         * When the list of trusted, expired or revoked keys change,
         * * update the list:
         * * re-check if the new keys can send
         * * re-order api keys (trusted take preference)
         * * move expired keys to the bottom of the list
         */

        setModel((model?: ContactPublicKeyModelWithApiKeySource) => {
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
            return setModel((model?: ContactPublicKeyModelWithApiKeySource) => {
                if (!model) {
                    return;
                }
                return { ...model, mimeType: MIME_TYPES.PLAINTEXT };
            });
        }
        // If PGP/Inline is not selected, go back to automatic
        setModel((model?: ContactPublicKeyModelWithApiKeySource) => {
            if (!model) {
                return;
            }
            return { ...model, mimeType: MIME_TYPES_MORE.AUTOMATIC };
        });
    }, [isMimeTypeFixed, hasPGPInline]);

    return (
        <ModalTwo size="large" className="contacts-modal" {...rest}>
            <ModalTwoHeader
                title={c('Title').t`Edit email settings`}
                titleClassName="text-ellipsis"
                subline={emailAddress}
            />
            <ModalTwoContent>
                {!isMimeTypeFixed ? (
                    <Alert className="mb-4">
                        {c('Info')
                            .t`Select the email format you want to be used by default when sending an email to this email address.`}
                    </Alert>
                ) : null}
                {isMimeTypeFixed && hasPGPInline ? (
                    <Alert className="mb-4">{c('Info').t`PGP/Inline is only compatible with Plain Text format.`}</Alert>
                ) : null}
                {isMimeTypeFixed && !hasPGPInline ? (
                    <Alert className="mb-4">
                        {c('Info').t`PGP/MIME automatically sends the message using the current composer mode.`}
                    </Alert>
                ) : null}
                <Row>
                    <Label>
                        {c('Label').t`Email format`}
                        <Info
                            className="ml-2"
                            title={c('Tooltip')
                                .t`Automatic indicates that the format in the composer is used to send to this user. Plain text indicates that the message will always be converted to plain text on send.`}
                        />
                    </Label>
                    <Field>
                        <ContactMIMETypeSelect
                            disabled={loadingSave || isMimeTypeFixed}
                            value={model?.mimeType || ''}
                            onChange={(mimeType: CONTACT_MIME_TYPES) =>
                                setModel((model?: ContactPublicKeyModelWithApiKeySource) => {
                                    if (!model) {
                                        return;
                                    }
                                    return { ...model, mimeType };
                                })
                            }
                        />
                    </Field>
                </Row>
                <div className="mb-4">
                    <Collapsible disabled={loadingPgpSettings}>
                        <CollapsibleHeader
                            suffix={
                                <CollapsibleHeaderIconButton onClick={() => setShowPgpSettings(!showPgpSettings)}>
                                    <Icon name="chevron-down" />
                                </CollapsibleHeaderIconButton>
                            }
                            disableFullWidth
                            onClick={() => setShowPgpSettings(!showPgpSettings)}
                            className={clsx([
                                'color-primary',
                                loadingPgpSettings ? 'color-weak text-no-decoration' : 'text-underline',
                            ])}
                        >
                            {showPgpSettings
                                ? c('Action').t`Hide advanced PGP settings`
                                : c('Action').t`Show advanced PGP settings`}
                        </CollapsibleHeader>
                        <CollapsibleContent className="mt-4">
                            {showPgpSettings && model ? (
                                <ContactPGPSettings model={model} setModel={setModel} mailSettings={mailSettings} />
                            ) : null}
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    loading={loadingSave}
                    disabled={loadingSave || loadingPgpSettings}
                    type="submit"
                    onClick={() => withLoadingSave(handleSubmit(model))}
                    data-testid="email-settings:save"
                >
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactEmailSettingsModal;
