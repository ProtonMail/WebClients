import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { leaveOrganisation } from '@proton/shared/lib/api/organization';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { useApi, useEventManager, useNotifications } from '../..';
import { ModalStateProps, Prompt } from '../../components';

interface Props extends ModalStateProps {
    organisationName: string;
}

const LeaveFamilyModal = ({ organisationName, ...modalState }: Props) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const api = useApi();
    const { call } = useEventManager();

    const handleLeave = async () => {
        await withLoading(api(leaveOrganisation()));
        modalState.onClose();
        await call();
        createNotification({ text: c('familyOffer_2023:Info').t`You left this plan` });
    };

    const handleClose = () => {
        if (loading) {
            return;
        }
        modalState.onClose();
    };

    return (
        <Prompt
            {...modalState}
            title={c('Title').t`Leave ${organisationName}?`}
            footnote={c('familyOffer_2023:Family plan').t`*Only one free trial per customer.`}
            buttons={[
                <Button color="danger" onClick={handleLeave} loading={loading}>{c('Action').t`Leave`}</Button>,
                <Button onClick={handleClose} disabled={loading}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p className="my-2">{c('familyOffer_2023:Family plan')
                .t`You will lose access to all premium features and storage space included with ${BRAND_NAME} Family.`}</p>
            <p className="my-2">{c('familyOffer_2023:Family plan')
                .t`To ease the transition, we're giving you a 30-day courtesy trial of ${BRAND_NAME} Unlimited*.`}</p>
        </Prompt>
    );
};

export default LeaveFamilyModal;
