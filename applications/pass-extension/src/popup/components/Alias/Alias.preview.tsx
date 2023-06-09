import { type VFC } from 'react';

import { c } from 'ttag';

import { MiddleEllipsis } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { itemTypeToItemClassName } from '../../../shared/items/className';

import './Alias.preview.scss';

export const AliasPreview: VFC<{
    loading?: boolean;
    prefix: string;
    suffix: string;
    className?: string;
}> = ({ loading, prefix, suffix, className }) => {
    const suffixLastChars = (suffix.split('@')?.[1]?.length ?? 5) + 1;

    return (
        <div className={clsx(['flex flex-column flex-align-items-center mb-4', className])}>
            <div className="mb-2 color-weak">{c('Info').t`You are about to create:`}</div>
            <div className="w100 text-center">
                {loading ? (
                    <div className="w100 pass-skeleton pass-skeleton--alias-preview" />
                ) : (
                    <MiddleEllipsis
                        className={`${itemTypeToItemClassName.login} pass-alias-preview--content text-lg`}
                        charsToDisplayEnd={suffixLastChars}
                        displayTitle
                        text={prefix + suffix}
                    />
                )}
            </div>
        </div>
    );
};
