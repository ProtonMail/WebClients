import { c } from 'ttag';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { AutoDeleteLabelIDs } from '../interface';

interface Props {
    labelID: AutoDeleteLabelIDs;
}

const AutoDeleteEnabledBanner = ({ labelID }: Props) => {
    const message: string = (() => {
        switch (labelID) {
            case MAILBOX_LABEL_IDS.TRASH:
                return c('Info').t`Messages that have been in trash more than 30 days will be automatically deleted.`;
            case MAILBOX_LABEL_IDS.SPAM:
                return c('Info').t`Messages that have been in spam more than 30 days will be automatically deleted.`;
        }
    })();

    return (
        <div data-testid="auto-delete:banner:enabled" className="p0-5 color-hint text-center text-sm">
            {message}
        </div>
    );
};

export default AutoDeleteEnabledBanner;
