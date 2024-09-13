import React from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Header, MainLogo, UnAuthenticated, UnAuthenticatedAppsDropdown, useConfig } from '@proton/components';
import Footer from '@proton/components/components/footer/Footer';
import { getAppHref, getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_PRICING_PAGE } from '@proton/shared/lib/drive/urls';
import clsx from '@proton/utils/clsx';

import { usePublicSessionUser } from '../../../store';
import { UserInfo } from './UserInfo';

import './Layout.scss';

interface Props {
    FooterComponent?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    partialView?: boolean;
}

export default function SharedPageLayout({ FooterComponent, children, className, partialView }: Props) {
    const { APP_NAME } = useConfig();

    const { user, localID } = usePublicSessionUser();

    const containerClassname = clsx([
        'shared-page-layout-bg flex flex-nowrap flex-column h-full overflow-auto relative',
        className,
    ]);

    return (
        <UnAuthenticated>
            <div className={containerClassname}>
                {!partialView && (
                    <Header className="header--wrap shadow-norm *:min-size-auto items-center h-auto">
                        <h1 className="sr-only">{getAppName(APP_NAME)}</h1>
                        <div className="logo-container p-0 md:p-4 flex justify-space-between items-center flex-nowrap w-auto">
                            <MainLogo to="/" reloadDocument />
                            <div className="hidden md:block">
                                <UnAuthenticatedAppsDropdown reloadDocument />
                            </div>
                        </div>

                        <div className="flex justify-end flex-nowrap items-center flex-1 self-center my-auto">
                            {!!user ? (
                                <>
                                    <ButtonLike
                                        className="w-auto mr-4"
                                        color="norm"
                                        shape="outline"
                                        as="a"
                                        href={getAppHref('/', APPS.PROTONDRIVE, localID)}
                                        target="_blank"
                                    >
                                        {c('Action').t`Go to ${DRIVE_SHORT_APP_NAME}`}
                                    </ButtonLike>
                                    <UserInfo user={user} />
                                </>
                            ) : (
                                <ButtonLike
                                    className="w-full md:w-auto"
                                    color="norm"
                                    shape="ghost"
                                    as="a"
                                    href={DRIVE_PRICING_PAGE}
                                    target="_blank"
                                >
                                    {c('Action').t`Create free account`}
                                </ButtonLike>
                            )}
                        </div>
                    </Header>
                )}
                <main
                    className={clsx(
                        'shared-page-layout-container w-full flex flex-nowrap flex-column md:flex-row flex-1 px-4',
                        partialView ? 'md:px-5' : 'md:px-10'
                    )}
                >
                    <div className="flex-1 mb-4 md:mb-0 flex flex-column flex-nowrap">{children}</div>
                </main>
                <Footer className="justify-space-between items-center p-0 mt-6 md:mt-0">{FooterComponent}</Footer>
            </div>
        </UnAuthenticated>
    );
}
