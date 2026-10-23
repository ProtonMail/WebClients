import { type ReactElement, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcMinus } from '@proton/icons/icons/IcMinus';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';

import { CondensedAddonRow } from './CondensedAddonRow';
import { NumberCustomiser, type NumberCustomiserProps } from './NumberCustomiser';

const getMeetAddonDescription = () =>
    c('Info')
        .t`${MEET_APP_NAME} is an end-to-end encrypted video conferencing solution. Add it to your plan to host secure meetings.`;

const MeetAddonBanner = ({ onClick, price }: { onClick: () => void; price: ReactElement }) => (
    <div
        className="border p-4 flex flex-column lg:flex-row gap-2 flex-nowrap items-start lg:items-center rounded-lg"
        style={{ background: 'linear-gradient(85deg, rgb(112 76 255 / 0.15) 0%, rgb(70 26 255 / 0.04) 100%)' }}
        data-testid="meet-addon-banner"
    >
        <div className="w-full">
            <p className="m-0 mb-1 text-lg">
                <strong className="block lg:inline">{c('Info').t`Add ${PLAN_NAMES[PLANS.MEET_BUSINESS]}`}</strong>{' '}
                {c('Info').jt`for ${price}`}
            </p>
            <p className="m-0 text-sm color-weak">{getMeetAddonDescription()}</p>
        </div>
        <Button color="norm" shape="outline" className="shrink-0 flex items-center gap-1" pill onClick={onClick}>
            <IcPlus className="shrink-0" />
            <span data-testid="meet-addon-banner-add-button">{c('Action').t`Add`}</span>
        </Button>
    </div>
);

const MeetAddonActive = ({ seats, onRemove }: { seats: number; onRemove: () => void }) => (
    <div
        className="border p-4 flex flex-column lg:flex-row gap-2 flex-nowrap items-start lg:items-center rounded-lg"
        data-testid="meet-addon-active"
    >
        <div className="w-full">
            <p className="m-0 mb-1 text-lg">
                <strong>{MEET_APP_NAME}</strong>
            </p>
            <p className="m-0 text-sm color-weak">
                {c('meet_2025: Info').ngettext(msgid`${seats} seat included`, `${seats} seats included`, seats)}
            </p>
        </div>
        <Button color="danger" shape="outline" className="shrink-0 flex items-center gap-1" pill onClick={onRemove}>
            <IcMinus className="shrink-0" />
            <span data-testid="meet-addon-active-remove-button">{c('Action').t`Remove`}</span>
        </Button>
    </div>
);

interface MeetAddonProps extends Omit<NumberCustomiserProps, 'label' | 'tooltip'> {
    price: ReactElement;
    addon: Plan;
    onAddMeet: () => void;
    onRemoveMeet: () => void;
    locked?: boolean;
    telemetryContext: PaymentTelemetryContext;
    /** Checkout experiment CheckoutCondensedAddons: render a row of the condensed addons card instead of the banner. */
    condensed?: boolean;
}

const MeetAddon = ({
    price,
    onAddMeet,
    onRemoveMeet,
    locked,
    value,
    telemetryContext,
    condensed = false,
    ...rest
}: MeetAddonProps) => {
    const [showMeetBanner, setShowMeetBanner] = useState(value === 0);

    const handleAdd = () => {
        setShowMeetBanner(false);
        onAddMeet();
        checkoutTelemetry.reportAddMeet({ context: telemetryContext });
    };

    if (showMeetBanner) {
        if (condensed) {
            return (
                <CondensedAddonRow
                    name={PLAN_NAMES[PLANS.MEET_BUSINESS]}
                    price={price}
                    description={getMeetAddonDescription()}
                    onAdd={handleAdd}
                    testId="meet-addon-row"
                />
            );
        }

        return (
            <div>
                <MeetAddonBanner price={price} onClick={handleAdd} />
            </div>
        );
    }

    if (locked) {
        return (
            <MeetAddonActive
                seats={value}
                onRemove={() => {
                    setShowMeetBanner(true);
                    onRemoveMeet();
                }}
            />
        );
    }

    return (
        <NumberCustomiser label={MEET_APP_NAME} value={value} tooltip={c('Info').t`${MEET_APP_NAME} seats`} {...rest} />
    );
};

export default MeetAddon;
