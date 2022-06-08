import { ReactNode, FormEvent } from 'react';

import noop from '@proton/util/noop';
import { classnames } from '@proton/components';

interface Props {
    children: ReactNode;
    className?: string;
    onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
    onReset?: (event: FormEvent<HTMLFormElement>) => void;
    autoComplete?: string;
    noValidate?: boolean;
}

const InnerModalContent = ({
    children,
    className = '',
    onSubmit = noop,
    onReset = noop,
    autoComplete = 'off',
    noValidate = false,
    ...rest
}: Props) => {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit(event);
    };

    return (
        <form
            onSubmit={handleSubmit}
            onReset={onReset}
            autoComplete={autoComplete}
            className={classnames(['inner-modal-content', className])}
            noValidate={noValidate}
            method="post"
            {...rest}
        >
            {children}
        </form>
    );
};

export default InnerModalContent;
