import { c } from 'ttag';

import type { Input } from '@proton/atoms/Input/Input';
import clsx from '@proton/utils/clsx';

import Copy from '../../../components/button/Copy';
import type { InputFieldProps } from '../../../components/v2/field/InputField';
import InputFieldTwo from '../../../components/v2/field/InputField';
import useNotifications from '../../../hooks/useNotifications';

interface Props extends Omit<InputFieldProps<typeof Input>, 'readonly' | 'unstyled'> {}

const ReadonlyFieldWithCopy = ({ value, inputContainerClassName, ...rest }: Props) => {
    const { createNotification } = useNotifications();

    const onCopy = () => {
        createNotification({ text: c('Info').t`Copied to clipboard` });
    };

    return (
        <InputFieldTwo
            value={value}
            readOnly
            inputContainerClassName={clsx('w-full', inputContainerClassName)}
            suffix={<Copy size="small" shape="ghost" color="weak" value={`${value}`} onCopy={onCopy} />}
            {...rest}
        />
    );
};

export default ReadonlyFieldWithCopy;
