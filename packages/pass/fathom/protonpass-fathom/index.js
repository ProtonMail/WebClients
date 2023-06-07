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

const MAX_VISIBILITY_WALK_UP = 1;

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
    /identi(?:fiant|ty)|u(?:tilisateur|s(?:ername|uario))|(?:identifi|benutz)er|(?:screen|nick)name|nutzername|(?:anmeld|handl)e|pseudo/i;

const USERNAME_ATTR_RE = /identifyemail|(?:custom|us)erid|loginname|a(?:cc(?:ountid|t)|ppleid)|loginid/i;

const USERNAME_OUTLIER_RE =
    /nom(?:defamill|br)e|(?:primeiro|sobre)nome|(?:middle|nach|vor)name|firstname|apellido|lastname|prenom/i;

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

const SEARCH_ACTION_RE = /recherche|buscar|s(?:earch|uche)|query/i;

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

const OTP_OUTLIER_ATTR_RE = /(?:inputphoneverification|phone|email|tel)pin|email|sms/i;

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

const matchUsernameOutlier = test(USERNAME_OUTLIER_RE);

const matchEmail = orRe([EMAIL_RE, EMAIL_VALUE_RE]);

const matchEmailAttr = orRe([EMAIL_ATTR_RE, EMAIL_RE]);

const matchEmailValue = test(EMAIL_VALUE_RE);

const matchTelValue = test(TEL_VALUE_RE);

const matchRememberMe = test(REMEMBER_ACTION_RE);

const matchTOS = test(TOS_RE);

const matchTrouble = test(TROUBLE_RE);

const matchRecovery = or([test(RECOVERY_RE), andRe([TROUBLE_RE, PASSWORD_RE])]);

const matchMultiStep = test(MULTI_STEP_RE);

const matchStepAction = orRe([STEP_ACTION_RE, MULTI_STEP_RE]);

const matchOAuth = test(OAUTH_ATTR_RE);

const matchSearchAction = test(SEARCH_ACTION_RE);

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
    if (el.offsetHeight === 0 || el.offsetHeight === 0) return false;
    if (el.offsetHeight < options.minHeight || el.offsetWidth < options.minWidth) return false;
    const parent = el.parentElement;
    return recurseMax === 0 || parent === null ? true : fastIsVisible(parent, options, recurseMax - 1);
};

const isVisibleField = (field) =>
    fastIsVisible(field, {
        minHeight: MIN_FIELD_HEIGHT,
        minWidth: MIN_FIELD_WIDTH,
    });

const isVisibleEl = (el) =>
    fastIsVisible(
        el,
        {
            minHeight: 0,
            minWidth: 0,
        },
        0
    );

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
    'input[type="text"]:not([aria-autocomplete="list"])',
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
    const fieldHaystacks = getFieldHaystacks(field);
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
    const visible = typeValid ? utils.isVisible(field) && isVisibleField(field) : false;
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
        fieldHaystacks
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

const maybeOTP = (fnode) => fnode.element.matches(otpSelector);

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

const { linearScale: linearScale$1 } = utils;

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
    const anchors = Array.from(form.querySelectorAll(anchorLinkSelector)).filter(isVisibleEl);
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
    const troubleLink = any(matchTrouble)(anchorsHaystack);
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
    const submitRecovery = any(matchRecovery)(submitBtnHaystack);
    const identifierRecovery = any(matchRecovery)(identifierAttributes);
    const formTextMFA = matchMfa(formTextAttrText);
    const formAttrsMFA = any(matchMfaAttr)(formAttributes);
    const headingsMFA = matchMfa(nearestHeadingsText);
    const layoutMFA = any(matchMfa)(layoutHaystack);
    const buttonVerify = any(matchMfaAction)(submitBtnHaystack);
    const inputsMFA = any(matchMfaAttr)(mfaInputsHaystack);
    const inputsOTP = any(matchOtpAttr)(mfaInputsHaystack);
    const linkOTPOutlier = any(matchOtpOutlier)(anchorsHaystack.concat(submitBtnHaystack));
    const headingsNewsletter = matchNewsletter(nearestHeadingsText);
    const buttonMultiStep = any(matchStepAction)(submitBtnHaystack);
    const headingsMultiStep = matchMultiStep(nearestHeadingsText);
    return {
        fieldsCount: linearScale$1(visibleFields.length, 1, 5),
        inputCount: linearScale$1(visibleInputs.length, 1, 5),
        fieldsetCount: linearScale$1(fieldsets.length, 1, 5),
        textCount: linearScale$1(texts.length, 0, 3),
        textareaCount: linearScale$1(textareas.length, 0, 2),
        selectCount: linearScale$1(selects.length, 0, 3),
        checkboxCount: linearScale$1(checkboxes.length, 0, 2),
        radioCount: linearScale$1(radios.length, 0, 5),
        identifierCount: linearScale$1(visibleIdentifiers.length, 0, 2),
        passwordCount: linearScale$1(visiblePasswords.length, 0, 2),
        usernameCount: linearScale$1(usernames.length, 0, 2),
        emailCount: linearScale$1(emails.length, 0, 2),
        submitCount: linearScale$1(submits.length, 0, 2),
        hasTels: boolInt(tels.length > 0),
        hasOAuth: boolInt(oauths.length > 0),
        hasCaptchas: boolInt(captchas.length > 0),
        hasFiles: boolInt(files.length > 0),
        hasDate: boolInt(dates.length > 0),
        hasNumber: boolInt(numbers.length > 0),
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
        passwordRatio: safeInt(passwords.length / inputs.length),
        requiredRatio: safeInt(required.length / visibleInputs.length),
        patternRatio: safeInt(patterns.length / visibleInputs.length),
        minMaxLengthRatio: safeInt(minMaxLengths.length / visibleInputs.length),
        pageLogin: boolInt(pageLogin),
        formTextLogin: boolInt(formTextLogin),
        formAttrsLogin: boolInt(formAttrsLogin),
        headingsLogin: boolInt(headingsLogin),
        layoutLogin: boolInt(layoutLogin),
        rememberMeCheckbox: boolInt(rememberMeCheckbox),
        troubleLink: boolInt(troubleLink),
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
        submitRecovery: boolInt(submitRecovery),
        formTextMFA: boolInt(formTextMFA),
        formAttrsMFA: boolInt(formAttrsMFA),
        headingsMFA: boolInt(headingsMFA),
        layoutMFA: boolInt(layoutMFA),
        buttonVerify: boolInt(buttonVerify),
        inputsMFA: boolInt(inputsMFA),
        inputsOTP: boolInt(inputsOTP),
        linkOTPOutlier: boolInt(linkOTPOutlier),
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
    'identifierCount',
    'usernameCount',
    'emailCount',
    'submitCount',
    'hasTels',
    'hasOAuth',
    'hasCaptchas',
    'hasFiles',
    'hasDate',
    'hasNumber',
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
    'troubleLink',
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
    'submitRecovery',
    'formTextMFA',
    'formAttrsMFA',
    'headingsMFA',
    'layoutMFA',
    'buttonVerify',
    'inputsMFA',
    'inputsOTP',
    'linkOTPOutlier',
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
    const attrSearch = any(matchSearchAction)(fieldAttrs);
    const textSearch = matchSearchAction(fieldText);
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
        attrSearch: boolInt(attrSearch),
        textSearch: boolInt(textSearch),
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
    'attrSearch',
    'textSearch',
];

