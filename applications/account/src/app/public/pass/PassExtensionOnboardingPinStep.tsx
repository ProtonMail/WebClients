import type { FC } from 'react';

import { c } from 'ttag';

import { Layout } from '@proton/pass/components/Onboarding/Layout/Layout';
import { TwoColumns } from '@proton/pass/components/Onboarding/Layout/TwoColumns';
import { OnboardingButton } from '@proton/pass/components/Onboarding/UI/OnboardingButton';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import passIcon from '@proton/styles/assets/img/pass/protonpass-icon.svg';

import extensionMenuIcon from './pass-extension-onboarding-menu.svg';
import pinTutorialGif from './pass-extension-onboarding-pin-tutorial.gif';
import extensionPinIcon from './pass-extension-onboarding-pin.svg';

import './PassExtensionOnboardingPinStep.scss';

const getSteps = () => [
    {
        key: 'open',
        icon: extensionMenuIcon,
        description: c('Info').t`Open the Extensions menu`,
    },
    {
        key: 'pin',
        icon: extensionPinIcon,
        description: c('Info').t`Pin ${PASS_APP_NAME} to your toolbar`,
    },
    {
        key: 'access',
        icon: passIcon,
        description: c('Info').t`Click the icon to open it anytime.`,
    },
];

type Props = {
    onContinue: () => void;
};

export const PassExtensionOnboardingPinStep: FC<Props> = ({ onContinue }) => (
    <Layout>
        <TwoColumns>
            <div className="flex flex-column lg:flex-1 gap-8">
                <div className="flex flex-column gap-2">
                    <h1 className="h2 text-semibold">{c('Title').t`Pin the extension`}</h1>
                    <p className="my-0 color-weak text-xl">{c('Info')
                        .t`For easy access to your passwords and more.`}</p>
                </div>
                <ol className="unstyled m-0 flex flex-column gap-5 text-xl">
                    {getSteps().map(({ key, icon, description }, index) => (
                        <li key={key} className="flex flex-nowrap items-center">
                            <div
                                className="pass-extension-onboarding-pin-dot rounded-50 text-center mr-3 relative shrink-0"
                                aria-hidden="true"
                            >
                                <span className="absolute inset-center">{index + 1}</span>
                            </div>
                            <div
                                className="w-custom text-center mr-2 shrink-0"
                                style={{ '--w-custom': '2.5rem' }}
                                aria-hidden="true"
                            >
                                <img src={icon} className="h-custom" style={{ '--h-custom': '1.5rem' }} alt="" />
                            </div>
                            <span className="flex-1 text-left">{description}</span>
                        </li>
                    ))}
                </ol>
                <OnboardingButton size="large" color="norm" className="w-fit-content px-12" onClick={onContinue}>
                    {c('Action').t`Continue`}
                </OnboardingButton>
            </div>
            <div className="lg:flex-1 flex justify-center items-center">
                <img src={pinTutorialGif} alt="" width="325" />
            </div>
        </TwoColumns>
    </Layout>
);
