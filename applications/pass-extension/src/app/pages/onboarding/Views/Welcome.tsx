import { type FC, useCallback, useState } from 'react';

import { OnboardingCard } from 'proton-pass-extension/app/pages/onboarding/Card/OnboardingCard';
import { OnboardingHeader } from 'proton-pass-extension/app/pages/onboarding/Header/OnboardingHeader';
import { ExtensionHead } from 'proton-pass-extension/lib/components/Extension/ExtensionHead';
import { useExtensionClientInit } from 'proton-pass-extension/lib/hooks/useExtensionClientInit';
import { c } from 'ttag';

import { ButtonLike, Href } from '@proton/atoms';
import accountSetupImg from '@proton/pass/assets/protonpass-account.svg';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import { PASS_ANDROID_URL, PASS_IOS_URL, PASS_VIDEO_URL } from '@proton/pass/constants';
import { clientReady } from '@proton/pass/lib/client';
import { pageMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { SpotlightMessage, WorkerMessageType } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';
import clsx from '@proton/utils/clsx';

import './Welcome.scss';

export const Welcome: FC = () => {
    const [pendingAccess, setPendingAccess] = useState(false);

    useExtensionClientInit(
        useCallback(({ status }) => {
            if (clientReady(status)) {
                void sendMessage.onSuccess(
                    pageMessage({ type: WorkerMessageType.SPOTLIGHT_REQUEST }),
                    async ({ message }) => setPendingAccess(message === SpotlightMessage.PENDING_SHARE_ACCESS)
                );
            }
        }, [])
    );

    return (
        <>
            <ExtensionHead title={c('Title').t`Thank you for installing ${PASS_APP_NAME}`} />
            <div className="pass-onboarding ui-standard w-full min-h-custom" style={{ '--min-h-custom': '100vh' }}>
                <div className="m-auto p-14 color-norm flex justify-center">
                    <div className="pass-onboarding--gradient"></div>
                    <div className="flex flex-column max-w-custom" style={{ '--max-w-custom': '64rem' }}>
                        <OnboardingHeader />

                        <div className={clsx('anime-reveal', !pendingAccess && 'anime-reveal--hidden')}>
                            {pendingAccess && (
                                <OnboardingCard className="mb-4 items-center">
                                    <div className="flex-1">
                                        <h3>{c('Info').t`Pending access to the shared data`}</h3>
                                        <span>{c('Info')
                                            .t`For security reason, your access needs to be confirmed`}</span>
                                    </div>
                                    <img
                                        className="h-custom shrink-0"
                                        style={{ '--h-custom': '4rem' }}
                                        src={accountSetupImg}
                                        alt=""
                                    />
                                </OnboardingCard>
                            )}
                        </div>

                        <div className="flex gap-14">
                            {/* left section */}
                            <div className="flex pass-welcome--on-medium-default-grow" style={{ flex: 2 }}>
                                <div className="flex flex-column flex-1">
                                    <h1 className="text-xl pass-onboarding--white-text mb-4 text-bold">
                                        <span className="text-rg">{c('Title')
                                            .jt`The extension is now ready to use.`}</span>
                                    </h1>
                                    <h3 className="mb-5 text-xl">
                                        {c('Info')
                                            .t`Here you will find all the necessary information to get you started.`}
                                    </h3>
                                    <div className="pass-welcome--onboarding-video rounded-xl">
                                        <iframe
                                            src={PASS_VIDEO_URL}
                                            title={c('Info').t`Discover ${PASS_APP_NAME} Youtube Video`}
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* right section */}
                            <div className="flex pass-welcome--on-medium-default-grow" style={{ flex: 1 }}>
                                <div className="flex flex-column flex-1 gap-12">
                                    {/* right section upper subsection */}
                                    <div className="flex flex-column gap-5">
                                        <h1 className="text-xl pass-onboarding--white-text text-bold">
                                            <span className="text-rg">{c('Title')
                                                .jt`Switching to ${PASS_APP_NAME}?`}</span>
                                        </h1>
                                        <img src="/assets/onboarding-import.png" alt="" />
                                        <div className="text-xl">
                                            {c('Info').t`Easily import your existing passwords into ${PASS_APP_NAME}.`}
                                        </div>
                                        <ButtonLike
                                            as="a"
                                            href="/settings.html#/import"
                                            className={`w-full ${SubTheme.VIOLET} pass-welcome--import-btn`}
                                            pill
                                            size="large"
                                            shape="solid"
                                            color="norm"
                                            aria-label={c('Action').t`Import your passwords`}
                                        >
                                            {c('Action').t`Import your passwords`}
                                        </ButtonLike>
                                    </div>
                                    {/* right section lower subsection */}
                                    <div className="flex flex-column gap-5">
                                        <h1 className="text-xl pass-onboarding--white-text text-bold">
                                            <span className="text-rg">{c('Title').jt`Get the mobile apps`}</span>
                                        </h1>
                                        <div className="text-xl">{c('Info')
                                            .t`Access your passwords on the go with our mobile apps.`}</div>
                                        <div className="flex gap-3 flex-nowrap">
                                            <Href href={PASS_ANDROID_URL}>
                                                <img
                                                    className="h-custom"
                                                    style={{ '--h-custom': '2.5rem' }}
                                                    src={playStoreSvg}
                                                    alt="Play Store"
                                                />
                                            </Href>
                                            <Href href={PASS_IOS_URL}>
                                                <img
                                                    className="h-custom"
                                                    style={{ '--h-custom': '2.5rem ' }}
                                                    src={appStoreSvg}
                                                    alt="App Store"
                                                />
                                            </Href>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
