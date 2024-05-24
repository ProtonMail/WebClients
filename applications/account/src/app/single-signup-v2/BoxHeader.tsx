import { ReactNode } from 'react';

import StepLabel from './StepLabel';

const BoxHeader = ({ step, title, right }: { step?: number; title: string; right?: ReactNode }) => {
    return (
        <div className="flex flex-column md:flex-row items-stretch md:items-center justify-space-between">
            <div className="flex flex-column md:flex-row w-full md:w-auto items-center md:items-start text-center md:text-start justify-center md:justify-start md:gap-4 gap-2 shrink-0">
                {step !== undefined && (
                    <div>
                        <StepLabel step={step} />
                    </div>
                )}
                <h2 className="text-bold text-4xl">{title}</h2>
            </div>
            {right && <div className="shrink-0 text-center mt-4 md:mt-0">{right}</div>}
        </div>
    );
};

export default BoxHeader;
