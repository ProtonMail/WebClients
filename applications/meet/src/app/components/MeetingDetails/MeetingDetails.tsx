import { useMemo } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import { Toggle } from '@proton/components/index';
import { IcMeetCopy } from '@proton/icons/icons/IcMeetCopy';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { useMeetings } from '@proton/meet/store/hooks/useMeetings';
import {
    MeetingSideBars,
    selectShowDuration,
    selectSideBarState,
    toggleShowDuration,
    toggleSideBarState,
} from '@proton/meet/store/slices/uiStateSlice';
import { parseMeetingLink } from '@proton/meet/utils/parseMeetingLink';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import { useFlag } from '@proton/unleash';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMeetContext } from '../../contexts/MeetContext';
import { useCopyTextToClipboard } from '../../hooks/useCopyTextToClipboard';
import type { KeyRotationLog } from '../../types';

import './MeetingDetails.scss';

export const MeetingDetails = ({ currentMeeting }: { currentMeeting?: Meeting }) => {
    const dispatch = useMeetDispatch();
    const isMeetShowMLSLogsEnabled = useFlag('MeetShowMLSLogs');
    const isMeetAllowMLSLogExportEnabled = useFlag('MeetAllowMLSLogExport');
    const copyTextToClipboard = useCopyTextToClipboard();

    const { meetingLink, roomName, passphrase, mlsGroupState, keyRotationLogs, getKeychainIndexInformation, paidUser } =
        useMeetContext();

    const sideBarState = useMeetSelector(selectSideBarState);
    const showDuration = useMeetSelector(selectShowDuration);

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
            onClose={() => dispatch(toggleSideBarState(MeetingSideBars.MeetingDetails))}
            paddingClassName="py-4"
            paddingHeaderClassName="px-4"
            header={
                <div className="flex items-center">
                    <h2 className="text-3xl text-semibold">{c('Title').t`Info`}</h2>
                </div>
            }
        >
            <div className="flex-1 overflow-auto min-h-0 px-4">
                <div className="meeting-info-wrapper meet-radius p-4">
                    <h3 className="text-semibold text-rg mb-4">{c('Title').t`Meeting details`}</h3>
                    <Table className="mb-0">
                        <TableBody>
                            <TableRow>
                                <TableCell type="header" scope="row" className="align-top color-weak w-1/3 pl-0">{c(
                                    'Title'
                                ).t`Title`}</TableCell>
                                <TableCell className="text-ellipsis">{roomName}</TableCell>
                            </TableRow>
                            {formattedStartDate && (
                                <TableRow>
                                    <TableCell type="header" scope="row" className="align-top color-weak w-1/3 pl-0">{c(
                                        'Title'
                                    ).t`Date`}</TableCell>
                                    <TableCell>{formattedStartDate}</TableCell>
                                </TableRow>
                            )}
                            {startTime && (
                                <TableRow>
                                    <TableCell type="header" scope="row" className="align-top color-weak w-1/3 pl-0">{c(
                                        'Title'
                                    ).t`Time`}</TableCell>
                                    <TableCell className="time-cell">
                                        {startTime} {endTime ? `- ${endTime}` : ''} ({timeZone})
                                    </TableCell>
                                </TableRow>
                            )}
                            <TableRow>
                                <TableCell type="header" scope="row" className="align-top color-weak w-1/3 pl-0">{c(
                                    'Title'
                                ).t`Invite link`}</TableCell>
                                <TableCell className="text-break-all overflow-hidden">
                                    <button
                                        className="w-full color-primary cursor-pointer text-left unstyled p-0 m-0"
                                        onClick={() => {
                                            void copyTextToClipboard(meetingLink);
                                        }}
                                        aria-label={c('Label').t`Copy invite link`}
                                    >
                                        {meetingLink}
                                    </button>
                                </TableCell>
                            </TableRow>
                            {passphrase && (
                                <TableRow>
                                    <TableCell type="header" scope="row" className="align-top color-weak w-1/3 pl-0">
                                        {c('Title').t`Passphrase`}
                                    </TableCell>
                                    <TableCell>
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
                    <h3 className="text-semibold text-rg mb-4">{c('Title').t`Messaging Layer Security`}</h3>
                    <div className="color-weak mb-2 pb-3 border-bottom">
                        {c('Info')
                            .t`This meeting is protected by end-to-end encryption with Messaging Layer Security (MLS).`}
                    </div>
                    {mlsGroupState && mlsGroupState.displayCode !== null && (
                        <Table className="mb-0">
                            <TableBody>
                                <TableRow>
                                    <TableCell type="header" scope="row" className="align-top color-weak w-1/3 pl-0">{c(
                                        'Title'
                                    ).t`Security code`}</TableCell>
                                    <TableCell>
                                        <button
                                            className="color-primary cursor-pointer unstyled p-0 m-0 flex flex-wrap gap-1 text-monospace"
                                            onClick={() => {
                                                void copyTextToClipboard(mlsGroupState.displayCode!);
                                            }}
                                        >
                                            {mlsGroupState
                                                .displayCode!.match(/.{1,4}/g) // separate every 4 characters
                                                ?.map((group, i) => (
                                                    <span key={i} className={i % 2 === 0 ? 'color-norm' : 'color-hint'}>
                                                        {group}
                                                    </span>
                                                ))}
                                        </button>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell type="header" scope="row" className="align-top color-weak w-1/3 pl-0">{c(
                                        'Title'
                                    ).t`Epoch`}</TableCell>
                                    <TableCell className="text-ellipsis">{mlsGroupState.epoch.toString()}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    )}
                </div>

                {isMeetShowMLSLogsEnabled && (
                    <div className="meeting-info-wrapper meeting-info-mls-wrapper meet-radius overflow-hidden p-4">
                        <div className="mb-4 flex justify-space-between items-center w-full">
                            <h3 className="text-semibold text-rg">{c('Title').t`Activity events`}</h3>
                            {isMeetAllowMLSLogExportEnabled && (
                                <Tooltip title={c('Label').t`Copy all activity events`}>
                                    <button
                                        className="color-primary cursor-pointer unstyled p-0 m-0"
                                        onClick={() => {
                                            void copyTextToClipboard(getEncryptionLogs());
                                        }}
                                    >
                                        <IcMeetCopy alt={c('Label').t`Copy all activity events`} />
                                    </button>
                                </Tooltip>
                            )}
                        </div>
                        <Table className="mb-0">
                            <TableBody>
                                {keyRotationLogs.map((log: KeyRotationLog, index: number) => {
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
                                            <TableCell type="header" scope="row" className="color-weak w-1/3 pl-0">
                                                <time dateTime={log.timestamp.toString()}>
                                                    {format(new Date(log.timestamp), 'HH:mm:ss', {
                                                        locale: dateLocale,
                                                    })}
                                                </time>
                                            </TableCell>
                                            <TableCell>{content}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
                {!!paidUser && (
                    <div className="meeting-info-wrapper meeting-info-mls-wrapper meet-radius overflow-hidden p-4">
                        <h3 className="text-semibold text-rg mb-4">{c('Title').t`Meeting settings`}</h3>
                        <Table className="mb-0">
                            <TableBody>
                                <TableRow>
                                    <TableCell type="header" scope="row" className="align-top color-weak w-1/2 pl-0">
                                        {c('Title').t`Show duration`}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Toggle
                                            checked={showDuration}
                                            onChange={() => dispatch(toggleShowDuration())}
                                        />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
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
