import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import { PassFeature } from '@proton/pass/types/api/features';

/** Returning a `ref` here in case the feature-flag changes
 * mid-way during a file process where we should preserve the
 * `encryptionVersion` accross the whole process */
export const useFileEncryptionVersion = () => {
    const v2 = useFeatureFlag(PassFeature.PassFileAttachmentEncryptionV2);
    const ref = useStatefulRef(v2 ? 2 : 1);

    return ref;
};
