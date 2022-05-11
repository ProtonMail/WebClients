import { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { Card } from '@proton/atoms';
import { MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import { UserModel } from '@proton/shared/lib/interfaces';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { Alert, ButtonLike, PrimaryButton, SettingsLink, Tooltip } from '../../../components';
import { SettingsSection } from '../../account';
import CalendarsTable from './CalendarsTable';

export interface CalendarsSectionProps {
    calendars: (VisualCalendar | SubscribedCalendar)[];
    defaultCalendarID?: string;
    user: UserModel;
    canAdd: boolean;
    isFeatureUnavailable?: boolean;
    add: string;
    description?: ReactNode;
    onAdd: () => void;
    onSetDefault?: (id: string) => Promise<void>;
    onEdit: (calendar: VisualCalendar) => void;
    onDelete: (id: string) => Promise<void>;
    onExport?: (calendar: VisualCalendar) => void;
    canUpgradeCalendarsLimit: boolean;
    calendarsLimitReachedText: string;
}
const CalendarsSection = ({
    calendars = [],
    defaultCalendarID,
    user,
    canAdd,
    isFeatureUnavailable = false,
    add,
    description,
    onAdd,
    onEdit,
    onSetDefault,
    onDelete,
    onExport,
    canUpgradeCalendarsLimit,
    calendarsLimitReachedText,
    ...rest
}: CalendarsSectionProps) => {
    const shouldShowUpgradeCard = canUpgradeCalendarsLimit && !canAdd && !isFeatureUnavailable;
    const shouldShowLimitWarning = calendarsLimitReachedText && !isFeatureUnavailable && user.hasNonDelinquentScope;

    return (
        <SettingsSection {...rest}>
            {description}
            <div className="mb1">
                {isFeatureUnavailable ? (
                    <Tooltip title={c('Tooltip').t`This feature is unavailable for the moment`}>
                        {/* a <span> is added artificially so that the disabled prop of the button does not hide the tooltip */}
                        <span>
                            <PrimaryButton data-test-id="calendar-setting-page:add-calendar" disabled>
                                {add}
                            </PrimaryButton>
                        </span>
                    </Tooltip>
                ) : (
                    <PrimaryButton data-test-id="calendar-setting-page:add-calendar" disabled={!canAdd} onClick={onAdd}>
                        {add}
                    </PrimaryButton>
                )}
            </div>
            {shouldShowLimitWarning && (
                <Alert className="mb1" type="warning">
                    {calendarsLimitReachedText}
                </Alert>
            )}
            {shouldShowUpgradeCard && (
                <Card rounded className="mb1">
                    <div className="flex flex-nowrap flex-align-items-center">
                        <p className="flex-item-fluid mt0 mb0 pr2">
                            {c('Upgrade notice').ngettext(
                                msgid`Upgrade to a Mail paid plan to create up to ${MAX_CALENDARS_PAID} calendar, allowing you to make calendars for work, to share with friends, and just for yourself.`,
                                `Upgrade to a Mail paid plan to create up to ${MAX_CALENDARS_PAID} calendars, allowing you to make calendars for work, to share with friends, and just for yourself.`,
                                MAX_CALENDARS_PAID
                            )}
                        </p>
                        <ButtonLike as={SettingsLink} path="/upgrade" color="norm" shape="solid" size="small">
                            {c('Action').t`Upgrade`}
                        </ButtonLike>
                    </div>
                </Card>
            )}
            {!!calendars.length && (
                <CalendarsTable
                    calendars={calendars}
                    defaultCalendarID={defaultCalendarID}
                    user={user}
                    onSetDefault={onSetDefault}
                />
            )}
        </SettingsSection>
    );
};

export default CalendarsSection;
