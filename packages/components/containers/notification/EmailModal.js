import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    FormModal,
    Row,
    Label,
    Input,
    Field,
    AskPasswordModal,
    useModals,
    useNotifications,
    useApi,
    useEventManager
} from 'react-components';
import { c } from 'ttag';
import { srpAuth } from 'proton-shared/lib/srp';
import { updateEmail } from 'proton-shared/lib/api/settings';

const EmailModal = ({ email, onClose, ...rest }) => {
    const [input, setInput] = useState(email);
    const api = useApi();
    const [loading, setLoading] = useState(false);
    const handleChange = ({ target }) => setInput(target.value);
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const { password, totp } = await new Promise((resolve, reject) => {
                createModal(<AskPasswordModal onClose={reject} onSubmit={resolve} />);
            });
            await srpAuth({
                api,
                credentials: { password, totp },
                config: updateEmail({ Email: input })
            });
            await call();
            onClose();
            createNotification({ text: c('Success').t`Email updated` });
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    return (
        <FormModal
            loading={loading}
            onClose={onClose}
            onSubmit={handleSubmit}
            title={c('Title').t`Update reset/notification email`}
            small
            {...rest}
        >
            <Row>
                <Label htmlFor="emailInput">{c('Label').t`Email`}</Label>
                <Field>
                    <Input
                        id="emailInput"
                        value={input}
                        placeholder="name@domain.com"
                        onChange={handleChange}
                        autoFocus={true}
                        required
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

EmailModal.propTypes = {
    email: PropTypes.string,
    onClose: PropTypes.func
};

export default EmailModal;
