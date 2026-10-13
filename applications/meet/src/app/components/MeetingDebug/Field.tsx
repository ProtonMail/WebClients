import clsx from '@proton/utils/clsx';

export const Field = ({ name, value, highlight = false }: { name: string; value: string; highlight?: boolean }) => (
    <div className="flex flex-nowrap gap-2 text-sm">
        <span className="color-weak shrink-0 min-w-custom" style={{ '--min-w-custom': '9.5rem' }}>
            {name}
        </span>
        <span className={clsx('flex-1 min-w-0 text-break', highlight && 'color-danger text-bold')}>{value}</span>
    </div>
);
