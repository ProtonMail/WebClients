import { useEffect } from 'react';
import { c } from 'ttag';
import { useUser, useNotifications } from '../index';

const useDelinquent = () => {
    const [user] = useUser();
    const { createNotification } = useNotifications();

    useEffect(() => {
        if (user.isDelinquent && user.canPay) {
            createNotification({
                text: c('Warning notif for delinquent')
                    .t`Your account currently has an overdue invoice. Please pay all unpaid invoices.`,
                type: 'warning'
            });
        }
        if (user.isDelinquent && user.isMember) {
            createNotification({
                text: c('Warning notif for delinquent')
                    .t`Account access restricted due to unpaid invoices. Please contact your administrator.`,
                type: 'warning'
            });
        }
    }, [user.isDelinquent]);
};

export default useDelinquent;
