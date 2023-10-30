import { ComponentPropsWithoutRef } from 'react';

import './SaveLabel.scss';

interface Props extends ComponentPropsWithoutRef<'span'> {
    percent: number;
}

const SaveLabel = ({ percent, ...rest }: Props) => {
    return (
        <span {...rest} className="text-sm color-success save-label py-0.5 px-1 rounded-sm">
            {`− ${percent}%`}
        </span>
    );
};

export default SaveLabel;
