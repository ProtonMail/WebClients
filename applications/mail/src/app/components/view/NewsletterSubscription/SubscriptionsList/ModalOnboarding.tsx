import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Modal, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { FeatureCode, useFeature } from '@proton/features';
import illustration from '@proton/styles/assets/img/mails-subscriptions/onboarding.svg';

interface Props extends ModalProps {}

const ModalOnboarding = ({ ...rest }: Props) => {
    const { update } = useFeature(FeatureCode.NewsletterSubscriptionViewOnboarding);

    const boldQuicklySpot = <b>{c('Info').t`Quickly spot`}</b>;
    const boldUnsubscribe = <b>{c('Info').t`Unsubscribe`}</b>;
    const boldBulkDelete = <b>{c('Info').t`Bulk delete`}</b>;

    const handleClose = () => {
        rest.onClose?.();
        void update(true);
    };

    return (
        <Modal {...rest} onClose={handleClose} size="xsmall" className="modal-two--twocolors">
            <ModalHeader />
            <div className="modal-two-illustration-container relative text-center">
                <img src={illustration} alt="" />
            </div>
            <div className="modal-two-content-container">
                <ModalContent className="px-8 pt-8 m-auto mb-8">
                    <p className="m-0 text-lg text-center text-bold">{c('Info')
                        .t`You’re just a few clicks away from a clutter-free inbox`}</p>
                    <ol className="color-weak px-8">
                        <li key="spot" className="mb-2">{c('Info')
                            .jt`${boldQuicklySpot} which subscriptions are no longer relevant.`}</li>
                        <li key="unsubscribe" className="mb-2">{c('Info')
                            .jt`${boldUnsubscribe} from them with one click.`}</li>
                        <li key="bulk-delete">{c('Info')
                            .jt`${boldBulkDelete}, archive, or move old emails to a folder.`}</li>
                    </ol>
                    <Button fullWidth onClick={handleClose}>{c('Action').t`Got it`}</Button>
                </ModalContent>
            </div>
        </Modal>
    );
};

export default ModalOnboarding;
