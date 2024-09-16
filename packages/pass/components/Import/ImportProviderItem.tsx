import { type FC } from 'react';

import { ButtonLike } from '@proton/atoms';
import type { ImportProvider } from '@proton/pass/lib/import/types';

import { ImportIcon } from './ImportIcon';

import './ImportProviderItem.scss';

export const ImportProviderItem: FC<{
    value: ImportProvider;
    title: string;
    fileExtension: string;
    onClick?: () => void;
}> = ({ value, title, fileExtension, onClick }) => {
    return (
        <ButtonLike onClick={onClick} shape="ghost" className="rounded pass-import-providers--item px-0 py-2">
            <div className="flex flex-column items-center">
                <ImportIcon provider={value} className="m-2" />
                <span className="mb-0.5">{title}</span>
                <span className="color-weak">{fileExtension}</span>
            </div>
        </ButtonLike>
    );
};
