import type { Context, ESTree } from '@oxlint/plugins';
import { defineRule } from '@oxlint/plugins';

import { getRuleOptions } from '../utils/ruleOptions.ts';

type Format = 'camelCase' | 'strictCamelCase' | 'PascalCase' | 'StrictPascalCase' | 'snake_case' | 'UPPER_CASE';
type UnderscoreOption = 'allow' | 'forbid';
type IndividualSelector = 'variable' | 'function' | 'class' | 'interface' | 'typeAlias' | 'enum' | 'typeParameter';
type MetaSelector = 'variableLike' | 'typeLike';

interface NamingOption {
    selector: IndividualSelector | MetaSelector;
    format: Format[];
    leadingUnderscore?: UnderscoreOption;
    trailingUnderscore?: UnderscoreOption;
}

const META_SELECTOR_MEMBERS: Record<MetaSelector, IndividualSelector[]> = {
    variableLike: ['variable', 'function'],
    typeLike: ['class', 'interface', 'typeAlias', 'enum', 'typeParameter'],
};

const SELECTOR_LABELS: Record<IndividualSelector, string> = {
    variable: 'Variable',
    function: 'Function',
    class: 'Class',
    interface: 'Interface',
    typeAlias: 'Type Alias',
    enum: 'Enum',
    typeParameter: 'Type Parameter',
};

// The format checks and underscore handling mirror @typescript-eslint/naming-convention, so names
// that passed under ESLint still pass here.
function hasStrictCamelHumps(name: string, startsUpper: boolean) {
    const isUppercaseChar = (char: string) => char === char.toUpperCase() && char !== char.toLowerCase();
    if (name.startsWith('_')) {
        return false;
    }
    let isUpper = startsUpper;
    for (let index = 1; index < name.length; index += 1) {
        if (name[index] === '_') {
            return false;
        }
        if (isUpper === isUppercaseChar(name[index])) {
            if (isUpper) {
                return false;
            }
        } else {
            isUpper = !isUpper;
        }
    }
    return true;
}

function hasValidUnderscores(name: string) {
    if (name.startsWith('_')) {
        return false;
    }
    let wasUnderscore = false;
    for (let index = 1; index < name.length; index += 1) {
        if (name[index] === '_') {
            if (wasUnderscore) {
                return false;
            }
            wasUnderscore = true;
        } else {
            wasUnderscore = false;
        }
    }
    return !wasUnderscore;
}

const FORMAT_CHECKS: Record<Format, (name: string) => boolean> = {
    camelCase: (name) => name.length === 0 || (name[0] === name[0].toLowerCase() && !name.includes('_')),
    strictCamelCase: (name) =>
        name.length === 0 || (name[0] === name[0].toLowerCase() && hasStrictCamelHumps(name, false)),
    PascalCase: (name) => name.length === 0 || (name[0] === name[0].toUpperCase() && !name.includes('_')),
    StrictPascalCase: (name) =>
        name.length === 0 || (name[0] === name[0].toUpperCase() && hasStrictCamelHumps(name, true)),
    snake_case: (name) => name.length === 0 || (name === name.toLowerCase() && hasValidUnderscores(name)),
    UPPER_CASE: (name) => name.length === 0 || (name === name.toUpperCase() && hasValidUnderscores(name)),
};

function findOption(options: readonly NamingOption[], selector: IndividualSelector) {
    return (
        options.find((option) => option.selector === selector) ??
        options.find(
            (option) =>
                option.selector in META_SELECTOR_MEMBERS &&
                META_SELECTOR_MEMBERS[option.selector as MetaSelector].includes(selector)
        )
    );
}

function collectPatternIdentifiers(pattern: ESTree.Node, identifiers: ESTree.BindingIdentifier[]) {
    switch (pattern.type) {
        case 'Identifier':
            identifiers.push(pattern as ESTree.BindingIdentifier);
            break;
        case 'ObjectPattern':
            for (const property of pattern.properties) {
                collectPatternIdentifiers(
                    property.type === 'RestElement' ? property.argument : property.value,
                    identifiers
                );
            }
            break;
        case 'ArrayPattern':
            for (const element of pattern.elements) {
                if (element) {
                    collectPatternIdentifiers(element, identifiers);
                }
            }
            break;
        case 'AssignmentPattern':
            collectPatternIdentifiers(pattern.left, identifiers);
            break;
        case 'RestElement':
            collectPatternIdentifiers(pattern.argument, identifiers);
            break;
        default:
            break;
    }
}

