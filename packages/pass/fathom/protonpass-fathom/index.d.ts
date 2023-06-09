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

declare const formOfInterestSelector = 'form:not([role="search"])';
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
declare const hiddenUsernameSelector = 'input[type="email"], input[type="text"], input[type="hidden"]';
declare const otpSelector = 'input[type="tel"], input[type="number"], input[type="text"], input:not([type])';

export {
    FormInputIterator,
    anchorLinkSelector,
    buttonSubmitSelector,
    captchaSelector,
    clusterSelector,
    createInputIterator,
    editableFieldSelector,
    fieldOfInterestSelector,
    fieldSelector,
    formOfInterestSelector,
    getFormParent,
    headingSelector,
    hiddenUsernameSelector,
    isEmailCandidate,
    isFormOfInterest,
    isOAuthCandidate,
    isSubmitBtnCandidate,
    isUserEditableField,
    isUsernameCandidate,
    layoutSelector,
    maybeEmail,
    maybeHiddenUsername,
    maybeOTP,
    maybePassword,
    maybeUsername,
    otpSelector,
    rulesetMaker,
    socialSelector,
    splitFieldsByVisibility,
    trainees,
    usernameSelector,
};
