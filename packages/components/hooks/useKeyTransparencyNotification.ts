import { useKTSelfAuditStatus } from '@proton/account/kt/hooks';
import { ThemeColor } from '@proton/colors/types';

const useKeyTransparencyNotification = (): ThemeColor | undefined => {
    const status = useKTSelfAuditStatus();
    if (status === 'failure') {
        return ThemeColor.Danger;
    }
    if (status === 'warning') {
        return ThemeColor.Warning;
    }
};

export default useKeyTransparencyNotification;
