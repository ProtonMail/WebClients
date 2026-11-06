import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

const LogoIconShape = ({ children, border = true }: { children: ReactNode; border?: boolean }) => {
    return (
        <div
            className={clsx(
                'w-custom ratio-square rounded-lg overflow-hidden flex items-center justify-center shrink-0',
                border ? 'border border-weak' : undefined
            )}
            style={{ '--w-custom': '2.75rem', backgroundColor: 'white' }}
            aria-hidden="true"
        >
            {children}
        </div>
    );
};

interface Props {
    logoSrc: string;
    planName: string;
    border?: boolean;
}

export const PlanLogo = ({ logoSrc, planName, border }: Props) => {
    return (
        <div className="flex flex-nowrap gap-4 items-center">
            <LogoIconShape border={border}>
                <img src={logoSrc} alt="" />
            </LogoIconShape>
            <span className="text-xl text-semibold" data-testid="planName">
                {planName}
            </span>
        </div>
    );
};
