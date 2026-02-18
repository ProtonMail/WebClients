import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';

const meta: Meta = {
    title: 'CSS Utilities/Gap',
    parameters: {
        docs: {
            description: {
                component:
                    'Gap utility classes for flex and grid layouts. Supports gap, gap-x, gap-y, and responsive variants with breakpoint prefixes.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

const sizes = [
    { class: '0', rem: '0', px: '0' },
    { class: 'px', rem: '0.0625rem', px: '1' },
    { class: '0.5', rem: '0.125rem', px: '2px' },
    { class: '1', rem: '0.25rem', px: '4px' },
    { class: '2', rem: '0.5rem', px: '8px' },
    { class: '3', rem: '0.75rem', px: '12px' },
    { class: '4', rem: '1rem', px: '16px' },
    { class: '5', rem: '1.25rem', px: '20px' },
    { class: '6', rem: '1.5rem', px: '24px' },
    { class: '8', rem: '2rem', px: '32px' },
    { class: '10', rem: '2.5rem', px: '40px' },
    { class: '11', rem: '2.75rem', px: '44px' },
    { class: '12', rem: '3rem', px: '48px' },
    { class: '14', rem: '3.5rem', px: '56px' },
];

const demoItemClasses = 'flex items-center justify-center bg-primary user-select';

const DemoItems = () => (
    <>
        {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className={demoItemClasses} style={{ width: '2rem', height: '2rem' }} />
        ))}
    </>
);

export const GapTable: Story = {
    render: () => (
        <Table className="color-norm">
            <TableHeader>
                <TableRow>
                    <TableCell type="header">Name</TableCell>
                    <TableCell type="header">REM value</TableCell>
                    <TableCell type="header">PX value</TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sizes.map((item) => (
                    <TableRow key={item.class}>
                        <TableCell>
                            <code>gap-{item.class}</code>
                        </TableCell>
                        <TableCell>{item.rem}</TableCell>
                        <TableCell>{item.px}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    ),
};

export const Gap: Story = {
    render: () => (
        <div className="w-full relative flex gap-4">
            {sizes.map((size) => (
                <div key={size.class} className="border rounded w-1/3 flex flex-column items-center gap-2 p-2">
                    <span className="text-2xs">gap-{size.class}</span>
                    <div
                        className={`gap-${size.class}`}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(3, 1fr)',
                        }}
                    >
                        <DemoItems />
                    </div>
                </div>
            ))}
        </div>
    ),
};

export const GapY: Story = {
    render: () => (
        <div className="w-full relative flex gap-4">
            {sizes.map((size) => (
                <div key={size.class} className="border rounded w-1/3 flex flex-column items-center gap-2 p-2">
                    <span className="text-2xs">gap-y-{size.class}</span>
                    <div
                        className={`gap-y-${size.class}`}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(3, 1fr)',
                        }}
                    >
                        <DemoItems />
                    </div>
                </div>
            ))}
        </div>
    ),
};

export const GapX: Story = {
    render: () => (
        <div className="w-full relative flex gap-4">
            {sizes.map((size) => (
                <div key={size.class} className="border rounded w-1/3 flex flex-column items-center gap-2 p-2">
                    <span className="text-2xs">gap-x-{size.class}</span>
                    <div
                        className={`gap-x-${size.class}`}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(3, 1fr)',
                        }}
                    >
                        <DemoItems />
                    </div>
                </div>
            ))}
        </div>
    ),
};

export const Responsive: Story = {
    render: () => (
        <div className="w-full relative flex gap-4">
            <div
                className="gap-2 sm:gap-4 md:gap-8 lg:gap-10 xl:gap-14"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' }}
            >
                <DemoItems />
            </div>
        </div>
    ),
    parameters: {
        docs: {
            iframeHeight: '200px',
            inlineStories: false,
        },
        layout: 'fullscreen',
    },
};
