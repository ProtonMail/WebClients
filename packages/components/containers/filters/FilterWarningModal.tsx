import { c } from 'ttag';
import { AlertModal } from '../../components/alertModal';
import { Button } from '../../components/button';

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const FilterWarningModal = ({ open, onClose, onConfirm }: Props) => (
    <AlertModal
        open={open}
        onClose={onClose}
        title={c('Title').t`Apply filter to existing messages`}
        buttons={[
            <Button
                color="norm"
                onClick={() => {
                    onConfirm();
                }}
            >{c('Action').t`Confirm`}</Button>,
            <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
        ]}
    >
        <p className="mt0">
            {c('Message')
                .t`All filter actions will be applied to all messages in your Proton Mail account. No auto-reply emails will be sent.`}
        </p>
    </AlertModal>
);

export default FilterWarningModal;
