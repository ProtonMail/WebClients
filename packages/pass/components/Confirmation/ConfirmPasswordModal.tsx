import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Form,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PasswordInputTwo,
} from '@proton/components';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import type { MaybePromise } from '@proton/pass/types';

type Props = {
    disabled?: boolean;
    message?: string;
    open?: boolean;
    onClose?: () => void;
    onSubmit?: (password: string) => MaybePromise<void>;
};

export const ConfirmPasswordModal: FC<Props> = ({ disabled, message, open, onClose, onSubmit }) => {
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (open) setPassword('');
    }, [open]);

    return (
        <ModalTwo
            as={Form}
            onClose={onClose}
            onReset={onClose}
            onSubmit={() => onSubmit?.(password)}
            open={open}
            size={'small'}
        >
            <ModalTwoHeader title={c('Title').t`Enter your password`} closeButtonProps={{ pill: true, disabled }} />
            <ModalTwoContent>
                {message && (
                    <Card className="mb-4 text-sm" type="primary">
                        {message}
                    </Card>
                )}
                <InputFieldTwo
                    as={PasswordInputTwo}
                    autoComplete="current-password"
                    autoFocus
                    id="password"
                    label={c('Label').t`Password`}
                    onValue={setPassword}
                    placeholder={c('Placeholder').t`Password`}
                    required
                    value={password}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="danger" shape="outline" onClick={onClose} disabled={disabled}>{c('Action')
                    .t`Cancel`}</Button>
                <Button type="submit" color="norm" loading={disabled}>
                    {c('Action').t`Authenticate`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
