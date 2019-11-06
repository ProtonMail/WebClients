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
    useLoading
} from 'react-components';
import { c } from 'ttag';
import { updateCalendar } from 'proton-shared/lib/api/calendars';

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
        return calendars.map(({ ID, Name, Display, Color }) => {
            return (
                <div className="navigation__link" key={ID}>
                    <span className="flex flex-nowrap flex-items-center">
                        <Checkbox
                            className="mr0-25 fill-currentColor"
                            backgroundColor={Color}
                            checked={!!Display}
                            disabled={loadingAction}
                            onChange={({ target: { checked } }) => withLoadingAction(handleVisibility(ID, checked))}
                        />
                        <span className="ellipsis mw100">{Name}</span>
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

    return (
        <div className="sidebar flex flex-column noprint" data-expanded={expanded}>
            <div className="nodesktop notablet flex-item-noshrink">
                <div className="flex flex-spacebetween flex-items-center">
                    <MainLogo url={url} />
                    <Hamburger expanded={expanded} onToggle={onToggleExpand} />
                </div>
            </div>
            <div className="pl1 pr1 pb1">
                <PrimaryButton
                    className="pm-button--large bold mt0-25 w100"
                    onClick={() => onCreateEvent({ type: 'event' })}
                >{c('Action').t`New event`}</PrimaryButton>
            </div>
            <div className="pl1 pr1">{miniCalendar}</div>
            <nav className="navigation flex-item-fluid scroll-if-needed mb1">
                <NavMenu list={list} className="mb0" />
                {calendarsListView}
            </nav>
        </div>
    );
};

CalendarSidebar.propTypes = {
    miniCalendar: PropTypes.node,
    calendars: PropTypes.array,
    onCreateEvent: PropTypes.func.isRequired
};

export default CalendarSidebar;
