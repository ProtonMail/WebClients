import { c } from 'ttag';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { PLAN_TYPES } from '@proton/payments/core/constants';

import { Badge } from '../../components/badge/Badge';
import DropdownActions from '../../components/dropdown/DropdownActions';
import Loader from '../../components/loader/Loader';
import useModalState from '../../components/modalTwo/useModalState';
import { getSimplePriceString } from '../../components/price/helper';
import Table from '../../components/table/Table';
import TableBody from '../../components/table/TableBody';
import TableCell from '../../components/table/TableCell';
import TableHeader from '../../components/table/TableHeader';
import TableRow from '../../components/table/TableRow';
import Time from '../../components/time/Time';
import SubscriptionBreakdownModal from './subscription/SubscriptionBreakdownModal';
import type { SubscriptionRow as SubscriptionRowType } from './subscription/helpers/getSubscriptionRows';
import { getSubscriptionRows } from './subscription/helpers/getSubscriptionRows';
import { useReactivateAction } from './subscription/helpers/useReactivateAction';

const SubscriptionRow = ({ row }: { row: SubscriptionRowType }) => {
    const {
        kind,
        subscription,
        planTitle,
        startDate,
        endDate,
        price,
        renewCurrency,
        isLifetime,
        isExpiring,
        showReactivate,
        billingType,
        hasCoupon,
        status,
        renewalText,
        renewalTooltip,
    } = row;

    const reactivateAction = useReactivateAction(row);
    const [breakdownModalProps, setBreakdownModalOpen, renderBreakdownModal] = useModalState();
    const hasAddons = subscription.Plans.some((plan) => plan.Type === PLAN_TYPES.ADDON);
    const isUpcoming = kind === 'upcoming';
    const startTime = (
        <Time key="start" format="PPP" sameDayFormat={false} data-testid="planStartTimeId">
            {startDate}
        </Time>
    );

    const endTime = (
        <Time key="end" format="PPP" sameDayFormat={false} data-testid="planEndTimeId">
            {endDate}
        </Time>
    );

    return (
        <TableRow>
            <TableCell>
                <div className={isUpcoming ? 'flex flex-column pl-6' : 'flex flex-column'}>
                    <span>
                        {isUpcoming && (
                            <span className="color-weak mr-1" aria-hidden="true">
                                ↳
                            </span>
                        )}
                        <span data-testid="planNameId">{planTitle}</span>
                    </span>
                    {hasAddons && (
                        <Button
                            shape="underline"
                            size="small"
                            className="p-0 text-left text-sm color-weak"
                            onClick={() => setBreakdownModalOpen(true)}
                            data-testid="viewBreakdown"
                        >
                            {c('Action subscription').t`View breakdown`}
                        </Button>
                    )}
                </div>
                {renderBreakdownModal && (
                    <SubscriptionBreakdownModal subscription={subscription} {...breakdownModalProps} />
                )}
            </TableCell>
            <TableCell data-testid="subscriptionStatusId">
                <Badge type={status.type} className="text-nowrap">
                    {status.label}
                </Badge>
            </TableCell>
            <TableCell label={c('Title subscription').t`Subscription term`}>
                <div className="flex items-center" data-testid="currentTermId">
                    {isLifetime || isUpcoming ? (
                        <span className={isUpcoming ? 'color-weak' : undefined}>
                            {c('Subscription term').jt`From ${startTime}`}
                        </span>
                    ) : (
                        <span>{c('Subscription term').jt`${startTime} – ${endTime}`}</span>
                    )}
                    {isExpiring && (
                        <Tooltip
                            title={c('Info subscription').t`You can prevent expiry by reactivating the subscription`}
                            data-testid="periodEndWarning"
                        >
                            <IcExclamationCircleFilled className="color-danger ml-1" size={4.5} />
                        </Tooltip>
                    )}
                </div>
            </TableCell>
            <TableCell label={c('Title subscription').t`Price`} data-testid="planPriceId">
                <div className="flex flex-column">
                    <span>{getSimplePriceString(renewCurrency, price)}</span>

                    {hasCoupon && <span className="color-weak text-sm">{c('Coupon').t`Coupon applied`}</span>}
                </div>
            </TableCell>
            <TableCell label={c('Title subscription').t`Billing`} data-testid="billingTypeId">
                <Badge type={billingType === 'prepaid' ? 'success' : 'info'} className="text-nowrap">
                    {billingType === 'prepaid' ? c('Billing type').t`Prepaid` : c('Billing type').t`Billed at renewal`}
                </Badge>
            </TableCell>
            <TableCell label={c('Title subscription').t`Renewal`} data-testid="subscriptionActionsId">
                {showReactivate ? (
                    <DropdownActions size="small" list={reactivateAction} />
                ) : (
                    <div className="flex flex-column">
                        {renewalText?.primary && (
                            <div className="flex items-center">
                                <span data-testid="renewalNotice">{renewalText?.primary}</span>
                                {renewalTooltip}
                            </div>
                        )}
                        {renewalText?.secondary && (
                            <span data-testid="renewalNoticeSecondary" className="color-weak text-sm">
                                {renewalText.secondary}
                            </span>
                        )}
                    </div>
                )}
            </TableCell>
        </TableRow>
    );
};

const SubscriptionsSection = () => {
    const [allSubscriptions, allSubscriptionsLoading] = useAllSubscriptions();
    const [user] = useUser();
    const [entitlementCatalog, entitlementCatalogLoading] = useEntitlementCatalog();

    if (allSubscriptionsLoading || entitlementCatalogLoading || !entitlementCatalog || !allSubscriptions) {
        return <Loader />;
    }

    const rows = getSubscriptionRows(user, allSubscriptions, entitlementCatalog);
    if (!rows.length) {
        return null;
    }

    return (
        <div style={{ overflow: 'auto' }}>
            <Table className="table-auto" responsive="cards">
                <TableHeader>
                    <TableRow>
                        <TableCell type="header">{c('Title subscription').t`Plan`}</TableCell>
                        <TableCell type="header">{c('Title subscription').t`Status`}</TableCell>
                        <TableCell type="header">{c('Title subscription').t`Subscription term`}</TableCell>
                        <TableCell type="header">{c('Title subscription').t`Price`}</TableCell>
                        <TableCell type="header">{c('Title subscription').t`Billing`}</TableCell>
                        <TableCell type="header">{c('Title subscription').t`Renewal`}</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody colSpan={6}>
                    {rows.map((row) => (
                        <SubscriptionRow key={row.id} row={row} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
export default SubscriptionsSection;
