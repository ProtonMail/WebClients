import { clsx } from 'clsx';
import { c } from 'ttag';

import { Info } from '@proton/components';

interface Props {
    className?: string;
}

export const CategoryBadgeInfo = ({ className }: Props) => {
    return (
        <div className={clsx('flex items-center text-sm color-weak', className)}>
            <span>{c('Label').t`Why am I seeing this?`}</span>
            <Info
                buttonTabIndex={-1}
                className="ml-2"
                colorPrimary={false}
                title={c('Label')
                    .t`We’re improving how emails are categorized. Your feedback helps make it smarter and more accurate.`}
            />
        </div>
    );
};
