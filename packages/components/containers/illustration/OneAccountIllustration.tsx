import { getAppName } from 'proton-shared/lib/apps/helper';
import { APPS } from 'proton-shared/lib/constants';
import React from 'react';
import { c } from 'ttag';

import { Icon } from '../../components';

const OneAccountIllustration = () => {
    const driveAppName = getAppName(APPS.PROTONDRIVE);

    return (
        <div className="center flex flex-column flex-items-center">
            <div className="inline-flex">
                <span className="bg-global-altgrey icon-28p rounded50 flex">
                    <Icon name="protondrive" className="color-global-light mauto" alt={driveAppName} />
                </span>
                <span className="w40p" />
                <span className="bg-global-altgrey icon-20p rounded50 flex mt2">
                    <Icon name="protoncontacts" className="color-global-light mauto" size={12} />
                </span>
            </div>

            <span className="bg-global-altgrey icon-42p rounded50 inline-flex mt0-25 mb0-5">
                <Icon name="protonmail" className="color-global-light mauto" size={24} />
            </span>

            <div className="inline-flex">
                <span className="bg-global-altgrey icon-28p rounded50 flex mt0-5">
                    <Icon name="protonvpn" className="color-global-light mauto" size={20} />
                </span>
                <span className="w40p mr0-5r" />
                <span className="bg-global-altgrey icon-24p rounded50 flex ">
                    <Icon name="protoncalendar" className="color-global-light mauto" />
                </span>
            </div>

            <div className="mw60 mt1 aligncenter">{c('Info').t`One account for all Proton services`}</div>
        </div>
    );
};

export default OneAccountIllustration;
