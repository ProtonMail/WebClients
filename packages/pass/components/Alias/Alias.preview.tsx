import { type FC } from 'react';

import { c } from 'ttag';

import { MiddleEllipsis } from '@proton/components';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import clsx from '@proton/utils/clsx';

import './Alias.preview.scss';

export const AliasPreview: FC<{
    loading?: boolean;
    prefix: string;
    suffix: string;
    className?: string;
}> = ({ loading, prefix, suffix, className }) => {
    const suffixLastChars = (suffix.split('@')?.[1]?.length ?? 5) + 1;

    return (
        <div className={clsx(['flex flex-column items-center mb-4', className])}>
            <div className="mb-2 color-weak">{c('Info').t`You are about to create:`}</div>
            <div className="w-full text-center">
                {loading ? (
                    <div className="w-full pass-skeleton pass-skeleton--alias-preview" />
                ) : (
                    <MiddleEllipsis
                        className={`${SubTheme.VIOLET} pass-alias-preview--content text-lg`}
                        charsToDisplayEnd={suffixLastChars}
                        displayTitle
                        text={prefix + suffix}
                    />
                )}
            </div>
        </div>
    );
};
