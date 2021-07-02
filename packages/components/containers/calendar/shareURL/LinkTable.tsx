import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import React, { MouseEvent, useMemo } from 'react';
import { c } from 'ttag';
import { Nullable, SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { ACCESS_LEVEL, CalendarLink } from '@proton/shared/lib/interfaces/calendar';
import { UserModel } from '@proton/shared/lib/interfaces';

import { Table, TableHeader, TableBody, TableRow, Info, DropdownActions, Icon } from '../../../components';

interface Props {
    linksMap: SimpleMap<CalendarLink[]>;
    onEdit: ({ calendarID, urlID, purpose }: { calendarID: string; urlID: string; purpose: Nullable<string> }) => void;
    onCopyLink: (link: string, e: MouseEvent<HTMLButtonElement>) => void;
    onDelete: ({ calendarID, urlID }: { calendarID: string; urlID: string }) => void;
    isLoadingMap: SimpleMap<boolean>;
    user: UserModel;
}

const sortLinks = (links: CalendarLink[]) => [...links].sort((a, b) => a.CreateTime - b.CreateTime);

const LinkTable = ({ linksMap, onCopyLink, onDelete, onEdit, isLoadingMap, user }: Props) => {
    const sortedLinks = useMemo(() => sortLinks(Object.values(linksMap).filter(isTruthy).flat()), [linksMap]);

    if (!sortedLinks.length) {
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
                    {sortedLinks.map(
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
                                            <div className="flex flex-nowrap">
                                                <Icon
                                                    name="calendar"
                                                    style={{ color }}
                                                    className="mr0-75 flex-item-noshrink"
                                                />
                                                <div className="text-ellipsis">
                                                    {calendarName}
                                                    <div className="text-sm color-weak m0">
                                                        {accessLevel === ACCESS_LEVEL.FULL
                                                            ? c('Access level').t`Full`
                                                            : c('Access level').t`Limited`}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>,
                                        <div key="label" className="text-ellipsis">
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
