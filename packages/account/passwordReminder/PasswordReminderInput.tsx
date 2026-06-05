import { type Ref, forwardRef } from 'react';

import PasswordInputTwo, { type PasswordInputTwoProps } from '@proton/components/components/v2/input/PasswordInput';

interface Props extends Omit<PasswordInputTwoProps, ''> {}

const PasswordReminderInputBase = (props: Props, ref: Ref<HTMLInputElement>) => {
    return (
        <PasswordInputTwo
            {...props}
            ref={ref}
            // Lets try to ensure password managers don't autofill.
            autoComplete="off"
            data-protonpass-ignore="true"
            data-1p-ignore
            data-bwignore
            data-lpignore="true"
            data-form-type="other"
        />
    );
};

const PasswordReminderInput = forwardRef(PasswordReminderInputBase);

export default PasswordReminderInput;
