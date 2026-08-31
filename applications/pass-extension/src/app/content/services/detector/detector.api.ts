/** Detection API facade backed by `@protontech/autofill`. Content-script code
 * must import detection utilities from this module: `injection-client-legacy`
 * layered bundles resolve it to `./detector.api-legacy` at build time (see
 * `webpack.config.ts`). Label enums come from `@protontech/autofill/types`. */
import { createRulesetRegistry } from '@protontech/autofill';
import { perceptronModelProvider } from '@protontech/autofill/models/perceptron';
import type { ModelProvider } from '@protontech/autofill/types';

export {
    clearDetectionCache,
    flagAsIgnored,
    flagOverride,
    flagSubtreeAsIgnored,
    formatExpirationDate,
    getCCFieldType,
    getExpirationFormat,
    getIdentityFieldType,
    getIgnoredParent,
    getInputExpirationMonthFormat,
    getInputExpirationYearFormat,
    getParentFormPrediction,
    getSelectExpirationMonthFormat,
    getSelectExpirationYearFormat,
    getTypeScore,
    isBtnCandidate,
    isCustomElementWithShadowRoot,
    isEditorFrame,
    isHidden,
    isIFrameField,
    isIgnored,
    isPrediction,
    isProcessed,
    isShadowRoot,
    isVisible,
    isVisibleForm,
    kButtonSelector,
    kButtonSubmitSelector,
    prepass,
    removeClassifierFlags,
    removeProcessedFlag,
    selectFormCandidates,
    selectInputCandidates,
    shadowPiercingContains,
    shallowShadowQuerySelector,
    shouldRunClassifier,
} from '@protontech/autofill';
export type { HTMLFieldElement } from '@protontech/autofill';
export type { Fnode } from '@protontech/fathom';

export const rulesetMaker = (runtime?: ModelProvider) =>
    runtime
        ? createRulesetRegistry({ runtime }).make('runtime')
        : createRulesetRegistry({ perceptron: perceptronModelProvider }).make('perceptron');
export const supportsRuntimeModel: boolean = true;
