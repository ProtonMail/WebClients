import { useState } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { Checkbox } from '@proton/components';

import Card from './Card';
import mdx from './Card.mdx';

export default {
    component: Card,
    title: 'components/Card',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => (
    <Card>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sit doloribus nobis eos iusto. Ducimus numquam laborum
        aliquid culpa! Dolor voluptatem modi inventore error, qui repudiandae consequatur autem vitae illum
        voluptatibus?
    </Card>
);

export const WithActionHorizontal = () => (
    <Card className="flex items-center">
        <p className="m-0 mr-8 flex-1">
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempore ipsa dolores delectus fugit consequuntur
            impedit velit officia tenetur, magni placeat, voluptatum porro unde repudiandae cum explicabo assumenda
            distinctio, mollitia voluptate.
        </p>
        <Button color="norm">Upgrade</Button>
    </Card>
);

const toggles = ['bordered', 'rounded', 'background'] as const;

export const Sandbox = () => {
    const [selectedToggles, setSelectedToggles] = useState([true, false, true]);

    const tabsExample = (
        <Card
            {...selectedToggles.reduce<{ [key: string]: boolean }>((acc, value, i) => {
                acc[toggles[i]] = value;
                return acc;
            }, {})}
        >
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sit doloribus nobis eos iusto. Ducimus numquam
            laborum aliquid culpa! Dolor voluptatem modi inventore error, qui repudiandae consequatur autem vitae illum
            voluptatibus?
        </Card>
    );

    return (
        <div className="flex items-stretch py-7">
            <div>{tabsExample}</div>
            <div className="mr-8">
                <strong className="block mt-4">Options</strong>
                {toggles.map((prop, i) => {
                    return (
                        <div className="mb-2">
                            <Checkbox
                                checked={selectedToggles[i]}
                                onChange={({ target: { checked } }) => {
                                    setSelectedToggles(
                                        selectedToggles.map((oldValue, otherIndex) =>
                                            otherIndex === i ? checked : oldValue
                                        )
                                    );
                                }}
                            >
                                {prop}
                            </Checkbox>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
