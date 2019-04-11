import React from 'react';
import { c } from 'ttag';
import { SubTitle, Alert } from 'react-components';

const CatchAllSection = () => {
    return (
        <>
            <SubTitle>{c('Title').t`Catch all `}</SubTitle>
            <Alert learnMore="TODO">{c('Info')
                .t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus posuere libero nec nunc feugiat, id efficitur augue vestibulum. Mauris nec commodo turpis.`}</Alert>
        </>
    );
};

export default CatchAllSection;
