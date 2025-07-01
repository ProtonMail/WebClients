import type { FunctionComponent, ReactNode } from 'react';

import { ColorItem, ColorPalette } from '@storybook/addon-docs';

import mdx from './Colors.mdx';

export default {
    title: 'Core Concepts/Colors',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const UghColorPalette = ColorPalette as FunctionComponent<{ children: ReactNode }>;

const BaseColors = () => (
    <>
        <UghColorPalette>
            <ColorItem
                title="Primary"
                subtitle="Protons primary color"
                colors={['var(--primary)', 'var(--primary-contrast)']}
            />
            <ColorItem
                title="Background"
                subtitle="Theme background colors"
                colors={[
                    'var(--background-norm)',
                    'var(--background-weak)',
                    'var(--background-strong)',
                    'var(--background-invert)',
                ]}
            />
            <ColorItem
                title="Text"
                subtitle="Theme text colors"
                colors={[
                    'var(--text-norm)',
                    'var(--text-weak)',
                    'var(--text-hint)',
                    'var(--text-disabled)',
                    'var(--text-invert)',
                ]}
            />
            <ColorItem
                title="Border"
                subtitle="Theme border colors"
                colors={['var(--border-norm)', 'var(--border-weak)']}
            />
            <hr />
            <ColorItem
                title="Signal Danger"
                subtitle=""
                colors={[
                    'var(--signal-danger-minor-2)',
                    'var(--signal-danger-minor-1)',
                    'var(--signal-danger)',
                    'var(--signal-danger-major-1)',
                    'var(--signal-danger-major-2)',
                    'var(--signal-danger-major-3)',
                    'var(--signal-danger-contrast)',
                ]}
            />
            <ColorItem
                title="Signal Warning"
                subtitle=""
                colors={[
                    'var(--signal-warning-minor-2)',
                    'var(--signal-warning-minor-1)',
                    'var(--signal-warning)',
                    'var(--signal-warning-major-1)',
                    'var(--signal-warning-major-2)',
                    'var(--signal-warning-major-3)',
                    'var(--signal-warning-contrast)',
                ]}
            />
            <ColorItem
                title="Signal Success"
                subtitle=""
                colors={[
                    'var(--signal-success-minor-2)',
                    'var(--signal-success-minor-1)',
                    'var(--signal-success)',
                    'var(--signal-success-major-1)',
                    'var(--signal-success-major-2)',
                    'var(--signal-success-major-3)',
                    'var(--signal-success-contrast)',
                ]}
            />
            <ColorItem
                title="Signal Info"
                subtitle=""
                colors={[
                    'var(--signal-info-minor-2)',
                    'var(--signal-info-minor-1)',
                    'var(--signal-info)',
                    'var(--signal-info-major-1)',
                    'var(--signal-info-major-2)',
                    'var(--signal-info-major-3)',
                    'var(--signal-info-contrast)',
                ]}
            />
            <hr />
            <ColorItem
                title="Interaction Default"
                subtitle=""
                colors={[
                    'var(--interaction-default)',
                    'var(--interaction-default-hover)',
                    'var(--interaction-default-active)',
                ]}
            />
            <ColorItem
                title="Interaction Norm"
                subtitle=""
                colors={[
                    'var(--interaction-norm-minor-2)',
                    'var(--interaction-norm-minor-1)',
                    'var(--interaction-norm)',
                    'var(--interaction-norm-major-1)',
                    'var(--interaction-norm-major-2)',
                    'var(--interaction-norm-major-3)',
                    'var(--interaction-norm-contrast)',
                ]}
            />
            <ColorItem
                title="Interaction Weak"
                subtitle=""
                colors={[
                    'var(--interaction-weak-minor-2)',
                    'var(--interaction-weak-minor-1)',
                    'var(--interaction-weak)',
                    'var(--interaction-weak-major-1)',
                    'var(--interaction-weak-major-2)',
                    'var(--interaction-weak-major-3)',
                    'var(--interaction-weak-contrast)',
                ]}
            />
        </UghColorPalette>
    </>
);

export const BaseStandard = () => (
    <>
        <div className="ui-standard border rounded p-4">
            <BaseColors />
        </div>
    </>
);

export const BaseProminent = () => (
    <>
        <div className="ui-prominent rounded p-4">
            <BaseColors />
        </div>
    </>
);
