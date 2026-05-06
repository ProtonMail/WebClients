import { c } from 'ttag';

import { SafetyReviewCtaPortal } from '@proton/account/safetyReview/components/SafetyReviewCtaPortal';
import { getBackCopy } from '@proton/account/safetyReview/components/getSafetyReviewBackLink';
import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import AppLink from '@proton/components/components/link/AppLink';

interface Props extends SafetyReviewAllProps {}
export const PositiveCongratulationsCta = ({
    firstItemId,
    footerEl,
    safetyReview: {
        state: { backLink },
    },
}: Props) => {
    if (!firstItemId) {
        return null;
    }
    return (
        <SafetyReviewCtaPortal footerEl={footerEl}>
            <ButtonLike
                as={AppLink}
                toApp={backLink.context === 'settings' ? undefined : backLink.appName}
                to={backLink.to}
                target="_self"
                fullWidth
                color="norm"
                size="large"
                pill
                className="safety-review-cta-button"
            >
                {getBackCopy(backLink)}
            </ButtonLike>
        </SafetyReviewCtaPortal>
    );
};

export const NegativeCongratulationsCta = ({
    firstItemId,
    footerEl,
    safetyReview: {
        state: { backLink },
    },
    onClick,
}: Props & { onClick: () => void }) => {
    if (!firstItemId) {
        return null;
    }
    return (
        <SafetyReviewCtaPortal footerEl={footerEl}>
            <div className="flex flex-row flex-nowrap gap-2 justify-center">
                <ButtonLike
                    as={AppLink}
                    toApp={backLink.context === 'settings' ? undefined : backLink.appName}
                    to={backLink.to}
                    target="_self"
                    fullWidth
                    size="large"
                    pill
                >
                    {getBackCopy(backLink)}
                </ButtonLike>

                <Button
                    color="norm"
                    fullWidth
                    pill
                    size="large"
                    onClick={onClick}
                    form={firstItemId}
                    className="safety-review-cta-button"
                >
                    {c('safety_review').t`Add options`}
                </Button>
            </div>
        </SafetyReviewCtaPortal>
    );
};
