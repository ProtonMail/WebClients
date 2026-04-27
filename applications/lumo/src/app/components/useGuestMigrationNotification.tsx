import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useNotifications } from '@proton/components/index';

import { GUEST_MIGRATION_STORAGE_KEYS } from '../constants/guestMigration';

export const useGuestMigrationNotification = () => {
    const { createNotification } = useNotifications();
    const history = useHistory();

    useEffect(() => {
        const migrationNav = sessionStorage.getItem(GUEST_MIGRATION_STORAGE_KEYS.POST_MIGRATION_NAV);
        if (migrationNav) {
            // setShowNotification(true);
            sessionStorage.removeItem(GUEST_MIGRATION_STORAGE_KEYS.POST_MIGRATION_NAV);

            // Navigate to the conversation that was active during sign-up
            setTimeout(() => {
                history.push(`/c/${migrationNav}`);
                createNotification({
                    text: c('Guest Migration').t`Your chat has been saved to your account!`,
                    type: 'success',
                });
            }, 1000);
        }
    }, [history, createNotification]);
};
