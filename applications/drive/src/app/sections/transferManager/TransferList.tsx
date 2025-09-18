import { c } from 'ttag';

export type TransferListItem = {
    id: string;
    name: string;
    status: string;
    progress: number;
};

type TransferListProps = {
    title: string;
    emptyMessage: string;
    items: TransferListItem[];
};

export const TransferList = ({ title, emptyMessage, items }: TransferListProps) => (
    <section aria-live="polite">
        <h3>{title}</h3>
        {items.length === 0 ? (
            <p>{emptyMessage}</p>
        ) : (
            <ul>
                {items.map((item) => (
                    <li key={item.id}>
                        <div>
                            <strong>{item.name}</strong>
                        </div>
                        <div>
                            {c('Label').t`Status:`} {item.status}
                        </div>
                        <div>
                            {c('Label').t`Progress:`} {item.progress}
                        </div>
                    </li>
                ))}
            </ul>
        )}
    </section>
);
