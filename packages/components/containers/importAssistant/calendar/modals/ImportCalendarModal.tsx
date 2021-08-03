import { useState, useMemo, FormEvent, useEffect } from 'react';
import { c } from 'ttag';

import { createCalendarImport, startCalendarImportJob } from '@proton/shared/lib/api/calendarImport';
import { noop } from '@proton/shared/lib/helpers/function';
import { Address } from '@proton/shared/lib/interfaces';

import { useLoading, useModals, useApi, useEventManager, useNotifications } from '../../../../hooks';
import useOAuthPopup, { getOAuthAuthorizationUrl } from '../../../../hooks/useOAuthPopup';

import { ConfirmModal, FormModal, Button, PrimaryButton, Alert } from '../../../../components';

import Wizard from '../../../../components/wizard/Wizard';

import { G_OAUTH_SCOPE_CALENDAR } from '../../constants';

import { Step, ImportCalendarModalModel, IMPORT_ERROR } from '../interfaces';

import { OAUTH_PROVIDER, OAuthProps } from '../../interfaces';

import ImportPrepareStep from './steps/ImportPrepareStep';
import ImportStartedStep from './steps/ImportStartedStep';

interface ImporterFromServer {
    Account: string;
    ID: string;
    Provider: OAUTH_PROVIDER;
    UserID: string;
}

interface Props {
    onClose?: () => void;
    oauthProps?: OAuthProps;

    addresses: Address[];
}

const ImportCalendarModal = ({ onClose = noop, oauthProps: initialOAuthProps, addresses, ...rest }: Props) => {
    const [oauthError, setOauthError] = useState(false);
    const [oauthProps, setOauthProps] = useState<OAuthProps | undefined>(initialOAuthProps);

    const [loading, withLoading] = useLoading();
    // useLoading seems buggy in this context for some reason
    const [oauthLoading, setOauthLoading] = useState(false);

    const { createModal } = useModals();
    const { createNotification } = useNotifications();

    const { triggerOAuthPopup } = useOAuthPopup({
        authorizationUrl: getOAuthAuthorizationUrl({ scope: G_OAUTH_SCOPE_CALENDAR }),
    });

    const [modalModel, setModalModel] = useState<ImportCalendarModalModel>({
        step: Step.PREPARE,
        email: '',
        importID: '',
        errorCode: 0,
        errorLabel: '',
        payload: {
            AddressID: addresses?.length ? addresses[0].ID : '',
        },
        isPayloadInvalid: false,
    });

    const api = useApi();
    const silentApi = <T,>(config: any) => api<T>({ ...config, silence: true });
    const { call } = useEventManager();

    const wizardSteps = [
        c('Wizard step').t`Authenticate`,
        c('Wizard step').t`Configure Import`,
        c('Wizard step').t`Import`,
    ];

    const modalTitles = {
        [Step.PREPARE]: c('Title').t`Start import process`,
        [Step.STARTED]: c('Title').t`Import in progress`,
    };

    const title = modalTitles[modalModel.step] || '';

    const moveToPrepareStep = (Importer: ImporterFromServer) => {
        setModalModel({
            ...modalModel,
            importID: Importer.ID,
            email: Importer.Account,
            step: Step.PREPARE,
            errorCode: 0,
            errorLabel: '',
        });
    };

    const submitOAuth = async () => {
        setOauthLoading(true);

        try {
            const { Importer } = await silentApi({
                ...createCalendarImport({
                    Code: oauthProps?.code,
                    RedirectUri: oauthProps?.redirectURI,
                    Provider: oauthProps?.provider,
                }),
            });
            await call();

            setOauthLoading(false);
            moveToPrepareStep(Importer);
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

        await api(startCalendarImportJob(importID, payload));
        await call();

        setModalModel({
            ...modalModel,
            step: Step.STARTED,
        });
    };

    const handleCancel = () => {
        if (modalModel.step === Step.STARTED) {
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

        return (
            <Button shape="outline" onClick={handleCancel}>
                {c('Action').t`Cancel`}
            </Button>
        );
    }, [modalModel.step, loading]);

    const submitRenderer = useMemo(() => {
        const { isPayloadInvalid, step } = modalModel;

        switch (step) {
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
    }, [modalModel.step, modalModel.isPayloadInvalid, loading, oauthError, oauthProps]);

    useEffect(() => {
        void submitOAuth();
    }, []);

    // Initialize AddressID
    useEffect(() => {
        if (!addresses?.length && !modalModel.payload.AddressID) {
            return;
        }
        setModalModel({
            ...modalModel,
            payload: {
                AddressID: addresses[0].ID,
            },
        });
    }, [addresses]);

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
            <Wizard step={modalModel.step} steps={wizardSteps} />
            {modalModel.step === Step.PREPARE && <ImportPrepareStep addresses={addresses} modalModel={modalModel} />}
            {modalModel.step === Step.STARTED && <ImportStartedStep addresses={addresses} modalModel={modalModel} />}
        </FormModal>
    );
};

export default ImportCalendarModal;
