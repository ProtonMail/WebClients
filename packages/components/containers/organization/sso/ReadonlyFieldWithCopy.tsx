import { c } from 'ttag';

import type { Input } from '@proton/atoms';
import Copy from '@proton/components/components/button/Copy';
import type { InputFieldProps } from '@proton/components/components/v2/field/InputField';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useNotifications from '@proton/components/hooks/useNotifications';
import clsx from '@proton/utils/clsx';

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
