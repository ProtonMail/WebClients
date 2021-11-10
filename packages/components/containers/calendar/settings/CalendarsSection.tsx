import { ReactNode } from 'react';
import { c, msgid } from 'ttag';
import { Calendar, SubscribedCalendar } from '@proton/shared/lib/interfaces/calendar';
import { SimpleMap, UserModel } from '@proton/shared/lib/interfaces';

import { MAX_CALENDARS_PER_USER } from '@proton/shared/lib/calendar/constants';
import { Alert, ButtonLike, Card, PrimaryButton, SettingsLink, Tooltip } from '../../../components';

import { SettingsSection } from '../../account';

import CalendarsTable from './CalendarsTable';

export interface CalendarsSectionProps {
    calendars: (Calendar | SubscribedCalendar)[];
    defaultCalendarID?: string;
    user: UserModel;
    loading?: boolean;
    loadingMap: SimpleMap<boolean>;
    canAdd: boolean;
    isFeatureUnavailable?: boolean;
    add: string;
    description?: ReactNode;
    onAdd: () => void;
    onSetDefault?: (id: string) => Promise<void>;
    onEdit: (calendar: Calendar) => void;
    onDelete: (id: string) => void;
    onExport?: (calendar: Calendar) => void;
    canUpgradeLimit?: boolean;
    calendarLimitReachedText: string;
}
const CalendarsSection = ({
    calendars = [],
    defaultCalendarID,
    user,
    loading = false,
    loadingMap,
    canAdd,
    isFeatureUnavailable = false,
    add,
    description,
    onAdd,
    onEdit,
    onSetDefault,
    onDelete,
    onExport,
    canUpgradeLimit = true,
    calendarLimitReachedText,
    ...rest
}: CalendarsSectionProps) => (
    <SettingsSection {...rest}>
        {!canAdd && !isFeatureUnavailable && user.hasNonDelinquentScope && (
            <Alert className="mb1" type="warning">
                {calendarLimitReachedText}
            </Alert>
        )}
        {user.isFree && canUpgradeLimit && !canAdd && !isFeatureUnavailable && (
            <Card className="mb1">
                <div className="flex flex-nowrap flex-align-items-center">
                    <p className="flex-item-fluid mt0 mb0 pr2">
                        {c('Upgrade notice').ngettext(
                            msgid`Upgrade to a paid plan to create up to ${MAX_CALENDARS_PER_USER} calendar, allowing you to make calendars for work, to share with friends, and just for yourself.`,
                            `Upgrade to a paid plan to create up to ${MAX_CALENDARS_PER_USER} calendars, allowing you to make calendars for work, to share with friends, and just for yourself.`,
                            MAX_CALENDARS_PER_USER
                        )}
                    </p>
                    <ButtonLike as={SettingsLink} path="/dashboard" color="norm" shape="solid" size="small">
                        {c('Action').t`Upgrade`}
                    </ButtonLike>
                </div>
            </Card>
        )}
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
        {!!calendars.length && (
            <CalendarsTable
                calendars={calendars}
                defaultCalendarID={defaultCalendarID}
                user={user}
                onEdit={onEdit}
                onSetDefault={onSetDefault}
                onDelete={onDelete}
                onExport={onExport}
                loadingMap={loadingMap}
                actionsDisabled={loading}
            />
        )}
    </SettingsSection>
);

export default CalendarsSection;
