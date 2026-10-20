import type { Context } from '@oxlint/plugins';

/**
 * Options are typed as JSON by oxlint but already validated against the rule's `meta.schema`,
 * so narrowing them to the rule's own option type is safe.
 */
export const getRuleOptions = <Options extends readonly unknown[]>(context: Context) =>
    context.options as unknown as Options;
