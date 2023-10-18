import { useState } from 'react';

import { Button } from '@proton/atoms';
import { ButtonGroup, Checkbox, Label, Option, SelectTwo } from '@proton/components';

import { getTitle } from '../../../helpers/title';
import mdx from './Margin.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const marginSize = [
    '0',
    '0-1',
    '0-15',
    '0-2',
    '0-25',
    '0-3',
    '0-4',
    '0-5',
    '0-6',
    '0-75',
    '0-85',
    '1',
    '1-25',
    '1-5',
    '1-75',
    '2',
    '4',
];

const demoItemClasses =
    'user-select flex flex-align-items-center flex-justify-center bg-primary rounded-sm text-center';

// Storybooks <code> styling is not available inside stories, so we have to use a custom component
type CodeProps = {
    children: React.ReactNode;
};

const Code = ({ children }: CodeProps) => (
    <code className="inline-block user-select rounded-sm py-1 px-1 border bg-weak text-norm text-sm hidden-empty">
        {children}
    </code>
);

export const Margin = () => {
    return (
        <div
            className="border rounded w-full relative flex flex-nowrap gap-2 scroll-if-needed flex-align-items-center flex-justify-space-between"
            style={{ height: '9rem' }}
        >
            {marginSize.map((size) => (
                <div
                    key={size}
                    className="bg-strong flex-item-noshrink rounded"
                    style={{ display: 'flow-root', '--border-radius-md': '10%' }}
                >
                    <div className={`${demoItemClasses} m${size}`} style={{ width: '3rem', height: '3rem' }}>
                        <span className="text-2xs">m{size}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const MarginTop = () => {
    return (
        <div
            className="border rounded w-full relative flex flex-nowrap scroll-if-needed flex-align-items-start flex-justify-space-between text-2xs"
            style={{ height: '8rem' }}
        >
            {marginSize.map((size) => (
                <div key={size} className="bg-strong flex-item-noshrink" style={{ display: 'flow-root' }}>
                    <div className={`${demoItemClasses} mt${size}`} style={{ width: '3rem', height: '3rem' }}>
                        mt{size}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const MarginBottom = () => {
    return (
        <div
            className="border rounded overflow-hidden w-full relative flex flex-nowrap scroll-if-needed flex-align-items-end flex-justify-space-between text-2xs"
            style={{ height: '8rem' }}
        >
            {marginSize.map((size) => (
                <div key={size} className="bg-strong flex-item-noshrink" style={{ display: 'flow-root' }}>
                    <div className={`${demoItemClasses} mb${size}`} style={{ width: '3rem', height: '3rem' }}>
                        mb{size}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const MarginY = () => {
    return (
        <div className="border rounded overflow-hidden w-full relative flex flex-nowrap scroll-if-needed flex-align-items-center flex-justify-space-between text-2xs">
            {marginSize.map((size) => (
                <div key={size} className="bg-strong rounded-sm flex-item-noshrink" style={{ display: 'flow-root' }}>
                    <div className={`${demoItemClasses} my${size}`} style={{ width: '3rem', height: '3rem' }}>
                        my{size}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const MarginLeft = () => {
    return (
        <div className="border rounded overflow-hidden w-full relative flex flex-column flex-nowrap flex-align-items-start gap-2 text-2xs">
            {marginSize.map((size) => (
                <div key={size} className="bg-strong flex-item-noshrink" style={{ display: 'flow-root' }}>
                    <div className={`${demoItemClasses} ml${size}`} style={{ width: '5rem', height: '1.5rem' }}>
                        ml{size}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const MarginRight = () => {
    return (
        <div className="border rounded overflow-hidden w-full relative flex flex-column flex-nowrap flex-align-items-end gap-2 text-2xs">
            {marginSize.map((size) => (
                <div key={size} className="bg-strong flex-item-noshrink" style={{ display: 'flow-root' }}>
                    <div className={`${demoItemClasses} mr${size}`} style={{ width: '5rem', height: '1.5rem' }}>
                        mr{size}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const MarginX = () => {
    return (
        <div className="border rounded overflow-hidden w-full relative flex flex-column flex-nowrap flex-align-items-center gap-2 text-2xs">
            {marginSize.map((size) => (
                <div key={size} className="bg-strong rounded-sm flex-item-noshrink" style={{ display: 'flow-root' }}>
                    <div className={`${demoItemClasses} mx${size}`} style={{ width: '5rem', height: '1.5rem' }}>
                        mx{size}
                    </div>
                </div>
            ))}
        </div>
    );
};

const margins = [
    {
        id: 'm',
        checked: false,
        value: '0',
    },
    {
        id: 'mt',
        checked: true,
        value: '2',
    },
    {
        id: 'mr',
        checked: false,
        value: '0',
    },
    {
        id: 'mb',
        checked: false,
        value: '0',
    },
    {
        id: 'ml',
        checked: true,
        value: '4',
    },
    {
        id: 'mx',
        checked: false,
        value: '0',
    },
    {
        id: 'my',
        checked: false,
        value: '0',
    },
];

const marginsRightAligned = [
    {
        id: 'm',
        checked: false,
        value: '0',
    },
    {
        id: 'mt',
        checked: false,
        value: '0',
    },
    {
        id: 'mr',
        checked: false,
        value: '0',
    },
    {
        id: 'mb',
        checked: false,
        value: '0',
    },
    {
        id: 'ml',
        checked: true,
        value: 'auto',
    },
    {
        id: 'mx',
        checked: false,
        value: '0',
    },
    {
        id: 'my',
        checked: false,
        value: '0',
    },
];

const marginsCenterHorizontally = [
    {
        id: 'm',
        checked: false,
        value: '0',
    },
    {
        id: 'mt',
        checked: false,
        value: '0',
    },
    {
        id: 'mr',
        checked: false,
        value: '0',
    },
    {
        id: 'mb',
        checked: false,
        value: '0',
    },
    {
        id: 'ml',
        checked: false,
        value: '0',
    },
    {
        id: 'mx',
        checked: true,
        value: 'auto',
    },
    {
        id: 'my',
        checked: false,
        value: '0',
    },
];

const marginsCentered = [
    {
        id: 'm',
        checked: true,
        value: 'auto',
    },
    {
        id: 'mt',
        checked: false,
        value: '0',
    },
    {
        id: 'mr',
        checked: false,
        value: '0',
    },
    {
        id: 'mb',
        checked: false,
        value: '0',
    },
    {
        id: 'ml',
        checked: false,
        value: '0',
    },
    {
        id: 'mx',
        checked: false,
        value: '0',
    },
    {
        id: 'my',
        checked: false,
        value: '0',
    },
];

export const Sandbox = () => {
    const [selectedMargin, setSelectedMargin] = useState(margins);

    function handleCheckboxChange(id: string, checked: boolean) {
        const updatedPaddings = selectedMargin.map((item) => {
            if (id === item.id) {
                return { ...item, checked: checked };
            }
            return item;
        });
        setSelectedMargin(updatedPaddings);
    }

    function handleSelectChange(id: string, value: string) {
        const updatedPaddings = selectedMargin.map((item) => {
            if (id === item.id) {
                return { ...item, value: value };
            }
            return item;
        });
        setSelectedMargin(updatedPaddings);
    }

    function assembleClasses(items: any[]) {
        const classes: string[] = [];

        items.forEach((item) => {
            if (item.checked) {
                if (item.id === 'mx' && item.value === 'mx-auto') {
                    classes.push('mx-auto');
                } else {
                    classes.push(`${item.id}${item.value}`);
                }
            }
        });

        return classes.join(' ');
    }

    const sizeOptions = (id: string) => {
        const newSizes = Array.from(marginSize);

        switch (id) {
            case 'mx':
                newSizes.unshift('auto');
                break;
            case 'my':
                newSizes.unshift('auto');
                break;
            case 'mt':
                newSizes.unshift('auto');
                break;
            case 'mb':
                newSizes.unshift('auto');
                break;
            case 'ml':
                newSizes.unshift('auto');
                break;
            case 'mr':
                newSizes.unshift('auto');
                break;
            case 'm':
                newSizes.unshift('auto');
                break;
        }

        return newSizes;
    };

    const containerClasses = (classes: string | string[]) => {
        if (
            classes.includes('m-auto') ||
            classes.includes('my-auto') ||
            classes.includes('mt-auto') ||
            classes.includes('mb-auto')
        ) {
            return 'h-full';
        } else if (classes.includes('auto')) {
            return '';
        } else {
            return 'absolute';
        }
    };
    // display: assembleClasses(selectedMargin).includes('m-auto') ? 'flex' : 'flow-root'
    const containerDisplay = (classes: string | string[]) => {
        if (classes.includes('m-auto') || classes.includes('mx-auto my-auto')) {
            return 'flex';
        } else if (classes.includes('my-auto') || classes.includes('mt-auto') || classes.includes('mb-auto')) {
            return 'inline-flex';
        } else {
            return 'flow-root';
        }
    };

    return (
        <>
            <div className="flex flex-justify-space-between mb-8">
                <div className="w-1/4">
                    {selectedMargin.map(({ id, checked, value }) => (
                        <Label htmlFor={id} key={id} className="flex flex-nowrap flex-align-items-center gap-4 mb-4">
                            <Checkbox
                                id={id}
                                checked={checked}
                                onChange={({ target }) => {
                                    handleCheckboxChange(id, target.checked);
                                }}
                            />

                            <span className="text-semibold w-1/10">{id}</span>

                            <span className="w-1/10 flex flex-item-noshrink flex-justify-center">
                                <span className="bg-primary rounded-sm flex-item-noshrink flex-item-nogrow">
                                    <span className={`${id}0-25 block rounded-sm bg-primary`}>
                                        <span
                                            className="flex flex-align-items-center flex-justify-center bg-norm opacity-65"
                                            style={{ width: '1em', height: '1em' }}
                                        ></span>
                                    </span>
                                </span>
                            </span>

                            <SelectTwo value={value} onValue={(newValue) => handleSelectChange(id, newValue)}>
                                {sizeOptions(id).map((size) => (
                                    <Option key={size} title={size} value={size} />
                                ))}
                            </SelectTwo>
                        </Label>
                    ))}
                </div>
                <div className="border rounded w-4/6 relative">
                    {containerClasses}
                    <div
                        className={`${containerClasses(assembleClasses(selectedMargin))} bg-strong rounded-sm`}
                        style={{ display: containerDisplay(assembleClasses(selectedMargin)) }}
                    >
                        <div
                            className={`${assembleClasses(selectedMargin)} ${demoItemClasses} bg-primary`}
                            style={{ height: '2rem', width: '2rem', transition: 'all .25s ease' }}
                        ></div>
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

            <div className="block mt-8">
                <strong>Classes:</strong> <Code>{assembleClasses(selectedMargin)}</Code>
            </div>
        </>
    );
};
