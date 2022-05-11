import { useState } from 'react';

import { Checkbox, Label, Option, SelectTwo } from '@proton/components';

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

const paddingSize = ['0', '0-15', '0-25', '0-3', '0-5', '0-75', '1', '1-25', '1-5', '1-75', '2', '2-25', '3', '4'];

const demoItemClasses = 'flex flex-align-items-center flex-justify-center bg-primary user-select';

export const Padding = () => {
    return (
        <div className="border rounded w100 relative flex flex-gap-0-5 flex-nowrap scroll-if-needed flex-align-items-center flex-justify-space-between text-2xs">
            {paddingSize.map((size) => (
                <div key={size} className="bg-primary flex-item-noshrink rounded-sm overflow-hidden">
                    <div className={`p${size}`} style={{ backgroundColor: 'rgba(0,0,0,.2)' }}>
                        <div className={demoItemClasses} style={{ width: '3rem', height: '2rem' }}>
                            p{size}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PaddingTop = () => {
    return (
        <div className="border rounded w100 relative flex flex-gap-0-5 flex-nowrap scroll-if-needed flex-align-items-start flex-justify-space-between text-2xs">
            {paddingSize.map((size) => (
                <div key={size} className="bg-primary flex-item-noshrink rounded-sm overflow-hidden">
                    <div className={`pt${size}`} style={{ width: '3rem', backgroundColor: 'rgba(0,0,0,.2)' }}>
                        <div className={demoItemClasses} style={{ height: '2rem' }}>
                            pt{size}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PaddingBottom = () => {
    return (
        <div className="border rounded w100 relative flex flex-gap-0-5 flex-nowrap scroll-if-needed flex-align-items-end flex-justify-space-between text-2xs">
            {paddingSize.map((size) => (
                <div key={size} className="bg-primary flex-item-noshrink rounded-sm overflow-hidden">
                    <div className={`pb${size}`} style={{ width: '3rem', backgroundColor: 'rgba(0,0,0,.2)' }}>
                        <div className={demoItemClasses} style={{ height: '2rem' }}>
                            pb{size}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PaddingY = () => {
    return (
        <div className="border rounded w100 relative flex flex-gap-0-5 flex-nowrap scroll-if-needed flex-align-items-center flex-justify-space-between text-2xs">
            {paddingSize.map((size) => (
                <div key={size} className="bg-primary flex-item-noshrink rounded-sm overflow-hidden">
                    <div className={`py${size}`} style={{ width: '3rem', backgroundColor: 'rgba(0,0,0,.2)' }}>
                        <div className={demoItemClasses} style={{ height: '2rem' }}>
                            py{size}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PaddingLeft = () => {
    return (
        <div className="border rounded w100 relative flex flex-column flex-nowrap flex-align-items-start flex-gap-0-5 text-2xs">
            {paddingSize.map((size) => (
                <div key={size} className="bg-primary flex-item-nogrow rounded-sm overflow-hidden">
                    <div className={`pl${size}`} style={{ height: '2rem', backgroundColor: 'rgba(0,0,0,.2)' }}>
                        <div className={demoItemClasses} style={{ width: '3rem', height: '2rem' }}>
                            pl{size}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PaddingRight = () => {
    return (
        <div className="border rounded w100 relative flex flex-column flex-nowrap flex-align-items-end flex-gap-0-5 text-2xs">
            {paddingSize.map((size) => (
                <div key={size} className="bg-primary flex-item-nogrow rounded-sm overflow-hidden">
                    <div className={`pr${size}`} style={{ height: '2rem', backgroundColor: 'rgba(0,0,0,.2)' }}>
                        <div className={demoItemClasses} style={{ width: '3rem', height: '2rem' }}>
                            pr{size}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PaddingX = () => {
    return (
        <div className="border rounded w100 relative flex flex-column flex-nowrap flex-align-items-center flex-gap-0-5 text-2xs">
            {paddingSize.map((size) => (
                <div key={size} className="bg-primary flex-item-nogrow rounded-sm overflow-hidden">
                    <div className={`px${size}`} style={{ height: '2rem', backgroundColor: 'rgba(0,0,0,.2)' }}>
                        <div className={demoItemClasses} style={{ width: '3rem', height: '2rem' }}>
                            px{size}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
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
        value: '0-5',
    },
    {
        id: 'pr',
        checked: true,
        value: '2',
    },
    {
        id: 'pb',
        checked: true,
        value: '1-5',
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
                classes.push(`${item.id}${item.value}`);
            }
        });

        return classes.join(' ');
    }

    return (
        <>
            <div className="flex flex-justify-space-between">
                <div className="w25">
                    {selectedPadding.map(({ id, checked, value }) => (
                        <Label
                            htmlFor={id}
                            key={id}
                            className="flex flex-nowrap flex-align-items-center flex-gap-1 mb1"
                        >
                            <Checkbox
                                id={id}
                                checked={checked}
                                onChange={({ target }) => {
                                    handleCheckboxChange(id, target.checked);
                                }}
                            />

                            <span className="text-semibold w10">{id}</span>

                            <span className="w10 flex flex-item-noshrink flex-justify-center">
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
                                {paddingSize.map((size) => (
                                    <Option key={size} title={size} value={size} />
                                ))}
                            </SelectTwo>
                        </Label>
                    ))}
                </div>
                <div className="border rounded w60 relative flex flex-justify-center flex-align-items-center p4">
                    <div className="bg-primary flex-item-nogrow rounded-sm overflow-hidden">
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
            <code className="inline-block user-select rounded-sm p0-25 px0-5 border bg-weak text-norm text-sm hidden-empty">
                {assembleClasses(selectedPadding)}
            </code>
        </>
    );
};
