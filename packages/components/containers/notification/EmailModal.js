import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    AuthModal,
    FormModal,
    Row,
    Label,
    Input,
    Field,
    useLoading,
    useModals,
    useNotifications,
    useEventManager
} from 'react-components';
import { c } from 'ttag';
import { updateEmail } from 'proton-shared/lib/api/settings';

const EmailModal = ({ email, onClose, ...rest }) => {
    const [input, setInput] = useState(email);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();

    const handleChange = ({ target }) => setInput(target.value);

    const handleSubmit = async () => {
        await new Promise((resolve, reject) => {
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={updateEmail({ Email: input })} />);
        });
        await call();

        createNotification({ text: c('Success').t`Email updated` });
        onClose();
    };

    return (
        <FormModal
            loading={loading}
            onClose={onClose}
            onSubmit={() => withLoading(handleSubmit())}
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
