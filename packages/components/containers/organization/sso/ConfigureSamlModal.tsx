import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Dropzone from '@proton/components/components/dropzone/Dropzone';
import TextArea from '@proton/components/components/v2/input/TextArea';
import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import metrics, { observeApiError } from '@proton/metrics';
import { setupSAMLFields, setupSAMLUrl, setupSAMLXml } from '@proton/shared/lib/api/samlSSO';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Domain } from '@proton/shared/lib/interfaces';
import dragAndDrop from '@proton/styles/assets/img/illustrations/drag-and-drop-img.svg';

import type { ModalProps } from '../../../components';
import {
    Form,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    RadioGroup,
    useFormErrors,
} from '../../../components';
import type { IdentityProviderEndpointsContentProps } from './IdentityProviderEndpointsContent';
import IdentityProviderEndpointsContent from './IdentityProviderEndpointsContent';
import UploadedXmlFile from './UploadedXmlFile';

enum STEP {
    IDP_VALUES,
    SAML_METADATA,
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

interface Props extends ModalProps, IdentityProviderEndpointsContentProps {
    domain: Domain;
    onClose: () => void;
}

const ConfigureSamlModal = ({ domain, onClose, issuerID, callbackURL, ...rest }: Props) => {
    const [step, setStep] = useState(STEP.IDP_VALUES);

    const { createNotification } = useNotifications();

    const api = useApi();
    const { call } = useEventManager();
    const [submitting, withSubmitting] = useLoading();
    const { validator, onFormSubmit, reset } = useFormErrors();

    const [metadataMethod, setMetadataMethod] = useState<METADATA_METHOD>(METADATA_METHOD.URL);
    const [metadata, setMetadata] = useState<MetadataState>(defaultMetadataState);

    useEffect(() => {
        const stepLabel = (() => {
            if (step === STEP.IDP_VALUES) {
                return 'idpvalues';
            }

            return 'metadata';
        })();
        void metrics.core_sso_saml_setup_modal_load_total.increment({ step: stepLabel });
    }, [step]);

    const {
        title,
        content,
        footer,
        onSubmit,
    }: { title: string; content: ReactNode; footer: ReactNode; onSubmit?: () => void } = (() => {
        if (step === STEP.IDP_VALUES) {
            return {
                onSubmit: () => setStep(STEP.SAML_METADATA),
                title: c('Title').t`Enter endpoints into your identity provider`,
                content: <IdentityProviderEndpointsContent issuerID={issuerID} callbackURL={callbackURL} />,
                footer: (
                    <>
                        <div />
                        <Button type="submit" color="norm">
                            {c('Action').t`Continue`}
                        </Button>
                    </>
                ),
            };
        }

        if (step === STEP.SAML_METADATA) {
            const handleSubmit = async () => {
                if (!onFormSubmit()) {
                    return;
                }

                if (metadataMethod === METADATA_METHOD.URL) {
                    try {
                        await api(
                            setupSAMLUrl({
                                DomainID: domain.ID,
                                MetadataURL: metadata[METADATA_METHOD.URL].value.trim(),
                            })
                        );

                        metrics.core_sso_saml_setup_total.increment({
                            status: 'success',
                            method: 'url',
                        });
                    } catch (error) {
                        observeApiError(error, (status) =>
                            metrics.core_sso_saml_setup_total.increment({
                                status,
                                method: 'url',
                            })
                        );
                        throw error;
                    }
                } else if (metadataMethod === METADATA_METHOD.XML) {
                    try {
                        const xmlFileAsString = (await metadata[METADATA_METHOD.XML].file?.text()) || '';

                        await api(
                            setupSAMLXml({
                                DomainID: domain.ID,
                                XML: btoa(xmlFileAsString),
                            })
                        );

                        metrics.core_sso_saml_setup_total.increment({
                            status: 'success',
                            method: 'xml',
                        });
                    } catch (error) {
                        observeApiError(error, (status) =>
                            metrics.core_sso_saml_setup_total.increment({
                                status,
                                method: 'xml',
                            })
                        );
                        throw error;
                    }
                } else if (metadataMethod === METADATA_METHOD.TEXT) {
                    try {
                        const { url, entityId, certificate } = metadata[METADATA_METHOD.TEXT];
                        await api(
                            setupSAMLFields({
                                DomainID: domain.ID,
                                SSOURL: url.trim(),
                                SSOEntityID: entityId.trim(),
                                Certificate: certificate,
                            })
                        );

                        metrics.core_sso_saml_setup_total.increment({
                            status: 'success',
                            method: 'text',
                        });
                    } catch (error) {
                        observeApiError(error, (status) =>
                            metrics.core_sso_saml_setup_total.increment({
                                status,
                                method: 'text',
                            })
                        );
                        throw error;
                    }
                }

                await call();
                createNotification({ text: c('Info').t`SAML configuration saved` });
                onClose();
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
                        data-testid="saml:metadata-file"
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
                // translator: variable here is an application name. Example full sentence "Go to your identity provider, get the SAML metadata for Proton VPN and import it here."
                return c('Info')
                    .t`Go to your identity provider, get the SAML metadata for ${appName} and import it here.`;
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
                                        data-testid="saml:metadata-url"
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
                                        data-testid="saml:endpoint-url"
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
                                        label={c('Label').t`Single sign-on entity ID`}
                                        data-testid="saml:entity-id"
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
                                        data-testid="saml:certificate"
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
                        <Button onClick={() => setStep(STEP.IDP_VALUES)}>{c('Action').t`Back`}</Button>
                        <Button type="submit" loading={submitting} color="norm">
                            {c('Action').t`Done`}
                        </Button>
                    </>
                ),
            };
        }

        throw new Error('No step found');
    })();

    return (
        <Modal as={Form} onSubmit={onSubmit} size="large" onClose={onClose} {...rest}>
            <ModalHeader title={title} />
            <ModalContent>{content}</ModalContent>
            <ModalFooter>{footer}</ModalFooter>
        </Modal>
    );
};

export default ConfigureSamlModal;
