import * as React from 'react';
import { CSSProperties, FC } from 'react';

import { Checkbox } from '@proton/components/components';

interface PhotosGroupProps {
    style?: CSSProperties;
    showSeparator?: boolean;
    className?: string;
}

export const PhotosGroup: FC<PhotosGroupProps> = ({ style, showSeparator = true, className }) => {
    const listItemStyle: Partial<CSSProperties> = {
        height: 'var(--photos-group-row-height)',
        ...(style ?? {}),
    };

    return (
        <div
            id={`photo-group-list-line-`}
            key={`photo-group-list-line-`}
            style={listItemStyle}
            className={`flex flex-align-items-center flex-nowrap h-100 ${className}`}
        >
            <Checkbox
                className="mr-2"
                name={`photos-group-`}
                // checked={checked}
                // indeterminate={indeterminate}
                // onChange={onSelect}
            >
                <span className="mr-2 text-semibold">NAME</span>
            </Checkbox>

            {showSeparator && <hr className="w100 m-0 border border-weak" />}
        </div>
    );
};
