import { c } from 'ttag';

import { InputFieldTwo } from '@proton/components';
import type { FormFieldValidator } from '@proton/components/components/v2/useFormErrors';
import { emailValidator } from '@proton/shared/lib/helpers/formValidators';
import isTruthy from '@proton/utils/isTruthy';

interface ParentEmailInputProps {
    value: string;
    onValue: (value: string) => void;
    validator: FormFieldValidator;
}

const ParentEmailInput = ({ value, onValue, validator }: ParentEmailInputProps) => {
    return (
        <div className="mt-6">
            <InputFieldTwo
                type="email"
                autoComplete="email"
                label={c('Label').t`Your email address`}
                autoFocus
                value={value}
                onValue={onValue}
                bigger
                error={validator([emailValidator(value)].filter(isTruthy))}
            />
        </div>
    );
};

export default ParentEmailInput;
