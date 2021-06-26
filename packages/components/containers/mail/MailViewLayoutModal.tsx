import React from 'react';
import { c } from 'ttag';
import { VIEW_LAYOUT } from '@proton/shared/lib/constants';
import { updateViewLayout } from '@proton/shared/lib/api/mailSettings';

import { useApi, useLoading, useEventManager, useNotifications, useMailSettings } from '../../hooks';
import { FormModal } from '../../components';
import ViewLayoutCards from '../layouts/ViewLayoutCards';

import './ModalSettingsLayoutCards.scss';

interface Props {
    onClose?: () => void;
}

const MailViewLayoutModal = ({ ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [{ ViewLayout = 0 } = {}] = useMailSettings();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const title = c('Title').t`Mailbox layout`;

    const handleChangeViewLayout = async (layout: VIEW_LAYOUT) => {
        await api(updateViewLayout(layout));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const handleSubmit = () => rest.onClose?.();

    return (
        <FormModal title={title} intermediate close={null} submit={c('Action').t`OK`} onSubmit={handleSubmit} {...rest}>
            <div className="flex flex-nowrap mb1 on-mobile-flex-column flex-column">
                <span className="mb1" id="layoutMode_desc">
                    {c('Label').t`Select how your mailbox looks like by default.`}
                </span>
                <ViewLayoutCards
                    describedByID="layoutMode_desc"
                    viewLayout={ViewLayout}
                    onChange={(value) => withLoading(handleChangeViewLayout(value))}
                    loading={loading}
                    liClassName="w100"
                    className="layoutCards-two-per-row"
                />
            </div>
        </FormModal>
    );
};

export default MailViewLayoutModal;
