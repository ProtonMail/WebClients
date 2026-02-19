import { IcPlus } from '@proton/icons/icons/IcPlus';

import './PlaceholderPlusSign.scss';

export const PlaceholderPlusSign = () => {
    return (
        <div
            className="placeholder-button-icon-container border border-dashed flex justify-center items-center w-custom h-custom"
            style={{ '--w-custom': '3.75rem', '--h-custom': '3.75rem' }}
        >
            <IcPlus size={4} />
        </div>
    );
};
