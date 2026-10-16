import { c } from 'ttag';

import { IcFileArrowInUp } from '@proton/icons/icons/IcFileArrowInUp';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { Layout } from '@proton/pass/components/Onboarding/Layout/Layout';
import { Card } from '@proton/pass/components/Onboarding/UI/Card';
import { OnboardingButton } from '@proton/pass/components/Onboarding/UI/OnboardingButton';
import { getWelcomeToText } from '@proton/shared/lib/apps/text';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import createIllustration from './intro-create.png';
import importIllustration from './intro-import.png';

export const Intro = () => {
    return (
        <Layout>
            <h1 className="text-bold">{getWelcomeToText(PASS_APP_NAME)}</h1>
            <h3>{c('Title').t`You’re a step away from autofill magic!`}</h3>
            <div className="flex flex-row justify-center gap-8 my-8">
                <Card className="py-4 flex flex-column gap-4 items-center">
                    <img src={importIllustration} alt="" />
                    <h3 className="text-bold mx-4">{c('Title').t`Move everything at once`}</h3>
                    <div className="px-4 w-full">
                        <OnboardingButton shape="solid" color="norm" fullWidth as="a" href="#/import">
                            <IcFileArrowInUp className="mr-2" />
                            <span>{c('Action').t`Import your passwords`}</span>
                        </OnboardingButton>
                    </div>
                </Card>
                <Card className="py-4 flex flex-column gap-4 items-center">
                    <img src={createIllustration} alt="" />
                    <h3 className="text-bold mx-4">{c('Title').t`Add one account`}</h3>
                    <div className="px-4 w-full">
                        <OnboardingButton shape="solid" color="norm" fullWidth as="a" href="#/create">
                            <IcPlus className="mr-2" />
                            <span>{c('Action').t`Create a login`}</span>
                        </OnboardingButton>
                    </div>
                </Card>
            </div>
            <a href="#/thank-you" className="color-weak text-xl w-fit-content mx-auto">
                {c('Action').t`Skip for now`}
            </a>
        </Layout>
    );
};
