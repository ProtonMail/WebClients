import type { ReactNode } from 'react';

export function Page({
    eyebrow,
    title,
    description,
    children,
}: {
    eyebrow: string;
    title: string;
    description: ReactNode;
    children: ReactNode;
}) {
    return (
        <main className="ds-page">
            <header className="ds-page__header">
                <span className="ds-page__eyebrow">Lumo Design System / {eyebrow}</span>
                <h1 className="ds-page__title">{title}</h1>
                <p className="ds-page__description">{description}</p>
            </header>
            {children}
            <footer className="ds-page__footer">
                Lumo Design System <span>@proton/lumo-ui</span>
            </footer>
        </main>
    );
}
