import { getAppName } from 'proton-shared/lib/apps/helper';
import { APPS } from 'proton-shared/lib/constants';
import React from 'react';
import { c } from 'ttag';

import { Icon } from '../../components';

const OneAccountIllustration = () => {
    const driveAppName = getAppName(APPS.PROTONDRIVE);

    return (
        <div className="center flex flex-column flex-align-items-center">
            <div className="inline-flex">
                <span className="icon-28p rounded50 flex">
                    <Icon name="protondrive" className="mauto" alt={driveAppName} />
                </span>
                <span className="w40p" />
                <span className="icon-20p rounded50 flex mt2">
                    <Icon name="protoncontacts" className="mauto" size={12} />
                </span>
            </div>

            <span className="icon-42p rounded50 inline-flex mt0-25 mb0-5">
                <Icon name="protonmail" className="mauto" size={24} />
            </span>

            <div className="inline-flex">
                <span className="icon-28p rounded50 flex mt0-5">
                    <Icon name="protonvpn" className="mauto" size={20} />
                </span>
                <span className="w40p mr0-5r" />
                <span className="icon-24p rounded50 flex ">
                    <Icon name="protoncalendar" className="mauto" />
                </span>
            </div>

            <div className="max-w60 mt1 text-center">{c('Info').t`One account for all Proton services`}</div>
        </div>
    );
};

export default OneAccountIllustration;
