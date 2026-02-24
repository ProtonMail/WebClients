import {useMemo} from 'react';

import {useLumoFlags} from './useLumoFlags';
import {FileProcessingService} from '../services/fileProcessingService';

export function useFileProcessing() {
    const { imageTools: ffImageTools } = useLumoFlags();

    // Get singleton instance (creates it if it doesn't exist)
    // Note: We don't cleanup on unmount because this is a singleton shared across the app
    // The worker will be cleaned up when the page unloads

    return useMemo(
        () => FileProcessingService.getInstance({enableImageTools: ffImageTools}),
        [ffImageTools]
    );
}
