import React from 'react';

import Input from './Input';

const Radio = ({ ...rest }) => {
    return (
        <>
            <Input type="radio" className="pm-radio" {...rest} />
            <span className="pm-radio-fakeradio" />
        </>
    );
};

export default Radio;