const getUsernameFieldFeatures = (fnode) => {
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, loginScore, prevField, nextField } = fieldFeatures;
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const textUsername = matchUsername(fieldText);
    const labelUsername = matchUsername(labelText);
    const outlierUsername = any(matchUsernameOutlier)(fieldAttrs.concat(fieldText, labelText));
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
        outlierUsername: boolInt(outlierUsername),
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
    'outlierUsername',
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

const { linearScale } = utils;

const getOTPFieldFeatures = (fnode) => {
    var _a, _b, _c, _d;
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField, type, minLength, maxLength } = fieldFeatures;
    const form = (_a = fieldFeatures.formFnode) === null || _a === void 0 ? void 0 : _a.element;
    const formMfa = fieldFeatures.mfaScore > 0.5;
    const linkOTPOutlier = Boolean(
        (_b = fieldFeatures === null || fieldFeatures === void 0 ? void 0 : fieldFeatures.formFeatures) === null ||
            _b === void 0
            ? void 0
            : _b.linkOTPOutlier
    );
    const formCheckboxCount =
        (_d =
            (_c = fieldFeatures === null || fieldFeatures === void 0 ? void 0 : fieldFeatures.formFeatures) === null ||
            _c === void 0
                ? void 0
                : _c.checkboxCount) !== null && _d !== void 0
            ? _d
            : 0;
    const formInnerText = form && formMfa ? form.innerText : '';
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
    const labelOTP = matchOtpAttr(labelText);
    const labelMFA = matchMfa(labelText);
    const labelOutlier = matchOtpOutlier(labelText);
    const parents = [getNthParent(field)(1), getNthParent(field)(2)];
    const wrapperAttrs = parents.flatMap(getBaseAttributes);
    const wrapperOTP = any(matchOtpAttr)(wrapperAttrs);
    const wrapperOutlier = any(matchOtpOutlier)(wrapperAttrs);
    const emailOutlierCount = (formInnerText.match(/@/g) || []).length;
    return {
        mfaScore: boolInt(formMfa),
        exotic: boolInt(fieldFeatures.exotic),
        dangling: boolInt(fieldFeatures.dangling),
        linkOTPOutlier: boolInt(formMfa && linkOTPOutlier),
        hasCheckboxes: boolInt(formMfa && formCheckboxCount > 0),
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
        labelMFA: boolInt(labelMFA),
        labelOTP: boolInt(labelOTP),
        labelOutlier: boolInt(labelOutlier),
        wrapperOTP: boolInt(wrapperOTP),
        wrapperOutlier: boolInt(wrapperOutlier),
        emailOutlierCount: linearScale(emailOutlierCount, 0, 2),
    };
};

const OTP_FIELD_FEATURES = [
    'mfaScore',
    'exotic',
    'dangling',
    'linkOTPOutlier',
    'hasCheckboxes',
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
    'labelMFA',
    'labelOTP',
    'labelOutlier',
    'wrapperOTP',
    'wrapperOutlier',
    'emailOutlierCount',
];

