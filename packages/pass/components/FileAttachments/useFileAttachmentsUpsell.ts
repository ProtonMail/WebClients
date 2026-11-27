import { useSelector } from 'react-redux';

import { UpsellRef } from '../../constants';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { selectIsPassB2BPlan, selectUserStorageAllowed } from '../../store/selectors/user';
import { PassFeature } from '../../types/api/features';
import { useUpselling } from '../Upsell/UpsellingProvider';

export type FileAttachmentsUpsell = {
    /** Hide the file-attachments field entirely (B2B user without storage while the upsell
     * flag is off). Will be removed when the FF is 100% enabled. */
    hidden: boolean;

    /** B2B users upgrade through an inline link / their admin rather than the B2C modal,
     * so the dropzone is disabled and the promotion badge hidden for them. */
    isPassB2BPlan: boolean;

    /** Open the B2C upsell modal */
    promptUpsell: () => void;
};

export const useFileAttachmentsUpsell = (): FileAttachmentsUpsell => {
    const essentialsUpsellEnabled = useFeatureFlag(PassFeature.PassFileAttachmentsEssentialsUpsell);
    const isPassB2BPlan = useSelector(selectIsPassB2BPlan);
    const storageAllowed = useSelector(selectUserStorageAllowed);
    const upsell = useUpselling();

    return {
        hidden: isPassB2BPlan && !storageAllowed && !essentialsUpsellEnabled,
        isPassB2BPlan,
        promptUpsell: () => upsell({ type: 'pass-plus', upsellRef: UpsellRef.FILE_ATTACHMENTS }),
    };
};
