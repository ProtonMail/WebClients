import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { Alert, ModalProps, ModalTwo, ModalTwoHeader, useSettingsLink } from '../../../components';
import ModalContent from '../../../components/modalTwo/ModalContent';
import ModalFooter from '../../../components/modalTwo/ModalFooter';

const ContactUpgradeModal = ({ ...rest }: ModalProps) => {
    const goToSettings = useSettingsLink();

    const handleConfirm = () => {
        goToSettings('/upgrade');
    };

    return (
        <ModalTwo size="small" {...rest}>
            <ModalTwoHeader title={c('Title').t`Upgrade required`} />
            <ModalContent>
                <Alert className="mb1" type="warning">{c('Warning')
                    .t`This feature requires a paid ${BRAND_NAME} account`}</Alert>
            </ModalContent>
            <ModalFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>
                <Button color="norm" onClick={handleConfirm}>{c('Action').t`Upgrade`}</Button>
            </ModalFooter>
        </ModalTwo>
    );
};

export default ContactUpgradeModal;
