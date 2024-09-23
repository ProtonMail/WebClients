import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useLoading } from '@proton/hooks';
import { updateViewLayout } from '@proton/shared/lib/api/mailSettings';
import type { VIEW_LAYOUT } from '@proton/shared/lib/mail/mailSettings';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { useApi, useEventManager, useMailSettings, useNotifications } from '../../hooks';
import ViewLayoutCards from '../layouts/ViewLayoutCards';

import './ModalSettingsLayoutCards.scss';

const MailViewLayoutModal = (props: ModalProps) => {
    const api = useApi();
    const { call } = useEventManager();
    const [{ ViewLayout } = DEFAULT_MAILSETTINGS] = useMailSettings();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const title = c('Title').t`Mailbox layout`;

    const { onClose } = props;

    const handleChangeViewLayout = async (layout: VIEW_LAYOUT) => {
        await api(updateViewLayout(layout));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const handleSubmit = () => onClose?.();

    return (
        <ModalTwo {...props}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <div className="flex flex-column flex-nowrap mb-4">
                    <span className="mb-4" id="layoutMode_desc">
                        {c('Label').t`Select what your mailbox looks like by default.`}
                    </span>
                    <ViewLayoutCards
                        describedByID="layoutMode_desc"
                        viewLayout={ViewLayout}
                        onChange={(value) => withLoading(handleChangeViewLayout(value))}
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

export default MailViewLayoutModal;
