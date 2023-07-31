import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { PromotionBanner } from '@proton/components/containers';
import { useApi, useEventManager } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { updateAutoDelete } from '@proton/shared/lib/api/mailSettings';
import { AutoDeleteSpamAndTrashDaysSetting } from '@proton/shared/lib/interfaces';

const AutoDeletePaidBanner = () => {
    const api = useApi();
    const { call } = useEventManager();

    const [loadingEnable, withLoadingEnable] = useLoading();
    const [loadingDisable, withLoadingDisable] = useLoading();

    const handleChangeAutoDelete = async (autoDelete: AutoDeleteSpamAndTrashDaysSetting) => {
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
