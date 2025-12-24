import { Fnode, rule, ruleset } from './fathom.js';
import * as fathomWeb from './fathom.js';
import { CCFieldType, FieldType, IdentityFieldType } from './labels.js';

export { fathomWeb as fathom };

declare const FORM_CLUSTER_ATTR = 'data-protonpass-form';
declare const kFieldSelector = 'input, select, textarea';
declare const kFieldLabelSelector = '[class*="label"], [id*="label"]';
declare const kEmailSelector = 'input[name="email"], input[id="email"], input[name="user_email"]';
declare const kPasswordSelector = 'input[type="password"], input[type="text"][id="password"]';
declare const kCaptchaSelector = '[class*="captcha"], [id*="captcha"], [name*="captcha"]';
declare const kSocialSelector = '[class*=social], [aria-label*=with]';
declare const kEditorElements: string[];
declare const kEditorPatterns: string[];
declare const kEditorSelector: string;
declare const kDomDialogSelector =
    '[role="dialog"], [role="tabpanel"], [role="group"], [role="form"], [id*="modal"], [class*="modal"]';
declare const kDomGroupSelector: string;
declare const kUsernameSelector: string;
declare const kHiddenUsernameSelector: string;
declare const kHeadingSelector: string;
declare const kButtonSubmitSelector: string;
declare const kLayoutSelector = 'div, section, aside, main, nav, label';
declare const kAnchorLinkSelector = 'a, [role="link"], span[role="button"]';
declare const formCandidateSelector: string;
declare const inputCandidateSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="checkbox"])';
declare const buttonSelector: string;

type AnyRule = ReturnType<typeof rule>;
type Ruleset = ReturnType<typeof ruleset>;
type BoundRuleset = ReturnType<Ruleset['against']>;
type Coeff = [string, number];
type Bias = [string, number];
type RulesetAggregation = {
    rules: AnyRule[];
    coeffs: Coeff[];
    biases: Bias[];
};
type TrainingResults = {
    coeffs: Coeff[];
    bias: number;
    cutoff: number;
};
type Trainee = TrainingResults & {
    name: string;
    getRules: () => AnyRule[];
};

declare const trainees: {
    forms: Record<string, Trainee>;
    fields: Record<string, Trainee>;
};
declare const rulesetMaker: () => ReturnType<typeof ruleset>;

declare const TEXT_ATTRIBUTES: string[];
declare const EL_ATTRIBUTES: string[];
declare const FORM_ATTRIBUTES: string[];
declare const FIELD_ATTRIBUTES: string[];
declare const getAttributes: (attributes: string[]) => (el: HTMLElement) => string[];
declare const getBaseAttributes: (el: HTMLElement) => string[];
declare const getTextAttributes: (el: HTMLElement) => string[];
declare const getFieldAttributes: (el: HTMLElement) => string[];
declare const getFormAttributes: (el: HTMLElement) => string[];

type CCFieldElement = HTMLInputElement | HTMLSelectElement;
type CCExpirationMonthFormat = {
    padding: boolean;
};
type CCExpirationYearFormat = {
    fullYear: boolean;
};
type CCExpirationFormat = {
    separator: string;
    fullYear: boolean;
    monthFirst: boolean;
};
type CCFieldMatchParams = {
    visible: boolean;
};
declare const CC_ATTRIBUTES: string[];
declare const CC_INPUT_TYPES: string[];
declare const getExpirationFormat: (field: HTMLElement, allowFallback?: boolean) => CCExpirationFormat | undefined;
declare const formatExpirationDate: (
    month: string,
    year: string,
    { fullYear, separator, monthFirst }: CCExpirationFormat
) => string;
declare const getInputExpirationMonthFormat: (input: HTMLInputElement) => CCExpirationMonthFormat;
declare const getInputExpirationYearFormat: (input: HTMLInputElement) => CCExpirationYearFormat;
declare const getSelectExpirationYearFormat: (select: HTMLSelectElement) => CCExpirationYearFormat | undefined;
declare const getSelectExpirationMonthFormat: (select: HTMLSelectElement) => CCExpirationMonthFormat | undefined;
declare const getCCHaystack: (field: HTMLElement) => string;
declare const getCachedCCSubtype: (el: HTMLElement) => CCFieldType | undefined;
declare const getCCFieldType: (field: CCFieldElement) => CCFieldType | undefined;
declare const matchCCFieldCandidate: (input: HTMLInputElement, { visible }: CCFieldMatchParams) => boolean;
declare const isCCInputField: (fnode: Fnode) => boolean;
declare const isCCSelectField: (fnode: Fnode) => boolean;

declare const getTypeScore: (node: Fnode | null, type: string) => any;
type FormClassification = {
    login: boolean;
    register: boolean;
    pwChange: boolean;
    recovery: boolean;
    noop: boolean;
};

type HTMLFieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
declare const splitFieldsByVisibility: (els: HTMLElement[]) => [HTMLElement[], HTMLElement[]];
declare const fType: (type: FieldType) => (fnode: Fnode) => boolean;
declare const maybeEmail: (value: Fnode) => boolean;
declare const maybePassword: (value: Fnode) => boolean;
declare const maybeOTP: (value: Fnode) => boolean;
declare const maybeUsername: (value: Fnode) => boolean;
declare const maybeHiddenUsername: (value: Fnode) => boolean;
declare const isUsernameCandidate: (el: HTMLInputElement) => boolean;
declare const isEmailCandidate: (el: HTMLInputElement) => boolean;
declare const isOAuthCandidate: (el: HTMLElement) => boolean;
declare const isMFACandidate: (el: HTMLFieldElement) => boolean;
declare const isBtnCandidate: (btn: HTMLElement) => boolean;
declare const isProcessableField: (input: HTMLElement) => boolean;
declare const isClassifiableField: (fnode: Fnode) => boolean;
declare const selectInputCandidates: (target?: Document | HTMLElement) => HTMLInputElement[];

declare const isCluster: (el: HTMLElement) => boolean;
declare const flagCluster: (el: HTMLElement) => void;
declare const isHidden: (el: HTMLElement) => boolean;
declare const flagAsHidden: (el: HTMLElement) => boolean;
declare const removeHiddenFlag: (el: HTMLElement) => boolean;
declare const attrIgnored: (el: HTMLElement) => boolean;
declare const isIgnored: (el: HTMLElement) => boolean;
declare const getIgnoredParent: (el?: HTMLElement) => HTMLElement | null;
declare const flagAsIgnored: (el: HTMLElement) => boolean;
declare const removeIgnoredFlag: (el: HTMLElement) => boolean;
declare const flagSubtreeAsIgnored: (el: HTMLElement) => void;
declare const isProcessed: (el: HTMLElement) => boolean;
declare const flagAsProcessed: (el: HTMLElement) => boolean;
declare const removeProcessedFlag: (el: HTMLElement) => boolean;
declare const isPrediction: (el: HTMLElement) => boolean;
declare const removePredictionFlag: (el: HTMLElement) => void;
declare const getParentFormPrediction: (el?: HTMLElement) => HTMLElement | null;
declare const setCachedSubType: (_el: HTMLElement, subType: string) => void;
declare const getCachedSubType: (el: HTMLElement) => string | undefined;
declare const matchPredictedType: (type: string) => (str: string) => boolean;
declare const setCachedPredictionScore: (_el: HTMLElement, type: string, score: number) => void;
declare const getCachedPredictionScore: (type: string) => (fnode: Fnode) => number;
declare const isPredictedType: (type: string) => (fnode: Fnode) => boolean;
declare const isPredictedForm: (value: Fnode) => boolean;
declare const isPredictedField: (value: Fnode) => boolean;
declare const isClassifiable: (el: HTMLElement) => boolean;
declare const removeClassifierFlags: (
    target: HTMLElement,
    options: {
        preserveIgnored: boolean;
        fields?: HTMLElement[];
    }
) => void;

declare const getFormParent: (form: HTMLElement) => HTMLElement;
type FormInputIterator = ReturnType<typeof createInputIterator>;
declare const createInputIterator: (form: HTMLElement) => {
    prev(input: HTMLElement): HTMLElement | null;
    next(input: HTMLElement): HTMLElement | null;
};
declare const selectFormCandidates: (root?: Document | HTMLElement) => HTMLElement[];

type IdentityFieldMatchParams = {
    form: FormClassification;
    searchField: boolean;
    type: string | null;
    visible: boolean;
};
declare const getCachedIdentitySubType: (el: HTMLElement) => IdentityFieldType | undefined;
declare const getIdentityHaystack: (input: HTMLInputElement) => string;
declare const getIdentityFieldType: (input: HTMLInputElement) => IdentityFieldType | undefined;
declare const matchIdentityField: (input: HTMLInputElement, { visible }: IdentityFieldMatchParams) => boolean;
declare const isIdentity: (fnode: Fnode) => boolean;

declare const isIFrameField: (iframe: HTMLIFrameElement) => boolean;
declare const isEditorFrame: () => boolean;

type Override = {
    form: HTMLElement;
    formType: string;
    fields: {
        field: HTMLElement;
        fieldType: string;
    }[];
};
declare const OVERRIDE_FORMS: Set<HTMLElement>;
declare const OVERRIDE_FIELDS: Set<HTMLElement>;
declare const addFormOverride: (el: HTMLElement) => Set<HTMLElement>;
declare const addFieldOverride: (el: HTMLElement) => Set<HTMLElement>;
declare const clearOverrides: () => void;
declare const getOverridableForms: () => HTMLElement[];
declare const getOverridableFields: () => HTMLElement[];
declare const overrides: AnyRule[];
declare const flagOverride: ({ form, formType, fields }: Override) => void;

declare const prepass: (doc?: Document) => void;
declare const shouldRunClassifier: () => boolean;

