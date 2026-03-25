import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InputFieldTwo, useErrorHandler, useFormErrors } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import Header from '../components/Layout/Header';
import Layout from '../components/Layout/Layout';
import { MeetSignupIntent, getMeetSignupIntentFromSearchParams } from '../helpers/path';
import displayNameIcon from './display-name-icon.svg';

const DisplayNameStep = ({ onSubmit }: { onSubmit: (displayName: string) => Promise<void> }) => {
    const [loading, withLoading] = useLoading();

    const [displayName, setDisplayName] = useState('');
    const { validator, onFormSubmit } = useFormErrors();

    const handleError = useErrorHandler();

    const location = useLocation();
    const meetIntent = getMeetSignupIntentFromSearchParams(new URLSearchParams(location.search));

    const getMeetAccountDisplayNameDescription = (meetIntent: MeetSignupIntent | undefined) => {
        if (meetIntent === MeetSignupIntent.Schedule) {
            return c('Signup: Meet').t`Choose your display name to continue scheduling your meeting`;
        }
        return c('Signup: Meet').t`Choose your display name to continue`;
    };

    return (
        <Layout>
            <Header />

            <div
                className="flex flex-column flex-nowrap accountDetailsStep min-h-custom justify-center"
                style={{ '--min-h-custom': 'calc(100vh - 4.25rem - 3.75rem)' }}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-column md:flex-row flex-nowrap items-center justify-center w-full p-4">
                        <div className="mx-auto w-full max-w-custom text-center" style={{ '--max-w-custom': '28rem' }}>
                            <img src={displayNameIcon} alt="" width={64} height={64} className="mb-4" />

                            <h1 className="font-arizona text-8xl mb-4">{c('Signup').t`You are all set`}</h1>

                            <p className="mt-4 mb-6 mr-auto color-weak text-lg">
                                {getMeetAccountDisplayNameDescription(meetIntent)}
                            </p>

                            <form
                                name="orgForm"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!onFormSubmit()) {
                                        return;
                                    }

                                    return withLoading(onSubmit(displayName).catch(handleError));
                                }}
                                method="post"
                                autoComplete="off"
                                noValidate
                            >
                                <InputFieldTwo
                                    id="displayName"
                                    label={c('Signup label').t`Name shown in meetings`}
                                    error={validator([requiredValidator(displayName)])}
                                    disableChange={loading}
                                    autoFocus
                                    value={displayName}
                                    onValue={setDisplayName}
                                    rootClassName="meet-signup-input-wrapper"
                                />
                                <Button
                                    size="large"
                                    color="norm"
                                    type="submit"
                                    fullWidth
                                    loading={loading}
                                    pill
                                    className="mt-2 py-4 text-semibold meet-signup-cta"
                                >
                                    {c('Action').t`Continue`}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DisplayNameStep;
