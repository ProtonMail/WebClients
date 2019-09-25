import React from 'react';
import { c } from 'ttag';
import { Loader } from 'react-components';

const Upgrading = () => {
    return (
        <>
            <p className="aligncenter">{c('Info')
                .t`Your account is being upgraded, this may take up to 30 seconds.`}</p>
            <Loader />
        </>
    );
};

export default Upgrading;
