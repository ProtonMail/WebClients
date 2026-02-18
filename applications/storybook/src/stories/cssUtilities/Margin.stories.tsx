import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonGroup } from '@proton/components/components/button/ButtonGroup';
import Checkbox from '@proton/components/components/input/Checkbox';
import Label from '@proton/components/components/label/Label';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';

const meta: Meta = {
    title: 'CSS Utilities/Margin',
    parameters: {
        docs: {
            description: {
                component:
                    'Margin utility classes. Supports all directions (m, mt, mr, mb, ml, mx, my), auto values, and responsive variants.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

const marginSizes = [
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
    { class: 'auto', rem: '', px: '' },
];

const demoItemClasses = 'user-select flex items-center justify-center bg-primary rounded-sm text-center';

type CodeProps = { children: React.ReactNode };
const Code = ({ children }: CodeProps) => (
    <code className="inline-block user-select rounded-sm p-1 px-2 border bg-weak text-norm text-sm empty:hidden">
        {children}
    </code>
);

export const MarginsTable: Story = {
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
                {marginSizes.map((item) => (
                    <TableRow key={item.class}>
                        <TableCell>
                            <code>m-{item.class}</code>
                        </TableCell>
                        <TableCell>{item.rem}</TableCell>
                        <TableCell>{item.px}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    ),
};

export const Margin: Story = {
    render: () => (
        <div
            className="border rounded w-full relative flex flex-nowrap gap-2 overflow-auto items-center justify-space-between"
            style={{ height: '10rem' }}
        >
            {marginSizes.map((size) => (
                <div
                    key={size.class}
                    className="bg-strong shrink-0 rounded"
                    style={{ display: 'flow-root', '--border-radius-md': '10%' } as React.CSSProperties}
                >
                    <div className={`${demoItemClasses} m-${size.class}`} style={{ width: '3rem', height: '3rem' }}>
                        <span className="text-2xs">m-{size.class}</span>
                    </div>
                </div>
            ))}
        </div>
    ),
};

export const MarginTop: Story = {
    render: () => (
        <div
            className="border rounded w-full relative flex flex-nowrap overflow-auto items-start justify-space-between text-2xs"
            style={{ height: '8rem' }}
        >
            {marginSizes.map((size) => (
                <div key={size.class} className="bg-strong shrink-0" style={{ display: 'flow-root' }}>
                    <div className={`${demoItemClasses} mt-${size.class}`} style={{ width: '3rem', height: '3rem' }}>
                        mt-{size.class}
                    </div>
                </div>
            ))}
        </div>
    ),
};

export const MarginBottom: Story = {
    render: () => (
        <div
            className="border rounded overflow-hidden w-full relative flex flex-nowrap overflow-auto items-end justify-space-between text-2xs"
            style={{ height: '8rem' }}
        >
            {marginSizes.map((size) => (
                <div key={size.class} className="bg-strong shrink-0" style={{ display: 'flow-root' }}>
                    <div className={`${demoItemClasses} mb-${size.class}`} style={{ width: '3rem', height: '3rem' }}>
                        mb-{size.class}
                    </div>
                </div>
            ))}
        </div>
    ),
};

export const MarginY: Story = {
    render: () => (
        <div className="border rounded overflow-hidden w-full relative flex flex-nowrap overflow-auto items-center justify-space-between text-2xs">
            {marginSizes.map((size) => (
                <div key={size.class} className="bg-strong rounded-sm shrink-0" style={{ display: 'flow-root' }}>
                    <div className={`${demoItemClasses} my-${size.class}`} style={{ width: '3rem', height: '3rem' }}>
                        my-{size.class}
                    </div>
                </div>
            ))}
        </div>
    ),
};

export const MarginLeft: Story = {
    render: () => (
        <div className="border rounded overflow-hidden w-full relative flex flex-column flex-nowrap items-start gap-2 text-2xs">
            {marginSizes.map((size) => (
                <div key={size.class} className="bg-strong shrink-0" style={{ display: 'flow-root' }}>
                    <div className={`${demoItemClasses} ml-${size.class}`} style={{ width: '5rem', height: '1.5rem' }}>
                        ml-{size.class}
                    </div>
                </div>
            ))}
        </div>
    ),
};

export const MarginRight: Story = {
    render: () => (
        <div className="border rounded overflow-hidden w-full relative flex flex-column flex-nowrap items-end gap-2 text-2xs">
            {marginSizes.map((size) => (
                <div key={size.class} className="bg-strong shrink-0" style={{ display: 'flow-root' }}>
                    <div className={`${demoItemClasses} mr-${size.class}`} style={{ width: '5rem', height: '1.5rem' }}>
                        mr-{size.class}
                    </div>
                </div>
            ))}
        </div>
    ),
};

export const MarginX: Story = {
    render: () => (
        <div className="border rounded overflow-hidden w-full relative flex flex-column flex-nowrap items-center gap-2 text-2xs">
            {marginSizes.map((size) => (
                <div key={size.class} className="bg-strong rounded-sm shrink-0" style={{ display: 'flow-root' }}>
                    <div className={`${demoItemClasses} mx-${size.class}`} style={{ width: '5rem', height: '1.5rem' }}>
                        mx-{size.class}
                    </div>
                </div>
            ))}
        </div>
    ),
};

export const Responsive: Story = {
    render: () => (
        <div className="border rounded overflow-hidden w-full relative flex text-2xs">
            <div className="bg-strong rounded-sm" style={{ display: 'flow-root' }}>
                <div
                    className={`${demoItemClasses} ml-4 sm:ml-8 md:ml-10 lg:ml-12 xl:ml-14`}
                    style={{ width: '3rem', height: '3rem' }}
                />
            </div>
        </div>
    ),
    parameters: {
        docs: { iframeHeight: '100px', inlineStories: false },
        layout: 'fullscreen',
    },
};

const defaultMargins = [
    { id: 'm', checked: false, value: '0' },
    { id: 'mt', checked: true, value: '2' },
    { id: 'mr', checked: false, value: '0' },
    { id: 'mb', checked: false, value: '0' },
    { id: 'ml', checked: true, value: '8' },
    { id: 'mx', checked: false, value: '0' },
    { id: 'my', checked: false, value: '0' },
];

const marginsRightAligned = [
    { id: 'm', checked: false, value: '0' },
    { id: 'mt', checked: false, value: '0' },
    { id: 'mr', checked: false, value: '0' },
    { id: 'mb', checked: false, value: '0' },
    { id: 'ml', checked: true, value: 'auto' },
    { id: 'mx', checked: false, value: '0' },
    { id: 'my', checked: false, value: '0' },
];

const marginsCenterHorizontally = [
    { id: 'm', checked: false, value: '0' },
    { id: 'mt', checked: false, value: '0' },
    { id: 'mr', checked: false, value: '0' },
    { id: 'mb', checked: false, value: '0' },
    { id: 'ml', checked: false, value: '0' },
    { id: 'mx', checked: true, value: 'auto' },
    { id: 'my', checked: false, value: '0' },
];

const marginsCentered = [
    { id: 'm', checked: true, value: 'auto' },
    { id: 'mt', checked: false, value: '0' },
    { id: 'mr', checked: false, value: '0' },
    { id: 'mb', checked: false, value: '0' },
    { id: 'ml', checked: false, value: '0' },
    { id: 'mx', checked: false, value: '0' },
    { id: 'my', checked: false, value: '0' },
];

function assembleClasses(items: { id: string; checked: boolean; value: string }[]) {
    return items
        .filter((item) => item.checked)
        .map((item) => (item.id === 'mx' && item.value === 'mx-auto' ? 'mx-auto' : `${item.id}-${item.value}`))
        .join(' ');
}

function containerClasses(classes: string) {
    if (['m-auto', 'my-auto', 'mt-auto', 'mb-auto'].some((c) => classes.includes(c))) {
        return 'h-full';
    }
    if (classes.includes('auto')) {
        return '';
    }
    return 'absolute';
}

function containerDisplay(classes: string) {
    if (classes.includes('m-auto') || classes.includes('mx-auto my-auto')) {
        return 'flex';
    }
    if (['my-auto', 'mt-auto', 'mb-auto'].some((c) => classes.includes(c))) {
        return 'inline-flex';
    }
    return 'flow-root';
}

export const Sandbox: Story = {
    render: () => {
        const [selectedMargin, setSelectedMargin] = useState(defaultMargins);

        function handleCheckboxChange(id: string, checked: boolean) {
            setSelectedMargin(selectedMargin.map((item) => (id === item.id ? { ...item, checked } : item)));
        }

        function handleSelectChange(id: string, value: string) {
            setSelectedMargin(selectedMargin.map((item) => (id === item.id ? { ...item, value } : item)));
        }

        const assembled = assembleClasses(selectedMargin);

        return (
            <>
                <div className="flex justify-space-between mb-7">
                    <div className="w-1/4">
                        {selectedMargin.map(({ id, checked, value }) => (
                            <Label htmlFor={id} key={id} className="flex flex-nowrap items-center gap-4 mb-4">
                                <Checkbox
                                    id={id}
                                    checked={checked}
                                    onChange={({ target }) => handleCheckboxChange(id, target.checked)}
                                />
                                <span className="text-semibold w-1/10">{id}</span>
                                <span className="w-1/10 flex shrink-0 justify-center">
                                    <span className="bg-primary rounded-sm shrink-0 grow-0">
                                        <span className={`${id}0-25 block rounded-sm bg-primary`}>
                                            <span
                                                className="flex items-center justify-center bg-norm opacity-65"
                                                style={{ width: '1em', height: '1em' }}
                                            />
                                        </span>
                                    </span>
                                </span>
                                <SelectTwo value={value} onValue={(newValue) => handleSelectChange(id, newValue)}>
                                    {marginSizes.map((size) => (
                                        <Option key={size.class} title={size.class} value={size.class} />
                                    ))}
                                </SelectTwo>
                            </Label>
                        ))}
                    </div>
                    <div className="border rounded w-4/6 relative">
                        <div
                            className={`${containerClasses(assembled)} bg-strong rounded-sm`}
                            style={{ display: containerDisplay(assembled) }}
                        >
                            <div
                                className={`${assembled} ${demoItemClasses} bg-primary`}
                                style={{ height: '2rem', width: '2rem', transition: 'all .25s ease' }}
                            />
                        </div>
                    </div>
                </div>
                <strong>Try these presets: </strong>
                <ButtonGroup color="weak" shape="outline" size="small">
                    <Button onClick={() => setSelectedMargin(marginsRightAligned)}>align element to the right</Button>
                    <Button onClick={() => setSelectedMargin(marginsCenterHorizontally)}>
                        center element horizontally
                    </Button>
                    <Button onClick={() => setSelectedMargin(marginsCentered)}>center element in flex container</Button>
                </ButtonGroup>
                <div className="block mt-7">
                    <strong>Classes:</strong> <Code>{assembled}</Code>
                </div>
            </>
        );
    },
};
