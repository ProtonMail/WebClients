import { type VFC } from 'react';

import { c } from 'ttag';

import { MiddleEllipsis } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

export const AliasPreview: VFC<{
    loading?: boolean;
    prefix: string;
    suffix: string;
    className?: string;
    standalone?: boolean;
}> = ({ loading, prefix, suffix, className, standalone = false }) => {
    const suffixLastChars = (suffix.split('@')?.[1]?.length ?? 5) + 1;

    const content = loading ? (
        <div className="ml-0.5 pass-skeleton pass-skeleton--alias-preview" />
    ) : (
        <MiddleEllipsis charsToDisplayEnd={suffixLastChars} text={prefix + suffix} />
    );

    return standalone ? (
        <div className={clsx(['color-primary', className])}>{content}</div>
    ) : (
        <div className={clsx(['flex mb-4', className])}>
            <small className="flex-item-nogrow flex-item-noshrink mr-0.5">{c('Info').t`You're about to create`}</small>
            <small className="color-primary flex-item-fluid">{content}</small>
        </div>
    );
};
