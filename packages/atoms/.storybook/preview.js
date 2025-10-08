import { ModalsChildren, ModalsProvider, NotificationsProvider } from '@proton/components';
import InlineIcons from '@proton/icons/InlineIcons';

import theme from './theme.js';

import './index.scss';

export const decorators = [
    (Story) => (
        <>
            <InlineIcons />
            <NotificationsProvider>
                <ModalsProvider>
                    <ModalsChildren />
                    <Story />
                </ModalsProvider>
            </NotificationsProvider>
        </>
    ),
];

/** @type { import('@storybook/react').Preview } */
const preview = {
    parameters: {
        actions: { argTypesRegex: '^on[A-Z].*' },
        controls: {
            expanded: true,
        },
        docs: { theme },
        viewMode: 'docs',
    },
};

export default preview;
