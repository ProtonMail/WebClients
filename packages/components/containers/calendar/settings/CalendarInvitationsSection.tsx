import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';

import { Info, Toggle } from '../../../components';
import { useApi, useEventManager, useNotifications } from '../../../hooks';
import { SettingsSection } from '../../account';
import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';
import InviteLocaleSelector from './InviteLocaleSelector';

interface Props {
    calendarUserSettings: CalendarUserSettings;
    locales: TtagLocaleMap;
}

const CalendarInvitationsSection = ({ calendarUserSettings: { InviteLocale, AutoImportInvite }, locales }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [loadingInviteLocale, withLoadingInviteLocale] = useLoading();
    const [loadingAutoImportInvite, withLoadingAutoImportInvite] = useLoading();

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
                            c('Label').t`Send in`
                        }{' '}
                        <Info
                            buttonClass="ml-2 inline-flex"
                            title={c('Info').t`Event invitations and RSVPs will be sent in this language.`}
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
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold inline-block" htmlFor="auto-import-invitations">
                        <span>{c('Auto import invitations setting').jt`Add to calendar and mark as pending`}</span>
                        <Info
                            buttonClass="ml-2 inline-flex"
                            title={c('Info')
                                .t`You still need to reply to invitations for the host to see your response.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt-2 flex flex-align-items-center">
                    <Toggle
                        id="auto-import-invitations"
                        aria-describedby="auto-import-invitations"
                        loading={loadingAutoImportInvite}
                        checked={!!AutoImportInvite}
                        onChange={({ target }) =>
                            withLoadingAutoImportInvite(
                                handleChange({
                                    AutoImportInvite: +target.checked,
                                })
                            )
                        }
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};

export default CalendarInvitationsSection;
