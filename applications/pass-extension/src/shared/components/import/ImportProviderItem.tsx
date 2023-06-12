import type { VFC } from 'react';

import ButtonLike from '@proton/atoms/Button/ButtonLike';

import './ImportProviderItem.scss';

export const ImportProviderItem: VFC<{
    value: string;
    title: string;
    fileExtension: string;
    onClick?: () => void;
}> = ({ value, title, fileExtension, onClick }) => {
    return (
        <ButtonLike
            onClick={onClick}
            shape="ghost"
            className="flex flex-column flex-align-items-center rounded pass-import-providers--item px-0 py-2"
        >
            <img
                className="m-2"
                alt={title}
                src={value === 'protonpass' ? '/assets/protonpass-icon-24.svg' : `/assets/${value}-icon-24.png`}
            ></img>
            <span className="mb-0.5">{title}</span>
            <span className="color-weak">{fileExtension}</span>
        </ButtonLike>
    );
};
