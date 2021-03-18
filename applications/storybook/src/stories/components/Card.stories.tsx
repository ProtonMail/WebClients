import React from 'react';
import { Button, Card } from 'react-components';

import mdx from './Card.mdx';

export default {
    component: Card,
    title: 'Components / Card',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => (
    <Card>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sit doloribus nobis eos iusto. Ducimus numquam laborum
        aliquid culpa! Dolor voluptatem modi inventore error, qui repudiandae consequatur autem vitae illum
        voluptatibus?
    </Card>
);

export const WithActionHorizontal = () => (
    <Card className="flex flex-align-items-center">
        <p className="m0 mr2 flex-item-fluid">
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempore ipsa dolores delectus fugit consequuntur
            impedit velit officia tenetur, magni placeat, voluptatum porro unde repudiandae cum explicabo assumenda
            distinctio, mollitia voluptate.
        </p>
        <Button color="norm">Upgrade</Button>
    </Card>
);
