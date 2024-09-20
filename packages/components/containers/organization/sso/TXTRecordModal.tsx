import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import useLoading from '@proton/hooks/useLoading';
import { getDomain } from '@proton/shared/lib/api/domains';
import type { Domain } from '@proton/shared/lib/interfaces';
import { VERIFY_STATE } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { useApi, useEventManager, useNotifications } from '../../../hooks';
import { verifyDomain } from '../../domains/DomainModal';
import TXTSection from './TXTSection';

interface Props extends ModalProps {
    domain: Domain;
}

const TXTRecordModal = ({ domain, ...rest }: Props) => {
    const onContinue = rest.onClose;
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const handleVerification = async () => {
        if (domain.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD) {
            return onContinue?.();
        }
        const { Domain } = await api<{ Domain: Domain }>(getDomain(domain.ID));
        const error = verifyDomain(Domain);
        if (error) {
            return createNotification({ text: error, type: 'error' });
        }
        await call();
        onContinue?.();
    };
    return (
        <Modal size="large" {...rest}>
            <ModalHeader title={c('Info').t`Verify domain`} />
            <ModalContent>
                <TXTSection domain={domain} includeTimeInformation />
            </ModalContent>
            <ModalFooter className="justify-end">
                <Button
                    color="norm"
                    loading={loading}
                    onClick={() => {
                        withLoading(handleVerification()).catch(noop);
                    }}
                >{c('Action').t`Done`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default TXTRecordModal;
