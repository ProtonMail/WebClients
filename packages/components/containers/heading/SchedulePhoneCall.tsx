import { useContext } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useGetScheduleCall } from '@proton/account/scheduleCall/hooks';
import { useUser } from '@proton/account/user/hooks';
import CircleLoader from '@proton/atoms/CircleLoader/CircleLoader';
import useNotifications from '@proton/components/hooks/useNotifications';
import { canScheduleOrganizationPhoneCalls, openCalendlyLink } from '@proton/shared/lib/helpers/support';

import { UserDropdownContext } from './UserDropdownContext';

export const SchedulePhoneCall = () => {
    const { createNotification, hideNotification } = useNotifications();
    const { closeUserDropdown } = useContext(UserDropdownContext);
    const getScheduleCall = useGetScheduleCall();

    const [organization] = useOrganization();
    const [user] = useUser();

    const canSchedulePhoneCalls = canScheduleOrganizationPhoneCalls({ organization, user });

    const handleScheduleCallClick = async () => {
        closeUserDropdown();

        const id = createNotification({
            type: 'info',
            text: (
                <>
                    <CircleLoader size="small" className="mr-4" />
                    {c('Info')
                        .t`Loading calendar, please wait. You will be redirected to our scheduling platform Calendly in a new tab.`}
                </>
            ),
            expiration: -1,
            showCloseButton: false,
        });

        try {
            const { CalendlyLink } = await getScheduleCall();

            openCalendlyLink(CalendlyLink, user);
        } finally {
            hideNotification(id);
        }
    };

    return canSchedulePhoneCalls ? (
        <div className="block">
            <button
                type="button"
                className="mx-auto w-full px-2 link link-focus color-weak text-no-decoration hover:color-norm"
                onClick={handleScheduleCallClick}
            >
                {c('Action').t`Request a call`}
            </button>
        </div>
    ) : null;
};
