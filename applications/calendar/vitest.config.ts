import react from '@vitejs/plugin-react';
import path from 'path';
import { configDefaults, mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

// Isolating every file re-imports the whole component tree each time, which dominates the run time.
// Files that mock modules shared with other files (or depend on global state) keep their own isolated context.
const isolatedFiles = [
    'src/app/containers/calendar/MainContainer.spec.tsx',
    'src/app/containers/calendar/CalendarSidebar.spec.tsx',
    'src/app/containers/calendar/CalendarSidebarListItems.spec.tsx',
    'src/app/containers/calendar/getSyncMultipleEventsPayload.spec.ts',
    'src/app/containers/calendar/search/CalendarSearchInput.spec.tsx',
    'src/app/containers/calendar/search/CalendarSearchViewDayEvents.spec.tsx',
];

const baseConfig = {
    plugins: [react()],
    test: {
        environment: 'jsdom',
        environmentOptions: { jsdom: { url: 'http://localhost/' } },
        server: {
            deps: {
                inline: ['@protontech/crypto', '@protontech/interval-tree'],
            },
        },
        setupFiles: './vitest.setup.ts',
    },
    resolve: {
        alias: [{ find: /\.md$/, replacement: path.resolve(__dirname, './src/__mocks__/mdMock.ts') }],
    },
};

export default mergeConfig(sharedVitestConfig, {
    test: {
        projects: [
            {
                ...baseConfig,
                extends: true,
                test: {
                    ...baseConfig.test,
                    name: 'shared',
                    isolate: false,
                    exclude: [...configDefaults.exclude, ...isolatedFiles],
                },
            },
            { ...baseConfig, extends: true, test: { ...baseConfig.test, name: 'isolated', include: isolatedFiles } },
        ],
    },
});
