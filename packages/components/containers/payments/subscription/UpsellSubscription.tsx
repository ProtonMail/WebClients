import * as React from 'react';
import { hasMail, hasBundle, hasDrive, hasVPN, hasMailPro } from '@proton/shared/lib/helpers/subscription';
import { DEFAULT_CURRENCY, DEFAULT_CYCLE, PLANS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { c } from 'ttag';
import { PlansMap } from '@proton/shared/lib/interfaces';

import { Loader, Button, Card, Price } from '../../../components';
import { useSubscription, usePlans } from '../../../hooks';
import UpsellItem from './UpsellItem';

const UpsellSubscription = ({ onUpgrade }: { onUpgrade: (plan: PLANS) => void }) => {
    const [subscription, loadingSubscription] = useSubscription();
    const [plans = [], loadingPlans] = usePlans();
    const { Currency = DEFAULT_CURRENCY, Cycle = DEFAULT_CYCLE } = subscription || {};
    const plansMap = toMap(plans, 'Name') as PlansMap;

    if (loadingSubscription || loadingPlans) {
        return <Loader />;
    }
    // B2B
    if (hasMailPro(subscription)) {
        const monthlyPrice = (
            <Price key="monthly-bundle-price" currency={Currency} suffix={c('Suffix').t`/month`}>
                {(plansMap[PLANS.BUNDLE]?.Pricing?.[Cycle] || 0) / Cycle}
            </Price>
        );
        return (
            <Card rounded border={false} className="mt1 mb1">
                <div className="flex flex-nowrap flex-align-items-center on-tiny-mobile-flex-column">
                    <div className="flex-item-fluid pr1">
                        <p className="mt0 mb0-5">{c('Mail upsell feature')
                            .t`Upgrade to the business pack with access to all premium Proton services:`}</p>
                        <UpsellItem icon="check">{c('Mail upsell feature')
                            .t`Boost your storage space to 500 GB per user`}</UpsellItem>
                        <UpsellItem icon="check">{c('Mail upsell feature')
                            .t`Get 10 high-speed VPN connections per user`}</UpsellItem>
                        <UpsellItem icon="check">{c('Mail upsell feature')
                            .t`Get 10 additional email addresses per user`}</UpsellItem>
                        <UpsellItem icon="check">{c('Mail upsell feature')
                            .t`Cover more ground with support for 10 custom email domains`}</UpsellItem>
                    </div>
                    <div className="flex-item-noshrink ml1 mr1">
                        <Button color="norm" className="mt1" onClick={() => onUpgrade(PLANS.BUNDLE)}>
                            {c('Action').jt`From ${monthlyPrice} /user`}
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    // B2C
    if (hasMail(subscription) || hasDrive(subscription) || hasVPN(subscription)) {
        const monthlyPrice = (
            <Price key="monthly-bundle-price" currency={Currency} suffix={c('Suffix').t`/month`}>
                {(plansMap[PLANS.BUNDLE]?.Pricing?.[Cycle] || 0) / Cycle}
            </Price>
        );
        return (
            <Card rounded border={false} className="mt1 mb1">
                <div className="flex flex-nowrap flex-align-items-center on-tiny-mobile-flex-column">
                    <div className="flex-item-fluid pr1">
                        <p className="mt0 mb0-5">{c('Mail upsell feature')
                            .t`Upgrade to the ultimate privacy pack with access to all premium Proton services:`}</p>
                        <UpsellItem icon="check">{c('Mail upsell feature')
                            .t`Boost your storage space to 500 GB total (shared across Mail, Calendar and Drive)`}</UpsellItem>
                        {hasVPN(subscription) ? null : (
                            <>
                                <UpsellItem icon="check">{c('Mail upsell feature')
                                    .t`Get high-speed VPN connections (up to 10 Gbps)`}</UpsellItem>
                                <UpsellItem icon="check">{c('Mail upsell feature')
                                    .t`Get advanced VPN features like build-in ad-blockers, P2P/BitTorrent support, and more`}</UpsellItem>
                            </>
                        )}
                        {hasMail(subscription) ? (
                            <UpsellItem icon="check">{c('Mail upsell feature')
                                .t`Add more personalization with 15 email addresses and support for 3 custom email domains`}</UpsellItem>
                        ) : (
                            <UpsellItem icon="check">{c('Mail upsell feature')
                                .t`Unlock communication personalization with 15 email addresses and support for 3 custom email domains`}</UpsellItem>
                        )}

                        {hasDrive(subscription) || hasVPN(subscription) ? (
                            <UpsellItem icon="check">{c('Mail upsell feature')
                                .t`Organize your inbox with unlimited folders, labels, and filters`}</UpsellItem>
                        ) : null}
                    </div>
                    <div className="flex-item-noshrink ml1 mr1">
                        <Button color="norm" className="mt1" onClick={() => onUpgrade(PLANS.BUNDLE)}>
                            {c('Action').jt`From ${monthlyPrice}`}
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    if (hasBundle(subscription)) {
        const monthlyPrice = (
            <Price key="monthly-family-price" currency={Currency} suffix={c('Suffix').t`/month`}>
                {(plansMap[PLANS.FAMILY]?.Pricing?.[Cycle] || 0) / Cycle}
            </Price>
        );
        return (
            <Card rounded border={false} className="mt1 mb1">
                <div className="flex flex-nowrap flex-align-items-center on-tiny-mobile-flex-column">
                    <div className="flex-item-fluid pr1">
                        <p className="mt0 mb0-5">{c('Mail upsell feature')
                            .t`Upgrade to the Proton privacy suite specially designed for families:`}</p>
                        <UpsellItem icon="check">{c('Mail upsell feature')
                            .t`Share Proton privacy with your loved ones`}</UpsellItem>
                        <UpsellItem icon="check">{c('Mail upsell feature')
                            .t`Create separate logins for each family member`}</UpsellItem>
                        <UpsellItem icon="check">{c('Mail upsell feature')
                            .t`Up to 5 users with individual login`}</UpsellItem>
                        <UpsellItem icon="check">{c('Mail upsell feature')
                            .t`Easily stay in sync with everyone's schedule by sharing calendars `}</UpsellItem>
                        <UpsellItem icon="check">{c('Mail upsell feature')
                            .t`Get 2.5 TB total storage to share among the whole family`}</UpsellItem>
                    </div>
                    <div className="flex-item-noshrink ml1 mr1">
                        <Button color="norm" className="mt1" onClick={() => onUpgrade(PLANS.FAMILY)}>
                            {c('Action').jt`From ${monthlyPrice}`}
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    return null;
};

export default UpsellSubscription;
