import { ReactNode, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import TextArea from '@proton/components/components/v2/input/TextArea';
import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { setupSAMLFields, setupSAMLUrl, setupSAMLXml } from '@proton/shared/lib/api/samlSSO';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { Domain, SSO } from '@proton/shared/lib/interfaces';
import dragAndDrop from '@proton/styles/assets/img/illustrations/drag-and-drop-img.svg';

import {
    Dropzone,
    Form,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    RadioGroup,
    useFormErrors,
} from '../../../components';
import IdentityProviderEndpointsContent from './IdentityProviderEndpointsContent';
import UploadedXmlFile from './UploadedXmlFile';

enum STEP {
    SAML_METADATA,
    IDP_VALUES,
}

enum METADATA_METHOD {
    URL,
    XML,
    TEXT,
}

interface MetadataState {
    [METADATA_METHOD.URL]: {
        value: string;
    };
    [METADATA_METHOD.XML]: {
        file: File | null;
    };
    [METADATA_METHOD.TEXT]: {
        url: string;
        entityId: string;
        certificate: string;
    };
}

const defaultMetadataState: MetadataState = {
    [METADATA_METHOD.URL]: {
        value: '',
    },
    [METADATA_METHOD.XML]: {
        file: null,
    },
    [METADATA_METHOD.TEXT]: {
        url: '',
        entityId: '',
        certificate: '',
    },
};

interface Props extends ModalProps {
    domain: Domain;
}

const ConfigureSamlModal = ({ domain, onClose, ...rest }: Props) => {
    const [step, setStep] = useState(STEP.SAML_METADATA);

    const { createNotification } = useNotifications();

    const api = useApi();
    const { call } = useEventManager();
    const [submitting, withSubmitting] = useLoading();
    const { validator, onFormSubmit, reset } = useFormErrors();

    const [metadataMethod, setMetadataMethod] = useState<METADATA_METHOD>(METADATA_METHOD.URL);
    const [metadata, setMetadata] = useState<MetadataState>(defaultMetadataState);

    const idpDetails = useRef<{ issuerID: string; callbackURL: string }>();

    const {
        title,
        content,
        footer,
        onSubmit,
    }: { title: string; content: ReactNode; footer: ReactNode; onSubmit?: () => void } = (() => {
        if (step === STEP.SAML_METADATA) {
            const handleSubmit = async () => {
                if (!onFormSubmit()) {
                    return;
                }

                if (metadataMethod === METADATA_METHOD.URL) {
                    const { SSO } = await api<{ SSO: SSO }>(
                        setupSAMLUrl({
                            DomainID: domain.ID,
                            MetadataURL: metadata[METADATA_METHOD.URL].value,
                        })
                    );

                    idpDetails.current = {
                        issuerID: SSO.IssuerID,
                        callbackURL: SSO.CallbackURL,
                    };
                } else if (metadataMethod === METADATA_METHOD.XML) {
                    const xmlFileAsString = (await metadata[METADATA_METHOD.XML].file?.text()) || '';

                    const { SSO } = await api<{ SSO: SSO }>(
                        setupSAMLXml({
                            DomainID: domain.ID,
                            XML: btoa(xmlFileAsString),
                        })
                    );

                    idpDetails.current = {
                        issuerID: SSO.IssuerID,
                        callbackURL: SSO.CallbackURL,
                    };
                } else if (metadataMethod === METADATA_METHOD.TEXT) {
                    const { url, entityId, certificate } = metadata[METADATA_METHOD.TEXT];
                    const { SSO } = await api<{ SSO: SSO }>(
                        setupSAMLFields({
                            DomainID: domain.ID,
                            SSOURL: url,
                            SSOEntityID: entityId,
                            Certificate: certificate,
                        })
                    );

                    idpDetails.current = {
                        issuerID: SSO.IssuerID,
                        callbackURL: SSO.CallbackURL,
                    };
                }

                await call();
                setStep(STEP.IDP_VALUES);
            };

            const handleFileUpload = async (files: File[]) => {
                if (files.length === 0) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Unable to upload file`,
                    });
                    return;
                }

                if (files.length > 1) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Please upload only 1 file`,
                    });
                    return;
                }

                const file = files[0];

                if (file.type !== 'text/xml') {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Please upload an xml file`,
                    });
                    return;
                }

                setMetadata((metadata) => ({
                    ...metadata,
                    [METADATA_METHOD.XML]: {
                        file,
                    },
                }));
            };

            const selectFileButton = (
                <label
                    key="select-file-button"
                    className="link link-focus align-baseline text-left"
                    htmlFor="file-input"
                >
                    <input
                        id="file-input"
                        type="file"
                        accept=".xml"
                        className="sr-only"
                        onChange={async (e) => {
                            const files = Array.from(e.target.files as FileList);
                            await handleFileUpload(files);
                        }}
                    />
                    {c('Action').t`Select file`}
                </label>
            );

            // Using a function here so that we can extend to other applications without requiring retranslation of this string
            const getDescriptionString = (appName: typeof VPN_APP_NAME) => {
                // translator: variable here is an application name. Example full sentence "Go to your identity provider, get the the SAML metadata for Proton VPN and import it here."
                return c('Info')
                    .t`Go to your identity provider, get the the SAML metadata for ${appName} and import it here.`;
            };

            // Using a function here so that we can extend to other applications without requiring retranslation of this string
            const getUrlLabelString = (appName: typeof VPN_APP_NAME) => {
                // translator: variable here is an application name. Example full sentence "Metadata URL for Proton VPN"
                return c('Label').t`Metadata URL for ${appName}`;
            };

            // Using a function here so that we can extend to other applications without requiring retranslation of this string
            const getFileLabelString = (appName: typeof VPN_APP_NAME) => {
                // translator: variable here is an application name. Example full sentence "Metadata file for Proton VPN"
                return c('Label').t`Metadata file for ${appName}`;
            };

            return {
                title: c('Title').t`Enter SAML metadata`,
                onSubmit: () => withSubmitting(handleSubmit),
                content: (
                    <div>
                        <div className="mb-4">
                            {getDescriptionString(VPN_APP_NAME)}
                            <br />
                            <Href href="https://protonvpn.com/support/sso">{c('Link').t`Learn more`}</Href>
                        </div>
                        <div className="text-semibold mb-1">{c('Label').t`Method for importing metadata`}</div>
                        <RadioGroup
                            className="mb-4"
                            name="metadata-method"
                            onChange={(v) => {
                                reset();
                                setMetadataMethod(v);
                            }}
                            value={metadataMethod}
                            disableChange={submitting}
                            options={[
                                {
                                    value: METADATA_METHOD.URL,
                                    label: 'URL',
                                },
                                {
                                    value: METADATA_METHOD.XML,
                                    label: 'XML file',
                                },
                                {
                                    value: METADATA_METHOD.TEXT,
                                    label: 'Text fields',
                                },
                            ]}
                        />
                        <div className="min-h-custom" style={{ '--min-h-custom': '12rem' }}>
                            {metadataMethod === METADATA_METHOD.URL && (
                                <>
                                    <InputFieldTwo
                                        autoFocus
                                        label={getUrlLabelString(VPN_APP_NAME)}
                                        placeholder={c('Placeholder')
                                            .t`e.g. https://example.com/app/protonvpn/XXXXX/sso/metadata`}
                                        value={metadata[METADATA_METHOD.URL].value}
                                        onValue={(value: string) =>
                                            setMetadata((metadata) => ({
                                                ...metadata,
                                                [METADATA_METHOD.URL]: {
                                                    value,
                                                },
                                            }))
                                        }
                                        error={validator([requiredValidator(metadata[METADATA_METHOD.URL].value)])}
                                    />
                                </>
                            )}
                            {metadataMethod === METADATA_METHOD.XML && (
                                <>
                                    <div className="text-semibold mb-1">{getFileLabelString(VPN_APP_NAME)}</div>
                                    <Dropzone
                                        onDrop={handleFileUpload}
                                        shape="flashy"
                                        customContent={
                                            <div className="w-full h-full flex flex-column items-center justify-center text-center">
                                                <img
                                                    src={dragAndDrop}
                                                    alt=""
                                                    aria-hidden="true"
                                                    className="mb-4 max-w-custom"
                                                    style={{ '--max-w-custom': '4rem' }}
                                                />
                                                <div>{c('Info').t`Drop file here to upload`}</div>
                                            </div>
                                        }
                                    >
                                        <div
                                            className="rounded-xl border-dashed border-weak p-4 flex flex-column items-center justify-center min-h-custom"
                                            style={{ '--min-h-custom': '10.5rem' }}
                                        >
                                            {metadata[METADATA_METHOD.XML].file === null ? (
                                                <div className="color-weak text-center">
                                                    <div>{c('Info').t`Drop file here to upload`}</div>
                                                    <div>{c('Info').jt`or ${selectFileButton}`}</div>
                                                </div>
                                            ) : (
                                                <UploadedXmlFile
                                                    file={metadata[METADATA_METHOD.XML].file}
                                                    onRemoveClick={() =>
                                                        setMetadata((metadata) => ({
                                                            ...metadata,
                                                            [METADATA_METHOD.XML]: {
                                                                file: null,
                                                            },
                                                        }))
                                                    }
                                                />
                                            )}
                                        </div>
                                    </Dropzone>
                                </>
                            )}
                            {metadataMethod === METADATA_METHOD.TEXT && (
                                <div className="flex flex-col gap-4">
                                    <InputFieldTwo
                                        autoFocus
                                        label={c('Label').t`Single sign-on URL`}
                                        placeholder={c('Placeholder').t`e.g. https://idp.example.com/sso/saml`}
                                        value={metadata[METADATA_METHOD.TEXT].url}
                                        onValue={(value: string) =>
                                            setMetadata((metadata) => ({
                                                ...metadata,
                                                [METADATA_METHOD.TEXT]: {
                                                    ...metadata[METADATA_METHOD.TEXT],
                                                    url: value,
                                                },
                                            }))
                                        }
                                        error={validator([requiredValidator(metadata[METADATA_METHOD.TEXT].url)])}
                                        assistiveText={c('Info')
                                            .t`Endpoint URL received from your identity provider (e.g. https://idp.example.com/sso/saml).`}
                                    />
                                    <InputFieldTwo
                                        label={c('Label').t`Single sign-on Entity ID`}
                                        placeholder={c('Placeholder').t`e.g. https://idp.example.com/XXXXX`}
                                        value={metadata[METADATA_METHOD.TEXT].entityId}
                                        onValue={(value: string) =>
                                            setMetadata((metadata) => ({
                                                ...metadata,
                                                [METADATA_METHOD.TEXT]: {
                                                    ...metadata[METADATA_METHOD.TEXT],
                                                    entityId: value,
                                                },
                                            }))
                                        }
                                        error={validator([requiredValidator(metadata[METADATA_METHOD.TEXT].entityId)])}
                                        assistiveText={c('Info')
                                            .t`Unique ID generated by your identity provider, usually in the form of a URL that contains the identity provider’s name within it (e.g. https://idp.example.com/XXXXX).`}
                                    />
                                    <InputFieldTwo
                                        as={TextArea}
                                        label={c('Label').t`Public certificate (X.509)`}
                                        value={metadata[METADATA_METHOD.TEXT].certificate}
                                        onValue={(value: string) =>
                                            setMetadata((metadata) => ({
                                                ...metadata,
                                                [METADATA_METHOD.TEXT]: {
                                                    ...metadata[METADATA_METHOD.TEXT],
                                                    certificate: value,
                                                },
                                            }))
                                        }
                                        error={validator([
                                            requiredValidator(metadata[METADATA_METHOD.TEXT].certificate),
                                        ])}
                                        assistiveText={c('Info')
                                            .t`Identity provider’s public key to sign authentication assertions. There should be a place to download or copy the certificate hash from the identity provider. Just paste the certificate hash in the text area field.`}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ),
                footer: (
                    <>
                        <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                        <Button type="submit" loading={submitting} color="norm">
                            {c('Action').t`Continue`}
                        </Button>
                    </>
                ),
            };
        }

        if (step === STEP.IDP_VALUES && idpDetails.current) {
            return {
                title: c('Title').t`Enter endpoints into your identity provider`,
                content: <IdentityProviderEndpointsContent {...idpDetails.current} />,
                footer: (
                    <>
                        <div />
                        <Button onClick={onClose} color="norm">{c('Action').t`Done`}</Button>
                    </>
                ),
            };
        }

        throw new Error('No step found');
    })();

    return (
        <Modal as={onSubmit ? Form : undefined} onSubmit={onSubmit} size="large" onClose={onClose} {...rest}>
            <ModalHeader title={title} />
            <ModalContent>{content}</ModalContent>
            <ModalFooter>{footer}</ModalFooter>
        </Modal>
    );
};

export default ConfigureSamlModal;
