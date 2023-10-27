import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

import './SaveLabel2.scss';

interface Props extends ComponentPropsWithoutRef<'span'> {
    highlightPrice: boolean;
}

const SaveLabel2 = ({ className, highlightPrice, children, ...rest }: Props) => {
    return (
        <span
            {...rest}
            className={clsx(className, 'rounded color-success text-no-wrap', highlightPrice && 'save-label2 py-0-5')}
        >
            {children}
        </span>
    );
};

export default SaveLabel2;
