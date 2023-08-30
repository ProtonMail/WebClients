import { ComponentPropsWithoutRef } from 'react';

import './SaveLabel2.scss';

interface Props extends ComponentPropsWithoutRef<'span'> {
    highlightPrice: boolean;
    percent: number;
}

const SaveLabel2 = ({ highlightPrice, percent, ...rest }: Props) => {
    const children = `− ${percent}%`;
    if (highlightPrice) {
        return (
            <span {...rest} className="text-sm save-label2 py-0-5 color-success rounded-sm">
                {children}
            </span>
        );
    }
    return (
        <span {...rest} className="text-sm color-success">
            {children}
        </span>
    );
};

export default SaveLabel2;
