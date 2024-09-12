import { ModalsChildren, ModalsProvider, NotificationsProvider } from '@proton/components';
import Icons from '@proton/icons/Icons';

import './prismjs.js';
import theme from './theme';

import './index.scss';

export const decorators = [
    (Story) => (
        <>
            <Icons />
            <NotificationsProvider>
                <ModalsProvider>
                    <ModalsChildren />
                    <Story />
                </ModalsProvider>
            </NotificationsProvider>
        </>
    ),
];

const order = [
    'introduction-',
    'changelog-',
    'components-',
    'css-',
    'theming-explanations-',
    'theming-usage-',
    'theming-taxonomy-',
    'proton-ui-',
];

const priority = ['introduction-', 'changelog-', 'theming-'];

export const parameters = {
    viewMode: 'docs',
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { expanded: true },
    docs: { theme: theme },
    options: {
        storySort: (a, b) => {
            const aName = a[0];
            const bName = b[0];

            if (priority.some((name) => aName.includes(name) || bName.includes(name))) {
                const aIdx = order.findIndex((i) => aName.indexOf(i) > -1);
                const bIdx = order.findIndex((i) => bName.indexOf(i) > -1);
                return aIdx - bIdx;
            }

            return a[1].kind === b[1].kind ? 0 : a[1].id.localeCompare(b[1].id, undefined, { numeric: true });
        },
    },
};
