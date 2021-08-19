import { useState, useMemo, FormEvent, useEffect } from 'react';
import { c } from 'ttag';

import {
    getAuthenticationMethod,
    createMailImport,
    startMailImportJob,
    getMailImportFolders,
    getMailImport,
    updateMailImport,
    resumeMailImportJob,
} from '@proton/shared/lib/api/mailImport';
import { noop } from '@proton/shared/lib/helpers/function';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { isNumber } from '@proton/shared/lib/helpers/validators';
import { Address } from '@proton/shared/lib/interfaces';

import { useLoading, useModals, useApi, useEventManager, useErrorHandler, useNotifications } from '../../../../hooks';
import useOAuthPopup, { getOAuthAuthorizationUrl } from '../../../../hooks/useOAuthPopup';

import { ConfirmModal, FormModal, Button, PrimaryButton, Alert, useDebounceInput } from '../../../../components';

import Wizard from '../../../../components/wizard/Wizard';

import { IMAPS } from '../constants';
import { G_OAUTH_SCOPE_MAIL } from '../../constants';

import {
    Step,
    ImportMailModalModel,
    IMPORT_ERROR,
    MailImportFolder,
    FolderMapping,
    Importer,
    TIME_UNIT,
    PROVIDER_INSTRUCTIONS,
    GMAIL_INSTRUCTIONS,
    AuthenticationMethod,
} from '../interfaces';

import { OAUTH_PROVIDER, OAuthProps } from '../../interfaces';

import ImportInstructionsStep from './steps/ImportInstructionsStep';
import ImportStartStep from './steps/ImportStartStep';
import ImportPrepareStep from './steps/ImportPrepareStep';
import ImportStartedStep from './steps/ImportStartedStep';

import { classnames } from '../../../../helpers';

import './ImportMailModal.scss';

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
    Sasl: AuthenticationMethod;
}

interface Props {
    currentImport?: Importer;
    onClose?: () => void;
    oauthProps?: OAuthProps;
    addresses: Address[];
}

