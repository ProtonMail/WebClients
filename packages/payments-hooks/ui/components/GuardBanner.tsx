import { useEffect } from 'react';

import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import type { FreeSubscription } from '@proton/payments/core/interface';
import { GUARD_ERROR_MESSAGES, type GuardError } from '@proton/payments/core/subscription/guard';
import { getSubscriptionsArray } from '@proton/payments/core/subscription/helpers';
import type { Subscription, SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import type { GuardShownTelemetryPayload } from '@proton/payments/telemetry/shared-checkout-telemetry';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';

export interface GuardBannerTelemetry {
    /** The `subscription/check` response the banner displays */
    checkResult: SubscriptionEstimation;
    /**
     * User's current subscription(s): a single one (its secondary ones are included) or a list. Free
     * subscriptions and `undefined` are not reported.
     */
    subscriptions: Subscription | FreeSubscription | Subscription[] | undefined;
}

/**
 * Flattens the subscription input of the banner telemetry.
 *
 * @param subscriptions - A subscription or a list of them, each with optional secondary ones
 * @returns Every paid subscription, each primary followed by its secondary ones. Empty for free users.
 */
const getSubscriptionsList = (subscriptions: GuardBannerTelemetry['subscriptions']): Subscription[] => {
    const list = Array.isArray(subscriptions) ? subscriptions : [subscriptions];
    return list.flatMap((subscription) =>
        subscription && isPaidSubscription(subscription) ? getSubscriptionsArray(subscription) : []
    );
};

/**
 * Builds the `reportGuardShown` payload from the `subscription/check` response the banner displays, so the
 * reported codes and selection always match what the user sees. Backend messages are dropped.
 *
 * @param telemetry - The check response the banner displays and the user's current subscription(s)
 * @returns The payload for `reportGuardShown`
 */
export const getGuardBannerTelemetry = ({
    checkResult,
    subscriptions,
}: GuardBannerTelemetry): GuardShownTelemetryPayload => ({
    guardCodes: (checkResult.GuardResult ?? []).flatMap(({ Code }) => (Code === undefined ? [] : [Code])),
    selectedPlanIDs: checkResult.requestData.Plans,
    selectedCycle: checkResult.requestData.Cycle,
    subscriptions: getSubscriptionsList(subscriptions),
});

/**
 * Reports the guard banner to telemetry once per distinct set of guard codes. Does nothing without codes.
 *
 * @param telemetry - What to report, or `undefined` to opt out
 * @returns Nothing. Reports from an effect keyed on the guard codes.
 */
const useBannerTelemetry = (telemetry: GuardBannerTelemetry | undefined) => {
    const payload = telemetry && getGuardBannerTelemetry(telemetry);
    const codesKey = payload?.guardCodes.join(',');

    useEffect(() => {
        if (payload?.guardCodes.length) {
            checkoutTelemetry.reportGuardShown(payload);
        }
    }, [codesKey]);
};

interface Props {
    errors: GuardError[];
    /**
     * What the banner reports when shown, or `undefined` to opt out on purpose.
     */
    telemetry: GuardBannerTelemetry | undefined;
    className?: string;
}

/**
 * Lists every subscription-guard refusal from a `subscription/check` response in one view.
 * Announced via role="alert"; the Banner icon pairs with the text so meaning is not
 * carried by colour alone. Mapped codes render their localised copy; if no code is mapped, a
 * single generic message is shown instead. Placement is up to the caller — this component never
 * opens a modal.
 *
 * @param errors Guard errors from a single `subscription/check` response (normalized
 *   `GuardResult`). Renders nothing when empty.
 * @param telemetry Reported when the banner is shown, see {@link useBannerTelemetry}.
 * @param className Extra classes appended to the banner wrapper.
 * @returns The banner, or `null` when there are no errors.
 */
export const GuardBanner = ({ errors, telemetry, className }: Props) => {
    useBannerTelemetry(telemetry);

    if (!errors.length) {
        return null;
    }
    const errorsMessages = errors
        .map(({ Code }) => (Code === undefined ? undefined : GUARD_ERROR_MESSAGES.get(Code)))
        .filter((message): message is () => string => message !== undefined);

    return (
        <Banner role="alert" variant={BannerVariants.WARNING} className={className}>
            {errorsMessages.length > 0 && (
                <span className="mb-1">{c('Payments').t`Plan switch is incompatible for the following reasons:`}</span>
            )}
            <ul className="m-0 pl-4">
                {errorsMessages.length > 0 ? (
                    errorsMessages.map((error, index) => <li key={index}>{error()}</li>)
                ) : (
                    <li>{c('Payments').t`This subscription can’t be completed right now. Please try again.`}</li>
                )}
            </ul>
        </Banner>
    );
};
