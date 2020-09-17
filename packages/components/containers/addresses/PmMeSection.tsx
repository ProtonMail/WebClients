import React from 'react';
import { UserModel } from 'proton-shared/lib/interfaces';

import PmMePanel from './PmMePanel';

interface Props {
    user: UserModel;
}

const PmMeSection = ({ user }: Props) => {
    if (!user.canPay || user.isSubUser) {
        return null;
    }

    return <PmMePanel />;
};

export default PmMeSection;
