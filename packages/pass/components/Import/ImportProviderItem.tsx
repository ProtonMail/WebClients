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
        <ButtonLike onClick={onClick} shape="ghost" className="rounded pass-import-providers--item px-0 py-2">
            <div className="flex flex-column items-center">
                <img className="m-2" alt={title} src={`/assets/${value}-icon-48.png`} width="24" height="24"></img>
                <span className="mb-0.5">{title}</span>
                <span className="color-weak">{fileExtension}</span>
            </div>
        </ButtonLike>
    );
};
