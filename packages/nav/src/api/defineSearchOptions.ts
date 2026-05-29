import type { IconName } from '@proton/icons/types';

import type { NavContext } from '../types/models';
import type { NavArgs, NavItemResolved, NavResolved } from '../types/nav';
import { type SearchOption, SettingsLayoutVariant } from '../types/searchOptions';
import { defineNavigation } from './defineNavigation';

export function defineSearchOptions<TContext extends NavContext>(arg: NavArgs<TContext> | NavResolved): SearchOption[] {
    const resolved: NavResolved = 'definition' in arg ? defineNavigation(arg) : arg;
    const results: SearchOption[] = [];

    function traverse(items: NavItemResolved[], breadcrumbs: string[], nearestIcon: IconName | undefined): void {
        for (const item of items) {
            const icon = item.icon ?? nearestIcon;

            if (item.to) {
                results.push({
                    id: item.id,
                    value: item.label,
                    icon,
                    to: item.to,
                    in: breadcrumbs,
                    beta: false,
                    variant: SettingsLayoutVariant.Default,
                });

                for (const section of item.sections ?? []) {
                    if (!section.text) {
                        continue;
                    }

                    results.push({
                        id: section.id,
                        value: section.text,
                        icon,
                        to: `${item.to}#${section.to}`,
                        in: [...breadcrumbs, item.label],
                        beta: section.beta,
                        variant: section.variant,
                    });
                }
            }

            if (item.children) {
                traverse(item.children, [...breadcrumbs, item.label], icon);
            }
        }
    }

    traverse(resolved.items, [], undefined);

    return results;
}
