import { useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import useLoading from '@proton/hooks/useLoading';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { ServiceAccount } from '@proton/shared/lib/interfaces/ServiceAccount';

export type ServiceAccountConfirmAction = 'delete' | 'disable' | 'enable';

interface Props extends ModalStateProps {
    account: ServiceAccount;
    action: ServiceAccountConfirmAction;
    onConfirm: () => Promise<void>;
}

const ServiceAccountConfirmPrompt = ({ account, action, onConfirm, open, onClose, onExit }: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [error, setError] = useState<string>();
    const name = account.Name;
    const copy = {
        delete: {
            title: c('Title').t`Delete service account?`,
            action: c('Action').t`Delete`,
            description: c('Info').t`Deleting ${name} will revoke all its access tokens and remove its managers.`,
            success: c('Success').t`Service account deleted`,
        },
        disable: {
            title: c('Title').t`Disable service account?`,
            action: c('Action').t`Disable`,
            description: c('Info').t`Disabling ${name} will stop it from accessing ${BRAND_NAME} services.`,
            success: c('Success').t`Service account disabled`,
        },
        enable: {
            title: c('Title').t`Enable service account?`,
            action: c('Action').t`Enable`,
            description: c('Info').t`Enable ${name} to allow it to access ${BRAND_NAME} services again.`,
            success: c('Success').t`Service account enabled`,
        },
    }[action];

    const confirm = async () => {
        setError(undefined);
        try {
            await onConfirm();
            createNotification({ text: copy.success });
            onClose();
        } catch (e) {
            setError(
                getApiErrorMessage(e) ||
                    (e instanceof Error
                        ? e.message
                        : c('Error').t`The service account could not be updated. Please try again.`)
            );
        }
    };

    return (
        <Prompt
            open={open}
            onExit={onExit}
            onClose={() => !loading && onClose()}
            disableCloseOnEscape={loading}
            title={copy.title}
            buttons={[
                <Button
                    key="confirm"
                    color={action === 'enable' ? 'norm' : 'danger'}
                    loading={loading}
                    onClick={() => withLoading(confirm)}
                >
                    {copy.action}
                </Button>,
                <Button key="cancel" color="weak" disabled={loading} onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            {error && (
                <Banner variant="danger" role="alert" className="mb-4">
                    {error}
                </Banner>
            )}
            <p className="text-break">{copy.description}</p>
        </Prompt>
    );
};

export default ServiceAccountConfirmPrompt;
