import { clusters as clusters$1, dom, domQuery, out, rule, ruleset, score, type, utils } from './fathom.js';
import * as fathomWeb from './fathom.js';

export { fathomWeb as fathom };

const sanitizeString = (str) =>
    str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\d\[\]]/g, '');

const TEXT_ATTRIBUTES = [
    'title',
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'placeholder',
    'autocomplete',
    'legend',
];

const EL_ATTRIBUTES = [
    'id',
    'class',
    'role',
    'jsaction',
    'ng-controller',
    'data-bind',
    'ng-model',
    'v-model',
    'v-bind',
    'data-testid',
    'href',
];

const FORM_ATTRIBUTES = [EL_ATTRIBUTES, 'name', 'action'].flat();

const FIELD_ATTRIBUTES = [EL_ATTRIBUTES, 'name', 'value'].flat();

const getAttributes = (attributes) => (el) =>
    attributes
        .filter((key) => key !== 'data-fathom')
        .map((attr) => el.getAttribute(attr))
        .filter(Boolean)
        .map(sanitizeString);

const getBaseAttributes = getAttributes(EL_ATTRIBUTES);

const getTextAttributes = getAttributes(TEXT_ATTRIBUTES);

const getFieldAttributes = getAttributes(FIELD_ATTRIBUTES);

const getFormAttributes = getAttributes(FORM_ATTRIBUTES);

const MAX_FORM_FIELD_WALK_UP = 5;

const MAX_FORM_HEADING_WALK_UP = 5;

const MAX_CLUSTER_SPLIT_DISTANCE = 400;

const MAX_VISIBILITY_WALK_UP = 3;

const MIN_AREA_SUBMIT_BTN = 3500;

const MIN_FIELD_HEIGHT = 15;

const MIN_FIELD_WIDTH = 50;

const OTP_PATTERNS = ['d*', 'd{6}', '[0-9]*', '[0-9]{6}', '([0-9]{6})|([0-9a-fA-F]{5}-?[0-9a-fA-F]{5})'];

const LOGIN_RE =
    /(?:(?:n(?:ouvelleses|uevase|ewses)s|iniciarses|connex)io|anmeldedate|sign[io])n|in(?:iciarsessao|troduce)|a(?:uthenticate|nmeld(?:ung|en))|authentifier|s(?:econnect|identifi)er|novasessao|(?:introduci|conecta|entr[ae])r|connect|acceder|login/i;

const REGISTER_RE =
    /kontoerstellen|cr(?:ea(?:teaccount|rcuenta)|iarconta)|(?:nouveaucompt|creeruncompt|s?inscrir|unirs)e|re(?:gist(?:r(?:ieren|arse|ar)|er)|joindre)|nuevacuenta|neueskonto|getstarted|newaccount|novaconta|(?:com(?:mence|eca)|(?:empez|junt)a)r|signup|join/i;

const RECOVERY_RE =
    /(?:wiederherstell|zurucksetz)en|re(?:(?:initialis|stablec)er|(?:defini|staur[ae])r|c(?:uper[ae]|ove)r|set)|problem|(?:troubl|restor|aid)e|a[jy]uda|h(?:ilfe|elp)/i;

const MULTI_STEP_RE =
    /p(?:rogres(?:s(?:ion|o)|o)|aso)|fortschritt|progress|s(?:chritt|t(?:age|ep))|review|etap[ae]|phase/i;

const TROUBLE_RE =
    /schwierigkeit|(?:difficult|troubl|oubli|hilf)e|i(?:nciden(?:cia|t)|ssue)|vergessen|esquecido|olvidado|needhelp|questao|problem|forgot|ayuda/i;

const PASSWORD_RE =
    /p(?:hrasesecrete|ass(?:(?:phras|cod)e|wor[dt]))|(?:c(?:havesecret|lavesecret|ontrasen)|deseguranc)a|(?:(?:zugangs|secret)cod|clesecret)e|codesecret|motdepasse|geheimnis|secret|senha|key/i;

const USERNAME_RE =
    /identi(?:fiant|ty)|u(?:tilisateur|s(?:ername|uario))|(?:identifi|benutz)er|(?:screen|nick)name|nutzername|(?:apeli|pseu)do|(?:anmeld|handl)e/i;

const USERNAME_ATTR_RE = /identifyemail|(?:custom|us)erid|loginname|a(?:cc(?:ountid|t)|ppleid)|loginid/i;

const EMAIL_RE = /co(?:urriel|rrei?o)|email/i;

const EMAIL_ATTR_RE = /usermail/i;

const CREATE_ACTION_RE = /erstellen|n(?:o(?:uveau|vo)|uevo|e[uw])|cr(?:e(?:a(?:te|r)|er)|iar)|set/i;

const CREATE_ACTION_ATTR_END_RE = /\b.*(?:fst|1)$/i;

const RESET_ACTION_RE =
    /(?:a(?:ktualisiere|nder)|zurucksetze)n|(?:re(?:initialise|stablece|defini)|mettreajou)r|a(?:ctualiz|tualiz|lter)ar|c(?:ambiar|hange)|update|reset/i;

const CONFIRM_ACTION_RE =
    /digitarnovamente|v(?:olveraescribi|erifi(?:ca|e))r|saisiranouveau|(?:erneuteingeb|wiederhol|bestatig)en|verif(?:izieren|y)|re(?:pe(?:t[ei]r|at)|type)|confirm|again/i;

const CONFIRM_ACTION_ATTR_END_RE = /\b.*(?:snd|bis|2)$/i;

const STEP_ACTION_RE =
    /(?:f(?:ertigstell|ortfahr)|abschlie)en|getstarted|siguiente|(?:preceden|suivan|accep)t|(?:finaliza|termin[ae]|anterio|weite)r|co(?:mplet(?:ar|e)|ntinu(?:ar|e))|pro(?:c(?:hain|eed)|ximo)|finish|zuruck|back|next/i;

const REMEMBER_ACTION_RE =
    /angemeldetbleiben|lembrardemim|micherinnern|sesouvenirde|re(?:cordarme|member|ster)|manterme|mantener|stay|keep/i;

const CURRENT_VALUE_RE =
    /(?:be(?:stehend|for)|vorherig|aktuell)e|exist(?:ente|ing)|pre(?:cedent|vious)|a(?:n(?:t(?:erior|igo)|cien)|ctu[ae]l|tual)|existant|dernier|current|(?:ultim|viej)o|(?:letz|al)te|last|old/i;

const HIDDEN_ATTR_RE = /s(?:creenreade)?ronly|(?:move)?offscreen|(?:displaynon|a11yhid)e|invisible|hidden/i;

const OAUTH_ATTR_RE = /facebook|twitch|google|apple/i;

const TOS_RE =
    /(?:datenschutzrichtlini|politicadeprivacidad|confidentialit|a(?:cknowledg|gre))e|nutzungsbedingungen|(?:consentimi?ent|ac(?:ue|o)rd)o|(?:einwillig|zustimm)ung|consentement|condi(?:cione|tion)s|term(?:osdeuso|inos|sof)|(?:privacida|understan)d|guideline|consent|p(?:riva|oli)cy|accord/i;

const MFA_ACTION_RE = /enter(?:auth)?code|confirm|verify/i;

const MFA_RE =
    /(?:authentifizierung|doisfatore|doispasso)s|(?:auth(?:entication)?cod|(?:securityc|codig)od|doubleetap|coded)e|(?:authentication|generator)app|(?:(?:authentifica|doublefac)teu|(?:(?:authentifika|doblefac|zweifak|twofac)t|aut(?:henticat|enticad))o)r|verifica(?:c(?:ion|ao)|tion)|multifa(?:ct(?:eu|o)|k?to)r|zweischritte|generadora|doblepaso|2(?:s(?:chritte|tep)|(?:etap[ae]|paso)s|fa)|twostep/i;

const MFA_ATTR_RE =
    /phoneverification|(?:approvals|login)code|c(?:odeinput|hallenge)|two(?:factor|step)|twofa|tfa|[2m]fa/i;

const OTP_ATTR_RE = /totp(?:pin)?|o(?:netime|t[cp])|1time/i;

const OTP_OUTLIER_RE =
    /n(?:(?:ue|o)vocodigo|ouveaucode|e(?:usenden|(?:uer|w)code))|re(?:enviar|send)|envoyer|senden|enviar|send/i;

const OTP_OUTLIER_ATTR_RE = /(?:phone|email|tel)pin|email|sms/i;

const NEWSLETTER_RE = /newsletter|b(?:ul|o)letin|mailing/i;

const NEWSLETTER_ATTR_RE = /subscription|mailinglist|newsletter|emailform/i;

