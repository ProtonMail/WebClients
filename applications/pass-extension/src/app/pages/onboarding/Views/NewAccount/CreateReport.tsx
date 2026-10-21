import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { c } from 'ttag';

import { Layout } from '@proton/pass/components/Onboarding/Layout/Layout';
import { OnboardingButton } from '@proton/pass/components/Onboarding/UI/OnboardingButton';
import { OpenExtension } from '@proton/pass/components/Onboarding/UI/OpenExtension';
import { Sample } from '@proton/pass/components/Onboarding/UI/Sample';
import { selectUser } from '@proton/pass/store/selectors/user';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { useCreateContext } from './CreateProvider';
import { Header } from './Header';

export const CreateReport = () => {
    const { service } = useCreateContext();
    const user = useSelector(selectUser);
    const handleClose = () => window.close();

    // No reports, go back
    if (!service) return <Redirect to="/create" />;

    return (
        <Layout>
            <OpenExtension />
            <div className="flex flex-column items-center lg:w-2/3 pass-onboarding-open-extension-margin">
                <Header
                    title={c('Title').t`First login created`}
                    subtitle={c('Title').t`You are ready to get the most out of ${PASS_APP_NAME}.`}
                />
                <Sample single service={service.title} userIdentifier={user?.Email ?? ''} url={service.urls[0]} />
                <OnboardingButton color="norm" fullWidth size="large" className="w-1/2 mt-8" onClick={handleClose}>
                    {c('Action').t`Close`}
                </OnboardingButton>
            </div>
        </Layout>
    );
};
