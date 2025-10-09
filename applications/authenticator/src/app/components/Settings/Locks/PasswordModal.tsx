import { type FC, type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import type { AsyncModalState } from '@proton/pass/hooks/useAsyncModalHandles';

export type PasswordModalState = {
    label?: string;
    message?: ReactNode;
    placeholder?: string;
    submitLabel?: string;
    title: string;
};

type Props = Partial<AsyncModalState<{}>> &
    PasswordModalState & {
        onClose: () => void;
        onSubmit: (password: string) => void;
    };

export const PasswordModal: FC<Props> = ({
    title,
    label,
    loading,
    onClose,
    onSubmit,
    placeholder,
    submitLabel,
    open,
    message,
}) => {
    const [password, setPassword] = useState<string>('');

    return (
        <ModalTwo
            as={Form}
            onClose={onClose}
            onReset={onClose}
            onSubmit={() => onSubmit?.(password)}
            open={open}
            size="small"
        >
            <ModalTwoHeader title={title} />
            <ModalTwoContent className="mb-6">
                <div className="mb-4">{message}</div>
                <InputFieldTwo
                    as={PasswordInputTwo}
                    autoFocus
                    dense
                    disabled={loading}
                    label={label}
                    onValue={setPassword}
                    placeholder={placeholder ?? c('Placeholder').t`Password`}
                    required
                    value={password}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button pill shape="outline" onClick={onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button className="cta-button" type="submit" color="norm" loading={loading} disabled={loading}>
                    {submitLabel ?? c('Action').t`Confirm`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
