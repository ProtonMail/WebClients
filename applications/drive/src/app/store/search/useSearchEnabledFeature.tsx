import { FeatureCode, useFeature, useUser } from '@proton/components';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isPaid } from '@proton/shared/lib/user/helpers';

export default function useSearchEnabledFeature() {
    const [user] = useUser();
    const { feature } = useFeature(FeatureCode.DriveSearchEnabled);

    const showEncryptedSearch = !isMobile() && !!feature?.Value && !!isPaid(user);
    return showEncryptedSearch;
}
