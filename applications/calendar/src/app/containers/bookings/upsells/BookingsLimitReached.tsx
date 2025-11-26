import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';

export const BookingsLimitReached = ({ ...modalProps }: ModalStateProps) => {
    return (
        <Prompt
            title={c('Title').t`Cannot create more Booking pages`}
            buttons={[<Button onClick={modalProps.onClose}>{c('Action').t`Close`}</Button>]}
            {...modalProps}
        >
            <p className="m-0 mb-2">{c('Info')
                .t`You've reached the maximum number of booking pages available in your plan.`}</p>
            <p className="m-0">{c('Info')
                .t`To add a new booking page, remove an existing one from the Booking pages sidebar.`}</p>
        </Prompt>
    );
};
