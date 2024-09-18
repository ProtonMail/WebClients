import { useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import { useLoading } from '@proton/hooks';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import {
    CALENDAR_STATUS_TYPE,
    getCalendarStatusBadges,
    getDisabledCalendarBadge,
} from '@proton/shared/lib/calendar/badges';
import { CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import { getCalendarSubpagePath } from '@proton/shared/lib/calendar/settingsRoutes';
import { ShareCalendarSignatureVerificationError } from '@proton/shared/lib/calendar/sharing/shareProton/ShareCalendarSignatureVerificationError';
import {
    getCalendarNameSubline,
    getCalendarNameWithOwner,
} from '@proton/shared/lib/calendar/sharing/shareProton/shareProton';
import { APPS } from '@proton/shared/lib/constants';
import { ApiError } from '@proton/shared/lib/fetch/ApiError';
import { getIsAddressDisabled } from '@proton/shared/lib/helpers/address';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, UserModel } from '@proton/shared/lib/interfaces';
import type { CalendarMemberInvitation, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { ButtonGroup, Tooltip, useModalState } from '../../../components';
import CalendarSelectIcon from '../../../components/calendarSelect/CalendarSelectIcon';
import { SettingsSectionWide } from '../../../containers';
import CalendarBadge from '../../../containers/calendar/settings/CalendarBadge';
import { useCalendarShareInvitationActions, useEventManager, useNotifications } from '../../../hooks';
import ShareCalendarWithSignatureVerificationErrorModal from '../../calendar/shareProton/ShareCalendarWithSignatureVerificationErrorModal';

const SharedCalendarRow = ({ calendar, displayEmail }: { calendar: VisualCalendar; displayEmail: boolean }) => {
    const {
        ID,
        Color,
        Name: calendarName,
        Owner: { Email: ownerEmail },
        Email: memberEmail,
        Permissions: memberPermissions,
        Type: calendarType,
    } = calendar;
    const calendarNameWithOwner = getCalendarNameWithOwner({ calendarName, ownerEmail });

    const { badges } = getCalendarStatusBadges(calendar);
    const filteredBadges = badges.filter(({ statusType }) => statusType === CALENDAR_STATUS_TYPE.DISABLED);
    const subline = getCalendarNameSubline({ calendarType, displayEmail, memberEmail, memberPermissions });

    const statusHeader = (
        <div className="flex items-center">
            <span className="mr-2">{c('Header').t`Status`}</span>
            <Info url={getKnowledgeBaseUrl('/calendar-status')} />
        </div>
    );

    return (
        <TableRow>
            <TableCell label={c('Header').t`Name`}>
                <div className="grid-align-icon-center">
                    <CalendarSelectIcon color={Color} className="mr-3 shrink-0 keep-left" />
                    <div className="flex items-center flex-nowrap overflow-hidden">
                        <div className="text-ellipsis" title={calendarNameWithOwner}>
                            {calendarNameWithOwner}
                        </div>
                    </div>
                    {subline && <div className="text-ellipsis text-sm m-0 color-weak">{subline}</div>}
                </div>
            </TableCell>
            <TableCell label={filteredBadges.length > 0 && statusHeader}>
                <div data-testid="calendar-settings-page:calendar-status" key="status">
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
                        <Icon
                            name="cog-wheel"
                            className="shrink-0"
                            alt={c('Calendar table settings button tooltip').t`Open settings`}
                        />
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

    const { Email: memberEmail, Calendar, Permissions: memberPermissions } = invitation;
    const calendarNameWithOwner = getCalendarNameWithOwner({
        calendarName: Calendar.Name,
        ownerEmail: Calendar.SenderEmail,
    });
    const subline = getCalendarNameSubline({
        calendarType: CALENDAR_TYPE.PERSONAL,
        displayEmail,
        memberEmail,
        memberPermissions,
    });

    const handleAccept = () => withLoadingAccept(onAccept(invitation));
    const handleDecline = () => withLoadingDecline(onDecline(invitation));

    const isAcceptButtonDisabled = isInvitedAddressDisabled || !canAddCalendars || !user.hasNonDelinquentScope;
    const isDeclineButtonDisabled = !user.hasNonDelinquentScope;

    // TODO: Unify table styles with CalendarsTable.tsx
    return (
        <TableRow>
            <TableCell>
                <div className="grid-align-icon-center">
                    <CalendarSelectIcon border color={Calendar.Color} className="mr-3 shrink-0 keep-left" />
                    <div className="flex items-center flex-nowrap overflow-hidden">
                        <div className="text-ellipsis" title={calendarNameWithOwner}>
                            {calendarNameWithOwner}
                        </div>
                    </div>
                    {subline && <div className="text-ellipsis text-sm m-0 color-weak">{subline}</div>}
                </div>
            </TableCell>
            <TableCell>
                <div key="status">{isInvitedAddressDisabled && <CalendarBadge {...getDisabledCalendarBadge()} />}</div>
            </TableCell>
            <TableCell>
                <div className="flex flex-nowrap justify-start lg:justify-end items-center gap-2">
                    {isAcceptButtonDisabled && (
                        <Info
                            title={
                                isInvitedAddressDisabled
                                    ? c('Info').t`Enable this address to join this calendar`
                                    : c('Info').t`Remove one of your calendars to join this one`
                            }
                            buttonClass="shrink-0"
                        />
                    )}
                    <ButtonGroup size="small" className="shrink-0">
                        <Button loading={loadingAccept} disabled={isAcceptButtonDisabled} onClick={handleAccept}>
                            {c('Action; accept invitation to share calendar').t`Accept`}
                        </Button>
                        <Button loading={loadingDecline} disabled={isDeclineButtonDisabled} onClick={handleDecline}>
                            {c('Action; decline invitation to share calendar').t`Decline`}
                        </Button>
                    </ButtonGroup>
                </div>
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
    const { createNotification } = useNotifications();
    const [
        signatureVerificationErrorModal,
        setIsSignatureVerificationErrorModalOpen,
        renderSignatureVerificationErrorModal,
    ] = useModalState();

    const { accept, reject } = useCalendarShareInvitationActions();

    const hasSingleAddress = addresses.length === 1;

    const [invitations, setInvitations] = useState([...calendarInvitations]);
    const [calendarOwnerEmail, setCalendarOwnerEmail] = useState('');

    const removeInvitation = (ID: string) =>
        setInvitations((invitations) => invitations.filter(({ CalendarInvitationID }) => CalendarInvitationID !== ID));

    const handleAcceptError = (e: Error) => {
        if (e instanceof ShareCalendarSignatureVerificationError) {
            const { senderEmail, errors } = e;
            setCalendarOwnerEmail(senderEmail);
            errors?.forEach((error) => {
                console.error(error);
            });
            setIsSignatureVerificationErrorModalOpen(true);
        } else {
            const text = e instanceof ApiError ? getApiErrorMessage(e) : e.message;
            createNotification({
                type: 'error',
                text,
            });
        }
    };
    const handleAccept = async (invitation: CalendarMemberInvitation) => {
        const accepted = await accept({ invitation, onError: handleAcceptError });
        if (accepted) {
            removeInvitation(invitation.CalendarInvitationID);
            await call();
        }
    };
    const handleRejectError = (e: Error) => {
        const text = e instanceof ApiError ? getApiErrorMessage(e) : e.message;
        createNotification({
            type: 'error',
            text,
        });
    };
    const handleDecline = async (invitation: CalendarMemberInvitation) => {
        await reject({ invitation, onError: handleRejectError });
        removeInvitation(invitation.CalendarInvitationID);
    };

    if (!calendars.length && !invitations.length) {
        return null;
    }

    const sharedWithMeTitle = c('Table header; invitations to share calendar').t`Shared with me`;

    return (
        <>
            {renderSignatureVerificationErrorModal && (
                <ShareCalendarWithSignatureVerificationErrorModal
                    {...signatureVerificationErrorModal}
                    senderEmail={calendarOwnerEmail}
                    onCancel={signatureVerificationErrorModal.onClose}
                />
            )}
            <SettingsSectionWide>
                <h4 className="lg:hidden text-bold text-rg mb-2">{sharedWithMeTitle}</h4>
                <Table hasActions responsive="cards" data-testid="shared-calendars-section">
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell className="text-left w-1/2">{sharedWithMeTitle}</TableHeaderCell>
                            <TableHeaderCell className="w-1/5">{''}</TableHeaderCell>
                            <TableHeaderCell>{''}</TableHeaderCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {calendars.map((calendar) => (
                            <SharedCalendarRow key={calendar.ID} calendar={calendar} displayEmail={!hasSingleAddress} />
                        ))}
                        {invitations.map((invitation) => {
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
        </>
    );
};

export default SharedCalendarsSection;
