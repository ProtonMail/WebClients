import { type FC, useCallback, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import type { AsyncModalState } from '@proton/pass/hooks/useAsyncModalHandles';
import type { RequestForkOptions } from '@proton/pass/lib/auth/fork';
import type { ReauthActionPayload } from '@proton/pass/lib/auth/reauth';
import type { Maybe } from '@proton/pass/types';

import type { OnReauthFn } from './PasswordUnlockProvider';

export type PasswordModalState = {
    autofillable?: boolean;
    label?: string;
    message?: string;
    placeholder?: string;
    reauth?: ReauthActionPayload & { fork: Partial<RequestForkOptions> };
    submitLabel?: string;
    title: string;
    type: 'new-password' | 'current-password';
    warning?: string;
    onValidate?: (password: string) => Maybe<string>;
};

export type PasswordModalProps = AsyncModalState<PasswordModalState> & {
    onClose?: () => void;
    onSubmit?: (password: string) => void;
    onReauth?: OnReauthFn;
};

export const PasswordModal: FC<PasswordModalProps> = ({
    autofillable = true,
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
            data-protonpass-autosave-ignore="true"
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
                    {...(!autofillable ? { 'data-protonpass-ignore': true } : {})}
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
