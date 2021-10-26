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

import { noop } from '@proton/shared/lib/helpers/function';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { isNumber } from '@proton/shared/lib/helpers/validators';
import { Address } from '@proton/shared/lib/interfaces';
import { PRODUCT_NAMES } from '@proton/shared/lib/constants';
import {
    TIME_PERIOD,
    MailImportMapping,
    IMPORT_ERROR,
    PROVIDER_INSTRUCTIONS,
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

import YahooMailImportInstructionsStep from './steps/YahooMailImportInstructionsStep';
import ImportStartStep from './steps/ImportStartStep';
import ImportPrepareStep from './steps/ImportPrepareStep';
import ImportStartedStep from '../../steps/IAImportStartedStep';

import { classnames } from '../../../../helpers';

import './ImportMailModal.scss';
import { IA_PATHNAME_REGEX, IMAPS } from '../../constants';
import { dateToTimestamp } from '../helpers';

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
    providerInstructions?: PROVIDER_INSTRUCTIONS;
}

const ImportMailModal = ({ onClose = noop, currentImport, providerInstructions, addresses, ...rest }: Props) => {
    const settingsLink = useSettingsLink();
    const addressMap = toMap(addresses);
    const isReconnectMode = !!currentImport;

    const location = useLocation();
    const isCurrentLocationImportPage = IA_PATHNAME_REGEX.test(location.pathname);

    const [loading, withLoading] = useLoading();

    const { createModal } = useModals();
    const errorHandler = useErrorHandler();

    const [showPassword, setShowPassword] = useState(false);

    const [modalModel, setModalModel] = useState<ImportMailModalModel>({
        step: providerInstructions ? MailImportStep.INSTRUCTIONS : MailImportStep.START,
        importID: currentImport?.ID || '',
        email: currentImport?.Email || '',
        password: '',
        imap: currentImport?.ImapHost || '',
        port: currentImport?.ImapPort || '',
        errorCode: 0,
        errorLabel: '',
        providerFolders: [],
        needIMAPDetails: false,
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

    const needAppPassword = useMemo(() => modalModel.imap === IMAPS.YAHOO, [modalModel.imap]);
    const invalidPortError = useMemo(() => !isNumber(modalModel.port), [modalModel.port]);

    const title = useMemo(() => {
        switch (modalModel.step) {
            case MailImportStep.INSTRUCTIONS:
                if (providerInstructions === PROVIDER_INSTRUCTIONS.YAHOO) {
                    return c('Title').t`Prepare Yahoo Mail for import`;
                }

                return null;
            case MailImportStep.START:
                return isReconnectMode ? c('Title').t`Reconnect your account` : c('Title').t`Start a new import`;
            case MailImportStep.PREPARE:
                return c('Title').t`Start import process`;
            case MailImportStep.STARTED:
            default:
                return null;
        }
    }, [modalModel.step, providerInstructions]);

    const checkAuth = async () => {
        const { Authentication } = await api(getAuthenticationMethod({ Email: modalModel.email }));
        const { ImapHost, ImapPort, ImporterID } = Authentication;

        setModalModel({
            ...modalModel,
            importID: ImporterID,
            imap: ImapHost,
            port: ImapPort,
        });

        setShowPassword(true);
    };

    const moveToPrepareStep = (Importer: ImporterFromServer, providerFolders: ImportedMailFolder[]) => {
        setModalModel({
            ...modalModel,
            providerFolders: providerFolders.sort(destinationFoldersFirst),
            importID: Importer.ID,
            email: Importer.Email,
            imap: Importer.ImapHost,
            port: `${Importer.ImapPort}`,
            step: MailImportStep.PREPARE,
            errorCode: 0,
            errorLabel: '',
        });
    };

    const handleSubmitStartError = (error: any & { data: { Code: number; Error: string } }) => {
        const { data: { Code, Error } = { Code: 0, Error: '' } } = error;

        if (
            [
                IMPORT_ERROR.AUTHENTICATION_ERROR,
                IMPORT_ERROR.IMAP_CONNECTION_ERROR,
                IMPORT_ERROR.RATE_LIMIT_EXCEEDED,
            ].includes(Code)
        ) {
            setModalModel({
                ...modalModel,
                errorCode: Code,
                errorLabel: Error,
                needIMAPDetails: modalModel.needIMAPDetails || Code === IMPORT_ERROR.IMAP_CONNECTION_ERROR,
            });
            return;
        }

        errorHandler(error);
    };

    const submitAuthentication = async (needIMAPDetails = false) => {
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

        if ((modalModel.imap && modalModel.port) || needIMAPDetails) {
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

        setModalModel({
            ...modalModel,
            imap: '',
            needIMAPDetails: true,
        });
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

        setModalModel({
            ...modalModel,
            step: MailImportStep.STARTED,
        });
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
                <Alert className="mb1">{c('Info').t`Your import will not be processed.`}</Alert>
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
                await withLoading(submitAuthentication(modalModel.needIMAPDetails));
                break;
            case MailImportStep.INSTRUCTIONS:
                setModalModel({
                    ...modalModel,
                    step: MailImportStep.START,
                });
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
    }, [modalModel.step, loading]);

    const submitRenderer = useMemo(() => {
        const { email, password, needIMAPDetails, imap, port, isPayloadInvalid, step } = modalModel;

        const disabledStartStep = needIMAPDetails
            ? !email || !password || !imap || !port || invalidPortError
            : !email || !password;

        switch (step) {
            case MailImportStep.INSTRUCTIONS:
                return providerInstructions ? (
                    <div>
                        <PrimaryButton type="submit">{c('Action').t`Start ${PRODUCT_NAMES.EASY_SWITCH}`}</PrimaryButton>
                    </div>
                ) : (
                    <PrimaryButton type="submit">{c('Action').t`Skip to import`}</PrimaryButton>
                );
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
        providerInstructions,
        modalModel.step,
        modalModel.email,
        modalModel.password,
        modalModel.needIMAPDetails,
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
        } else {
            setShowPassword(false);
        }
    }, [debouncedEmail, modalModel.step]);

    // this one is to avoid a UI glitch when removing the email
    useEffect(() => {
        if (!modalModel.email) {
            setShowPassword(false);
        }
    }, [modalModel.email]);

    return (
        <FormModal
            title={title}
            loading={loading}
            submit={submitRenderer}
            close={cancelRenderer}
            onSubmit={handleSubmit}
            onClose={handleCancel}
            className={classnames([
                modalModel.step === MailImportStep.INSTRUCTIONS && providerInstructions && 'import-modal',
            ])}
            {...rest}
        >
            {modalModel.step === MailImportStep.INSTRUCTIONS &&
                providerInstructions === PROVIDER_INSTRUCTIONS.YAHOO && <YahooMailImportInstructionsStep />}
            {modalModel.step === MailImportStep.START && (
                <ImportStartStep
                    modalModel={modalModel}
                    updateModalModel={(newModel: ImportMailModalModel) => setModalModel(newModel)}
                    needAppPassword={needAppPassword}
                    showPassword={showPassword}
                    currentImport={currentImport}
                    invalidPortError={invalidPortError}
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
