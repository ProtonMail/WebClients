import React from 'react';

import Input from './Input';

const VerificationCodeInput = ({ ...rest }) => {
    return <Input inputMode="numeric" pattern="[0-9]*" placeholder="123456" {...rest} />;
};

export default VerificationCodeInput;
