import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Prompt } from '@proton/components';

export type ConfirmationPromptHandles = {
    onCancel: () => void;
    onConfirm: () => void;
};

type Props = ConfirmationPromptHandles & {
    confirmText?: string;
    danger?: boolean;
    message: ReactNode;
    title: ReactNode;
};

export const ConfirmationPrompt: FC<Props> = ({ confirmText, danger, message, title, onCancel, onConfirm }) => {
    return (
        <Prompt
            open
            title={<span className="text-break">{title}</span>}
            buttons={[
                <Button onClick={onConfirm} color={danger ? 'danger' : 'norm'} pill>
                    {confirmText ?? c('Action').t`Confirm`}
                </Button>,
                <Button onClick={onCancel} shape="outline" color="norm" pill>
                    {c('Action').t`Cancel`}
                </Button>,
            ]}
        >
            {message}
        </Prompt>
    );
};
