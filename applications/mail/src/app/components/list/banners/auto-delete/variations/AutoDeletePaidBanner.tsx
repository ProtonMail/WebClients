import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { PromotionBanner } from '@proton/components/containers/banner/PromotionBanner';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';

const AutoDeletePaidBanner = () => {
    const { update, isLoading } = useUpdateMailSetting();
    const loading = isLoading('AutoDeleteSpamAndTrashDays');

    const handleChangeAutoDelete = (autoDelete: AUTO_DELETE_SPAM_AND_TRASH_DAYS) => {
        update('AutoDeleteSpamAndTrashDays', autoDelete, { notify: false });
    };

    return (
        <PromotionBanner
            contentCentered
            description={c('Info')
                .t`Automatically delete messages that have been in trash and spam for more than 30 days.`}
            data-testid="auto-delete:banner:paid"
            hasDismissAction
            onClose={() => {
                if (!loading) {
                    handleChangeAutoDelete(AUTO_DELETE_SPAM_AND_TRASH_DAYS.DISABLED);
                }
            }}
            cta={
                <Button
                    loading={loading}
                    type="button"
                    color="norm"
                    className="text-bold"
                    shape="underline"
                    onClick={() => {
                        handleChangeAutoDelete(AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE);
                    }}
                >
                    {c('Action').t`Enable`}
                </Button>
            }
        />
    );
};

export default AutoDeletePaidBanner;
