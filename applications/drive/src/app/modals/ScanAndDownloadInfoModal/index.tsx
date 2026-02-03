import { useModalTwoStatic } from '@proton/components';

import { ScanAndDownloadInfoModalView } from './ScanAndDownloadInfoModalView';

export const useScanAndDownloadInfoModal = () => {
    return useModalTwoStatic(ScanAndDownloadInfoModalView);
};
