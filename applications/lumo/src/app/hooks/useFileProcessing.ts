import { useMemo } from 'react';

import useFlag from '@proton/unleash/useFlag';

import { FileProcessingService } from '../services/fileProcessingService';

export function useFileProcessing() {
    const ffImageTools = useFlag('LumoImageTools');
    
    // Get singleton instance (creates it if it doesn't exist)
    const fileProcessingService = useMemo(
        () => FileProcessingService.getInstance({ enableImageTools: ffImageTools }),
        [ffImageTools]
    );

    // Note: We don't cleanup on unmount because this is a singleton shared across the app
    // The worker will be cleaned up when the page unloads

    return fileProcessingService;
}
