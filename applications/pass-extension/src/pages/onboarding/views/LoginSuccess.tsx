import type { VFC } from 'react';
import { Fragment } from 'react';

import { c } from 'ttag';

import { Card, Href } from '@proton/atoms';
import { Button } from '@proton/atoms/Button';
import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';
import clsx from '@proton/utils/clsx';

import passBrandText from '../../../../public/assets/protonpass-brand.svg';
import { ExtensionHead } from '../../../shared/components/page/ExtensionHead';
import { OnboardingSuggestionContainer } from '../component/OnboardingSuggestionContainer';

import './LoginSuccess.scss';

export const LoginSuccess: VFC = () => {
    const steps = [
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

    const features: {
        key: string;
        icon: IconName;
        description: string;
        colorClass?: 'ui-note' | 'ui-alias' | 'ui-login';
    }[] = [
        {
            key: 'vaults',
            icon: 'pass-circles',
            description: c('Info').t`Multiple vaults`,
            colorClass: 'ui-note',
        },
        {
            key: '2fa',
            icon: 'lock',
            description: c('Info').t`Integrated 2FA authenticator`,
            colorClass: 'ui-login',
        },
        {
            key: 'customFields',
            icon: 'list-bullets',
            description: c('Info').t`Custom fields`,
            colorClass: 'ui-alias',
        },
    ];

    const brandNameJSX = (
        <img src={passBrandText} className="ml-2 h-custom" style={{ '--height-custom': '28px' }} key="brand" alt="" />
    );

    return (
        <>
            <ExtensionHead title={c('Title').t`Thank you for installing ${PASS_APP_NAME}`} />
            <div className="pass-lobby ui-standard w100 min-h-custom mw" style={{ '--min-height-custom': '100vh' }}>
                <div className="m-auto w100 p-14 color-norm pass-gradient-background">
                    <div className=" text-bold flex flex-column flex-align-items-center">
                        <div className="flex flex-align-items-center gap-2 mb-12">
                            {
                                <img
                                    src="/assets/protonpass-icon.svg"
                                    className="h-custom"
                                    style={{ '--height-custom': '24px' }}
                                    alt=""
                                />
                            }
                            <h3 className="">{brandNameJSX}</h3>
                        </div>
                        <h1 className="pass-onboarding--heading mb-12">
                            {c('Title').jt`The extension is now ready to use.`}
                        </h1>
                        <h2 className="h3 mb-12">
                            {c('Info').t`Below, you will find all the necessary information to get you started.`}
                        </h2>
                    </div>

                    <div className="flex flex-justify-center flex-nowrap on-tablet-flex-column gap-4">
                        {/* left section */}
                        <div className="flex flex-column">
                            {/* left section upper subsection */}
                            <div className="flex flex-nowrap on-mobile-flex-column gap-4">
                                <OnboardingSuggestionContainer
                                    title={c('Title').t`Discover ${PASS_APP_NAME}`}
                                    icon="star"
                                    className="mb-6 flex-item-fluid"
                                >
                                    <div className="w100">
                                        <iframe
                                            className="w100 h100"
                                            src="https://www.youtube.com/embed/Nbf8CgwvFr8"
                                            title={c('Info').t`Discover ${PASS_APP_NAME} Youtube Video`}
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                </OnboardingSuggestionContainer>
                                <OnboardingSuggestionContainer
                                    title={c('Title').t`Get the most out of Pass`}
                                    icon="star"
                                    className="mb-6 flex-item-fluid"
                                >
                                    <Card className="w100">
                                        <ol className="unstyled m-0">
                                            {features.map(({ key, icon, description, colorClass }, idx) => (
                                                <Fragment key={key}>
                                                    <li
                                                        className={clsx(
                                                            idx !== features.length - 1 && 'mb-4',
                                                            'flex flex-align-items-center'
                                                        )}
                                                    >
                                                        <div className="w40p mr-2" aria-hidden="true">
                                                            <Icon
                                                                name={icon}
                                                                className={clsx('h-custom', colorClass)}
                                                                style={{
                                                                    '--height-custom': '24px',
                                                                    color: 'var(--interaction-norm)',
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex-item-fluid text-left">{description}</div>
                                                    </li>
                                                    {idx !== features.length - 1 && <hr className="my-2 border-weak" />}
                                                </Fragment>
                                            ))}
                                        </ol>
                                    </Card>
                                    <div>{c('Info')
                                        .t`Unlock all of these great features and more by upgrading to ${BRAND_NAME} Unlimited.`}</div>
                                    <Button className="w100" pill shape="solid" color="norm">
                                        {c('Action').t`Upgrade to Unlimited`}
                                    </Button>
                                </OnboardingSuggestionContainer>
                            </div>
                            {/* left section lower subsection */}
                            <div className="flex flex-nowrap on-mobile-flex-column gap-4">
                                <OnboardingSuggestionContainer
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
                                </OnboardingSuggestionContainer>
                                <OnboardingSuggestionContainer
                                    title={c('Title').t`Get the mobile app`}
                                    icon="mobile"
                                    className="flex-item-fluid-auto"
                                >
                                    <img src="/assets/onboarding-mobile.png" alt="" />
                                    <div>{c('Info').t`Access your passwords on the go with our mobile apps.`}</div>
                                    <div className="flex gap-4">
                                        <Href href="https://play.google.com/store/apps/details?id=proton.android.pass">
                                            <img
                                                width="140"
                                                className="mr-3 mb-2"
                                                src={playStoreSvg}
                                                alt="Play Store"
                                            />
                                        </Href>
                                        {/* TODO App Store replace dummy ProtonMail link with ProtonPass link when it's released */}
                                        <Href href="https://apps.apple.com/app/proton-mail-encrypted-email/id979659905">
                                            <img width="140" src={appStoreSvg} alt="App Store" />
                                        </Href>
                                    </div>
                                </OnboardingSuggestionContainer>
                            </div>
                        </div>

                        {/* right section */}
                        <div className="flex">
                            <div className="flex flex-item-fluid-auto" style={{ height: 'fit-content' }}>
                                {/* TODO replace iconPath with icon=pin-filled and delete assets/pin-filled.svg when the icon is released on core */}
                                <OnboardingSuggestionContainer
                                    title={c('Title').t`Pin the extension`}
                                    iconPath="/assets/pin-filled.svg"
                                    className="flex-item-fluid-auto"
                                >
                                    <img src="/assets/onboarding-pin.gif" alt="" />
                                    <div>
                                        <div className="mb-5">
                                            {c('Info')
                                                .t`Follow these simple steps to get the best experience using ${PASS_APP_NAME}:`}
                                        </div>
                                        <ol className="unstyled m-0">
                                            {steps.map(({ key, icon, description }, idx) => (
                                                <li key={key} className="flex mb-4 flex-align-items-center">
                                                    <div
                                                        className="pass-onboarding--dot bg-primary rounded-50 text-center mr-4 relative"
                                                        aria-hidden="true"
                                                    >
                                                        <span className="absolute absolute-center">{idx + 1}</span>
                                                    </div>
                                                    <div className="w40p mr-2" aria-hidden="true">
                                                        <img
                                                            src={icon}
                                                            className="h-custom"
                                                            style={{ '--height-custom': '24px' }}
                                                            alt=""
                                                        />
                                                    </div>

                                                    <div className="flex-item-fluid text-left">{description}</div>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                </OnboardingSuggestionContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
