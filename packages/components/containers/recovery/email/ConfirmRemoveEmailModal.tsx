import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';

const Content = ({ hasReset, hasNotify }: { hasReset: boolean; hasNotify: boolean }) => {
    if (hasReset && !hasNotify) {
        return (
            <>
                <p>{c('Warning').t`By deleting this address, you will no longer be able to recover your account.`}</p>

                <p>{c('Warning').t`Are you sure you want to remove your recovery email?`}</p>
            </>
        );
    }

    if (hasNotify && !hasReset) {
        return (
            <>
                <p>{c('Warning')
                    .t`By deleting this address, you will no longer be able to receive daily email notifications.`}</p>

                <p>{c('Warning').t`Are you sure you want to remove your notification email?`}</p>
            </>
        );
    }

    return (
        <>
            <p>
                {c('Warning')
                    .t`By deleting this address, you will no longer be able to recover your account or receive daily email notifications.`}
            </p>

            <p>{c('Warning').t`Are you sure you want to remove your recovery email?`}</p>
        </>
    );
};

interface Props extends ModalProps {
    onConfirm: () => void;
    hasReset: boolean;
    hasNotify: boolean;
}

const ConfirmRemoveEmailModal = ({ hasReset, hasNotify, onConfirm, onClose, ...rest }: Props) => {
    return (
        <Prompt
            onClose={onClose}
            title={c('Title').t`Remove email`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                >
                    {c('Action').t`Remove`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <Content hasReset={hasReset} hasNotify={hasNotify} />
        </Prompt>
    );
};

export default ConfirmRemoveEmailModal;
