import React from 'react';
import PropTypes from 'prop-types';
import {
    MainLogo,
    Hamburger,
    NavMenu,
    PrimaryButton,
    Checkbox,
    useEventManager,
    useApi,
    useLoading,
    MobileNavServices,
    MobileNavLink
} from 'react-components';
import { c } from 'ttag';
import { updateCalendar } from 'proton-shared/lib/api/calendars';
import { getConstrastingColor } from '../../helpers/color';

const CalendarSidebar = ({
    expanded = false,
    onToggleExpand,
    url = '',
    calendars = [],
    miniCalendar,
    onCreateEvent
}) => {
    const { call } = useEventManager();
    const api = useApi();
    const [loadingAction, withLoadingAction] = useLoading();

    const handleVisibility = async (calendarID, checked) => {
        await api(updateCalendar(calendarID, { Display: +checked }));
        await call();
    };

    const calendarsListView = (() => {
        if (!Array.isArray(calendars)) {
            return null;
        }
        if (calendars.length === 0) {
            return null;
        }
        return calendars.map(({ ID, Name, Display, Color }, i) => {
            return (
                <div className="navigation__link" key={ID}>
                    <span className="flex flex-nowrap flex-items-center">
                        <Checkbox
                            className="mr0-25 fill-currentColor flex-item-noshrink"
                            color={getConstrastingColor(Color)}
                            backgroundColor={Display ? Color : 'transparent'} // transparent for the disabled state
                            borderColor={Color}
                            checked={!!Display}
                            disabled={loadingAction}
                            aria-describedby={`calendar-${i}`}
                            onChange={({ target: { checked } }) => withLoadingAction(handleVisibility(ID, checked))}
                        />
                        <span className="ellipsis mw100" id={`calendar-${i}`} title={Name}>
                            {Name}
                        </span>
                    </span>
                </div>
            );
        });
    })();

    const list = [
        {
            icon: 'general',
            text: c('Header').t`Calendars`,
            link: '/calendar/settings/calendars'
        }
    ];

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
                    <NavMenu list={list} className="mb0" />
                    {calendarsListView}
                </nav>
            </div>
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
