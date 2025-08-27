import dateFormattingLocale from './date-formatting-locale.js';
import deprecateClasses from './deprecate-classes.js';
import deprecateResponsiveUtilityClasses from './deprecate-responsive-utility-classes.js';
import deprecateSizingClasses from './deprecate-sizing-classes.js';
import deprecateSpacingUtilityClasses from './deprecate-spacing-utility-classes.js';
import noPlaywrightStringTag from './no-playwright-string-tag.js';
import noTemplateInTranslatorContext from './no-template-in-translator-context.js';
import validateTtag from './validate-ttag.js';

export default {
    rules: {
        'date-formatting-locale': dateFormattingLocale,
        'deprecate-classes': deprecateClasses,
        'deprecate-responsive-utility-classes': deprecateResponsiveUtilityClasses,
        'deprecate-sizing-classes': deprecateSizingClasses,
        'deprecate-spacing-utility-classes': deprecateSpacingUtilityClasses,
        'no-playwright-string-tag': noPlaywrightStringTag,
        'no-template-in-translator-context': noTemplateInTranslatorContext,
        'validate-ttag': validateTtag,
    },
};
