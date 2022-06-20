import { useState, useMemo, FormEvent, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { c } from 'ttag';

import {
    getAuthenticationMethod,
    createImport,
    startImportTask,
    getMailImportData,
    updateImport,
    getImport,
    resumeImport,
} from '@proton/shared/lib/api/easySwitch';

import noop from '@proton/utils/noop';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { isNumber } from '@proton/shared/lib/helpers/validators';
import { Address } from '@proton/shared/lib/interfaces';
import {
    TIME_PERIOD,
    MailImportMapping,
    IMPORT_ERROR,
    NON_OAUTH_PROVIDER,
    ImportedMailFolder,
    ImportType,
    NormalizedImporter,
} from '@proton/shared/lib/interfaces/EasySwitch';
import { toMap } from '@proton/shared/lib/helpers/object';

import { useLoading, useModals, useApi, useEventManager, useErrorHandler } from '../../../../hooks';

import {
    ConfirmModal,
    FormModal,
    Button,
    PrimaryButton,
    Alert,
    useDebounceInput,
    useSettingsLink,
} from '../../../../components';

import { MailImportStep, ImportMailModalModel, AuthenticationMethod } from '../interfaces';

import ImportStartStep from './steps/ImportStartStep';
import ImportPrepareStep from './steps/ImportPrepareStep';
import ImportStartedStep from '../../steps/IAImportStartedStep';

import { IA_PATHNAME_REGEX, IMAPS, PORTS } from '../../constants';
import { dateToTimestamp } from '../helpers';

import './ImportMailModal.scss';

const destinationFoldersFirst = (a: ImportedMailFolder, b: ImportedMailFolder) => {
    if (a.DestinationFolder && b.DestinationFolder) {
        return 0;
    }
    if (a.DestinationFolder && !b.DestinationFolder) {
        return -1;
    }
    if (!a.DestinationFolder && b.DestinationFolder) {
        return 1;
    }
    if (a.Source < b.Source) {
        return -1;
    }
    if (a.Source > b.Source) {
        return 1;
    }
    return 0;
};

interface ImporterFromServer {
    Email: string;
    ID: string;
    ImapHost: string;
    ImapPort: number;
    Sasl: AuthenticationMethod;
}

interface Props {
    currentImport?: NormalizedImporter;
    onClose?: () => void;
    addresses: Address[];
    provider?: NON_OAUTH_PROVIDER;
}

const getDefaultImap = (provider?: NON_OAUTH_PROVIDER): string => {
    switch (provider) {
        case NON_OAUTH_PROVIDER.OUTLOOK:
            return IMAPS[NON_OAUTH_PROVIDER.OUTLOOK];
        case NON_OAUTH_PROVIDER.YAHOO:
            return IMAPS[NON_OAUTH_PROVIDER.YAHOO];
        default:
            return '';
    }
};

const getDefaultPort = (provider?: NON_OAUTH_PROVIDER): string => {
    switch (provider) {
        case NON_OAUTH_PROVIDER.OUTLOOK:
            return PORTS[NON_OAUTH_PROVIDER.OUTLOOK];
        case NON_OAUTH_PROVIDER.YAHOO:
            return PORTS[NON_OAUTH_PROVIDER.YAHOO];
        default:
            return '';
    }
};

const ImportMailModal = ({ onClose = noop, currentImport, provider, addresses, ...rest }: Props) => {
    const settingsLink = useSettingsLink();
    const addressMap = toMap(addresses);
    const isReconnectMode = !!currentImport;
    const location = useLocation();
    const isCurrentLocationImportPage = IA_PATHNAME_REGEX.test(location.pathname);

    const [loading, withLoading] = useLoading();

    const { createModal } = useModals();
    const errorHandler = useErrorHandler();

    const [modalModel, setModalModel] = useState<ImportMailModalModel>({
        step: MailImportStep.START,
        importID: currentImport?.ID || '',
        email: currentImport?.Email || '',
        password: '',
        imap: currentImport?.ImapHost || getDefaultImap(provider),
        port: currentImport?.ImapPort || getDefaultPort(provider),
        errorCode: 0,
        errorLabel: '',
        providerFolders: [],
        selectedPeriod: TIME_PERIOD.BIG_BANG,
        payload: {
            AddressID: addresses[0].ID,
            Mapping: [],
            CustomFields: 0,
        },
        isPayloadInvalid: false,
    });
    const api = useApi();
    const { call } = useEventManager();

    const debouncedEmail = useDebounceInput(modalModel.email);
    const invalidPortError = useMemo(() => !!modalModel.port && !isNumber(modalModel.port), [modalModel.port]);

    const title = useMemo(() => {
        switch (modalModel.step) {
            case MailImportStep.START:
                return isReconnectMode ? c('Title').t`Reconnect your account` : c('Title').t`Start a new import`;
            case MailImportStep.PREPARE:
                return c('Title').t`Start import process`;
            case MailImportStep.STARTED:
            default:
                return null;
        }
    }, [modalModel.step]);

    const checkAuth = async () => {
        const { Authentication } = await api(getAuthenticationMethod({ Email: modalModel.email }));
        const { ImapHost, ImapPort, ImporterID } = Authentication;

        setModalModel((modalModel) => ({
            ...modalModel,
            importID: ImporterID || modalModel.importID,
            imap: ImapHost || modalModel.imap,
            port: ImapPort || modalModel.port,
        }));
    };

    const moveToPrepareStep = (Importer: ImporterFromServer, providerFolders: ImportedMailFolder[]) => {
        setModalModel((modalModel) => ({
            ...modalModel,
            providerFolders: providerFolders.sort(destinationFoldersFirst),
            importID: Importer.ID,
            email: Importer.Email,
            imap: Importer.ImapHost,
            port: `${Importer.ImapPort}`,
            step: MailImportStep.PREPARE,
            errorCode: 0,
            errorLabel: '',
        }));
    };

    const handleSubmitStartError = (error: any & { data: { Code: number; Error: string } }) => {
        const { data: { Code, Error } = { Code: 0, Error: '' } } = error;

        // eslint-disable-next-line no-console
        console.error('Import Connection Error', error.data);

        if (
            [
                IMPORT_ERROR.AUTHENTICATION_ERROR,
                IMPORT_ERROR.IMAP_CONNECTION_ERROR,
                IMPORT_ERROR.RATE_LIMIT_EXCEEDED,
            ].includes(Code)
        ) {
            setModalModel((modalModel) => ({
                ...modalModel,
                errorCode: Code,
                errorLabel: Error,
            }));
            return;
        }

        errorHandler(error);
    };

    const submitAuthentication = async () => {
        /* If we already have an importID we can just fetch the folders and move on */
        if (modalModel.importID) {
            try {
                const { Importer } = await api(getImport(modalModel.importID));

                const { Folders = [] } = await api({
                    ...getMailImportData(Importer.ID, { Code: modalModel.password }),
                    /*
                        For this call we display a custom
                        error message on top of the form
                        and want to prevent the growler error
                    */
                    silence: true,
                });
                moveToPrepareStep(Importer, Folders);
            } catch (error: any) {
                handleSubmitStartError(error);
            }
            return;
        }

        if (modalModel.imap && modalModel.port) {
            try {
                const { ImporterID } = await api({
                    ...createImport({
                        [ImportType.MAIL]: {
                            Email: modalModel.email,
                            ImapHost: modalModel.imap,
                            ImapPort: parseInt(modalModel.port, 10),
                            Sasl: AuthenticationMethod.PLAIN,
                            Code: modalModel.password,
                        },
                    }),
                    /*
                        For this call we display a custom
                        error message on top of the form
                        and want to prevent the growler error
                    */
                    silence: true,
                });
                await call();

                const { Folders = [] } = await api(getMailImportData(ImporterID, { Code: modalModel.password }));
                moveToPrepareStep(
                    {
                        ID: ImporterID,
                        Email: modalModel.email,
                        ImapHost: modalModel.imap,
                        ImapPort: parseInt(modalModel.port, 10),
                        Sasl: AuthenticationMethod.PLAIN,
                    },
                    Folders
                );
            } catch (error: any) {
                handleSubmitStartError(error);
            }
            return;
        }

        setModalModel((modalModel) => ({
            ...modalModel,
            imap: '',
        }));
    };

    const formatImportPayload = () => {
        const { payload, importID } = modalModel;

        return {
            ImporterID: importID,
            [ImportType.MAIL]: {
                ...payload,
                StartTime: payload.StartTime ? dateToTimestamp(payload.StartTime as Date) : undefined,
                Mapping: payload.Mapping.filter(({ checked }: MailImportMapping) => checked).map(
                    ({ Source, Destinations }: MailImportMapping) => ({
                        Source,
                        Destinations,
                    })
                ),
            },
        };
    };

    const launchImport = async () => {
        const payload = formatImportPayload();

        await api(startImportTask(payload));
        await call();

        setModalModel((modalModel) => ({
            ...modalModel,
            step: MailImportStep.STARTED,
        }));
    };

    const resumeImporter = async () => {
        await api(
            updateImport(modalModel.importID, {
                [ImportType.MAIL]: {
                    Email: modalModel.email,
                    Code: modalModel.password,
                    ImapHost: modalModel.imap,
                    ImapPort: parseInt(modalModel.port, 10),
                    Sasl: AuthenticationMethod.PLAIN,
                },
            })
        );
        await api(
            resumeImport({
                ImporterID: modalModel.importID,
                Products: [ImportType.MAIL],
            })
        );
        await call();
        onClose();
    };

    const handleCancel = () => {
        if (!modalModel.email || modalModel.step === MailImportStep.STARTED || isReconnectMode) {
            onClose();
            return;
        }

        createModal(
            <ConfirmModal
                onConfirm={onClose}
                title={c('Confirm modal title').t`Quit import?`}
                cancel={c('Action').t`Continue import`}
                confirm={<Button color="danger" type="submit">{c('Action').t`Discard`}</Button>}
            >
                <div className="mb1">{c('Info').t`Your import will not be processed.`}</div>
                <Alert className="mb1" type="error">{c('Warning')
                    .t`Are you sure you want to discard your import?`}</Alert>
            </ConfirmModal>
        );
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        switch (modalModel.step) {
            case MailImportStep.START:
                if (isReconnectMode) {
                    await withLoading(resumeImporter());
                    return;
                }
                await withLoading(submitAuthentication());
                break;
            case MailImportStep.PREPARE:
                await withLoading(launchImport());
                break;
            case MailImportStep.STARTED:
                onClose();
                break;
            default:
                break;
        }
    };

    const cancelRenderer = useMemo(() => {
        return (
            <Button shape="outline" onClick={handleCancel}>
                {modalModel.step === MailImportStep.STARTED ? c('Action').t`Close` : c('Action').t`Cancel`}
            </Button>
        );
    }, [modalModel.step]);

    const submitRenderer = useMemo(() => {
        const { email, password, imap, port, isPayloadInvalid, step } = modalModel;
        const disabledStartStep = !email || !password || !imap || !port || invalidPortError;

        switch (step) {
            case MailImportStep.START:
                return (
                    <PrimaryButton type="submit" disabled={disabledStartStep} loading={loading}>
                        {isReconnectMode ? c('Action').t`Reconnect` : c('Action').t`Next`}
                    </PrimaryButton>
                );
            case MailImportStep.PREPARE:
                return (
                    <PrimaryButton loading={loading} disabled={isPayloadInvalid} type="submit">
                        {c('Action').t`Start import`}
                    </PrimaryButton>
                );
            case MailImportStep.STARTED:
                return !isCurrentLocationImportPage ? (
                    <PrimaryButton
                        onClick={() => {
                            onClose();
                            settingsLink(`/easy-switch`);
                        }}
                    >
                        {c('Action').t`Check import progress`}
                    </PrimaryButton>
                ) : null;
            default:
                return null;
        }
    }, [
        modalModel.step,
        modalModel.email,
        modalModel.password,
        modalModel.imap,
        modalModel.port,
        modalModel.isPayloadInvalid,
        loading,
    ]);

    useEffect(() => {
        if (modalModel.step !== MailImportStep.START) {
            return;
        }

        if (debouncedEmail && validateEmailAddress(debouncedEmail)) {
            void withLoading(checkAuth());
        }
    }, [debouncedEmail, modalModel.step]);

    return (
        <FormModal
            title={title}
            loading={loading}
            submit={submitRenderer}
            close={cancelRenderer}
            onSubmit={handleSubmit}
            onClose={handleCancel}
            {...rest}
        >
            {modalModel.step === MailImportStep.START && (
                <ImportStartStep
                    modalModel={modalModel}
                    updateModalModel={(newModel: ImportMailModalModel) => setModalModel(newModel)}
                    currentImport={currentImport}
                    invalidPortError={invalidPortError}
                    provider={provider}
                />
            )}
            {modalModel.step === MailImportStep.PREPARE && (
                <ImportPrepareStep
                    addresses={addresses}
                    modalModel={modalModel}
                    updateModalModel={(newModel: ImportMailModalModel) => setModalModel(newModel)}
                />
            )}
            {modalModel.step === MailImportStep.STARTED && (
                <ImportStartedStep
                    importedEmailAddress={modalModel.email}
                    toEmail={addressMap[modalModel.payload.AddressID].Email}
                    onClose={onClose}
                />
            )}
        </FormModal>
    );
};

export default ImportMailModal;
