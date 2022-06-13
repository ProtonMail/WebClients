import { MAX_LINKS_PER_CALENDAR } from '@proton/shared/lib/calendar/constants';
import { useEffect, useRef, useState } from 'react';
import { c, msgid } from 'ttag';
import { VisualCalendar, ACCESS_LEVEL, CalendarLink } from '@proton/shared/lib/interfaces/calendar';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';

import { UserModel } from '@proton/shared/lib/interfaces';
import { useLocation } from 'react-router-dom';
import {
    Icon,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    Button,
    Info,
    SelectTwo,
    Option,
    Alert,
} from '../../../components';
import CalendarSelect from '../../../components/calendarSelect/CalendarSelect';

interface Props {
    calendars: VisualCalendar[];
    defaultCalendar?: VisualCalendar;
    linksMap: SimpleMap<CalendarLink[]>;
    onCreateLink: ({ accessLevel, calendarID }: { accessLevel: ACCESS_LEVEL; calendarID: string }) => Promise<void>;
    isLoadingCreate: boolean;
    disabled: boolean;
    user: UserModel;
}

const ShareTable = ({
    calendars = [],
    defaultCalendar,
    linksMap,
    onCreateLink,
    isLoadingCreate,
    disabled,
    user,
}: Props) => {
    const fallbackCalendar = defaultCalendar || calendars[0];
    const [selectedCalendarID, setSelectedCalendarID] = useState(fallbackCalendar?.ID);
    const [accessLevel, setAccessLevel] = useState<ACCESS_LEVEL>(ACCESS_LEVEL.LIMITED);
    const maxLinksPerCalendarReached = linksMap[selectedCalendarID]?.length === MAX_LINKS_PER_CALENDAR;
    const shouldDisableCreateButton = disabled || maxLinksPerCalendarReached || !user.hasNonDelinquentScope;
    const { search } = useLocation();
    const shareTableWrapperRef = useRef<HTMLDivElement>(null);
    const options = calendars.map(({ ID, Name, Color }) => ({ id: ID, name: Name, color: Color }));

    useEffect(() => {
        const searchParams = new URLSearchParams(search);
        const shareParam = searchParams.get('share');

        if (shareParam) {
            setTimeout(() => {
                setSelectedCalendarID(shareParam);
                shareTableWrapperRef?.current?.scrollIntoView();
            }, 0);
        }
    }, []);

    useEffect(() => {
        // if the selected calendar gets deleted, use next preferred one
        if (!calendars.find(({ ID }) => ID === selectedCalendarID)) {
            setSelectedCalendarID(fallbackCalendar?.ID);
        }
    }, [calendars]);

    if (!fallbackCalendar) {
        return null;
    }

    return (
        <div ref={shareTableWrapperRef}>
            <Table>
                <TableHeader
                    cells={[
                        c('Header').t`Calendar`,
                        <div className="flex flex-align-items-center">
                            <span className="mr0-5">{c('Header').t`What others see`}</span>
                            <Info
                                title={c('Info')
                                    .t`Limited view: others see if you're busy. Full view: shows all event details, including name, location, or participants.`}
                            />
                        </div>,
                        null,
                    ]}
                />
                <TableBody>
                    <TableRow
                        cells={[
                            <div key="id" className="flex flex-nowrap flex-align-items-center">
                                <CalendarSelect
                                    calendarID={selectedCalendarID}
                                    options={options}
                                    onChange={({ value }) => setSelectedCalendarID(value)}
                                    disabled={disabled}
                                />
                            </div>,
                            <div key="what-others-see">
                                <SelectTwo
                                    disabled={disabled}
                                    value={accessLevel}
                                    onChange={({ value }) => setAccessLevel(value)}
                                >
                                    <Option value={0} title={c('Access level').t`Limited view`} />
                                    <Option value={1} title={c('Access level').t`Full view`} />
                                </SelectTwo>
                            </div>,
                            <Button
                                color="norm"
                                loading={isLoadingCreate}
                                disabled={shouldDisableCreateButton}
                                onClick={() => onCreateLink({ accessLevel, calendarID: selectedCalendarID })}
                            >
                                <Icon name="link" className="mr0-75" />
                                {c('Action').t`Create link`}
                            </Button>,
                        ]}
                    />
                </TableBody>
            </Table>
            {maxLinksPerCalendarReached && (
                <Alert className="mb1" type="warning">
                    {c('Maximum calendar links reached warning').ngettext(
                        msgid`You can create up to ${MAX_LINKS_PER_CALENDAR} link per calendar. To create a new link to this calendar, delete one from the list below.`,
                        `You can create up to ${MAX_LINKS_PER_CALENDAR} links per calendar. To create a new link to this calendar, delete one from the list below.`,
                        MAX_LINKS_PER_CALENDAR
                    )}
                </Alert>
            )}
        </div>
    );
};

export default ShareTable;
