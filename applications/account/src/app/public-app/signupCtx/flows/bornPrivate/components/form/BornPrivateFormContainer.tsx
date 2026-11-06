import type { FormEvent, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface FormContainerProps {
    children: ReactNode;
    className?: string;
    onSubmit: () => void;
}

const BornPrivateFormContainer = ({ children, className, onSubmit }: FormContainerProps) => {
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form
            noValidate
            onSubmit={handleSubmit}
            className={clsx(
                'rounded-xxl sm:mt-6 md:p-11 pb-8 sm:pb-11 born-private-reservation-bg-gradient md:max-w-custom w-full',
                className
            )}
            style={{ '--md-max-w-custom': '32rem' }}
        >
            {children}
        </form>
    );
};

export default BornPrivateFormContainer;
