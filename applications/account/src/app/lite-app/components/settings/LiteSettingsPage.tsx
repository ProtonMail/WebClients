import type { ReactNode } from 'react';

import './LiteSettings.scss';

/** Root of a lite settings page opened in a mobile web view, styled from the NGC Figma settings */
const LiteSettingsPage = ({ children }: { children: ReactNode }) => {
    return <div className="lite-settings">{children}</div>;
};

export default LiteSettingsPage;
