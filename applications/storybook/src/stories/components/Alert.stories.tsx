import React from 'react';
import { Alert } from 'react-components';
import mdx from './Alert.mdx';

export default {
    component: Alert,
    title: 'Components / Alert',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => (
    <Alert>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus obcaecati
        enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero, blanditiis quos?
    </Alert>
);
export const Error = () => (
    <Alert type="error">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Nemo corporis ea nobis nesciunt sed sit architecto
        atque. Vero, corrupti non nobis, officia blanditiis magnam ex sapiente et expedita, animi tenetur!
    </Alert>
);

export const Warning = () => (
    <Alert type="warning">
        Lorem ipsum, dolor sit amet consectetur adipisicing elit. Maiores tempora ea eos corporis facilis facere, nemo
        sunt. Eos, blanditiis laboriosam expedita voluptatem eaque vero esse, minima temporibus, ab ad nesciunt?
    </Alert>
);

export const Success = () => (
    <Alert type="success">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sit doloribus nobis eos iusto. Ducimus numquam laborum
        aliquid culpa! Dolor voluptatem modi inventore error, qui repudiandae consequatur autem vitae illum
        voluptatibus?
    </Alert>
);

export const LearnMoreLink = () => (
    <Alert learnMore="https://www.protonmail.com">
        Lorem ipsum, dolor sit amet consectetur adipisicing elit. Officiis, veritatis. Natus odit minus, maxime esse
        illo perferendis expedita, officia libero ab qui architecto nostrum dignissimos hic aspernatur, ipsum unde
        voluptatibus?
    </Alert>
);

export const ClassName = () => (
    <Alert className="bold">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusamus veniam cumque eos facilis repudiandae
        delectus? Facilis nostrum culpa accusamus iusto modi veritatis, aspernatur voluptas placeat tempora earum
        obcaecati. Tempore, praesentium?
    </Alert>
);
