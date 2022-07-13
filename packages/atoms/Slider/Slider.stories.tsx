import { useState } from 'react';

import Slider from './Slider';
import mdx from './Slider.mdx';

export default {
    component: Slider,
    title: 'components/Slider',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const [value, setValue] = useState(25);

    return (
        <div className="p2">
            <Slider value={value} onChange={setValue} />
        </div>
    );
};

export const Marks = () => {
    const [value, setValue] = useState(25);

    return (
        <div className="p2">
            <Slider marks value={value} onChange={setValue} />
        </div>
    );
};

export const Color = () => {
    const [value, setValue] = useState(25);

    return (
        <div className="p2">
            <div>
                <Slider color="success" value={value} onInput={setValue} />
            </div>
            <div className="mt2">
                <Slider color="danger" value={value} onInput={setValue} />
            </div>
            <div className="mt2">
                <Slider color="info" value={value} onInput={setValue} />
            </div>
            <div className="mt2">
                <Slider color="norm" value={value} onInput={setValue} />
            </div>
            <div className="mt2">
                <Slider color="warning" value={value} onInput={setValue} />
            </div>
            <div className="mt2">
                <Slider color="weak" value={value} onInput={setValue} />
            </div>
        </div>
    );
};

export const Size = () => {
    const [value, setValue] = useState(25);

    return (
        <div className="p2">
            <div>
                <Slider size="small" value={value} onInput={setValue} />
            </div>
            <div className="mt2">
                <Slider value={value} onInput={setValue} />
            </div>
        </div>
    );
};

export const Step = () => {
    const [value, setValue] = useState(0.2);

    return (
        <div className="p2">
            <Slider step={0.01} min={0} max={1} value={value} onChange={setValue} />
        </div>
    );
};

export const MinMax = () => {
    const [value, setValue] = useState(2000);

    return (
        <div className="p2">
            <Slider min={1000} max={10000} value={value} onChange={setValue} />
        </div>
    );
};

export const MinMaxInverted = () => {
    const [value, setValue] = useState(-10);

    return (
        <div className="p2">
            <Slider min={20} max={-20} value={value} onChange={setValue} />
        </div>
    );
};

export const CustomValueDisplayFormat = () => {
    const [value, setValue] = useState(20);

    return (
        <div className="p2">
            <Slider value={value} onChange={setValue} getDisplayedValue={(v) => `${v.toFixed(2)}px`} />
        </div>
    );
};
