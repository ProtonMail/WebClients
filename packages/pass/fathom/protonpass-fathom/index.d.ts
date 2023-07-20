import { Fnode, rule, ruleset } from './fathom.js';
import * as fathomWeb from './fathom.js';

export { fathomWeb as fathom };

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

declare const trainees: {
    forms: Record<string, Trainee>;
    fields: Record<string, Trainee>;
};
declare const rulesetMaker: () => ReturnType<typeof ruleset>;

declare const getFormParent: (form: HTMLElement) => HTMLElement;
type FormInputIterator = ReturnType<typeof createInputIterator>;
declare const createInputIterator: (form: HTMLElement) => {
    prev(input: HTMLElement): HTMLElement | null;
    next(input: HTMLElement): HTMLElement | null;
};
declare const getFormClassification: (formFnode: Fnode | null) => {
    login: boolean;
    register: boolean;
    pwChange: boolean;
    recovery: boolean;
    mfa: boolean;
    noop: boolean;
};
declare const isNoopForm: (formFnode: Fnode) => boolean;

declare const isActiveField: (el: HTMLInputElement) => boolean;
declare const splitFieldsByVisibility: (els: HTMLElement[]) => [HTMLElement[], HTMLElement[]];
declare const maybeEmail: (fnode: Fnode) => boolean;
declare const maybePassword: (fnode: Fnode) => boolean;
declare const maybeOTP: (fnode: Fnode) => boolean;
declare const maybeUsername: (fnode: Fnode) => boolean;
declare const maybeHiddenUsername: (fnode: Fnode) => any;
declare const isUsernameCandidate: (el: HTMLElement) => boolean;
declare const isEmailCandidate: (el: HTMLElement) => boolean;
declare const isOAuthCandidate: (el: HTMLElement) => boolean;
declare const isSubmitBtnCandidate: (btn: HTMLElement) => boolean;

declare const headingSelector: string;
declare const fieldSelector = 'input, select, textarea';
declare const inputSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="checkbox"])';
declare const buttonSubmitSelector: string;
declare const buttonSelector: string;
declare const anchorLinkSelector = 'a, span[role="button"]';
declare const captchaSelector = '[class*="captcha"], [id*="captcha"], [name*="captcha"]';
declare const socialSelector = '[class*=social],[aria-label*=with]';
declare const domGroupSelector =
    '[role="dialog"], [role="tabpanel"], [role="group"], [role="form"], [id*="modal"], [class*="modal"], header, section, nav, footer, aside';
declare const layoutSelector = 'div, section, aside, main, nav';
declare const passwordSelector: string;
declare const hiddenUsernameSelector = '[type="email"], [type="text"], [type="hidden"]';
declare const otpSelector = '[type="tel"], [type="number"], [type="text"], input:not([type])';
declare const unprocessedFormFilter: string;
declare const unprocessedFieldFilter: string;
declare const danglingFieldFilter: string;
declare const detectedSelector: string;
declare const detectedFormSelector: string;
declare const preDetectedClusterSelector: string;
declare const ignoredSelector: string;

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

declare const TEXT_ATTRIBUTES: string[];
declare const EL_ATTRIBUTES: string[];
declare const FORM_ATTRIBUTES: string[];
declare const FIELD_ATTRIBUTES: string[];
declare const getAttributes: (attributes: string[]) => (el: HTMLElement) => string[];
declare const getBaseAttributes: (el: HTMLElement) => string[];
declare const getTextAttributes: (el: HTMLElement) => string[];
declare const getFieldAttributes: (el: HTMLElement) => string[];
declare const getFormAttributes: (el: HTMLElement) => string[];
declare const DETECTED_FIELD_TYPE_ATTR = 'data-protonpass-field-type';
declare const DETECTED_FORM_TYPE_ATTR = 'data-protonpass-form-type';
declare const DETECTED_CLUSTER_ATTR = 'data-protonpass-cluster';
declare const IGNORE_ELEMENT_ATTR = 'data-protonpass-ignore';
declare const PROCESSED_FORM_ATTR = 'data-protonpass-form';
declare const PROCESSED_FIELD_ATTR = 'data-protonpass-field';

