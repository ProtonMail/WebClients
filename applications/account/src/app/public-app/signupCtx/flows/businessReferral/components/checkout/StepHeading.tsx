import type { ReactNode } from 'react';

export const StepHeading = ({ step, right, children }: { step: number; right?: ReactNode; children: ReactNode }) => (
    <div className="flex flex-column md:flex-row flex-nowrap items-center justify-space-between gap-2">
        <div className="flex flex-column md:flex-row flex-nowrap items-center gap-2 md:shrink-0">
            <span
                className="business-step-heading-badge color-norm w-custom h-custom rounded-full flex items-center justify-center text-bold"
                style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
            >
                {step}
            </span>
            <h1 className="color-norm font-arizona text-semibold text-4xl text-center md:text-left">{children}</h1>
        </div>
        {right && <div className="md:shrink-0">{right}</div>}
    </div>
);
