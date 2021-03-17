import React, { useState, useMemo, FormEvent, useEffect } from 'react';
import { c } from 'ttag';

import {
    getAuthenticationMethod,
    createMailImport,
    createJobImport,
    getMailImportFolders,
    getMailImport,
    updateMailImport,
    resumeMailImport,
} from 'proton-shared/lib/api/mailImport';
import { noop } from 'proton-shared/lib/helpers/function';
import { validateEmailAddress } from 'proton-shared/lib/helpers/email';
import { isNumber } from 'proton-shared/lib/helpers/validators';

import { useLoading, useAddresses, useModals, useApi, useEventManager } from '../../../hooks';

import {
    ConfirmModal,
    FormModal,
    Button,
    PrimaryButton,
    Alert,
    ErrorButton,
    useDebounceInput,
    Loader,
} from '../../../components';
import ImportMailWizard from '../../../components/import/ImportMailWizard';

import { IMAP_CONNECTION_ERROR_LABEL, IMAPS } from '../constants';

import {
    Step,
    ImportModalModel,
    IMPORT_ERROR,
    MailImportFolder,
    FolderMapping,
    Importer,
    TIME_UNIT,
    PROVIDER_INSTRUCTIONS,
    GMAIL_INSTRUCTIONS,
    OAUTH_PROVIDER,
} from '../interfaces';

import ImportInstructionsStep from './steps/ImportInstructionsStep';
import ImportStartStep from './steps/ImportStartStep';
import ImportPrepareStep from './steps/ImportPrepareStep';
import ImportStartedStep from './steps/ImportStartedStep';

import './ImportMailModal.scss';
import { classnames } from '../../../helpers';

const dateToTimestamp = (date: Date) => Math.floor(date.getTime() / 1000);

const destinationFoldersFirst = (a: MailImportFolder, b: MailImportFolder) => {
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
    MailboxSize: {
        [key: string]: number;
    };
    Sasl: 'PLAIN' | 'XOAUTH2';
}

interface Props {
    currentImport?: Importer;
    onClose?: () => void;
    oauthProps?: {
        code: string;
        provider: OAUTH_PROVIDER;
        redirectURI: string;
    };
}

