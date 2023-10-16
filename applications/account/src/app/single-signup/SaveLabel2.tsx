import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

import './SaveLabel2.scss';

interface Props extends ComponentPropsWithoutRef<'span'> {
    highlightPrice: boolean;
    percent: number;
}

const SaveLabel2 = ({ className, highlightPrice, percent, ...rest }: Props) => {
    const children = `− ${percent}%`;
    if (highlightPrice) {
        return (
            <span
                {...rest}
                className={clsx(className, 'text-sm save-label2 py-0-5 color-success rounded-sm text-no-wrap')}
            >
                {children}
            </span>
        );
    }
    return (
        <span {...rest} className={clsx(className, 'text-sm color-success text-no-wrap')}>
            {children}
        </span>
    );
};

export default SaveLabel2;