const EMAIL_VALUE_RE = /^[a-zA-Z0-9.!#$%&’*+\/=?^_\`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*?$/;

const TEL_VALUE_RE = /^[0-9()+-]{6,25}$/;

const USERNAME_VALUE_RE = /^[A-Za-z0-9_\-\.]{7,30}$/;

const notRe = (reg) => (str) => !test(reg)(str);

const andRe = (reg) => and(reg.map(test));

const orRe = (reg) => or(reg.map(test));

const test = (re) => (str) => re.test(str);

const and = (tests) => (str) => tests.every((test) => test(str));

const or = (tests) => (str) => tests.some((test) => test(str));

const any = (test) => (strs) => strs.some(test);

const matchLogin = test(LOGIN_RE);

const matchRegister = test(REGISTER_RE);

const matchUsername = test(USERNAME_RE);

const matchUsernameAttr = orRe([USERNAME_ATTR_RE, USERNAME_RE]);

const matchUsernameValue = test(USERNAME_VALUE_RE);

const matchEmail = orRe([EMAIL_RE, EMAIL_VALUE_RE]);

const matchEmailAttr = orRe([EMAIL_ATTR_RE, EMAIL_RE]);

const matchEmailValue = test(EMAIL_VALUE_RE);

const matchTelValue = test(TEL_VALUE_RE);

const matchRememberMe = test(REMEMBER_ACTION_RE);

const matchTOS = test(TOS_RE);

const matchTrouble = test(TROUBLE_RE);

const matchRecovery = test(RECOVERY_RE);

const matchMultiStep = test(MULTI_STEP_RE);

const matchStepAction = orRe([STEP_ACTION_RE, MULTI_STEP_RE]);

const matchOAuth = test(OAUTH_ATTR_RE);

const matchPasswordReset = and([andRe([PASSWORD_RE, RESET_ACTION_RE]), notRe(CONFIRM_ACTION_RE)]);

const matchPasswordResetAttr = and([matchPasswordReset, notRe(CONFIRM_ACTION_ATTR_END_RE)]);

const matchPasswordCreate = and([andRe([PASSWORD_RE, CREATE_ACTION_RE]), notRe(CONFIRM_ACTION_RE)]);

const matchPasswordCreateAttr = and([matchPasswordCreate, notRe(CONFIRM_ACTION_ATTR_END_RE)]);

const matchPasswordConfirm = and([andRe([PASSWORD_RE, CONFIRM_ACTION_RE]), notRe(CREATE_ACTION_ATTR_END_RE)]);

const matchPasswordCurrent = and([andRe([PASSWORD_RE, CURRENT_VALUE_RE]), notRe(CONFIRM_ACTION_RE)]);

const matchPasswordCurrentAttr = and([matchPasswordCurrent, notRe(CONFIRM_ACTION_ATTR_END_RE)]);

const matchHidden = test(HIDDEN_ATTR_RE);

const matchMfaAction = test(MFA_ACTION_RE);

const matchMfa = test(MFA_RE);

const matchMfaAttr = test(MFA_ATTR_RE);

const matchOtpAttr = test(OTP_ATTR_RE);

const matchOtpOutlier = orRe([OTP_OUTLIER_ATTR_RE, OTP_OUTLIER_RE]);

const matchNewsletter = test(NEWSLETTER_RE);

orRe([NEWSLETTER_RE, NEWSLETTER_ATTR_RE]);

const walkUpWhile = (start, maxIterations) => (check) => {
    const parent = start.parentElement;
    if (maxIterations === 0 || parent === null) return start;
    return check(parent, start) ? walkUpWhile(parent, maxIterations - 1)(check) : start;
};

const fastIsVisible = (el, options, recurseMax = MAX_VISIBILITY_WALK_UP) => {
    const rect = el.getClientRects();
    if (rect.length === 0) return false;
    if (el instanceof HTMLInputElement) {
        const { type, disabled, readOnly, tabIndex } = el;
        if (type === 'hidden' || disabled || readOnly || tabIndex === -1) return false;
    }
    const classList = Array.from(el.classList).map(sanitizeString);
    if (any(matchHidden)(classList)) return false;
    const { visibility, display, maxHeight } = getComputedStyle(el);
    if (visibility === 'hidden' || display === 'none' || maxHeight === '0px') return false;
    if (el.offsetHeight < options.minHeight || el.offsetWidth < options.minWidth) return false;
    const parent = el.parentElement;
    return recurseMax === 0 || parent === null ? true : fastIsVisible(parent, options, recurseMax - 1);
};

const isVisibleField = (field) =>
    fastIsVisible(field, {
        minHeight: MIN_FIELD_HEIGHT,
        minWidth: MIN_FIELD_WIDTH,
    });

const getNthParent = (el) => (n) => {
    const parent = el.parentElement;
    return parent === null || n === 0 ? el : getNthParent(parent)(n - 1);
};

const uniqueNodes = (...nodes) => Array.from(new Set(nodes.flat()));

const getNodeRect = (el) => {
    const { height, width, top, bottom } = el.getBoundingClientRect();
    const area = height * width;
    return {
        height,
        width,
        top,
        bottom,
        area,
    };
};

const getLabelFor = (el) => {
    var _a;
    const forId = (_a = el.getAttribute('id')) !== null && _a !== void 0 ? _a : el.getAttribute('name');
    const label = document.querySelector(`label[for="${forId}"]`);
    if (label) return label;
    const closest = el.closest('label');
    if (closest) return closest;
    const parent = el.parentElement;
    const parentLabels = parent.querySelectorAll('label');
    if (parentLabels.length === 1) return parentLabels[0];
    return null;
};

const kUsernameSelector = ['input[type="search"][name="loginName"]', 'input[type="username"]'];

const kEmailSelector = ['input[name="email"]', 'input[id="email"]'];

const formOfInterestSelector = `form:not([role="search"])`;

const headingSelector = [
    ...[1, 2, 3, 4, 5].flatMap((level) => [`h${level}, [aria-level="${level}"]`]),
    '[role="heading"]',
    '[class*="title"]',
    '[name="title"]',
].join(',');

const fieldSelector = 'input, select, textarea';

const editableFieldSelector = [
    'input[type="email"]',
    'input[type="text"]',
    'input[type="number"]',
    'input[type="tel"]',
    'input[type="password"]',
    'input[autocomplete="one-time-code"]',
    'input[type=""]',
    'input:not([type])',
    ...kUsernameSelector,
].join(',');

const fieldOfInterestSelector = `${editableFieldSelector}, input[type="hidden"]:not([value=""]`;

const buttonSubmitSelector = [
    'button:not([type])',
    'button[type="submit"]',
    'button[type="button"]',
    'button[name="submit"]',
    'button[jsaction]',
    'a[role="submit"]',
    'a[role="button"]',
    'div[role="button"]',
    'div[role="submit"]',
].join(',');

const anchorLinkSelector = `a, span[role="button"]`;

const captchaSelector = `[class*="captcha"], [id*="captcha"], [name*="captcha"]`;

const socialSelector = `[class*=social],[aria-label*=with]`;

const clusterSelector = `[role="dialog"], [role="group"], [role="form"], [id*="modal"], [class*="modal"], header, section, nav, footer, aside`;

const layoutSelector = `div, section, aside, main, nav`;

const usernameSelector = ['input[type="text"], input[type=""], input:not([type])', ...kUsernameSelector].join(',');

const hiddenUsernameSelector = 'input[type="email"], input[type="text"], input[type="hidden"]';

const otpSelector = 'input[type="tel"], input[type="number"], input[type="text"], input:not([type])';

const getPageDescriptionText = (doc) => {
    var _a;
    const pageTitle = doc.title;
    const metaDescription = doc.querySelector('meta[name="description"]');
    const descriptionContent =
        (_a =
            metaDescription === null || metaDescription === void 0
                ? void 0
                : metaDescription.getAttribute('content')) !== null && _a !== void 0
            ? _a
            : '';
    return sanitizeString(`${pageTitle} ${descriptionContent}`);
};

const getNodeText = (node) => {
    const textAttrs = getTextAttributes(node).join('');
    return sanitizeString(`${node.innerText}${textAttrs}`);
};

const getNodeAttributes = (node) => sanitizeString(getBaseAttributes(node).join(''));

const getFormText = (form) => {
    const textAttrs = getTextAttributes(form).join('');
    const fieldsets = Array.from(form.querySelectorAll('fieldset'));
    return sanitizeString(
        `${textAttrs}${fieldsets.reduce((text, fieldset) => text.concat(getTextAttributes(fieldset).join('')), '')}`
    );
};

const getFieldLabelText = (field) => {
    const label = getLabelFor(field);
    return label ? getNodeText(label) : '';
};

const getFieldHaystacks = (field) => {
    var _a;
    const fieldAttrs = getFieldAttributes(field);
    const fieldText = getNodeText(field);
    const labelText = getFieldLabelText(field);
    const fieldset = (_a = field.closest('fieldset')) !== null && _a !== void 0 ? _a : null;
    const fieldsetText = fieldset ? getTextAttributes(fieldset).join('') : '';
    return {
        fieldAttrs,
        fieldText,
        labelText,
        fieldsetText,
    };
};

const getAllFieldHaystacks = (field) => {
    const { fieldAttrs, fieldText, labelText, fieldsetText } = getFieldHaystacks(field);
    return [fieldText, labelText, fieldsetText, ...fieldAttrs];
};

const getNearestHeadingsText = (el) => {
    const parent = walkUpWhile(
        el,
        MAX_FORM_HEADING_WALK_UP
    )((parentEl, candidate) => {
        if (parentEl === document.body) return false;
        if (candidate.matches(clusterSelector)) return false;
        return true;
    });
    const headings = Array.from(parent.querySelectorAll(headingSelector));
    return sanitizeString(headings.map((el) => el.innerText).join(''));
};

const boolInt = (val) => Number(val);

const safeInt = (val, fallback = 0) => (Number.isFinite(val) ? val : fallback);

const featureScore = (noteFor, key) =>
    score((fnode) => {
        const features = fnode.noteFor(noteFor);
        return features[key];
    });

const getParentFnodeOfType = (fnode, type) => {
    const fnodesForType = fnode._ruleset.get(type);
    return fnodesForType.find(({ element }) => element.contains(fnode.element));
};

const getFieldFeature = (fnode) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const field = fnode.element;
    const value = field.value;
    const type = field.getAttribute('type');
    const readonly = field.readOnly;
    const required = field.required;
    const minLength = safeInt(field.minLength, 0);
    const maxLength = safeInt(field.maxLength, 250);
    const pattern = field.pattern;
    const autocomplete = field.autocomplete;
    const disabled = field.disabled;
    const typeValid = type !== 'hidden';
    const visible = typeValid ? utils.isVisible(field) : false;
    const tabIndex = field.tabIndex;
    const formFnode = getParentFnodeOfType(fnode, 'form');
    const form = (_a = fnode.element) !== null && _a !== void 0 ? _a : field.closest('form');
    const formFeatures = formFnode === null || formFnode === void 0 ? void 0 : formFnode.noteFor('form');
    const loginScore =
        (_b = formFnode === null || formFnode === void 0 ? void 0 : formFnode.scoreFor('login')) !== null &&
        _b !== void 0
            ? _b
            : 0;
    const registerScore =
        (_c = formFnode === null || formFnode === void 0 ? void 0 : formFnode.scoreFor('register')) !== null &&
        _c !== void 0
            ? _c
            : 0;
    const pwChangeScore =
        (_d = formFnode === null || formFnode === void 0 ? void 0 : formFnode.scoreFor('password-change')) !== null &&
        _d !== void 0
            ? _d
            : 0;
    const recoveryScore =
        (_e = formFnode === null || formFnode === void 0 ? void 0 : formFnode.scoreFor('recovery')) !== null &&
        _e !== void 0
            ? _e
            : 0;
    const mfaScore =
        (_f = formFnode === null || formFnode === void 0 ? void 0 : formFnode.scoreFor('mfa')) !== null && _f !== void 0
            ? _f
            : 0;
    const detectionScores = [loginScore, registerScore, pwChangeScore, recoveryScore, mfaScore];
    const dangling = form === undefined;
    const exotic = !dangling && detectionScores.every((score) => score < 0.5);
    const prevField = typeValid
        ? (_g =
              formFeatures === null || formFeatures === void 0
                  ? void 0
                  : formFeatures.formInputIterator.prev(field)) !== null && _g !== void 0
            ? _g
            : null
        : null;
    const nextField = typeValid
        ? (_h =
              formFeatures === null || formFeatures === void 0
                  ? void 0
                  : formFeatures.formInputIterator.next(field)) !== null && _h !== void 0
            ? _h
            : null
        : null;
    return Object.assign(
        {
            formFnode,
            formFeatures,
            loginScore,
            registerScore,
            pwChangeScore,
            recoveryScore,
            mfaScore,
            exotic,
            dangling,
            value,
            visible,
            type,
            readonly,
            required,
            disabled,
            pattern,
            autocomplete,
            minLength,
            maxLength,
            tabIndex,
            prevField,
            nextField,
        },
        getFieldHaystacks(field)
    );
};

const { isVisible } = utils;

const isFormOfInterest = (fnodeOrEl) => {
    const form = 'element' in fnodeOrEl ? fnodeOrEl.element : fnodeOrEl;
    const inputs = Array.from(form.querySelectorAll(editableFieldSelector)).filter((field) => !field.disabled);
    return inputs.length > 0 && inputs.some((input) => isVisible(input));
};

const getFormParent = (form) =>
    walkUpWhile(form, MAX_FORM_FIELD_WALK_UP)((el) => el.querySelectorAll('form').length <= 1);

const createInputIterator = (form) => {
    const formEls = Array.from(form.querySelectorAll('input:not([type="hidden"]), select, textarea')).filter(
        isVisibleField
    );
    return {
        prev(input) {
            var _a;
            const idx = formEls.indexOf(input);
            return idx === -1
                ? null
                : (_a = formEls === null || formEls === void 0 ? void 0 : formEls[idx - 1]) !== null && _a !== void 0
                ? _a
                : null;
        },
        next(input) {
            var _a;
            const idx = formEls.indexOf(input);
            return idx === -1
                ? null
                : (_a = formEls === null || formEls === void 0 ? void 0 : formEls[idx + 1]) !== null && _a !== void 0
                ? _a
                : null;
        },
    };
};

const isUserEditableFNode = (fnode) => {
    const { visible, readonly, disabled, tabIndex } = fnode.noteFor('field');
    const height = fnode.element.offsetHeight;
    return visible && !readonly && !disabled && tabIndex !== -1 && height > MIN_FIELD_HEIGHT;
};

const isUserEditableField = (el) => {
    const { readOnly, disabled, tabIndex, offsetHeight } = el;
    return !readOnly && !disabled && tabIndex !== -1 && offsetHeight > MIN_FIELD_HEIGHT && utils.isVisible(el);
};

