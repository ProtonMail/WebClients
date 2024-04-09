import React from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Header, MainLogo, UnAuthenticated, UnAuthenticatedAppsDropdown, useConfig } from '@proton/components';
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
        'shared-page-layout-bg flex flex-nowrap flex-column h-full overflow-auto relative',
        className,
    ]);

    return (
        <UnAuthenticated>
            <div className={containerClassname}>
                <Header className="header--wrap shadow-norm *:min-size-auto items-center h-auto">
                    <h1 className="sr-only">{getAppName(APP_NAME)}</h1>
                    <div className="logo-container p-0 md:p-4 flex justify-space-between items-center flex-nowrap w-full md:w-auto">
                        <MainLogo to="/" />
                        <UnAuthenticatedAppsDropdown />
                    </div>

                    <div className="flex justify-end flex-1 self-center my-auto w-full md:w-auto">
                        {isProtonUser ? (
                            <ButtonLike
                                className="w-full md:w-auto"
                                color="norm"
                                as="a"
                                href={APPS.PROTONDRIVE}
                                target="_blank"
                            >
                                {c('Action').t`Go to Drive`}
                            </ButtonLike>
                        ) : (
                            <ButtonLike
                                className="w-full md:w-auto"
                                color="norm"
                                as="a"
                                href={DRIVE_PRICING_PAGE}
                                target="_blank"
                            >
                                {c('Action').t`Try for free`}
                            </ButtonLike>
                        )}
                    </div>
                </Header>
                <main className="shared-page-layout-container w-full flex flex-nowrap flex-column md:flex-row flex-1 px-4 md:px-10">
                    <div className="flex-1 mb-4 md:mb-0 flex flex-column flex-nowrap">{children}</div>
                </main>
                <Footer className="justify-space-between items-center p-0 mt-6 md:mt-0">{FooterComponent}</Footer>
            </div>
        </UnAuthenticated>
    );
}
