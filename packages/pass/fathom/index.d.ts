import * as fathomWeb from './fathom.js';
import { Fnode, rule, ruleset } from './fathom.js';

export { fathomWeb as fathom };

declare const FORM_CLUSTER_ATTR = 'data-protonpass-form';
declare const kFieldSelector = 'input, select, textarea';
declare const kEmailSelector = 'input[name="email"], input[id="email"]';
declare const kPasswordSelector = 'input[type="password"], input[type="text"][id="password"]';
declare const kCaptchaSelector = '[class*="captcha"], [id*="captcha"], [name*="captcha"]';
declare const kSocialSelector = '[class*=social], [aria-label*=with]';
declare const kEditorSelector =
    'div[class*="editor" i], div[id*="editor" i], div[class*="composer" i], div[id*="composer" i]';
declare const kDomGroupSelector =
    '[role="dialog"], [role="tabpanel"], [role="group"], [role="form"], [id*="modal"], [class*="modal"], header, section, nav, footer, aside';
declare const kUsernameSelector: string;
declare const kHiddenUsernameSelector: string;
declare const kHeadingSelector: string;
declare const kButtonSubmitSelector: string;
declare const kLayoutSelector = 'div, section, aside, main, nav';
declare const kAnchorLinkSelector = 'a, span[role="button"]';
declare const formCandidateSelector: string;
declare const inputCandidateSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="checkbox"])';
declare const buttonSelector: string;
declare const otpSelector = '[type="tel"], [type="number"], [type="text"], input:not([type])';

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
declare enum FormType {
    LOGIN = 'login',
    REGISTER = 'register',
    PASSWORD_CHANGE = 'password-change',
    RECOVERY = 'recovery',
    MFA = 'mfa',
    NOOP = 'noop',
}
declare enum FieldType {
    EMAIL = 'email',
    USERNAME = 'username',
    USERNAME_HIDDEN = 'username-hidden',
    PASSWORD_CURRENT = 'password',
    PASSWORD_NEW = 'new-password',
    OTP = 'otp',
}
declare const formTypes: FormType[];
declare const fieldTypes: FieldType[];

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

declare const splitFieldsByVisibility: (els: HTMLElement[]) => [HTMLElement[], HTMLElement[]];
declare const maybeEmail: (fnode: Fnode) => boolean;
declare const maybePassword: (fnode: Fnode) => boolean;
declare const maybeOTP: (fnode: Fnode) => boolean;
declare const maybeUsername: (fnode: Fnode) => boolean;
declare const maybeHiddenUsername: (fnode: Fnode) => boolean;
declare const isUsernameCandidate: (el: HTMLElement) => boolean;
declare const isEmailCandidate: (el: HTMLElement) => boolean;
declare const isOAuthCandidate: (el: HTMLElement) => boolean;
declare const isSubmitBtnCandidate: (btn: HTMLElement) => boolean;
declare const isProcessableField: (input: HTMLInputElement) => boolean;
declare const isClassifiableField: (fnode: Fnode) => boolean;
declare const selectInputCandidates: (target?: Document | HTMLElement) => HTMLInputElement[];

declare const isCluster: (el: HTMLElement) => boolean;
declare const flagCluster: (el: HTMLElement) => void;
declare const isIgnored: (el: HTMLElement) => boolean;
declare const getIgnoredParent: (el?: HTMLElement) => HTMLElement | null;
declare const flagAsIgnored: (el: HTMLElement) => boolean;
declare const removeIgnoredFlag: (el: HTMLElement) => boolean;
declare const flagSubtreeAsIgnored: (el: HTMLElement) => void;
declare const isProcessed: (el: HTMLElement) => boolean;
declare const flagAsProcessed: (el: HTMLElement) => boolean;
declare const removeProcessedFlag: (el: HTMLElement) => boolean;
declare const isPrediction: (el: HTMLElement) => boolean;
declare const removePredictionFlag: (el: HTMLElement) => boolean;
declare const getParentFormPrediction: (el?: HTMLElement) => HTMLElement | null;
declare const setPrediction: (_el: HTMLElement, type: string) => void;
declare const isPredictedType: (type: string) => (fnode: Fnode) => boolean;
declare const isClassifiable: (form: HTMLElement) => boolean;
declare const removeClassifierFlags: (
    el: HTMLElement,
    options: {
        preserveIgnored: boolean;
    }
) => void;

