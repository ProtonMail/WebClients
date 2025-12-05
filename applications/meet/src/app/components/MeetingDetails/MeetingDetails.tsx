import { useMemo } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import { IcMeetCopy } from '@proton/icons/icons/IcMeetCopy';
import { parseMeetingLink } from '@proton/meet/utils/parseMeetingLink';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import { useFlag } from '@proton/unleash/index';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useCopyTextToClipboard } from '../../hooks/useCopyTextToClipboard';
import { useMeetings } from '../../store/hooks/useMeetings';
import { MeetingSideBars } from '../../types';

import './MeetingDetails.scss';

export const MeetingDetails = ({ currentMeeting }: { currentMeeting?: Meeting }) => {
    const isMeetShowMLSLogsEnabled = useFlag('MeetShowMLSLogs');
    const isMeetAllowMLSLogExportEnabled = useFlag('MeetAllowMLSLogExport');
    const copyTextToClipboard = useCopyTextToClipboard();

    const {
        meetingLink,
        roomName,
        passphrase,
        mlsGroupState,
        keyRotationLogs,
        getKeychainIndexInformation,
        decryptionErrorLogs,
    } = useMeetContext();

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

    const getEncryptionLogs = () => {
        return JSON.stringify(
            {
                keyRotationLogs,
                keychainIndexInformation: getKeychainIndexInformation() ?? [],
                decryptionErrorLogs,
            },
            null,
            2
        );
    };

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
            <div className="flex-1 overflow-auto min-h-0">
                <div className="meeting-info-wrapper meet-radius p-4">
                    <div className="text-semibold pl-2 mb-4">{c('Title').t`Meeting details`}</div>
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="align-top color-weak" colSpan={1}>{c('Title')
                                    .t`Title`}</TableCell>
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
                                    <button
                                        className="w-full color-primary cursor-pointer text-left unstyled p-0 m-0"
                                        onClick={() => {
                                            void copyTextToClipboard(meetingLink);
                                        }}
                                    >
                                        {meetingLink}
                                    </button>
                                </TableCell>
                            </TableRow>
                            {passphrase && (
                                <TableRow>
                                    <TableCell className="color-weak" colSpan={1}>
                                        {c('Title').t`Passphrase`}
                                    </TableCell>
                                    <TableCell colSpan={2}>
                                        <button
                                            className="w-full color-primary cursor-pointer text-left unstyled p-0 m-0"
                                            onClick={() => {
                                                void copyTextToClipboard(passphrase);
                                            }}
                                        >
                                            {passphrase}
                                        </button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="meeting-info-wrapper meeting-info-mls-wrapper meet-radius overflow-hidden p-4">
                    <div className="text-semibold pl-2 mb-4">{c('Title').t`MLS state`}</div>
                    <div className="px-2">
                        <div className="color-weak mb-2 pb-3 border-bottom">
                            {c('Info')
                                .t`This meeting is protected by end-to-end encryption with Messaging Layer Security (MLS).`}
                        </div>
                        {mlsGroupState && (
                            <div className="flex gap-4 min-h-0">
                                <div className="shrink-0 flex flex-column">
                                    <div className="pt-2 pb-3 color-weak text-semibold border-bottom">{c('Title')
                                        .t`Epoch`}</div>
                                    {mlsGroupState.displayCode !== null && (
                                        <div
                                            className="py-3 color-weak text-semibold flex-1"
                                            style={{ display: 'flex', alignItems: 'center' }}
                                        >
                                            <span>{c('Title').t`Authenticator`}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-column text-break">
                                    <div className="pt-2 pb-3 border-bottom">
                                        <div>{mlsGroupState.epoch.toString()}</div>
                                    </div>
                                    {mlsGroupState.displayCode !== null && (
                                        <div className="py-3">
                                            <div className="overflow-y-auto" style={{ maxHeight: '8rem' }}>
                                                <button
                                                    className="color-primary cursor-pointer unstyled p-0 m-0"
                                                    style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25em' }}
                                                    onClick={() => {
                                                        void copyTextToClipboard(mlsGroupState.displayCode!);
                                                    }}
                                                >
                                                    {mlsGroupState
                                                        .displayCode!.match(/.{1,4}/g) // seperate every 4 characters
                                                        ?.map((group, i) => (
                                                            <span
                                                                key={i}
                                                                className={i % 2 === 0 ? 'color-norm' : 'color-hint'}
                                                            >
                                                                {group}
                                                            </span>
                                                        ))}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {isMeetShowMLSLogsEnabled && (
                    <div className="meeting-info-wrapper meeting-info-mls-wrapper meet-radius overflow-hidden p-4">
                        <div className="text-semibold pl-2 mb-4 flex justify-space-between items-center w-full">
                            {c('Title').t`Activity events`}
                            {isMeetAllowMLSLogExportEnabled && (
                                <button
                                    className="color-primary cursor-pointer unstyled p-0 m-0"
                                    onClick={() => {
                                        void copyTextToClipboard(getEncryptionLogs());
                                    }}
                                >
                                    <IcMeetCopy />
                                </button>
                            )}
                        </div>
                        <div className="px-2">
                            <Table>
                                <TableBody>
                                    {keyRotationLogs.map((log, index) => {
                                        const errorMessage =
                                            log.type === 'error' ? c('Title').t`Error at epoch ${log.epoch}` : '';
                                        const prevLog = keyRotationLogs[index - 1] ?? null;
                                        const logMessage =
                                            index === 0
                                                ? c('Title').t`Joined at epoch ${log.epoch}`
                                                : c('Title').t`Epoch ${prevLog.epoch} → ${log.epoch}`;

                                        const content = log.type === 'error' ? errorMessage : logMessage;
                                        return (
                                            <TableRow key={log.timestamp}>
                                                <TableCell className="color-weak">
                                                    {format(new Date(log.timestamp), 'HH:mm:ss', {
                                                        locale: dateLocale,
                                                    })}
                                                </TableCell>
                                                <TableCell>{content}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
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
