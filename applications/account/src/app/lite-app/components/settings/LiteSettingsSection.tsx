import type { ReactNode } from 'react';

interface Props {
    title: string;
    description?: ReactNode;
    children: ReactNode;
}

/** A titled panel of `LiteSettingsRow`s, from the Figma `settings/section-title` and panel */
const LiteSettingsSection = ({ title, description, children }: Props) => {
    return (
        <section className="lite-settings-section">
            <h2 className="lite-settings-section-title">{title}</h2>
            {description && <p className="lite-settings-section-description">{description}</p>}
            <div className="lite-settings-panel">{children}</div>
        </section>
    );
};

export default LiteSettingsSection;