declare const isShadowRoot: (el: Node) => el is ShadowRoot;
declare const isShadowElement: (el: Node) => boolean;
declare const isCustomElementWithShadowRoot: (el: Element) => el is HTMLElement & {
    shadowRoot: ShadowRoot;
};
declare const shadowPiercingAncestors: (element: Node) => Generator<Node, void, unknown>;
declare const shadowPiercingContains: (container: HTMLElement | Document, el: HTMLElement) => boolean;
declare const shallowShadowQuerySelector: (el: HTMLElement | Document, selector: string) => HTMLElement | null;

type VisibilityCache = WeakMap<HTMLElement, boolean>;
type IsVisibleOptions = {
    opacity: boolean;
    skipCache?: boolean;
};
declare const cacheContext: Record<string, VisibilityCache>;
declare const getVisibilityCache: (key: string) => VisibilityCache;
declare const clearVisibilityCache: () => void;
declare const isVisible: (fnodeOrElement: Fnode | HTMLElement, options: IsVisibleOptions) => boolean;
declare const isVisibleEl: (el: HTMLElement) => boolean;
declare const isVisibleForm: (form: HTMLElement, options?: Partial<Pick<IsVisibleOptions, 'skipCache'>>) => boolean;
declare const isVisibleField: (field: HTMLElement) => boolean;

declare const clearDetectionCache: () => void;

export {
    type AnyRule,
    type Bias,
    type BoundRuleset,
    type CCExpirationFormat,
    type CCExpirationMonthFormat,
    type CCExpirationYearFormat,
    type CCFieldElement,
    CC_ATTRIBUTES,
    CC_INPUT_TYPES,
    type Coeff,
    EL_ATTRIBUTES,
    FIELD_ATTRIBUTES,
    FORM_ATTRIBUTES,
    FORM_CLUSTER_ATTR,
    type FormInputIterator,
    type HTMLFieldElement,
    OVERRIDE_FIELDS,
    OVERRIDE_FORMS,
    type Ruleset,
    type RulesetAggregation,
    TEXT_ATTRIBUTES,
    type Trainee,
    type TrainingResults,
    addFieldOverride,
    addFormOverride,
    attrIgnored,
    buttonSelector,
    cacheContext,
    clearDetectionCache,
    clearOverrides,
    clearVisibilityCache,
    createInputIterator,
    fType,
    flagAsHidden,
    flagAsIgnored,
    flagAsProcessed,
    flagCluster,
    flagOverride,
    flagSubtreeAsIgnored,
    formCandidateSelector,
    formatExpirationDate,
    getAttributes,
    getBaseAttributes,
    getCCFieldType,
    getCCHaystack,
    getCachedCCSubtype,
    getCachedIdentitySubType,
    getCachedPredictionScore,
    getCachedSubType,
    getExpirationFormat,
    getFieldAttributes,
    getFormAttributes,
    getFormParent,
    getIdentityFieldType,
    getIdentityHaystack,
    getIgnoredParent,
    getInputExpirationMonthFormat,
    getInputExpirationYearFormat,
    getOverridableFields,
    getOverridableForms,
    getParentFormPrediction,
    getSelectExpirationMonthFormat,
    getSelectExpirationYearFormat,
    getTextAttributes,
    getTypeScore,
    getVisibilityCache,
    inputCandidateSelector,
    isBtnCandidate,
    isCCInputField,
    isCCSelectField,
    isClassifiable,
    isClassifiableField,
    isCluster,
    isCustomElementWithShadowRoot,
    isEditorFrame,
    isEmailCandidate,
    isHidden,
    isIFrameField,
    isIdentity,
    isIgnored,
    isMFACandidate,
    isOAuthCandidate,
    isPredictedField,
    isPredictedForm,
    isPredictedType,
    isPrediction,
    isProcessableField,
    isProcessed,
    isShadowElement,
    isShadowRoot,
    isUsernameCandidate,
    isVisible,
    isVisibleEl,
    isVisibleField,
    isVisibleForm,
    kAnchorLinkSelector,
    kButtonSubmitSelector,
    kCaptchaSelector,
    kDomDialogSelector,
    kDomGroupSelector,
    kEditorElements,
    kEditorPatterns,
    kEditorSelector,
    kEmailSelector,
    kFieldLabelSelector,
    kFieldSelector,
    kHeadingSelector,
    kHiddenUsernameSelector,
    kLayoutSelector,
    kPasswordSelector,
    kSocialSelector,
    kUsernameSelector,
    matchCCFieldCandidate,
    matchIdentityField,
    matchPredictedType,
    maybeEmail,
    maybeHiddenUsername,
    maybeOTP,
    maybePassword,
    maybeUsername,
    overrides,
    prepass,
    removeClassifierFlags,
    removeHiddenFlag,
    removeIgnoredFlag,
    removePredictionFlag,
    removeProcessedFlag,
    rulesetMaker,
    selectFormCandidates,
    selectInputCandidates,
    setCachedPredictionScore,
    setCachedSubType,
    shadowPiercingAncestors,
    shadowPiercingContains,
    shallowShadowQuerySelector,
    shouldRunClassifier,
    splitFieldsByVisibility,
    trainees,
};
