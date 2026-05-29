import type { Computed } from './computed';
import type { NavContext } from './models';
import type { SettingsLayoutVariant } from './searchOptions';

export interface NavSectionDefinition<TContext extends NavContext = NavContext> {
    id: string;
    beta?: Computed<boolean, TContext>;
    variant?: Computed<SettingsLayoutVariant, TContext>;
    text?: Computed<string, TContext>;
    to: Computed<string, TContext>;
    isVisible?: (args: { context: TContext }) => boolean;
}

export interface NavSectionResolved {
    id: string;
    beta: boolean;
    text: string | undefined;
    to: string;
    variant: SettingsLayoutVariant;
}
