import { type FC, useCallback, useMemo, useRef, useState } from 'react';

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
import type { Maybe, MaybePromise } from '@proton/pass/types';

export type PasswordModalProps = {
    label?: string;
    loading?: boolean;
    message?: string;
    open?: boolean;
    placeholder?: string;
    submitLabel?: string;
    title: string;
    type: 'new-password' | 'current-password';
    warning?: string;
    onClose?: () => void;
    onSubmit?: (password: string) => MaybePromise<void>;
    onValidate?: (password: string) => Maybe<string>;
};

export const PasswordModal: FC<PasswordModalProps> = ({
    label,
    loading,
    message,
    open,
    placeholder,
    submitLabel,
    title,
    type,
    warning,
    onClose,
    onSubmit,
    onValidate,
}) => {
    const touched = useRef(false);
    const [password, setPassword] = useState('');
    const error = useMemo(() => onValidate?.(password), [password, onValidate]);

    const onValue = useCallback((value: string) => {
        touched.current = true;
        setPassword(value);
    }, []);

    return (
        <ModalTwo
            as={Form}
            onClose={onClose}
            onReset={onClose}
            onSubmit={() => !error && onSubmit?.(password)}
            open={open}
            size="small"
        >
            <ModalTwoHeader title={title} closeButtonProps={{ pill: true, disabled: loading }} />
            <ModalTwoContent>
                {message && (
                    <Card className="mb-4 text-sm" type="primary">
                        {message}
                    </Card>
                )}
                <InputFieldTwo
                    as={PasswordInputTwo}
                    autoComplete={type}
                    autoFocus
                    dense
                    disabled={loading}
                    error={touched.current ? error : undefined}
                    id="password"
                    label={label ?? c('Label').t`Password`}
                    onValue={onValue}
                    placeholder={placeholder ?? c('Placeholder').t`Password`}
                    required
                    value={password}
                />

                {warning && <div className="mt-4 mb-4 text-sm color-danger">{warning}</div>}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="danger" shape="outline" onClick={onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button type="submit" color="norm" loading={loading} disabled={loading || error !== undefined}>
                    {submitLabel ?? c('Action').t`Authenticate`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
