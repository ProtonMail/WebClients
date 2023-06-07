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
        ['login-fieldsCount', -4.195780277252197],
        ['login-inputCount', -4.7861480712890625],
        ['login-fieldsetCount', -16.8972110748291],
        ['login-textCount', -11.809144973754883],
        ['login-textareaCount', -6.180228233337402],
        ['login-selectCount', -6.490447044372559],
        ['login-checkboxCount', 8.7571382522583],
        ['login-radioCount', 0.08346933871507645],
        ['login-identifierCount', -5.18776273727417],
        ['login-usernameCount', 7.343513011932373],
        ['login-emailCount', -10.76125431060791],
        ['login-submitCount', 0.024152809754014015],
        ['login-hasTels', -1.083756923675537],
        ['login-hasOAuth', -0.37958890199661255],
        ['login-hasCaptchas', -0.7477312088012695],
        ['login-hasFiles', 0.05862913280725479],
        ['login-hasDate', -25.789100646972656],
        ['login-hasNumber', -6.017210960388184],
        ['login-noPasswordFields', -11.679215431213379],
        ['login-onePasswordField', 5.935816287994385],
        ['login-twoPasswordFields', -18.18441390991211],
        ['login-threePasswordFields', -6.383780002593994],
        ['login-oneIdentifierField', 0.5959247946739197],
        ['login-twoIdentifierFields', -24.495975494384766],
        ['login-threeIdentifierFields', -7.397388935089111],
        ['login-hasHiddenIdentifier', -6.186938285827637],
        ['login-hasHiddenPassword', 22.607254028320312],
        ['login-autofocusedIsPassword', 12.035858154296875],
        ['login-visibleRatio', 5.062535762786865],
        ['login-inputRatio', 0.7701085805892944],
        ['login-hiddenRatio', 10.166707992553711],
        ['login-identifierRatio', 10.480142593383789],
        ['login-emailRatio', 7.860612392425537],
        ['login-usernameRatio', -9.097541809082031],
        ['login-passwordRatio', 5.8407511711120605],
        ['login-requiredRatio', 0.9111739993095398],
        ['login-patternRatio', -5.976149082183838],
        ['login-minMaxLengthRatio', -1.3415648937225342],
        ['login-pageLogin', 11.40555191040039],
        ['login-formTextLogin', 8.349074363708496],
        ['login-formAttrsLogin', 6.382163047790527],
        ['login-headingsLogin', 20.30791473388672],
        ['login-layoutLogin', -0.6949076056480408],
        ['login-rememberMeCheckbox', 8.921504974365234],
        ['login-troubleLink', 15.721177101135254],
        ['login-submitLogin', 2.7517547607421875],
        ['login-pageRegister', -12.801950454711914],
        ['login-formTextRegister', -0.09456751495599747],
        ['login-formAttrsRegister', -17.262624740600586],
        ['login-headingsRegister', -1.8253116607666016],
        ['login-layoutRegister', -1.6106786727905273],
        ['login-checkboxTOS', -0.0006811022758483887],
        ['login-submitRegister', -14.135640144348145],
        ['login-pagePwReset', -6.060398578643799],
        ['login-formTextPwReset', -6.07002592086792],
        ['login-formAttrsPwReset', -20.496984481811523],
        ['login-headingsPwReset', -11.022542953491211],
        ['login-layoutPwReset', 4.754116058349609],
        ['login-pageRecovery', -8.086213111877441],
        ['login-formTextRecovery', -0.0594998300075531],
        ['login-formAttrsRecovery', -7.457194805145264],
        ['login-headingsRecovery', -1.9796485900878906],
        ['login-layoutRecovery', 0.05602847412228584],
        ['login-identifierRecovery', -3.012401580810547],
        ['login-submitRecovery', 2.609187126159668],
        ['login-formTextMFA', -0.06057834252715111],
        ['login-formAttrsMFA', 2.094879388809204],
        ['login-headingsMFA', -11.452890396118164],
        ['login-layoutMFA', -3.8298592567443848],
        ['login-buttonVerify', -9.007762908935547],
        ['login-inputsMFA', -16.6998348236084],
        ['login-inputsOTP', -5.485124111175537],
        ['login-linkOTPOutlier', -0.7715715169906616],
        ['login-headingsNewsletter', -9.834441184997559],
        ['login-oneVisibleField', -7.439568519592285],
        ['login-buttonMultiStep', 1.3397579193115234],
        ['login-buttonMultiAction', 25.39419937133789],
        ['login-headingsMultiStep', 0.8455480933189392],
    ],
    bias: -5.54161262512207,
    cutoff: 0.51,
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
        ['pw-change-fieldsCount', -1.7039260864257812],
        ['pw-change-inputCount', -1.3132178783416748],
        ['pw-change-fieldsetCount', -5.895492076873779],
        ['pw-change-textCount', -6.00717306137085],
        ['pw-change-textareaCount', -6.056500434875488],
        ['pw-change-selectCount', -5.905959129333496],
        ['pw-change-checkboxCount', -5.939432144165039],
        ['pw-change-radioCount', -0.06188085302710533],
        ['pw-change-identifierCount', -5.428391933441162],
        ['pw-change-usernameCount', -6.1094865798950195],
        ['pw-change-emailCount', -4.2494306564331055],
        ['pw-change-submitCount', -2.835409641265869],
        ['pw-change-hasTels', -6.004220962524414],
        ['pw-change-hasOAuth', -6.074352264404297],
        ['pw-change-hasCaptchas', -5.921670436859131],
        ['pw-change-hasFiles', -0.08878040313720703],
        ['pw-change-hasDate', -6.068802833557129],
        ['pw-change-hasNumber', -9.433618545532227],
        ['pw-change-noPasswordFields', -5.92697811126709],
        ['pw-change-onePasswordField', -5.962122440338135],
        ['pw-change-twoPasswordFields', 13.96588134765625],
        ['pw-change-threePasswordFields', 19.548097610473633],
        ['pw-change-oneIdentifierField', -6.006857872009277],
        ['pw-change-twoIdentifierFields', -6.089974880218506],
        ['pw-change-threeIdentifierFields', 13.26057243347168],
        ['pw-change-hasHiddenIdentifier', -0.9287967085838318],
        ['pw-change-hasHiddenPassword', -6.0365495681762695],
        ['pw-change-autofocusedIsPassword', 19.98295783996582],
        ['pw-change-visibleRatio', -3.369802951812744],
        ['pw-change-inputRatio', -3.539950370788574],
        ['pw-change-hiddenRatio', -4.614305019378662],
        ['pw-change-identifierRatio', -5.398741722106934],
        ['pw-change-emailRatio', -5.117318630218506],
        ['pw-change-usernameRatio', -5.956772327423096],
        ['pw-change-passwordRatio', 5.328240871429443],
        ['pw-change-requiredRatio', -4.276900768280029],
        ['pw-change-patternRatio', 1.7064768075942993],
        ['pw-change-minMaxLengthRatio', -3.10691237449646],
        ['pw-change-pageLogin', -5.915473461151123],
        ['pw-change-formTextLogin', -6.0086565017700195],
        ['pw-change-formAttrsLogin', -6.031517505645752],
        ['pw-change-headingsLogin', -6.026739120483398],
        ['pw-change-layoutLogin', -6.10063362121582],
        ['pw-change-rememberMeCheckbox', -5.906718730926514],
        ['pw-change-troubleLink', -3.4522347450256348],
        ['pw-change-submitLogin', -6.073254585266113],
        ['pw-change-pageRegister', -5.949135780334473],
        ['pw-change-formTextRegister', -0.07430693507194519],
        ['pw-change-formAttrsRegister', -5.988044738769531],
        ['pw-change-headingsRegister', -6.305746555328369],
        ['pw-change-layoutRegister', -6.071242332458496],
        ['pw-change-checkboxTOS', -0.08983401209115982],
        ['pw-change-submitRegister', -6.478631496429443],
        ['pw-change-pagePwReset', 15.041163444519043],
        ['pw-change-formTextPwReset', 18.13500213623047],
        ['pw-change-formAttrsPwReset', 2.372828960418701],
        ['pw-change-headingsPwReset', 16.60783576965332],
        ['pw-change-layoutPwReset', 14.681925773620605],
        ['pw-change-pageRecovery', -6.079062461853027],
        ['pw-change-formTextRecovery', 0.07987017184495926],
        ['pw-change-formAttrsRecovery', -5.970343112945557],
        ['pw-change-headingsRecovery', -5.973182201385498],
        ['pw-change-layoutRecovery', -4.211444854736328],
        ['pw-change-identifierRecovery', -5.9351935386657715],
        ['pw-change-submitRecovery', -0.7757672071456909],
        ['pw-change-formTextMFA', 0.08649124950170517],
        ['pw-change-formAttrsMFA', -5.922231197357178],
        ['pw-change-headingsMFA', -5.994527816772461],
        ['pw-change-layoutMFA', -6.032079219818115],
        ['pw-change-buttonVerify', -5.956771373748779],
        ['pw-change-inputsMFA', -5.93149471282959],
        ['pw-change-inputsOTP', -5.959892749786377],
        ['pw-change-linkOTPOutlier', -6.276941776275635],
        ['pw-change-headingsNewsletter', -5.906622886657715],
        ['pw-change-oneVisibleField', -5.967141151428223],
        ['pw-change-buttonMultiStep', -5.999699115753174],
        ['pw-change-buttonMultiAction', -5.9661688804626465],
        ['pw-change-headingsMultiStep', -6.035891532897949],
    ],
    bias: -3.6192078590393066,
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
        ['register-fieldsCount', 10.813175201416016],
        ['register-inputCount', 11.695194244384766],
        ['register-fieldsetCount', 12.456406593322754],
        ['register-textCount', 11.663115501403809],
        ['register-textareaCount', -24.232067108154297],
        ['register-selectCount', -5.697086334228516],
        ['register-checkboxCount', -6.313959121704102],
        ['register-radioCount', 0.06939085572957993],
        ['register-identifierCount', 2.4913365840911865],
        ['register-usernameCount', -23.18181610107422],
        ['register-emailCount', 13.505940437316895],
        ['register-submitCount', -13.594605445861816],
        ['register-hasTels', 2.2866039276123047],
        ['register-hasOAuth', 5.904530048370361],
        ['register-hasCaptchas', 5.42712926864624],
        ['register-hasFiles', -0.08986489474773407],
        ['register-hasDate', 10.169395446777344],
        ['register-hasNumber', 34.960350036621094],
        ['register-noPasswordFields', -5.985789775848389],
        ['register-onePasswordField', -7.1695098876953125],
        ['register-twoPasswordFields', 6.734208106994629],
        ['register-threePasswordFields', -6.5663299560546875],
        ['register-oneIdentifierField', 2.6437430381774902],
        ['register-twoIdentifierFields', 1.3245919942855835],
        ['register-threeIdentifierFields', 10.22504997253418],
        ['register-hasHiddenIdentifier', -0.3734072744846344],
        ['register-hasHiddenPassword', -12.987070083618164],
        ['register-autofocusedIsPassword', -6.690791130065918],
        ['register-visibleRatio', 0.6070629358291626],
        ['register-inputRatio', -12.655513763427734],
        ['register-hiddenRatio', -4.604986190795898],
        ['register-identifierRatio', 19.170164108276367],
        ['register-emailRatio', 0.10308130085468292],
        ['register-usernameRatio', -7.86883544921875],
        ['register-passwordRatio', -0.7239310145378113],
        ['register-requiredRatio', -9.75088882446289],
        ['register-patternRatio', -16.09473991394043],
        ['register-minMaxLengthRatio', -19.15272331237793],
        ['register-pageLogin', -4.299387454986572],
        ['register-formTextLogin', -6.127359867095947],
        ['register-formAttrsLogin', -1.20890212059021],
        ['register-headingsLogin', -0.6539186239242554],
        ['register-layoutLogin', 19.32942008972168],
        ['register-rememberMeCheckbox', -6.410707950592041],
        ['register-troubleLink', -24.026039123535156],
        ['register-submitLogin', -9.677106857299805],
        ['register-pageRegister', 5.360437870025635],
        ['register-formTextRegister', 0.08934976905584335],
        ['register-formAttrsRegister', 28.80236053466797],
        ['register-headingsRegister', 3.992354393005371],
        ['register-layoutRegister', -8.262739181518555],
        ['register-checkboxTOS', 0.09456189721822739],
        ['register-submitRegister', 24.49930191040039],
        ['register-pagePwReset', -6.119279384613037],
        ['register-formTextPwReset', -6.1064229011535645],
        ['register-formAttrsPwReset', -6.102044582366943],
        ['register-headingsPwReset', -12.377548217773438],
        ['register-layoutPwReset', -11.884937286376953],
        ['register-pageRecovery', -19.32568359375],
        ['register-formTextRecovery', -0.022772222757339478],
        ['register-formAttrsRecovery', -6.803171157836914],
        ['register-headingsRecovery', -0.13951537013053894],
        ['register-layoutRecovery', -12.259788513183594],
        ['register-identifierRecovery', -31.792377471923828],
        ['register-submitRecovery', -16.842729568481445],
        ['register-formTextMFA', 0.03920821100473404],
        ['register-formAttrsMFA', 5.150042533874512],
        ['register-headingsMFA', -10.02682113647461],
        ['register-layoutMFA', -15.155953407287598],
        ['register-buttonVerify', 8.201017379760742],
        ['register-inputsMFA', -4.754068374633789],
        ['register-inputsOTP', -11.730021476745605],
        ['register-linkOTPOutlier', -5.700133800506592],
        ['register-headingsNewsletter', -7.220907688140869],
        ['register-oneVisibleField', -10.117232322692871],
        ['register-buttonMultiStep', 12.137432098388672],
        ['register-buttonMultiAction', -3.210397720336914],
        ['register-headingsMultiStep', 20.281063079833984],
    ],
    bias: -5.710323810577393,
    cutoff: 0.5,
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
        ['recovery-fieldsCount', -3.0286896228790283],
        ['recovery-inputCount', -2.1935558319091797],
        ['recovery-fieldsetCount', -2.415515422821045],
        ['recovery-textCount', 10.062348365783691],
        ['recovery-textareaCount', -25.234874725341797],
        ['recovery-selectCount', -8.60986614227295],
        ['recovery-checkboxCount', -6.000746726989746],
        ['recovery-radioCount', 0.08010845631361008],
        ['recovery-identifierCount', 2.7943286895751953],
        ['recovery-usernameCount', 10.762523651123047],
        ['recovery-emailCount', -0.19573715329170227],
        ['recovery-submitCount', -5.737401962280273],
        ['recovery-hasTels', -10.221670150756836],
        ['recovery-hasOAuth', -3.764500379562378],
        ['recovery-hasCaptchas', -3.406970500946045],
        ['recovery-hasFiles', -0.02757294476032257],
        ['recovery-hasDate', -5.9264235496521],
        ['recovery-hasNumber', -5.920384407043457],
        ['recovery-noPasswordFields', 0.1372094750404358],
        ['recovery-onePasswordField', -14.534791946411133],
        ['recovery-twoPasswordFields', -10.013524055480957],
        ['recovery-threePasswordFields', -14.394533157348633],
        ['recovery-oneIdentifierField', 3.7448740005493164],
        ['recovery-twoIdentifierFields', -0.34153956174850464],
        ['recovery-threeIdentifierFields', -6.1878204345703125],
        ['recovery-hasHiddenIdentifier', -3.387136459350586],
        ['recovery-hasHiddenPassword', -18.690767288208008],
        ['recovery-autofocusedIsPassword', -5.916014671325684],
        ['recovery-visibleRatio', 2.0061159133911133],
        ['recovery-inputRatio', -5.296477794647217],
        ['recovery-hiddenRatio', 0.5483981370925903],
        ['recovery-identifierRatio', 2.2830746173858643],
        ['recovery-emailRatio', 1.596911907196045],
        ['recovery-usernameRatio', 9.330948829650879],
        ['recovery-passwordRatio', -13.398322105407715],
        ['recovery-requiredRatio', 1.502241849899292],
        ['recovery-patternRatio', -1.1514897346496582],
        ['recovery-minMaxLengthRatio', 5.472384929656982],
        ['recovery-pageLogin', -8.259774208068848],
        ['recovery-formTextLogin', -6.085689544677734],
        ['recovery-formAttrsLogin', 6.0255255699157715],
        ['recovery-headingsLogin', -20.2518310546875],
        ['recovery-layoutLogin', -2.794827938079834],
        ['recovery-rememberMeCheckbox', -6.0630035400390625],
        ['recovery-troubleLink', 1.8071755170822144],
        ['recovery-submitLogin', -7.4936747550964355],
        ['recovery-pageRegister', -1.9048771858215332],
        ['recovery-formTextRegister', -0.0023192688822746277],
        ['recovery-formAttrsRegister', -8.511347770690918],
        ['recovery-headingsRegister', -6.923574447631836],
        ['recovery-layoutRegister', -6.811892509460449],
        ['recovery-checkboxTOS', 0.10074888914823532],
        ['recovery-submitRegister', -6.332098960876465],
        ['recovery-pagePwReset', 6.8080244064331055],
        ['recovery-formTextPwReset', -6.406118392944336],
        ['recovery-formAttrsPwReset', 10.41579532623291],
        ['recovery-headingsPwReset', 15.204000473022461],
        ['recovery-layoutPwReset', 4.536105632781982],
        ['recovery-pageRecovery', 13.485429763793945],
        ['recovery-formTextRecovery', -0.0038925781846046448],
        ['recovery-formAttrsRecovery', 20.94879913330078],
        ['recovery-headingsRecovery', -1.3847352266311646],
        ['recovery-layoutRecovery', -6.839771270751953],
        ['recovery-identifierRecovery', 17.875686645507812],
        ['recovery-submitRecovery', 12.012768745422363],
        ['recovery-formTextMFA', 0.0019552111625671387],
        ['recovery-formAttrsMFA', 4.7548089027404785],
        ['recovery-headingsMFA', -1.2354434728622437],
        ['recovery-layoutMFA', -7.61660623550415],
        ['recovery-buttonVerify', -4.239028453826904],
        ['recovery-inputsMFA', 0.9303795099258423],
        ['recovery-inputsOTP', -5.505880832672119],
        ['recovery-linkOTPOutlier', -1.563506841659546],
        ['recovery-headingsNewsletter', -15.4531888961792],
        ['recovery-oneVisibleField', -5.27944803237915],
        ['recovery-buttonMultiStep', 3.406707286834717],
        ['recovery-buttonMultiAction', -6.12478494644165],
        ['recovery-headingsMultiStep', -6.0091023445129395],
    ],
    bias: -7.0105814933776855,
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
        ['mfa-fieldsCount', -4.4847564697265625],
        ['mfa-inputCount', -5.190240859985352],
        ['mfa-fieldsetCount', 0.22944088280200958],
        ['mfa-textCount', -1.9034308195114136],
        ['mfa-textareaCount', -7.473887920379639],
        ['mfa-selectCount', -6.4112019538879395],
        ['mfa-checkboxCount', -5.951529502868652],
        ['mfa-radioCount', 0.08414774388074875],
        ['mfa-identifierCount', -4.228144645690918],
        ['mfa-usernameCount', -4.918683052062988],
        ['mfa-emailCount', -6.751508712768555],
        ['mfa-submitCount', -0.8017147779464722],
        ['mfa-hasTels', 10.30903148651123],
        ['mfa-hasOAuth', -8.326929092407227],
        ['mfa-hasCaptchas', -0.8257513046264648],
        ['mfa-hasFiles', 0.10724633187055588],
        ['mfa-hasDate', -5.93662691116333],
        ['mfa-hasNumber', 7.523228168487549],
        ['mfa-noPasswordFields', 0.18460489809513092],
        ['mfa-onePasswordField', -6.108407974243164],
        ['mfa-twoPasswordFields', -8.230232238769531],
        ['mfa-threePasswordFields', -6.036983013153076],
        ['mfa-oneIdentifierField', -4.479443550109863],
        ['mfa-twoIdentifierFields', -5.90720796585083],
        ['mfa-threeIdentifierFields', -6.064476490020752],
        ['mfa-hasHiddenIdentifier', -5.537662506103516],
        ['mfa-hasHiddenPassword', -1.987077236175537],
        ['mfa-autofocusedIsPassword', 7.933252811431885],
        ['mfa-visibleRatio', -4.436862945556641],
        ['mfa-inputRatio', -2.670165777206421],
        ['mfa-hiddenRatio', 1.9298640489578247],
        ['mfa-identifierRatio', -4.307239055633545],
        ['mfa-emailRatio', -6.591071128845215],
        ['mfa-usernameRatio', -5.691068172454834],
        ['mfa-passwordRatio', -5.209455966949463],
        ['mfa-requiredRatio', 8.519722938537598],
        ['mfa-patternRatio', 9.238045692443848],
        ['mfa-minMaxLengthRatio', 3.466870069503784],
        ['mfa-pageLogin', 4.600447177886963],
        ['mfa-formTextLogin', -5.951615810394287],
        ['mfa-formAttrsLogin', -3.1457512378692627],
        ['mfa-headingsLogin', -4.563893795013428],
        ['mfa-layoutLogin', -0.719970703125],
        ['mfa-rememberMeCheckbox', -5.974963188171387],
        ['mfa-troubleLink', -6.237032890319824],
        ['mfa-submitLogin', 0.23519787192344666],
        ['mfa-pageRegister', -4.3994669914245605],
        ['mfa-formTextRegister', 0.012726925313472748],
        ['mfa-formAttrsRegister', -3.9111578464508057],
        ['mfa-headingsRegister', -8.123573303222656],
        ['mfa-layoutRegister', -6.206075191497803],
        ['mfa-checkboxTOS', -0.018343567848205566],
        ['mfa-submitRegister', -6.123176574707031],
        ['mfa-pagePwReset', -5.9168009757995605],
        ['mfa-formTextPwReset', -5.974754333496094],
        ['mfa-formAttrsPwReset', -5.953812122344971],
        ['mfa-headingsPwReset', -5.927659511566162],
        ['mfa-layoutPwReset', -5.914720058441162],
        ['mfa-pageRecovery', 0.029999148100614548],
        ['mfa-formTextRecovery', -0.06300884485244751],
        ['mfa-formAttrsRecovery', -6.285897254943848],
        ['mfa-headingsRecovery', -7.906850814819336],
        ['mfa-layoutRecovery', 2.3921215534210205],
        ['mfa-identifierRecovery', -6.023278713226318],
        ['mfa-submitRecovery', -2.850600242614746],
        ['mfa-formTextMFA', 0.021588824689388275],
        ['mfa-formAttrsMFA', 13.659719467163086],
        ['mfa-headingsMFA', 16.311311721801758],
        ['mfa-layoutMFA', 11.543635368347168],
        ['mfa-buttonVerify', 15.064913749694824],
        ['mfa-inputsMFA', 15.488391876220703],
        ['mfa-inputsOTP', 16.990814208984375],
        ['mfa-linkOTPOutlier', -3.4056458473205566],
        ['mfa-headingsNewsletter', -6.004276752471924],
        ['mfa-oneVisibleField', -1.1154468059539795],
        ['mfa-buttonMultiStep', 2.2469046115875244],
        ['mfa-buttonMultiAction', -6.036898136138916],
        ['mfa-headingsMultiStep', 7.858985900878906],
    ],
    bias: -3.1581192016601562,
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
        ['pw-loginScore', 11.048707008361816],
        ['pw-registerScore', -12.00577449798584],
        ['pw-pwChangeScore', -5.266782760620117],
        ['pw-exotic', -13.12257194519043],
        ['pw-dangling', -0.15073437988758087],
        ['pw-autocompleteNew', -2.732689619064331],
        ['pw-autocompleteCurrent', 6.280777454376221],
        ['pw-autocompleteOff', -1.038101077079773],
        ['pw-isOnlyPassword', 3.567695379257202],
        ['pw-prevPwField', -0.5999951958656311],
        ['pw-nextPwField', -2.6225883960723877],
        ['pw-attrCreate', -0.23555751144886017],
        ['pw-attrCurrent', 3.0814051628112793],
        ['pw-attrConfirm', -6.745255470275879],
        ['pw-attrReset', 0.017606228590011597],
        ['pw-textCreate', -1.7095038890838623],
        ['pw-textCurrent', 6.427789688110352],
        ['pw-textConfirm', -7.3697285652160645],
        ['pw-textReset', 0.004566088318824768],
        ['pw-labelCreate', -7.457580089569092],
        ['pw-labelCurrent', 11.604236602783203],
        ['pw-labelConfirm', -7.243116855621338],
        ['pw-labelReset', -0.011014550924301147],
        ['pw-prevPwCreate', -7.193681240081787],
        ['pw-prevPwCurrent', -8.639935493469238],
        ['pw-prevPwConfirm', 0.035792410373687744],
        ['pw-passwordOutlier', -7.25222110748291],
        ['pw-nextPwCreate', 7.39888858795166],
        ['pw-nextPwCurrent', -0.0677749291062355],
        ['pw-nextPwConfirm', -7.391231060028076],
    ],
    bias: -0.2738156318664551,
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
        ['pw[new]-loginScore', -12.086569786071777],
        ['pw[new]-registerScore', 14.95441722869873],
        ['pw[new]-pwChangeScore', 5.690969467163086],
        ['pw[new]-exotic', 15.415839195251465],
        ['pw[new]-dangling', 0.01156817376613617],
        ['pw[new]-autocompleteNew', 2.533656597137451],
        ['pw[new]-autocompleteCurrent', -5.993297576904297],
        ['pw[new]-autocompleteOff', -0.1301068514585495],
        ['pw[new]-isOnlyPassword', -2.804013967514038],
        ['pw[new]-prevPwField', -1.3029508590698242],
        ['pw[new]-nextPwField', 10.212187767028809],
        ['pw[new]-attrCreate', 2.4116389751434326],
        ['pw[new]-attrCurrent', -3.354565382003784],
        ['pw[new]-attrConfirm', 6.830986499786377],
        ['pw[new]-attrReset', -0.1444089412689209],
        ['pw[new]-textCreate', 0.1272737681865692],
        ['pw[new]-textCurrent', -6.130353927612305],
        ['pw[new]-textConfirm', -15.898980140686035],
        ['pw[new]-textReset', 0.016481801867485046],
        ['pw[new]-labelCreate', 7.630806922912598],
        ['pw[new]-labelCurrent', -10.64811897277832],
        ['pw[new]-labelConfirm', 7.265120506286621],
        ['pw[new]-labelReset', -0.014966294169425964],
        ['pw[new]-prevPwCreate', 10.52647590637207],
        ['pw[new]-prevPwCurrent', 8.28158950805664],
        ['pw[new]-prevPwConfirm', -0.17554830014705658],
        ['pw[new]-passwordOutlier', -28.76578712463379],
        ['pw[new]-nextPwCreate', -11.778719902038574],
        ['pw[new]-nextPwCurrent', 0.14107191562652588],
        ['pw[new]-nextPwConfirm', 7.5108208656311035],
    ],
    bias: -2.7935407161712646,
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
        ['username-autocompleteUsername', 9.698673248291016],
        ['username-autocompleteNickname', -0.08726410567760468],
        ['username-autocompleteEmail', -7.5825653076171875],
        ['username-autocompleteOff', -0.248056098818779],
        ['username-attrUsername', 18.525537490844727],
        ['username-textUsername', 9.254244804382324],
        ['username-labelUsername', 17.875635147094727],
        ['username-outlierUsername', -7.358067989349365],
        ['username-loginUsername', 18.61323356628418],
    ],
    bias: -9.84937572479248,
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
        ['username[hidden]-loginScore', 12.42053508758545],
        ['username[hidden]-registerScore', 12.378921508789062],
        ['username[hidden]-exotic', -8.15755558013916],
        ['username[hidden]-dangling', -0.06945429742336273],
        ['username[hidden]-attrUsername', 7.256979465484619],
        ['username[hidden]-attrEmail', 6.511663436889648],
        ['username[hidden]-usernameName', 6.5923895835876465],
        ['username[hidden]-autocompleteUsername', 0.004028233699500561],
        ['username[hidden]-hiddenEmailValue', 8.506967544555664],
        ['username[hidden]-hiddenTelValue', 3.254171848297119],
        ['username[hidden]-hiddenUsernameValue', 0.8061028122901917],
    ],
    bias: -23.97007179260254,
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
        ['email-autocompleteUsername', 1.2747260332107544],
        ['email-autocompleteNickname', 0.2965189218521118],
        ['email-autocompleteEmail', 6.27928352355957],
        ['email-typeEmail', 14.785411834716797],
        ['email-exactAttrEmail', 13.069681167602539],
        ['email-attrEmail', 2.29903507232666],
        ['email-textEmail', 14.408370971679688],
        ['email-labelEmail', 16.823810577392578],
        ['email-placeholderEmail', 15.265952110290527],
        ['email-attrSearch', -13.283109664916992],
        ['email-textSearch', -13.856245040893555],
    ],
    bias: -9.249371528625488,
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
        ['otp-mfaScore', 17.2645320892334],
        ['otp-exotic', -7.268810272216797],
        ['otp-dangling', -0.13310439884662628],
        ['otp-linkOTPOutlier', -12.852672576904297],
        ['otp-hasCheckboxes', -0.06229568272829056],
        ['otp-hidden', -9.904393196105957],
        ['otp-required', 0.7768981456756592],
        ['otp-nameMatch', -8.233864784240723],
        ['otp-idMatch', 5.885322570800781],
        ['otp-numericMode', 11.076515197753906],
        ['otp-autofocused', 6.721399307250977],
        ['otp-tabIndex1', -0.6129826903343201],
        ['otp-patternOTP', 2.7782883644104004],
        ['otp-maxLength1', 6.882664680480957],
        ['otp-maxLength5', -7.443577289581299],
        ['otp-minLength6', 17.491403579711914],
        ['otp-maxLength6', 6.646275043487549],
        ['otp-maxLength20', -5.578049659729004],
        ['otp-autocompleteOTC', -0.0490768700838089],
        ['otp-autocompleteOff', -5.779600620269775],
        ['otp-prevAligned', 0.9860952496528625],
        ['otp-prevArea', 3.3136799335479736],
        ['otp-nextAligned', -0.01677750051021576],
        ['otp-nextArea', 3.66294527053833],
        ['otp-attrMFA', 6.828065872192383],
        ['otp-attrOTP', 10.11097526550293],
        ['otp-attrOutlier', -8.186573028564453],
        ['otp-textMFA', 6.908660888671875],
        ['otp-textOTP', 8.82105827331543],
        ['otp-labelMFA', 13.243430137634277],
        ['otp-labelOTP', -7.031774997711182],
        ['otp-labelOutlier', -6.4510979652404785],
        ['otp-wrapperOTP', 5.676884174346924],
        ['otp-wrapperOutlier', -6.319714546203613],
        ['otp-emailOutlierCount', -20.281723022460938],
    ],
    bias: -12.744452476501465,
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
