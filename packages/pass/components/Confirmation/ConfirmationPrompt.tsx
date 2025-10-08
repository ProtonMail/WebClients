import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt from '@proton/components/components/prompt/Prompt';

import './ConfirmationPrompt.scss';

export type ConfirmationPromptHandles = {
    onCancel: () => void;
    onConfirm: () => void;
};

type Props = ConfirmationPromptHandles & {
    confirmText?: string;
    danger?: boolean;
    loading?: boolean;
    message: ReactNode;
    title: ReactNode;
};

export const ConfirmationPrompt: FC<Props> = ({
    confirmText,
    danger,
    loading,
    message,
    title,
    onCancel,
    onConfirm,
}) => {
    return (
        <Prompt
            open
            className="pass-prompt"
            title={<span className="text-break text-ellipsis-four-lines">{title}</span>}
            buttons={[
                <Button onClick={onConfirm} color={danger ? 'danger' : 'norm'} pill loading={loading}>
                    {confirmText ?? c('Action').t`Confirm`}
                </Button>,
                <Button onClick={onCancel} shape="outline" color="norm" pill disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>,
            ]}
        >
            {message}
        </Prompt>
    );
};
