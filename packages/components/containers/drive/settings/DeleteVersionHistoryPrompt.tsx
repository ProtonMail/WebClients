import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import type { ModalStateProps } from '../../../components/modalTwo/useModalState';
import { useModalTwoStatic } from '../../../components/modalTwo/useModalTwo';
import Prompt from '../../../components/prompt/Prompt';

interface Props {
    message: ReactNode;
    onSubmit: () => Promise<unknown>;
    onCancel: () => void;
}

const DeleteVersionHistoryPrompt = ({
    message,
    onSubmit,
    onCancel,
    onClose,
    ...modalProps
}: Props & ModalStateProps) => {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        await onSubmit().finally(() => {
            setLoading(false);
            onClose();
        });
    };

    const handleCancel = () => {
        onCancel();
        onClose();
    };

    return (
        <Prompt
            {...modalProps}
            onClose={handleCancel}
            disableCloseOnEscape={loading}
            title={c('Title').t`Delete version history?`}
            buttons={[
                <Button color="danger" onClick={handleSubmit} loading={loading}>
                    {c('Action').t`Delete and confirm`}
                </Button>,
                <Button onClick={handleCancel} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>,
            ]}
        >
            <p className="m-0">{message}</p>
            <p className="mt-2 mb-0">{c('Info').t`You cannot undo this action.`}</p>
        </Prompt>
    );
};

export const useDeleteVersionHistoryPrompt = () => useModalTwoStatic(DeleteVersionHistoryPrompt);
