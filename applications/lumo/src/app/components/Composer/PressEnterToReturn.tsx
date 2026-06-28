import { c } from 'ttag';

import { LumoIcon } from '../LumoIcon/LumoIcon';

const PressEnterToReturn = () => {
    const shiftEnterBoldText = (
        <kbd
            key={c('collider_2025: Characteristic Title').t`Enter`} // only there to prevent a react warning
        >{c('collider_2025: Characteristic Title').t`Enter`}</kbd>
    );
    return (
        <div className="hidden md:flex flex-row flex-nowrap gap-2 color-hint prompt-entry-hint">
            <LumoIcon name="CornerDownLeft" size={16} />
            <span className="text-xs">{c('collider_2025: Info').jt`Press ${shiftEnterBoldText} to ask`}</span>
        </div>
    );
};

export default PressEnterToReturn;
