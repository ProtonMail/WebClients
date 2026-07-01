import './TabHeader.scss';

type Props = {
    title: string;
    count: number;
};

export const TabHeader = ({ title, count }: Props) => {
    return (
        <div className="flex items-center gap-2">
            <h3 className="tab-header-title color-hint">{title}</h3>
            <div
                className="tab-header-count color-hint w-custom h-custom rounded-full flex items-center justify-center text-sm text-tabular-nums"
                style={{ '--w-custom': '1.5rem', '--h-custom': '1.5rem' }}
            >
                {count}
            </div>
        </div>
    );
};
