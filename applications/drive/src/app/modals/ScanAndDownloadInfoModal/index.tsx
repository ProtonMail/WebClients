import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';

import { ScanAndDownloadInfoModalView } from './ScanAndDownloadInfoModalView';

export const useScanAndDownloadInfoModal = () => {
    return useModalTwoStatic(ScanAndDownloadInfoModalView);
};
