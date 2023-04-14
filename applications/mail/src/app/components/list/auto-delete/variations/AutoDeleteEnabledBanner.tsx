import { c } from 'ttag';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { AutoDeleteLabelIDs } from '../interface';

interface Props {
    labelID: AutoDeleteLabelIDs;
    columnLayout: boolean;
    isCompactView: boolean;
}

const AutoDeleteEnabledBanner = ({ labelID, columnLayout, isCompactView }: Props) => {
    const message: string = (() => {
        switch (labelID) {
            case MAILBOX_LABEL_IDS.TRASH:
                return c('Info').t`Messages that have been in trash more than 30 days will be automatically deleted.`;
            case MAILBOX_LABEL_IDS.SPAM:
                return c('Info').t`Messages that have been in spam more than 30 days will be automatically deleted.`;
        }
    })();

    return (
        <div
            data-testid="auto-delete:banner:enabled"
            className={clsx(
                'p0-5 color-hint text-center text-sm auto-delete-banner-enabled',
                columnLayout && 'auto-delete-banner-enabled--column',
                isCompactView && 'auto-delete-banner-enabled--compact'
            )}
        >
            {message}
        </div>
    );
};

export default AutoDeleteEnabledBanner;
