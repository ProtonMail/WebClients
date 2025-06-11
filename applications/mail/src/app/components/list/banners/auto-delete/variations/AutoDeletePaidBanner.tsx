import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { PromotionBanner, useApi } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useDispatch } from '@proton/redux-shared-store';
import { updateAutoDelete } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';

const AutoDeletePaidBanner = () => {
    const api = useApi();
    const dispatch = useDispatch();

    const [loadingEnable, withLoadingEnable] = useLoading();
    const [loadingDisable, withLoadingDisable] = useLoading();

    const handleChangeAutoDelete = async (autoDelete: AUTO_DELETE_SPAM_AND_TRASH_DAYS) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateAutoDelete(autoDelete));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
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
