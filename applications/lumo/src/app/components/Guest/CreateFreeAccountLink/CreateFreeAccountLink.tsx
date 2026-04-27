import React from 'react';

import { AuthActionButton, type AuthButtonProps, type BaseAuthProps } from '../AuthActionButton';

export const CreateFreeAccountButton = (props: AuthButtonProps) => {
    return <AuthActionButton variant="button" action="signup" {...props} />;
};

export const CreateFreeAccountLink = ({ className }: BaseAuthProps) => {
    return <AuthActionButton variant="link" action="signup" className={className} />;
};

export default CreateFreeAccountLink;
