import { getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { c } from 'ttag';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

import { useApi, useLoading, useEventManager, useNotifications } from '../../../hooks';

import { SettingsSection } from '../../account';
import { Info } from '../../../components';
import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';

import InviteLocaleSelector from './InviteLocaleSelector';

interface Props {
    calendarUserSettings: CalendarUserSettings;
    locales: TtagLocaleMap;
}

const CalendarInvitationsSection = ({ calendarUserSettings: { InviteLocale }, locales }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [loadingInviteLocale, withLoadingInviteLocale] = useLoading();

    const handleChange = async (data: Partial<CalendarUserSettings>) => {
        await api(updateCalendarUserSettings(data));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const displayedLocale = InviteLocale === null ? null : getClosestLocaleCode(InviteLocale, locales);

    return (
        <SettingsSection>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold" htmlFor="invite-locale">
                        {
                            // translator: the full sentence will be "Send invites in [LANGUAGE]", where [LANGUAGE] is a dropdown with language options. E.g. "Send invites in [ENGLISH]"
                            c('Label').t`Send invites in`
                        }{' '}
                        <Info
                            buttonClass="ml0-5 inline-flex"
                            title={c('Info').t`Event invites and RSVPs will be sent in this language.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <InviteLocaleSelector
                        id="invite-locale"
                        locale={displayedLocale}
                        locales={locales}
                        loading={loadingInviteLocale}
                        onChange={(InviteLocale) => withLoadingInviteLocale(handleChange({ InviteLocale }))}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};

export default CalendarInvitationsSection;
