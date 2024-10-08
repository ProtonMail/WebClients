import { c } from 'ttag';

import { SeperatorOptions } from './types';

export const getSeperatorTranslation = (seperator: SeperatorOptions) =>
    ({
        [SeperatorOptions.HYPHEN]: c('Option').t`Hyphens`,
        [SeperatorOptions.SPACE]: c('Option').t`Spaces`,
        [SeperatorOptions.PERIOD]: c('Option').t`Periods`,
        [SeperatorOptions.COMMA]: c('Option').t`Commas`,
        [SeperatorOptions.UNDERSCORE]: c('Option').t`Underscores`,
        [SeperatorOptions.NUMBER]: c('Option').t`Numbers`,
        [SeperatorOptions.NUMBER_OR_SYMBOL]: c('Option').t`Numbers and Symbols`,
    })[seperator];
