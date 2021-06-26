import React from 'react';
import { c } from 'ttag';
import { COMPOSER_MODE } from 'proton-shared/lib/constants';
import { updateComposerMode } from 'proton-shared/lib/api/mailSettings';

import { useApi, useLoading, useEventManager, useNotifications, useMailSettings } from '../../hooks';
import { FormModal } from '../../components';
import ComposerModeCards from '../layouts/ComposerModeCards';

import './ModalSettingsLayoutCards.scss';

interface Props {
    onClose?: () => void;
}

const MailComposerModeModal = ({ ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [{ ComposerMode = 0 } = {}] = useMailSettings();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const title = c('Title').t`Composer mode`;

    const handleChangeComposerMode = async (mode: COMPOSER_MODE) => {
        await api(updateComposerMode(mode));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const handleSubmit = () => rest.onClose?.();

    return (
        <FormModal title={title} intermediate close={null} submit={c('Action').t`OK`} onSubmit={handleSubmit} {...rest}>
            <div className="flex flex-nowrap mb1 on-mobile-flex-column flex-column">
                <span className="mb1" id="composerMode_desc">
                    {c('Label').t`Select how your composer opens by default.`}
                </span>
                <ComposerModeCards
                    describedByID="composerMode_desc"
                    composerMode={ComposerMode}
                    onChange={(value) => withLoading(handleChangeComposerMode(value))}
                    loading={loading}
                    liClassName="w100"
                    className="layoutCards-two-per-row"
                />
            </div>
        </FormModal>
    );
};

export default MailComposerModeModal;
