import { type ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Loader from '@proton/components/components/loader/Loader';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
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
    /** Called when user subscription is completed */
    onSubscribed?: () => void;
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
    onSubscribed,
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

        config?.onUpgrade?.();
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
                onSubscribed,
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
        <ModalTwo {...modalProps} size="xsmall" data-testid={dataTestid} onClose={handleClose}>
            <ModalTwoContent unstyled>
                <div
                    className="relative flex justify-center items-center fade-in-up h-custom custom-bg"
                    style={{ '--h-custom': '11rem', '--custom-bg': 'var(--optional-background-lowered)' }}
                >
                    <ModalHeaderCloseButton
                        buttonProps={{
                            className: 'absolute right-0 top-0 mt-3 mr-3',
                        }}
                    />
                    <img src={illustration} alt="" />
                </div>
                <div className="m-8 text-center">
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
                    {config?.footerText ? <p className="mt-2 mb-0 text-sm color-weak">{config.footerText}</p> : null}
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default UpsellModal;