const splitFieldsByVisibility = (els) =>
    els.reduce(
        (acc, el) => {
            if (isVisibleField(el)) acc[0].push(el);
            else acc[1].push(el);
            return acc;
        },
        [[], []]
    );

const maybeEmail = (fnode) => ['email', 'text', '', null].includes(fnode.element.type) && isUserEditableFNode(fnode);

const maybePassword = (fnode) => fnode.element.getAttribute('type') === 'password' && isUserEditableFNode(fnode);

const maybeOTP = (fnode) => fnode.element.matches(otpSelector) && isUserEditableFNode(fnode);

const maybeUsername = (fnode) => fnode.element.matches(usernameSelector) && isUserEditableFNode(fnode);

const maybeHiddenUsername = (fnode) => fnode.element.matches(hiddenUsernameSelector) && !isUserEditableFNode(fnode);

const isUsernameCandidate = (el) => !el.matches('input[type="email"]') && any(matchUsername)(getAllFieldHaystacks(el));

const isEmailCandidate = (el) => el.matches('input[type="email"]') || any(matchEmail)(getAllFieldHaystacks(el));

const isOAuthCandidate = (el) => any(matchOAuth)(getAllFieldHaystacks(el));

const isSubmitBtnCandidate = (btn) => {
    const height = btn.offsetHeight;
    const width = btn.offsetWidth;
    return height * width > MIN_AREA_SUBMIT_BTN;
};

const { linearScale } = utils;

const getFormFeatures = (fnode) => {
    const form = fnode.element;
    const parent = getFormParent(form);
    const fields = Array.from(form.querySelectorAll(fieldSelector));
    const visibleFields = fields.filter(isVisibleField);
    const doc = form.ownerDocument;
    const inputs = fields.filter((el) => el.matches('input:not([type="submit"])'));
    const visibleInputs = visibleFields.filter((el) => el.matches('input:not([type="submit"])'));
    const fieldsets = form.querySelectorAll('fieldset');
    const textareas = visibleFields.filter((el) => el.matches('textarea'));
    const selects = visibleFields.filter((el) => el.matches('select'));
    const submits = visibleFields.filter((el) => el.matches('[type="submit"]'));
    const hiddenInputs = inputs.filter((el) => el.matches('[type="hidden"]'));
    const texts = visibleInputs.filter((el) => el.matches('[type="text"]'));
    const tels = inputs.filter((el) => el.matches('[type="tel"]'));
    const usernames = inputs.filter(isUsernameCandidate);
    const emails = inputs.filter(isEmailCandidate);
    const identifiers = uniqueNodes(usernames, emails, tels);
    const [visibleIdentifiers, hiddenIdentifiers] = splitFieldsByVisibility(identifiers);
    const passwords = inputs.filter((el) => el.matches('[type="password"]'));
    const [visiblePasswords, hiddenPasswords] = splitFieldsByVisibility(passwords);
    const search = visibleInputs.filter((el) => el.matches('[type="search"]'));
    const radios = visibleInputs.filter((el) => el.matches('[type="radio"]'));
    const checkboxes = visibleInputs.filter((el) => el.matches('[type="checkbox"]'));
    const numbers = visibleInputs.filter((el) => el.matches('[type="number"]'));
    const dates = visibleInputs.filter((el) => el.matches('[type="date"]'));
    const files = visibleInputs.filter((el) => el.matches('[type="file"]'));
    const mfas = tels.concat(numbers).concat(texts);
    const required = visibleInputs.filter((el) => el.matches('[required]'));
    const patterns = visibleInputs.filter((el) => el.matches('[pattern]'));
    const minMaxLengths = visibleInputs.filter((el) => el.matches('[minLength], [maxLength]'));
    const autofocused = visibleInputs.find((el) => el.matches('input[autofocus]:first-of-type'));
    const captchas = parent.querySelectorAll(captchaSelector);
    const btns = Array.from(parent.querySelectorAll(buttonSubmitSelector));
    const submitBtns = btns.filter(isSubmitBtnCandidate);
    const btnCandidates = submits.concat(submitBtns);
    const anchors = Array.from(parent.querySelectorAll(anchorLinkSelector));
    const socialEls = Array.from(parent.querySelectorAll(socialSelector));
    const oauths = socialEls.concat(submitBtns).filter(isOAuthCandidate);
    const layouts = Array.from(form.querySelectorAll(layoutSelector));
    const autofocusedIsIdentifier = Boolean(autofocused && identifiers.includes(autofocused));
    const autofocusedIsPassword = Boolean(autofocused && passwords.includes(autofocused));
    const pageDescriptionText = getPageDescriptionText(doc);
    const nearestHeadingsText = getNearestHeadingsText(form);
    const formTextAttrText = getFormText(form);
    const formAttributes = getFormAttributes(form);
    const identifierAttributes = identifiers.flatMap(getAllFieldHaystacks);
    const submitBtnHaystack = btnCandidates.flatMap(getAllFieldHaystacks);
    const checkboxesHaystack = checkboxes.flatMap(getAllFieldHaystacks);
    const anchorsHaystack = anchors.flatMap(getAllFieldHaystacks);
    const mfaInputsHaystack = mfas.flatMap(getAllFieldHaystacks);
    const layoutHaystack = layouts.map(getNodeAttributes);
    const pageLogin = matchLogin(pageDescriptionText);
    const formTextLogin = matchLogin(formTextAttrText);
    const formAttrsLogin = any(matchLogin)(formAttributes);
    const headingsLogin = matchLogin(nearestHeadingsText);
    const layoutLogin = any(matchLogin)(layoutHaystack);
    const rememberMeCheckbox = any(matchRememberMe)(checkboxesHaystack);
    const submitLogin = any(matchLogin)(submitBtnHaystack);
    const forgotPasswordLink = any(matchTrouble)(anchorsHaystack);
    const pageRegister = matchRegister(pageDescriptionText);
    const formTextRegister = matchRegister(formTextAttrText);
    const formAttrsRegister = any(matchRegister)(formAttributes);
    const headingsRegister = matchRegister(nearestHeadingsText);
    const layoutRegister = any(matchRegister)(layoutHaystack);
    const TOSCheckbox = any(matchTOS)(checkboxesHaystack);
    const submitRegister = any(matchRegister)(submitBtnHaystack);
    const pagePwReset = matchPasswordReset(pageDescriptionText);
    const formTextPwReset = matchPasswordReset(formTextAttrText);
    const formAttrsPwReset = any(matchPasswordResetAttr)(formAttributes);
    const headingsPwReset = matchPasswordReset(nearestHeadingsText);
    const layoutPwReset = any(matchPasswordResetAttr)(layoutHaystack);
    const pageRecovery = matchRecovery(pageDescriptionText);
    const formTextRecovery = matchRecovery(formTextAttrText);
    const formAttrsRecovery = any(matchRecovery)(formAttributes);
    const headingsRecovery = matchRecovery(nearestHeadingsText);
    const layoutRecovery = any(matchRecovery)(layoutHaystack);
    const identifierRecovery = any(matchRecovery)(identifierAttributes);
    const formTextMFA = matchMfa(formTextAttrText);
    const formAttrsMFA = any(matchMfaAttr)(formAttributes);
    const headingsMFA = matchMfa(nearestHeadingsText);
    const layoutMFA = any(matchMfa)(layoutHaystack);
    const buttonVerify = any(matchMfaAction)(submitBtnHaystack);
    const inputsMFA = any(matchMfaAttr)(mfaInputsHaystack);
    const inputsOTP = any(matchOtpAttr)(mfaInputsHaystack);
    const resendCodeLink = any(matchTrouble)(anchorsHaystack.concat(submitBtnHaystack));
    const headingsNewsletter = matchNewsletter(nearestHeadingsText);
    const buttonMultiStep = any(matchStepAction)(submitBtnHaystack);
    const headingsMultiStep = matchMultiStep(nearestHeadingsText);
    return {
        fieldsCount: linearScale(visibleFields.length, 1, 5),
        inputCount: linearScale(visibleInputs.length, 1, 5),
        fieldsetCount: linearScale(fieldsets.length, 1, 5),
        textCount: linearScale(texts.length, 0, 3),
        textareaCount: linearScale(textareas.length, 0, 2),
        selectCount: linearScale(selects.length, 0, 3),
        checkboxCount: linearScale(checkboxes.length, 0, 2),
        radioCount: linearScale(radios.length, 0, 5),
        numberCount: linearScale(numbers.length, 0, 2),
        dateCount: linearScale(dates.length, 0, 2),
        identifierCount: linearScale(visibleIdentifiers.length, 0, 2),
        passwordCount: linearScale(visiblePasswords.length, 0, 2),
        usernameCount: linearScale(usernames.length, 0, 2),
        emailCount: linearScale(emails.length, 0, 2),
        submitCount: linearScale(submits.length, 0, 2),
        hasTels: boolInt(tels.length > 0),
        hasOAuth: boolInt(oauths.length > 0),
        hasCaptchas: boolInt(captchas.length > 0),
        hasFiles: boolInt(files.length > 0),
        hasSearch: boolInt(search.length > 0),
        noPasswordFields: boolInt(visiblePasswords.length === 0),
        onePasswordField: boolInt(visiblePasswords.length === 1),
        twoPasswordFields: boolInt(visiblePasswords.length === 2),
        threePasswordFields: boolInt(visiblePasswords.length === 3),
        oneIdentifierField: boolInt(visibleIdentifiers.length === 1),
        twoIdentifierFields: boolInt(visibleIdentifiers.length === 2),
        threeIdentifierFields: boolInt(visibleIdentifiers.length === 3),
        hasHiddenPassword: boolInt(hiddenPasswords.length > 0),
        hasHiddenIdentifier: boolInt(hiddenIdentifiers.length > 0),
        autofocusedIsIdentifier: boolInt(autofocusedIsIdentifier),
        autofocusedIsPassword: boolInt(autofocusedIsPassword),
        visibleRatio: safeInt(visibleInputs.length / fields.length),
        inputRatio: safeInt(inputs.length / fields.length),
        hiddenRatio: safeInt(hiddenInputs.length / inputs.length),
        identifierRatio: safeInt(identifiers.length / inputs.length),
        emailRatio: safeInt(emails.length / inputs.length),
        usernameRatio: safeInt(usernames.length / inputs.length),
        passwordRatio: safeInt(passwords.length / visibleInputs.length),
        requiredRatio: safeInt(required.length / visibleInputs.length),
        patternRatio: safeInt(patterns.length / visibleInputs.length),
        minMaxLengthRatio: safeInt(minMaxLengths.length / visibleInputs.length),
        pageLogin: boolInt(pageLogin),
        formTextLogin: boolInt(formTextLogin),
        formAttrsLogin: boolInt(formAttrsLogin),
        headingsLogin: boolInt(headingsLogin),
        layoutLogin: boolInt(layoutLogin),
        rememberMeCheckbox: boolInt(rememberMeCheckbox),
        forgotPasswordLink: boolInt(forgotPasswordLink),
        submitLogin: boolInt(submitLogin),
        pageRegister: boolInt(pageRegister),
        formTextRegister: boolInt(formTextRegister),
        formAttrsRegister: boolInt(formAttrsRegister),
        headingsRegister: boolInt(headingsRegister),
        layoutRegister: boolInt(layoutRegister),
        checkboxTOS: boolInt(TOSCheckbox),
        submitRegister: boolInt(submitRegister),
        pagePwReset: boolInt(pagePwReset),
        formTextPwReset: boolInt(formTextPwReset),
        formAttrsPwReset: boolInt(formAttrsPwReset),
        headingsPwReset: boolInt(headingsPwReset),
        layoutPwReset: boolInt(layoutPwReset),
        pageRecovery: boolInt(pageRecovery),
        formTextRecovery: boolInt(formTextRecovery),
        formAttrsRecovery: boolInt(formAttrsRecovery),
        headingsRecovery: boolInt(headingsRecovery),
        layoutRecovery: boolInt(layoutRecovery),
        identifierRecovery: boolInt(identifierRecovery),
        formTextMFA: boolInt(formTextMFA),
        formAttrsMFA: boolInt(formAttrsMFA),
        headingsMFA: boolInt(headingsMFA),
        layoutMFA: boolInt(layoutMFA),
        buttonVerify: boolInt(buttonVerify),
        inputsMFA: boolInt(inputsMFA),
        inputsOTP: boolInt(inputsOTP),
        resendCodeLink: boolInt(resendCodeLink),
        headingsNewsletter: boolInt(headingsNewsletter),
        oneVisibleField: boolInt(visibleInputs.length === 1),
        buttonMultiStep: boolInt(buttonMultiStep),
        buttonMultiAction: boolInt(submitRegister && submitLogin),
        headingsMultiStep: boolInt(headingsMultiStep),
        formInputIterator: createInputIterator(form),
    };
};

