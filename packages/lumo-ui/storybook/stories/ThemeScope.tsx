import '@proton/lumo-ui/styles/lumo-ui.scss';
// The shared Webpack loader returns raw theme CSS as text.
import darkTokens from '@proton/lumo-ui/styles/themes/lumo-dark.raw.scss';
import lightTokens from '@proton/lumo-ui/styles/themes/lumo-light.raw.scss';

export type Appearance = 'light' | 'dark';
export const scopeClass = (appearance: Appearance) => `lumo-ui lumo-catalog-theme--${appearance}`;

// The same scopes work for preview panels and content mounted in portals.
const scopedTokens = [lightTokens, darkTokens]
    .map((css, index) =>
        css
            .toString()
            .replace(/:root,\s*\.ui-standard,\s*\.lumo-ui/g, `.lumo-ui.lumo-catalog-theme--${index ? 'dark' : 'light'}`)
    )
    .join('\n');

export function ThemeStyles() {
    return <style>{scopedTokens}</style>;
}
