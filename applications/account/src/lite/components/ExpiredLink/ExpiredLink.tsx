import { c } from 'ttag';

import expiredLink from './expiredLink.svg';

const ExpiredLink = () => {
    return (
        <div className="h-full flex flex-column justify-center items-center bg-norm text-center">
            <img src={expiredLink} alt="" />
            <h1 className="text-bold text-2xl mb-2 mt-8">{c('Info').t`Link expired`}</h1>
        </div>
    );
};

export default ExpiredLink;