const FORM_FEATURES = [
    'fieldsCount',
    'inputCount',
    'fieldsetCount',
    'textCount',
    'textareaCount',
    'selectCount',
    'checkboxCount',
    'radioCount',
    'numberCount',
    'dateCount',
    'identifierCount',
    'usernameCount',
    'emailCount',
    'submitCount',
    'hasTels',
    'hasOAuth',
    'hasCaptchas',
    'hasFiles',
    'noPasswordFields',
    'onePasswordField',
    'twoPasswordFields',
    'threePasswordFields',
    'oneIdentifierField',
    'twoIdentifierFields',
    'threeIdentifierFields',
    'hasHiddenIdentifier',
    'hasHiddenPassword',
    'autofocusedIsPassword',
    'visibleRatio',
    'inputRatio',
    'hiddenRatio',
    'identifierRatio',
    'emailRatio',
    'usernameRatio',
    'passwordRatio',
    'requiredRatio',
    'patternRatio',
    'minMaxLengthRatio',
    'pageLogin',
    'formTextLogin',
    'formAttrsLogin',
    'headingsLogin',
    'layoutLogin',
    'rememberMeCheckbox',
    'forgotPasswordLink',
    'submitLogin',
    'pageRegister',
    'formTextRegister',
    'formAttrsRegister',
    'headingsRegister',
    'layoutRegister',
    'checkboxTOS',
    'submitRegister',
    'pagePwReset',
    'formTextPwReset',
    'formAttrsPwReset',
    'headingsPwReset',
    'layoutPwReset',
    'pageRecovery',
    'formTextRecovery',
    'formAttrsRecovery',
    'headingsRecovery',
    'layoutRecovery',
    'identifierRecovery',
    'formTextMFA',
    'formAttrsMFA',
    'headingsMFA',
    'layoutMFA',
    'buttonVerify',
    'inputsMFA',
    'inputsOTP',
    'resendCodeLink',
    'headingsNewsletter',
    'oneVisibleField',
    'buttonMultiStep',
    'buttonMultiAction',
    'headingsMultiStep',
];

const getPasswordFieldFeatures = (fnode) => {
    var _a, _b;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField } = fieldFeatures;
    const attrCreate = any(matchPasswordCreateAttr)(fieldAttrs);
    const attrCurrent = any(matchPasswordCurrentAttr)(fieldAttrs);
    const attrConfirm = any(matchPasswordConfirm)(fieldAttrs);
    const attrReset = any(matchPasswordResetAttr)(fieldAttrs);
    const textCreate = matchPasswordCreate(fieldText);
    const textCurrent = matchPasswordCurrent(fieldText);
    const textConfirm = matchPasswordConfirm(fieldText);
    const textReset = matchPasswordReset(fieldText);
    const labelCreate = matchPasswordCreate(labelText);
    const labelCurrent = matchPasswordCurrent(labelText);
    const labelConfirm = matchPasswordConfirm(labelText);
    const labelReset = matchPasswordReset(labelText);
    const prevPwHaystack =
        prevField && prevField.getAttribute('type') === 'password' ? getAllFieldHaystacks(prevField) : [];
    const nextPwHaystack =
        nextField && nextField.getAttribute('type') === 'password' ? getAllFieldHaystacks(nextField) : [];
    const prevPwCreate = any(matchPasswordCreate)(prevPwHaystack);
    const prevPwCurrent = any(matchPasswordCurrent)(prevPwHaystack);
    const prevPwConfirm = any(matchPasswordConfirm)(prevPwHaystack);
    const nextPwCreate = any(matchPasswordCreate)(nextPwHaystack);
    const nextPwCurrent = any(matchPasswordCurrent)(nextPwHaystack);
    const nextPwConfirm = any(matchPasswordConfirm)(nextPwHaystack);
    return {
        loginScore: fieldFeatures.loginScore,
        registerScore: fieldFeatures.registerScore,
        pwChangeScore: fieldFeatures.pwChangeScore,
        exotic: boolInt(fieldFeatures.exotic),
        dangling: boolInt(fieldFeatures.dangling),
        autocompleteNew: boolInt(fieldFeatures.autocomplete === 'new-password'),
        autocompleteCurrent: boolInt(fieldFeatures.autocomplete === 'current-password'),
        autocompleteOff: boolInt(fieldFeatures.autocomplete === 'off'),
        isOnlyPassword:
            (_b = (_a = fieldFeatures.formFeatures) === null || _a === void 0 ? void 0 : _a.onePasswordField) !==
                null && _b !== void 0
                ? _b
                : 0,
        prevPwField: boolInt(prevField !== null),
        nextPwField: boolInt(nextField !== null),
        attrCreate: boolInt(attrCreate),
        attrCurrent: boolInt(attrCurrent),
        attrConfirm: boolInt(attrConfirm),
        attrReset: boolInt(attrReset),
        textCreate: boolInt(textCreate),
        textCurrent: boolInt(textCurrent),
        textConfirm: boolInt(textConfirm),
        textReset: boolInt(textReset),
        labelCreate: boolInt(labelCreate),
        labelCurrent: boolInt(labelCurrent),
        labelConfirm: boolInt(labelConfirm),
        labelReset: boolInt(labelReset),
        prevPwCreate: boolInt(prevPwCreate),
        prevPwCurrent: boolInt(prevPwCurrent),
        prevPwConfirm: boolInt(prevPwConfirm),
        nextPwCreate: boolInt(nextPwCreate),
        nextPwCurrent: boolInt(nextPwCurrent),
        nextPwConfirm: boolInt(nextPwConfirm),
    };
};

const PW_FIELD_FEATURES = [
    'loginScore',
    'registerScore',
    'pwChangeScore',
    'exotic',
    'dangling',
    'autocompleteNew',
    'autocompleteCurrent',
    'autocompleteOff',
    'isOnlyPassword',
    'prevPwField',
    'nextPwField',
    'attrCreate',
    'attrCurrent',
    'attrConfirm',
    'attrReset',
    'textCreate',
    'textCurrent',
    'textConfirm',
    'textReset',
    'labelCreate',
    'labelCurrent',
    'labelConfirm',
    'labelReset',
    'prevPwCreate',
    'prevPwCurrent',
    'prevPwConfirm',
    'nextPwCreate',
    'nextPwCurrent',
    'nextPwConfirm',
];

const getEmailFieldFeatures = (fnode) => {
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText } = fieldFeatures;
    const typeEmail = fieldFeatures.type === 'email';
    const exactAttrEmail = kEmailSelector.some((selector) => field.matches(selector));
    const attrEmail = any(matchEmailAttr)(fieldAttrs);
    const textEmail = matchEmail(fieldText);
    const labelEmail = matchEmail(labelText);
    const placeholderEmail = any(or([matchEmailValue, matchEmail]))(field.placeholder.split(' '));
    return {
        autocompleteUsername: boolInt(fieldFeatures.autocomplete === 'username'),
        autocompleteNickname: boolInt(fieldFeatures.autocomplete === 'nickname'),
        autocompleteEmail: boolInt(fieldFeatures.autocomplete === 'email'),
        autocompleteOff: boolInt(fieldFeatures.autocomplete === 'off'),
        typeEmail: boolInt(typeEmail),
        exactAttrEmail: boolInt(exactAttrEmail),
        attrEmail: boolInt(attrEmail),
        textEmail: boolInt(textEmail),
        labelEmail: boolInt(labelEmail),
        placeholderEmail: boolInt(placeholderEmail),
    };
};

const EMAIL_FIELD_FEATURES = [
    'autocompleteUsername',
    'autocompleteNickname',
    'autocompleteEmail',
    'typeEmail',
    'exactAttrEmail',
    'attrEmail',
    'textEmail',
    'labelEmail',
    'placeholderEmail',
];

const getUsernameFieldFeatures = (fnode) => {
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, loginScore, prevField, nextField } = fieldFeatures;
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const textUsername = matchUsername(fieldText);
    const labelUsername = matchUsername(labelText);
    const haystack = fieldAttrs.concat(fieldText).concat(labelText);
    const matchEmail = any(matchEmailAttr)(haystack);
    const loginForm = loginScore > 0.5;
    const isFirstField = prevField === null && nextField !== null;
    const loginUsername = loginForm && isFirstField && !matchEmail;
    return {
        autocompleteUsername: boolInt(fieldFeatures.autocomplete === 'username'),
        autocompleteNickname: boolInt(fieldFeatures.autocomplete === 'nickname'),
        autocompleteEmail: boolInt(fieldFeatures.autocomplete === 'email'),
        autocompleteOff: boolInt(fieldFeatures.autocomplete === 'off'),
        attrUsername: boolInt(attrUsername),
        textUsername: boolInt(textUsername),
        labelUsername: boolInt(labelUsername),
        loginUsername: boolInt(loginUsername),
    };
};

const USERNAME_FIELD_FEATURES = [
    'autocompleteUsername',
    'autocompleteNickname',
    'autocompleteEmail',
    'autocompleteOff',
    'attrUsername',
    'textUsername',
    'labelUsername',
    'loginUsername',
];

const getHiddenUserFieldFeatures = (fnode) => {
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, autocomplete } = fieldFeatures;
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const attrEmail = any(matchEmailAttr)(fieldAttrs);
    const usernameName = field.matches('[name="username"]');
    const autocompleteUsername = autocomplete === 'username';
    const valueEmail = matchEmailValue(fieldFeatures.value);
    const valueTel = matchTelValue(fieldFeatures.value);
    const valueUsername = matchUsernameValue(fieldFeatures.value);
    return {
        loginScore: fieldFeatures.loginScore,
        registerScore: fieldFeatures.registerScore,
        exotic: fieldFeatures.exotic,
        dangling: fieldFeatures.dangling,
        attrUsername: boolInt(attrUsername),
        attrEmail: boolInt(attrEmail),
        usernameName: boolInt(usernameName),
        autocompleteUsername: boolInt(autocompleteUsername),
        hiddenEmailValue: boolInt(valueEmail),
        hiddenTelValue: boolInt(valueTel),
        hiddenUsernameValue: boolInt(valueUsername),
    };
};

const HIDDEN_USER_FIELD_FEATURES = [
    'loginScore',
    'registerScore',
    'exotic',
    'dangling',
    'attrUsername',
    'attrEmail',
    'usernameName',
    'autocompleteUsername',
    'hiddenEmailValue',
    'hiddenTelValue',
    'hiddenUsernameValue',
];

