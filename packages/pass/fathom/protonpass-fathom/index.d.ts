import { Fnode, rule, ruleset } from './fathom.js';
import * as fathomWeb from './fathom.js';

export { fathomWeb as fathom };

type AnyRule = ReturnType<typeof rule>;
type Coeff = [string, number];
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

declare const isFormOfInterest: (fnodeOrEl: Fnode | HTMLElement) => boolean;
declare const getFormParent: (form: HTMLElement) => HTMLElement;
type FormInputIterator = ReturnType<typeof createInputIterator>;
declare const createInputIterator: (form: HTMLElement) => {
    prev(input: HTMLElement): HTMLElement | null;
    next(input: HTMLElement): HTMLElement | null;
};

declare const isFieldOfInterest: (fnodeOrEl: Fnode | HTMLElement) => boolean;
declare const isUserEditableField: (el: HTMLInputElement) => boolean;
declare const splitFieldsByVisibility: (els: HTMLElement[]) => [HTMLElement[], HTMLElement[]];
declare const maybeEmail: (fnode: Fnode) => boolean;
declare const maybePassword: (fnode: Fnode) => boolean;
declare const maybeOTP: (fnode: Fnode) => any;
declare const maybeUsername: (fnode: Fnode) => any;
declare const maybeHiddenUsername: (fnode: Fnode) => any;
declare const isUsernameCandidate: (el: HTMLElement) => boolean;
declare const isEmailCandidate: (el: HTMLElement) => boolean;
declare const isOAuthCandidate: (el: HTMLElement) => boolean;
declare const isSubmitBtnCandidate: (btn: HTMLElement) => boolean;

declare const formOfInterestSelector = 'form:not([role="search"]):not(body > form:only-of-type)';
declare const headingSelector: string;
declare const fieldSelector = 'input, select, textarea';
declare const editableFieldSelector: string;
declare const fieldOfInterestSelector: string;
declare const buttonSubmitSelector: string;
declare const anchorLinkSelector = 'a, span[role="button"]';
declare const captchaSelector = '[class*="captcha"], [id*="captcha"], [name*="captcha"]';
declare const socialSelector = '[class*=social],[aria-label*=with]';
declare const clusterSelector =
    '[role="dialog"], [role="group"], [role="form"], [id*="modal"], [class*="modal"], header, section, nav, footer, aside';
declare const layoutSelector = 'div, section, aside, main, nav';
declare const usernameSelector: string;
declare const passwordSelector: string;
declare const hiddenUsernameSelector = 'input[type="email"], input[type="text"], input[type="hidden"]';
declare const otpSelector = 'input[type="tel"], input[type="number"], input[type="text"], input:not([type])';

type VisibilityCache = WeakMap<HTMLElement, boolean>;
type IsVisibleOptions = {
    opacity: boolean;
};
declare const cacheContext: Record<string, VisibilityCache>;
declare const getVisibilityCache: (key: string) => VisibilityCache;
declare const clearVisibilityCache: () => void;
declare const isVisible: (fnodeOrElement: Fnode | HTMLElement, options: IsVisibleOptions) => boolean;
declare const isVisibleField: (field: HTMLElement) => boolean;
declare const isVisibleEl: (el: HTMLElement) => boolean;

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
declare const setInputType: (input: HTMLInputElement, type: string) => void;
declare const setFormType: (form: HTMLElement, type: string) => void;
declare const setClusterType: (el: HTMLElement) => void;
declare const setIgnoreType: (el: HTMLElement) => void;

export {
    DETECTED_CLUSTER_ATTR,
    DETECTED_FIELD_TYPE_ATTR,
    DETECTED_FORM_TYPE_ATTR,
    EL_ATTRIBUTES,
    FIELD_ATTRIBUTES,
    FORM_ATTRIBUTES,
    FormInputIterator,
    IGNORE_ELEMENT_ATTR,
    TEXT_ATTRIBUTES,
    anchorLinkSelector,
    buttonSubmitSelector,
    cacheContext,
    captchaSelector,
    clearVisibilityCache,
    clusterSelector,
    createInputIterator,
    editableFieldSelector,
    fieldOfInterestSelector,
    fieldSelector,
    formOfInterestSelector,
    getAttributes,
    getBaseAttributes,
    getFieldAttributes,
    getFormAttributes,
    getFormParent,
    getTextAttributes,
    getVisibilityCache,
    headingSelector,
    hiddenUsernameSelector,
    isEmailCandidate,
    isFieldOfInterest,
    isFormOfInterest,
    isOAuthCandidate,
    isSubmitBtnCandidate,
    isUserEditableField,
    isUsernameCandidate,
    isVisible,
    isVisibleEl,
    isVisibleField,
    layoutSelector,
    maybeEmail,
    maybeHiddenUsername,
    maybeOTP,
    maybePassword,
    maybeUsername,
    otpSelector,
    passwordSelector,
    rulesetMaker,
    setClusterType,
    setFormType,
    setIgnoreType,
    setInputType,
    socialSelector,
    splitFieldsByVisibility,
    trainees,
    usernameSelector,
};
