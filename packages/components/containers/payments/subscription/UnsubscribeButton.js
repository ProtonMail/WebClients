import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { deleteSubscription } from 'proton-shared/lib/api/payments';
import { hasBonuses } from 'proton-shared/lib/helpers/organization';
import { Button } from '../../../components';
import {
    useApi,
    useUser,
    useNotifications,
    useLoading,
    useModals,
    useEventManager,
    useOrganization,
} from '../../../hooks';
import LossLoyaltyModal from '../LossLoyaltyModal';
import DowngradeModal from '../DowngradeModal';

const DOWNGRADING_ID = 'downgrading-notification';

const UnsubscribeButton = ({ className, children }) => {
    const [user] = useUser();
    const [organization] = useOrganization();
    const { createNotification, hideNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();

    const handleUnsubscribe = async () => {
        createNotification({
            type: 'info',
            text: c('State').t`Downgrading your account, please wait`,
            id: DOWNGRADING_ID,
            expiration: 99999,
        });
        try {
            await api(deleteSubscription());
            await call();
            createNotification({ text: c('Success').t`You have successfully unsubscribed` });
        } finally {
            hideNotification(DOWNGRADING_ID);
        }
    };

    const handleClick = async () => {
        if (user.isFree) {
            return createNotification({ type: 'error', text: c('Info').t`You already have a free account` });
        }

        await new Promise((resolve, reject) => {
            createModal(<DowngradeModal user={user} onConfirm={resolve} onClose={reject} />);
        });

        if (hasBonuses(organization)) {
            await new Promise((resolve, reject) => {
                createModal(<LossLoyaltyModal organization={organization} onConfirm={resolve} onClose={reject} />);
            });
        }

        return handleUnsubscribe();
    };

    return (
        <Button loading={loading} className={className} onClick={() => withLoading(handleClick())}>
            {children}
        </Button>
    );
};

UnsubscribeButton.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
};

export default UnsubscribeButton;
