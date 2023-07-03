import React from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Header, MainLogo, UnAuthenticated, useConfig } from '@proton/components';
import Footer from '@proton/components/components/footer/Footer';
import { IS_PROTON_USER_COOKIE_NAME } from '@proton/components/hooks/useIsProtonUserCookie';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { DRIVE_PRICING_PAGE } from '@proton/shared/lib/drive/urls';
import { getCookie } from '@proton/shared/lib/helpers/cookies';
import clsx from '@proton/utils/clsx';

import './Layout.scss';

interface Props {
    FooterComponent?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export default function SharedPageLayout({ FooterComponent, children, className }: Props) {
    const { APP_NAME } = useConfig();

    // This does not allow to get any user information but allow us to know if the user was already logged in Proton
    const isProtonUser = !!getCookie(IS_PROTON_USER_COOKIE_NAME);

    const containerClassname = clsx([
        'shared-page-layout-bg flex-no-min-children flex-nowrap flex-column h100 scroll-if-needed relative',
        className,
    ]);

    return (
        <UnAuthenticated>
            <div className={containerClassname}>
                <Header className="shadow-norm flex flex-align-items-center">
                    <h1 className="sr-only">{getAppName(APP_NAME)}</h1>
                    <div className="logo-container flex flex-justify-space-between flex-align-items-center flex-nowrap">
                        <MainLogo to="/" />
                    </div>

                    <div className="flex flex-justify-end flex-item-fluid flex-item-centered-vert">
                        {isProtonUser ? (
                            <ButtonLike color="norm" as="a" href={APPS.PROTONDRIVE} target="_blank">
                                {c('Action').t`Go to Drive`}
                            </ButtonLike>
                        ) : (
                            <ButtonLike color="norm" as="a" href={DRIVE_PRICING_PAGE} target="_blank">
                                {c('Action').t`Try for free`}
                            </ButtonLike>
                        )}
                    </div>
                </Header>
                <main
                    className={clsx([
                        'shared-page-layout-container flex flex-no-min-children flex-nowrap on-mobile-flex-column',
                        'flex-item-fluid',
                    ])}
                >
                    <div className="flex-item-fluid mb-4 md:mb-0 flex flex-column flex-nowrap">{children}</div>
                </main>
                <Footer className="flex-justify-space-between flex-align-items-center p-0 mt-6 md:mt-0">
                    {FooterComponent}
                </Footer>
            </div>
        </UnAuthenticated>
    );
}
