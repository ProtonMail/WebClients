import { type FC, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { ProtonLogo } from '@proton/components/index';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import type { BaseSpotlightMessage } from '@proton/pass/components/Spotlight/SpotlightContent';
import {
    PASS_FAMILY_BF_2024_MONTHLY_PRICE,
    PASS_LIFETIME_BF_2024_YEARLY_PRICE,
    UpsellRef,
} from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { selectUser, selectUserPlan } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { DEFAULT_CURRENCY } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import './BlackFriday2024Offer.scss';

type BF2024Offer = PassFeature.PassBlackFriday2024Family | PassFeature.PassBlackFriday2024Lifetime;

/** FIXME: move to `@proton/pass/components/Onboarding` in 1.25.0 */
export const BlackFriday2024Offer: FC<BaseSpotlightMessage> = ({ onClose = noop }) => {
    const user = useSelector(selectUser);
    const userPlan = useSelector(selectUserPlan);
    const lifetimeUpsell = useFeatureFlag(PassFeature.PassBlackFriday2024Lifetime);
    const online = useConnectivity();

    const offer = useMemo<MaybeNull<BF2024Offer>>(() => {
        switch (userPlan?.InternalName) {
            case 'pass2023':
                return lifetimeUpsell ? PassFeature.PassBlackFriday2024Lifetime : PassFeature.PassBlackFriday2024Family;
            case 'free':
                return PassFeature.PassBlackFriday2024Family;
            default:
                return null;
        }
    }, [userPlan]);

    const content = useMemo(() => {
        const currency = user?.Currency ?? DEFAULT_CURRENCY;

        switch (offer) {
            case PassFeature.PassBlackFriday2024Family: {
                const relativePrice = getSimplePriceString(currency, PASS_FAMILY_BF_2024_MONTHLY_PRICE);
                const discountJSX = (
                    <strong key="discount" className="pass-bf2024-banner--offer px-0.5">
                        50%
                    </strong>
                );
                return {
                    title: c('bf2024: Title')
                        .jt`Save up to ${discountJSX} on Pass Family. Only ${relativePrice}/month.`,
                    subtitle: c('bf2024: Info').t`All premium features. 6 users. 1 easy subscription.`,
                };
            }

            case PassFeature.PassBlackFriday2024Lifetime: {
                const relativePrice = getSimplePriceString(currency, PASS_LIFETIME_BF_2024_YEARLY_PRICE);
                const lifetimeAccessJSX = (
                    <strong key="deal" className="pass-bf2024-banner--offer px-0.5">
                        {c('bf2024: Deal').t`lifetime access`}
                    </strong>
                );

                return {
                    title: c('bf2024: Title')
                        .jt`Pay once and get ${lifetimeAccessJSX} to Pass Plus. Only ${relativePrice}.`,
                    subtitle: c('bf2024: Info').t`Limited-stock available!`,
                };
            }
        }
    }, [user, offer]);

    const upgrade = useNavigateToUpgrade(
        offer === PassFeature.PassBlackFriday2024Family
            ? {
                  coupon: 'BF2024YR',
                  cycle: '12',
                  offer: true,
                  plan: 'passfamily2024',
                  email: user?.Email,
                  upsellRef: UpsellRef.PASS_FAMILY_BF_2024,
              }
            : {
                  cycle: '12',
                  plan: 'passlifetime2024',
                  offer: true,
                  email: user?.Email,
                  upsellRef: UpsellRef.PASS_LIFETIME_BF_2024,
              }
    );

    useEffect(() => {
        /* If the user upgraded in the background */
        if (!offer) onClose();
    }, [offer]);

    return (
        offer &&
        content && (
            <div className="flex items-center w-full z-up">
                <div className="flex flex-column gap-2 w-2/3">
                    <div className="flex gap-2 items-center text-sm">
                        <ProtonLogo size={10} className="h-custom" style={{ '--h-custom': '1.5em' }} color="invert" />{' '}
                        <strong className="pass-bf2024-banner--badge lh120 px-1.5 py-0.5 text-uppercase">
                            {c('bf2024: Title').t`Black Friday`}
                        </strong>
                    </div>
                    <div>
                        <strong className="block text-sm">{content.title}</strong>
                        <span className="block text-sm">{content.subtitle}</span>
                    </div>
                </div>
                <div className="flex flex-1 justify-end pr-8">
                    <Button
                        pill
                        shape="solid"
                        color="norm"
                        size="medium"
                        disabled={!online}
                        className={clsx(
                            'pass-bf2024-banner--btn text-sm text-semibold px-3',
                            offer === PassFeature.PassBlackFriday2024Lifetime && 'pass-bf2024-banner--btn--deal'
                        )}
                        onClick={pipe(onClose, upgrade)}
                        style={{ backgroundColor: 'var(--interaction-norm-major-3)' }}
                    >
                        {c('bf2024: Label').t`Get the deal`}
                    </Button>
                </div>
            </div>
        )
    );
};
