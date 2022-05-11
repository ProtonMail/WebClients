import { MouseEvent } from 'react';

import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';
import { UserModel } from '@proton/shared/lib/interfaces';
import { ACCESS_LEVEL, CalendarLink } from '@proton/shared/lib/interfaces/calendar';
import { Nullable, SimpleMap } from '@proton/shared/lib/interfaces/utils';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { DropdownActions, Icon, Info, Table, TableBody, TableHeader, TableRow } from '../../../components';

interface Props {
    links: CalendarLink[];
    onEdit: ({ calendarID, urlID, purpose }: { calendarID: string; urlID: string; purpose: Nullable<string> }) => void;
    onCopyLink: (link: string, e: MouseEvent<HTMLButtonElement>) => void;
    onDelete: ({ calendarID, urlID }: { calendarID: string; urlID: string }) => void;
    isLoadingMap: SimpleMap<boolean>;
    user: UserModel;
}

const LinkTable = ({ links, onCopyLink, onDelete, onEdit, isLoadingMap, user }: Props) => {
    if (!links.length) {
        return null;
    }

    return (
        <>
            <Table className="simple-table--has-actions">
                <TableHeader
                    cells={[
                        c('Header').t`Access`,
                        <>
                            <span className="mr0-5">{c('Header').t`Label`}</span>
                            <Info title={c('Info').t`Only you can see the labels.`} />
                        </>,
                        c('Header').t`Actions`,
                    ]}
                />
                <TableBody>
                    {links.map(({ CalendarID, CalendarUrlID, AccessLevel: accessLevel, link, purpose, CreateTime }) => {
                        const list = [
                            user.hasNonDelinquentScope && {
                                text: c('Action').t`Copy link`,
                                onClick: (e: MouseEvent<HTMLButtonElement>) => onCopyLink(link, e),
                            },
                            user.hasNonDelinquentScope && {
                                text: purpose ? c('Action').t`Edit label` : c('Action').t`Add label`,
                                onClick: () => onEdit({ calendarID: CalendarID, urlID: CalendarUrlID, purpose }),
                            },
                            {
                                text: c('Action').t`Delete link`,
                                actionType: 'delete',
                                onClick: () => onDelete({ calendarID: CalendarID, urlID: CalendarUrlID }),
                            } as const,
                        ].filter(isTruthy);

                        const purposeOrCreatedDate =
                            purpose ||
                            `${c('A label for unlabeled shared calendar links').t`Unlabeled`} (${format(
                                fromUnixTime(CreateTime),
                                'P',
                                {
                                    locale: dateLocale,
                                }
                            )})`;

                        return (
                            <TableRow
                                key={CalendarUrlID}
                                cells={[
                                    <div key="calendar">
                                        <div className="flex flex-align-items-center">
                                            <Icon name="link" className="mr0-5" />
                                            {accessLevel === ACCESS_LEVEL.FULL
                                                ? c('Access level').t`Full view`
                                                : c('Access level').t`Limited view`}
                                        </div>
                                    </div>,
                                    <div
                                        key="label"
                                        className={clsx(['text-ellipsis', !purpose && 'color-weak'])}
                                        title={purposeOrCreatedDate}
                                    >
                                        {purposeOrCreatedDate}
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
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default LinkTable;
