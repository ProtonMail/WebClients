import * as React from 'react';
import { CSSProperties, FC } from 'react';

type Props = {
    style: CSSProperties;
    text: string;
    showSeparatorLine: boolean;
};

export const PhotosGroup: FC<Props> = ({ style, text, showSeparatorLine }) => {
    return (
        <div style={style} className="text-semibold text-no-wrap py-3 flex flex-align-items-center flex-nowrap">
            {text}
            {showSeparatorLine && <hr className="w100 m-0 ml-3 h0 border-bottom border-weak" />}
        </div>
    );
};