const getOTPFieldFeatures = (fnode) => {
    var _a;
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField, type, minLength, maxLength } = fieldFeatures;
    const formMfa = fieldFeatures.mfaScore > 0.5;
    const resendCodeLink = Boolean(
        (_a = fieldFeatures === null || fieldFeatures === void 0 ? void 0 : fieldFeatures.formFeatures) === null ||
            _a === void 0
            ? void 0
            : _a.resendCodeLink
    );
    const patternOTP = OTP_PATTERNS.includes(field.pattern);
    const exactAttr = ['code', 'token', 'otp', 'otc', 'totp'];
    const nameMatch = exactAttr.some((match) => field.name === match);
    const idMatch = exactAttr.some((match) => field.id === match);
    const { area, top, bottom, width } = getNodeRect(field);
    const maybeGroup = width < 100;
    const prevRect = prevField ? getNodeRect(prevField) : null;
    const nextRect = nextField ? getNodeRect(nextField) : null;
    const prevCheck =
        maybeGroup &&
        prevField &&
        (prevField === null || prevField === void 0 ? void 0 : prevField.getAttribute('type')) === type;
    const nextCheck =
        maybeGroup &&
        nextField &&
        (nextField === null || nextField === void 0 ? void 0 : nextField.getAttribute('type')) === type;
    const prevAligned = prevCheck
        ? top === (prevRect === null || prevRect === void 0 ? void 0 : prevRect.top) &&
          bottom === (prevRect === null || prevRect === void 0 ? void 0 : prevRect.bottom)
        : false;
    const prevArea = prevCheck ? area === (prevRect === null || prevRect === void 0 ? void 0 : prevRect.area) : false;
    const nextAligned = nextCheck
        ? top === (nextRect === null || nextRect === void 0 ? void 0 : nextRect.top) &&
          bottom === (nextRect === null || nextRect === void 0 ? void 0 : nextRect.top)
        : false;
    const nextArea = nextCheck ? area === (nextRect === null || nextRect === void 0 ? void 0 : nextRect.area) : false;
    const attrOTP = any(matchOtpAttr)(fieldAttrs);
    const attrMFA = any(matchMfaAttr)(fieldAttrs);
    const attrOutlier = any(matchOtpOutlier)(fieldAttrs);
    const textOTP = matchOtpAttr(fieldText);
    const textMFA = matchMfa(fieldText);
    const textOutlier = matchOtpOutlier(fieldText);
    const labelOTP = matchOtpAttr(labelText);
    const labelMFA = matchMfa(labelText);
    const labelOutlier = matchOtpOutlier(labelText);
    const parents = [getNthParent(field)(1), getNthParent(field)(2)];
    const wrapperAttrs = parents.flatMap(getBaseAttributes);
    const wrapperOTP = any(matchOtpAttr)(wrapperAttrs);
    const wrapperMFA = any(matchMfaAttr)(wrapperAttrs);
    const wrapperOutlier = any(matchOtpOutlier)(wrapperAttrs);
    return {
        mfaScore: fieldFeatures.mfaScore,
        exotic: boolInt(fieldFeatures.exotic),
        dangling: boolInt(fieldFeatures.dangling),
        resendCodeLink: boolInt(formMfa && resendCodeLink),
        hidden: boolInt(!fieldFeatures.visible),
        required: boolInt(fieldFeatures.required),
        nameMatch: boolInt(nameMatch),
        idMatch: boolInt(idMatch),
        numericMode: boolInt(field.inputMode === 'numeric'),
        autofocused: boolInt(field.autofocus),
        tabIndex1: boolInt(field.tabIndex === 1),
        patternOTP: boolInt(patternOTP),
        maxLength1: boolInt(maxLength === 1),
        maxLength5: boolInt(maxLength === 5),
        minLength6: boolInt(minLength === 6),
        maxLength6: boolInt(maxLength === 6),
        maxLength20: boolInt(maxLength === 20),
        autocompleteOTC: boolInt(fieldFeatures.autocomplete === 'one-time-code'),
        autocompleteOff: boolInt(fieldFeatures.autocomplete === 'off'),
        prevAligned: boolInt(prevAligned),
        prevArea: boolInt(prevArea),
        nextAligned: boolInt(nextAligned),
        nextArea: boolInt(nextArea),
        attrMFA: boolInt(attrMFA),
        attrOTP: boolInt(attrOTP),
        attrOutlier: boolInt(attrOutlier),
        textMFA: boolInt(textMFA),
        textOTP: boolInt(textOTP),
        textOutlier: boolInt(textOutlier),
        labelMFA: boolInt(labelMFA),
        labelOTP: boolInt(labelOTP),
        labelOutlier: boolInt(labelOutlier),
        wrapperMFA: boolInt(wrapperMFA),
        wrapperOTP: boolInt(wrapperOTP),
        wrapperOutlier: boolInt(wrapperOutlier),
    };
};

const OTP_FIELD_FEATURES = [
    'mfaScore',
    'exotic',
    'dangling',
    'resendCodeLink',
    'hidden',
    'required',
    'nameMatch',
    'idMatch',
    'numericMode',
    'autofocused',
    'tabIndex1',
    'patternOTP',
    'maxLength1',
    'maxLength5',
    'minLength6',
    'maxLength6',
    'maxLength20',
    'autocompleteOTC',
    'autocompleteOff',
    'prevAligned',
    'prevArea',
    'nextAligned',
    'nextArea',
    'attrMFA',
    'attrOTP',
    'attrOutlier',
    'textMFA',
    'textOTP',
    'textOutlier',
    'labelMFA',
    'labelOTP',
    'labelOutlier',
    'wrapperMFA',
    'wrapperOTP',
    'wrapperOutlier',
];

const results$a = {
    coeffs: [
        ['login-fieldsCount', -0.12154911458492279],
        ['login-inputCount', 2.461285352706909],
        ['login-fieldsetCount', -7.140998363494873],
        ['login-textCount', -12.085038185119629],
        ['login-textareaCount', -6.476294040679932],
        ['login-selectCount', -10.934160232543945],
        ['login-checkboxCount', 8.79586124420166],
        ['login-radioCount', -0.070701003074646],
        ['login-numberCount', -6.115692138671875],
        ['login-dateCount', -50.236671447753906],
        ['login-identifierCount', 0.3984067142009735],
        ['login-usernameCount', 14.723980903625488],
        ['login-emailCount', -12.890583038330078],
        ['login-submitCount', -12.405800819396973],
        ['login-hasTels', -0.6413776874542236],
        ['login-hasOAuth', 5.210321426391602],
        ['login-hasCaptchas', 4.650158882141113],
        ['login-hasFiles', -0.0025755539536476135],
        ['login-noPasswordFields', -11.057723999023438],
        ['login-onePasswordField', 5.670167922973633],
        ['login-twoPasswordFields', -13.501699447631836],
        ['login-threePasswordFields', -7.484696865081787],
        ['login-oneIdentifierField', 8.268074989318848],
        ['login-twoIdentifierFields', -17.362764358520508],
        ['login-threeIdentifierFields', -6.259116172790527],
        ['login-hasHiddenIdentifier', -4.881371974945068],
        ['login-hasHiddenPassword', 9.429998397827148],
        ['login-autofocusedIsPassword', 14.758810043334961],
        ['login-visibleRatio', 2.999065637588501],
        ['login-inputRatio', -5.1420512199401855],
        ['login-hiddenRatio', 3.84120512008667],
        ['login-identifierRatio', 8.568971633911133],
        ['login-emailRatio', 5.262757778167725],
        ['login-usernameRatio', -14.785562515258789],
        ['login-passwordRatio', 8.14280891418457],
        ['login-requiredRatio', -1.8858706951141357],
        ['login-patternRatio', -2.6667017936706543],
        ['login-minMaxLengthRatio', -4.798901081085205],
        ['login-pageLogin', 13.117637634277344],
        ['login-formTextLogin', 8.515422821044922],
        ['login-formAttrsLogin', 5.8663225173950195],
        ['login-headingsLogin', 23.473060607910156],
        ['login-layoutLogin', 0.37848323583602905],
        ['login-rememberMeCheckbox', 8.830137252807617],
        ['login-forgotPasswordLink', 2.325030565261841],
        ['login-submitLogin', 4.189028263092041],
        ['login-pageRegister', -9.384137153625488],
        ['login-formTextRegister', 0.010888874530792236],
        ['login-formAttrsRegister', -14.130613327026367],
        ['login-headingsRegister', -7.415694713592529],
        ['login-layoutRegister', -11.705971717834473],
        ['login-checkboxTOS', 0.06177692115306854],
        ['login-submitRegister', -18.772830963134766],
        ['login-pagePwReset', -6.739149570465088],
        ['login-formTextPwReset', -6.074038505554199],
        ['login-formAttrsPwReset', -12.7841157913208],
        ['login-headingsPwReset', -9.607181549072266],
        ['login-layoutPwReset', -5.91611909866333],
        ['login-pageRecovery', 1.9608616828918457],
        ['login-formTextRecovery', 0.028187096118927002],
        ['login-formAttrsRecovery', -11.586666107177734],
        ['login-headingsRecovery', -2.7858943939208984],
        ['login-layoutRecovery', 5.199771404266357],
        ['login-identifierRecovery', -7.426503658294678],
        ['login-formTextMFA', -0.017758943140506744],
        ['login-formAttrsMFA', -1.7303369045257568],
        ['login-headingsMFA', -7.585179328918457],
        ['login-layoutMFA', -3.7709898948669434],
        ['login-buttonVerify', -5.377597808837891],
        ['login-inputsMFA', -22.16863250732422],
        ['login-inputsOTP', -7.6101975440979],
        ['login-resendCodeLink', 3.030848979949951],
        ['login-headingsNewsletter', -6.710803985595703],
        ['login-oneVisibleField', -6.40455961227417],
        ['login-buttonMultiStep', 3.3173398971557617],
        ['login-buttonMultiAction', 30.692520141601562],
        ['login-headingsMultiStep', -12.507068634033203],
    ],
    bias: -6.53515100479126,
    cutoff: 0.5,
};

