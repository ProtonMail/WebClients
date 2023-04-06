import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { PromotionBanner } from '@proton/components/containers';
import { useApi, useEventManager, useLoading } from '@proton/components/hooks';
import { updateAutoDelete } from '@proton/shared/lib/api/mailSettings';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { AutoDeleteSpamAndTrashDaysSetting } from '@proton/shared/lib/interfaces';

import type { AutoDeleteLabelIDs } from '../interface';

interface Props {
    labelID: AutoDeleteLabelIDs;
}

const AutoDeletePaidBanner = ({ labelID }: Props) => {
    const api = useApi();
    const { call } = useEventManager();

    const [loadingEnable, withLoadingEnable] = useLoading();
    const [loadingDisable, withLoadingDisable] = useLoading();

    const handleChangeAutoDelete = async (autoDelete: AutoDeleteSpamAndTrashDaysSetting) => {
        await api(updateAutoDelete(autoDelete));
        await call();
    };

    const message: string = (() => {
        switch (labelID) {
            case MAILBOX_LABEL_IDS.TRASH:
                return c('Info').t`Automatically delete messages that have been in trash for more than 30 days.`;
            case MAILBOX_LABEL_IDS.SPAM:
                return c('Info').t`Automatically delete messages that have been in spam for more than 30 days.`;
        }
    })();

    return (
        <PromotionBanner
            contentCentered
            description={message}
            data-testid="auto-delete:banner:paid"
            hasDismissAction
            onClose={() => {
                if (!loadingDisable) {
                    void withLoadingDisable(handleChangeAutoDelete(AutoDeleteSpamAndTrashDaysSetting.DISABLED));
                }
            }}
            cta={
                <Button
                    loading={loadingEnable}
                    disabled={loadingDisable}
                    type="button"
                    color="norm"
                    className="text-bold"
                    shape="underline"
                    onClick={() => {
                        void withLoadingEnable(handleChangeAutoDelete(AutoDeleteSpamAndTrashDaysSetting.ACTIVE));
                    }}
                >
                    {c('Action').t`Enable`}
                </Button>
            }
        />
    );
};

export default AutoDeletePaidBanner;
