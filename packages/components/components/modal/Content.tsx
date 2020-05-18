import React, { ReactNode, FormEvent } from 'react';

import { noop } from 'proton-shared/lib/helpers/function';
import { classnames } from '../../helpers/component';

interface Props {
    children: ReactNode;
    className?: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onReset: (event: FormEvent<HTMLFormElement>) => void;
    autoComplete?: string;
}

const Content = ({
    children,
    className = '',
    onSubmit = noop,
    onReset = noop,
    autoComplete = 'off',
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
            className={classnames(['pm-modalContent', className])}
            {...rest}
        >
            {children}
        </form>
    );
};

export default Content;
