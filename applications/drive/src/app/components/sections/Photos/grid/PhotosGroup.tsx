import * as React from 'react';
import { CSSProperties, FC } from 'react';

import { c } from 'ttag';

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
            data-testid="month-text"
            className="text-semibold text-no-wrap text-capitalize py-3 flex flex-align-items-center flex-nowrap"
        >
            <Checkbox
                className="mr-2"
                checked={!!selected}
                data-testid="photos-group-checkbox"
                indeterminate={selected === 'some'}
                onChange={() => {
                    if (selected === 'some') {
                        onSelect(true);
                    } else {
                        onSelect(!selected);
                    }
                }}
                // Note: browsers combine aria-label and the actual label, the translation string is correct
                aria-label={
                    // translator: Used by screen readers to provide context for Photos groups (e.g. Select all items for September)
                    c('Info').t`Select all items for`
                }
            >
                {text}
            </Checkbox>
            {showSeparatorLine && <hr className="w-full m-0 ml-3 h-0 border-bottom border-weak" />}
        </div>
    );
};
