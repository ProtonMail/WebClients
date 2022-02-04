import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import React from 'react';
import { c } from 'ttag';
import { Info, Toggle } from '../../../components';

import { useApi, useEventManager, useLoading, useNotifications } from '../../../hooks';

import { SettingsSection } from '../../account';
import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';

import InviteLocaleSelector from './InviteLocaleSelector';

interface Props {
    calendarUserSettings: CalendarUserSettings;
    locales: TtagLocaleMap;
    hasInviteLocaleFeature: boolean;
    hasAutoImportInviteFeature: boolean;
}

const CalendarInvitationsSection = ({
    calendarUserSettings: { InviteLocale, AutoImportInvite },
    locales,
    hasInviteLocaleFeature,
    hasAutoImportInviteFeature,
}: Props) => {
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
            {hasInviteLocaleFeature && (
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
            )}
            {hasAutoImportInviteFeature && (
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label className="text-semibold inline-block" htmlFor="auto-import-invitations">
                            <span>
                                {c('Auto import invitations setting')
                                    .jt`Add invitations to calendar automatically and mark as pending`}
                            </span>
                            <Info
                                buttonClass="ml0-5 inline-flex"
                                title={c('Info')
                                    .t`You still need to reply to invitations for the host to see your response.`}
                            />
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="pt0-5 flex flex-align-items-center">
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
            )}
        </SettingsSection>
    );
};

export default CalendarInvitationsSection;
