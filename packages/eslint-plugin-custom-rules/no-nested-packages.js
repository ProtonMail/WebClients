import fs from 'node:fs';
import path from 'node:path';

import { checkNestedPackagePath } from './lib/is-nested-package-path.js';

const findMonorepoRoot = (startDir) => {
    let current = startDir;

    while (current !== path.dirname(current)) {
        const packageJsonPath = path.join(current, 'package.json');

        if (fs.existsSync(packageJsonPath)) {
            try {
                const content = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

                if (content.workspaces) {
                    return current;
                }
            } catch {
                // Continue searching parent directories.
            }
        }

        current = path.dirname(current);
    }

    return null;
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: 'problem',
        languages: ['json/json'],
        docs: {
            description: 'Forbid nested npm packages under applications/ and packages/',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    allowedPaths: {
                        type: 'array',
                        items: { type: 'string' },
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    create: (context) => {
        const options = context.options[0] ?? {};
        const allowedPaths = options.allowedPaths ?? [];

        const filename = context.physicalFilename ?? context.filename;

        if (!filename.endsWith('package.json')) {
            return {};
        }

        const fileDir = path.dirname(filename);
        const monorepoRoot = findMonorepoRoot(fileDir) ?? context.cwd;
        const relativeDir = path.relative(monorepoRoot, fileDir).replace(/\\/g, '/');
        const result = checkNestedPackagePath(relativeDir, allowedPaths);

        if (!result.isViolation) {
            return {};
        }

        let reported = false;

        return {
            Object(node) {
                if (reported) {
                    return;
                }

                reported = true;
                context.report({
                    node,
                    message: `Nested packages are not allowed under ${result.category}/. Move this package to a top-level workspace (e.g. ${result.category}/<name>).`,
                });
            },
        };
    },
};
