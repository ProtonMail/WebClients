import { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import EmailInput from '@proton/components/components/input/EmailInput';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { requestUsername } from '@proton/shared/lib/api/reset';

const MinimalForgotUsernameContainer = () => {
    const api = useApi();
    const history = useHistory();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [email, setEmail] = useState('');

    const handleSubmit = async () => {
        await api(requestUsername({ Email: email }));
        createNotification({
            text: c('Success')
                .t`If you entered a valid notification email we will send you an email with your usernames in the next minute`,
        });
        history.push('/login');
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                withLoading(handleSubmit());
            }}
        >
            <Alert className="mb-4">{c('Info')
                .t`Enter your recovery email address, and we'll send you your username(s). (This is usually the email address you provided during signup.)`}</Alert>
            <div className="mb-4">
                <EmailInput
                    name="email"
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    id="email"
                    placeholder={c('Placeholder').t`Email`}
                    value={email}
                    onChange={({ target }) => setEmail(target.value)}
                    required
                />
            </div>
            <div className="flex flex-nowrap justify-space-between mb-4">
                <Link to="/login">{c('Link').t`Back to login`}</Link>
                <Button color="norm" loading={loading} type="submit">{c('Action').t`Email me my username(s)`}</Button>
            </div>
        </form>
    );
};

export default MinimalForgotUsernameContainer;
