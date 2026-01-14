import useFlag from '@proton/unleash/useFlag';

import { FileProcessingService } from '../services/fileProcessingService';

export function useFileProcessing() {
    const ffImageTools = useFlag('LumoImageTools');
    const fileProcessingService = new FileProcessingService({ enableImageTools: ffImageTools });
    return fileProcessingService;
}
