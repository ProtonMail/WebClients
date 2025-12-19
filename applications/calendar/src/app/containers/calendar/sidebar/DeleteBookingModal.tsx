import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';

import { useCalendarDispatch } from '../../../store/hooks';
import { deleteBookingPageThunk } from '../../../store/internalBooking/interalBookingSlice';

interface Props extends ModalProps {
    bookingUID: string;
    onResolve: () => void;
    onReject: () => void;
}

export const DeleteBookingModal = ({ bookingUID, onReject, onResolve, ...rest }: Props) => {
    const [loading, withLoading] = useLoading(false);
    const dispatch = useCalendarDispatch();
    const { createNotification } = useNotifications();

    const handleClose = () => {
        onReject();
    };

    const handleSubmit = async () => {
        await withLoading(dispatch(deleteBookingPageThunk(bookingUID)));
        createNotification({ type: 'success', text: c('Info').t`Booking page deleted` });
        onResolve();
        rest.onClose?.();
    };

    return (
        <Prompt
            title={c('Title').t`Delete booking page?`}
            buttons={[
                <Button color="danger" onClick={handleSubmit} loading={loading}>{c('Action').t`Confirm`}</Button>,
                <Button disabled={loading} onClick={handleClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Info').t`Are you sure you want to delete this booking page?`}
            <br />
            {c('Info').t`Previously booked events won't be deleted.`}
        </Prompt>
    );
};
