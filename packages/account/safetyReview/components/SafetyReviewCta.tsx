import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import type { RecoveryActionItem } from '../recoveryState/recoveryState';
import { SafetyReviewCtaPortal } from './SafetyReviewCtaPortal';
import type { SafetyReviewAllProps } from './interface';

import './SafetyReviewCta.scss';

interface Props extends SafetyReviewAllProps {
    cta: string;
    recoveryItem: RecoveryActionItem;
    disabled?: boolean;
    loading?: boolean;
    onSkip?: () => void;
}
export const SafetyReviewCta = ({
    footerEl,
    safetyReview: {
        actions: { next },
    },
    firstItemId,
    disabled,
    loading,
    onSkip,
    cta,
    recoveryItem,
}: Props) => {
    // Only render cta in case it's on top
    if (!firstItemId) {
        return null;
    }
    return (
        <SafetyReviewCtaPortal footerEl={footerEl}>
            <div className="safety-review-cta-container flex flex-row flex-nowrap gap-2 justify-center">
                <Button
                    fullWidth
                    pill
                    size="large"
                    onClick={
                        onSkip ??
                        (() => {
                            next('skipped', recoveryItem);
                        })
                    }
                >
                    {c('safety_review').t`Later`}
                </Button>
                <Button
                    color="norm"
                    fullWidth
                    pill
                    size="large"
                    type="submit"
                    form={firstItemId}
                    loading={loading}
                    disabled={disabled}
                    className="safety-review-cta-button"
                >
                    {cta}
                </Button>
            </div>
        </SafetyReviewCtaPortal>
    );
};
