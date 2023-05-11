import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

interface Props {
    columnLayout: boolean;
    isCompactView: boolean;
}

const AutoDeleteEnabledBanner = ({ columnLayout, isCompactView }: Props) => {
    return (
        <div
            data-testid="auto-delete:banner:enabled"
            className={clsx(
                'p0-5 color-hint text-center text-sm auto-delete-banner-enabled',
                columnLayout && 'auto-delete-banner-enabled--column',
                isCompactView && 'auto-delete-banner-enabled--compact'
            )}
        >
            {c('Info').t`Messages that have been in trash and spam more than 30 days will be automatically deleted.`}
        </div>
    );
};

export default AutoDeleteEnabledBanner;
