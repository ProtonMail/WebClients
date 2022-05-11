import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import {
    Button,
    Icon,
    SectionConfig,
    SidebarListItem,
    SidebarListItemButton,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    generateUID,
    useCalendars,
} from '@proton/components';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import { getSectionPath } from '@proton/components/containers/layout/helper';
import { getVisualCalendars, sortCalendars } from '@proton/shared/lib/calendar/calendar';
import clsx from '@proton/utils/clsx';

import SettingsListItem from '../../components/SettingsListItem';
import { getIsSingleCalendarSection } from './routes';

const MAX_CALENDARS = 10;

interface CalendarItemProps {
    sectionPath: string;
    color: string;
    name: string;
    calendarId: string;
}

const CalendarItem = ({ sectionPath, color, name, calendarId }: CalendarItemProps) => {
    return (
        <SidebarListItem>
            <SidebarListItemLink to={`${sectionPath}/${calendarId}`} className="navigation-link-child">
                <SidebarListItemContent left={<CalendarSelectIcon color={color} className="mr0-5" />}>
                    <span title={name} className="text-ellipsis">
                        {name}
                    </span>
                </SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
};

interface Props {
    prefix: string;
    calendarsSection: SectionConfig;
}

const CalendarsList = ({ prefix, calendarsSection }: Props) => {
    const [calendars = [], loadingCalendars] = useCalendars();
    const { pathname } = useLocation();
    const [showAll, setShowAll] = useState(false);

    const headerId = generateUID('CalendarsListHeader');
    const contentId = generateUID('CalendarsListContent');

    const [isExpanded, setIsExpanded] = useState(() => getIsSingleCalendarSection(pathname, calendarsSection.to));

    const toggleCalendarItems = () => {
        setIsExpanded((expanded) => !expanded);
    };

    const sectionPath = getSectionPath(prefix, calendarsSection);

    const calendarsSettingsHeaderProps = {
        to: sectionPath,
        icon: calendarsSection.icon,
        key: calendarsSection.to,
        exact: true,
    };

    const calendarsSettingsHeaderContent = (
        <span className="text-ellipsis" title={calendarsSection.text}>
            {calendarsSection.text}
        </span>
    );

    const calendarItems = (() => {
        if (loadingCalendars) {
            return [];
        }

        const sortedVisualCalendars = sortCalendars(getVisualCalendars(calendars));
        const remainingItems = calendars.length - MAX_CALENDARS;

        if (remainingItems > 1 && !showAll) {
            return (
                <>
                    {sortedVisualCalendars.slice(0, MAX_CALENDARS).map(({ Color, Name, ID }) => (
                        <CalendarItem sectionPath={sectionPath} color={Color} name={Name} calendarId={ID} key={ID} />
                    ))}
                    <SidebarListItem>
                        <SidebarListItemButton
                            onClick={() => setShowAll(true)}
                            className="navigation-link-child color-weak"
                        >
                            <SidebarListItemContent left={<SidebarListItemContentIcon name="plus" />}>
                                {
                                    // translator: The variable remainingItems is the number of calendars that can be brought to view by clicking on the button, which expands the list of calendars in the sidebar. E.g. 'Show 8 more'
                                    c('Calendar settings sidebar').t`Show ${remainingItems} more`
                                }
                            </SidebarListItemContent>
                        </SidebarListItemButton>
                    </SidebarListItem>
                </>
            );
        }

        return sortedVisualCalendars.map(({ Color, Name, ID }) => (
            <CalendarItem sectionPath={sectionPath} color={Color} name={Name} calendarId={ID} key={ID} />
        ));
    })();

    if (!calendars.length) {
        return <SettingsListItem {...calendarsSettingsHeaderProps}>{calendarsSettingsHeaderContent}</SettingsListItem>;
    }

    return (
        <>
            <SidebarListItem>
                <SidebarListItemLink
                    className="navigation-link--collapsible"
                    to={sectionPath}
                    exact
                    onClick={() => setIsExpanded(true)}
                    id={headerId}
                >
                    <SidebarListItemContent
                        left={<SidebarListItemContentIcon name={calendarsSection.icon} />}
                        right={
                            <Button
                                onClick={(e) => {
                                    /**
                                     *  Prevent SidebarListItemLink onClick handlers from triggering
                                     */
                                    e.preventDefault();
                                    e.stopPropagation();

                                    toggleCalendarItems();
                                }}
                                shape="ghost"
                                color="weak"
                                size="small"
                                icon
                                aria-expanded={isExpanded}
                                className="calendar-list-header-icon-button"
                                aria-describedby={headerId}
                                aria-controls={contentId}
                            >
                                <Icon name="chevron-down" className={clsx(isExpanded && 'rotateX-180')} />
                            </Button>
                        }
                    >
                        {calendarsSettingsHeaderContent}
                    </SidebarListItemContent>
                </SidebarListItemLink>
                <ul
                    className="unstyled"
                    id={contentId}
                    role="region"
                    aria-labelledby={headerId}
                    hidden={!isExpanded}
                    aria-hidden={!isExpanded}
                >
                    {calendarItems}
                </ul>
            </SidebarListItem>
        </>
    );
};

export default CalendarsList;
