import React from 'react';
import { c } from 'ttag';

import { Loader } from '../../index';
import { SignupModel } from './interfaces';

interface Props {
    model: SignupModel;
}

const SignupCreatingAccount = ({ model }: Props) => {
    const [domain = ''] = model.domains;
    const email = model.email ? model.email : `${model.username}@${domain}`;
    return (
        <div className="aligncenter">
            <Loader size="big" />
            <p>{c('Info').t`Creating your Proton account`}</p>
            <p className="bold">{email}</p>
            <p>{c('Info').t`Please wait...`}</p>
        </div>
    );
};

export default SignupCreatingAccount;
