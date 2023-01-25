import React, { useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import {
    ButtonGroup,
    Icon,
    Info,
    SettingsLink,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
    Tooltip,
} from '@proton/components/components';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import { FeatureCode, SettingsSectionWide } from '@proton/components/containers';
import CalendarBadge from '@proton/components/containers/calendar/settings/CalendarBadge';
import { useCalendarShareInvitationActions, useEventManager, useFeature, useLoading } from '@proton/components/hooks';
import {
    CALENDAR_STATUS_TYPE,
    getCalendarStatusBadges,
    getDisabledCalendarBadge,
} from '@proton/shared/lib/calendar/badges';
import { getCalendarSubpagePath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS } from '@proton/shared/lib/constants';
import { getIsAddressDisabled } from '@proton/shared/lib/helpers/address';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { CalendarMemberInvitation, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

const SharedCalendarRow = ({ calendar, displayEmail }: { calendar: VisualCalendar; displayEmail: boolean }) => {
    const {
        ID,
        Color,
        Name,
        Owner: { Email: ownerEmail },
        Email: memberEmail,
    } = calendar;
    const calendarNameWithOwner = `${Name} (${ownerEmail})`;

    const { badges } = getCalendarStatusBadges(calendar);
    const filteredBadges = badges.filter(({ statusType }) => statusType === CALENDAR_STATUS_TYPE.DISABLED);

    const statusHeader = (
        <div className="flex flex-align-items-center">
            <span className="mr0-5">{c('Header').t`Status`}</span>
            <Info url={getKnowledgeBaseUrl('/calendar-status')} />
        </div>
    );

    return (
        <TableRow>
            <TableCell label={c('Header').t`Name`}>
                <div className="grid-align-icon-center">
                    <CalendarSelectIcon color={Color} className="mr0-75 flex-item-noshrink keep-left" />
                    <div className="flex flex-align-items-center flex-nowrap overflow-hidden">
                        <div className="text-ellipsis" title={calendarNameWithOwner}>
                            {calendarNameWithOwner}
                        </div>
                    </div>
                    {displayEmail && <div className="text-ellipsis text-sm m0 color-weak">{memberEmail}</div>}
                </div>
            </TableCell>
            <TableCell label={filteredBadges.length > 0 && statusHeader}>
                <div data-test-id="calendar-settings-page:calendar-status" key="status">
                    {filteredBadges.map(({ statusType, badgeType, text, tooltipText }) => (
                        <CalendarBadge key={statusType} badgeType={badgeType} text={text} tooltipText={tooltipText} />
                    ))}
                </div>
            </TableCell>
            <TableCell>
                <Tooltip title={c('Calendar table settings button tooltip').t`Open settings`}>
                    <ButtonLike
                        as={SettingsLink}
                        app={APPS.PROTONCALENDAR}
                        path={getCalendarSubpagePath(ID)}
                        shape="outline"
                        size="small"
                        icon
                    >
                        <Icon name="cog-wheel" className="flex-item-noshrink" />
                    </ButtonLike>
                </Tooltip>
            </TableCell>
        </TableRow>
    );
};

const InvitationRow = ({
    user,
    invitation,
    onAccept,
    onDecline,
    isInvitedAddressDisabled,
    canAddCalendars,
    displayEmail,
}: {
    user: UserModel;
    invitation: CalendarMemberInvitation;
    onAccept: (invitation: CalendarMemberInvitation) => Promise<void>;
    onDecline: (invitationID: CalendarMemberInvitation) => Promise<void>;
    isInvitedAddressDisabled: boolean;
    canAddCalendars: boolean;
    displayEmail: boolean;
}) => {
    const [loadingAccept, withLoadingAccept] = useLoading();
    const [loadingDecline, withLoadingDecline] = useLoading();

    const { Email: invitedEmail, Calendar } = invitation;
    const calendarLabel = `${Calendar.Name} (${Calendar.SenderEmail})`;

    const handleAccept = () => withLoadingAccept(onAccept(invitation));
    const handleDecline = () => withLoadingDecline(onDecline(invitation));

    const isAcceptButtonDisabled = isInvitedAddressDisabled || !canAddCalendars || !user.hasNonDelinquentScope;
    const isDeclineButtonDisabled = !user.hasNonDelinquentScope;

    // TODO: Unify table styles with CalendarsTable.tsx
    return (
        <TableRow>
            <TableCell>
                <div className="grid-align-icon-center">
                    <CalendarSelectIcon border color={Calendar.Color} className="mr0-75 flex-item-noshrink keep-left" />
                    <div className="flex flex-align-items-center flex-nowrap overflow-hidden">
                        <div className="text-ellipsis" title={calendarLabel}>
                            {calendarLabel}
                        </div>
                    </div>
                    {displayEmail && <div className="text-ellipsis text-sm m0 color-weak">{invitedEmail}</div>}
                </div>
            </TableCell>
            <TableCell>
                <div key="status">{isInvitedAddressDisabled && <CalendarBadge {...getDisabledCalendarBadge()} />}</div>
            </TableCell>
            <TableCell>
                {isAcceptButtonDisabled && (
                    <Info
                        title={
                            isInvitedAddressDisabled
                                ? c('Info').t`Enable this address to join this calendar`
                                : c('Info').t`Remove one of your calendars to join this one`
                        }
                        className="mr0-5"
                    />
                )}
                <ButtonGroup size="small">
                    <Button loading={loadingAccept} disabled={isAcceptButtonDisabled} onClick={handleAccept}>
                        {c('Action; accept invitation to share calendar').t`Accept`}
                    </Button>
                    <Button loading={loadingDecline} disabled={isDeclineButtonDisabled} onClick={handleDecline}>
                        {c('Action; decline invitation to share calendar').t`Decline`}
                    </Button>
                </ButtonGroup>
            </TableCell>
        </TableRow>
    );
};

interface Props {
    user: UserModel;
    addresses: Address[];
    calendars: VisualCalendar[];
    calendarInvitations: CalendarMemberInvitation[];
    canAddCalendars: boolean;
}

const SharedCalendarsSection = ({ user, addresses, calendars = [], calendarInvitations, canAddCalendars }: Props) => {
    const { call } = useEventManager();
    const { accept, reject } = useCalendarShareInvitationActions();

    const hasSingleAddress = addresses.length === 1;
    const isCalendarSharingEnabled = !!useFeature(FeatureCode.CalendarSharingEnabled).feature?.Value;

    const [invitations, setInvitations] = useState([...calendarInvitations]);

    const removeInvitation = (ID: string) =>
        setInvitations((invitations) => invitations.filter(({ CalendarInvitationID }) => CalendarInvitationID !== ID));
    const handleAccept = async (invitation: CalendarMemberInvitation) => {
        await accept(invitation);
        removeInvitation(invitation.CalendarInvitationID);
        void call();
    };
    const handleDecline = async (invitation: CalendarMemberInvitation) => {
        await reject(invitation);
        removeInvitation(invitation.CalendarInvitationID);
    };

    if (!(calendars.length || (isCalendarSharingEnabled && invitations.length))) {
        return null;
    }

    const sharedWithMeTitle = c('Table header; invitations to share calendar').t`Shared with me`;

    return (
        <SettingsSectionWide>
            <h4 className="no-desktop text-bold text-rg mb0-5">{sharedWithMeTitle}</h4>
            <Table hasActions responsive="cards">
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell className="text-left w50">{sharedWithMeTitle}</TableHeaderCell>
                        <TableHeaderCell className="w20">{''}</TableHeaderCell>
                        <TableHeaderCell>{''}</TableHeaderCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {calendars.map((calendar) => (
                        <SharedCalendarRow key={calendar.ID} calendar={calendar} displayEmail={!hasSingleAddress} />
                    ))}
                    {isCalendarSharingEnabled &&
                        invitations.map((invitation) => {
                            const disabledCanonicalizedEmails = addresses
                                .filter((address) => getIsAddressDisabled(address))
                                .map((address) => canonicalizeInternalEmail(address.Email));

                            const isInvitedAddressDisabled = disabledCanonicalizedEmails.includes(
                                canonicalizeInternalEmail(invitation.Email)
                            );

                            return (
                                <InvitationRow
                                    key={invitation.CalendarInvitationID}
                                    user={user}
                                    invitation={invitation}
                                    onAccept={handleAccept}
                                    onDecline={handleDecline}
                                    isInvitedAddressDisabled={isInvitedAddressDisabled}
                                    canAddCalendars={canAddCalendars}
                                    displayEmail={!hasSingleAddress}
                                />
                            );
                        })}
                </TableBody>
            </Table>
        </SettingsSectionWide>
    );
};

export default SharedCalendarsSection;
