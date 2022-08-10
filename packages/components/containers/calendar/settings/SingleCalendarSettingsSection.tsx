import { useEffect, useLayoutEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';

import { c } from 'ttag';

import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import SelectOptions from '@proton/components/components/selectTwo/SelectOptions';
import {
    PrivateMainArea,
    SettingsPageTitle,
    SettingsParagraph,
    SettingsSection,
    SettingsSectionTitle,
} from '@proton/components/containers';
import { useGetCalendarBootstrap, useNotifications } from '@proton/components/hooks';
import { UserModel } from '@proton/shared/lib/interfaces';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { ButtonLike, CollapsingBreadcrumbs, Icon, Option, SimpleDropdown } from '../../../components';
import { PrivateMainSettingsAreaBase } from '../../layout/PrivateMainSettingsArea';
import CalendarDeleteSection from './CalendarDeleteSection';
import CalendarEventDefaultsSection from './CalendarEventDefaultsSection';
import CalendarSettingsHeaderSection from './CalendarSettingsHeaderSection';

interface Props {
    calendars: VisualCalendar[];
    personalActiveCalendars: VisualCalendar[];
    subscribedCalendars: SubscribedCalendar[];
    defaultCalendar?: VisualCalendar;
    user: UserModel;
}

const SingleCalendarSettingsSection = ({
    calendars,
    personalActiveCalendars,
    subscribedCalendars,
    defaultCalendar,
    user: { hasNonDelinquentScope },
}: Props) => {
    const { calendarId } = useParams<{ calendarId: string }>();
    const history = useHistory();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const { createNotification } = useNotifications();
    const [calendar, setCalendar] = useState<SubscribedCalendar | VisualCalendar>();
    const [bootstrap, setBootstrap] = useState();
    const [renderCount, setRenderCount] = useState(0);

    useLayoutEffect(() => {
        const calendar =
            subscribedCalendars.find(({ ID }) => ID === calendarId) || calendars.find(({ ID }) => ID === calendarId);

        if (!calendar) {
            createNotification({
                type: 'error',
                text: c('Error').t`Calendar cannot be found`,
            });
            history.replace('/calendar/calendars');
        } else {
            setCalendar(calendar);
        }
    }, [calendarId, renderCount]);

    useEffect(
        () => {
            if (!calendar) {
                return;
            } else {
                setBootstrap(undefined);
            }

            (async () => {
                try {
                    setBootstrap(await getCalendarBootstrap(calendar.ID));
                } catch (e: any) {
                    const text = e?.message || 'Failed to retrieve calendar details';
                    createNotification({
                        type: 'error',
                        text,
                    });
                    //we leave the user stuck with a loader screen
                }
            })();
        },
        // re-load bootstrap only if calendar changes. Do not listen to dynamic changes
        [calendar?.ID]
    );

    if (!calendar) {
        return null;
    }

    if (!bootstrap) {
        return (
            <PrivateMainArea>
                <div className="container-section-sticky">
                    <SettingsPageTitle className="mt1-5 mb1-5 settings-loading-page-title" />
                    <section className="container-section-sticky-section">
                        <SettingsSectionTitle className="settings-loading-section-title" />
                        <SettingsSection>
                            <SettingsParagraph className="mb1">
                                <span className="block settings-loading-paragraph-line" />
                                <span className="block settings-loading-paragraph-line" />
                                <span className="block settings-loading-paragraph-line" />
                            </SettingsParagraph>
                        </SettingsSection>
                    </section>
                </div>
            </PrivateMainArea>
        );
    }

    const reRender = () => setRenderCount((count) => count + 1);

    const breadcrumbs = (
        <div className="flex flex-nowrap flex-align-items-center no-desktop no-tablet on-mobile-flex">
            <CollapsingBreadcrumbs
                breadcrumbs={[
                    {
                        text: c('breadcrumb').t`Calendars`,
                        key: 'calendars-main-route',
                        onClick: () => history.replace('/calendar/calendars'),
                    },
                    {
                        text: calendar.Name,
                        key: calendar.ID,
                        className: 'flex-item-fluid',
                    },
                ]}
            />
            {calendars && (
                <SimpleDropdown
                    as={ButtonLike}
                    shape="ghost"
                    color="weak"
                    icon
                    type="button"
                    className="flex-item-noshrink"
                    content={<Icon name="chevron-down" className="caret-like" />}
                    hasCaret={false}
                >
                    <SelectOptions
                        selected={calendars.findIndex(({ ID }) => ID === calendar.ID) || 0}
                        onChange={({ value: calendarID }) => history.replace(`/calendar/calendars/${calendarID}`)}
                    >
                        {calendars.map(({ ID, Name, Color }) => (
                            <Option key={ID} value={ID} title={Name}>
                                <div className="flex flex-nowrap flex-align-items-center">
                                    <CalendarSelectIcon color={Color} className="flex-item-noshrink mr0-75" />
                                    <div className="text-ellipsis">{Name}</div>
                                </div>
                            </Option>
                        ))}
                    </SelectOptions>
                </SimpleDropdown>
            )}
        </div>
    );

    return (
        <PrivateMainSettingsAreaBase
            title={calendar.Name}
            noTitle
            breadcrumbs={calendars.length > 1 ? breadcrumbs : undefined}
        >
            <div className="container-section-sticky-section container-section-sticky-section--single-calendar-section">
                <CalendarSettingsHeaderSection
                    calendar={calendar}
                    defaultCalendar={defaultCalendar}
                    onEdit={reRender}
                    isEditDisabled={!hasNonDelinquentScope}
                />
                <CalendarEventDefaultsSection
                    isEditDisabled={!hasNonDelinquentScope}
                    calendar={calendar}
                    bootstrap={bootstrap}
                />
                <CalendarDeleteSection
                    personalActiveCalendars={personalActiveCalendars}
                    calendar={calendar}
                    defaultCalendar={defaultCalendar}
                />
            </div>
        </PrivateMainSettingsAreaBase>
    );
};

export default SingleCalendarSettingsSection;
