import * as React from 'react';
import { CSSProperties, FC } from 'react';

import { Checkbox } from '@proton/components/components';

type Props = {
    style: CSSProperties;
    text: string;
    showSeparatorLine: boolean;
    onSelect: (isSelected: boolean) => void;
    selected: boolean | 'some';
};

export const PhotosGroup: FC<Props> = ({ style, text, showSeparatorLine, onSelect, selected }) => {
    return (
        <div
            style={style}
            className="text-semibold text-no-wrap text-capitalize py-3 flex flex-align-items-center flex-nowrap"
        >
            <Checkbox
                className="mr-2"
                checked={!!selected}
                indeterminate={selected === 'some'}
                onChange={() => {
                    if (selected === 'some') {
                        onSelect(true);
                    } else {
                        onSelect(!selected);
                    }
                }}
            />
            {text}
            {showSeparatorLine && <hr className="w100 m-0 ml-3 h0 border-bottom border-weak" />}
        </div>
    );
};
