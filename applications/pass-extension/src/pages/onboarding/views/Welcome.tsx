import type { VFC } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Button } from '@proton/atoms/Button';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';

import passBrandText from '../../../../public/assets/protonpass-brand.svg';
import { ExtensionHead } from '../../../shared/components/page/ExtensionHead';
import { OnboardingPanel } from '../component/OnboardingPanel';

import './Welcome.scss';

const getSteps = () => [
    {
        key: 'open',
        icon: '/assets/extension-menu.svg',
        description: c('Info').t`Open the Extensions menu`,
    },
    {
        key: 'pin',
        icon: '/assets/extension-pin.svg',
        description: c('Info').t`Pin ${PASS_APP_NAME} to your toolbar`,
    },
    {
        key: 'access',
        icon: '/assets/protonpass-icon.svg',
        description: c('Info').t`Access ${PASS_APP_NAME} via this icon`,
    },
];

export const Welcome: VFC = () => {
    const brandNameJSX = (
        <img src={passBrandText} className="ml-2 h-custom" style={{ '--height-custom': '28px' }} key="brand" alt="" />
    );
    const steps = getSteps();

    return (
        <>
            <ExtensionHead title={c('Title').t`Thank you for installing ${PASS_APP_NAME}`} />
            <div className="pass-welcome ui-standard w100 min-h-custom" style={{ '--min-height-custom': '100vh' }}>
                <div className="m-auto p-14 color-norm min-h-custom">
                    <div className="pass-welcome--gradient">{/* ADD IMAGE OVERLAY HERE */}</div>
                    <div className="pass-welcome--header-text text-bold flex flex-column flex-align-items-center">
                        <div className="flex flex-align-items-center gap-2 mb-10">
                            {
                                <img
                                    src="/assets/protonpass-icon.svg"
                                    className="h-custom"
                                    style={{ '--height-custom': '24px' }}
                                    alt={PASS_APP_NAME}
                                />
                            }
                            <span>{brandNameJSX}</span>
                        </div>

                        <h1 className="pass-onboarding--heading mb-4 text-no-bold">
                            <span className="text-rg">{c('Title').jt`The extension is now ready to use.`}</span>
                        </h1>
                        <h3 className="mb-8 text-lg">
                            {c('Info').t`Below, you will find all the necessary information to get you started.`}
                        </h3>
                    </div>

                    <div
                        className="mx-auto max-w-custom flex flex-justify-center flex-nowrap on-tablet-flex-column gap-6"
                        style={{ '--max-width-custom': '1024px' }}
                    >
                        {/* left section */}
                        <div className="flex flex-nowrap flex-column gap-6" style={{ flex: 2 }}>
                            {/* left section upper subsection */}
                            <div className="flex flex-nowrap on-mobile-flex-column gap-6 flex-item-fluid-auto">
                                <OnboardingPanel
                                    title={c('Title').t`Discover ${PASS_APP_NAME}`}
                                    icon="star"
                                    className="flex-item-fluid-auto"
                                >
                                    <div className="pass-welcome--onboarding-video rounded-xl">
                                        <iframe
                                            src="https://www.youtube.com/embed/Nm4DCAjePOM?cc_load_policy=1"
                                            title={c('Info').t`Discover ${PASS_APP_NAME} Youtube Video`}
                                            allowFullScreen
                                        />
                                    </div>
                                </OnboardingPanel>
                            </div>
                            {/* left section lower subsection */}
                            <div className="flex flex-nowrap on-mobile-flex-column gap-6">
                                <OnboardingPanel
                                    title={c('Title').t`Switching to Pass?`}
                                    icon="arrow-up-line"
                                    className="flex-item-fluid-auto"
                                >
                                    <img src="/assets/onboarding-import.png" alt="" />
                                    <div className="mb-1">
                                        {c('Info').t`Easily import your existing passwords into ${PASS_APP_NAME}.`}
                                    </div>
                                    <Button
                                        className="w100"
                                        pill
                                        shape="solid"
                                        color="norm"
                                        onClick={() => {
                                            window.location.href = '/settings.html#/import';
                                        }}
                                    >
                                        {c('Action').t`Import your passwords`}
                                    </Button>
                                </OnboardingPanel>
                                <OnboardingPanel
                                    title={c('Title').t`Get the mobile app`}
                                    icon="mobile"
                                    className="flex-item-fluid-auto"
                                >
                                    <img src="/assets/onboarding-mobile.png" alt="" />
                                    <div>{c('Info').t`Access your passwords on the go with our mobile apps.`}</div>
                                    <div className="flex gap-3 flex-nowrap">
                                        <Href href="https://play.google.com/store/apps/details?id=proton.android.pass">
                                            <img
                                                className="h-custom"
                                                style={{ '--height-custom': '40px' }}
                                                src={playStoreSvg}
                                                alt="Play Store"
                                            />
                                        </Href>
                                        <Href href="https://apps.apple.com/us/app/proton-pass-password-manager/id6443490629">
                                            <img
                                                className="h-custom"
                                                style={{ '--height-custom': '40px ' }}
                                                src={appStoreSvg}
                                                alt="App Store"
                                            />
                                        </Href>
                                    </div>
                                </OnboardingPanel>
                            </div>
                        </div>

                        {/* right section */}
                        <div className="flex" style={{ flex: 1 }}>
                            <div className="flex flex-item-fluid-auto" style={{ height: 'fit-content' }}>
                                {/* TODO replace iconPath with icon=pin-filled and delete assets/pin-filled.svg when the icon is released on core */}
                                <OnboardingPanel
                                    title={c('Title').t`Pin the extension`}
                                    iconPath="/assets/pin-filled.svg"
                                    className="flex-item-fluid-auto"
                                >
                                    <img
                                        src={
                                            BUILD_TARGET === 'firefox'
                                                ? '/assets/onboarding-pin-firefox.gif'
                                                : '/assets/onboarding-pin.gif'
                                        }
                                        alt=""
                                        className="pass-welcome--onboarding-pin rounded-xl"
                                    />
                                    <div>
                                        <div className="mb-5">
                                            {c('Info')
                                                .t`Follow these simple steps to get the best experience using ${PASS_APP_NAME}:`}
                                        </div>
                                        <ol className="unstyled m-0">
                                            {steps.map(({ key, icon, description }, idx) => (
                                                <li key={key} className="flex mb-4 flex-align-items-center">
                                                    <div
                                                        className="pass-onboarding--dot bg-primary rounded-50 text-center relative mr-1"
                                                        aria-hidden="true"
                                                    >
                                                        <span className="absolute absolute-center">{idx + 1}</span>
                                                    </div>
                                                    <div className="w40p text-center" aria-hidden="true">
                                                        <img
                                                            src={icon}
                                                            className="h-custom"
                                                            style={{ '--height-custom': '22px' }}
                                                            alt=""
                                                        />
                                                    </div>

                                                    <div className="flex-item-fluid text-left">{description}</div>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                </OnboardingPanel>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
