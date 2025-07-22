import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Header, Icon, MainLogo, UnAuthenticatedAppsDropdown, useActiveBreakpoint } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments';
import { getAppHref, getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_PRICING_PAGE, DRIVE_SIGNUP } from '@proton/shared/lib/drive/urls';
import useFlag from '@proton/unleash/useFlag';

import config from '../../../config';
import { useDriveFreePromo } from '../../../hooks/payments/useDriveFreePromo';
import { usePublicSessionUser } from '../../../store';
import HeaderSecureLabel from './HeaderSecureLabel';
import { UserInfo } from './UserInfo';

const CreateAccountButton = () => {
    const UPSELL_REF = 'sharepage_upsell';
    const UPSELL_LINK = `${DRIVE_SIGNUP}?plan=${PLANS.DRIVE}&billing=${CYCLE.MONTHLY}&coupon=${COUPON_CODES.TRYDRIVEPLUS2024}&ref=${UPSELL_REF}`;
    const { promoData, hasError } = useDriveFreePromo({ codes: [COUPON_CODES.TRYDRIVEPLUS2024] });
    const hasPriceData = promoData?.Currency && promoData?.AmountDue;
    const simplePriceString = hasPriceData ? getSimplePriceString(promoData.Currency, promoData.AmountDue) : '';
    const isUpsellingEnabled = useFlag('DriveWebSharePageUpsell');

    if (isUpsellingEnabled && !hasPriceData && !hasError) {
        return null; // if we're upselling, while loading the price data we don't show anything
    }
    return isUpsellingEnabled && hasPriceData ? (
        <ButtonLike
            className="w-full md:w-auto inline-flex items-center"
            color="norm"
            shape="ghost"
            as="a"
            href={UPSELL_LINK}
            target="_blank"
        >
            <Icon className="mr-2" name="light-lightbulb" />
            {hasPriceData && c('Action').t`Get secure storage for ${simplePriceString}`}
        </ButtonLike>
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
    );
};

export const SharedPageHeader = () => {
    const { user, localID } = usePublicSessionUser();
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <Header className="h-auto lg:justify-space-between items-center">
            <h1 className="sr-only">{getAppName(config.APP_NAME)}</h1>
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
                    <CreateAccountButton />
                )}
            </div>
        </Header>
    );
};
