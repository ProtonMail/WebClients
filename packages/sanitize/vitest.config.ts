import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    test: {
        // DOMPurify is sensitive to the DOM implementation; keep the jsdom environment used under Jest.
        environment: 'jsdom',
    },
});
