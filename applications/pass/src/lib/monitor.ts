import { createPassCoreService } from '@proton/pass/lib/core/service';
import { logger } from '@proton/pass/utils/logger';

const coreService = createPassCoreService();

export const monitor = {
    analyzePassword: (password: string) => {
        try {
            return coreService.bindings!.analyze_password(password);
        } catch (err) {
            logger.error('[Monitor] Unable to analyze password', err);
            return null;
        }
    },
};
