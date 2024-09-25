import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useLoading } from '@proton/hooks';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { updateComposerMode } from '@proton/shared/lib/api/mailSettings';
import type { COMPOSER_MODE } from '@proton/shared/lib/mail/mailSettings';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { useApi, useEventManager, useNotifications } from '../../hooks';
import ComposerModeCards from '../layouts/ComposerModeCards';

import './ModalSettingsLayoutCards.scss';

const MailComposerModeModal = (props: ModalProps) => {
    const api = useApi();
    const { call } = useEventManager();
    const [{ ComposerMode } = DEFAULT_MAILSETTINGS] = useMailSettings();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const title = c('Title').t`Composer mode`;

    const { onClose } = props;

    const handleChangeComposerMode = async (mode: COMPOSER_MODE) => {
        await api(updateComposerMode(mode));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const handleSubmit = () => onClose?.();

    return (
        <ModalTwo {...props}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <div className="flex flex-column flex-nowrap mb-4">
                    <span className="mb-4" id="composerMode_desc">
                        {c('Label').t`Select how your composer opens by default.`}
                    </span>
                    <ComposerModeCards
                        describedByID="composerMode_desc"
                        composerMode={ComposerMode}
                        onChange={(value) => withLoading(handleChangeComposerMode(value))}
                        loading={loading}
                        liClassName="w-full"
                        className="layoutCards-two-per-row"
                    />
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="ml-auto" color="norm" onClick={handleSubmit}>{c('Action').t`OK`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default MailComposerModeModal;
