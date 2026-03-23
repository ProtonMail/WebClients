import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import AutoDeleteUpsellModal from '@proton/components/components/upsell/modals/AutoDeleteUpsellModal';
import { PromotionBanner } from '@proton/components/containers/banner/PromotionBanner';

const AutoDeleteFreeBanner = () => {
    const [upsellModalProps, toggleUpsellModal, renderUpsellModal] = useModalState();

    return (
        <>
            {renderUpsellModal && <AutoDeleteUpsellModal modalProps={upsellModalProps} />}
            <PromotionBanner
                contentCentered
                description={c('Info')
                    .t`Upgrade to automatically delete messages that have been in Trash or Spam for more than 30 days.`}
                data-testid="auto-delete:banner:free"
                cta={
                    <Button
                        type="button"
                        className="text-bold"
                        shape="underline"
                        color="norm"
                        onClick={() => {
                            toggleUpsellModal(true);
                        }}
                    >
                        {c('Action').t`Upgrade`}
                    </Button>
                }
            />
        </>
    );
};

export default AutoDeleteFreeBanner;
