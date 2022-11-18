import { ReactElement, RefObject } from 'react';

import { c } from 'ttag';

import { SettingsLink, Spotlight } from '@proton/components';
import { APPS, BRAND_NAME, DEFAULT_CURRENCY, REFERRAL_PROGRAM_MAX_AMOUNT } from '@proton/shared/lib/constants';
import { humanPriceWithCurrency } from '@proton/shared/lib/helpers/humanPrice';
import { UserModel } from '@proton/shared/lib/interfaces';
import starImg from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

interface Props {
    children: ReactElement;
    anchorRef: RefObject<HTMLElement>;
    show: boolean;
    onDisplayed: () => void;
    onClose: () => void;
    user?: UserModel;
}

const ReferralSpotlight = ({ children, show, onDisplayed, anchorRef, user }: Props) => {
    const credits = humanPriceWithCurrency(REFERRAL_PROGRAM_MAX_AMOUNT, user?.Currency || DEFAULT_CURRENCY);
    return (
        <Spotlight
            show={show}
            onDisplayed={onDisplayed}
            style={{ maxWidth: '25rem' }}
            content={
                <>
                    <div className="flex flex-nowrap mt0-5 mb0-5">
                        <div className="flex-item-noshrink mr1">
                            <img src={starImg} alt="star" className="w4e" />
                        </div>
                        <div>
                            <p className="mt0 mb0-5 text-bold">{c('Spotlight').t`Invite friends to ${BRAND_NAME}`}</p>
                            <p className="m0">{c('Spotlight').t`Get up to ${credits} in credits.`}</p>
                            <SettingsLink path="/referral" app={APPS.PROTONMAIL}>{c('Link')
                                .t`Learn more`}</SettingsLink>
                        </div>
                    </div>
                </>
            }
            anchorRef={anchorRef}
        >
            {children}
        </Spotlight>
    );
};

export default ReferralSpotlight;
