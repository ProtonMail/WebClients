import React from 'react';

import { c } from 'ttag';

import { IcArrowLeftAndDown } from '@proton/icons/icons/IcArrowLeftAndDown';

const PressEnterToReturn = () => {
    const shiftEnterBoldText = (
        <kbd
            key={c('collider_2025: Characteristic Title').t`Enter`} // only there to prevent a react warning
        >{c('collider_2025: Characteristic Title').t`Enter`}</kbd>
    );
    return (
        <div className="hidden md:flex flex-row flex-nowrap gap-2 color-hint prompt-entry-hint">
            <IcArrowLeftAndDown />
            <span className="text-xs">{c('collider_2025: Info').jt`Press ${shiftEnterBoldText} to ask`}</span>
        </div>
    );
};

export default PressEnterToReturn;
