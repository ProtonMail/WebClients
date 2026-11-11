import type { ReactNode } from 'react';

export const PlanLogo = ({ icon, planName }: { icon: ReactNode; planName: string }) => (
    <div className="flex flex-nowrap gap-4 items-center">
        <div
            className="w-custom ratio-square rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-weak"
            style={{ '--w-custom': '2.75rem', backgroundColor: 'var(--plan-logo-shape-background, white)' }}
            aria-hidden="true"
        >
            {icon}
        </div>
        <span className="text-xl text-semibold" data-testid="planName">
            {planName}
        </span>
    </div>
);
