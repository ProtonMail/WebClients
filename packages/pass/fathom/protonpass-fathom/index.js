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
        ['login-fieldsCount', -0.678265392780304],
        ['login-inputCount', 1.9660218954086304],
        ['login-fieldsetCount', -7.680098056793213],
        ['login-textCount', -11.985029220581055],
        ['login-textareaCount', -6.243383884429932],
        ['login-selectCount', -10.533611297607422],
        ['login-checkboxCount', 8.820239067077637],
        ['login-radioCount', 0.04903563857078552],
        ['login-numberCount', -6.133112907409668],
        ['login-dateCount', -48.41822052001953],
        ['login-identifierCount', 0.4528000056743622],
        ['login-usernameCount', 15.128703117370605],
        ['login-emailCount', -12.835319519042969],
        ['login-submitCount', -12.437512397766113],
        ['login-hasTels', 0.6504058241844177],
        ['login-hasOAuth', 5.274964332580566],
        ['login-hasCaptchas', 5.029110908508301],
        ['login-hasFiles', -0.020541436970233917],
        ['login-noPasswordFields', -11.2503023147583],
        ['login-onePasswordField', 5.931887626647949],
        ['login-twoPasswordFields', -13.345080375671387],
        ['login-threePasswordFields', -7.243825912475586],
        ['login-oneIdentifierField', 8.535104751586914],
        ['login-twoIdentifierFields', -17.214067459106445],
        ['login-threeIdentifierFields', -6.246607780456543],
        ['login-hasHiddenIdentifier', -4.646876811981201],
        ['login-hasHiddenPassword', 9.572028160095215],
        ['login-autofocusedIsPassword', 14.953084945678711],
        ['login-visibleRatio', 2.866387367248535],
        ['login-inputRatio', -4.8829874992370605],
        ['login-hiddenRatio', 3.129612922668457],
        ['login-identifierRatio', 8.34891414642334],
        ['login-emailRatio', 5.498536586761475],
        ['login-usernameRatio', -15.222636222839355],
        ['login-passwordRatio', 7.950662612915039],
        ['login-requiredRatio', -1.8570033311843872],
        ['login-patternRatio', -2.9819672107696533],
        ['login-minMaxLengthRatio', -4.639585018157959],
        ['login-pageLogin', 13.25584602355957],
        ['login-formTextLogin', 8.372579574584961],
        ['login-formAttrsLogin', 5.97609281539917],
        ['login-headingsLogin', 23.817123413085938],
        ['login-layoutLogin', 0.5380089282989502],
        ['login-rememberMeCheckbox', 8.906913757324219],
        ['login-forgotPasswordLink', 2.1699867248535156],
        ['login-submitLogin', 4.1206560134887695],
        ['login-pageRegister', -9.9751558303833],
        ['login-formTextRegister', 0.06242614984512329],
        ['login-formAttrsRegister', -14.311773300170898],
        ['login-headingsRegister', -6.820340156555176],
        ['login-layoutRegister', -11.895557403564453],
        ['login-checkboxTOS', 0.015889078378677368],
        ['login-submitRegister', -19.169979095458984],
        ['login-pagePwReset', -6.670910835266113],
        ['login-formTextPwReset', -5.902475357055664],
        ['login-formAttrsPwReset', -13.245363235473633],
        ['login-headingsPwReset', -10.353331565856934],
        ['login-layoutPwReset', -5.713765621185303],
        ['login-pageRecovery', 1.9204331636428833],
        ['login-formTextRecovery', -0.02703280746936798],
        ['login-formAttrsRecovery', -11.497690200805664],
        ['login-headingsRecovery', -2.133005380630493],
        ['login-layoutRecovery', 5.270119667053223],
        ['login-identifierRecovery', -8.10181999206543],
        ['login-formTextMFA', 0.07592101395130157],
        ['login-formAttrsMFA', -2.3447296619415283],
        ['login-headingsMFA', -8.032055854797363],
        ['login-layoutMFA', -3.85504412651062],
        ['login-buttonVerify', -5.423027992248535],
        ['login-inputsMFA', -22.479419708251953],
        ['login-inputsOTP', -6.614068031311035],
        ['login-resendCodeLink', 3.107130527496338],
        ['login-headingsNewsletter', -6.76039981842041],
        ['login-oneVisibleField', -6.673131465911865],
        ['login-buttonMultiStep', 3.214236259460449],
        ['login-buttonMultiAction', 31.224409103393555],
        ['login-headingsMultiStep', -3.6551766395568848],
    ],
    bias: -6.598318576812744,
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
        ['pw-change-fieldsCount', -1.2840490341186523],
        ['pw-change-inputCount', -1.0013856887817383],
        ['pw-change-fieldsetCount', -5.922147750854492],
        ['pw-change-textCount', -5.97297477722168],
        ['pw-change-textareaCount', -5.995937347412109],
        ['pw-change-selectCount', -6.106759071350098],
        ['pw-change-checkboxCount', -5.896145343780518],
        ['pw-change-radioCount', -0.06722933053970337],
        ['pw-change-numberCount', -13.959256172180176],
        ['pw-change-dateCount', -5.911578178405762],
        ['pw-change-identifierCount', -5.421465873718262],
        ['pw-change-usernameCount', -6.010776996612549],
        ['pw-change-emailCount', -4.235494613647461],
        ['pw-change-submitCount', -1.7733782529830933],
        ['pw-change-hasTels', -5.943532466888428],
        ['pw-change-hasOAuth', -6.0066914558410645],
        ['pw-change-hasCaptchas', -5.893280982971191],
        ['pw-change-hasFiles', -0.07851548492908478],
        ['pw-change-noPasswordFields', -5.907078742980957],
        ['pw-change-onePasswordField', -6.002268314361572],
        ['pw-change-twoPasswordFields', 11.921757698059082],
        ['pw-change-threePasswordFields', 20.656774520874023],
        ['pw-change-oneIdentifierField', -5.914587497711182],
        ['pw-change-twoIdentifierFields', -6.097807884216309],
        ['pw-change-threeIdentifierFields', 13.418707847595215],
        ['pw-change-hasHiddenIdentifier', -1.3028610944747925],
        ['pw-change-hasHiddenPassword', -6.070772647857666],
        ['pw-change-autofocusedIsPassword', 16.919710159301758],
        ['pw-change-visibleRatio', -3.3460254669189453],
        ['pw-change-inputRatio', -3.5839736461639404],
        ['pw-change-hiddenRatio', -4.2953267097473145],
        ['pw-change-identifierRatio', -5.284120082855225],
        ['pw-change-emailRatio', -5.279621124267578],
        ['pw-change-usernameRatio', -5.9444074630737305],
        ['pw-change-passwordRatio', 2.4640982151031494],
        ['pw-change-requiredRatio', -4.7398176193237305],
        ['pw-change-patternRatio', -0.6313195824623108],
        ['pw-change-minMaxLengthRatio', -2.664369821548462],
        ['pw-change-pageLogin', -6.004589080810547],
        ['pw-change-formTextLogin', -6.045661449432373],
        ['pw-change-formAttrsLogin', -5.999379634857178],
        ['pw-change-headingsLogin', -6.02504825592041],
        ['pw-change-layoutLogin', -6.038764953613281],
        ['pw-change-rememberMeCheckbox', -5.8986029624938965],
        ['pw-change-forgotPasswordLink', -3.5837562084198],
        ['pw-change-submitLogin', -6.071204662322998],
        ['pw-change-pageRegister', -5.924252986907959],
        ['pw-change-formTextRegister', -0.0040366798639297485],
        ['pw-change-formAttrsRegister', -6.041766166687012],
        ['pw-change-headingsRegister', -7.110930442810059],
        ['pw-change-layoutRegister', -6.084238529205322],
        ['pw-change-checkboxTOS', 0.0028434395790100098],
        ['pw-change-submitRegister', -7.039798736572266],
        ['pw-change-pagePwReset', 15.996517181396484],
        ['pw-change-formTextPwReset', 18.483243942260742],
        ['pw-change-formAttrsPwReset', 3.867652177810669],
        ['pw-change-headingsPwReset', 16.729021072387695],
        ['pw-change-layoutPwReset', 15.035550117492676],
        ['pw-change-pageRecovery', -6.102105617523193],
        ['pw-change-formTextRecovery', 0.06970104575157166],
        ['pw-change-formAttrsRecovery', -5.979532718658447],
        ['pw-change-headingsRecovery', -5.952152729034424],
        ['pw-change-layoutRecovery', -6.089911460876465],
        ['pw-change-identifierRecovery', -6.005186557769775],
        ['pw-change-formTextMFA', 0.11349618434906006],
        ['pw-change-formAttrsMFA', -5.976162433624268],
        ['pw-change-headingsMFA', -6.0912346839904785],
        ['pw-change-layoutMFA', -6.080244541168213],
        ['pw-change-buttonVerify', -5.939022541046143],
        ['pw-change-inputsMFA', -5.962494373321533],
        ['pw-change-inputsOTP', -6.016271591186523],
        ['pw-change-resendCodeLink', -3.9233009815216064],
        ['pw-change-headingsNewsletter', -6.115321159362793],
        ['pw-change-oneVisibleField', -5.949509143829346],
        ['pw-change-buttonMultiStep', -6.032724857330322],
        ['pw-change-buttonMultiAction', -5.974911212921143],
        ['pw-change-headingsMultiStep', -5.97783088684082],
    ],
    bias: -3.6620848178863525,
    cutoff: 0.5,
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
        ['register-fieldsCount', 9.824358940124512],
        ['register-inputCount', 8.046568870544434],
        ['register-fieldsetCount', 17.220722198486328],
        ['register-textCount', 6.005802154541016],
        ['register-textareaCount', -10.535292625427246],
        ['register-selectCount', -10.470589637756348],
        ['register-checkboxCount', -6.398329257965088],
        ['register-radioCount', 0.03767657279968262],
        ['register-numberCount', 53.72511291503906],
        ['register-dateCount', 10.573694229125977],
        ['register-identifierCount', 4.103169918060303],
        ['register-usernameCount', -10.69010066986084],
        ['register-emailCount', 8.915753364562988],
        ['register-submitCount', 20.867616653442383],
        ['register-hasTels', -0.27522850036621094],
        ['register-hasOAuth', 7.230703353881836],
        ['register-hasCaptchas', 1.2642771005630493],
        ['register-hasFiles', -0.04208339750766754],
        ['register-noPasswordFields', -7.653525352478027],
        ['register-onePasswordField', -4.9044976234436035],
        ['register-twoPasswordFields', 8.746240615844727],
        ['register-threePasswordFields', -6.637754440307617],
        ['register-oneIdentifierField', 3.3086724281311035],
        ['register-twoIdentifierFields', 1.4951692819595337],
        ['register-threeIdentifierFields', 9.99255657196045],
        ['register-hasHiddenIdentifier', 2.979297161102295],
        ['register-hasHiddenPassword', 12.615241050720215],
        ['register-autofocusedIsPassword', -7.9808430671691895],
        ['register-visibleRatio', 7.541741371154785],
        ['register-inputRatio', -8.139514923095703],
        ['register-hiddenRatio', -0.5140759348869324],
        ['register-identifierRatio', 7.018856525421143],
        ['register-emailRatio', -10.608804702758789],
        ['register-usernameRatio', -18.991201400756836],
        ['register-passwordRatio', -11.547795295715332],
        ['register-requiredRatio', -4.484895706176758],
        ['register-patternRatio', -32.16344451904297],
        ['register-minMaxLengthRatio', -14.719467163085938],
        ['register-pageLogin', -12.470673561096191],
        ['register-formTextLogin', -5.916984558105469],
        ['register-formAttrsLogin', -14.17049503326416],
        ['register-headingsLogin', -10.905339241027832],
        ['register-layoutLogin', -4.77042818069458],
        ['register-rememberMeCheckbox', -6.339387893676758],
        ['register-forgotPasswordLink', -2.2255005836486816],
        ['register-submitLogin', 2.862779378890991],
        ['register-pageRegister', -1.199815034866333],
        ['register-formTextRegister', -0.042556121945381165],
        ['register-formAttrsRegister', 20.752548217773438],
        ['register-headingsRegister', 12.115350723266602],
        ['register-layoutRegister', 9.356801986694336],
        ['register-checkboxTOS', 0.07644584774971008],
        ['register-submitRegister', 20.555347442626953],
        ['register-pagePwReset', -6.1507344245910645],
        ['register-formTextPwReset', -5.953170299530029],
        ['register-formAttrsPwReset', -8.271528244018555],
        ['register-headingsPwReset', -22.158323287963867],
        ['register-layoutPwReset', -12.584275245666504],
        ['register-pageRecovery', -11.267800331115723],
        ['register-formTextRecovery', 0.026240035891532898],
        ['register-formAttrsRecovery', -8.1439847946167],
        ['register-headingsRecovery', -4.532628059387207],
        ['register-layoutRecovery', -11.076553344726562],
        ['register-identifierRecovery', -35.78044509887695],
        ['register-formTextMFA', -0.00514780730009079],
        ['register-formAttrsMFA', 22.23255729675293],
        ['register-headingsMFA', -15.353899002075195],
        ['register-layoutMFA', -3.7038509845733643],
        ['register-buttonVerify', -13.477813720703125],
        ['register-inputsMFA', -9.825135231018066],
        ['register-inputsOTP', -5.95554256439209],
        ['register-resendCodeLink', -6.650969505310059],
        ['register-headingsNewsletter', -6.052966594696045],
        ['register-oneVisibleField', -4.978359222412109],
        ['register-buttonMultiStep', 21.1171932220459],
        ['register-buttonMultiAction', -5.037106513977051],
        ['register-headingsMultiStep', 25.949237823486328],
    ],
    bias: -5.6457085609436035,
    cutoff: 0.48,
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
        ['recovery-fieldsCount', -5.595676422119141],
        ['recovery-inputCount', -9.856619834899902],
        ['recovery-fieldsetCount', -3.1213674545288086],
        ['recovery-textCount', -0.7766290307044983],
        ['recovery-textareaCount', -39.15168380737305],
        ['recovery-selectCount', -34.39725875854492],
        ['recovery-checkboxCount', -6.005914688110352],
        ['recovery-radioCount', 0.06094212830066681],
        ['recovery-numberCount', -24.423460006713867],
        ['recovery-dateCount', -6.108101844787598],
        ['recovery-identifierCount', 4.489822864532471],
        ['recovery-usernameCount', 3.371431350708008],
        ['recovery-emailCount', 6.125607967376709],
        ['recovery-submitCount', 6.074413776397705],
        ['recovery-hasTels', -27.560731887817383],
        ['recovery-hasOAuth', -3.7660248279571533],
        ['recovery-hasCaptchas', -0.8109236359596252],
        ['recovery-hasFiles', -0.04735758155584335],
        ['recovery-noPasswordFields', 6.718693256378174],
        ['recovery-onePasswordField', -27.649959564208984],
        ['recovery-twoPasswordFields', -10.58212661743164],
        ['recovery-threePasswordFields', -15.310340881347656],
        ['recovery-oneIdentifierField', -2.4838693141937256],
        ['recovery-twoIdentifierFields', 47.277854919433594],
        ['recovery-threeIdentifierFields', -6.726811408996582],
        ['recovery-hasHiddenIdentifier', 6.692666053771973],
        ['recovery-hasHiddenPassword', -8.926112174987793],
        ['recovery-autofocusedIsPassword', -5.968497276306152],
        ['recovery-visibleRatio', 8.236405372619629],
        ['recovery-inputRatio', -9.314959526062012],
        ['recovery-hiddenRatio', 2.8776302337646484],
        ['recovery-identifierRatio', 7.378164768218994],
        ['recovery-emailRatio', -6.334535121917725],
        ['recovery-usernameRatio', 28.06440544128418],
        ['recovery-passwordRatio', -16.90675926208496],
        ['recovery-requiredRatio', 1.327304720878601],
        ['recovery-patternRatio', -0.9997395873069763],
        ['recovery-minMaxLengthRatio', 3.252826690673828],
        ['recovery-pageLogin', -9.634501457214355],
        ['recovery-formTextLogin', -6.717050075531006],
        ['recovery-formAttrsLogin', 9.56631088256836],
        ['recovery-headingsLogin', -31.31938934326172],
        ['recovery-layoutLogin', -20.162986755371094],
        ['recovery-rememberMeCheckbox', -5.97129487991333],
        ['recovery-forgotPasswordLink', -0.14122287929058075],
        ['recovery-submitLogin', -4.051900386810303],
        ['recovery-pageRegister', -1.6705743074417114],
        ['recovery-formTextRegister', 0.08416454493999481],
        ['recovery-formAttrsRegister', -45.05562973022461],
        ['recovery-headingsRegister', -13.39745044708252],
        ['recovery-layoutRegister', 5.335593223571777],
        ['recovery-checkboxTOS', 0.090900719165802],
        ['recovery-submitRegister', -21.14188575744629],
        ['recovery-pagePwReset', 6.966041564941406],
        ['recovery-formTextPwReset', -7.748828887939453],
        ['recovery-formAttrsPwReset', 10.5599946975708],
        ['recovery-headingsPwReset', 13.381885528564453],
        ['recovery-layoutPwReset', 0.6278272867202759],
        ['recovery-pageRecovery', 10.59938907623291],
        ['recovery-formTextRecovery', 0.10555556416511536],
        ['recovery-formAttrsRecovery', 20.736896514892578],
        ['recovery-headingsRecovery', -5.118468284606934],
        ['recovery-layoutRecovery', 4.685873031616211],
        ['recovery-identifierRecovery', 13.756021499633789],
        ['recovery-formTextMFA', 0.07086454331874847],
        ['recovery-formAttrsMFA', -12.526354789733887],
        ['recovery-headingsMFA', -8.849053382873535],
        ['recovery-layoutMFA', -6.092435359954834],
        ['recovery-buttonVerify', -9.040511131286621],
        ['recovery-inputsMFA', 4.386622428894043],
        ['recovery-inputsOTP', 7.831233024597168],
        ['recovery-resendCodeLink', 9.568560600280762],
        ['recovery-headingsNewsletter', -16.23041343688965],
        ['recovery-oneVisibleField', -7.184649467468262],
        ['recovery-buttonMultiStep', 0.4539545476436615],
        ['recovery-buttonMultiAction', -7.03947639465332],
        ['recovery-headingsMultiStep', -6.0103888511657715],
    ],
    bias: -5.357109546661377,
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
        ['mfa-fieldsCount', -5.423543930053711],
        ['mfa-inputCount', -5.6256866455078125],
        ['mfa-fieldsetCount', 3.9370765686035156],
        ['mfa-textCount', -1.1645232439041138],
        ['mfa-textareaCount', -6.193072319030762],
        ['mfa-selectCount', -6.049875736236572],
        ['mfa-checkboxCount', -6.042028903961182],
        ['mfa-radioCount', -0.05754869431257248],
        ['mfa-numberCount', 10.824736595153809],
        ['mfa-dateCount', -6.050661563873291],
        ['mfa-identifierCount', -4.564058303833008],
        ['mfa-usernameCount', -4.387291431427002],
        ['mfa-emailCount', -6.7800068855285645],
        ['mfa-submitCount', -3.6727256774902344],
        ['mfa-hasTels', 10.800607681274414],
        ['mfa-hasOAuth', -8.004583358764648],
        ['mfa-hasCaptchas', -2.236098527908325],
        ['mfa-hasFiles', 0.050325289368629456],
        ['mfa-noPasswordFields', -1.3653172254562378],
        ['mfa-onePasswordField', -5.753798961639404],
        ['mfa-twoPasswordFields', -10.358351707458496],
        ['mfa-threePasswordFields', -5.915099143981934],
        ['mfa-oneIdentifierField', -4.281759262084961],
        ['mfa-twoIdentifierFields', -6.087452411651611],
        ['mfa-threeIdentifierFields', -5.959499835968018],
        ['mfa-hasHiddenIdentifier', -4.09910249710083],
        ['mfa-hasHiddenPassword', -2.422858953475952],
        ['mfa-autofocusedIsPassword', 10.621532440185547],
        ['mfa-visibleRatio', -1.8029112815856934],
        ['mfa-inputRatio', -3.911289691925049],
        ['mfa-hiddenRatio', 1.9465082883834839],
        ['mfa-identifierRatio', -4.941197395324707],
        ['mfa-emailRatio', -6.794285774230957],
        ['mfa-usernameRatio', -5.447624683380127],
        ['mfa-passwordRatio', -6.234847068786621],
        ['mfa-requiredRatio', 9.386764526367188],
        ['mfa-patternRatio', 9.84087085723877],
        ['mfa-minMaxLengthRatio', 3.297420024871826],
        ['mfa-pageLogin', 2.9707372188568115],
        ['mfa-formTextLogin', -5.982190132141113],
        ['mfa-formAttrsLogin', -2.783348321914673],
        ['mfa-headingsLogin', -5.363401412963867],
        ['mfa-layoutLogin', 0.6207574009895325],
        ['mfa-rememberMeCheckbox', -6.0713791847229],
        ['mfa-forgotPasswordLink', -3.7761788368225098],
        ['mfa-submitLogin', -0.7319108247756958],
        ['mfa-pageRegister', -3.674772262573242],
        ['mfa-formTextRegister', 0.04544733464717865],
        ['mfa-formAttrsRegister', -3.763456106185913],
        ['mfa-headingsRegister', -7.485933303833008],
        ['mfa-layoutRegister', -4.986401557922363],
        ['mfa-checkboxTOS', -0.06109214946627617],
        ['mfa-submitRegister', -6.023858070373535],
        ['mfa-pagePwReset', -5.966987133026123],
        ['mfa-formTextPwReset', -5.926268100738525],
        ['mfa-formAttrsPwReset', -6.108033657073975],
        ['mfa-headingsPwReset', -6.122500419616699],
        ['mfa-layoutPwReset', -6.014342784881592],
        ['mfa-pageRecovery', 4.874403953552246],
        ['mfa-formTextRecovery', 0.08455397188663483],
        ['mfa-formAttrsRecovery', -8.408747673034668],
        ['mfa-headingsRecovery', -8.790122032165527],
        ['mfa-layoutRecovery', 2.7204463481903076],
        ['mfa-identifierRecovery', -5.995214939117432],
        ['mfa-formTextMFA', -0.03320400416851044],
        ['mfa-formAttrsMFA', 12.06844711303711],
        ['mfa-headingsMFA', 15.520513534545898],
        ['mfa-layoutMFA', 11.430646896362305],
        ['mfa-buttonVerify', 13.000492095947266],
        ['mfa-inputsMFA', 15.218847274780273],
        ['mfa-inputsOTP', 16.361074447631836],
        ['mfa-resendCodeLink', -5.028899669647217],
        ['mfa-headingsNewsletter', -5.934006690979004],
        ['mfa-oneVisibleField', 2.419820785522461],
        ['mfa-buttonMultiStep', 1.180140495300293],
        ['mfa-buttonMultiAction', -5.955419063568115],
        ['mfa-headingsMultiStep', 7.601417064666748],
    ],
    bias: -4.111955165863037,
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
        ['pw-loginScore', 11.09719467163086],
        ['pw-registerScore', -12.02134895324707],
        ['pw-pwChangeScore', -4.308463096618652],
        ['pw-exotic', -12.844364166259766],
        ['pw-dangling', 0.11074621975421906],
        ['pw-autocompleteNew', -1.8931909799575806],
        ['pw-autocompleteCurrent', 6.244847297668457],
        ['pw-autocompleteOff', -1.6509013175964355],
        ['pw-isOnlyPassword', 3.528658628463745],
        ['pw-prevPwField', -0.31917381286621094],
        ['pw-nextPwField', -2.781221389770508],
        ['pw-attrCreate', -5.091352462768555],
        ['pw-attrCurrent', 1.4502930641174316],
        ['pw-attrConfirm', -6.936851978302002],
        ['pw-attrReset', -0.13829568028450012],
        ['pw-textCreate', -3.298785924911499],
        ['pw-textCurrent', 6.18550443649292],
        ['pw-textConfirm', -7.078022480010986],
        ['pw-textReset', -0.01937161386013031],
        ['pw-labelCreate', -7.369626045227051],
        ['pw-labelCurrent', 11.130034446716309],
        ['pw-labelConfirm', -7.309588432312012],
        ['pw-labelReset', -0.0230829119682312],
        ['pw-prevPwCreate', -7.162364482879639],
        ['pw-prevPwCurrent', -7.346147060394287],
        ['pw-prevPwConfirm', 0.04285085201263428],
        ['pw-nextPwCreate', 9.311102867126465],
        ['pw-nextPwCurrent', -0.08679839968681335],
        ['pw-nextPwConfirm', -7.354874610900879],
    ],
    bias: 0.06288675218820572,
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
        ['pw[new]-loginScore', -11.040082931518555],
        ['pw[new]-registerScore', 11.959840774536133],
        ['pw[new]-pwChangeScore', 5.046866416931152],
        ['pw[new]-exotic', 12.496253967285156],
        ['pw[new]-dangling', 0.08140195906162262],
        ['pw[new]-autocompleteNew', 1.5097298622131348],
        ['pw[new]-autocompleteCurrent', -6.1570634841918945],
        ['pw[new]-autocompleteOff', 1.6715906858444214],
        ['pw[new]-isOnlyPassword', -3.3579249382019043],
        ['pw[new]-prevPwField', 0.29020556807518005],
        ['pw[new]-nextPwField', 2.613783836364746],
        ['pw[new]-attrCreate', 4.634037971496582],
        ['pw[new]-attrCurrent', -1.2859910726547241],
        ['pw[new]-attrConfirm', 6.782395362854004],
        ['pw[new]-attrReset', 0.18029622733592987],
        ['pw[new]-textCreate', 3.2243852615356445],
        ['pw[new]-textCurrent', -6.322823524475098],
        ['pw[new]-textConfirm', 7.1079583168029785],
        ['pw[new]-textReset', 0.05881200730800629],
        ['pw[new]-labelCreate', 7.871182918548584],
        ['pw[new]-labelCurrent', -9.646236419677734],
        ['pw[new]-labelConfirm', 7.434678077697754],
        ['pw[new]-labelReset', -0.030810445547103882],
        ['pw[new]-prevPwCreate', 7.312267303466797],
        ['pw[new]-prevPwCurrent', 8.029424667358398],
        ['pw[new]-prevPwConfirm', 0.016583725810050964],
        ['pw[new]-nextPwCreate', -9.76301383972168],
        ['pw[new]-nextPwCurrent', -0.08252215385437012],
        ['pw[new]-nextPwConfirm', 7.736093044281006],
    ],
    bias: -0.07937408983707428,
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
        ['username-autocompleteUsername', 7.92478084564209],
        ['username-autocompleteNickname', -0.1674000322818756],
        ['username-autocompleteEmail', -7.624342441558838],
        ['username-autocompleteOff', -0.5601810216903687],
        ['username-attrUsername', 18.77420425415039],
        ['username-textUsername', 16.388874053955078],
        ['username-labelUsername', 18.25653839111328],
        ['username-loginUsername', 19.007543563842773],
    ],
    bias: -9.86146354675293,
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
        ['username[hidden]-loginScore', 11.693309783935547],
        ['username[hidden]-registerScore', 11.395336151123047],
        ['username[hidden]-exotic', -8.09566593170166],
        ['username[hidden]-dangling', 0.05837711691856384],
        ['username[hidden]-attrUsername', 6.976940631866455],
        ['username[hidden]-attrEmail', 6.231832504272461],
        ['username[hidden]-usernameName', 6.493155479431152],
        ['username[hidden]-autocompleteUsername', -0.3062457740306854],
        ['username[hidden]-hiddenEmailValue', 8.01809310913086],
        ['username[hidden]-hiddenTelValue', 3.059126853942871],
        ['username[hidden]-hiddenUsernameValue', 0.7134971022605896],
    ],
    bias: -22.62560272216797,
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
        ['email-autocompleteUsername', 1.9610731601715088],
        ['email-autocompleteNickname', 0.15877363085746765],
        ['email-autocompleteEmail', 6.020668983459473],
        ['email-typeEmail', 12.753146171569824],
        ['email-exactAttrEmail', 11.980653762817383],
        ['email-attrEmail', 2.5668952465057373],
        ['email-textEmail', 14.541871070861816],
        ['email-labelEmail', 16.477386474609375],
        ['email-placeholderEmail', 15.392848014831543],
    ],
    bias: -9.209290504455566,
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
        ['otp-mfaScore', 15.986800193786621],
        ['otp-exotic', -6.8330817222595215],
        ['otp-dangling', -0.09488965570926666],
        ['otp-resendCodeLink', 0.7666708827018738],
        ['otp-hidden', -0.13320587575435638],
        ['otp-required', -0.6594585180282593],
        ['otp-nameMatch', -0.2999536395072937],
        ['otp-idMatch', 9.595821380615234],
        ['otp-numericMode', 6.96396017074585],
        ['otp-autofocused', 1.8803297281265259],
        ['otp-tabIndex1', 0.21734218299388885],
        ['otp-patternOTP', 2.083632707595825],
        ['otp-maxLength1', 8.068264961242676],
        ['otp-maxLength5', -10.560565948486328],
        ['otp-minLength6', 11.363404273986816],
        ['otp-maxLength6', 11.024884223937988],
        ['otp-maxLength20', -5.506222724914551],
        ['otp-autocompleteOTC', -0.06038825958967209],
        ['otp-autocompleteOff', -6.5486345291137695],
        ['otp-prevAligned', 0.8436146974563599],
        ['otp-prevArea', 4.83244514465332],
        ['otp-nextAligned', 0.09407961368560791],
        ['otp-nextArea', 3.8121347427368164],
        ['otp-attrMFA', 7.8689141273498535],
        ['otp-attrOTP', 8.9926118850708],
        ['otp-attrOutlier', -7.018643379211426],
        ['otp-textMFA', 8.603297233581543],
        ['otp-textOTP', -4.709228038787842],
        ['otp-textOutlier', -7.985592842102051],
        ['otp-labelMFA', 13.77009105682373],
        ['otp-labelOTP', 0.16090935468673706],
        ['otp-labelOutlier', -6.428321361541748],
        ['otp-wrapperMFA', -12.201549530029297],
        ['otp-wrapperOTP', -3.957242965698242],
        ['otp-wrapperOutlier', -6.268863677978516],
    ],
    bias: -10.228095054626465,
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
