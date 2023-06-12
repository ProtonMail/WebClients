import { FormEvent, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

interface Props {
    children: ReactNode;
    className?: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onReset: (event: FormEvent<HTMLFormElement>) => void;
    autoComplete?: string;
    noValidate?: boolean;
}

/**
 * @deprecated Please use ModalTwo instead
 */
const Content = ({
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
            className={clsx(['modal-content', className])}
            noValidate={noValidate}
            method="post"
            {...rest}
        >
            {children}
        </form>
    );
};

export default Content;
