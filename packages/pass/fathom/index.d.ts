import { Fnode, rule, ruleset } from './fathom.js';
import * as fathomWeb from './fathom.js';

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
    NOOP = 'noop',
    PASSWORD_CHANGE = 'password-change',
    RECOVERY = 'recovery',
    REGISTER = 'register',
}
declare enum FieldType {
    EMAIL = 'email',
    IDENTITY = 'identity',
    OTP = 'otp',
    PASSWORD_CURRENT = 'password',
    PASSWORD_NEW = 'new-password',
    USERNAME = 'username',
    USERNAME_HIDDEN = 'username-hidden',
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

declare const getTypeScore: (node: Fnode | null, type: string) => any;

declare const splitFieldsByVisibility: (els: HTMLElement[]) => [HTMLElement[], HTMLElement[]];
declare const maybeEmail: (value: Fnode) => boolean;
declare const maybePassword: (value: Fnode) => boolean;
declare const maybeOTP: (value: Fnode) => boolean;
declare const maybeUsername: (value: Fnode) => boolean;
declare const maybeHiddenUsername: (value: Fnode) => boolean;
declare const isUsernameCandidate: (el: HTMLElement) => boolean;
declare const isEmailCandidate: (el: HTMLElement) => boolean;
declare const isOAuthCandidate: (el: HTMLElement) => boolean;
declare const isBtnCandidate: (btn: HTMLElement) => boolean;
declare const isProcessableField: (input: HTMLInputElement) => boolean;
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
declare const removePredictionFlag: (el: HTMLElement) => boolean;
declare const getParentFormPrediction: (el?: HTMLElement) => HTMLElement | null;
declare const setCachedPredictionScore: (_el: HTMLElement, type: string, score: number) => void;
declare const getCachedPredictionScore: (type: string) => (fnode: Fnode) => number;
declare const isPredictedType: (type: string) => (fnode: Fnode) => boolean;
declare const isClassifiable: (el: HTMLElement) => boolean;
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

declare enum IdentityFieldType {
    FULLNAME = 1,
    FIRSTNAME = 2,
    MIDDLENAME = 3,
    LASTNAME = 4,
    TELEPHONE = 5,
    ADDRESS = 6,
    STATE = 7,
    CITY = 8,
    ZIPCODE = 9,
    ORGANIZATION = 10,
    COUNTRY = 11,
    EMAIL = 12,
}
declare const getIdentityHaystack: (input: HTMLInputElement) => string;
declare const getIdentityFieldType: (input: HTMLInputElement) => IdentityFieldType | undefined;
declare const maybeIdentity: (fnode: Fnode) => boolean;

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
    type AnyRule,
    type Bias,
    type BoundRuleset,
    type Coeff,
    EL_ATTRIBUTES,
    FIELD_ATTRIBUTES,
    FORM_ATTRIBUTES,
    FORM_CLUSTER_ATTR,
    FieldType,
    type FormInputIterator,
    FormType,
    IdentityFieldType,
    type Ruleset,
    type RulesetAggregation,
    TEXT_ATTRIBUTES,
    type Trainee,
    type TrainingResults,
    attrIgnored,
    buttonSelector,
    cacheContext,
    clearDetectionCache,
    clearVisibilityCache,
    createInputIterator,
    fieldTypes,
    flagAsHidden,
    flagAsIgnored,
    flagAsProcessed,
    flagCluster,
    flagSubtreeAsIgnored,
    formCandidateSelector,
    formTypes,
    getAttributes,
    getBaseAttributes,
    getCachedPredictionScore,
    getFieldAttributes,
    getFormAttributes,
    getFormParent,
    getIdentityFieldType,
    getIdentityHaystack,
    getIgnoredParent,
    getParentFormPrediction,
    getTextAttributes,
    getTypeScore,
    getVisibilityCache,
    inputCandidateSelector,
    isBtnCandidate,
    isClassifiable,
    isClassifiableField,
    isCluster,
    isEmailCandidate,
    isHidden,
    isIgnored,
    isOAuthCandidate,
    isPredictedType,
    isPrediction,
    isProcessableField,
    isProcessed,
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
    maybeIdentity,
    maybeOTP,
    maybePassword,
    maybeUsername,
    otpSelector,
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
    shouldRunClassifier,
    splitFieldsByVisibility,
    trainees,
};