const login = {
    name: 'login',
    coeffs: FORM_FEATURES.map((key) => {
        var _a, _b;
        return [
            `login-${key}`,
            (_b =
                (_a = results$a.coeffs.find(([feature]) => feature === `login-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$a.bias,
    cutoff: results$a.cutoff,
    getRules: () => [
        rule(type('form'), type('login'), {}),
        ...FORM_FEATURES.map((key) =>
            rule(type('login'), featureScore('form', key), {
                name: `login-${key}`,
            })
        ),
        rule(type('login'), out('login'), {}),
    ],
};

const results$9 = {
    coeffs: [
        ['pw-change-fieldsCount', -0.437802255153656],
        ['pw-change-inputCount', -0.004965530708432198],
        ['pw-change-fieldsetCount', -5.973891735076904],
        ['pw-change-textCount', -6.074131488800049],
        ['pw-change-textareaCount', -6.077847957611084],
        ['pw-change-selectCount', -6.076735019683838],
        ['pw-change-checkboxCount', -6.092909336090088],
        ['pw-change-radioCount', -0.1105835810303688],
        ['pw-change-numberCount', -6.114284515380859],
        ['pw-change-dateCount', -6.010956764221191],
        ['pw-change-identifierCount', -5.446685791015625],
        ['pw-change-usernameCount', -6.099312782287598],
        ['pw-change-emailCount', -3.8525679111480713],
        ['pw-change-submitCount', -1.4409830570220947],
        ['pw-change-hasTels', -5.901493549346924],
        ['pw-change-hasOAuth', -6.07710599899292],
        ['pw-change-hasCaptchas', -6.115212440490723],
        ['pw-change-hasFiles', -0.014642208814620972],
        ['pw-change-noPasswordFields', -5.931713104248047],
        ['pw-change-onePasswordField', -6.131531238555908],
        ['pw-change-twoPasswordFields', 13.5730562210083],
        ['pw-change-threePasswordFields', 19.48635482788086],
        ['pw-change-oneIdentifierField', -6.095104694366455],
        ['pw-change-twoIdentifierFields', -6.117751598358154],
        ['pw-change-threeIdentifierFields', 13.330459594726562],
        ['pw-change-hasHiddenIdentifier', -0.3566877245903015],
        ['pw-change-hasHiddenPassword', -6.1067280769348145],
        ['pw-change-autofocusedIsPassword', 21.393699645996094],
        ['pw-change-visibleRatio', -3.1284055709838867],
        ['pw-change-inputRatio', -3.22556471824646],
        ['pw-change-hiddenRatio', -4.245065212249756],
        ['pw-change-identifierRatio', -5.33265495300293],
        ['pw-change-emailRatio', -5.1591339111328125],
        ['pw-change-usernameRatio', -6.1001973152160645],
        ['pw-change-passwordRatio', 3.3696348667144775],
        ['pw-change-requiredRatio', -4.056987285614014],
        ['pw-change-patternRatio', 2.1815359592437744],
        ['pw-change-minMaxLengthRatio', -2.4225494861602783],
        ['pw-change-pageLogin', -5.996464729309082],
        ['pw-change-formTextLogin', -6.115025520324707],
        ['pw-change-formAttrsLogin', -6.057379245758057],
        ['pw-change-headingsLogin', -5.9136223793029785],
        ['pw-change-layoutLogin', -6.024265289306641],
        ['pw-change-rememberMeCheckbox', -5.984213352203369],
        ['pw-change-forgotPasswordLink', -3.3825478553771973],
        ['pw-change-submitLogin', -6.06403923034668],
        ['pw-change-pageRegister', -5.968944549560547],
        ['pw-change-formTextRegister', 0.052758634090423584],
        ['pw-change-formAttrsRegister', -5.9056477546691895],
        ['pw-change-headingsRegister', -6.074726104736328],
        ['pw-change-layoutRegister', -5.995913505554199],
        ['pw-change-checkboxTOS', 0.05874970555305481],
        ['pw-change-submitRegister', -5.975183963775635],
        ['pw-change-pagePwReset', 15.630895614624023],
        ['pw-change-formTextPwReset', 17.458877563476562],
        ['pw-change-formAttrsPwReset', 4.758090972900391],
        ['pw-change-headingsPwReset', 16.05355453491211],
        ['pw-change-layoutPwReset', 13.981493949890137],
        ['pw-change-pageRecovery', -5.907494068145752],
        ['pw-change-formTextRecovery', 0.05384780466556549],
        ['pw-change-formAttrsRecovery', -5.920716285705566],
        ['pw-change-headingsRecovery', -6.080102443695068],
        ['pw-change-layoutRecovery', -5.95471715927124],
        ['pw-change-identifierRecovery', -5.920027732849121],
        ['pw-change-formTextMFA', -0.033274732530117035],
        ['pw-change-formAttrsMFA', -5.915701866149902],
        ['pw-change-headingsMFA', -6.095946788787842],
        ['pw-change-layoutMFA', -5.965510368347168],
        ['pw-change-buttonVerify', -6.108850002288818],
        ['pw-change-inputsMFA', -5.931102752685547],
        ['pw-change-inputsOTP', -5.949840068817139],
        ['pw-change-resendCodeLink', -3.719968318939209],
        ['pw-change-headingsNewsletter', -6.104799747467041],
        ['pw-change-oneVisibleField', -5.964138984680176],
        ['pw-change-buttonMultiStep', -5.946258544921875],
        ['pw-change-buttonMultiAction', -5.969348430633545],
        ['pw-change-headingsMultiStep', -6.054088592529297],
    ],
    bias: -3.415200710296631,
    cutoff: 1,
};

const passwordChange = {
    name: 'password-change',
    coeffs: FORM_FEATURES.map((key) => {
        var _a, _b;
        return [
            `pw-change-${key}`,
            (_b =
                (_a = results$9.coeffs.find(([feature]) => feature === `pw-change-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$9.bias,
    cutoff: results$9.cutoff,
    getRules: () => [
        rule(type('form'), type('password-change'), {}),
        ...FORM_FEATURES.map((key) =>
            rule(type('password-change'), featureScore('form', key), {
                name: `pw-change-${key}`,
            })
        ),
        rule(type('password-change'), out('password-change'), {}),
    ],
};

const results$8 = {
    coeffs: [
        ['register-fieldsCount', 7.813930988311768],
        ['register-inputCount', 6.533504962921143],
        ['register-fieldsetCount', 20.00979995727539],
        ['register-textCount', 6.7844672203063965],
        ['register-textareaCount', -9.467883110046387],
        ['register-selectCount', -9.07299518585205],
        ['register-checkboxCount', -6.818871974945068],
        ['register-radioCount', -0.10520818829536438],
        ['register-numberCount', 58.27774429321289],
        ['register-dateCount', 11.924921989440918],
        ['register-identifierCount', 6.898944854736328],
        ['register-usernameCount', -7.192052364349365],
        ['register-emailCount', 7.50524377822876],
        ['register-submitCount', 16.883098602294922],
        ['register-hasTels', 0.9597358107566833],
        ['register-hasOAuth', 10.097823143005371],
        ['register-hasCaptchas', -1.5729269981384277],
        ['register-hasFiles', -0.06754402816295624],
        ['register-noPasswordFields', -9.043800354003906],
        ['register-onePasswordField', -5.7699480056762695],
        ['register-twoPasswordFields', 11.049606323242188],
        ['register-threePasswordFields', -6.932529449462891],
        ['register-oneIdentifierField', 7.715895652770996],
        ['register-twoIdentifierFields', 0.9513679146766663],
        ['register-threeIdentifierFields', 10.085927963256836],
        ['register-hasHiddenIdentifier', 0.9445386528968811],
        ['register-hasHiddenPassword', 13.260576248168945],
        ['register-autofocusedIsPassword', -7.253711700439453],
        ['register-visibleRatio', 6.116726398468018],
        ['register-inputRatio', -6.871824741363525],
        ['register-hiddenRatio', -2.1174347400665283],
        ['register-identifierRatio', 6.003827095031738],
        ['register-emailRatio', -8.195093154907227],
        ['register-usernameRatio', -22.186025619506836],
        ['register-passwordRatio', -12.565973281860352],
        ['register-requiredRatio', -6.204838752746582],
        ['register-patternRatio', -22.666282653808594],
        ['register-minMaxLengthRatio', -11.1808500289917],
        ['register-pageLogin', -11.045900344848633],
        ['register-formTextLogin', -5.970494747161865],
        ['register-formAttrsLogin', -5.304567337036133],
        ['register-headingsLogin', -8.358848571777344],
        ['register-layoutLogin', -5.908051013946533],
        ['register-rememberMeCheckbox', -6.676364421844482],
        ['register-forgotPasswordLink', -3.6915860176086426],
        ['register-submitLogin', -4.717809677124023],
        ['register-pageRegister', -0.8072595596313477],
        ['register-formTextRegister', 0.03630685806274414],
        ['register-formAttrsRegister', 18.844863891601562],
        ['register-headingsRegister', 11.707311630249023],
        ['register-layoutRegister', 7.646620750427246],
        ['register-checkboxTOS', 0.06461261212825775],
        ['register-submitRegister', 18.433460235595703],
        ['register-pagePwReset', -5.968874454498291],
        ['register-formTextPwReset', -6.078824043273926],
        ['register-formAttrsPwReset', -6.551336288452148],
        ['register-headingsPwReset', -15.424942970275879],
        ['register-layoutPwReset', -12.96815013885498],
        ['register-pageRecovery', -12.514888763427734],
        ['register-formTextRecovery', 0.07533426582813263],
        ['register-formAttrsRecovery', -6.922459125518799],
        ['register-headingsRecovery', -1.4643547534942627],
        ['register-layoutRecovery', -10.599151611328125],
        ['register-identifierRecovery', -30.673973083496094],
        ['register-formTextMFA', 0.031029462814331055],
        ['register-formAttrsMFA', 17.077022552490234],
        ['register-headingsMFA', -25.023094177246094],
        ['register-layoutMFA', -3.320484161376953],
        ['register-buttonVerify', -8.065232276916504],
        ['register-inputsMFA', -12.874144554138184],
        ['register-inputsOTP', -6.007378101348877],
        ['register-resendCodeLink', -6.251247406005859],
        ['register-headingsNewsletter', -6.11205530166626],
        ['register-oneVisibleField', -6.108449935913086],
        ['register-buttonMultiStep', 16.567245483398438],
        ['register-buttonMultiAction', 1.4855459928512573],
        ['register-headingsMultiStep', 46.561248779296875],
    ],
    bias: -6.63426399230957,
    cutoff: 0.49,
};

const register = {
    name: 'register',
    coeffs: FORM_FEATURES.map((key) => {
        var _a, _b;
        return [
            `register-${key}`,
            (_b =
                (_a = results$8.coeffs.find(([feature]) => feature === `register-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$8.bias,
    cutoff: results$8.cutoff,
    getRules: () => [
        rule(type('form'), type('register'), {}),
        ...FORM_FEATURES.map((key) =>
            rule(type('register'), featureScore('form', key), {
                name: `register-${key}`,
            })
        ),
        rule(type('register'), out('register'), {}),
    ],
};

const results$7 = {
    coeffs: [
        ['recovery-fieldsCount', -5.822851657867432],
        ['recovery-inputCount', -10.255459785461426],
        ['recovery-fieldsetCount', -2.7124054431915283],
        ['recovery-textCount', -0.9807787537574768],
        ['recovery-textareaCount', -39.24760818481445],
        ['recovery-selectCount', -35.44499206542969],
        ['recovery-checkboxCount', -5.940938949584961],
        ['recovery-radioCount', -0.006725810468196869],
        ['recovery-numberCount', -24.77027130126953],
        ['recovery-dateCount', -5.908498764038086],
        ['recovery-identifierCount', 4.252688407897949],
        ['recovery-usernameCount', 3.4622251987457275],
        ['recovery-emailCount', 5.755636692047119],
        ['recovery-submitCount', 6.495894908905029],
        ['recovery-hasTels', -28.456035614013672],
        ['recovery-hasOAuth', -3.969236135482788],
        ['recovery-hasCaptchas', -0.8459012508392334],
        ['recovery-hasFiles', -0.04971013963222504],
        ['recovery-noPasswordFields', 6.762832164764404],
        ['recovery-onePasswordField', -28.290996551513672],
        ['recovery-twoPasswordFields', -10.598909378051758],
        ['recovery-threePasswordFields', -15.664083480834961],
        ['recovery-oneIdentifierField', -2.1469340324401855],
        ['recovery-twoIdentifierFields', 49.232181549072266],
        ['recovery-threeIdentifierFields', -7.068774700164795],
        ['recovery-hasHiddenIdentifier', 7.084658622741699],
        ['recovery-hasHiddenPassword', -8.990255355834961],
        ['recovery-autofocusedIsPassword', -6.087709426879883],
        ['recovery-visibleRatio', 8.485962867736816],
        ['recovery-inputRatio', -9.399215698242188],
        ['recovery-hiddenRatio', 2.90071702003479],
        ['recovery-identifierRatio', 7.314140319824219],
        ['recovery-emailRatio', -6.377230644226074],
        ['recovery-usernameRatio', 28.112497329711914],
        ['recovery-passwordRatio', -17.335176467895508],
        ['recovery-requiredRatio', 1.332362174987793],
        ['recovery-patternRatio', -1.1079922914505005],
        ['recovery-minMaxLengthRatio', 3.3848717212677],
        ['recovery-pageLogin', -9.766427993774414],
        ['recovery-formTextLogin', -6.611151218414307],
        ['recovery-formAttrsLogin', 9.73953914642334],
        ['recovery-headingsLogin', -31.29189109802246],
        ['recovery-layoutLogin', -20.57403564453125],
        ['recovery-rememberMeCheckbox', -5.936448574066162],
        ['recovery-forgotPasswordLink', -0.2510957717895508],
        ['recovery-submitLogin', -3.9080617427825928],
        ['recovery-pageRegister', -1.6884299516677856],
        ['recovery-formTextRegister', -0.0005130991339683533],
        ['recovery-formAttrsRegister', -46.00291061401367],
        ['recovery-headingsRegister', -13.423559188842773],
        ['recovery-layoutRegister', 5.480484962463379],
        ['recovery-checkboxTOS', -0.07938031852245331],
        ['recovery-submitRegister', -21.887737274169922],
        ['recovery-pagePwReset', 7.2587480545043945],
        ['recovery-formTextPwReset', -8.964019775390625],
        ['recovery-formAttrsPwReset', 10.554862022399902],
        ['recovery-headingsPwReset', 13.531922340393066],
        ['recovery-layoutPwReset', 0.7576491236686707],
        ['recovery-pageRecovery', 10.832507133483887],
        ['recovery-formTextRecovery', -0.03642262518405914],
        ['recovery-formAttrsRecovery', 20.920482635498047],
        ['recovery-headingsRecovery', -5.247730255126953],
        ['recovery-layoutRecovery', 4.768974304199219],
        ['recovery-identifierRecovery', 13.682618141174316],
        ['recovery-formTextMFA', 0.01621432602405548],
        ['recovery-formAttrsMFA', -12.629483222961426],
        ['recovery-headingsMFA', -9.03878402709961],
        ['recovery-layoutMFA', -6.021658420562744],
        ['recovery-buttonVerify', -9.217513084411621],
        ['recovery-inputsMFA', 4.55673360824585],
        ['recovery-inputsOTP', 7.967427730560303],
        ['recovery-resendCodeLink', 9.705978393554688],
        ['recovery-headingsNewsletter', -16.145591735839844],
        ['recovery-oneVisibleField', -7.330148696899414],
        ['recovery-buttonMultiStep', 0.42249608039855957],
        ['recovery-buttonMultiAction', -7.016070365905762],
        ['recovery-headingsMultiStep', -6.029016971588135],
    ],
    bias: -5.382709503173828,
    cutoff: 0.43,
};

const recovery = {
    name: 'recovery',
    coeffs: FORM_FEATURES.map((key) => {
        var _a, _b;
        return [
            `recovery-${key}`,
            (_b =
                (_a = results$7.coeffs.find(([feature]) => feature === `recovery-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$7.bias,
    cutoff: results$7.cutoff,
    getRules: () => [
        rule(type('form'), type('recovery'), {}),
        ...FORM_FEATURES.map((key) =>
            rule(type('recovery'), featureScore('form', key), {
                name: `recovery-${key}`,
            })
        ),
        rule(type('recovery'), out('recovery'), {}),
    ],
};

const results$6 = {
    coeffs: [
        ['mfa-fieldsCount', -5.465503215789795],
        ['mfa-inputCount', -5.787539958953857],
        ['mfa-fieldsetCount', 3.4489030838012695],
        ['mfa-textCount', -1.0006723403930664],
        ['mfa-textareaCount', -6.134603023529053],
        ['mfa-selectCount', -6.101850509643555],
        ['mfa-checkboxCount', -6.10553503036499],
        ['mfa-radioCount', -0.04526618868112564],
        ['mfa-numberCount', 11.1815824508667],
        ['mfa-dateCount', -6.112937927246094],
        ['mfa-identifierCount', -4.7586469650268555],
        ['mfa-usernameCount', -4.421319007873535],
        ['mfa-emailCount', -6.7580108642578125],
        ['mfa-submitCount', -3.7069499492645264],
        ['mfa-hasTels', 10.97076416015625],
        ['mfa-hasOAuth', -7.93314266204834],
        ['mfa-hasCaptchas', -2.1404776573181152],
        ['mfa-hasFiles', 0.08006419241428375],
        ['mfa-noPasswordFields', -1.367625117301941],
        ['mfa-onePasswordField', -5.714739799499512],
        ['mfa-twoPasswordFields', -10.445584297180176],
        ['mfa-threePasswordFields', -5.96754789352417],
        ['mfa-oneIdentifierField', -4.224710941314697],
        ['mfa-twoIdentifierFields', -6.069561958312988],
        ['mfa-threeIdentifierFields', -6.039858818054199],
        ['mfa-hasHiddenIdentifier', -3.9915425777435303],
        ['mfa-hasHiddenPassword', -2.4947125911712646],
        ['mfa-autofocusedIsPassword', 10.345226287841797],
        ['mfa-visibleRatio', -1.7905268669128418],
        ['mfa-inputRatio', -3.778654098510742],
        ['mfa-hiddenRatio', 1.906337857246399],
        ['mfa-identifierRatio', -4.929647922515869],
        ['mfa-emailRatio', -6.688450336456299],
        ['mfa-usernameRatio', -5.639652729034424],
        ['mfa-passwordRatio', -6.1585588455200195],
        ['mfa-requiredRatio', 9.430044174194336],
        ['mfa-patternRatio', 9.82912540435791],
        ['mfa-minMaxLengthRatio', 3.345301628112793],
        ['mfa-pageLogin', 2.8674111366271973],
        ['mfa-formTextLogin', -5.989467144012451],
        ['mfa-formAttrsLogin', -2.7181684970855713],
        ['mfa-headingsLogin', -5.282788276672363],
        ['mfa-layoutLogin', 0.5821623206138611],
        ['mfa-rememberMeCheckbox', -6.103933811187744],
        ['mfa-forgotPasswordLink', -3.755204200744629],
        ['mfa-submitLogin', -0.8417073488235474],
        ['mfa-pageRegister', -3.592285633087158],
        ['mfa-formTextRegister', 0.0824795812368393],
        ['mfa-formAttrsRegister', -3.7658393383026123],
        ['mfa-headingsRegister', -7.545773983001709],
        ['mfa-layoutRegister', -5.134975433349609],
        ['mfa-checkboxTOS', 0.06732474267482758],
        ['mfa-submitRegister', -6.013308048248291],
        ['mfa-pagePwReset', -6.007118225097656],
        ['mfa-formTextPwReset', -6.118069648742676],
        ['mfa-formAttrsPwReset', -6.012052059173584],
        ['mfa-headingsPwReset', -5.903806686401367],
        ['mfa-layoutPwReset', -5.9917402267456055],
        ['mfa-pageRecovery', 4.373501777648926],
        ['mfa-formTextRecovery', 0.055291324853897095],
        ['mfa-formAttrsRecovery', -8.380549430847168],
        ['mfa-headingsRecovery', -8.811086654663086],
        ['mfa-layoutRecovery', 2.741628885269165],
        ['mfa-identifierRecovery', -6.001178741455078],
        ['mfa-formTextMFA', -0.041736871004104614],
        ['mfa-formAttrsMFA', 12.219098091125488],
        ['mfa-headingsMFA', 15.670146942138672],
        ['mfa-layoutMFA', 11.590296745300293],
        ['mfa-buttonVerify', 13.3416109085083],
        ['mfa-inputsMFA', 15.41768741607666],
        ['mfa-inputsOTP', 16.41243553161621],
        ['mfa-resendCodeLink', -4.913792610168457],
        ['mfa-headingsNewsletter', -6.112669944763184],
        ['mfa-oneVisibleField', 2.2770867347717285],
        ['mfa-buttonMultiStep', 0.9518983364105225],
        ['mfa-buttonMultiAction', -6.0521159172058105],
        ['mfa-headingsMultiStep', 8.583253860473633],
    ],
    bias: -4.104452610015869,
    cutoff: 0.5,
};

const mfa = {
    name: 'mfa',
    coeffs: FORM_FEATURES.map((key) => {
        var _a, _b;
        return [
            `mfa-${key}`,
            (_b =
                (_a = results$6.coeffs.find(([feature]) => feature === `mfa-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$6.bias,
    cutoff: results$6.cutoff,
    getRules: () => [
        rule(type('form'), type('mfa'), {}),
        ...FORM_FEATURES.map((key) =>
            rule(type('mfa'), featureScore('form', key), {
                name: `mfa-${key}`,
            })
        ),
        rule(type('mfa'), out('mfa'), {}),
    ],
};

const results$5 = {
    coeffs: [
        ['pw-loginScore', 10.805782318115234],
        ['pw-registerScore', -12.136637687683105],
        ['pw-pwChangeScore', -5.617076396942139],
        ['pw-exotic', -12.416576385498047],
        ['pw-dangling', 0.1087384968996048],
        ['pw-autocompleteNew', -1.6861211061477661],
        ['pw-autocompleteCurrent', 6.266680717468262],
        ['pw-autocompleteOff', -1.842005729675293],
        ['pw-isOnlyPassword', 3.3341152667999268],
        ['pw-prevPwField', -0.25090184807777405],
        ['pw-nextPwField', -2.271298885345459],
        ['pw-attrCreate', -4.5093512535095215],
        ['pw-attrCurrent', 1.4921172857284546],
        ['pw-attrConfirm', -6.732929706573486],
        ['pw-attrReset', -0.17328310012817383],
        ['pw-textCreate', -3.097179889678955],
        ['pw-textCurrent', 6.403375625610352],
        ['pw-textConfirm', -6.644237041473389],
        ['pw-textReset', 0.14239554107189178],
        ['pw-labelCreate', -7.790415287017822],
        ['pw-labelCurrent', 9.515081405639648],
        ['pw-labelConfirm', -7.237422943115234],
        ['pw-labelReset', -0.18563410639762878],
        ['pw-prevPwCreate', -6.996121883392334],
        ['pw-prevPwCurrent', -8.011124610900879],
        ['pw-prevPwConfirm', 0.00017528235912322998],
        ['pw-nextPwCreate', 9.818825721740723],
        ['pw-nextPwCurrent', -0.18435963988304138],
        ['pw-nextPwConfirm', -7.494863033294678],
    ],
    bias: 0.2329735904932022,
    cutoff: 0.5,
};

const password = {
    name: 'password',
    coeffs: PW_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `pw-${key}`,
            (_b =
                (_a = results$5.coeffs.find(([feature]) => feature === `pw-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$5.bias,
    cutoff: results$5.cutoff,
    getRules: () => [
        rule(type('password-field'), type('password'), {}),
        ...PW_FIELD_FEATURES.map((key) =>
            rule(type('password'), featureScore('password-field', key), {
                name: `pw-${key}`,
            })
        ),
        rule(type('password'), out('password'), {}),
    ],
};

const results$4 = {
    coeffs: [
        ['pw[new]-loginScore', -10.708755493164062],
        ['pw[new]-registerScore', 12.294958114624023],
        ['pw[new]-pwChangeScore', 5.660346031188965],
        ['pw[new]-exotic', 12.786745071411133],
        ['pw[new]-dangling', -0.1383805274963379],
        ['pw[new]-autocompleteNew', 1.4308620691299438],
        ['pw[new]-autocompleteCurrent', -6.1613545417785645],
        ['pw[new]-autocompleteOff', 1.6313241720199585],
        ['pw[new]-isOnlyPassword', -3.467663288116455],
        ['pw[new]-prevPwField', 0.3160400092601776],
        ['pw[new]-nextPwField', 2.6359472274780273],
        ['pw[new]-attrCreate', 4.75818395614624],
        ['pw[new]-attrCurrent', -1.2707359790802002],
        ['pw[new]-attrConfirm', 6.798645973205566],
        ['pw[new]-attrReset', -0.11036255210638046],
        ['pw[new]-textCreate', 3.1503589153289795],
        ['pw[new]-textCurrent', -6.0819926261901855],
        ['pw[new]-textConfirm', 6.6847710609436035],
        ['pw[new]-textReset', 0.1140182763338089],
        ['pw[new]-labelCreate', 7.8011274337768555],
        ['pw[new]-labelCurrent', -9.551847457885742],
        ['pw[new]-labelConfirm', 7.331621170043945],
        ['pw[new]-labelReset', 0.14898772537708282],
        ['pw[new]-prevPwCreate', 7.377809524536133],
        ['pw[new]-prevPwCurrent', 7.725295066833496],
        ['pw[new]-prevPwConfirm', 0.08433477580547333],
        ['pw[new]-nextPwCreate', -10.201923370361328],
        ['pw[new]-nextPwCurrent', 0.13857664167881012],
        ['pw[new]-nextPwConfirm', 7.714295864105225],
    ],
    bias: -0.30683544278144836,
    cutoff: 0.5,
};

const newPassword = {
    name: 'new-password',
    coeffs: PW_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `pw[new]-${key}`,
            (_b =
                (_a = results$4.coeffs.find(([feature]) => feature === `pw[new]-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$4.bias,
    cutoff: results$4.cutoff,
    getRules: () => [
        rule(type('password-field'), type('new-password'), {}),
        ...PW_FIELD_FEATURES.map((key) =>
            rule(type('new-password'), featureScore('password-field', key), {
                name: `pw[new]-${key}`,
            })
        ),
        rule(type('new-password'), out('new-password'), {}),
    ],
};

const results$3 = {
    coeffs: [
        ['username-autocompleteUsername', 8.081562995910645],
        ['username-autocompleteNickname', 0.06741416454315186],
        ['username-autocompleteEmail', -7.5531816482543945],
        ['username-autocompleteOff', -0.3204955756664276],
        ['username-attrUsername', 18.24247169494629],
        ['username-textUsername', 16.11406898498535],
        ['username-labelUsername', 17.919340133666992],
        ['username-loginUsername', 18.513612747192383],
    ],
    bias: -9.85063648223877,
    cutoff: 0.5,
};

const username = {
    name: 'username',
    coeffs: USERNAME_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `username-${key}`,
            (_b =
                (_a = results$3.coeffs.find(([feature]) => feature === `username-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$3.bias,
    cutoff: results$3.cutoff,
    getRules: () => [
        rule(type('username-field'), type('username'), {}),
        ...USERNAME_FIELD_FEATURES.map((key) =>
            rule(type('username'), featureScore('username-field', key), {
                name: `username-${key}`,
            })
        ),
        rule(type('username'), out('username'), {}),
    ],
};

const results$2 = {
    coeffs: [
        ['username[hidden]-loginScore', 12.11270809173584],
        ['username[hidden]-registerScore', 11.870213508605957],
        ['username[hidden]-exotic', -7.911316871643066],
        ['username[hidden]-dangling', -0.2252122461795807],
        ['username[hidden]-attrUsername', 7.222256660461426],
        ['username[hidden]-attrEmail', 6.444874286651611],
        ['username[hidden]-usernameName', 6.60478401184082],
        ['username[hidden]-autocompleteUsername', -0.2298903614282608],
        ['username[hidden]-hiddenEmailValue', 8.248797416687012],
        ['username[hidden]-hiddenTelValue', 3.2407681941986084],
        ['username[hidden]-hiddenUsernameValue', 0.6153882741928101],
    ],
    bias: -23.40591049194336,
    cutoff: 0.53,
};

const usernameHidden = {
    name: 'username-hidden',
    coeffs: HIDDEN_USER_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `username[hidden]-${key}`,
            (_b =
                (_a = results$2.coeffs.find(([feature]) => feature === `username[hidden]-${key}`)) === null ||
                _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$2.bias,
    cutoff: results$2.cutoff,
    getRules: () => [
        rule(type('username-hidden-field'), type('username-hidden'), {}),
        ...HIDDEN_USER_FIELD_FEATURES.map((key) =>
            rule(type('username-hidden'), featureScore('username-hidden-field', key), {
                name: `username[hidden]-${key}`,
            })
        ),
        rule(type('username-hidden'), out('username-hidden'), {}),
    ],
};

const results$1 = {
    coeffs: [
        ['email-autocompleteUsername', 2.174213409423828],
        ['email-autocompleteNickname', -0.22040247917175293],
        ['email-autocompleteEmail', 6.036638259887695],
        ['email-typeEmail', 13.083451271057129],
        ['email-exactAttrEmail', 12.328649520874023],
        ['email-attrEmail', 2.782768487930298],
        ['email-textEmail', 14.976103782653809],
        ['email-labelEmail', 17.071533203125],
        ['email-placeholderEmail', 15.855646133422852],
    ],
    bias: -9.611705780029297,
    cutoff: 0.5,
};

const email = {
    name: 'email',
    coeffs: EMAIL_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `email-${key}`,
            (_b =
                (_a = results$1.coeffs.find(([feature]) => feature === `email-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$1.bias,
    cutoff: results$1.cutoff,
    getRules: () => [
        rule(type('email-field'), type('email'), {}),
        ...EMAIL_FIELD_FEATURES.map((key) =>
            rule(type('email'), featureScore('email-field', key), {
                name: `email-${key}`,
            })
        ),
        rule(type('email'), out('email'), {}),
    ],
};

const results = {
    coeffs: [
        ['otp-mfaScore', 16.225065231323242],
        ['otp-exotic', -6.801262855529785],
        ['otp-dangling', 0.13791483640670776],
        ['otp-resendCodeLink', 0.4703172743320465],
        ['otp-hidden', -0.014029890298843384],
        ['otp-required', -0.6422404646873474],
        ['otp-nameMatch', -0.47298651933670044],
        ['otp-idMatch', 9.496750831604004],
        ['otp-numericMode', 6.957618236541748],
        ['otp-autofocused', 1.8659422397613525],
        ['otp-tabIndex1', 0.14601831138134003],
        ['otp-patternOTP', 1.7259247303009033],
        ['otp-maxLength1', 8.349119186401367],
        ['otp-maxLength5', -10.725072860717773],
        ['otp-minLength6', 10.19556999206543],
        ['otp-maxLength6', 11.045036315917969],
        ['otp-maxLength20', -5.303610801696777],
        ['otp-autocompleteOTC', -0.09326211363077164],
        ['otp-autocompleteOff', -6.540106296539307],
        ['otp-prevAligned', -1.8938404321670532],
        ['otp-prevArea', 7.497990131378174],
        ['otp-nextAligned', -0.0638849213719368],
        ['otp-nextArea', 3.7413618564605713],
        ['otp-attrMFA', 7.797350883483887],
        ['otp-attrOTP', 8.822673797607422],
        ['otp-attrOutlier', -6.915619373321533],
        ['otp-textMFA', 8.543785095214844],
        ['otp-textOTP', -4.677933692932129],
        ['otp-textOutlier', -7.709341526031494],
        ['otp-labelMFA', 13.351398468017578],
        ['otp-labelOTP', -0.1406332552433014],
        ['otp-labelOutlier', -6.601027965545654],
        ['otp-wrapperMFA', -12.302718162536621],
        ['otp-wrapperOTP', -3.583059310913086],
        ['otp-wrapperOutlier', -6.324523448944092],
    ],
    bias: -10.240886688232422,
    cutoff: 0.5,
};

const otp = {
    name: 'otp',
    coeffs: OTP_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `otp-${key}`,
            (_b =
                (_a = results.coeffs.find(([feature]) => feature === `otp-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results.bias,
    cutoff: results.cutoff,
    getRules: () => [
        rule(type('otp-field'), type('otp'), {}),
        ...OTP_FIELD_FEATURES.map((key) =>
            rule(type('otp'), featureScore('otp-field', key), {
                name: `otp-${key}`,
            })
        ),
        rule(type('otp'), out('otp'), {}),
    ],
};

const { clusters, euclidean } = clusters$1;

const getCommonAncestor = (elementA, elementB) => {
    if (elementA === elementB) return elementA;
    return elementA.contains(elementB)
        ? elementA
        : elementA.parentElement
        ? getCommonAncestor(elementA.parentElement, elementB)
        : elementA;
};

const getFormLikeClusters = (doc) => {
    const forms = Array.from(doc.querySelectorAll('form'));
    const groups = Array.from(doc.querySelectorAll(clusterSelector)).filter(
        (el) => el.querySelectorAll(editableFieldSelector).length > 0
    );
    const filterFormEls = (els) => els.filter((el) => !forms.some((form) => form.contains(el)) && isVisibleField(el));
    const fields = filterFormEls(Array.from(doc.querySelectorAll(fieldSelector)));
    const inputs = fields.filter((el) => el.matches(editableFieldSelector));
    if (inputs.length === 0) return [];
    const buttons = filterFormEls(
        Array.from(document.querySelectorAll(buttonSubmitSelector)).filter(isSubmitBtnCandidate)
    );
    const candidates = Array.from(new Set([...fields, ...buttons]));
    const theClusters = clusters(candidates, MAX_CLUSTER_SPLIT_DISTANCE, (a, b) => {
        const groupA = groups.find((group) => group.contains(a));
        const groupB = groups.find((group) => group.contains(b));
        if (groupA !== groupB) {
            const oneInGroup = groupA === undefined || groupB === undefined;
            const groupWrap = oneInGroup || !(groupA.contains(groupB) || groupB.contains(groupA));
            if (groupWrap) return Number.MAX_SAFE_INTEGER;
        }
        return euclidean(a, b);
    });
    const ancestors = theClusters.map((cluster) =>
        cluster.length > 1 ? cluster.reduce(getCommonAncestor) : cluster[0].parentElement
    );
    return Array.from(
        new Set(
            ancestors
                .map((ancestor, _, allAncestors) => {
                    const parent = ancestor.parentElement;
                    const ancestorParentWrap = allAncestors.some((el) => ancestor !== el && parent.contains(el));
                    return ancestorParentWrap ? parent : ancestor;
                })
                .filter((ancestor, _, allAncestors) => {
                    const formWrap = forms.some((form) => ancestor.contains(form) || form.contains(ancestor));
                    const ancestorWrap = allAncestors.some((el) => ancestor !== el && el.contains(ancestor));
                    const containsFields = ancestor.querySelectorAll(editableFieldSelector).length > 0;
                    return !formWrap && !ancestorWrap && containsFields;
                })
        )
    );
};

const formLikeDom = () => domQuery(getFormLikeClusters);

const definitions = [
    login,
    register,
    passwordChange,
    recovery,
    mfa,
    username,
    usernameHidden,
    email,
    password,
    newPassword,
    otp,
];

const trainees = {
    forms: {
        login,
        register,
        passwordChange,
        recovery,
        mfa,
    },
    fields: {
        username,
        usernameHidden,
        email,
        password,
        newPassword,
        otp,
    },
};

const rulesetMaker = () => {
    const aggregation = definitions.reduce(
        (acc, curr) => ({
            rules: [...acc.rules, ...curr.getRules()],
            coeffs: [...acc.coeffs, ...curr.coeffs],
            biases: [...acc.biases, [curr.name, curr.bias]],
        }),
        {
            rules: [
                rule(dom(formOfInterestSelector).when(isFormOfInterest), type('form').note(getFormFeatures), {}),
                rule(formLikeDom(), type('form').note(getFormFeatures), {}),
                rule(type('form'), out('form'), {}),
                rule(dom(fieldOfInterestSelector), type('field').note(getFieldFeature), {}),
                rule(type('field'), out('field'), {}),
                rule(type('field').when(maybeEmail), type('email-field').note(getEmailFieldFeatures), {}),
                rule(type('field').when(maybeUsername), type('username-field').note(getUsernameFieldFeatures), {}),
                rule(
                    type('field').when(maybeHiddenUsername),
                    type('username-hidden-field').note(getHiddenUserFieldFeatures),
                    {}
                ),
                rule(type('field').when(maybePassword), type('password-field').note(getPasswordFieldFeatures), {}),
                rule(type('field').when(maybeOTP), type('otp-field').note(getOTPFieldFeatures), {}),
            ],
            coeffs: [],
            biases: [],
        }
    );
    const rules = ruleset(aggregation.rules, aggregation.coeffs, aggregation.biases);
    return rules;
};

export {
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
