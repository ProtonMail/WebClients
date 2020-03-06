import React from 'react';
import PropTypes from 'prop-types';
import {
    MainLogo,
    Hamburger,
    NavMenu,
    PrimaryButton,
    useEventManager,
    useApi,
    useLoading,
    MobileNavServices,
    MobileNavLink,
    Info
} from 'react-components';
import { c } from 'ttag';
import { updateCalendar } from 'proton-shared/lib/api/calendars';
import CalendarSidebarList from './CalendarSidebarList';
import CalendarSidebarVersion from './CalendarSidebarVersion';

const CalendarSidebar = ({
    expanded = false,
    onToggleExpand,
    url = '',
    activeCalendars = [],
    disabledCalendars = [],
    miniCalendar,
    onCreateEvent
}) => {
    const { call } = useEventManager();
    const api = useApi();
    const [loadingAction, withLoadingAction] = useLoading();

    const handleChangeVisibility = async (calendarID, checked) => {
        await api(updateCalendar(calendarID, { Display: +checked }));
        await call();
    };

    const mobileLinks = [
        { to: '/inbox', icon: 'protonmail', external: true, current: false },
        { to: '/contacts', icon: 'protoncontacts', external: true, current: false },
        { to: '/calendar', icon: 'protoncalendar', external: false, current: true }
    ].filter(Boolean);

    return (
        <div className="sidebar flex flex-nowrap flex-column noprint" data-expanded={expanded}>
            <div className="nodesktop notablet flex-item-noshrink">
                <div className="flex flex-spacebetween flex-items-center">
                    <MainLogo url={url} />
                    <Hamburger expanded={expanded} onToggle={onToggleExpand} />
                </div>
            </div>
            <div className="nomobile pl1 pr1 pb1 flex-item-noshrink">
                <PrimaryButton
                    className="pm-button--large bold mt0-25 w100"
                    disabled={!onCreateEvent}
                    onClick={() => onCreateEvent()}
                >{c('Action').t`New event`}</PrimaryButton>
            </div>
            <div className="flex-item-fluid flex-nowrap flex flex-column scroll-if-needed customScrollBar-container pb1">
                <div className="flex-item-noshrink">{miniCalendar}</div>
                <nav className="navigation mw100 flex-item-fluid-auto">
                    <NavMenu
                        list={[
                            {
                                icon: 'general',
                                text: c('Header').t`Calendars`,
                                link: '/calendar/settings/calendars'
                            }
                        ]}
                        className="mb0"
                    />
                    <CalendarSidebarList
                        calendars={activeCalendars}
                        onChangeVisibility={(calendarID, value) =>
                            withLoadingAction(handleChangeVisibility(calendarID, value))
                        }
                        loading={loadingAction}
                    />
                    {disabledCalendars.length ? (
                        <>
                            <NavMenu
                                list={[
                                    {
                                        text: (
                                            <>
                                                {c('Header').t`Disabled calendars`}
                                                <Info
                                                    buttonClass="ml0-5 inline-flex"
                                                    title={c('Disabled calendars')
                                                        .t`Disabled calendars are linked to disabled email addresses. You can still access your disabled calendar, view its events and delete them.`}
                                                />
                                            </>
                                        ),
                                        link: '/calendar/settings/calendars'
                                    }
                                ]}
                                className="mb0"
                            />
                            <CalendarSidebarList
                                calendars={disabledCalendars}
                                onChangeVisibility={(calendarID, value) =>
                                    withLoadingAction(handleChangeVisibility(calendarID, value))
                                }
                                loading={loadingAction}
                            />
                        </>
                    ) : null}
                </nav>
            </div>
            <CalendarSidebarVersion />
            <MobileNavServices>
                {mobileLinks.map(({ to, icon, external, current }) => {
                    return <MobileNavLink key={icon} to={to} icon={icon} external={external} current={current} />;
                })}
            </MobileNavServices>
        </div>
    );
};

CalendarSidebar.propTypes = {
    miniCalendar: PropTypes.node,
    calendars: PropTypes.array,
    onCreateEvent: PropTypes.func
};

export default CalendarSidebar;