const ImportMailModal = ({
    onClose = noop,
    currentImport,
    oauthProps: initialOAuthProps,
    addresses,
    ...rest
}: Props) => {
    const [oauthError, setOauthError] = useState(false);
    const [oauthProps, setOauthProps] = useState<OAuthProps | undefined>(initialOAuthProps);
    const isReconnectMode = !!currentImport;

    const [loading, withLoading] = useLoading();
    // useLoading seems buggy in this context for some reason
    const [oauthLoading, setOauthLoading] = useState(false);

    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const errorHandler = useErrorHandler();

    const { triggerOAuthPopup } = useOAuthPopup({
        authorizationUrl: getOAuthAuthorizationUrl({ scope: G_OAUTH_SCOPE_MAIL }),
    });

    const [providerInstructions, setProviderInstructions] = useState<PROVIDER_INSTRUCTIONS>();
    const [gmailInstructionsStep, setGmailInstructionsStep] = useState(GMAIL_INSTRUCTIONS.IMAP);

    const [showPassword, setShowPassword] = useState(false);

    const [gmail2StepsTabIndex, setGmail2StepsTabIndex] = useState(0);

    const changeGmail2StepsTabIndex = (index: number) => setGmail2StepsTabIndex(index);

    const initialStep = () => {
        if (oauthProps) {
            return Step.PREPARE;
        }
        if (isReconnectMode) {
            return Step.START;
        }
        return Step.INSTRUCTIONS;
    };

    const [modalModel, setModalModel] = useState<ImportMailModalModel>({
        step: initialStep(),
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
            AddressID: addresses[0].ID,
            Mapping: [],
            CustomFields: 0,
        },
        isPayloadInvalid: false,
    });
    const api = useApi();
    const { call } = useEventManager();

    const wizardSteps = [
        c('Wizard step').t`Authenticate`,
        c('Wizard step').t`Configure Import`,
        c('Wizard step').t`Import`,
    ];

    const debouncedEmail = useDebounceInput(modalModel.email);

    const changeProvider = (provider: PROVIDER_INSTRUCTIONS) => setProviderInstructions(provider);

    const needAppPassword = useMemo(() => modalModel.imap === IMAPS.YAHOO, [modalModel.imap]);
    const invalidPortError = useMemo(() => !isNumber(modalModel.port), [modalModel.port]);

    const title = useMemo(() => {
        const totalSteps = gmail2StepsTabIndex === 0 ? 4 : 3;

        switch (modalModel.step) {
            case Step.INSTRUCTIONS:
                if (!providerInstructions) {
                    return c('Title').t`Prepare for import`;
                }

                if (providerInstructions === PROVIDER_INSTRUCTIONS.YAHOO) {
                    return c('Title').t`Prepare Yahoo Mail for import`;
                }
                return c('Title').t`Prepare Gmail for import ${gmailInstructionsStep}/${totalSteps}`;
            case Step.START:
                return isReconnectMode ? c('Title').t`Reconnect your account` : c('Title').t`Start a new import`;
            case Step.PREPARE:
                return c('Title').t`Start import process`;
            case Step.STARTED:
                return c('Title').t`Import in progress`;
            default:
                return '';
        }
    }, [modalModel.step, providerInstructions, gmailInstructionsStep, gmail2StepsTabIndex]);

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
            errorCode: 0,
            errorLabel: '',
        });
    };

    const handleSubmitStartError = (error: Error & { data: { Code: number; Error: string } }) => {
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
                        Sasl: AuthenticationMethod.PLAIN,
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
        setOauthLoading(true);
        try {
            const { importID, imap, port } = modalModel;
            if (oauthProps && importID) {
                await api(
                    updateMailImport(importID, {
                        Code: oauthProps.code,
                        ImapHost: imap,
                        ImapPort: port,
                        Sasl: AuthenticationMethod.OAUTH,
                        RedirectUri: oauthProps?.redirectURI,
                    })
                );
                await api(resumeMailImportJob(importID));
                await call();

                onClose();
                return;
            }

            const { Importer } = await api({
                ...createMailImport({
                    ImapHost: oauthProps?.provider ? IMAPS[oauthProps.provider] : '',
                    ImapPort: 993,
                    Sasl: AuthenticationMethod.OAUTH,
                    Code: oauthProps?.code,
                    RedirectUri: oauthProps?.redirectURI,
                }),
                silence: true,
            });
            await call();

            const { Folders = [] } = await api(getMailImportFolders(Importer.ID));

            setOauthLoading(false);
            moveToPrepareStep(Importer, Folders);
        } catch (error) {
            setOauthError(true);
            setOauthLoading(false);

            const { data: { Code, Error } = { Code: 0, Error: '' } } = error;

            if (Code !== IMPORT_ERROR.IMAP_CONNECTION_ERROR) {
                createNotification({
                    text: Error,
                    type: 'error',
                });
                onClose();
                return;
            }

            setModalModel({
                ...modalModel,
                step: Step.PREPARE,
                errorCode: Code,
                errorLabel: Error,
            });
        }
    };

    const launchImport = async () => {
        const { importID, payload } = modalModel;

        await api(
            startMailImportJob(importID, {
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
                Sasl: AuthenticationMethod.PLAIN,
            })
        );
        await api(resumeMailImportJob(modalModel.importID));
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
                confirm={<Button color="danger" type="submit">{c('Action').t`Discard`}</Button>}
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
                    if (gmailInstructionsStep === GMAIL_INSTRUCTIONS.TWO_STEPS && gmail2StepsTabIndex === 0) {
                        setGmailInstructionsStep(GMAIL_INSTRUCTIONS.CAPTCHA);
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
            if (gmailInstructionsStep === GMAIL_INSTRUCTIONS.CAPTCHA) {
                setGmailInstructionsStep(GMAIL_INSTRUCTIONS.TWO_STEPS);
            }
        };

        const backButton =
            modalModel.step === Step.INSTRUCTIONS &&
            providerInstructions === PROVIDER_INSTRUCTIONS.GMAIL &&
            gmailInstructionsStep !== GMAIL_INSTRUCTIONS.IMAP;

        return (
            <Button shape="outline" onClick={backButton ? handleBack : handleCancel}>
                {backButton ? c('Action').t`Back` : c('Action').t`Cancel`}
            </Button>
        );
    }, [modalModel.step, providerInstructions, gmailInstructionsStep, loading]);

    const submitRenderer = useMemo(() => {
        const { email, password, needIMAPDetails, imap, port, isPayloadInvalid, step } = modalModel;

        const disabledStartStep = needIMAPDetails
            ? !email || !password || !imap || !port || invalidPortError
            : !email || !password;

        const showNext =
            providerInstructions === PROVIDER_INSTRUCTIONS.GMAIL &&
            ([GMAIL_INSTRUCTIONS.IMAP, GMAIL_INSTRUCTIONS.LABELS].includes(gmailInstructionsStep) ||
                (gmailInstructionsStep === GMAIL_INSTRUCTIONS.TWO_STEPS && gmail2StepsTabIndex === 0));

        switch (step) {
            case Step.INSTRUCTIONS:
                return providerInstructions ? (
                    <div>
                        <Button color="norm" type="submit">
                            {showNext ? c('Action').t`Next` : c('Action').t`Start Import Assistant`}
                        </Button>
                    </div>
                ) : (
                    <Button color="norm" type="submit">{c('Action').t`Skip to import`}</Button>
                );
            case Step.START:
                return (
                    <Button color="norm" type="submit" disabled={disabledStartStep} loading={loading}>
                        {isReconnectMode ? c('Action').t`Reconnect` : c('Action').t`Next`}
                    </Button>
                );
            case Step.PREPARE:
                if (oauthProps && oauthError) {
                    return (
                        <PrimaryButton
                            onClick={() => {
                                triggerOAuthPopup(OAUTH_PROVIDER.GOOGLE, setOauthProps);
                            }}
                        >
                            {c('Action').t`Reconnect`}
                        </PrimaryButton>
                    );
                }

                return (
                    <Button color="norm" loading={loading} disabled={oauthLoading || isPayloadInvalid} type="submit">
                        {c('Action').t`Start import`}
                    </Button>
                );
            case Step.STARTED:
                return <Button color="norm" loading={loading} type="submit">{c('Action').t`Close`}</Button>;
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
        oauthError,
        oauthProps,
        gmail2StepsTabIndex,
    ]);

    useEffect(() => {
        if (oauthProps) {
            setModalModel({
                ...modalModel,
                step: Step.PREPARE,
                errorCode: 0,
                errorLabel: '',
            });
            setOauthError(false);

            void submitOAuth();
        }
    }, [oauthProps]);

    useEffect(() => {
        if (modalModel.step !== Step.START) {
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
            className={classnames([modalModel.step === Step.INSTRUCTIONS && providerInstructions && 'import-modal'])}
            {...rest}
        >
            {!isReconnectMode && modalModel.step !== Step.INSTRUCTIONS && (
                <Wizard step={modalModel.step} steps={wizardSteps} />
            )}
            {modalModel.step === Step.INSTRUCTIONS && (
                <ImportInstructionsStep
                    provider={providerInstructions}
                    changeProvider={changeProvider}
                    gmailInstructionsStep={gmailInstructionsStep}
                    tabIndex={gmail2StepsTabIndex}
                    handleChangeIndex={changeGmail2StepsTabIndex}
                />
            )}
            {modalModel.step === Step.START && (
                <ImportStartStep
                    modalModel={modalModel}
                    updateModalModel={(newModel: ImportMailModalModel) => setModalModel(newModel)}
                    needAppPassword={needAppPassword}
                    showPassword={showPassword}
                    currentImport={currentImport}
                    invalidPortError={invalidPortError}
                />
            )}
            {modalModel.step === Step.PREPARE && (
                <ImportPrepareStep
                    addresses={addresses}
                    modalModel={modalModel}
                    updateModalModel={(newModel: ImportMailModalModel) => setModalModel(newModel)}
                />
            )}
            {modalModel.step === Step.STARTED && <ImportStartedStep addresses={addresses} modalModel={modalModel} />}
        </FormModal>
    );
};

export default ImportMailModal;
