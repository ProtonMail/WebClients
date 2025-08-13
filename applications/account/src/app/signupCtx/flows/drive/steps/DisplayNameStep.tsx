import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldTwo, useErrorHandler, useFormErrors } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import Header from '../components/Layout/Header';
import Layout from '../components/Layout/Layout';

const DisplayNameStep = ({ onSubmit }: { onSubmit: (displayName: string) => Promise<void> }) => {
    const [loading, withLoading] = useLoading();

    const [displayName, setDisplayName] = useState('');
    const { validator, onFormSubmit } = useFormErrors();

    const handleError = useErrorHandler();

    return (
        <Layout>
            <Header />

            <div
                className="flex flex-column flex-nowrap accountDetailsStep min-h-custom justify-center"
                style={{ '--min-h-custom': 'calc(100vh - 4.25rem - 3.75rem)' }}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-column md:flex-row flex-nowrap items-center justify-center w-full p-4">
                        <div className="mx-auto w-full max-w-custom" style={{ '--max-w-custom': '27rem' }}>
                            <h1 className="font-arizona text-semibold text-8xl mb-4">
                                {c('Signup').t`Set display name`}
                            </h1>

                            <p className="mt-4 mb-6 mr-auto">
                                {c('Onboarding modal')
                                    .t`To get started, choose a display name. This is what people will see when you send an email, invite them to an event, or share a file.`}
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
                                    bigger
                                    label={c('Signup label').t`Display name`}
                                    error={validator([requiredValidator(displayName)])}
                                    disableChange={loading}
                                    autoFocus
                                    value={displayName}
                                    onValue={setDisplayName}
                                />
                                <Button
                                    size="large"
                                    color="norm"
                                    type="submit"
                                    fullWidth
                                    loading={loading}
                                    className="mt-4 py-4 text-semibold"
                                    pill
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