declare const withIgnoreFlag: <T extends HTMLElement, R extends any[]>(
    predicate: (el: T, ...args: R) => boolean
) => (el: T, ...args: R) => boolean;
declare const setIgnoreFlag: (el: HTMLElement) => void;
declare const getIgnoredParent: (el?: HTMLElement) => HTMLElement | null | undefined;
declare const setClusterFlag: (el: HTMLElement) => void;
declare const setFormProcessed: (el: HTMLElement) => void;
declare const setFieldProcessed: (el: HTMLInputElement) => void;
declare const setFieldProcessable: (field: HTMLElement) => void;
declare const setFormProcessable: (form: HTMLElement) => void;
declare const resetFieldFlags: (field: HTMLElement) => void;
declare const resetFormFlags: (form: HTMLElement) => void;
declare const isFormProcessed: (form: HTMLElement) => boolean;
declare const isFieldProcessed: (field: HTMLElement) => boolean;
declare const processFormEffect: (fnode: Fnode) => Fnode;
declare const processFieldEffect: (fnode: Fnode) => Fnode;
declare const setFieldType: (element: HTMLElement, value: string) => void;
declare const setFormType: (element: HTMLElement, value: string) => void;
declare const getDetectedFormParent: (el?: HTMLElement) => HTMLElement | null | undefined;
declare const typeFormEffect: (type: string) => (fnode: Fnode) => Fnode;
declare const typeFieldEffect: (type: string) => (fnode: Fnode) => Fnode;

declare const inputFilter: (input: HTMLInputElement) => boolean;
declare const fieldFilter: (fnode: Fnode) => boolean;
declare const selectInputs: ((root?: Document | HTMLElement) => HTMLInputElement[]) & {
    clearCache: () => void;
};
declare const selectUnprocessedInputs: (target?: Document | HTMLElement) => HTMLInputElement[];
declare const selectDanglingInputs: (target?: Document | HTMLElement) => HTMLInputElement[];

declare const formFilter: (form: HTMLElement) => boolean;
declare const selectForms: ((root?: Document | HTMLElement) => HTMLFormElement[]) & {
    clearCache: () => void;
};
declare const selectAllForms: (doc?: Document) => HTMLElement[];
declare const selectUnprocessedForms: (target?: Document) => HTMLElement[];

declare const clearDetectionCache: () => void;

export {
    AnyRule,
    Bias,
    BoundRuleset,
    Coeff,
    DETECTED_CLUSTER_ATTR,
    DETECTED_FIELD_TYPE_ATTR,
    DETECTED_FORM_TYPE_ATTR,
    EL_ATTRIBUTES,
    FIELD_ATTRIBUTES,
    FORM_ATTRIBUTES,
    FieldType,
    FormInputIterator,
    FormType,
    IGNORE_ELEMENT_ATTR,
    PROCESSED_FIELD_ATTR,
    PROCESSED_FORM_ATTR,
    Ruleset,
    RulesetAggregation,
    TEXT_ATTRIBUTES,
    Trainee,
    TrainingResults,
    anchorLinkSelector,
    buttonSelector,
    buttonSubmitSelector,
    cacheContext,
    captchaSelector,
    clearDetectionCache,
    clearVisibilityCache,
    createInputIterator,
    danglingFieldFilter,
    detectedFormSelector,
    detectedSelector,
    domGroupSelector,
    fieldFilter,
    fieldSelector,
    formFilter,
    getAttributes,
    getBaseAttributes,
    getDetectedFormParent,
    getFieldAttributes,
    getFormAttributes,
    getFormClassification,
    getFormParent,
    getIgnoredParent,
    getTextAttributes,
    getVisibilityCache,
    headingSelector,
    hiddenUsernameSelector,
    ignoredSelector,
    inputFilter,
    inputSelector,
    isActiveField,
    isEmailCandidate,
    isFieldProcessed,
    isFormProcessed,
    isNoopForm,
    isOAuthCandidate,
    isSubmitBtnCandidate,
    isUsernameCandidate,
    isVisible,
    isVisibleEl,
    isVisibleField,
    isVisibleForm,
    layoutSelector,
    maybeEmail,
    maybeHiddenUsername,
    maybeOTP,
    maybePassword,
    maybeUsername,
    otpSelector,
    passwordSelector,
    preDetectedClusterSelector,
    processFieldEffect,
    processFormEffect,
    resetFieldFlags,
    resetFormFlags,
    rulesetMaker,
    selectAllForms,
    selectDanglingInputs,
    selectForms,
    selectInputs,
    selectUnprocessedForms,
    selectUnprocessedInputs,
    setClusterFlag,
    setFieldProcessable,
    setFieldProcessed,
    setFieldType,
    setFormProcessable,
    setFormProcessed,
    setFormType,
    setIgnoreFlag,
    socialSelector,
    splitFieldsByVisibility,
    trainees,
    typeFieldEffect,
    typeFormEffect,
    unprocessedFieldFilter,
    unprocessedFormFilter,
    withIgnoreFlag,
};
