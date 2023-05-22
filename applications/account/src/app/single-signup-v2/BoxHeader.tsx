import { ReactNode } from 'react';

import StepLabel from './StepLabel';

const BoxHeader = ({ step, title, right }: { step: number; title: string; right?: ReactNode }) => {
    return (
        <div className="flex flex-align-items-center flex-justify-space-between on-mobile-flex-column">
            <div className="flex flex-align-items-center on-mobile-flex-column md:gap-4 gap-2 flex-item-noshrink">
                <div>
                    <StepLabel step={step} />
                </div>
                <h2 className="text-bold text-4xl">{title}</h2>
            </div>
            {right && <div className="flex-item-noshrink on-mobile-text-center mt-4 md:mt-0">{right}</div>}
        </div>
    );
};

export default BoxHeader;
