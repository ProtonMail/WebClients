import React, { useState } from 'react';
import { c } from 'ttag';
import { requestUsername } from 'proton-shared/lib/api/reset';
import { useHistory } from 'react-router-dom';
import { requiredValidator } from 'proton-shared/lib/helpers/formValidators';
import { noop } from 'proton-shared/lib/helpers/function';

import {
    Button,
    useApi,
    useNotifications,
    useLoading,
    useFormErrors,
    useErrorHandler,
    Tabs,
    PhoneInput,
    useMyLocation,
    InputFieldTwo,
} from 'react-components';
import BackButton from './BackButton';
import ButtonSpacer from './ButtonSpacer';
import Content from './Content';
import Main from './Main';
import Header from './Header';
import Footer from './Footer';
import LoginSupportDropdown from '../login/LoginSupportDropdown';
import TextSpacer from './TextSpacer';

type Method = 'email' | 'phone';
const ForgotUsernameForm = ({
    onSubmit,
    onChangeMethod,
    method,
    defaultCountry,
}: {
    onSubmit: (data: { email: string; method: 'email' } | { phone: string; method: 'phone' }) => Promise<void>;
    onChangeMethod: (method: Method) => void;
    method: Method;
    defaultCountry?: string;
}) => {
    const [loading, withLoading] = useLoading();
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    return (
        <form
            name="forgot-username"
            className="signup-form"
            onSubmit={(e) => {
                e.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                withLoading(onSubmit(method === 'email' ? { email, method } : { phone, method })).catch(noop);
            }}
            method="post"
        >
            <Tabs
                tabs={[
                    {
                        title: c('Title').t`Email`,
                        content: (
                            <>
                                <TextSpacer>
                                    {c('Info')
                                        .t`Enter your recovery email address and we will send you your username or email address.`}
                                </TextSpacer>
                                <InputFieldTwo
                                    id="email"
                                    bigger
                                    label={c('Label').t`Recovery email`}
                                    error={validator(method === 'email' ? [requiredValidator(email)] : [])}
                                    autoFocus
                                    disableChange={loading}
                                    autoComplete="email"
                                    value={email}
                                    onValue={setEmail}
                                />
                            </>
                        ),
                    },
                    {
                        title: c('Title').t`Phone`,
                        content: (
                            <>
                                <TextSpacer>
                                    {c('Info')
                                        .t`Enter your recovery phone number and we will send you your username or email address.`}
                                </TextSpacer>
                                <InputFieldTwo
                                    as={PhoneInput}
                                    id="phone"
                                    bigger
                                    label={c('Label').t`Recovery phone`}
                                    error={validator(method === 'phone' ? [requiredValidator(phone)] : [])}
                                    autoFocus
                                    defaultCountry={defaultCountry}
                                    disableChange={loading}
                                    autoComplete="phone"
                                    value={phone}
                                    onChange={setPhone}
                                />
                            </>
                        ),
                    },
                ]}
                value={method === 'email' ? 0 : 1}
                onChange={(id) => onChangeMethod(id === 0 ? 'email' : 'phone')}
            />
            <ButtonSpacer>
                <Button size="large" color="norm" type="submit" fullWidth loading={loading}>
                    {c('Action').t`Send my username`}
                </Button>
            </ButtonSpacer>
        </form>
    );
};

interface Props {
    onBack?: () => void;
}

const ForgotUsernameContainer = ({ onBack }: Props) => {
    const history = useHistory();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const { createNotification } = useNotifications();
    const errorHandler = useErrorHandler();
    const [method, setMethod] = useState<Method>('email');
    const [myLocation] = useMyLocation();
    const defaultCountry = myLocation?.Country?.toUpperCase();

    return (
        <Main>
            <Header
                title={c('Title').t`Find email or username`}
                left={
                    <BackButton
                        onClick={
                            onBack ||
                            (() => {
                                history.push('/login');
                            })
                        }
                    />
                }
            />
            <Content>
                <ForgotUsernameForm
                    method={method}
                    onChangeMethod={setMethod}
                    defaultCountry={defaultCountry}
                    onSubmit={(data) => {
                        const handleSubmit = async () => {
                            const config = data.method === 'email' ? { Email: data.email } : { Phone: data.phone };
                            await silentApi(requestUsername(config));
                            const text =
                                data.method === 'email'
                                    ? c('Success')
                                          .t`If you entered a valid recovery email we will send you an email with your usernames in the next minute.`
                                    : c('Success')
                                          .t`If you entered a valid recovery phone we will send you an sms with your usernames in the next minute.`;
                            createNotification({ text });
                            history.push('/login');
                        };

                        return handleSubmit().catch(errorHandler);
                    }}
                />
            </Content>
            <Footer>
                <LoginSupportDropdown />
            </Footer>
        </Main>
    );
};

export default ForgotUsernameContainer;
