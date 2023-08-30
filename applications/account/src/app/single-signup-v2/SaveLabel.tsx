import { ComponentPropsWithoutRef } from 'react';

import './SaveLabel.scss';

interface Props extends ComponentPropsWithoutRef<'span'> {
    highlightPrice: boolean;
    percent: number;
}

const SaveLabel = ({ highlightPrice, percent, ...rest }: Props) => {
    const children = `− ${percent}%`;
    if (highlightPrice) {
        return (
            <span {...rest} className="text-sm save-label py-0-5 rounded">
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

export default SaveLabel;
