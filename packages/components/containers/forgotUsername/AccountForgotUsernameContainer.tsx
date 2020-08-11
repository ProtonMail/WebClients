import React, { FunctionComponent, useState } from 'react';
import { c } from 'ttag';
import { requestUsername } from 'proton-shared/lib/api/reset';
import { useHistory } from 'react-router-dom';

import { useApi, useNotifications, useLoading, EmailInput, PrimaryButton, Label } from '../../index';
import { Props as AccountLayoutProps } from '../signup/AccountPublicLayout';
import BackButton from '../signup/BackButton';
import SignupLabelInputRow from '../signup/SignupLabelInputRow';
import SignupSubmitRow from '../signup/SignupSubmitRow';

interface Props {
    Layout: FunctionComponent<AccountLayoutProps>;
}

const AccountForgotUsernameContainer = ({ Layout }: Props) => {
    const history = useHistory();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [email, setEmail] = useState('');

    const handleSubmit = async () => {
        await api(requestUsername(email));
        createNotification({
            text: c('Success')
                .t`If you entered a valid notification email we will send you an email with your usernames in the next minute.`,
        });
        history.push('/login');
    };

    const handleBack = () => {
        history.push('/login');
    };

    return (
        <Layout title={c('Title').t`Find email or username`} left={<BackButton onClick={handleBack} />}>
            <form
                className="signup-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    withLoading(handleSubmit());
                }}
            >
                <p>{c('Info')
                    .t`Enter your recovery email address or recovery phone number and we will send you your username or email address.`}</p>
                <SignupLabelInputRow
                    label={<Label htmlFor="email">{c('Label').t`Recovery email`}</Label>}
                    input={
                        <EmailInput
                            name="email"
                            autoFocus
                            autoCapitalize="off"
                            autoCorrect="off"
                            id="email"
                            value={email}
                            onChange={({ target }) => setEmail(target.value)}
                            required
                        />
                    }
                />
                <SignupSubmitRow>
                    <PrimaryButton
                        className="pm-button--large onmobile-w100"
                        disabled={!email}
                        loading={loading}
                        type="submit"
                    >{c('Action').t`Send my username`}</PrimaryButton>
                </SignupSubmitRow>
            </form>
        </Layout>
    );
};

export default AccountForgotUsernameContainer;
