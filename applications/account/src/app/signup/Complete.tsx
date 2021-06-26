import React from 'react';
import { c } from 'ttag';

import { Href } from '@proton/components';
import { SignupModel } from './interfaces';

interface Props {
    model: SignupModel;
}

const Complete = ({ model }: Props) => {
    const [domain = ''] = model.domains;
    const email = model.email ? model.email : `${model.username}@${domain}`;
    return (
        <div className="text-center">
            <h2>{c('Signup title').t`Congratulations, your Proton Account ${email} has been created!`}</h2>
            <p>{c('Info')
                .t`Keep your password safe and secure, as it is the key to unlocking all your emails, documents and any other private data on Proton.`}</p>
            <p>{c('Info')
                .t`Make sure you do not forget or lose your password. It is the key to unlocking all your emails, documents, and other private data on Proton. If you need to reset your password, you will lose access to this data.`}</p>
            <Href target="_self" className="button button--primary button--large" url="TODO">{c('Link')
                .t`Finish`}</Href>
        </div>
    );
};

export default Complete;
