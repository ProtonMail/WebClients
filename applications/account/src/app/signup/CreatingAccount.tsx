import { c } from 'ttag';

import { SignupModel } from './interfaces';
import Loader from './Loader';

interface Props {
    model: SignupModel;
}

const CreatingAccount = ({ model }: Props) => {
    const [domain = ''] = model.domains;
    const email = model.email ? model.email : `${model.username}@${domain}`;
    return (
        <div className="text-center">
            <Loader />
            <p>{c('Info').t`Creating your Proton account`}</p>
            <p className="text-bold">{email}</p>
            <p className="mb0">{c('Info').t`Please wait...`}</p>
        </div>
    );
};

export default CreatingAccount;
