import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar/Calendar';

import Info from '../../../components/link/Info';
import Toggle from '../../../components/toggle/Toggle';
import useEventManager from '../../../hooks/useEventManager';
import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';
import SettingsSection from '../../account/SettingsSection';
import InviteLocaleSelector from './InviteLocaleSelector';
import { getIsAutoAddMeetLinkEnabled, getToggledAutoAddMeetLink } from './autoAddMeetLink';
import { useIsMeetVideoConferenceEnabled } from './useIsMeetVideoConferenceEnabled';

interface Props {
    calendarUserSettings: CalendarUserSettings;
    locales: TtagLocaleMap;
}

const CalendarInvitationsSection = ({
    calendarUserSettings: { InviteLocale, AutoImportInvite, AutoAddConferenceLink },
    locales,
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [loadingInviteLocale, withLoadingInviteLocale] = useLoading();
    const [loadingAutoImportInvite, withLoadingAutoImportInvite] = useLoading();
    const [loadingAutoAddMeetLink, withLoading] = useLoading();

    const isMeetVideoConferenceEnabled = useIsMeetVideoConferenceEnabled();

    const handleChange = async (data: Partial<CalendarUserSettings>) => {
        await api(updateCalendarUserSettings(data));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const handleAutoAddMeetLinkChange = () => {
        return withLoading(handleChange({ AutoAddConferenceLink: getToggledAutoAddMeetLink(AutoAddConferenceLink) }));
    };

    const displayedLocale = InviteLocale === null ? null : getClosestLocaleCode(InviteLocale, locales);

    return (
        <SettingsSection>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold" htmlFor="invite-locale" id="label-invite-local">
                        {
                            // translator: the full sentence will be "Send invites in [LANGUAGE]", where [LANGUAGE] is a dropdown with language options. E.g. "Send invites in [ENGLISH]"
                            c('Label').t`Send in`
                        }{' '}
                        <Info
                            buttonClass="ml-2 inline-flex"
                            title={c('Info').t`Event invitations and responses will be sent in this language.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <InviteLocaleSelector
                        id="invite-locale"
                        aria-labelledby="label-invite-local"
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
                <SettingsLayoutRight isToggleContainer>
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
            {isMeetVideoConferenceEnabled && (
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label className="text-semibold" htmlFor="auto-add-meet-link">
                            <span>{c('Label').t`Auto-add Meet links`}</span>
                            <Info
                                buttonClass="inline-flex ml-2"
                                title={c('Info')
                                    .t`Automatically add Meet links to your calendar invitations when there is at least one invitee.`}
                            />
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight isToggleContainer>
                        <Toggle
                            id="auto-add-meet-link"
                            aria-describedby="auto-add-meet-link"
                            loading={loadingAutoAddMeetLink}
                            checked={getIsAutoAddMeetLinkEnabled(AutoAddConferenceLink)}
                            onChange={handleAutoAddMeetLinkChange}
                        />
                    </SettingsLayoutRight>
                </SettingsLayout>
            )}
        </SettingsSection>
    );
};

export default CalendarInvitationsSection;
