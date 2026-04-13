import { forwardRef } from 'react';

export type MaybeGroupProps = { name: string; count?: string };

export const MaybeGroupName = forwardRef<HTMLSpanElement, MaybeGroupProps>(({ name, count }, ref) => (
    <span className="flex flex-nowrap" ref={ref}>
        {/* Using divs here to evade ListField hover overriding spans width */}
        <div className="text-ellipsis" title={name}>
            {name}
        </div>
        {count !== undefined && <div className="shrink-0 ml-1">{count}</div>}
    </span>
));

MaybeGroupName.displayName = 'MaybeGroupName';
