import type { Preview } from '@storybook/react-webpack5';

import '../stories/catalog.scss';

const preview: Preview = {
    parameters: {
        options: {
            storySort: {
                order: [
                    'Foundations',
                    ['Tokens', 'Utility classes'],
                    'Components',
                    [
                        'Introduction',
                        'Lumo components',
                        ['Buttons', 'Fields', 'Selection', 'Navigation', 'Surfaces', 'Overlays'],
                        'Other Proton components',
                        ['Loading', 'Layout', 'Information'],
                    ],
                ],
            },
        },
    },
};

export default preview;
