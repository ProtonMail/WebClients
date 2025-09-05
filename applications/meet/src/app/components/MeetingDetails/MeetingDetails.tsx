import { useMemo } from 'react';

import { c } from 'ttag';

import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import { parseMeetingLink } from '@proton/meet/utils/parseMeetingLink';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useCopyTextToClipboard } from '../../hooks/useCopyTextToClipboard';
import { useMeetings } from '../../store';
import { MeetingSideBars } from '../../types';

import './MeetingDetails.scss';

export const MeetingDetails = ({ currentMeeting }: { currentMeeting?: Meeting }) => {
    const copyTextToClipboard = useCopyTextToClipboard();

    const { meetingLink, roomName, passphrase } = useMeetContext();

    const { sideBarState, toggleSideBarState } = useUIStateContext();

    const timeZone = currentMeeting?.Timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

    const startDate = currentMeeting?.StartTime ? new Date(1000 * Number(currentMeeting.StartTime)) : null;

    const formattedStartDate = startDate
        ? new Intl.DateTimeFormat(dateLocale.code, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          }).format(startDate)
        : null;

    const startTime = startDate?.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timeZone,
    });

    const endTime = currentMeeting?.EndTime
        ? new Date(1000 * Number(currentMeeting.EndTime)).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone: timeZone,
          })
        : null;

    if (!sideBarState[MeetingSideBars.MeetingDetails]) {
        return null;
    }

    return (
        <SideBar
            onClose={() => toggleSideBarState(MeetingSideBars.MeetingDetails)}
            header={
                <div className="text-semibold flex items-center">
                    <div className="text-3xl">{c('Title').t`Info`}</div>
                </div>
            }
        >
            <div className="meeting-info-wrapper meet-radius overflow-hidden p-4">
                <div className="text-semibold pl-2 mb-4">{c('Title').t`Meeting details`}</div>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell className="align-top color-weak" colSpan={1}>{c('Title').t`Title`}</TableCell>
                            <TableCell className="text-ellipsis" colSpan={2}>
                                {roomName}
                            </TableCell>
                        </TableRow>
                        {formattedStartDate && (
                            <TableRow>
                                <TableCell className="color-weak" colSpan={1}>{c('Title').t`Date`}</TableCell>
                                <TableCell colSpan={2}>{formattedStartDate}</TableCell>
                            </TableRow>
                        )}
                        {startTime && (
                            <TableRow>
                                <TableCell className="color-weak" colSpan={1}>{c('Title').t`Time`}</TableCell>
                                <TableCell colSpan={2} className="time-cell">
                                    {startTime} {endTime ? `- ${endTime}` : ''} ({timeZone})
                                </TableCell>
                            </TableRow>
                        )}
                        <TableRow>
                            <TableCell className="align-top color-weak" colSpan={1}>{c('Title')
                                .t`Invite link`}</TableCell>
                            <TableCell colSpan={2} className="text-break-all overflow-hidden">
                                <div
                                    className="w-full color-primary cursor-pointer"
                                    onClick={() => copyTextToClipboard(meetingLink)}
                                >
                                    {meetingLink}
                                </div>
                            </TableCell>
                        </TableRow>
                        {passphrase && (
                            <TableRow>
                                <TableCell className="color-weak" colSpan={1}>
                                    {c('Title').t`Passphrase`}
                                </TableCell>
                                <TableCell colSpan={2}>
                                    <div
                                        className="w-full color-primary cursor-pointer"
                                        onClick={() => copyTextToClipboard(passphrase)}
                                    >
                                        {passphrase}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </SideBar>
    );
};

export const WrappedMeetingDetails = () => {
    const { meetingLink } = useMeetContext();

    const { meetingId } = parseMeetingLink(meetingLink);

    const [meetings] = useMeetings();

    const currentMeeting = useMemo(() => {
        return ((meetings ?? []) as Meeting[]).find((meeting) => meeting.MeetingLinkName === meetingId);
    }, [meetings, meetingId]);

    return <MeetingDetails currentMeeting={currentMeeting} />;
};
