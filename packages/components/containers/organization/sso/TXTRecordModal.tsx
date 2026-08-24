import { c } from 'ttag';

import { syncDomain } from '@proton/account/domains/actions';
import { Button } from '@proton/atoms/Button/Button';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { Domain } from '@proton/shared/lib/interfaces';
import { VERIFY_STATE } from '@proton/shared/lib/interfaces';

import type { ModalProps } from '../../../components/modalTwo/Modal';
import Modal from '../../../components/modalTwo/Modal';
import ModalContent from '../../../components/modalTwo/ModalContent';
import ModalFooter from '../../../components/modalTwo/ModalFooter';
import ModalHeader from '../../../components/modalTwo/ModalHeader';
import useErrorHandler from '../../../hooks/useErrorHandler';
import useNotifications from '../../../hooks/useNotifications';
import { verifyDomain } from '../../domains/DomainModal';
import TXTSection from './TXTSection';
import type { SsoAppInfo } from './ssoAppInfo';

interface Props extends ModalProps {
    domain: Domain;
    ssoAppInfo: SsoAppInfo;
}

const TXTRecordModal = ({ domain, ssoAppInfo, ...rest }: Props) => {
    const onContinue = rest.onClose;
    const dispatch = useDispatch();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();

    const handleVerification = async () => {
        if (domain.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD) {
            return onContinue?.();
        }
        const updatedDomain = await dispatch(syncDomain(domain));
        const error = verifyDomain(updatedDomain);
        if (error) {
            return createNotification({ text: error, type: 'error' });
        }
        onContinue?.();
    };

    return (
        <Modal size="large" {...rest}>
            <ModalHeader title={c('Info').t`Verify domain`} />
            <ModalContent>
                <TXTSection ssoAppInfo={ssoAppInfo} domain={domain} includeTimeInformation />
            </ModalContent>
            <ModalFooter className="justify-end">
                <Button
                    color="norm"
                    loading={loading}
                    onClick={() => {
                        withLoading(handleVerification()).catch(handleError);
                    }}
                >{c('Action').t`Done`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default TXTRecordModal;
