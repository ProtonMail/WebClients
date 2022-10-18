import { ReactElement } from 'react';

import { c } from 'ttag';

import { getVPNConnections } from '@proton/components/containers/payments/features/vpn';
import {
    getCheckResultFromSubscription,
    getCheckout,
    getDiscountText,
    getUserTitle,
} from '@proton/shared/lib/helpers/checkout';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';

import { Badge, Loader, Time } from '../../components';
import Price from '../../components/price/Price';
import { classnames } from '../../helpers';
import { useOrganization, usePlans, useSubscription } from '../../hooks';
import { SettingsSection } from '../account';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { getTotalBillingText } from './helper';

const getRenewalText = (periodEnd: number, amount?: ReactElement) => {
    const formattedEndTime = <Time key="time-text">{periodEnd}</Time>;
    if (!amount) {
        return c('Billing cycle').jt`Renews automatically on ${formattedEndTime}`;
    }
    return c('Billing cycle').jt`Renews automatically on ${formattedEndTime} for ${amount}`;
};

const BillingSection = () => {
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();

    if (loadingSubscription || loadingPlans || loadingOrganization) {
        return <Loader />;
    }

    if (subscription.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const plansMap = toMap(plans, 'Name');
    const { PeriodEnd, RenewAmount, Cycle, Currency } = subscription;

    const result = getCheckout({
        planIDs: getPlanIDs(subscription),
        plansMap,
        checkResult: getCheckResultFromSubscription(subscription),
    });
    const spaceBonus = organization?.BonusSpace;
    const vpnBonus = organization?.BonusVPN;
    const maxUsers = organization?.MaxMembers || 1;

    const priceRowClassName = 'flex w100 mb1';
    const priceLabelClassName = 'flex-item-fluid';
    const weakRowClassName = classnames([priceRowClassName, 'color-weak']);

    return (
        <SettingsSection>
            <div className="border-bottom on-mobile-pb1">
                <div className={classnames([priceRowClassName, 'text-bold'])}>{result.planTitle}</div>
                <div className={weakRowClassName}>
                    <div className={priceLabelClassName}>
                        {getUserTitle(maxUsers)}
                        {result.discountPercent > 0 && (
                            <>
                                {' '}
                                <Badge type="success" tooltip={getDiscountText()}>
                                    -{result.discountPercent}%
                                </Badge>
                            </>
                        )}
                    </div>
                    <div className="text-right">
                        <Price currency={Currency} suffix={c('Suffix').t`/month`}>
                            {result.withDiscountPerMonth}
                        </Price>
                    </div>
                </div>
                {result.addons.length > 0 && (
                    <div className="color-weak">
                        {result.addons.map((addon) => {
                            return (
                                <div className="mb1" key={addon.name}>
                                    {addon.title}
                                </div>
                            );
                        })}
                    </div>
                )}
                {spaceBonus > 0 && (
                    <div className={weakRowClassName}>
                        <div className={priceLabelClassName}>
                            + {humanSize(spaceBonus)} {c('Label').t`bonus storage`}
                        </div>
                        <div className="text-right">
                            <Price currency={Currency}>{0}</Price>
                        </div>
                    </div>
                )}
                {vpnBonus > 0 && (
                    <div className={weakRowClassName}>
                        <div className={priceLabelClassName}>+ {getVPNConnections(vpnBonus).featureName}</div>
                        <div className="text-right">
                            <Price currency={Currency}>{0}</Price>
                        </div>
                    </div>
                )}

                <div className="mb1">
                    <hr />
                </div>
                <div>
                    <div className={classnames([priceRowClassName, 'text-bold'])}>
                        <div className={priceLabelClassName}>
                            <span className="mr0-5">{getTotalBillingText(Cycle)}</span>
                        </div>
                        <div className="text-right">
                            <Price currency={Currency}>{result.withDiscountPerCycle}</Price>
                        </div>
                    </div>
                </div>
            </div>
            <div className={classnames([weakRowClassName, 'text-right mt1'])}>
                <div className="text-right w100">
                    {getRenewalText(
                        PeriodEnd,
                        RenewAmount !== result.withDiscountPerCycle ? (
                            <Price key="price" currency={Currency}>
                                {RenewAmount}
                            </Price>
                        ) : undefined
                    )}
                </div>
            </div>
        </SettingsSection>
    );
};

export default BillingSection;
