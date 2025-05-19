import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Header, MainLogo, UnAuthenticatedAppsDropdown, useActiveBreakpoint } from '@proton/components/index';
import { getAppHref, getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_PRICING_PAGE } from '@proton/shared/lib/drive/urls';

import { APP_NAME } from '../../../config';
import { usePublicSessionUser } from '../../../store';
import HeaderSecureLabel from './HeaderSecureLabel';
import { UserInfo } from './UserInfo';

export const SharedPageHeader = () => {
    const { user, localID } = usePublicSessionUser();
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <Header className="h-auto lg:justify-space-between items-center">
            <h1 className="sr-only">{getAppName(APP_NAME)}</h1>
            <div className="logo-container flex justify-space-between items-center w-auto h-auto">
                <MainLogo to="/" reloadDocument variant={viewportWidth['<=medium'] ? 'glyph-only' : 'with-wordmark'} />
                <div className="hidden md:block md:ml-2">
                    <UnAuthenticatedAppsDropdown reloadDocument user={user} />
                </div>
            </div>
            <HeaderSecureLabel shortText={viewportWidth['<=medium']} />
            <div className="flex justify-end flex-nowrap items-center ml-auto lg:ml-0">
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
    );
};
