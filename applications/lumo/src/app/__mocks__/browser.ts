import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

// Export worker instance
export const worker = setupWorker(...handlers);
