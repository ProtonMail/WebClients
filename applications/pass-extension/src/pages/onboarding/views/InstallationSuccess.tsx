import type { VFC } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useNotifications } from '@proton/components';
import browser from '@proton/pass/globals/browser';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import passBrandText from '../../../../public/assets/protonpass-brand.svg';
import { ExtensionHead } from '../../../shared/components/page/ExtensionHead';
import { useNavigateToLogin } from '../../../shared/hooks';

import './InstallationSuccess.scss';

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

const brandNameJSX = (
    <img src={passBrandText} className="ml-2 h-custom" style={{ '--h-custom': '28px' }} key="brand" alt="" />
);

export const InstallationSuccess: VFC = () => {
    const login = useNavigateToLogin();
    const [isPinned, setIsPinned] = useState(false);

    const { createNotification } = useNotifications();

    const nextStep = async () => {
        try {
            // @ts-ignore
            const userSettings = await browser.action.getUserSettings();
            if (!userSettings.isOnToolbar) {
                createNotification({
                    text: c('Error').t`Please pin the extension to continue.`,
                    type: 'info',
                    showCloseButton: false,
                });
                return;
            }
            setIsPinned(true);
        } catch (_) {
            setIsPinned(true);
        }
    };

    const steps = getSteps();

    return (
        <>
            <ExtensionHead title={c('Title').t`Thank you for installing ${PASS_APP_NAME}`} />
            <div className="pass-onboarding ui-prominent w100 min-h-custom mw" style={{ '--min-h-custom': '100vh' }}>
                <div className="m-auto p-14 color-norm flex flex-justify-center">
                    <div className="pass-onboarding--gradient"></div>
                    <div className="flex flex-column">
                        <div className="flex flex-column">
                            <div className="flex flex-align-items-center gap-2 mb-4">
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
                            <h1 className="h2 pass-onboarding--white-text mb-10 text-bold">
                                {c('Title').jt`Welcome to ${PASS_APP_NAME}`}
                            </h1>
                        </div>

                        <div className="flex flex-align-items-center gap-2 mb-4">
                            <span>Step {isPinned ? 2 : 1} of 2</span>
                            <hr className="my-2 flex flex-item-fluid-auto" />
                        </div>

                        <div className="mx-auto flex flex-justify-center flex-nowrap on-tablet-flex-column gap-12">
                            {!isPinned && (
                                <>
                                    <div className="flex flex-nowrap flex-column">
                                        <h2 className="text-3xl pass-onboarding--white-text mb-4 text-bold">
                                            {c('Title').jt`Pin the extension`}
                                        </h2>
                                        <h2 className="text-xl mb-5">
                                            {c('Info').t`Follow these simple steps to get the best experience:`}
                                        </h2>

                                        <div className="mb-1">
                                            <ol className="unstyled m-0">
                                                {steps.map(({ key, icon, description }, idx) => (
                                                    <li key={key} className="flex mb-5 flex-align-items-center">
                                                        <div
                                                            className="pass-installation--dot bg-primary rounded-50 text-center mr-3 relative"
                                                            aria-hidden="true"
                                                        >
                                                            <span className="absolute absolute-center">{idx + 1}</span>
                                                        </div>
                                                        <div className="w40p text-center mr-2" aria-hidden="true">
                                                            <img
                                                                src={icon}
                                                                className="h-custom"
                                                                style={{ '--h-custom': '24px' }}
                                                                alt={BRAND_NAME}
                                                            />
                                                        </div>

                                                        <div className="flex-item-fluid text-left">{description}</div>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                        <Button
                                            icon
                                            pill
                                            size="large"
                                            shape="solid"
                                            color="norm"
                                            className="mt-5"
                                            onClick={nextStep}
                                            aria-label={c('Action').t`Done`}
                                        >
                                            <span className="flex flex-justify-center px-4">
                                                {' '}
                                                {c('Action').t`Done`}
                                            </span>
                                        </Button>
                                    </div>

                                    <div className="flex">
                                        <img
                                            src={
                                                BUILD_TARGET === 'firefox'
                                                    ? '/assets/onboarding-pin-firefox.gif'
                                                    : '/assets/onboarding-pin.gif'
                                            }
                                            alt=""
                                            className="pass-installation--pin-tutorial rounded-xl"
                                            width="445"
                                        />
                                    </div>
                                </>
                            )}

                            {isPinned && (
                                <>
                                    <div className="ui-login flex flex-nowrap flex-column">
                                        <h2 className="text-3xl pass-onboarding--white-text mb-4 text-bold">
                                            {c('Title').jt`Connect your ${BRAND_NAME} account`}
                                        </h2>
                                        <h2 className="text-xl mb-5">
                                            {c('Info').t`Sign in or create an account to continue.`}
                                        </h2>
                                        <Button
                                            pill
                                            size="large"
                                            shape="solid"
                                            color="norm"
                                            className="mb-4"
                                            onClick={() => login(FORK_TYPE.SWITCH)}
                                            aria-label={c('Action').t`Sign in`}
                                        >
                                            <span className="flex flex-justify-center px-4">
                                                {c('Action').t`Sign in with ${BRAND_NAME}`}
                                            </span>
                                        </Button>
                                        <Button
                                            pill
                                            size="large"
                                            shape="outline"
                                            color="weak"
                                            onClick={() => login(FORK_TYPE.SIGNUP)}
                                            aria-label={c('Action').t`Create an account`}
                                        >
                                            <span className="flex flex-justify-center px-4">
                                                {c('Action').t`Create a ${BRAND_NAME} account`}
                                            </span>
                                        </Button>
                                    </div>

                                    <div className="flex flex-justify-center">
                                        <img
                                            src="assets/onboarding-connect-illustration.svg"
                                            alt=""
                                            className="pass-installation--connect-illustration"
                                            width="545"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
