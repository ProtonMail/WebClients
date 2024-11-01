import { type FC } from 'react';

import { useAuthService } from 'proton-pass-web/app/Auth/AuthServiceProvider';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import onboarding1 from '@proton/pass/assets/desktop-onboarding/onboarding-1.png';
import onboarding2 from '@proton/pass/assets/desktop-onboarding/onboarding-2.png';
import onboarding3 from '@proton/pass/assets/desktop-onboarding/onboarding-3.png';
import onboarding4 from '@proton/pass/assets/desktop-onboarding/onboarding-4.png';
import onboarding5 from '@proton/pass/assets/desktop-onboarding/onboarding-5.png';
import onboarding6 from '@proton/pass/assets/desktop-onboarding/onboarding-6.png';
import onboarding7 from '@proton/pass/assets/desktop-onboarding/onboarding-7.png';
import passBrandText from '@proton/pass/assets/protonpass-brand.svg';
import { Carousel } from '@proton/pass/components/Carousel/Carousel';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { APPS, BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import protonPassIcon from '@proton/styles/assets/img/pass/protonpass-icon.svg';

import { dismissFirstLaunch } from '../../firstLaunch';

import './WelcomeScreen.scss';

export const WelcomeScreen: FC = () => {
    const authService = useAuthService();
    const online = useConnectivity();
    const { SSO_URL: host } = usePassConfig();

    const onRegister = () => {
        dismissFirstLaunch();
        authService.requestFork({ host, app: APPS.PROTONPASS, forkType: ForkType.SIGNUP });
    };

    const onFork = () => {
        dismissFirstLaunch();
        authService.requestFork({ host, app: APPS.PROTONPASS, forkType: ForkType.SWITCH });
    };

    const steps = [
        {
            image: onboarding1,
            title: c('Label').t`Free password manager with identity protection`,
            description: c('Label')
                .t`Securely store, share and auto-login your accounts with ${PASS_APP_NAME}, using end-to-end encryption trusted by millions`,
        },
        {
            image: onboarding2,
            title: c('Label').t`Sign in faster with ${PASS_APP_NAME}`,
            description: c('Label')
                .t`${PASS_APP_NAME} recognizes the websites and apps you use and autofills forms with your credentials for you on any browser or device. No need to copy and paste.`,
        },
        {
            image: onboarding3,
            title: c('Label').t`Hide-my-email aliases`,
            description: c('Label')
                .t`Besides storing your logins, ${PASS_APP_NAME} protects your identity with an integrated email alias feature. Whenever you sign up for a new online account, ${PASS_APP_NAME} can automatically create an alias to keep your actual email address protected. `,
        },
        {
            image: onboarding4,
            title: c('Label').t`Integrated 2FA authenticator`,
            description: c('Label')
                .t`Two-factor authentication (2FA) is one of the best ways to protect your accounts online. ${PASS_APP_NAME} makes 2FA easier with an integrated authenticator that stores your 2FA codes and automatically displays and autofills them.`,
        },
        {
            image: onboarding5,
            title: c('Label').t`Secure password sharing`,
            description: c('Label')
                .t`Easily share sensitive information with anyone, even if they don't use ${PASS_APP_NAME}. You can share a single password, note, or credit card, or multiple items in the same folder.`,
        },
        {
            image: onboarding6,
            title: c('Label').t`Dark Web Monitoring`,
            description: c('Label')
                .t`Receive immediate alerts if your personal information is leaked in a third-party data breach. You can monitor multiple email addresses or your own domain name.`,
        },
        {
            image: onboarding7,
            title: c('Label').t`Securely log in with passkeys`,
            description: c('Label')
                .t`Passkeys are an easy and secure alternative to traditional passwords that prevent phishing attacks and make your online experience smoother.  ${PASS_APP_NAME} supports passkeys on all platforms.`,
        },
    ];

    return (
        <div id="desktop-lobby" className="flex flex-column h-full items-center justify-center py-4">
            <div className="flex items-center justify-center pb-7 w-full pointer-events-none">
                <img src={protonPassIcon} className="w-custom" style={{ '--w-custom': '1.75rem' }} alt="" />
                <img
                    src={passBrandText}
                    // we have margin on both sides because depending on the language this logo may be on the left or right
                    className="h-custom shrink-0 mx-2"
                    style={{ '--h-custom': '1.05rem' }}
                    key="brand"
                    alt=""
                />
            </div>

            <Carousel
                steps={steps}
                className="w-full max-w-custom"
                style={{ '--max-w-custom': '33.5rem' }}
                textClassName="h-custom"
                textStyle={{ '--h-custom': '5.5rem' }}
            />

            <div className="flex flex-column gap-2 mt-12 w-full max-w-custom" style={{ '--max-w-custom': '22.5rem' }}>
                <Button pill shape="solid" color="norm" onClick={onFork} disabled={!online}>
                    {c('Action').t`Sign in with ${BRAND_NAME}`}
                </Button>

                <Button pill shape="ghost" color="norm" onClick={onRegister} disabled={!online}>
                    {c('Action').t`Create a ${BRAND_NAME} account`}
                </Button>
            </div>
        </div>
    );
};
