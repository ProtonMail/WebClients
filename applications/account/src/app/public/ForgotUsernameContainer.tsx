import { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    InputFieldTwo,
    PhoneInput,
    Tabs,
    useApi,
    useErrorHandler,
    useFormErrors,
    useLoading,
    useMyLocation,
    useNotifications,
} from '@proton/components';
import { requestUsername } from '@proton/shared/lib/api/reset';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import LoginSupportDropdown from '../login/LoginSupportDropdown';
import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';

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
    const history = useHistory();
    const [loading, withLoading] = useLoading();
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    return (
        <form
            name="forgot-username"
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
                fullWidth
                tabs={[
                    {
                        title: c('Title').t`Email`,
                        content: (
                            <>
                                <div className="mb1 color-weak">
                                    {c('Info')
                                        .t`Enter your recovery email address and we will send you your username or email address.`}
                                </div>
                                <InputFieldTwo
                                    id="email"
                                    bigger
                                    label={c('Label').t`Recovery email address`}
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
                                <div className="mb1 color-weak">
                                    {c('Info')
                                        .t`Enter your recovery phone number and we will send you your username or email address.`}
                                </div>
                                <InputFieldTwo
                                    as={PhoneInput}
                                    id="phone"
                                    bigger
                                    label={c('Label').t`Recovery phone number`}
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
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-5">
                {c('Action').t`Send my username`}
            </Button>
            <Button
                size="large"
                color="norm"
                shape="ghost"
                fullWidth
                className="mt0-5"
                onClick={() => history.push(SSO_PATHS.LOGIN)}
            >{c('Action').t`Return to sign in`}</Button>
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

    const handleBackStep = (() => {
        return (
            onBack ||
            (() => {
                history.push('/login');
            })
        );
    })();

    const children = (
        <Main>
            <Header title={c('Title').t`Find email or username`} onBack={handleBackStep} />
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
        </Main>
    );
    return (
        <Layout onBack={handleBackStep} bottomRight={<LoginSupportDropdown />} hasDecoration={true}>
            {children}
        </Layout>
    );
};

export default ForgotUsernameContainer;
