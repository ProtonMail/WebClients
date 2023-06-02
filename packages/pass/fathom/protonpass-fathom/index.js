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

const PASSWORD_OUTLIER_RE = /socialsecurity|nationalid/i;

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

const matchPasswordOutlier = test(PASSWORD_OUTLIER_RE);

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
    const passwordOutlier = any(matchPasswordOutlier)(fieldAttrs.concat(labelText, fieldText));
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
        passwordOutlier: boolInt(passwordOutlier),
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
    'passwordOutlier',
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
        ['login-fieldsCount', -0.6493964195251465],
        ['login-inputCount', 0.2346607744693756],
        ['login-fieldsetCount', -7.835761070251465],
        ['login-textCount', -14.286291122436523],
        ['login-textareaCount', -6.459255695343018],
        ['login-selectCount', -10.568930625915527],
        ['login-checkboxCount', 9.109601974487305],
        ['login-radioCount', -0.05536641180515289],
        ['login-numberCount', -6.005008697509766],
        ['login-dateCount', -48.91677474975586],
        ['login-identifierCount', 0.29414865374565125],
        ['login-usernameCount', 13.907902717590332],
        ['login-emailCount', -13.060998916625977],
        ['login-submitCount', -1.6964386701583862],
        ['login-hasTels', -1.3122929334640503],
        ['login-hasOAuth', 1.1997807025909424],
        ['login-hasCaptchas', 3.235926389694214],
        ['login-hasFiles', 0.07879766821861267],
        ['login-noPasswordFields', -11.767131805419922],
        ['login-onePasswordField', 4.9432268142700195],
        ['login-twoPasswordFields', -13.829379081726074],
        ['login-threePasswordFields', -7.338815212249756],
        ['login-oneIdentifierField', 8.345372200012207],
        ['login-twoIdentifierFields', -19.17803955078125],
        ['login-threeIdentifierFields', -6.24638032913208],
        ['login-hasHiddenIdentifier', -5.499378681182861],
        ['login-hasHiddenPassword', 9.732535362243652],
        ['login-autofocusedIsPassword', 16.15523910522461],
        ['login-visibleRatio', 4.30911922454834],
        ['login-inputRatio', -2.89835262298584],
        ['login-hiddenRatio', 9.468207359313965],
        ['login-identifierRatio', 9.377740859985352],
        ['login-emailRatio', 5.227573394775391],
        ['login-usernameRatio', -15.511019706726074],
        ['login-passwordRatio', 8.416176795959473],
        ['login-requiredRatio', -0.32782915234565735],
        ['login-patternRatio', -1.8943276405334473],
        ['login-minMaxLengthRatio', 0.39132556319236755],
        ['login-pageLogin', 11.854527473449707],
        ['login-formTextLogin', 8.466073989868164],
        ['login-formAttrsLogin', 6.483010292053223],
        ['login-headingsLogin', 25.22968101501465],
        ['login-layoutLogin', 2.8067145347595215],
        ['login-rememberMeCheckbox', 8.919171333312988],
        ['login-forgotPasswordLink', 1.1890506744384766],
        ['login-submitLogin', 3.548248291015625],
        ['login-pageRegister', -7.5833964347839355],
        ['login-formTextRegister', 0.009983785450458527],
        ['login-formAttrsRegister', -13.851052284240723],
        ['login-headingsRegister', -7.940681457519531],
        ['login-layoutRegister', -6.296387672424316],
        ['login-checkboxTOS', 0.01344175636768341],
        ['login-submitRegister', -21.090221405029297],
        ['login-pagePwReset', -6.619822025299072],
        ['login-formTextPwReset', -5.935317516326904],
        ['login-formAttrsPwReset', -12.780617713928223],
        ['login-headingsPwReset', -10.454262733459473],
        ['login-layoutPwReset', -7.093411922454834],
        ['login-pageRecovery', -3.895611524581909],
        ['login-formTextRecovery', -0.047151073813438416],
        ['login-formAttrsRecovery', -9.867965698242188],
        ['login-headingsRecovery', -0.26326096057891846],
        ['login-layoutRecovery', 3.654162883758545],
        ['login-identifierRecovery', -8.819255828857422],
        ['login-formTextMFA', 0.08034148812294006],
        ['login-formAttrsMFA', -1.416170597076416],
        ['login-headingsMFA', -8.099723815917969],
        ['login-layoutMFA', -4.1500630378723145],
        ['login-buttonVerify', -5.3941850662231445],
        ['login-inputsMFA', -21.93303871154785],
        ['login-inputsOTP', -8.08713150024414],
        ['login-resendCodeLink', 0.7404647469520569],
        ['login-headingsNewsletter', -7.527066707611084],
        ['login-oneVisibleField', -7.592361927032471],
        ['login-buttonMultiStep', 1.3843250274658203],
        ['login-buttonMultiAction', 31.98302459716797],
        ['login-headingsMultiStep', -7.637948513031006],
    ],
    bias: -7.201187610626221,
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
        ['pw-change-fieldsCount', -1.4643932580947876],
        ['pw-change-inputCount', -1.3177967071533203],
        ['pw-change-fieldsetCount', -6.059832572937012],
        ['pw-change-textCount', -5.924131393432617],
        ['pw-change-textareaCount', -5.970595836639404],
        ['pw-change-selectCount', -5.906905651092529],
        ['pw-change-checkboxCount', -5.96058464050293],
        ['pw-change-radioCount', -0.025777816772460938],
        ['pw-change-numberCount', -14.7088041305542],
        ['pw-change-dateCount', -6.058548450469971],
        ['pw-change-identifierCount', -5.469001770019531],
        ['pw-change-usernameCount', -6.059078693389893],
        ['pw-change-emailCount', -4.128825664520264],
        ['pw-change-submitCount', -2.132659912109375],
        ['pw-change-hasTels', -5.929481029510498],
        ['pw-change-hasOAuth', -6.064667701721191],
        ['pw-change-hasCaptchas', -6.107112884521484],
        ['pw-change-hasFiles', -0.00814143568277359],
        ['pw-change-noPasswordFields', -6.041752815246582],
        ['pw-change-onePasswordField', -5.927353382110596],
        ['pw-change-twoPasswordFields', 11.784319877624512],
        ['pw-change-threePasswordFields', 20.45472526550293],
        ['pw-change-oneIdentifierField', -6.103196620941162],
        ['pw-change-twoIdentifierFields', -5.9348554611206055],
        ['pw-change-threeIdentifierFields', 14.083194732666016],
        ['pw-change-hasHiddenIdentifier', -1.3976808786392212],
        ['pw-change-hasHiddenPassword', -5.994223594665527],
        ['pw-change-autofocusedIsPassword', 17.083709716796875],
        ['pw-change-visibleRatio', -3.1283581256866455],
        ['pw-change-inputRatio', -3.5249903202056885],
        ['pw-change-hiddenRatio', -4.349560260772705],
        ['pw-change-identifierRatio', -5.318943977355957],
        ['pw-change-emailRatio', -5.084843635559082],
        ['pw-change-usernameRatio', -5.9908647537231445],
        ['pw-change-passwordRatio', 1.9834644794464111],
        ['pw-change-requiredRatio', -4.600498676300049],
        ['pw-change-patternRatio', 0.06952620297670364],
        ['pw-change-minMaxLengthRatio', -2.6405839920043945],
        ['pw-change-pageLogin', -5.912275791168213],
        ['pw-change-formTextLogin', -6.071186065673828],
        ['pw-change-formAttrsLogin', -6.0022101402282715],
        ['pw-change-headingsLogin', -6.120266437530518],
        ['pw-change-layoutLogin', -6.088892459869385],
        ['pw-change-rememberMeCheckbox', -5.914804458618164],
        ['pw-change-forgotPasswordLink', -3.9038891792297363],
        ['pw-change-submitLogin', -5.9559760093688965],
        ['pw-change-pageRegister', -5.973505973815918],
        ['pw-change-formTextRegister', 0.060309067368507385],
        ['pw-change-formAttrsRegister', -5.930293083190918],
        ['pw-change-headingsRegister', -7.07861852645874],
        ['pw-change-layoutRegister', -5.984366416931152],
        ['pw-change-checkboxTOS', 0.11000505089759827],
        ['pw-change-submitRegister', -7.164007663726807],
        ['pw-change-pagePwReset', 16.61794090270996],
        ['pw-change-formTextPwReset', 18.231796264648438],
        ['pw-change-formAttrsPwReset', 5.1233978271484375],
        ['pw-change-headingsPwReset', 16.767744064331055],
        ['pw-change-layoutPwReset', 15.318222045898438],
        ['pw-change-pageRecovery', -5.903716564178467],
        ['pw-change-formTextRecovery', -0.03211015462875366],
        ['pw-change-formAttrsRecovery', -5.94551420211792],
        ['pw-change-headingsRecovery', -5.98456335067749],
        ['pw-change-layoutRecovery', -5.906296253204346],
        ['pw-change-identifierRecovery', -6.014403820037842],
        ['pw-change-formTextMFA', -0.07683782279491425],
        ['pw-change-formAttrsMFA', -6.020475387573242],
        ['pw-change-headingsMFA', -5.909541130065918],
        ['pw-change-layoutMFA', -6.073214530944824],
        ['pw-change-buttonVerify', -6.02650260925293],
        ['pw-change-inputsMFA', -6.0385918617248535],
        ['pw-change-inputsOTP', -5.902577877044678],
        ['pw-change-resendCodeLink', -3.926971435546875],
        ['pw-change-headingsNewsletter', -6.046924114227295],
        ['pw-change-oneVisibleField', -6.060455322265625],
        ['pw-change-buttonMultiStep', -5.9051127433776855],
        ['pw-change-buttonMultiAction', -5.922022819519043],
        ['pw-change-headingsMultiStep', -5.972068786621094],
    ],
    bias: -3.6722447872161865,
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
        ['register-fieldsCount', 13.343152046203613],
        ['register-inputCount', 17.337535858154297],
        ['register-fieldsetCount', 2.3487448692321777],
        ['register-textCount', 12.24324893951416],
        ['register-textareaCount', -25.92624282836914],
        ['register-selectCount', -18.68935203552246],
        ['register-checkboxCount', -6.4066033363342285],
        ['register-radioCount', 0.10076580941677094],
        ['register-numberCount', 85.44282531738281],
        ['register-dateCount', 10.934198379516602],
        ['register-identifierCount', 0.8385058045387268],
        ['register-usernameCount', -28.782880783081055],
        ['register-emailCount', 8.892221450805664],
        ['register-submitCount', -11.243561744689941],
        ['register-hasTels', -2.2388267517089844],
        ['register-hasOAuth', 1.0798277854919434],
        ['register-hasCaptchas', 0.42539912462234497],
        ['register-hasFiles', -0.0891764685511589],
        ['register-noPasswordFields', -6.003978729248047],
        ['register-onePasswordField', -5.519132137298584],
        ['register-twoPasswordFields', 11.8091402053833],
        ['register-threePasswordFields', -6.294560432434082],
        ['register-oneIdentifierField', 1.8404064178466797],
        ['register-twoIdentifierFields', -3.048348903656006],
        ['register-threeIdentifierFields', 10.589446067810059],
        ['register-hasHiddenIdentifier', 2.2997641563415527],
        ['register-hasHiddenPassword', 12.59987735748291],
        ['register-autofocusedIsPassword', -7.375558853149414],
        ['register-visibleRatio', 4.291874408721924],
        ['register-inputRatio', -13.18767261505127],
        ['register-hiddenRatio', -9.25424575805664],
        ['register-identifierRatio', 23.75698471069336],
        ['register-emailRatio', -10.341506958007812],
        ['register-usernameRatio', -9.370831489562988],
        ['register-passwordRatio', -5.358809947967529],
        ['register-requiredRatio', -1.842968463897705],
        ['register-patternRatio', -25.037324905395508],
        ['register-minMaxLengthRatio', -11.127362251281738],
        ['register-pageLogin', -12.830307006835938],
        ['register-formTextLogin', -5.936242580413818],
        ['register-formAttrsLogin', -4.9096903800964355],
        ['register-headingsLogin', -12.199213981628418],
        ['register-layoutLogin', -6.739439010620117],
        ['register-rememberMeCheckbox', -6.317927837371826],
        ['register-forgotPasswordLink', -3.2441277503967285],
        ['register-submitLogin', 9.667183876037598],
        ['register-pageRegister', -1.286247968673706],
        ['register-formTextRegister', 0.00042350590229034424],
        ['register-formAttrsRegister', 28.046281814575195],
        ['register-headingsRegister', 1.7117606401443481],
        ['register-layoutRegister', -2.3950321674346924],
        ['register-checkboxTOS', -0.025266483426094055],
        ['register-submitRegister', 22.36745262145996],
        ['register-pagePwReset', -5.958786487579346],
        ['register-formTextPwReset', -6.079314231872559],
        ['register-formAttrsPwReset', -5.975668430328369],
        ['register-headingsPwReset', -12.923192024230957],
        ['register-layoutPwReset', -12.77873420715332],
        ['register-pageRecovery', -18.22269058227539],
        ['register-formTextRecovery', -0.05451924353837967],
        ['register-formAttrsRecovery', -6.573225498199463],
        ['register-headingsRecovery', 0.9492164254188538],
        ['register-layoutRecovery', -7.209317207336426],
        ['register-identifierRecovery', -21.369665145874023],
        ['register-formTextMFA', 0.024462416768074036],
        ['register-formAttrsMFA', 22.963871002197266],
        ['register-headingsMFA', -21.953969955444336],
        ['register-layoutMFA', -0.8874240517616272],
        ['register-buttonVerify', -7.8735737800598145],
        ['register-inputsMFA', -6.8583292961120605],
        ['register-inputsOTP', -6.784276485443115],
        ['register-resendCodeLink', -4.27416467666626],
        ['register-headingsNewsletter', -7.064871788024902],
        ['register-oneVisibleField', -5.808911323547363],
        ['register-buttonMultiStep', 15.737870216369629],
        ['register-buttonMultiAction', -14.943026542663574],
        ['register-headingsMultiStep', 27.116470336914062],
    ],
    bias: -4.374362468719482,
    cutoff: 0.46,
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
        ['recovery-fieldsCount', -5.639328479766846],
        ['recovery-inputCount', -10.57240104675293],
        ['recovery-fieldsetCount', -5.0621657371521],
        ['recovery-textCount', -2.013031244277954],
        ['recovery-textareaCount', -34.53464889526367],
        ['recovery-selectCount', -36.36069869995117],
        ['recovery-checkboxCount', -6.02766752243042],
        ['recovery-radioCount', 0.09997037053108215],
        ['recovery-numberCount', -24.936372756958008],
        ['recovery-dateCount', -6.074063301086426],
        ['recovery-identifierCount', 5.024713516235352],
        ['recovery-usernameCount', 4.2908759117126465],
        ['recovery-emailCount', 6.993361949920654],
        ['recovery-submitCount', 7.665010929107666],
        ['recovery-hasTels', -29.99506378173828],
        ['recovery-hasOAuth', -1.0394682884216309],
        ['recovery-hasCaptchas', -1.847947120666504],
        ['recovery-hasFiles', 0.04075264930725098],
        ['recovery-noPasswordFields', 6.936614990234375],
        ['recovery-onePasswordField', -28.374069213867188],
        ['recovery-twoPasswordFields', -10.962580680847168],
        ['recovery-threePasswordFields', -16.255123138427734],
        ['recovery-oneIdentifierField', -1.7360219955444336],
        ['recovery-twoIdentifierFields', 50.90019607543945],
        ['recovery-threeIdentifierFields', -6.815282821655273],
        ['recovery-hasHiddenIdentifier', 7.480515480041504],
        ['recovery-hasHiddenPassword', -8.985162734985352],
        ['recovery-autofocusedIsPassword', -6.007089614868164],
        ['recovery-visibleRatio', 9.552793502807617],
        ['recovery-inputRatio', -9.433279037475586],
        ['recovery-hiddenRatio', 0.03318682685494423],
        ['recovery-identifierRatio', 5.804194927215576],
        ['recovery-emailRatio', -7.713128566741943],
        ['recovery-usernameRatio', 27.810827255249023],
        ['recovery-passwordRatio', -18.12267303466797],
        ['recovery-requiredRatio', 1.0224742889404297],
        ['recovery-patternRatio', -2.088003396987915],
        ['recovery-minMaxLengthRatio', 3.8292768001556396],
        ['recovery-pageLogin', -9.97810173034668],
        ['recovery-formTextLogin', -6.792702674865723],
        ['recovery-formAttrsLogin', 9.907411575317383],
        ['recovery-headingsLogin', -31.066606521606445],
        ['recovery-layoutLogin', -21.13511085510254],
        ['recovery-rememberMeCheckbox', -5.926933765411377],
        ['recovery-forgotPasswordLink', -0.3469432294368744],
        ['recovery-submitLogin', -5.03236722946167],
        ['recovery-pageRegister', -1.295222282409668],
        ['recovery-formTextRegister', -0.03668537735939026],
        ['recovery-formAttrsRegister', -47.606529235839844],
        ['recovery-headingsRegister', -14.888420104980469],
        ['recovery-layoutRegister', 5.302098751068115],
        ['recovery-checkboxTOS', -0.05860123038291931],
        ['recovery-submitRegister', -22.402799606323242],
        ['recovery-pagePwReset', 7.009827136993408],
        ['recovery-formTextPwReset', -8.366693496704102],
        ['recovery-formAttrsPwReset', 10.38100814819336],
        ['recovery-headingsPwReset', 15.35112190246582],
        ['recovery-layoutPwReset', 1.7471604347229004],
        ['recovery-pageRecovery', 12.615732192993164],
        ['recovery-formTextRecovery', -0.10729535669088364],
        ['recovery-formAttrsRecovery', 20.29033660888672],
        ['recovery-headingsRecovery', -7.207647323608398],
        ['recovery-layoutRecovery', 4.747048854827881],
        ['recovery-identifierRecovery', 14.230246543884277],
        ['recovery-formTextMFA', 0.11121855676174164],
        ['recovery-formAttrsMFA', -10.48967170715332],
        ['recovery-headingsMFA', -7.577956676483154],
        ['recovery-layoutMFA', -6.007455348968506],
        ['recovery-buttonVerify', -10.197675704956055],
        ['recovery-inputsMFA', 6.201574325561523],
        ['recovery-inputsOTP', 7.16232442855835],
        ['recovery-resendCodeLink', 10.837098121643066],
        ['recovery-headingsNewsletter', -15.638296127319336],
        ['recovery-oneVisibleField', -6.879374980926514],
        ['recovery-buttonMultiStep', 0.2514033317565918],
        ['recovery-buttonMultiAction', -7.138760089874268],
        ['recovery-headingsMultiStep', -6.097156047821045],
    ],
    bias: -5.394819736480713,
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
        ['mfa-fieldsCount', -5.3963446617126465],
        ['mfa-inputCount', -5.773000717163086],
        ['mfa-fieldsetCount', 3.111668825149536],
        ['mfa-textCount', -1.5857208967208862],
        ['mfa-textareaCount', -5.931211948394775],
        ['mfa-selectCount', -6.129189491271973],
        ['mfa-checkboxCount', -6.101649284362793],
        ['mfa-radioCount', 0.07461796700954437],
        ['mfa-numberCount', 11.478711128234863],
        ['mfa-dateCount', -5.991722106933594],
        ['mfa-identifierCount', -4.763998031616211],
        ['mfa-usernameCount', -4.416464805603027],
        ['mfa-emailCount', -6.673878192901611],
        ['mfa-submitCount', -3.7627336978912354],
        ['mfa-hasTels', 11.317543983459473],
        ['mfa-hasOAuth', -8.040121078491211],
        ['mfa-hasCaptchas', -2.405900478363037],
        ['mfa-hasFiles', -0.031049251556396484],
        ['mfa-noPasswordFields', -1.767043113708496],
        ['mfa-onePasswordField', -5.673418998718262],
        ['mfa-twoPasswordFields', -10.347412109375],
        ['mfa-threePasswordFields', -6.063809394836426],
        ['mfa-oneIdentifierField', -4.32252311706543],
        ['mfa-twoIdentifierFields', -5.9618449211120605],
        ['mfa-threeIdentifierFields', -6.016897201538086],
        ['mfa-hasHiddenIdentifier', -4.230257511138916],
        ['mfa-hasHiddenPassword', -2.1172916889190674],
        ['mfa-autofocusedIsPassword', 10.103333473205566],
        ['mfa-visibleRatio', -1.962661862373352],
        ['mfa-inputRatio', -3.4439780712127686],
        ['mfa-hiddenRatio', 1.6247432231903076],
        ['mfa-identifierRatio', -4.943841934204102],
        ['mfa-emailRatio', -6.751940727233887],
        ['mfa-usernameRatio', -5.461555004119873],
        ['mfa-passwordRatio', -6.33045768737793],
        ['mfa-requiredRatio', 9.790099143981934],
        ['mfa-patternRatio', 9.927971839904785],
        ['mfa-minMaxLengthRatio', 3.325836658477783],
        ['mfa-pageLogin', 3.1094565391540527],
        ['mfa-formTextLogin', -6.000452518463135],
        ['mfa-formAttrsLogin', -2.805757761001587],
        ['mfa-headingsLogin', -5.100520610809326],
        ['mfa-layoutLogin', 0.03477193042635918],
        ['mfa-rememberMeCheckbox', -6.020193099975586],
        ['mfa-forgotPasswordLink', -3.8386728763580322],
        ['mfa-submitLogin', -0.8485673069953918],
        ['mfa-pageRegister', -3.3758037090301514],
        ['mfa-formTextRegister', 0.10111488401889801],
        ['mfa-formAttrsRegister', -4.03633975982666],
        ['mfa-headingsRegister', -7.200264930725098],
        ['mfa-layoutRegister', -5.531296730041504],
        ['mfa-checkboxTOS', 0.06319887936115265],
        ['mfa-submitRegister', -5.915077209472656],
        ['mfa-pagePwReset', -5.995474338531494],
        ['mfa-formTextPwReset', -6.055372714996338],
        ['mfa-formAttrsPwReset', -5.979822635650635],
        ['mfa-headingsPwReset', -5.9380598068237305],
        ['mfa-layoutPwReset', -5.904242038726807],
        ['mfa-pageRecovery', 5.045206069946289],
        ['mfa-formTextRecovery', -0.0998808816075325],
        ['mfa-formAttrsRecovery', -8.92457389831543],
        ['mfa-headingsRecovery', -8.167948722839355],
        ['mfa-layoutRecovery', 2.867659568786621],
        ['mfa-identifierRecovery', -6.0129170417785645],
        ['mfa-formTextMFA', -0.08621951937675476],
        ['mfa-formAttrsMFA', 12.906257629394531],
        ['mfa-headingsMFA', 15.908140182495117],
        ['mfa-layoutMFA', 11.50881576538086],
        ['mfa-buttonVerify', 13.524858474731445],
        ['mfa-inputsMFA', 15.911322593688965],
        ['mfa-inputsOTP', 16.972309112548828],
        ['mfa-resendCodeLink', -4.783702850341797],
        ['mfa-headingsNewsletter', -6.070125579833984],
        ['mfa-oneVisibleField', 2.1248886585235596],
        ['mfa-buttonMultiStep', 0.861239492893219],
        ['mfa-buttonMultiAction', -6.1097893714904785],
        ['mfa-headingsMultiStep', 8.071209907531738],
    ],
    bias: -4.188539505004883,
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
        ['pw-loginScore', 10.14507007598877],
        ['pw-registerScore', -12.711796760559082],
        ['pw-pwChangeScore', -5.596028804779053],
        ['pw-exotic', -13.280001640319824],
        ['pw-dangling', -0.1193644106388092],
        ['pw-autocompleteNew', -2.2377357482910156],
        ['pw-autocompleteCurrent', 6.314162731170654],
        ['pw-autocompleteOff', -1.0629616975784302],
        ['pw-isOnlyPassword', 3.3061108589172363],
        ['pw-prevPwField', -0.09304677695035934],
        ['pw-nextPwField', -2.4872100353240967],
        ['pw-attrCreate', -0.13387499749660492],
        ['pw-attrCurrent', 0.6545353531837463],
        ['pw-attrConfirm', -6.905930519104004],
        ['pw-attrReset', 0.0647793561220169],
        ['pw-textCreate', -2.084848642349243],
        ['pw-textCurrent', 6.1332526206970215],
        ['pw-textConfirm', -6.6669158935546875],
        ['pw-textReset', 0.10793188214302063],
        ['pw-labelCreate', -7.713014125823975],
        ['pw-labelCurrent', 12.030521392822266],
        ['pw-labelConfirm', -7.098013401031494],
        ['pw-labelReset', 0.11254638433456421],
        ['pw-prevPwCreate', -7.246194839477539],
        ['pw-prevPwCurrent', -9.093914031982422],
        ['pw-prevPwConfirm', -0.09367222338914871],
        ['pw-passwordOutlier', -7.139437675476074],
        ['pw-nextPwCreate', 6.854938983917236],
        ['pw-nextPwCurrent', 0.1441967785358429],
        ['pw-nextPwConfirm', -7.5345778465271],
    ],
    bias: 0.43143919110298157,
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
        ['pw[new]-loginScore', -10.218412399291992],
        ['pw[new]-registerScore', 11.943436622619629],
        ['pw[new]-pwChangeScore', 6.565498352050781],
        ['pw[new]-exotic', 12.633193969726562],
        ['pw[new]-dangling', 0.14877551794052124],
        ['pw[new]-autocompleteNew', 0.8915178775787354],
        ['pw[new]-autocompleteCurrent', -6.123122215270996],
        ['pw[new]-autocompleteOff', 1.0024467706680298],
        ['pw[new]-isOnlyPassword', -3.0612099170684814],
        ['pw[new]-prevPwField', 0.361336350440979],
        ['pw[new]-nextPwField', 1.3231925964355469],
        ['pw[new]-attrCreate', 0.6708462834358215],
        ['pw[new]-attrCurrent', -0.0334225594997406],
        ['pw[new]-attrConfirm', 6.742785453796387],
        ['pw[new]-attrReset', -0.06295125186443329],
        ['pw[new]-textCreate', 1.353245735168457],
        ['pw[new]-textCurrent', -6.192720413208008],
        ['pw[new]-textConfirm', 6.87710428237915],
        ['pw[new]-textReset', -0.122658371925354],
        ['pw[new]-labelCreate', 7.587530136108398],
        ['pw[new]-labelCurrent', -11.40334415435791],
        ['pw[new]-labelConfirm', 7.295851230621338],
        ['pw[new]-labelReset', 0.1287577748298645],
        ['pw[new]-prevPwCreate', 7.2578325271606445],
        ['pw[new]-prevPwCurrent', 9.196670532226562],
        ['pw[new]-prevPwConfirm', 0.011655017733573914],
        ['pw[new]-passwordOutlier', -21.861961364746094],
        ['pw[new]-nextPwCreate', -7.66196870803833],
        ['pw[new]-nextPwCurrent', -0.029070287942886353],
        ['pw[new]-nextPwConfirm', 7.534054279327393],
    ],
    bias: 0.1220318078994751,
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
        ['username-autocompleteUsername', 8.181819915771484],
        ['username-autocompleteNickname', 0.10874947905540466],
        ['username-autocompleteEmail', -7.459709167480469],
        ['username-autocompleteOff', -0.4489579200744629],
        ['username-attrUsername', 18.483386993408203],
        ['username-textUsername', 16.186132431030273],
        ['username-labelUsername', 18.06991195678711],
        ['username-loginUsername', 18.77256202697754],
    ],
    bias: -9.841402053833008,
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
        ['username[hidden]-loginScore', 10.868368148803711],
        ['username[hidden]-registerScore', 10.535981178283691],
        ['username[hidden]-exotic', -8.105413436889648],
        ['username[hidden]-dangling', -0.06688551604747772],
        ['username[hidden]-attrUsername', 6.612347602844238],
        ['username[hidden]-attrEmail', 5.918229103088379],
        ['username[hidden]-usernameName', 6.316352367401123],
        ['username[hidden]-autocompleteUsername', -0.5038196444511414],
        ['username[hidden]-hiddenEmailValue', 7.631900787353516],
        ['username[hidden]-hiddenTelValue', 2.812868356704712],
        ['username[hidden]-hiddenUsernameValue', 0.9087152481079102],
    ],
    bias: -21.257564544677734,
    cutoff: 0.54,
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
        ['email-autocompleteUsername', 1.4315110445022583],
        ['email-autocompleteNickname', 0.25205889344215393],
        ['email-autocompleteEmail', 5.862986087799072],
        ['email-typeEmail', 14.91819953918457],
        ['email-exactAttrEmail', 13.038369178771973],
        ['email-attrEmail', 2.4801347255706787],
        ['email-textEmail', 14.73228931427002],
        ['email-labelEmail', 16.833234786987305],
        ['email-placeholderEmail', 15.638352394104004],
    ],
    bias: -9.438616752624512,
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
        ['otp-mfaScore', 16.28673553466797],
        ['otp-exotic', -6.943380355834961],
        ['otp-dangling', 0.07477757334709167],
        ['otp-resendCodeLink', 1.1692255735397339],
        ['otp-hidden', -0.07370482385158539],
        ['otp-required', -0.9294764995574951],
        ['otp-nameMatch', -0.35079461336135864],
        ['otp-idMatch', 9.75482177734375],
        ['otp-numericMode', 6.849776268005371],
        ['otp-autofocused', 1.806933045387268],
        ['otp-tabIndex1', 0.08625902980566025],
        ['otp-patternOTP', 1.6669871807098389],
        ['otp-maxLength1', 8.129728317260742],
        ['otp-maxLength5', -10.74342155456543],
        ['otp-minLength6', 12.81314754486084],
        ['otp-maxLength6', 11.431878089904785],
        ['otp-maxLength20', -5.533042907714844],
        ['otp-autocompleteOTC', -0.11502237617969513],
        ['otp-autocompleteOff', -6.802911758422852],
        ['otp-prevAligned', 0.37140440940856934],
        ['otp-prevArea', 5.309630870819092],
        ['otp-nextAligned', 0.12309494614601135],
        ['otp-nextArea', 3.7737324237823486],
        ['otp-attrMFA', 7.918093204498291],
        ['otp-attrOTP', 8.869974136352539],
        ['otp-attrOutlier', -6.947255611419678],
        ['otp-textMFA', 8.410258293151855],
        ['otp-textOTP', -4.918187618255615],
        ['otp-textOutlier', -7.734053611755371],
        ['otp-labelMFA', 13.8911771774292],
        ['otp-labelOTP', 0.12830251455307007],
        ['otp-labelOutlier', -6.476819038391113],
        ['otp-wrapperMFA', -12.718299865722656],
        ['otp-wrapperOTP', -4.203332901000977],
        ['otp-wrapperOutlier', -6.11140775680542],
    ],
    bias: -10.04808235168457,
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
