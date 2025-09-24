import { c, msgid } from 'ttag';

import { useReferrals } from '@proton/account/referrals/hooks';
import DrawerAppHeadline from '@proton/components/components/drawer/views/shared/DrawerAppHeadline';
import DrawerAppSection from '@proton/components/components/drawer/views/shared/DrawerAppSection';
import Loader from '@proton/components/components/loader/Loader';

import joinedEmpty from './illustrations/joined-empty.svg';
import joined from './illustrations/joined.svg';
import subscribedEmpty from './illustrations/subscribed-empty.svg';
import subscribed from './illustrations/subscribed.svg';

export const FriendsSection = () => {
    const [referral, loadingReferral] = useReferrals();

    const signedUpReferralsCount = referral.total;

    const rewardedReferralsCount = referral.totalSubscribed;

    if (loadingReferral) {
        // TODO: skeleton loader?
        return <Loader />;
    }

    return (
        <>
            <DrawerAppHeadline>{c('Referral').t`Invited friends`}</DrawerAppHeadline>
            <DrawerAppSection>
                <div className="flex flex-nowrap items-center justify-space-between gap-2">
                    <div>
                        <span className="text-lg block">{signedUpReferralsCount}</span>
                        <span className="text-sm color-weak block">
                            {c('Referral').ngettext(msgid`Friend joined`, `Friends joined`, signedUpReferralsCount)}
                        </span>
                    </div>
                    <img src={signedUpReferralsCount > 0 ? joined : joinedEmpty} alt="" />
                </div>
            </DrawerAppSection>
            <DrawerAppSection>
                <div className="flex flex-nowrap items-center justify-space-between gap-2">
                    <div>
                        <span className="text-lg block">{rewardedReferralsCount}</span>
                        <span className="text-sm color-weak block">
                            {c('Referral').ngettext(
                                msgid`Friend subscribed`,
                                `Friends subscribed`,
                                rewardedReferralsCount
                            )}
                        </span>
                    </div>
                    <img src={rewardedReferralsCount > 0 ? subscribed : subscribedEmpty} alt="" />
                </div>
            </DrawerAppSection>
        </>
    );
};
