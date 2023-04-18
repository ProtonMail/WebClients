import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { FeatureCode } from '@proton/components/containers/features';
import useFeature from '@proton/components/hooks/useFeature';
import useLoading from '@proton/components/hooks/useLoading';

interface Props {
    onClose: () => void;
}

const FamilyPlanFooter = ({ onClose }: Props) => {
    const [loading, withLoading] = useLoading();
    const featureFlag = useFeature(FeatureCode.OfferFamily2023);

    const doNotDisplay = async () => {
        await withLoading(featureFlag.update(false));
        onClose();
    };

    return (
        <div className="mb-4">
            <div className="text-center">
                <Button shape="underline" color="norm" size="small" onClick={doNotDisplay} loading={loading}>{c(
                    'familyOffer_2023:Action'
                ).t`Don't show this offer again`}</Button>
            </div>
            <p className="text-sm text-center color-weak">
                {c('familyOffer_2023:Footer').t`Discounts are based on the standard monthly pricing.`}
                <br />
                {c('familyOffer_2023:Footer')
                    .t`*Your subscription will automatically renew at the same rate at the end of your billing cycle.`}
            </p>
        </div>
    );
};

export default FamilyPlanFooter;
