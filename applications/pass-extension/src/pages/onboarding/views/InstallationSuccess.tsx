import type { VFC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Vr } from '@proton/atoms/Vr';
import { ProtonLogo } from '@proton/components';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import passBrandText from '../../../../public/assets/protonpass-brand.svg';
import { ExtensionHead } from '../../../shared/components/page/ExtensionHead';
import { useNavigateToLogin } from '../../../shared/hooks';

export const InstallationSuccess: VFC = () => {
    const login = useNavigateToLogin();

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

    const brandNameJSX = (
        <img src={passBrandText} className="ml-2 h-custom" style={{ '--height-custom': '28px' }} key="brand" alt="" />
    );

    return (
        <>
            <ExtensionHead title={c('Title').t`Thank you for installing ${PASS_APP_NAME}`} />
            <div className="pass-lobby ui-standard w100 min-h-custom mw" style={{ '--min-height-custom': '100vh' }}>
                <img
                    src="/assets/protonpass-icon.svg"
                    className="absolute absolute-center-x w-custom max-w-custom top-custom"
                    style={{ '--width-custom': '620px', '--top-custom': '-420px' }}
                    alt=""
                />
                <Vr className="block h-custom" style={{ '--height-custom': '220px' }} />
                <div className="m-auto w100 text-center p-14 color-norm">
                    <h1 className="h2 pass-onboarding--heading mb-4 text-bold flex flex-align-items-center flex-justify-center">
                        {c('Title').jt`Thank you for installing ${brandNameJSX}`}
                    </h1>

                    <h2 className="h5 mb-12">
                        {c('Info').t`Follow these simple steps to get the best experience using ${PASS_APP_NAME}`}
                    </h2>

                    <div className="mx-auto flex flex-justify-center mb-4">
                        <ol className="unstyled m-0">
                            {steps.map(({ key, icon, description }, idx) => (
                                <li key={key} className="flex mb-7 flex-align-items-center">
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
                        color="weak"
                        onClick={() => login(FORK_TYPE.SWITCH)}
                        aria-label={c('Action').t`Sign in`}
                    >
                        <span className="flex flex-align-items-center px-4">
                            <ProtonLogo variant="glyph-only" size={16} className="mr-2" />
                            <span>{c('Action').t`Sign in with ${BRAND_NAME}`}</span>
                        </span>
                    </Button>
                </div>
            </div>
        </>
    );
};
