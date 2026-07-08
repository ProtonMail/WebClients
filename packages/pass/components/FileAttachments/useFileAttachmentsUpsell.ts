import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { UpsellRef } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useMatchUser } from '@proton/pass/hooks/useMatchUser';
import { PassFeature } from '@proton/pass/types/api/features';
import { PLANS } from '@proton/payments/core/constants';

export type FileAttachmentsUpsell = {
    /** Hide the file-attachments field entirely (Essentials user while the upsell flag is
     * off. Will be removed when the FF is 100% enabled. */
    hidden: boolean;

    /** Essentials users upgrade through an inline link / their admin rather than the B2C
     * modal, so the dropzone is disabled and the promotion badge hidden for them. */
    isPassEssentials: boolean;

    /** Open the B2C upsell modal */
    promptUpsell: () => void;
};

export const useFileAttachmentsUpsell = (): FileAttachmentsUpsell => {
    const essentialsUpsellEnabled = useFeatureFlag(PassFeature.PassFileAttachmentsEssentialsUpsell);
    const isPassEssentials = useMatchUser({ planInternalName: [PLANS.PASS_PRO] });
    const upsell = useUpselling();

    return {
        hidden: isPassEssentials && !essentialsUpsellEnabled,
        isPassEssentials,
        promptUpsell: () => upsell({ type: 'pass-plus', upsellRef: UpsellRef.FILE_ATTACHMENTS }),
    };
};
