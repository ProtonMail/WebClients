import type { VFC } from 'react';

import { c } from 'ttag';

import ButtonLike from '@proton/atoms/Button/ButtonLike';

export const ImportProviderItem: VFC<{
    value: string;
    title: string;
    format: string;
    onClick?: () => void;
}> = ({ value, title, format, onClick }) => {
    return (
        <ButtonLike
            onClick={onClick}
            shape="ghost"
            className="flex flex-column flex-align-items-center rounded"
            style={{ outline: '1px solid var(--border-weak)' }}
        >
            <img
                className="m-2"
                alt=""
                src={value === 'protonpass' ? '/assets/protonpass-icon-24.svg' : `/assets/${value}-icon-24.png`}
            ></img>
            <span className="mb-0.5">{c('Label').t`${title}`}</span>
            <span className="color-weak">{c('Label').t`${format}`}</span>
        </ButtonLike>
    );
};
