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

const placementOptions = ALL_PLACEMENTS.map((placement) => ({
    value: placement,
    label: placement,
}));

export const Sandbox = () => {
    const [placement, setPlacement] = useState(ALL_PLACEMENTS[0]);
    const [show, setShow] = useState(false);

    useEffect(() => {
        setTimeout(() => setShow(true), 500);
    }, []);

    const handleChange = (placement: string) => {
        setShow(false);
        setPlacement(placement);
        setTimeout(() => setShow(true), 100);
    };

    return (
        <div className="p2">
            <div className="flex flex-align-items-stretch">
                <div className="mr2">
                    <strong className="block mb1">Placement</strong>
                    <RadioGroup
                        name="selected-color"
                        onChange={handleChange}
                        value={placement}
                        options={placementOptions}
                    />
                </div>
                <div className="flex flex-item-fluid flex-align-items-center flex-justify-center bordered">
                    <Spotlight content="Content of the spotlight" show={show} originalPlacement={placement}>
                        <div
                            className="bordered rounded flex flex-align-items-center flex-justify-center p1"
                            style={{ width: '8em', height: '8em', margin: '15em' }}
                        >
                            Something to put spotlight on
                        </div>
                    </Spotlight>
                </div>
            </div>
        </div>
    );
};
