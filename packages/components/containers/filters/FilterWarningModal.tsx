import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const FilterWarningModal = ({ open, onClose, onConfirm }: Props) => (
    <Prompt
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
        <p className="mt-0">
            {c('Message')
                .t`All filter actions will be applied to all messages in your ${MAIL_APP_NAME} account. No auto-reply emails will be sent.`}
        </p>
    </Prompt>
);

export default FilterWarningModal;
