import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { PromotionBanner } from '@proton/components';
import { useApi, useEventManager } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { updateAutoDelete } from '@proton/shared/lib/api/mailSettings';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';

const AutoDeletePaidBanner = () => {
    const api = useApi();
    const { call } = useEventManager();

    const [loadingEnable, withLoadingEnable] = useLoading();
    const [loadingDisable, withLoadingDisable] = useLoading();

    const handleChangeAutoDelete = async (autoDelete: AUTO_DELETE_SPAM_AND_TRASH_DAYS) => {
        await api(updateAutoDelete(autoDelete));
        await call();
    };

    return (
        <PromotionBanner
            contentCentered
            description={c('Info')
                .t`Automatically delete messages that have been in trash and spam for more than 30 days.`}
            data-testid="auto-delete:banner:paid"
            hasDismissAction
            onClose={() => {
                if (!loadingDisable) {
                    void withLoadingDisable(handleChangeAutoDelete(AUTO_DELETE_SPAM_AND_TRASH_DAYS.DISABLED));
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
                        void withLoadingEnable(handleChangeAutoDelete(AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE));
                    }}
                >
                    {c('Action').t`Enable`}
                </Button>
            }
        />
    );
};

export default AutoDeletePaidBanner;
