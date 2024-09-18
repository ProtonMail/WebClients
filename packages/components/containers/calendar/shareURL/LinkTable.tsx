import type { MouseEvent } from 'react';

import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { UserModel } from '@proton/shared/lib/interfaces';
import type { CalendarLink } from '@proton/shared/lib/interfaces/calendar';
import { ACCESS_LEVEL } from '@proton/shared/lib/interfaces/calendar';
import type { Nullable, SimpleMap } from '@proton/shared/lib/interfaces/utils';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

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

    const accessHeader = c('Header').t`Access`;
    const labelHeader = (
        <span className="flex items-center">
            <span className="mr-2">{c('Header').t`Label`}</span>
            <Info title={c('Info').t`Only you can see the label`} />
        </span>
    );

    return (
        <>
            <Table hasActions responsive="cards">
                <TableHeader cells={[accessHeader, labelHeader, c('Header').t`Actions`]} />
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
                                labels={[accessHeader, labelHeader, '']}
                                cells={[
                                    <div key="calendar">
                                        <div className="flex items-center">
                                            <Icon name="link" className="mr-2" />
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
