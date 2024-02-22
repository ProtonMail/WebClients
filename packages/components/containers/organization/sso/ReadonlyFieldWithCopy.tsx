import { c } from 'ttag';

import { Input } from '@proton/atoms/Input';
import { Copy, InputFieldTwo } from '@proton/components/components';
import { InputFieldProps } from '@proton/components/components/v2/field/InputField';
import { useNotifications } from '@proton/components/hooks';

interface Props extends Omit<InputFieldProps<typeof Input>, 'readonly' | 'unstyled'> {}

const ReadonlyFieldWithCopy = ({ value, ...rest }: Props) => {
    const { createNotification } = useNotifications();

    const onCopy = () => {
        createNotification({ text: c('Info').t`Copied to clipboard` });
    };

    return (
        <InputFieldTwo
            value={value}
            readOnly
            suffix={<Copy size="small" shape="ghost" color="weak" value={`${value}`} onCopy={onCopy} />}
            {...rest}
        />
    );
};

export default ReadonlyFieldWithCopy;