const results$a = {
    coeffs: [
        ['login-fieldsCount', -1.8919605016708374],
        ['login-inputCount', -3.5054497718811035],
        ['login-fieldsetCount', -28.662872314453125],
        ['login-textCount', -7.5917067527771],
        ['login-textareaCount', -5.97534704208374],
        ['login-selectCount', -3.8708856105804443],
        ['login-checkboxCount', 8.882104873657227],
        ['login-radioCount', 0.10172616690397263],
        ['login-identifierCount', -8.886507034301758],
        ['login-usernameCount', 13.539475440979004],
        ['login-emailCount', -9.865325927734375],
        ['login-submitCount', 4.389279842376709],
        ['login-hasTels', 2.0527536869049072],
        ['login-hasOAuth', -3.380772352218628],
        ['login-hasCaptchas', -3.1294350624084473],
        ['login-hasFiles', 0.01156662404537201],
        ['login-hasDate', -39.51958465576172],
        ['login-hasNumber', -6.1237945556640625],
        ['login-noPasswordFields', -13.805755615234375],
        ['login-onePasswordField', 5.716916561126709],
        ['login-twoPasswordFields', -17.99162483215332],
        ['login-threePasswordFields', -6.784121036529541],
        ['login-oneIdentifierField', -0.7715885043144226],
        ['login-twoIdentifierFields', -32.192420959472656],
        ['login-threeIdentifierFields', -10.333745002746582],
        ['login-hasHiddenIdentifier', 1.6726170778274536],
        ['login-hasHiddenPassword', 24.474552154541016],
        ['login-autofocusedIsPassword', 7.653244495391846],
        ['login-visibleRatio', 6.637325286865234],
        ['login-inputRatio', 5.673848628997803],
        ['login-hiddenRatio', 1.4525307416915894],
        ['login-identifierRatio', 8.557058334350586],
        ['login-emailRatio', 12.209859848022461],
        ['login-usernameRatio', -15.29971694946289],
        ['login-passwordRatio', 3.358605146408081],
        ['login-requiredRatio', 2.0071756839752197],
        ['login-patternRatio', -3.6711301803588867],
        ['login-minMaxLengthRatio', 1.3809870481491089],
        ['login-pageLogin', 13.581026077270508],
        ['login-formTextLogin', 8.367966651916504],
        ['login-formAttrsLogin', 3.676656484603882],
        ['login-headingsLogin', 24.88509750366211],
        ['login-layoutLogin', -1.4089149236679077],
        ['login-rememberMeCheckbox', 8.918549537658691],
        ['login-troubleLink', 15.213412284851074],
        ['login-submitLogin', 5.856357097625732],
        ['login-pageRegister', -14.335491180419922],
        ['login-formTextRegister', -0.03412998467683792],
        ['login-formAttrsRegister', -2.9343292713165283],
        ['login-headingsRegister', -5.230618476867676],
        ['login-layoutRegister', -2.151590347290039],
        ['login-checkboxTOS', 0.024698249995708466],
        ['login-submitRegister', -13.540681838989258],
        ['login-pagePwReset', -6.168937683105469],
        ['login-formTextPwReset', -6.050944805145264],
        ['login-formAttrsPwReset', -13.347935676574707],
        ['login-headingsPwReset', -10.729796409606934],
        ['login-layoutPwReset', -4.192920207977295],
        ['login-pageRecovery', -18.938385009765625],
        ['login-formTextRecovery', -0.07038377225399017],
        ['login-formAttrsRecovery', -5.900047779083252],
        ['login-headingsRecovery', 1.0182888507843018],
        ['login-layoutRecovery', 1.339206576347351],
        ['login-identifierRecovery', -6.130547523498535],
        ['login-submitRecovery', 2.067948341369629],
        ['login-formTextMFA', 0.08098701387643814],
        ['login-formAttrsMFA', 1.5083503723144531],
        ['login-headingsMFA', -15.972138404846191],
        ['login-layoutMFA', -4.137455463409424],
        ['login-buttonVerify', -8.18034839630127],
        ['login-inputsMFA', -21.4920654296875],
        ['login-inputsOTP', -9.299450874328613],
        ['login-linkOTPOutlier', 0.01219164952635765],
        ['login-headingsNewsletter', -13.040102005004883],
        ['login-oneVisibleField', -10.24544906616211],
        ['login-buttonMultiStep', -1.8122045993804932],
        ['login-buttonMultiAction', 21.486799240112305],
        ['login-headingsMultiStep', 2.3390679359436035],
    ],
    bias: -7.199836254119873,
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
        ['pw-change-fieldsCount', -1.4727699756622314],
        ['pw-change-inputCount', -1.2312742471694946],
        ['pw-change-fieldsetCount', -6.083852767944336],
        ['pw-change-textCount', -5.9417619705200195],
        ['pw-change-textareaCount', -6.112417697906494],
        ['pw-change-selectCount', -6.091488838195801],
        ['pw-change-checkboxCount', -5.967806816101074],
        ['pw-change-radioCount', 0.05078115314245224],
        ['pw-change-identifierCount', -5.549598693847656],
        ['pw-change-usernameCount', -6.110995769500732],
        ['pw-change-emailCount', -4.100076675415039],
        ['pw-change-submitCount', -2.6122190952301025],
        ['pw-change-hasTels', -6.078024864196777],
        ['pw-change-hasOAuth', -6.01131534576416],
        ['pw-change-hasCaptchas', -5.942317008972168],
        ['pw-change-hasFiles', 0.0556536540389061],
        ['pw-change-hasDate', -5.969387054443359],
        ['pw-change-hasNumber', -9.4130220413208],
        ['pw-change-noPasswordFields', -6.117624282836914],
        ['pw-change-onePasswordField', -6.048462390899658],
        ['pw-change-twoPasswordFields', 13.653754234313965],
        ['pw-change-threePasswordFields', 19.067752838134766],
        ['pw-change-oneIdentifierField', -6.066280364990234],
        ['pw-change-twoIdentifierFields', -6.019142150878906],
        ['pw-change-threeIdentifierFields', 13.205737113952637],
        ['pw-change-hasHiddenIdentifier', -0.5959111452102661],
        ['pw-change-hasHiddenPassword', -6.075613021850586],
        ['pw-change-autofocusedIsPassword', 18.995986938476562],
        ['pw-change-visibleRatio', -3.0828590393066406],
        ['pw-change-inputRatio', -3.3137712478637695],
        ['pw-change-hiddenRatio', -4.432037353515625],
        ['pw-change-identifierRatio', -5.369654655456543],
        ['pw-change-emailRatio', -5.133890151977539],
        ['pw-change-usernameRatio', -5.988152027130127],
        ['pw-change-passwordRatio', 5.193130970001221],
        ['pw-change-requiredRatio', -4.179853439331055],
        ['pw-change-patternRatio', 2.1021015644073486],
        ['pw-change-minMaxLengthRatio', -2.9738025665283203],
        ['pw-change-pageLogin', -5.980341911315918],
        ['pw-change-formTextLogin', -5.945621013641357],
        ['pw-change-formAttrsLogin', -5.958653450012207],
        ['pw-change-headingsLogin', -6.000542163848877],
        ['pw-change-layoutLogin', -6.11632776260376],
        ['pw-change-rememberMeCheckbox', -6.065566062927246],
        ['pw-change-troubleLink', -3.4676527976989746],
        ['pw-change-submitLogin', -6.03278112411499],
        ['pw-change-pageRegister', -6.085590362548828],
        ['pw-change-formTextRegister', -0.1027039960026741],
        ['pw-change-formAttrsRegister', -6.002166748046875],
        ['pw-change-headingsRegister', -6.475811958312988],
        ['pw-change-layoutRegister', -5.948812961578369],
        ['pw-change-checkboxTOS', -0.003410808742046356],
        ['pw-change-submitRegister', -6.350243091583252],
        ['pw-change-pagePwReset', 14.926521301269531],
        ['pw-change-formTextPwReset', 17.565319061279297],
        ['pw-change-formAttrsPwReset', 3.5985429286956787],
        ['pw-change-headingsPwReset', 16.212724685668945],
        ['pw-change-layoutPwReset', 14.76191234588623],
        ['pw-change-pageRecovery', -5.955225467681885],
        ['pw-change-formTextRecovery', 0.05540119856595993],
        ['pw-change-formAttrsRecovery', -6.080115795135498],
        ['pw-change-headingsRecovery', -5.92818546295166],
        ['pw-change-layoutRecovery', -4.114366054534912],
        ['pw-change-identifierRecovery', -6.065794944763184],
        ['pw-change-submitRecovery', -0.1478923261165619],
        ['pw-change-formTextMFA', 0.026846863329410553],
        ['pw-change-formAttrsMFA', -6.016178607940674],
        ['pw-change-headingsMFA', -5.922895908355713],
        ['pw-change-layoutMFA', -6.106553077697754],
        ['pw-change-buttonVerify', -6.08502197265625],
        ['pw-change-inputsMFA', -6.0908074378967285],
        ['pw-change-inputsOTP', -5.918413162231445],
        ['pw-change-linkOTPOutlier', -6.38299036026001],
        ['pw-change-headingsNewsletter', -6.018196105957031],
        ['pw-change-oneVisibleField', -5.975433349609375],
        ['pw-change-buttonMultiStep', -6.016145706176758],
        ['pw-change-buttonMultiAction', -6.022793769836426],
        ['pw-change-headingsMultiStep', -6.070734024047852],
    ],
    bias: -3.5969865322113037,
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
        ['register-fieldsCount', 11.282084465026855],
        ['register-inputCount', 14.687705993652344],
        ['register-fieldsetCount', 22.987438201904297],
        ['register-textCount', -0.2162366360425949],
        ['register-textareaCount', -16.63336753845215],
        ['register-selectCount', -1.790864109992981],
        ['register-checkboxCount', -6.169393539428711],
        ['register-radioCount', 0.09554582089185715],
        ['register-identifierCount', 6.563490390777588],
        ['register-usernameCount', -25.375288009643555],
        ['register-emailCount', 7.97906494140625],
        ['register-submitCount', -13.030497550964355],
        ['register-hasTels', 0.24407655000686646],
        ['register-hasOAuth', 8.554906845092773],
        ['register-hasCaptchas', 5.511801242828369],
        ['register-hasFiles', 0.10989253968000412],
        ['register-hasDate', 10.169535636901855],
        ['register-hasNumber', 37.567630767822266],
        ['register-noPasswordFields', -2.5255889892578125],
        ['register-onePasswordField', -7.509350299835205],
        ['register-twoPasswordFields', 15.804830551147461],
        ['register-threePasswordFields', -6.176948070526123],
        ['register-oneIdentifierField', 4.6386590003967285],
        ['register-twoIdentifierFields', 7.633841037750244],
        ['register-threeIdentifierFields', 10.622429847717285],
        ['register-hasHiddenIdentifier', -3.459974527359009],
        ['register-hasHiddenPassword', -12.574467658996582],
        ['register-autofocusedIsPassword', -9.095739364624023],
        ['register-visibleRatio', -3.230525016784668],
        ['register-inputRatio', -14.234410285949707],
        ['register-hiddenRatio', -4.789608478546143],
        ['register-identifierRatio', 20.24660873413086],
        ['register-emailRatio', 1.4622834920883179],
        ['register-usernameRatio', -3.8162922859191895],
        ['register-passwordRatio', 4.650871276855469],
        ['register-requiredRatio', -10.991134643554688],
        ['register-patternRatio', -11.352458000183105],
        ['register-minMaxLengthRatio', -27.37080192565918],
        ['register-pageLogin', -5.873645305633545],
        ['register-formTextLogin', -6.123487949371338],
        ['register-formAttrsLogin', -0.6479317545890808],
        ['register-headingsLogin', -2.7781901359558105],
        ['register-layoutLogin', 18.101913452148438],
        ['register-rememberMeCheckbox', -6.258871555328369],
        ['register-troubleLink', -22.40290641784668],
        ['register-submitLogin', -12.873130798339844],
        ['register-pageRegister', 7.645688056945801],
        ['register-formTextRegister', -0.07909320294857025],
        ['register-formAttrsRegister', 22.850252151489258],
        ['register-headingsRegister', 3.918300151824951],
        ['register-layoutRegister', -4.848937511444092],
        ['register-checkboxTOS', -0.029715299606323242],
        ['register-submitRegister', 23.650035858154297],
        ['register-pagePwReset', -6.097225666046143],
        ['register-formTextPwReset', -6.073191165924072],
        ['register-formAttrsPwReset', -5.9074931144714355],
        ['register-headingsPwReset', -14.573904991149902],
        ['register-layoutPwReset', -12.843574523925781],
        ['register-pageRecovery', -21.720232009887695],
        ['register-formTextRecovery', -0.08847023546695709],
        ['register-formAttrsRecovery', -6.500263214111328],
        ['register-headingsRecovery', -1.242445468902588],
        ['register-layoutRecovery', -7.768985271453857],
        ['register-identifierRecovery', -28.476869583129883],
        ['register-submitRecovery', -19.013381958007812],
        ['register-formTextMFA', -0.0761568620800972],
        ['register-formAttrsMFA', 3.9903011322021484],
        ['register-headingsMFA', -18.553770065307617],
        ['register-layoutMFA', -11.643977165222168],
        ['register-buttonVerify', 12.93883991241455],
        ['register-inputsMFA', -4.111865043640137],
        ['register-inputsOTP', -11.286638259887695],
        ['register-linkOTPOutlier', -7.409657955169678],
        ['register-headingsNewsletter', -7.630524635314941],
        ['register-oneVisibleField', -14.362093925476074],
        ['register-buttonMultiStep', 14.839699745178223],
        ['register-buttonMultiAction', -0.13765791058540344],
        ['register-headingsMultiStep', 23.707460403442383],
    ],
    bias: -2.837146043777466,
    cutoff: 0.47,
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
        ['recovery-fieldsCount', -3.0747318267822266],
        ['recovery-inputCount', -2.0332083702087402],
        ['recovery-fieldsetCount', -2.6311562061309814],
        ['recovery-textCount', 10.0709810256958],
        ['recovery-textareaCount', -24.997394561767578],
        ['recovery-selectCount', -9.072358131408691],
        ['recovery-checkboxCount', -6.015049457550049],
        ['recovery-radioCount', -0.0751713216304779],
        ['recovery-identifierCount', 2.834695339202881],
        ['recovery-usernameCount', 10.871198654174805],
        ['recovery-emailCount', -0.15945588052272797],
        ['recovery-submitCount', -5.6814117431640625],
        ['recovery-hasTels', -10.160755157470703],
        ['recovery-hasOAuth', -3.7920773029327393],
        ['recovery-hasCaptchas', -3.4150607585906982],
        ['recovery-hasFiles', -0.08692006766796112],
        ['recovery-hasDate', -6.112490653991699],
        ['recovery-hasNumber', -6.11478853225708],
        ['recovery-noPasswordFields', -0.06368303298950195],
        ['recovery-onePasswordField', -14.883543014526367],
        ['recovery-twoPasswordFields', -10.345672607421875],
        ['recovery-threePasswordFields', -14.311798095703125],
        ['recovery-oneIdentifierField', 3.698190689086914],
        ['recovery-twoIdentifierFields', -0.11286413669586182],
        ['recovery-threeIdentifierFields', -6.06866455078125],
        ['recovery-hasHiddenIdentifier', -3.393249988555908],
        ['recovery-hasHiddenPassword', -18.371566772460938],
        ['recovery-autofocusedIsPassword', -6.05092191696167],
        ['recovery-visibleRatio', 1.9616905450820923],
        ['recovery-inputRatio', -5.219287872314453],
        ['recovery-hiddenRatio', 0.46513479948043823],
        ['recovery-identifierRatio', 2.255013942718506],
        ['recovery-emailRatio', 1.6035417318344116],
        ['recovery-usernameRatio', 9.266218185424805],
        ['recovery-passwordRatio', -13.520108222961426],
        ['recovery-requiredRatio', 1.4953640699386597],
        ['recovery-patternRatio', -1.062328577041626],
        ['recovery-minMaxLengthRatio', 5.467397689819336],
        ['recovery-pageLogin', -8.192980766296387],
        ['recovery-formTextLogin', -5.963195323944092],
        ['recovery-formAttrsLogin', 6.0328216552734375],
        ['recovery-headingsLogin', -20.2265625],
        ['recovery-layoutLogin', -2.974942445755005],
        ['recovery-rememberMeCheckbox', -5.969943046569824],
        ['recovery-troubleLink', 1.849001407623291],
        ['recovery-submitLogin', -7.318366527557373],
        ['recovery-pageRegister', -1.8901734352111816],
        ['recovery-formTextRegister', 0.07175172120332718],
        ['recovery-formAttrsRegister', -8.671180725097656],
        ['recovery-headingsRegister', -6.971611022949219],
        ['recovery-layoutRegister', -6.807265758514404],
        ['recovery-checkboxTOS', 0.021614961326122284],
        ['recovery-submitRegister', -6.391221523284912],
        ['recovery-pagePwReset', 6.416824817657471],
        ['recovery-formTextPwReset', -6.398834705352783],
        ['recovery-formAttrsPwReset', 10.405288696289062],
        ['recovery-headingsPwReset', 15.125134468078613],
        ['recovery-layoutPwReset', 4.144068241119385],
        ['recovery-pageRecovery', 13.441568374633789],
        ['recovery-formTextRecovery', -0.10577098280191422],
        ['recovery-formAttrsRecovery', 20.93470001220703],
        ['recovery-headingsRecovery', -1.4069744348526],
        ['recovery-layoutRecovery', -6.869775295257568],
        ['recovery-identifierRecovery', 17.873777389526367],
        ['recovery-submitRecovery', 11.995598793029785],
        ['recovery-formTextMFA', 0.053437553346157074],
        ['recovery-formAttrsMFA', 4.769952297210693],
        ['recovery-headingsMFA', -1.2890722751617432],
        ['recovery-layoutMFA', -7.758359909057617],
        ['recovery-buttonVerify', -4.111840724945068],
        ['recovery-inputsMFA', 0.8737132549285889],
        ['recovery-inputsOTP', -5.519907474517822],
        ['recovery-linkOTPOutlier', -1.5414221286773682],
        ['recovery-headingsNewsletter', -15.33027172088623],
        ['recovery-oneVisibleField', -5.196345806121826],
        ['recovery-buttonMultiStep', 3.3741836547851562],
        ['recovery-buttonMultiAction', -6.073152542114258],
        ['recovery-headingsMultiStep', -6.0252885818481445],
    ],
    bias: -6.887614727020264,
    cutoff: 0.49,
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
        ['mfa-fieldsCount', -4.662794589996338],
        ['mfa-inputCount', -5.114567756652832],
        ['mfa-fieldsetCount', -0.10050619393587112],
        ['mfa-textCount', -1.8859272003173828],
        ['mfa-textareaCount', -7.181272029876709],
        ['mfa-selectCount', -6.203393936157227],
        ['mfa-checkboxCount', -5.945295810699463],
        ['mfa-radioCount', -0.10152518004179001],
        ['mfa-identifierCount', -4.488280773162842],
        ['mfa-usernameCount', -4.919476509094238],
        ['mfa-emailCount', -6.681553363800049],
        ['mfa-submitCount', -0.9014309048652649],
        ['mfa-hasTels', 10.599649429321289],
        ['mfa-hasOAuth', -8.149758338928223],
        ['mfa-hasCaptchas', -0.9372420310974121],
        ['mfa-hasFiles', -0.06334962695837021],
        ['mfa-hasDate', -6.07049560546875],
        ['mfa-hasNumber', 7.405060768127441],
        ['mfa-noPasswordFields', 0.24385643005371094],
        ['mfa-onePasswordField', -5.958454132080078],
        ['mfa-twoPasswordFields', -8.247978210449219],
        ['mfa-threePasswordFields', -6.1115570068359375],
        ['mfa-oneIdentifierField', -4.377863883972168],
        ['mfa-twoIdentifierFields', -5.937980651855469],
        ['mfa-threeIdentifierFields', -6.0749640464782715],
        ['mfa-hasHiddenIdentifier', -5.513402462005615],
        ['mfa-hasHiddenPassword', -2.2600159645080566],
        ['mfa-autofocusedIsPassword', 7.849817752838135],
        ['mfa-visibleRatio', -4.526566505432129],
        ['mfa-inputRatio', -2.638864517211914],
        ['mfa-hiddenRatio', 1.7874165773391724],
        ['mfa-identifierRatio', -4.420638561248779],
        ['mfa-emailRatio', -6.414320468902588],
        ['mfa-usernameRatio', -5.786078453063965],
        ['mfa-passwordRatio', -5.270896911621094],
        ['mfa-requiredRatio', 8.411846160888672],
        ['mfa-patternRatio', 9.386419296264648],
        ['mfa-minMaxLengthRatio', 3.478586435317993],
        ['mfa-pageLogin', 4.617283821105957],
        ['mfa-formTextLogin', -5.988003253936768],
        ['mfa-formAttrsLogin', -3.331435203552246],
        ['mfa-headingsLogin', -4.51909875869751],
        ['mfa-layoutLogin', -0.8999682664871216],
        ['mfa-rememberMeCheckbox', -6.112429618835449],
        ['mfa-troubleLink', -6.170429229736328],
        ['mfa-submitLogin', 0.007656761910766363],
        ['mfa-pageRegister', -4.634424686431885],
        ['mfa-formTextRegister', -0.04245511442422867],
        ['mfa-formAttrsRegister', -4.166624546051025],
        ['mfa-headingsRegister', -7.772249698638916],
        ['mfa-layoutRegister', -6.101711750030518],
        ['mfa-checkboxTOS', -0.06375816464424133],
        ['mfa-submitRegister', -5.975091457366943],
        ['mfa-pagePwReset', -6.094069004058838],
        ['mfa-formTextPwReset', -5.942159652709961],
        ['mfa-formAttrsPwReset', -6.113146781921387],
        ['mfa-headingsPwReset', -6.083134651184082],
        ['mfa-layoutPwReset', -5.9941253662109375],
        ['mfa-pageRecovery', 0.5845456719398499],
        ['mfa-formTextRecovery', 0.09717219322919846],
        ['mfa-formAttrsRecovery', -6.3966827392578125],
        ['mfa-headingsRecovery', -7.837586879730225],
        ['mfa-layoutRecovery', 2.1530213356018066],
        ['mfa-identifierRecovery', -5.906558036804199],
        ['mfa-submitRecovery', -2.7973034381866455],
        ['mfa-formTextMFA', 0.02702450007200241],
        ['mfa-formAttrsMFA', 13.792418479919434],
        ['mfa-headingsMFA', 16.47391700744629],
        ['mfa-layoutMFA', 11.801834106445312],
        ['mfa-buttonVerify', 15.340712547302246],
        ['mfa-inputsMFA', 15.785122871398926],
        ['mfa-inputsOTP', 17.240211486816406],
        ['mfa-linkOTPOutlier', -3.30935001373291],
        ['mfa-headingsNewsletter', -5.897129058837891],
        ['mfa-oneVisibleField', -1.102340579032898],
        ['mfa-buttonMultiStep', 2.1994547843933105],
        ['mfa-buttonMultiAction', -6.084924697875977],
        ['mfa-headingsMultiStep', 7.877044200897217],
    ],
    bias: -3.140923261642456,
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
        ['pw-loginScore', 12.178109169006348],
        ['pw-registerScore', -14.095705032348633],
        ['pw-pwChangeScore', -6.132966995239258],
        ['pw-exotic', -14.301056861877441],
        ['pw-dangling', -0.14651234447956085],
        ['pw-autocompleteNew', -11.587163925170898],
        ['pw-autocompleteCurrent', 6.1515793800354],
        ['pw-autocompleteOff', -2.7686562538146973],
        ['pw-isOnlyPassword', 4.763198375701904],
        ['pw-prevPwField', 1.1434913873672485],
        ['pw-nextPwField', -3.160039186477661],
        ['pw-attrCreate', -11.656277656555176],
        ['pw-attrCurrent', 2.0990264415740967],
        ['pw-attrConfirm', -6.049380779266357],
        ['pw-attrReset', 0.05293630063533783],
        ['pw-textCreate', 0.5916808843612671],
        ['pw-textCurrent', 6.4163737297058105],
        ['pw-textConfirm', -6.401777744293213],
        ['pw-textReset', 0.14726197719573975],
        ['pw-labelCreate', -6.4071736335754395],
        ['pw-labelCurrent', 8.018753051757812],
        ['pw-labelConfirm', -6.372302055358887],
        ['pw-labelReset', -0.09430480748414993],
        ['pw-prevPwCreate', -6.256430149078369],
        ['pw-prevPwCurrent', -6.377983093261719],
        ['pw-prevPwConfirm', 0.10989898443222046],
        ['pw-passwordOutlier', -6.25407075881958],
        ['pw-nextPwCreate', 12.501424789428711],
        ['pw-nextPwCurrent', 0.06942015886306763],
        ['pw-nextPwConfirm', -6.3712544441223145],
    ],
    bias: -0.009191801771521568,
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
        ['pw[new]-loginScore', -13.321765899658203],
        ['pw[new]-registerScore', 13.806652069091797],
        ['pw[new]-pwChangeScore', 5.898824691772461],
        ['pw[new]-exotic', 14.392525672912598],
        ['pw[new]-dangling', 0.008950293064117432],
        ['pw[new]-autocompleteNew', 11.933807373046875],
        ['pw[new]-autocompleteCurrent', -6.093362331390381],
        ['pw[new]-autocompleteOff', 0.18198005855083466],
        ['pw[new]-isOnlyPassword', -2.4956023693084717],
        ['pw[new]-prevPwField', -1.3099901676177979],
        ['pw[new]-nextPwField', 10.230724334716797],
        ['pw[new]-attrCreate', 12.553438186645508],
        ['pw[new]-attrCurrent', -4.011382102966309],
        ['pw[new]-attrConfirm', 7.036166191101074],
        ['pw[new]-attrReset', -0.13715289533138275],
        ['pw[new]-textCreate', -0.41179969906806946],
        ['pw[new]-textCurrent', -6.273018836975098],
        ['pw[new]-textConfirm', -15.34473705291748],
        ['pw[new]-textReset', 0.04498608410358429],
        ['pw[new]-labelCreate', 7.321496486663818],
        ['pw[new]-labelCurrent', -10.205763816833496],
        ['pw[new]-labelConfirm', 7.329835891723633],
        ['pw[new]-labelReset', -0.06805771589279175],
        ['pw[new]-prevPwCreate', 7.48891544342041],
        ['pw[new]-prevPwCurrent', 7.066701412200928],
        ['pw[new]-prevPwConfirm', -0.11096484959125519],
        ['pw[new]-passwordOutlier', -37.003944396972656],
        ['pw[new]-nextPwCreate', -13.286042213439941],
        ['pw[new]-nextPwCurrent', 0.135016530752182],
        ['pw[new]-nextPwConfirm', 7.2611775398254395],
    ],
    bias: -2.2122888565063477,
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
        ['username-autocompleteUsername', 9.536059379577637],
        ['username-autocompleteNickname', 0.16075658798217773],
        ['username-autocompleteEmail', -7.597077369689941],
        ['username-autocompleteOff', -0.06411032378673553],
        ['username-attrUsername', 18.593822479248047],
        ['username-textUsername', 9.375120162963867],
        ['username-labelUsername', 18.183473587036133],
        ['username-outlierUsername', -13.987862586975098],
        ['username-loginUsername', 17.73921012878418],
    ],
    bias: -9.912384986877441,
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
        ['username[hidden]-loginScore', 11.047222137451172],
        ['username[hidden]-registerScore', 10.807485580444336],
        ['username[hidden]-exotic', -8.083232879638672],
        ['username[hidden]-dangling', -0.00613674521446228],
        ['username[hidden]-attrUsername', 6.542288780212402],
        ['username[hidden]-attrEmail', 5.85617208480835],
        ['username[hidden]-usernameName', 6.071572780609131],
        ['username[hidden]-autocompleteUsername', -0.08764085918664932],
        ['username[hidden]-hiddenEmailValue', 7.754116058349609],
        ['username[hidden]-hiddenTelValue', 2.8544352054595947],
        ['username[hidden]-hiddenUsernameValue', 0.7577137351036072],
    ],
    bias: -21.466867446899414,
    cutoff: 0.55,
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
        ['email-autocompleteUsername', 1.2121766805648804],
        ['email-autocompleteNickname', 0.04257044196128845],
        ['email-autocompleteEmail', 6.312808990478516],
        ['email-typeEmail', 14.496212005615234],
        ['email-exactAttrEmail', 12.917569160461426],
        ['email-attrEmail', 2.142514705657959],
        ['email-textEmail', 14.224098205566406],
        ['email-labelEmail', 16.374858856201172],
        ['email-placeholderEmail', 15.077966690063477],
        ['email-attrSearch', -13.625563621520996],
        ['email-textSearch', -13.511505126953125],
    ],
    bias: -8.996057510375977,
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
        ['otp-mfaScore', 17.42131233215332],
        ['otp-exotic', -7.255556106567383],
        ['otp-dangling', -0.013268426060676575],
        ['otp-linkOTPOutlier', -12.831746101379395],
        ['otp-hasCheckboxes', -0.035425469279289246],
        ['otp-hidden', -9.941300392150879],
        ['otp-required', 0.7347698211669922],
        ['otp-nameMatch', -8.328723907470703],
        ['otp-idMatch', 6.1679463386535645],
        ['otp-numericMode', 11.20386791229248],
        ['otp-autofocused', 6.813513278961182],
        ['otp-tabIndex1', -0.6160632967948914],
        ['otp-patternOTP', 2.628904342651367],
        ['otp-maxLength1', 6.948922157287598],
        ['otp-maxLength5', -6.796201705932617],
        ['otp-minLength6', 16.08449363708496],
        ['otp-maxLength6', 6.503772735595703],
        ['otp-maxLength20', -5.617790222167969],
        ['otp-autocompleteOTC', 0.0050736963748931885],
        ['otp-autocompleteOff', -5.842536449432373],
        ['otp-prevAligned', 0.2123163640499115],
        ['otp-prevArea', 3.1000075340270996],
        ['otp-nextAligned', -0.06178431212902069],
        ['otp-nextArea', 3.473310708999634],
        ['otp-attrMFA', 6.85906457901001],
        ['otp-attrOTP', 10.389937400817871],
        ['otp-attrOutlier', -7.948760032653809],
        ['otp-textMFA', 6.867547512054443],
        ['otp-textOTP', 9.015040397644043],
        ['otp-labelMFA', 13.32413387298584],
        ['otp-labelOTP', -6.824984073638916],
        ['otp-labelOutlier', -6.5276360511779785],
        ['otp-wrapperOTP', 5.492493629455566],
        ['otp-wrapperOutlier', -6.292667865753174],
        ['otp-emailOutlierCount', -20.55013656616211],
    ],
    bias: -12.832666397094727,
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
        (el) => el !== document.body && el.querySelectorAll(editableFieldSelector).length > 0
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
