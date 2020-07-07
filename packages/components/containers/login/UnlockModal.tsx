import React, { useState } from 'react';
import { c } from 'ttag';
import { srpAuth } from 'proton-shared/lib/srp';
import { queryUnlock } from 'proton-shared/lib/api/user';
import { useApi, FormModal, Row, Label, Field, PasswordInput } from '../../index';

interface Props {
    onSuccess?: () => void;
    onClose?: () => void;
}
const UnlockModal = ({ onClose, onSuccess, ...rest }: Props) => {
    const api = useApi();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await srpAuth({
                api,
                credentials: { password },
                config: queryUnlock()
            });
            onSuccess?.();
            onClose?.();
        } catch (e) {
            setPassword('');
            setLoading(false);
        }
    };

    return (
        <FormModal
            onClose={onClose}
            onSubmit={handleSubmit}
            title={c('Title').t`Sign in again to continue`}
            close={c('Label').t`Cancel`}
            submit={c('Label').t`Submit`}
            loading={loading}
            small
            {...rest}
        >
            <Row>
                <Label htmlFor="password">{c('Label').t`Password`}</Label>
                <Field>
                    <PasswordInput
                        id="password"
                        value={password}
                        onChange={({ target }) => setPassword(target.value)}
                        autoFocus={true}
                        required
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

export default UnlockModal;
