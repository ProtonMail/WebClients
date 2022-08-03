import { MouseEvent, useMemo } from 'react';

import { c } from 'ttag';

import { UserModel } from '@proton/shared/lib/interfaces';
import { ACCESS_LEVEL, CalendarLink, VisualCalendar, VisualCalendarLink } from '@proton/shared/lib/interfaces/calendar';
import { Nullable, SimpleMap } from '@proton/shared/lib/interfaces/utils';
import isTruthy from '@proton/utils/isTruthy';

import { DropdownActions, Info, Table, TableBody, TableHeader, TableRow } from '../../../components';
import CalendarSelectIcon from '../../../components/calendarSelect/CalendarSelectIcon';

interface Props {
    calendars: VisualCalendar[];
    linksMap: SimpleMap<CalendarLink[]>;
    onEdit: ({ calendarID, urlID, purpose }: { calendarID: string; urlID: string; purpose: Nullable<string> }) => void;
    onCopyLink: (link: string, e: MouseEvent<HTMLButtonElement>) => void;
    onDelete: ({ calendarID, urlID }: { calendarID: string; urlID: string }) => void;
    isLoadingMap: SimpleMap<boolean>;
    user: UserModel;
}

const sortLinks = (links: VisualCalendarLink[]) => [...links].sort((a, b) => a.CreateTime - b.CreateTime);

const LinkTable = ({ calendars, linksMap, onCopyLink, onDelete, onEdit, isLoadingMap, user }: Props) => {
    const sortedVisualLinks = useMemo(() => {
        const visualLinkMap = Object.entries(linksMap).reduce<SimpleMap<VisualCalendarLink[]>>(
            (acc, [calendarID, links]) => {
                const calendar = calendars.find(({ ID }) => ID === calendarID);
                if (!calendar || !links) {
                    // should not happen
                    return acc;
                }
                acc[calendarID] = links.map((link) => ({
                    ...link,
                    calendarName: calendar.Name,
                    color: calendar.Color,
                }));
                return acc;
            },
            {}
        );

        return sortLinks(Object.values(visualLinkMap).filter(isTruthy).flat());
    }, [linksMap, calendars]);

    if (!sortedVisualLinks.length) {
        return null;
    }

    return (
        <>
            <Table className="simple-table--has-actions">
                <TableHeader
                    cells={[
                        c('Header').t`Calendar`,
                        <>
                            <span className="mr0-5">{c('Header').t`Label`}</span>
                            <Info title={c('Info').t`Only you can see the labels.`} />
                        </>,
                        c('Header').t`Actions`,
                    ]}
                />
                <TableBody>
                    {sortedVisualLinks.map(
                        ({
                            CalendarID,
                            CalendarUrlID,
                            AccessLevel: accessLevel,
                            link,
                            color,
                            calendarName,
                            purpose,
                        }) => {
                            const list = [
                                user.hasNonDelinquentScope && {
                                    text: c('Action').t`Copy link`,
                                    onClick: (e: MouseEvent<HTMLButtonElement>) => onCopyLink(link, e),
                                },
                                user.hasNonDelinquentScope && {
                                    text: c('Action').t`Edit label`,
                                    onClick: () => onEdit({ calendarID: CalendarID, urlID: CalendarUrlID, purpose }),
                                },
                                {
                                    text: c('Action').t`Delete`,
                                    actionType: 'delete',
                                    onClick: () => onDelete({ calendarID: CalendarID, urlID: CalendarUrlID }),
                                } as const,
                            ].filter(isTruthy);

                            return (
                                <TableRow
                                    key={CalendarUrlID}
                                    cells={[
                                        <div key="calendar">
                                            <div className="grid-align-icon-center">
                                                <CalendarSelectIcon
                                                    color={color}
                                                    className="flex-item-noshrink mr0-75 keep-left"
                                                />
                                                <div className="text-ellipsis" title={calendarName}>
                                                    {calendarName}
                                                </div>
                                                <div className="text-sm color-weak m0">
                                                    {accessLevel === ACCESS_LEVEL.FULL
                                                        ? c('Access level').t`Full`
                                                        : c('Access level').t`Limited`}
                                                </div>
                                            </div>
                                        </div>,
                                        <div key="label" className="text-ellipsis" title={purpose || ''}>
                                            {purpose}
                                        </div>,
                                        <DropdownActions
                                            loading={isLoadingMap[CalendarUrlID]}
                                            size="small"
                                            key="actions"
                                            list={list}
                                        />,
                                    ]}
                                />
                            );
                        }
                    )}
                </TableBody>
            </Table>
        </>
    );
};

export default LinkTable;
