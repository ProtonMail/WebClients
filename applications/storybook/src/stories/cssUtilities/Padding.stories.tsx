import { useState } from 'react';

import {
    Checkbox,
    Label,
    Option,
    SelectTwo,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Padding.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const paddingSizes = [
    {
        class: '0',
        rem: '0',
        px: '0',
    },
    {
        class: 'px',
        rem: '0.0625rem',
        px: '1',
    },
    {
        class: '0.5',
        rem: '0.125rem',
        px: '2px',
    },
    {
        class: '1',
        rem: '0.25rem',
        px: '4px',
    },
    {
        class: '2',
        rem: '0.5rem',
        px: '8px',
    },
    {
        class: '3',
        rem: '0.75rem',
        px: '12px',
    },
    {
        class: '4',
        rem: '1rem',
        px: '16px',
    },
    {
        class: '5',
        rem: '1.25rem',
        px: '20px',
    },
    {
        class: '6',
        rem: '1.5rem',
        px: '24px',
    },
    {
        class: '8',
        rem: '2rem',
        px: '32px',
    },
    {
        class: '10',
        rem: '2.5rem',
        px: '40px',
    },
    {
        class: '11',
        rem: '2.75rem',
        px: '44px',
    },
    {
        class: '12',
        rem: '3rem',
        px: '48px',
    },
    {
        class: '14',
        rem: '3.5rem',
        px: '56px',
    },
];

export const PaddingsTable = () => {
    return (
        <Table className="color-norm">
            <TableHeader>
                <TableRow>
                    <TableCell type="header">Name</TableCell>
                    <TableCell type="header">REM value</TableCell>
                    <TableCell type="header">PX value</TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paddingSizes.map((item) => (
                    <TableRow key={item.class}>
                        <TableCell>
                            <code>p-{item.class}</code>
                        </TableCell>
                        <TableCell>{item.rem}</TableCell>
                        <TableCell>{item.px}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const demoItemClasses = 'flex items-center justify-center bg-primary user-select';

export const Padding = () => {
    return (
        <div className="border rounded w-full relative flex gap-2 flex-nowrap overflow-auto items-center justify-space-between">
            {paddingSizes.map((size) => (
                <div key={size.class} className="bg-primary shrink-0 rounded-sm overflow-hidden">
                    <div className={`p-${size.class}`} style={{ backgroundColor: 'rgba(0,0,0,.2)' }}>
                        <div className={demoItemClasses} style={{ width: '3rem', height: '2rem' }}>
                            <span className="text-2xs">p-{size.class}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PaddingTop = () => {
    return (
        <div className="border rounded w-full relative flex gap-2 flex-nowrap overflow-auto items-start justify-space-between text-2xs">
            {paddingSizes.map((size) => (
                <div key={size.class} className="bg-primary shrink-0 rounded-sm overflow-hidden">
                    <div className={`pt-${size.class}`} style={{ width: '3rem', backgroundColor: 'rgba(0,0,0,.2)' }}>
                        <div className={demoItemClasses} style={{ height: '2rem' }}>
                            pt-{size.class}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PaddingBottom = () => {
    return (
        <div className="border rounded w-full relative flex gap-2 flex-nowrap overflow-auto items-end justify-space-between text-2xs">
            {paddingSizes.map((size) => (
                <div key={size.class} className="bg-primary shrink-0 rounded-sm overflow-hidden">
                    <div className={`pb-${size.class}`} style={{ width: '3rem', backgroundColor: 'rgba(0,0,0,.2)' }}>
                        <div className={demoItemClasses} style={{ height: '2rem' }}>
                            pb-{size.class}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PaddingY = () => {
    return (
        <div className="border rounded w-full relative flex gap-2 flex-nowrap overflow-auto items-center justify-space-between text-2xs">
            {paddingSizes.map((size) => (
                <div key={size.class} className="bg-primary shrink-0 rounded-sm overflow-hidden">
                    <div className={`py-${size.class}`} style={{ width: '3rem', backgroundColor: 'rgba(0,0,0,.2)' }}>
                        <div className={demoItemClasses} style={{ height: '2rem' }}>
                            py-{size.class}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PaddingLeft = () => {
    return (
        <div className="border rounded w-full relative flex flex-column flex-nowrap items-start gap-2 text-2xs">
            {paddingSizes.map((size) => (
                <div key={size.class} className="bg-primary grow-0 rounded-sm overflow-hidden">
                    <div className={`pl-${size.class}`} style={{ height: '2rem', backgroundColor: 'rgba(0,0,0,.2)' }}>
                        <div className={demoItemClasses} style={{ width: '3rem', height: '2rem' }}>
                            pl-{size.class}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PaddingRight = () => {
    return (
        <div className="border rounded w-full relative flex flex-column flex-nowrap items-end gap-2 text-2xs">
            {paddingSizes.map((size) => (
                <div key={size.class} className="bg-primary grow-0 rounded-sm overflow-hidden">
                    <div className={`pr-${size.class}`} style={{ height: '2rem', backgroundColor: 'rgba(0,0,0,.2)' }}>
                        <div className={demoItemClasses} style={{ width: '3rem', height: '2rem' }}>
                            pr-{size.class}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PaddingX = () => {
    return (
        <div className="border rounded w-full relative flex flex-column flex-nowrap items-center gap-2 text-2xs">
            {paddingSizes.map((size) => (
                <div key={size.class} className="bg-primary grow-0 rounded-sm overflow-hidden">
                    <div className={`px-${size.class}`} style={{ height: '2rem', backgroundColor: 'rgba(0,0,0,.2)' }}>
                        <div className={demoItemClasses} style={{ width: '3rem', height: '2rem' }}>
                            px-{size.class}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const Responsive = () => {
    return (
        <div className="border rounded overflow-hidden w-full relative flex text-2xs">
            <div className="bg-primary rounded-sm">
                <div
                    className={`${demoItemClasses} pl-4 sm:pl-8 md:pl-10 lg:pl-12 xl:pl-14`}
                    style={{ backgroundColor: 'rgba(0,0,0,.2)' }}
                >
                    <div
                        className="flex items-center justify-center bg-primary"
                        style={{ height: '3rem', width: '3rem' }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

Responsive.parameters = {
    docs: {
        iframeHeight: '100px',
        inlineStories: false,
    },
    layout: 'fullscreen',
};

const paddings = [
    {
        id: 'p',
        checked: false,
        value: '0',
    },
    {
        id: 'pt',
        checked: true,
        value: '4',
    },
    {
        id: 'pr',
        checked: true,
        value: '8',
    },
    {
        id: 'pb',
        checked: true,
        value: '4',
    },
    {
        id: 'pl',
        checked: true,
        value: '0-5',
    },
    {
        id: 'px',
        checked: false,
        value: '0',
    },
    {
        id: 'py',
        checked: false,
        value: '0',
    },
];

export const Sandbox = () => {
    const [selectedPadding, setSelectedPadding] = useState(paddings);

    function handleCheckboxChange(id: string, checked: boolean) {
        const updatedPaddings = selectedPadding.map((item) => {
            if (id === item.id) {
                return { ...item, checked: checked };
            }
            return item;
        });
        setSelectedPadding(updatedPaddings);
    }

    function handleSelectChange(id: string, value: string) {
        const updatedPaddings = selectedPadding.map((item) => {
            if (id === item.id) {
                return { ...item, value: value };
            }
            return item;
        });
        setSelectedPadding(updatedPaddings);
    }

    function assembleClasses(items: any[]) {
        const classes: string[] = [];

        items.forEach((item) => {
            if (item.checked) {
                classes.push(`${item.id}-${item.value}`);
            }
        });

        return classes.join(' ');
    }

    return (
        <>
            <div className="flex justify-space-between">
                <div className="w-1/4">
                    {selectedPadding.map(({ id, checked, value }) => (
                        <Label htmlFor={id} key={id} className="flex flex-nowrap items-center gap-4 mb-4">
                            <Checkbox
                                id={id}
                                checked={checked}
                                onChange={({ target }) => {
                                    handleCheckboxChange(id, target.checked);
                                }}
                            />

                            <span className="text-semibold w-1/10">{id}</span>

                            <span className="w-1/10 flex shrink-0 justify-center">
                                <span className="bg-primary rounded-sm shrink-0 grow-0">
                                    <span className={`${id}0-25 block rounded-sm bg-primary`}>
                                        <span
                                            className="flex items-center justify-center bg-norm opacity-65"
                                            style={{ width: '1em', height: '1em' }}
                                        ></span>
                                    </span>
                                </span>
                            </span>

                            <SelectTwo value={value} onValue={(newValue) => handleSelectChange(id, newValue)}>
                                {paddingSizes.map((size) => (
                                    <Option key={size.class} title={size.class} value={size.class} />
                                ))}
                            </SelectTwo>
                        </Label>
                    ))}
                </div>
                <div className="border rounded w-4/6 relative flex justify-center items-center p-14">
                    <div className="bg-primary grow-0 rounded-sm overflow-hidden">
                        <div
                            className={assembleClasses(selectedPadding)}
                            style={{ backgroundColor: 'rgba(0,0,0,.4)', transition: 'all .25s ease' }}
                        >
                            <div className={demoItemClasses} style={{ height: '2rem', width: '2rem' }}></div>
                        </div>
                    </div>
                </div>
            </div>
            <strong>Classes:</strong>{' '}
            <code className="inline-block user-select rounded-sm py-1 px-2 border bg-weak text-norm text-sm empty:hidden">
                {assembleClasses(selectedPadding)}
            </code>
        </>
    );
};
