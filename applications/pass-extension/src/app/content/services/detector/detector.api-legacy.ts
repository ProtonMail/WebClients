/** Legacy counterpart of `./detector.api` backed by `@proton/pass/fathom`.
 * Swapped in for `injection-client-legacy` layered bundles at build time (see
 * `webpack.config.ts`). The `LegacyApiContract` assertion below turns any API
 * drift between the two stacks into a compile error. */
import type {
    getCCFieldType as getCCFieldTypeML,
    getIdentityFieldType as getIdentityFieldTypeML,
    getTypeScore as getTypeScoreML,
    isVisible as isVisibleML,
} from '@protontech/autofill';

import {
    getCCFieldType as legacyGetCCFieldType,
    getIdentityFieldType as legacyGetIdentityFieldType,
    getTypeScore as legacyGetTypeScore,
    isVisible as legacyIsVisible,
    rulesetMaker as legacyRulesetMaker,
} from '@proton/pass/fathom';

import type * as DetectorApi from './detector.api';
import type * as DetectorApiLegacy from './detector.api-legacy';

export {
    clearDetectionCache,
    flagAsIgnored,
    flagOverride,
    flagSubtreeAsIgnored,
    formatExpirationDate,
    getExpirationFormat,
    getIgnoredParent,
    getInputExpirationMonthFormat,
    getInputExpirationYearFormat,
    getParentFormPrediction,
    getSelectExpirationMonthFormat,
    getSelectExpirationYearFormat,
    isBtnCandidate,
    isCustomElementWithShadowRoot,
    isEditorFrame,
    isHidden,
    isIFrameField,
    isIgnored,
    isPrediction,
    isProcessed,
    isShadowRoot,
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
} from '@proton/pass/fathom';
export type { HTMLFieldElement } from '@protontech/autofill';
export type { Fnode } from '@protontech/fathom';

/** Legacy label enums are runtime-identical to `@protontech/autofill/types`
 * but nominally distinct for TS: re-typed against the ML signatures. */
export const getCCFieldType = legacyGetCCFieldType as unknown as typeof getCCFieldTypeML;
export const getIdentityFieldType = legacyGetIdentityFieldType as unknown as typeof getIdentityFieldTypeML;

/** The two `Fnode`/`Ruleset` classes are structurally distinct but runtime
 * compatible for the detector's usage: re-typed against the ML signatures. */
export const isVisible = legacyIsVisible as unknown as typeof isVisibleML;
export const getTypeScore = legacyGetTypeScore as unknown as typeof getTypeScoreML;
export const rulesetMaker = legacyRulesetMaker as unknown as typeof DetectorApi.rulesetMaker;
/** `legacyRulesetMaker` takes no arguments and always builds the heuristic-only ruleset — it cannot honor a runtime `ModelProvider`, unlike `./detector.api`. */
export const supportsRuntimeModel: boolean = false;

/** Compile-time check: this surface must stay assignable to `./detector.api` */
type AssertAssignable<T extends typeof DetectorApi> = T;
export type LegacyApiContract = AssertAssignable<typeof DetectorApiLegacy>;
