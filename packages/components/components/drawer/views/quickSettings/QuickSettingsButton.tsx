import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import { CircleLoader } from '@proton/atoms';

interface Props {
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
}

const QuickSettingsButton = ({ onClick, children, disabled, loading, ...rest }: Props, ref: Ref<HTMLButtonElement>) => {
    return (
        <button
            onClick={onClick}
            type="button"
            className="color-weak text-no-decoration hover:text-underline flex flex-nowrap justify-center items-center text-sm mx-auto"
            ref={ref}
            disabled={disabled || loading}
            {...rest}
        >
            {children}
            {loading && <CircleLoader size="tiny" className="ml-2" />}
        </button>
    );
};

export default forwardRef(QuickSettingsButton);
