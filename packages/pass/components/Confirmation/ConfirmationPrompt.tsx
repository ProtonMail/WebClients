import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Prompt } from '@proton/components';

export type ConfirmationPromptHandles = {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

type Props = ConfirmationPromptHandles & {
    title: ReactNode;
    message: ReactNode;
};

export const ConfirmationPrompt: FC<Props> = ({ title, message, open, onCancel, onConfirm }) => {
    return (
        <Prompt
            open={open}
            title={<span className="text-break">{title}</span>}
            buttons={[
                <Button onClick={onConfirm} color="norm" pill>
                    {c('Action').t`Confirm`}
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
