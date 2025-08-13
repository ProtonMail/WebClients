import { useState } from 'react';

import { c } from 'ttag';

import { MAX_CHARS_API } from '@proton/account/organization';
import { Button } from '@proton/atoms';
import { InputFieldTwo, useFormErrors } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import Header from '../components/Layout/Header';
import Layout from '../components/Layout/Layout';

const OrgNameStep = ({ onSubmit }: { onSubmit: (orgName: string) => Promise<void> }) => {
    const [loading, withLoading] = useLoading();

    const [orgName, setOrgName] = useState('');
    const { validator, onFormSubmit } = useFormErrors();
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
                                {c('Signup').t`Set organization name`}
                            </h1>

                            <p className="mt-4 mb-6 mr-auto">{c('Signup')
                                .t`The organization name will be visible to your users while they are signed in.`}</p>

                            <form
                                name="orgForm"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!onFormSubmit()) {
                                        return;
                                    }
                                    return withLoading(onSubmit(orgName));
                                }}
                                method="post"
                                autoComplete="off"
                                noValidate
                            >
                                <InputFieldTwo
                                    id="orgName"
                                    bigger
                                    label={c('Signup label').t`Organization name`}
                                    error={validator([requiredValidator(orgName)])}
                                    disableChange={loading}
                                    autoFocus
                                    value={orgName}
                                    onValue={setOrgName}
                                    maxLength={MAX_CHARS_API.ORG_NAME}
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

export default OrgNameStep;
