import { createOxlintConfig } from '@proton/oxlint-config';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/oxlint-config/extraneousDependencies';

export default createOxlintConfig({
    overrides: [
        {
            // The generator only runs through `pnpm generate`, so its tools are dev dependencies.
            files: ['bin/**'],
            rules: {
                'proton/no-extraneous-dependencies': createExtraneousDependenciesRule({
                    devDependencies: [...extraneousDependenciesDevDependencies, '**/bin/**'],
                }),
            },
        },
        {
            // Generated: an `<svg role="img">` is how the icons expose themselves, as the `Ic*` ones do.
            files: ['icons/**'],
            rules: { 'jsx-a11y/prefer-tag-over-role': 'off' },
        },
    ],
});
