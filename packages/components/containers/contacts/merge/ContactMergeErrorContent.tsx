import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Icon from '@proton/components/components/icon/Icon';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

interface Props {
    model: {
        errorOnMerge?: boolean;
        errorOnLoad?: boolean;
    };
    onClose?: () => void;
}

const ContactMergeErrorContent = ({ model, onClose }: Props) => {
    const error = model.errorOnLoad
        ? c('Warning').t`Some of the contacts to be merged display errors. Please review them individually`
        : c('Warning').t`Contacts could not be merged`;

    return (
        <>
            <ModalTwoHeader title={c('Title').t`Contact Details`} />
            <ModalTwoContent>
                <Alert type="warning">
                    <Icon name="exclamation-circle" className="mr-4" />
                    <span className="mr-4">{error}</span>
                </Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
            </ModalTwoFooter>
        </>
    );
};

export default ContactMergeErrorContent;
