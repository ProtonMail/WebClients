import type { VFC } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { ButtonLike } from '@proton/atoms/Button';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';

import passBrandText from '../../../../public/assets/protonpass-brand.svg';
import { ExtensionHead } from '../../../shared/components/page/ExtensionHead';
import { OnboardingLink } from '../../../shared/links';
import { SubTheme } from '../../../shared/theme/sub-theme';

import './Welcome.scss';

const brandNameJSX = (
    <img src={passBrandText} className="ml-2 h-custom" style={{ '--h-custom': '28px' }} key="brand" alt="" />
);

export const Welcome: VFC = () => {
    return (
        <>
            <ExtensionHead title={c('Title').t`Thank you for installing ${PASS_APP_NAME}`} />
            <div className="pass-onboarding ui-standard w100 min-h-custom" style={{ '--min-h-custom': '100vh' }}>
                <div className="m-auto p-14 color-norm flex flex-justify-center">
                    <div className="pass-onboarding--gradient"></div>
                    <div className="flex flex-column max-w-custom" style={{ '--max-w-custom': '1024px' }}>
                        <div className="flex flex-align-items-center gap-2 mb-5">
                            {
                                <img
                                    src="/assets/protonpass-icon.svg"
                                    className="h-custom"
                                    style={{ '--h-custom': '36px' }}
                                    alt={PASS_APP_NAME}
                                />
                            }
                            <span>{brandNameJSX}</span>
                        </div>

                        <div className="flex gap-14">
                            {/* left section */}
                            <div className="flex pass-welcome--on-medium-default-grow" style={{ flex: 2 }}>
                                <div className="flex flex-column flex-item-fluid">
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
                                            src={OnboardingLink.YOUTUBE}
                                            title={c('Info').t`Discover ${PASS_APP_NAME} Youtube Video`}
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* right section */}
                            <div className="flex pass-welcome--on-medium-default-grow" style={{ flex: 1 }}>
                                <div className="flex flex-column flex-item-fluid gap-12">
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
                                            className={`w100 ${SubTheme.VIOLET} pass-welcome--import-btn`}
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
                                            <Href href={OnboardingLink.ANDROID}>
                                                <img
                                                    className="h-custom"
                                                    style={{ '--h-custom': '40px' }}
                                                    src={playStoreSvg}
                                                    alt="Play Store"
                                                />
                                            </Href>
                                            <Href href={OnboardingLink.IOS}>
                                                <img
                                                    className="h-custom"
                                                    style={{ '--h-custom': '40px ' }}
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