declare const getFormParent: (form: HTMLElement) => HTMLElement;
type FormInputIterator = ReturnType<typeof createInputIterator>;
declare const createInputIterator: (form: HTMLElement) => {
    prev(input: HTMLElement): HTMLElement | null;
    next(input: HTMLElement): HTMLElement | null;
};
declare const selectFormCandidates: (root?: Document | HTMLElement) => HTMLElement[];

declare const prepass: (doc?: Document) => void;
declare const shouldRunClassifier: () => boolean;

type VisibilityCache = WeakMap<HTMLElement, boolean>;
type IsVisibleOptions = {
    opacity: boolean;
};
declare const cacheContext: Record<string, VisibilityCache>;
declare const getVisibilityCache: (key: string) => VisibilityCache;
declare const clearVisibilityCache: () => void;
declare const isVisible: (fnodeOrElement: Fnode | HTMLElement, options: IsVisibleOptions) => boolean;
declare const isVisibleEl: (el: HTMLElement) => boolean;
declare const isVisibleForm: (form: HTMLElement) => boolean;
declare const isVisibleField: (field: HTMLElement) => boolean;

declare const clearDetectionCache: () => void;

export {
    EL_ATTRIBUTES,
    FIELD_ATTRIBUTES,
    FORM_ATTRIBUTES,
    FORM_CLUSTER_ATTR,
    FieldType,
    FormType,
    TEXT_ATTRIBUTES,
    buttonSelector,
    cacheContext,
    clearDetectionCache,
    clearVisibilityCache,
    createInputIterator,
    fieldTypes,
    flagAsIgnored,
    flagAsProcessed,
    flagCluster,
    flagSubtreeAsIgnored,
    formCandidateSelector,
    formTypes,
    getAttributes,
    getBaseAttributes,
    getFieldAttributes,
    getFormAttributes,
    getFormParent,
    getIgnoredParent,
    getParentFormPrediction,
    getTextAttributes,
    getVisibilityCache,
    inputCandidateSelector,
    isClassifiable,
    isClassifiableField,
    isCluster,
    isEmailCandidate,
    isIgnored,
    isOAuthCandidate,
    isPredictedType,
    isPrediction,
    isProcessableField,
    isProcessed,
    isSubmitBtnCandidate,
    isUsernameCandidate,
    isVisible,
    isVisibleEl,
    isVisibleField,
    isVisibleForm,
    kAnchorLinkSelector,
    kButtonSubmitSelector,
    kCaptchaSelector,
    kDomGroupSelector,
    kEditorSelector,
    kEmailSelector,
    kFieldSelector,
    kHeadingSelector,
    kHiddenUsernameSelector,
    kLayoutSelector,
    kPasswordSelector,
    kSocialSelector,
    kUsernameSelector,
    maybeEmail,
    maybeHiddenUsername,
    maybeOTP,
    maybePassword,
    maybeUsername,
    otpSelector,
    prepass,
    removeClassifierFlags,
    removeIgnoredFlag,
    removePredictionFlag,
    removeProcessedFlag,
    rulesetMaker,
    selectFormCandidates,
    selectInputCandidates,
    setPrediction,
    shouldRunClassifier,
    splitFieldsByVisibility,
    trainees,
    type AnyRule,
    type Bias,
    type BoundRuleset,
    type Coeff,
    type FormInputIterator,
    type Ruleset,
    type RulesetAggregation,
    type Trainee,
    type TrainingResults,
};
