import { c } from 'ttag';

import useEmailInput from '../../../../containers/username/useEmailInput';

interface EmailReservationInputProps {
    onEnter: () => void;
}

const EmailReservationInput = ({ onEnter }: EmailReservationInputProps) => {
    const { emailInput } = useEmailInput({
        autoFocus: true,
        onSubmit: onEnter,
        loading: false,
        bigger: true,
        usernameLabel: c('Label').t`Reserved email address`,
    });

    return (
        <div className="mt-6">
            {/* Zero-size overflow-auto sentinel required for challenge autofocus to work */}
            <div className="overflow-auto" aria-hidden="true" style={{ width: 0, height: 0 }} />
            {emailInput}
        </div>
    );
};

export default EmailReservationInput;
