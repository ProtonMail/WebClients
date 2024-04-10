import { type FC } from 'react';

export const SubHeader: FC<{ title: string; description?: string }> = ({ title, description }) => (
    <section className="flex flex-column flex-nowrap gap-3 mb-8">
        <header className="border-bottom pb-2 text-bold text-4xl">{title}</header>
        {description && <span>{description}</span>}
    </section>
);
