import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { allGlobs } from '@proton/oxlint-config/globs';

export default createOxlintConfig({
    overrides: [
        {
            files: allGlobs,
            rules: {
                'react/exhaustive-deps': 'error',
                'proton/restricted-syntax': [
                    'error',
                    {
                        selector: "VariableDeclarator[id.type='ObjectPattern'][init.name=/^[A-Z_]+$/]",
                        message:
                            'Destructuring of enum-like constants is not allowed. Use CONSTANT.PROPERTY instead to maintain code readability.',
                    },
                ],
            },
        },
    ],
});
