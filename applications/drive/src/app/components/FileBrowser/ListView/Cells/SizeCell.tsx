import React from 'react';
import humanSize from 'proton-shared/lib/helpers/humanSize';

interface Props {
    size: number;
}

const SizeCell = ({ size }: Props) => {
    const readableSize = humanSize(size);
    return (
        <div className="ellipsis" title={readableSize}>
            <span className="pre">{readableSize}</span>
        </div>
    );
};

export default SizeCell;
