import { useEffect, useState } from 'react';
import { RadioGroup, Spotlight } from '@proton/components';
import { ALL_PLACEMENTS } from '@proton/components/components/popper/utils';
import { getTitle } from '../../helpers/title';
import mdx from './Spotlight.mdx';

export default {
    component: Spotlight,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const sizeOptions = [
    { value: '2px', label: '2px' },
    { value: '8px', label: '8px' },
    { value: '14px', label: '14px' },
];

const placementOptions = ALL_PLACEMENTS.map((placement) => ({
    value: placement,
    label: placement,
}));

export const Sandbox = () => {
    const [targetSize, setTargetSize] = useState(sizeOptions[1].value);
    const [placement, setPlacement] = useState(ALL_PLACEMENTS[0]);
    const [show, setShow] = useState(false);

    useEffect(() => {
        setTimeout(() => setShow(true), 500);
    }, []);

    const handleChangeSize = (size: string) => {
        setShow(false);
        setTargetSize(size);
        setTimeout(() => setShow(true), 100);
    };

    const handleChangePlacement = (placement: string) => {
        setShow(false);
        setPlacement(placement);
        setTimeout(() => setShow(true), 100);
    };

    const style = {
        width: '8em',
        height: '8em',
        margin: '15em',
        padding: '1em',
        fontSize: targetSize,
    };

    return (
        <div className="p2">
            <div className="flex flex-align-items-stretch">
                <div className="mr2">
                    <strong className="block mb1">Target size</strong>
                    <RadioGroup
                        name="target-size"
                        onChange={handleChangeSize}
                        value={targetSize}
                        options={sizeOptions}
                    />
                </div>
                <div className="mr2">
                    <strong className="block mb1">Placement</strong>
                    <RadioGroup
                        name="placement"
                        onChange={handleChangePlacement}
                        value={placement}
                        options={placementOptions}
                    />
                </div>
                <div className="flex flex-item-fluid flex-align-items-center flex-justify-center border">
                    <Spotlight content="Content of the spotlight" show={show} originalPlacement={placement}>
                        <div className="border rounded flex flex-align-items-center flex-justify-center" style={style}>
                            Something to put spotlight on
                        </div>
                    </Spotlight>
                </div>
            </div>
        </div>
    );
};
