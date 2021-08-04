import { ReactNode, FormEvent } from 'react';

import { noop } from '@proton/shared/lib/helpers/function';
import { classnames } from '../../helpers';

interface Props {
    children: ReactNode;
    className?: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onReset: (event: FormEvent<HTMLFormElement>) => void;
    autoComplete?: string;
    noValidate?: boolean;
}

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
            className={classnames(['modal-content', className])}
            noValidate={noValidate}
            method="post"
            {...rest}
        >
            {children}
        </form>
    );
};

export default Content;
