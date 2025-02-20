import { type ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Loader from '@proton/components/components/loader/Loader';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import useApi from '@proton/components/hooks/useApi';
import { PLAN_NAMES } from '@proton/payments';
import { getAppFromPathname } from '@proton/shared/lib/apps/slugHelper';
import { promiseWithTimeout } from '@proton/shared/lib/helpers/promise';
import {
    SentryMailInitiatives,
    captureInitiativeMessage,
    traceInitiativeError,
} from '@proton/shared/lib/helpers/sentry';
import {
    type SourceEventUpsell,
    UPSELL_MODALS_TYPE,
    sendRequestUpsellModalReport,
} from '@proton/shared/lib/helpers/upsell';
import clsx from '@proton/utils/clsx';

import useFetchMailUpsellModalConfig, { type MailUpsellConfig } from '../useFetchMailUpsellModalConfig';

import './UpsellModal.scss';

export interface UpsellModalProps {
    title: ReactNode;
    /** Image displayed above the title */
    illustration: string;
    modalProps: ModalStateProps;
    sourceEvent: SourceEventUpsell;
    upsellRef?: string;
    /** Text displayed before the CTA */
    description?: ReactNode;
    /** Text displayed below the description */
    customDescription?: ReactNode;
    /** On CTA click, redirect to account page instead of opening payment modal */
    preventInAppPayment?: boolean;
    // TODO remove as it can be handled by overriding the modal props
    onClose?: () => void;
    /** Called when payment upgrade is completed */
    onUpgrade?: () => void;
    ['data-testid']?: string;
}

const UpgradeButton = ({
    path,
    onClick,
    submitText,
}: {
    onClick: () => void;
    path?: string;
    submitText?: ReactNode;
}) => {
    if (path) {
        return (
            <ButtonLike
                as={SettingsLink}
                color="norm"
                fullWidth
                onClick={onClick}
                path={path}
                shape="solid"
                size="medium"
            >
                {submitText}
            </ButtonLike>
        );
    }

    return (
        <Button color="norm" fullWidth size="medium" shape="solid" onClick={onClick}>
            {submitText}
        </Button>
    );
};

const UpsellModal = ({
    'data-testid': dataTestid,
    modalProps,
    title,
    description,
    customDescription,
    illustration,
    onClose,
    sourceEvent,
    upsellRef,
    preventInAppPayment,
    onUpgrade,
}: UpsellModalProps) => {
    const api = useApi();
    const [config, setConfig] = useState<MailUpsellConfig | null>(null);
    const fetchUpsellConfig = useFetchMailUpsellModalConfig();

    const handleUpgrade = () => {
        const application = getAppFromPathname(window.location.pathname);
        if (application) {
            sendRequestUpsellModalReport({ api, application, sourceEvent, upsellModalType: UPSELL_MODALS_TYPE.NEW });
        } else {
            captureInitiativeMessage(SentryMailInitiatives.UPSELL_MODALS, 'Application not found');
        }

        // TODO check if config.onUpgrade is needed here
        config?.onUpgrade?.();
        onUpgrade?.();
        modalProps.onClose();
    };

    const handleClose = () => {
        onClose?.();
        modalProps.onClose();
    };

    const submitText = (() => {
        if (!config) {
            return null;
        }

        const planName = PLAN_NAMES[config.planID];
        return config.submitText || c('new_plans: Action').t`Upgrade to ${planName}`;
    })();

    useEffect(() => {
        const fetchTimeout = 3000;
        promiseWithTimeout({
            promise: fetchUpsellConfig({
                upsellRef,
                preventInApp: preventInAppPayment,
                onSubscribed: handleUpgrade,
            }),
            timeoutMs: fetchTimeout,
            errorMessage: `Upsell config fetch took more than limit of ${fetchTimeout}ms`,
        })
            .then((config) => {
                setConfig(config);
            })
            .catch((e) => {
                traceInitiativeError(SentryMailInitiatives.UPSELL_MODALS, e);
                // TODO set a generic config with generic text containing no price
            });
    }, []);

    return (
        <ModalTwo className="modal-two--twocolors" data-testid={dataTestid} {...modalProps} onClose={handleClose}>
            <ModalTwoHeader />
            <div className="modal-two-illustration-container relative text-center">
                <img src={illustration} alt="" />
            </div>
            <div className="modal-two-content-container overflow-auto">
                <ModalTwoContent className="my-8 text-center">
                    <h1 className="text-lg text-bold">{title}</h1>
                    {description && <p className="mt-2 mb-6 text-wrap-balance color-weak">{description}</p>}
                    <div className={clsx(customDescription ? 'mb-4' : '')}>
                        {config ? (
                            <UpgradeButton onClick={handleUpgrade} path={config.upgradePath} submitText={submitText} />
                        ) : (
                            <Loader size="medium" />
                        )}
                    </div>
                    {customDescription && <div className="mt-2 mb-6">{customDescription}</div>}
                    {config?.footerText ? <p className={'mt-2 text-sm color-weak'}>{config.footerText}</p> : null}
                </ModalTwoContent>
            </div>
        </ModalTwo>
    );
};

export default UpsellModal;