function createValidator(context: Context, options: readonly NamingOption[]) {
    return (selector: IndividualSelector, identifier: ESTree.BindingIdentifier) => {
        const option = findOption(options, selector);
        if (!option) {
            return;
        }
        let name = identifier.name;
        if (option.leadingUnderscore === 'allow' && name.startsWith('_')) {
            name = name.slice(1);
        } else if (option.leadingUnderscore === 'forbid' && name.startsWith('_')) {
            context.report({
                node: identifier,
                messageId: 'unexpectedUnderscore',
                data: { type: SELECTOR_LABELS[selector], name: identifier.name, position: 'leading' },
            });
            return;
        }
        if (option.trailingUnderscore === 'allow' && name.endsWith('_')) {
            name = name.slice(0, -1);
        } else if (option.trailingUnderscore === 'forbid' && name.endsWith('_')) {
            context.report({
                node: identifier,
                messageId: 'unexpectedUnderscore',
                data: { type: SELECTOR_LABELS[selector], name: identifier.name, position: 'trailing' },
            });
            return;
        }
        if (name.length === 0 || option.format.some((format) => FORMAT_CHECKS[format](name))) {
            return;
        }
        context.report({
            node: identifier,
            messageId: 'doesNotMatchFormat',
            data: { type: SELECTOR_LABELS[selector], name: identifier.name, formats: option.format.join(', ') },
        });
    };
}

/**
 * Port of `@typescript-eslint/naming-convention` limited to format checks: the selectors
 * `variable`, `function`, `class`, `interface`, `typeAlias`, `enum`, `typeParameter` and the meta
 * selectors `variableLike` and `typeLike`, with `format`, `leadingUnderscore` and
 * `trailingUnderscore`. The original needs type information even for plain format checks, which
 * oxlint JS plugins do not get.
 */
export default defineRule({
    meta: {
        type: 'suggestion',
        docs: { description: 'Enforce naming formats for variables, functions and types' },
        messages: {
            doesNotMatchFormat: '{{type}} name `{{name}}` must match one of the following formats: {{formats}}',
            unexpectedUnderscore: '{{type}} name `{{name}}` must not have a {{position}} underscore.',
        },
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    selector: { type: 'string' },
                    format: { type: 'array', items: { type: 'string' } },
                    leadingUnderscore: { enum: ['allow', 'forbid'] },
                    trailingUnderscore: { enum: ['allow', 'forbid'] },
                },
                required: ['selector', 'format'],
                additionalProperties: false,
            },
        },
    },
    create(context) {
        const validate = createValidator(context, getRuleOptions<readonly NamingOption[]>(context));
        const validateFunction = (node: ESTree.Function) => {
            if (node.id) {
                validate('function', node.id);
            }
        };

        return {
            VariableDeclarator(node) {
                const identifiers: ESTree.BindingIdentifier[] = [];
                collectPatternIdentifiers(node.id, identifiers);
                for (const identifier of identifiers) {
                    validate('variable', identifier);
                }
            },
            FunctionDeclaration: validateFunction,
            FunctionExpression: validateFunction,
            TSDeclareFunction: validateFunction,
            ClassDeclaration(node) {
                if (node.id) {
                    validate('class', node.id);
                }
            },
            ClassExpression(node) {
                if (node.id) {
                    validate('class', node.id);
                }
            },
            TSInterfaceDeclaration(node) {
                validate('interface', node.id);
            },
            TSTypeAliasDeclaration(node) {
                validate('typeAlias', node.id);
            },
            TSEnumDeclaration(node) {
                validate('enum', node.id);
            },
            'TSTypeParameterDeclaration > TSTypeParameter'(node: ESTree.TSTypeParameter) {
                validate('typeParameter', node.name);
            },
        };
    },
});
