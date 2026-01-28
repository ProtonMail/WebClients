import { useEffect, useMemo } from 'react';

import useFlag from '@proton/unleash/useFlag';

import { FileProcessingService } from '../services/fileProcessingService';

export function useFileProcessing() {
    const ffImageTools = useFlag('LumoImageTools');
    
    // Create service instance only once per component lifecycle
    const fileProcessingService = useMemo(
        () => new FileProcessingService({ enableImageTools: ffImageTools }),
        [ffImageTools]
    );

    // Cleanup worker when component unmounts
    useEffect(() => {
        return () => {
            fileProcessingService.cleanup();
        };
    }, [fileProcessingService]);

    return fileProcessingService;
}
