import { c, msgid } from 'ttag';

import { DropdownActionProps } from '@proton/components/components/dropdown/DropdownActions';
import { useLoading } from '@proton/hooks';
import { changeRenewState } from '@proton/shared/lib/api/payments';
import { getCheckResultFromSubscription, getCheckout } from '@proton/shared/lib/helpers/checkout';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { Renew } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import {
    DropdownActions,
    Icon,
    Loader,
    Price,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
    Time,
    Tooltip,
} from '../../components';
import { default as Badge, BadgeType } from '../../components/badge/Badge';
import { useApi, useEventManager, usePlans, useSubscription } from '../../hooks';
import { SettingsSectionWide } from '../account';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { subscriptionExpires } from './subscription/helpers';

const SubscriptionsSection = () => {
    const [plans, loadingPlans] = usePlans();
    const [current, loadingSubscription] = useSubscription();
    const upcoming = current?.UpcomingSubscription ?? undefined;
    const api = useApi();
    const eventManager = useEventManager();
    const [reactivating, withReactivating] = useLoading();

    if (loadingSubscription || loadingPlans) {
        return <Loader />;
    }

    if (current.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const plansMap = toMap(plans, 'Name');

    const currentCheckout = getCheckout({
        plansMap,
        planIDs: getPlanIDs(current),
        checkResult: getCheckResultFromSubscription(current),
    });

    const { renewEnabled, subscriptionExpiresSoon } = subscriptionExpires(current);

    const reactivateAction: DropdownActionProps[] = [
        !renewEnabled && {
            text: c('Action subscription').t`Reactivate`,
            loading: reactivating,
            onClick: () => {
                withReactivating(async () => {
                    await api(
                        changeRenewState({
                            RenewalState: Renew.Enabled,
                        })
                    );

                    await eventManager.call();
                }).catch(noop);
            },
        },
    ].filter(isTruthy);

    const latestSubscription = upcoming ?? current;
    const renewPrice = (
        <Price key="renewal-price" currency={latestSubscription.Currency}>
            {latestSubscription.RenewAmount}
        </Price>
    );

    const n = latestSubscription.Cycle;
    // translator: that's a part of the full sentence "Renews automatically for ${renewPrice}, for {renewalLength} Month(s)"
    const renewalLength = c('Billing cycle').ngettext(msgid`${n} month`, `${n} months`, n);

    const renewalText = (
        <span data-testid="renewalNotice">{c('Billing cycle')
            .jt`Renews automatically for ${renewPrice}, for ${renewalLength}`}</span>
    );

    const status = subscriptionExpiresSoon
        ? {
              type: 'error' as BadgeType,
              label: c('Subscription status').t`Expiring`,
          }
        : { type: 'success' as BadgeType, label: c('Subscription status').t`Active` };

    return (
        <SettingsSectionWide>
            <div style={{ overflow: 'auto' }}>
                <Table className="table-auto" responsive="cards">
                    <TableHeader>
                        <TableRow>
                            <TableCell type="header">{c('Title subscription').t`Plan`}</TableCell>
                            <TableCell type="header">{c('Title subscription').t`Status`}</TableCell>
                            <TableCell type="header">{c('Title subscription').t`End date`}</TableCell>
                            <TableCell type="header"> </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody colSpan={4}>
                        <TableRow>
                            <TableCell label={c('Title subscription').t`Plan`}>
                                <span data-testid="planNameId">{currentCheckout.planTitle}</span>
                            </TableCell>
                            <TableCell data-testid="subscriptionStatusId">
                                <Badge type={status.type}>{status.label}</Badge>
                            </TableCell>
                            <TableCell label={c('Title subscription').t`End date`}>
                                <Time format="PP" sameDayFormat={false} data-testid="planEndTimeId">
                                    {latestSubscription.PeriodEnd}
                                </Time>
                                {subscriptionExpiresSoon && (
                                    <Tooltip
                                        title={c('Info subscription')
                                            .t`You can prevent expiry by reactivating the subscription`}
                                        data-testid="periodEndWarning"
                                    >
                                        <Icon
                                            name="exclamation-circle-filled"
                                            className="color-danger ml-1"
                                            size={18}
                                        />
                                    </Tooltip>
                                )}
                            </TableCell>
                            <TableCell data-testid="subscriptionActionsId">
                                {subscriptionExpiresSoon ? (
                                    <DropdownActions size="small" list={reactivateAction} />
                                ) : (
                                    renewalText
                                )}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </SettingsSectionWide>
    );
};

export default SubscriptionsSection;
