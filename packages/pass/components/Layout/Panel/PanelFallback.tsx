import type { FC, PropsWithChildren, ReactNode } from 'react';

type Props = { when: boolean; fallback: ReactNode; className?: string };

export const PanelFallback: FC<PropsWithChildren<Props>> = ({ when, fallback, children, className }) => {
    return when ? (
        <div className="absolute inset-center flex flex-column gap-y-3 text-center color-weak text-sm">{fallback}</div>
    ) : (
        <div className={className}>{children}</div>
    );
};