const ImportMailModal = ({ onClose = noop, currentImport, oauthProps, ...rest }: Props) => {
    const isReconnectMode = !!currentImport;
    const [loading, withLoading] = useLoading();
    const { createModal } = useModals();
    const [addresses, loadingAddresses] = useAddresses();
    const [address] = addresses || [];

    const [providerInstructions, setProviderInstructions] = useState<PROVIDER_INSTRUCTIONS>();
    const [gmailInstructionsStep, setGmailInstructionsStep] = useState(GMAIL_INSTRUCTIONS.IMAP);
    const GMAIL_INSTRUCTION_STEPS_COUNT = Object.keys(GMAIL_INSTRUCTIONS).length / 2;

    const [showPassword, setShowPassword] = useState(false);

    const [modalModel, setModalModel] = useState<ImportModalModel>({
        step: isReconnectMode || oauthProps ? Step.START : Step.INSTRUCTIONS,
        importID: currentImport?.ID || '',
        email: currentImport?.Email || '',
        password: '',
        imap: currentImport?.ImapHost || '',
        port: currentImport?.ImapPort || '',
        errorCode: 0,
        errorLabel: '',
        providerFolders: [],
        needIMAPDetails: false,
        selectedPeriod: TIME_UNIT.BIG_BANG,
        payload: {
            Mapping: [],
            CustomFields: 0,
        },
        isPayloadInvalid: false,
    });
    const api = useApi();
    const { call } = useEventManager();

    const wizardSteps = [c('Wizard step').t`Authenticate`, c('Wizard step').t`Plan import`, c('Wizard step').t`Import`];

    const debouncedEmail = useDebounceInput(modalModel.email);

    const changeProvider = (provider: PROVIDER_INSTRUCTIONS) => setProviderInstructions(provider);

    const needAppPassword = useMemo(() => modalModel.imap === IMAPS.YAHOO, [modalModel.imap]);
    const invalidPortError = useMemo(() => !isNumber(modalModel.port), [modalModel.port]);

    const title = useMemo(() => {
        switch (modalModel.step) {
            case Step.INSTRUCTIONS:
                if (!providerInstructions) {
                    return c('Title').t`Prepare for import`;
                }

                if (providerInstructions === PROVIDER_INSTRUCTIONS.YAHOO) {
                    return c('Title').t`Prepare Yahoo Mail for import`;
                }

                return c('Title').t`Prepare Gmail for import ${gmailInstructionsStep}/${GMAIL_INSTRUCTION_STEPS_COUNT}`;
            case Step.START:
                return isReconnectMode ? c('Title').t`Reconnect your account` : c('Title').t`Start a new import`;
            case Step.PREPARE:
                return c('Title').t`Start import process`;
            case Step.STARTED:
                return c('Title').t`Import in progress`;
            default:
                return '';
        }
    }, [modalModel.step, providerInstructions, gmailInstructionsStep]);

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

    const moveToPrepareStep = (Importer: ImporterFromServer, providerFolders: MailImportFolder[]) => {
        setModalModel({
            ...modalModel,
            providerFolders: providerFolders.sort(destinationFoldersFirst),
            importID: Importer.ID,
            email: Importer.Email,
            imap: Importer.ImapHost,
            port: `${Importer.ImapPort}`,
            step: Step.PREPARE,
        });
    };

    const handleSubmitStartError = (error: Error & { data: { Code: number; Error: string } }) => {
        const { data: { Code, Error } = { Code: 0, Error: '' } } = error;

        if ([IMPORT_ERROR.AUTH_CREDENTIALS, IMPORT_ERROR.AUTH_IMAP].includes(Code)) {
            setModalModel({
                ...modalModel,
                errorCode: Code,
                errorLabel: Error,
                needIMAPDetails: modalModel.needIMAPDetails || Error === IMAP_CONNECTION_ERROR_LABEL,
            });
        }
    };

    const submitAuthentication = async (needIMAPDetails = false) => {
        /* If we already have an importID we can just fetch the folders and move on */
        if (modalModel.importID) {
            try {
                const { Importer } = await api(getMailImport(modalModel.importID));
                const { Folders = [] } = await api({
                    ...getMailImportFolders(Importer.ID, { Code: modalModel.password }),
                    /*
                        For this call we display a custom
                        error message on top of the form
                        and want to prevent the growler error
                    */
                    silence: true,
                });
                moveToPrepareStep(Importer, Folders);
            } catch (error) {
                handleSubmitStartError(error);
            }
            return;
        }

        if ((modalModel.imap && modalModel.port) || needIMAPDetails) {
            try {
                const { Importer } = await api({
                    ...createMailImport({
                        Email: modalModel.email,
                        ImapHost: modalModel.imap,
                        ImapPort: parseInt(modalModel.port, 10),
                        Sasl: 'PLAIN',
                        Code: modalModel.password,
                    }),
                    /*
                        For this call we display a custom
                        error message on top of the form
                        and want to prevent the growler error
                    */
                    silence: true,
                });
                await call();

                const { Folders = [] } = await api(getMailImportFolders(Importer.ID, { Code: modalModel.password }));
                moveToPrepareStep(Importer, Folders);
            } catch (error) {
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

    const submitOAuth = async () => {
        try {
            const { Importer } = await api({
                ...createMailImport({
                    ImapHost: oauthProps?.provider ? IMAPS[oauthProps.provider] : '',
                    ImapPort: 993,
                    Sasl: 'XOAUTH2',
                    Code: oauthProps?.code,
                    RedirectUri: oauthProps?.redirectURI,
                }),
            });
            await call();

            const { Folders = [] } = await api(getMailImportFolders(Importer.ID));
            moveToPrepareStep(Importer, Folders);
        } catch (error) {
            // @todo
            onClose();
        }
    };

    const launchImport = async () => {
        const { importID, payload } = modalModel;

        await api(
            createJobImport(importID, {
                ...payload,
                StartTime: payload.StartTime ? dateToTimestamp(payload.StartTime) : undefined,
                Mapping: payload.Mapping.filter(({ checked }: FolderMapping) => checked).map(
                    ({ Source, Destinations }: FolderMapping) => ({
                        Source,
                        Destinations,
                    })
                ),
            })
        );
        await call();

        setModalModel({
            ...modalModel,
            step: Step.STARTED,
        });
    };

    const resumeImport = async () => {
        await api(
            updateMailImport(modalModel.importID, {
                Email: modalModel.email,
                Code: modalModel.password,
                ImapHost: modalModel.imap,
                ImapPort: parseInt(modalModel.port, 10),
                Sasl: 'PLAIN',
            })
        );
        await api(resumeMailImport(modalModel.importID));
        await call();
        onClose();
    };

    const handleCancel = () => {
        if (!modalModel.email || modalModel.step === Step.STARTED || isReconnectMode) {
            onClose();
            return;
        }

        createModal(
            <ConfirmModal
                onConfirm={onClose}
                title={c('Confirm modal title').t`Quit import?`}
                cancel={c('Action').t`Continue import`}
                confirm={<ErrorButton type="submit">{c('Action').t`Discard`}</ErrorButton>}
            >
                <Alert>{c('Info').t`Your import will not be processed.`}</Alert>
                <Alert type="error">{c('Warning').t`Are you sure you want to discard your import?`}</Alert>
            </ConfirmModal>
        );
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        switch (modalModel.step) {
            case Step.START:
                if (isReconnectMode) {
                    await withLoading(resumeImport());
                    return;
                }
                await withLoading(submitAuthentication(modalModel.needIMAPDetails));
                break;
            case Step.INSTRUCTIONS:
                if (providerInstructions === PROVIDER_INSTRUCTIONS.GMAIL) {
                    if (gmailInstructionsStep === GMAIL_INSTRUCTIONS.IMAP) {
                        setGmailInstructionsStep(GMAIL_INSTRUCTIONS.LABELS);
                        return;
                    }
                    if (gmailInstructionsStep === GMAIL_INSTRUCTIONS.LABELS) {
                        setGmailInstructionsStep(GMAIL_INSTRUCTIONS.TWO_STEPS);
                        return;
                    }
                }

                setModalModel({
                    ...modalModel,
                    step: Step.START,
                });
                break;
            case Step.PREPARE:
                await withLoading(launchImport());
                break;
            case Step.STARTED:
                onClose();
                break;
            default:
                break;
        }
    };

    const cancelRenderer = useMemo(() => {
        if (modalModel.step === Step.STARTED) {
            return null;
        }

        const handleBack = () => {
            if (gmailInstructionsStep === GMAIL_INSTRUCTIONS.LABELS) {
                setGmailInstructionsStep(GMAIL_INSTRUCTIONS.IMAP);
            }
            if (gmailInstructionsStep === GMAIL_INSTRUCTIONS.TWO_STEPS) {
                setGmailInstructionsStep(GMAIL_INSTRUCTIONS.LABELS);
            }
        };

        const backButton =
            modalModel.step === Step.INSTRUCTIONS &&
            providerInstructions === PROVIDER_INSTRUCTIONS.GMAIL &&
            [GMAIL_INSTRUCTIONS.LABELS, GMAIL_INSTRUCTIONS.TWO_STEPS].includes(gmailInstructionsStep);

        return (
            <Button onClick={backButton ? handleBack : handleCancel}>
                {backButton ? c('Action').t`Back` : c('Action').t`Cancel`}
            </Button>
        );
    }, [modalModel.step, providerInstructions, gmailInstructionsStep, loading]);

    const submitRenderer = useMemo(() => {
        const { email, password, needIMAPDetails, imap, port, isPayloadInvalid, step } = modalModel;

        const disabledStartStep = needIMAPDetails
            ? !email || !password || !imap || !port || invalidPortError
            : !email || !password;

        switch (step) {
            case Step.INSTRUCTIONS:
                return providerInstructions ? (
                    <div>
                        <PrimaryButton type="submit">
                            {providerInstructions === PROVIDER_INSTRUCTIONS.GMAIL &&
                            gmailInstructionsStep !== GMAIL_INSTRUCTIONS.TWO_STEPS
                                ? c('Action').t`Next`
                                : c('Action').t`Start Import Assistant`}
                        </PrimaryButton>
                    </div>
                ) : (
                    <PrimaryButton type="submit">{c('Action').t`Skip to import`}</PrimaryButton>
                );
            case Step.START:
                return (
                    <PrimaryButton type="submit" disabled={disabledStartStep} loading={loading}>
                        {isReconnectMode ? c('Action').t`Reconnect` : c('Action').t`Next`}
                    </PrimaryButton>
                );
            case Step.PREPARE:
                return (
                    <PrimaryButton loading={loading} disabled={isPayloadInvalid} type="submit">
                        {c('Action').t`Start import`}
                    </PrimaryButton>
                );
            case Step.STARTED:
                return <PrimaryButton loading={loading} type="submit">{c('Action').t`Close`}</PrimaryButton>;
            default:
                return null;
        }
    }, [
        providerInstructions,
        gmailInstructionsStep,
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
        if (oauthProps) {
            void submitOAuth();
        }
    }, []);

    useEffect(() => {
        if (debouncedEmail && validateEmailAddress(debouncedEmail)) {
            void withLoading(checkAuth());
        } else {
            setShowPassword(false);
        }
    }, [debouncedEmail]);

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
            className={classnames([modalModel.step === Step.INSTRUCTIONS && providerInstructions && 'import-modal'])}
            {...rest}
        >
            {!isReconnectMode && modalModel.step !== Step.INSTRUCTIONS && (
                <ImportMailWizard step={modalModel.step} steps={wizardSteps} />
            )}
            {modalModel.step === Step.INSTRUCTIONS && (
                <ImportInstructionsStep
                    provider={providerInstructions}
                    changeProvider={changeProvider}
                    gmailInstructionsStep={gmailInstructionsStep}
                />
            )}
            {modalModel.step === Step.START && (
                <>
                    {oauthProps ? (
                        <Loader />
                    ) : (
                        <ImportStartStep
                            modalModel={modalModel}
                            updateModalModel={(newModel: ImportModalModel) => setModalModel(newModel)}
                            needAppPassword={needAppPassword}
                            showPassword={showPassword}
                            currentImport={currentImport}
                            invalidPortError={invalidPortError}
                        />
                    )}
                </>
            )}
            {modalModel.step === Step.PREPARE && (
                <ImportPrepareStep
                    address={address}
                    modalModel={modalModel}
                    updateModalModel={(newModel: ImportModalModel) => setModalModel(newModel)}
                />
            )}
            {modalModel.step === Step.STARTED && !loadingAddresses && address && (
                <ImportStartedStep address={address} modalModel={modalModel} />
            )}
        </FormModal>
    );
};

export default ImportMailModal;
