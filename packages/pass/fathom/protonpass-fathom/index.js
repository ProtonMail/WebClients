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

const EMAIL_VALUE_RE = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

const TEL_VALUE_RE = /^[\d()+-]{6,25}$/;

const USERNAME_VALUE_RE = /^[\w\-\.]{7,30}$/;

const reSanityCheck = (cb, options) => (str) => {
    if (options.maxLength && str.length > options.maxLength) return false;
    if (options.minLength && str.length < options.minLength) return false;
    return cb(str);
};

const notRe = (reg, options) => (str) => !test(reg, options)(str);

const andRe = (reg, options) => and(reg.map((re) => test(re, options)));

const orRe = (reg, options) => or(reg.map((re) => test(re, options)));

const test = (re, options) =>
    reSanityCheck(
        (str) => re.test(str),
        options !== null && options !== void 0
            ? options
            : {
                  maxLength: 5e3,
                  minLength: 2,
              }
    );

const and = (tests) => (str) => tests.every((test) => test(str));

const or = (tests) => (str) => tests.some((test) => test(str));

const any = (test) => (strs) => strs.some(test);

const matchLogin = test(LOGIN_RE);

const matchRegister = test(REGISTER_RE);

const matchUsername = test(USERNAME_RE);

const matchUsernameAttr = orRe([USERNAME_ATTR_RE, USERNAME_RE]);

const matchUsernameValue = test(USERNAME_VALUE_RE);

const matchUsernameOutlier = test(USERNAME_OUTLIER_RE);

const matchEmailAttr = orRe([EMAIL_ATTR_RE, EMAIL_RE]);

const matchEmailValue = test(EMAIL_VALUE_RE, {
    maxLength: 230,
    minLength: 5,
});

const matchEmail = or([test(EMAIL_RE), matchEmailValue]);

const matchTelValue = test(TEL_VALUE_RE, {
    maxLength: 25,
    minLength: 6,
});

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
        ['login-fieldsCount', -3.897554636001587],
        ['login-inputCount', -4.740869522094727],
        ['login-fieldsetCount', -16.49279022216797],
        ['login-textCount', -11.696488380432129],
        ['login-textareaCount', -6.008007526397705],
        ['login-selectCount', -6.472845554351807],
        ['login-checkboxCount', 8.940827369689941],
        ['login-radioCount', 0.03295663744211197],
        ['login-identifierCount', -5.136066436767578],
        ['login-usernameCount', 7.393354415893555],
        ['login-emailCount', -10.654157638549805],
        ['login-submitCount', 0.08854794502258301],
        ['login-hasTels', -1.1834769248962402],
        ['login-hasOAuth', -0.3023603856563568],
        ['login-hasCaptchas', -0.7253606915473938],
        ['login-hasFiles', -0.04650264233350754],
        ['login-hasDate', -26.038631439208984],
        ['login-hasNumber', -6.069892883300781],
        ['login-noPasswordFields', -11.37060546875],
        ['login-onePasswordField', 5.8511152267456055],
        ['login-twoPasswordFields', -17.823719024658203],
        ['login-threePasswordFields', -6.4381327629089355],
        ['login-oneIdentifierField', 0.7145916223526001],
        ['login-twoIdentifierFields', -23.862642288208008],
        ['login-threeIdentifierFields', -7.259110927581787],
        ['login-hasHiddenIdentifier', -5.96145486831665],
        ['login-hasHiddenPassword', 22.111265182495117],
        ['login-autofocusedIsPassword', 12.161179542541504],
        ['login-visibleRatio', 4.740142345428467],
        ['login-inputRatio', 0.9821677803993225],
        ['login-hiddenRatio', 9.43309497833252],
        ['login-identifierRatio', 10.365385055541992],
        ['login-emailRatio', 7.673644065856934],
        ['login-usernameRatio', -9.071348190307617],
        ['login-passwordRatio', 5.969193935394287],
        ['login-requiredRatio', 0.9213966727256775],
        ['login-patternRatio', -6.406557559967041],
        ['login-minMaxLengthRatio', -1.3552113771438599],
        ['login-pageLogin', 11.309247970581055],
        ['login-formTextLogin', 8.469583511352539],
        ['login-formAttrsLogin', 6.365601062774658],
        ['login-headingsLogin', 20.087684631347656],
        ['login-layoutLogin', -0.6206109523773193],
        ['login-rememberMeCheckbox', 8.753244400024414],
        ['login-troubleLink', 15.367493629455566],
        ['login-submitLogin', 2.623748302459717],
        ['login-pageRegister', -12.66466236114502],
        ['login-formTextRegister', -0.11274725943803787],
        ['login-formAttrsRegister', -17.491823196411133],
        ['login-headingsRegister', -2.0391860008239746],
        ['login-layoutRegister', -1.4174394607543945],
        ['login-checkboxTOS', 0.025773830711841583],
        ['login-submitRegister', -14.014699935913086],
        ['login-pagePwReset', -6.1571478843688965],
        ['login-formTextPwReset', -6.068376064300537],
        ['login-formAttrsPwReset', -19.41426658630371],
        ['login-headingsPwReset', -10.289681434631348],
        ['login-layoutPwReset', 4.00993537902832],
        ['login-pageRecovery', -7.776562213897705],
        ['login-formTextRecovery', -0.10974617302417755],
        ['login-formAttrsRecovery', -7.519696235656738],
        ['login-headingsRecovery', -1.996411681175232],
        ['login-layoutRecovery', 0.07390853762626648],
        ['login-identifierRecovery', -2.784965753555298],
        ['login-submitRecovery', 2.563399076461792],
        ['login-formTextMFA', -0.022868946194648743],
        ['login-formAttrsMFA', 2.0307023525238037],
        ['login-headingsMFA', -11.34237289428711],
        ['login-layoutMFA', -4.080819129943848],
        ['login-buttonVerify', -8.397671699523926],
        ['login-inputsMFA', -16.570402145385742],
        ['login-inputsOTP', -5.463020324707031],
        ['login-linkOTPOutlier', -0.8235969543457031],
        ['login-headingsNewsletter', -9.587108612060547],
        ['login-oneVisibleField', -7.404672622680664],
        ['login-buttonMultiStep', 1.314167857170105],
        ['login-buttonMultiAction', 25.275598526000977],
        ['login-headingsMultiStep', 0.9757684469223022],
    ],
    bias: -5.5804948806762695,
    cutoff: 0.98,
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
        ['pw-change-fieldsCount', -1.509824275970459],
        ['pw-change-inputCount', -1.2432349920272827],
        ['pw-change-fieldsetCount', -6.096236228942871],
        ['pw-change-textCount', -6.0531744956970215],
        ['pw-change-textareaCount', -5.987483024597168],
        ['pw-change-selectCount', -5.97050142288208],
        ['pw-change-checkboxCount', -5.895331382751465],
        ['pw-change-radioCount', -0.07585959136486053],
        ['pw-change-identifierCount', -5.431323051452637],
        ['pw-change-usernameCount', -6.100097179412842],
        ['pw-change-emailCount', -4.087405681610107],
        ['pw-change-submitCount', -2.628835678100586],
        ['pw-change-hasTels', -5.910955905914307],
        ['pw-change-hasOAuth', -6.077495574951172],
        ['pw-change-hasCaptchas', -5.9218268394470215],
        ['pw-change-hasFiles', 0.025061391294002533],
        ['pw-change-hasDate', -5.944748401641846],
        ['pw-change-hasNumber', -9.940300941467285],
        ['pw-change-noPasswordFields', -6.117518424987793],
        ['pw-change-onePasswordField', -5.985586643218994],
        ['pw-change-twoPasswordFields', 13.77720832824707],
        ['pw-change-threePasswordFields', 19.194669723510742],
        ['pw-change-oneIdentifierField', -5.89385461807251],
        ['pw-change-twoIdentifierFields', -5.994103908538818],
        ['pw-change-threeIdentifierFields', 12.639799118041992],
        ['pw-change-hasHiddenIdentifier', -0.6375578045845032],
        ['pw-change-hasHiddenPassword', -6.040824890136719],
        ['pw-change-autofocusedIsPassword', 19.297746658325195],
        ['pw-change-visibleRatio', -3.1331703662872314],
        ['pw-change-inputRatio', -3.3862318992614746],
        ['pw-change-hiddenRatio', -4.534247875213623],
        ['pw-change-identifierRatio', -5.289313793182373],
        ['pw-change-emailRatio', -5.091088771820068],
        ['pw-change-usernameRatio', -5.937304973602295],
        ['pw-change-passwordRatio', 5.612574100494385],
        ['pw-change-requiredRatio', -4.159592151641846],
        ['pw-change-patternRatio', 2.2705001831054688],
        ['pw-change-minMaxLengthRatio', -2.850917100906372],
        ['pw-change-pageLogin', -5.9487690925598145],
        ['pw-change-formTextLogin', -6.000277519226074],
        ['pw-change-formAttrsLogin', -5.932112693786621],
        ['pw-change-headingsLogin', -5.901566505432129],
        ['pw-change-layoutLogin', -6.088479518890381],
        ['pw-change-rememberMeCheckbox', -6.116321563720703],
        ['pw-change-troubleLink', -3.4347052574157715],
        ['pw-change-submitLogin', -6.1193060874938965],
        ['pw-change-pageRegister', -6.040922164916992],
        ['pw-change-formTextRegister', 0.07757487148046494],
        ['pw-change-formAttrsRegister', -6.051988124847412],
        ['pw-change-headingsRegister', -6.548861503601074],
        ['pw-change-layoutRegister', -6.095250129699707],
        ['pw-change-checkboxTOS', -0.017323501408100128],
        ['pw-change-submitRegister', -6.473033428192139],
        ['pw-change-pagePwReset', 14.816904067993164],
        ['pw-change-formTextPwReset', 17.693721771240234],
        ['pw-change-formAttrsPwReset', 2.9368114471435547],
        ['pw-change-headingsPwReset', 16.34722137451172],
        ['pw-change-layoutPwReset', 14.592164039611816],
        ['pw-change-pageRecovery', -6.0039381980896],
        ['pw-change-formTextRecovery', 0.043760962784290314],
        ['pw-change-formAttrsRecovery', -5.9754791259765625],
        ['pw-change-headingsRecovery', -5.897618293762207],
        ['pw-change-layoutRecovery', -4.063847541809082],
        ['pw-change-identifierRecovery', -6.00450325012207],
        ['pw-change-submitRecovery', -0.6033651232719421],
        ['pw-change-formTextMFA', -0.10808666050434113],
        ['pw-change-formAttrsMFA', -5.974828720092773],
        ['pw-change-headingsMFA', -6.051753997802734],
        ['pw-change-layoutMFA', -5.966926574707031],
        ['pw-change-buttonVerify', -6.044244766235352],
        ['pw-change-inputsMFA', -6.016839027404785],
        ['pw-change-inputsOTP', -6.035905361175537],
        ['pw-change-linkOTPOutlier', -6.400092601776123],
        ['pw-change-headingsNewsletter', -6.0136847496032715],
        ['pw-change-oneVisibleField', -6.076004981994629],
        ['pw-change-buttonMultiStep', -6.111546516418457],
        ['pw-change-buttonMultiAction', -5.998467445373535],
        ['pw-change-headingsMultiStep', -6.023197174072266],
    ],
    bias: -3.5281283855438232,
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
        ['register-fieldsCount', 9.438254356384277],
        ['register-inputCount', 10.330304145812988],
        ['register-fieldsetCount', 10.972139358520508],
        ['register-textCount', 11.681722640991211],
        ['register-textareaCount', -22.44536018371582],
        ['register-selectCount', -5.227101802825928],
        ['register-checkboxCount', -6.346003532409668],
        ['register-radioCount', 0.05699848383665085],
        ['register-identifierCount', 2.8890607357025146],
        ['register-usernameCount', -22.665714263916016],
        ['register-emailCount', 12.80218505859375],
        ['register-submitCount', -12.539932250976562],
        ['register-hasTels', 2.0148861408233643],
        ['register-hasOAuth', 5.754682540893555],
        ['register-hasCaptchas', 5.433660507202148],
        ['register-hasFiles', -0.04059775918722153],
        ['register-hasDate', 10.723905563354492],
        ['register-hasNumber', 34.14412307739258],
        ['register-noPasswordFields', -6.002114295959473],
        ['register-onePasswordField', -6.789099216461182],
        ['register-twoPasswordFields', 7.623166561126709],
        ['register-threePasswordFields', -6.086333751678467],
        ['register-oneIdentifierField', 2.6358232498168945],
        ['register-twoIdentifierFields', 2.2521562576293945],
        ['register-threeIdentifierFields', 10.86526107788086],
        ['register-hasHiddenIdentifier', -0.09200466424226761],
        ['register-hasHiddenPassword', -12.669090270996094],
        ['register-autofocusedIsPassword', -7.301788806915283],
        ['register-visibleRatio', 0.7618468999862671],
        ['register-inputRatio', -12.008463859558105],
        ['register-hiddenRatio', -4.412231922149658],
        ['register-identifierRatio', 18.67403221130371],
        ['register-emailRatio', 0.10155288875102997],
        ['register-usernameRatio', -7.804047107696533],
        ['register-passwordRatio', -1.1697255373001099],
        ['register-requiredRatio', -9.521324157714844],
        ['register-patternRatio', -15.656109809875488],
        ['register-minMaxLengthRatio', -18.630823135375977],
        ['register-pageLogin', -4.145945072174072],
        ['register-formTextLogin', -6.160155296325684],
        ['register-formAttrsLogin', -1.2841200828552246],
        ['register-headingsLogin', -0.672917366027832],
        ['register-layoutLogin', 19.05252456665039],
        ['register-rememberMeCheckbox', -6.3010735511779785],
        ['register-troubleLink', -23.618179321289062],
        ['register-submitLogin', -9.67280387878418],
        ['register-pageRegister', 5.313475608825684],
        ['register-formTextRegister', 0.021521948277950287],
        ['register-formAttrsRegister', 28.199501037597656],
        ['register-headingsRegister', 3.8343498706817627],
        ['register-layoutRegister', -8.078020095825195],
        ['register-checkboxTOS', 0.059706173837184906],
        ['register-submitRegister', 23.89838218688965],
        ['register-pagePwReset', -5.963364124298096],
        ['register-formTextPwReset', -6.020134449005127],
        ['register-formAttrsPwReset', -5.9410786628723145],
        ['register-headingsPwReset', -12.032096862792969],
        ['register-layoutPwReset', -11.825098991394043],
        ['register-pageRecovery', -19.614316940307617],
        ['register-formTextRecovery', 0.09018666297197342],
        ['register-formAttrsRecovery', -7.144595623016357],
        ['register-headingsRecovery', -0.28872406482696533],
        ['register-layoutRecovery', -12.100800514221191],
        ['register-identifierRecovery', -31.186702728271484],
        ['register-submitRecovery', -17.060680389404297],
        ['register-formTextMFA', -0.10297087579965591],
        ['register-formAttrsMFA', 5.259770393371582],
        ['register-headingsMFA', -10.390105247497559],
        ['register-layoutMFA', -13.838970184326172],
        ['register-buttonVerify', 8.037731170654297],
        ['register-inputsMFA', -4.010171413421631],
        ['register-inputsOTP', -12.195074081420898],
        ['register-linkOTPOutlier', -5.628168106079102],
        ['register-headingsNewsletter', -7.420834064483643],
        ['register-oneVisibleField', -10.461089134216309],
        ['register-buttonMultiStep', 11.891680717468262],
        ['register-buttonMultiAction', -2.837503671646118],
        ['register-headingsMultiStep', 19.459489822387695],
    ],
    bias: -5.379794597625732,
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
        ['recovery-fieldsCount', -2.9405534267425537],
        ['recovery-inputCount', -2.243340253829956],
        ['recovery-fieldsetCount', -2.183206081390381],
        ['recovery-textCount', 9.682144165039062],
        ['recovery-textareaCount', -24.685428619384766],
        ['recovery-selectCount', -8.243937492370605],
        ['recovery-checkboxCount', -6.016936302185059],
        ['recovery-radioCount', 0.07688339799642563],
        ['recovery-identifierCount', 2.5208730697631836],
        ['recovery-usernameCount', 10.680610656738281],
        ['recovery-emailCount', -0.4249347448348999],
        ['recovery-submitCount', -5.4118523597717285],
        ['recovery-hasTels', -9.898186683654785],
        ['recovery-hasOAuth', -3.9123387336730957],
        ['recovery-hasCaptchas', -3.2933011054992676],
        ['recovery-hasFiles', 0.04432932287454605],
        ['recovery-hasDate', -6.110820293426514],
        ['recovery-hasNumber', -5.95827054977417],
        ['recovery-noPasswordFields', 0.2173871099948883],
        ['recovery-onePasswordField', -14.327947616577148],
        ['recovery-twoPasswordFields', -9.467996597290039],
        ['recovery-threePasswordFields', -14.831707954406738],
        ['recovery-oneIdentifierField', 3.6514179706573486],
        ['recovery-twoIdentifierFields', -0.23877593874931335],
        ['recovery-threeIdentifierFields', -6.029486179351807],
        ['recovery-hasHiddenIdentifier', -3.4269938468933105],
        ['recovery-hasHiddenPassword', -18.80599594116211],
        ['recovery-autofocusedIsPassword', -5.914571762084961],
        ['recovery-visibleRatio', 1.9486106634140015],
        ['recovery-inputRatio', -5.0625176429748535],
        ['recovery-hiddenRatio', 0.5067421197891235],
        ['recovery-identifierRatio', 2.2220957279205322],
        ['recovery-emailRatio', 1.6793322563171387],
        ['recovery-usernameRatio', 9.244185447692871],
        ['recovery-passwordRatio', -13.089155197143555],
        ['recovery-requiredRatio', 1.5133206844329834],
        ['recovery-patternRatio', -1.282844066619873],
        ['recovery-minMaxLengthRatio', 5.394626140594482],
        ['recovery-pageLogin', -8.089275360107422],
        ['recovery-formTextLogin', -6.047667980194092],
        ['recovery-formAttrsLogin', 5.795441150665283],
        ['recovery-headingsLogin', -19.913433074951172],
        ['recovery-layoutLogin', -2.8049795627593994],
        ['recovery-rememberMeCheckbox', -5.998303413391113],
        ['recovery-troubleLink', 1.7807966470718384],
        ['recovery-submitLogin', -7.339327812194824],
        ['recovery-pageRegister', -1.9377411603927612],
        ['recovery-formTextRegister', 0.08429572731256485],
        ['recovery-formAttrsRegister', -8.231781005859375],
        ['recovery-headingsRegister', -6.747753143310547],
        ['recovery-layoutRegister', -6.99625301361084],
        ['recovery-checkboxTOS', -0.051726408302783966],
        ['recovery-submitRegister', -6.2342448234558105],
        ['recovery-pagePwReset', 7.383573532104492],
        ['recovery-formTextPwReset', -6.135994911193848],
        ['recovery-formAttrsPwReset', 10.271495819091797],
        ['recovery-headingsPwReset', 14.910969734191895],
        ['recovery-layoutPwReset', 4.578812599182129],
        ['recovery-pageRecovery', 13.333727836608887],
        ['recovery-formTextRecovery', -0.06471794843673706],
        ['recovery-formAttrsRecovery', 20.94319725036621],
        ['recovery-headingsRecovery', -1.4329043626785278],
        ['recovery-layoutRecovery', -6.751126289367676],
        ['recovery-identifierRecovery', 17.882299423217773],
        ['recovery-submitRecovery', 11.790162086486816],
        ['recovery-formTextMFA', -0.07883197069168091],
        ['recovery-formAttrsMFA', 4.7730631828308105],
        ['recovery-headingsMFA', -1.342726707458496],
        ['recovery-layoutMFA', -7.28527307510376],
        ['recovery-buttonVerify', -3.8464205265045166],
        ['recovery-inputsMFA', 0.9507074356079102],
        ['recovery-inputsOTP', -5.553194522857666],
        ['recovery-linkOTPOutlier', -1.4805771112442017],
        ['recovery-headingsNewsletter', -15.99544906616211],
        ['recovery-oneVisibleField', -5.203470706939697],
        ['recovery-buttonMultiStep', 3.318575859069824],
        ['recovery-buttonMultiAction', -6.022982120513916],
        ['recovery-headingsMultiStep', -6.025537967681885],
    ],
    bias: -6.926464557647705,
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
        ['mfa-fieldsCount', -4.539331436157227],
        ['mfa-inputCount', -5.059589862823486],
        ['mfa-fieldsetCount', -0.12547625601291656],
        ['mfa-textCount', -1.9349454641342163],
        ['mfa-textareaCount', -7.3625335693359375],
        ['mfa-selectCount', -6.2105021476745605],
        ['mfa-checkboxCount', -6.038778781890869],
        ['mfa-radioCount', -0.039869070053100586],
        ['mfa-identifierCount', -4.290181636810303],
        ['mfa-usernameCount', -4.9170050621032715],
        ['mfa-emailCount', -6.63780403137207],
        ['mfa-submitCount', -0.6798579096794128],
        ['mfa-hasTels', 10.272148132324219],
        ['mfa-hasOAuth', -8.409685134887695],
        ['mfa-hasCaptchas', -0.9115985035896301],
        ['mfa-hasFiles', -0.046966224908828735],
        ['mfa-hasDate', -6.01749849319458],
        ['mfa-hasNumber', 7.391261577606201],
        ['mfa-noPasswordFields', 0.07293441891670227],
        ['mfa-onePasswordField', -6.074141502380371],
        ['mfa-twoPasswordFields', -7.839426040649414],
        ['mfa-threePasswordFields', -5.92291259765625],
        ['mfa-oneIdentifierField', -4.425500392913818],
        ['mfa-twoIdentifierFields', -5.893605709075928],
        ['mfa-threeIdentifierFields', -5.978785991668701],
        ['mfa-hasHiddenIdentifier', -5.550883769989014],
        ['mfa-hasHiddenPassword', -1.9843393564224243],
        ['mfa-autofocusedIsPassword', 7.623835563659668],
        ['mfa-visibleRatio', -4.58774471282959],
        ['mfa-inputRatio', -2.610536813735962],
        ['mfa-hiddenRatio', 2.059119701385498],
        ['mfa-identifierRatio', -4.2597270011901855],
        ['mfa-emailRatio', -6.533461093902588],
        ['mfa-usernameRatio', -5.784867763519287],
        ['mfa-passwordRatio', -5.156617641448975],
        ['mfa-requiredRatio', 8.311806678771973],
        ['mfa-patternRatio', 9.370572090148926],
        ['mfa-minMaxLengthRatio', 3.46939754486084],
        ['mfa-pageLogin', 4.785914421081543],
        ['mfa-formTextLogin', -6.111766815185547],
        ['mfa-formAttrsLogin', -3.0909624099731445],
        ['mfa-headingsLogin', -4.568158149719238],
        ['mfa-layoutLogin', -0.7017754316329956],
        ['mfa-rememberMeCheckbox', -5.938552379608154],
        ['mfa-troubleLink', -6.214419364929199],
        ['mfa-submitLogin', 0.39479777216911316],
        ['mfa-pageRegister', -4.415045738220215],
        ['mfa-formTextRegister', 0.05792268365621567],
        ['mfa-formAttrsRegister', -4.139343738555908],
        ['mfa-headingsRegister', -7.9315056800842285],
        ['mfa-layoutRegister', -6.229476451873779],
        ['mfa-checkboxTOS', -0.07338355481624603],
        ['mfa-submitRegister', -6.115019798278809],
        ['mfa-pagePwReset', -6.0555243492126465],
        ['mfa-formTextPwReset', -5.89309024810791],
        ['mfa-formAttrsPwReset', -5.993531227111816],
        ['mfa-headingsPwReset', -5.911097526550293],
        ['mfa-layoutPwReset', -6.084188938140869],
        ['mfa-pageRecovery', 0.15993306040763855],
        ['mfa-formTextRecovery', 0.04169734567403793],
        ['mfa-formAttrsRecovery', -6.341919422149658],
        ['mfa-headingsRecovery', -7.988831996917725],
        ['mfa-layoutRecovery', 2.4529471397399902],
        ['mfa-identifierRecovery', -5.922887325286865],
        ['mfa-submitRecovery', -2.973836660385132],
        ['mfa-formTextMFA', -0.0610225535929203],
        ['mfa-formAttrsMFA', 13.7570161819458],
        ['mfa-headingsMFA', 16.31675148010254],
        ['mfa-layoutMFA', 11.586752891540527],
        ['mfa-buttonVerify', 15.093023300170898],
        ['mfa-inputsMFA', 15.447569847106934],
        ['mfa-inputsOTP', 17.080181121826172],
        ['mfa-linkOTPOutlier', -3.258864402770996],
        ['mfa-headingsNewsletter', -5.990882873535156],
        ['mfa-oneVisibleField', -1.1666284799575806],
        ['mfa-buttonMultiStep', 2.2050223350524902],
        ['mfa-buttonMultiAction', -6.07522439956665],
        ['mfa-headingsMultiStep', 7.188854217529297],
    ],
    bias: -3.065471887588501,
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
        ['pw-loginScore', 10.782410621643066],
        ['pw-registerScore', -12.196676254272461],
        ['pw-pwChangeScore', -6.040682792663574],
        ['pw-exotic', -13.301301956176758],
        ['pw-dangling', 0.12068569660186768],
        ['pw-autocompleteNew', -2.9750664234161377],
        ['pw-autocompleteCurrent', 6.1675567626953125],
        ['pw-autocompleteOff', -1.0336623191833496],
        ['pw-isOnlyPassword', 3.683098077774048],
        ['pw-prevPwField', -0.5056232213973999],
        ['pw-nextPwField', -2.6465952396392822],
        ['pw-attrCreate', -0.6301606893539429],
        ['pw-attrCurrent', 3.097977638244629],
        ['pw-attrConfirm', -6.864377021789551],
        ['pw-attrReset', 0.0859803557395935],
        ['pw-textCreate', -1.625271201133728],
        ['pw-textCurrent', 6.203790187835693],
        ['pw-textConfirm', -7.0765838623046875],
        ['pw-textReset', -0.08421862125396729],
        ['pw-labelCreate', -7.248685359954834],
        ['pw-labelCurrent', 10.091724395751953],
        ['pw-labelConfirm', -7.107346534729004],
        ['pw-labelReset', -0.09382370114326477],
        ['pw-prevPwCreate', -7.109406471252441],
        ['pw-prevPwCurrent', -8.56035327911377],
        ['pw-prevPwConfirm', 0.13068386912345886],
        ['pw-passwordOutlier', -7.185699939727783],
        ['pw-nextPwCreate', 8.749356269836426],
        ['pw-nextPwCurrent', -0.10854876786470413],
        ['pw-nextPwConfirm', -7.306922912597656],
    ],
    bias: -0.205228790640831,
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
        ['pw[new]-loginScore', -12.593257904052734],
        ['pw[new]-registerScore', 14.168601989746094],
        ['pw[new]-pwChangeScore', 5.631491661071777],
        ['pw[new]-exotic', 14.874369621276855],
        ['pw[new]-dangling', -0.02235330641269684],
        ['pw[new]-autocompleteNew', 2.541187047958374],
        ['pw[new]-autocompleteCurrent', -6.25451135635376],
        ['pw[new]-autocompleteOff', -0.09180954843759537],
        ['pw[new]-isOnlyPassword', -2.713167667388916],
        ['pw[new]-prevPwField', -1.179762363433838],
        ['pw[new]-nextPwField', 10.053295135498047],
        ['pw[new]-attrCreate', 1.9618778228759766],
        ['pw[new]-attrCurrent', -3.0586299896240234],
        ['pw[new]-attrConfirm', 6.710993766784668],
        ['pw[new]-attrReset', 0.05226823687553406],
        ['pw[new]-textCreate', 0.32763049006462097],
        ['pw[new]-textCurrent', -6.039341926574707],
        ['pw[new]-textConfirm', -15.654413223266602],
        ['pw[new]-textReset', 0.1583811342716217],
        ['pw[new]-labelCreate', 7.479848384857178],
        ['pw[new]-labelCurrent', -11.17652416229248],
        ['pw[new]-labelConfirm', 7.052827835083008],
        ['pw[new]-labelReset', 0.08608624339103699],
        ['pw[new]-prevPwCreate', 10.309117317199707],
        ['pw[new]-prevPwCurrent', 8.563519477844238],
        ['pw[new]-prevPwConfirm', 0.12776625156402588],
        ['pw[new]-passwordOutlier', -28.74970817565918],
        ['pw[new]-nextPwCreate', -11.803205490112305],
        ['pw[new]-nextPwCurrent', -0.17232415080070496],
        ['pw[new]-nextPwConfirm', 7.310812473297119],
    ],
    bias: -2.295736789703369,
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
        ['username-autocompleteUsername', 9.56478214263916],
        ['username-autocompleteNickname', 0.0932513177394867],
        ['username-autocompleteEmail', -7.6476287841796875],
        ['username-autocompleteOff', -0.37375423312187195],
        ['username-attrUsername', 18.673538208007812],
        ['username-textUsername', 9.279563903808594],
        ['username-labelUsername', 18.122573852539062],
        ['username-outlierUsername', -7.2184529304504395],
        ['username-loginUsername', 18.550113677978516],
    ],
    bias: -9.783464431762695,
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
        ['username[hidden]-loginScore', 11.424420356750488],
        ['username[hidden]-registerScore', 11.374221801757812],
        ['username[hidden]-exotic', -7.834935665130615],
        ['username[hidden]-dangling', 0.22229772806167603],
        ['username[hidden]-attrUsername', 6.798530578613281],
        ['username[hidden]-attrEmail', 6.059094429016113],
        ['username[hidden]-usernameName', 6.1315155029296875],
        ['username[hidden]-autocompleteUsername', -0.008010344579815865],
        ['username[hidden]-hiddenEmailValue', 8.039149284362793],
        ['username[hidden]-hiddenTelValue', 3.0412585735321045],
        ['username[hidden]-hiddenUsernameValue', 0.7911052703857422],
    ],
    bias: -22.281816482543945,
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
        ['email-autocompleteUsername', 1.1545031070709229],
        ['email-autocompleteNickname', 0.044844597578048706],
        ['email-autocompleteEmail', 5.78518533706665],
        ['email-typeEmail', 14.699714660644531],
        ['email-exactAttrEmail', 13.062962532043457],
        ['email-attrEmail', 2.1272242069244385],
        ['email-textEmail', 14.292635917663574],
        ['email-labelEmail', 16.628326416015625],
        ['email-placeholderEmail', 15.091784477233887],
        ['email-attrSearch', -13.365391731262207],
        ['email-textSearch', -13.78404426574707],
    ],
    bias: -9.054418563842773,
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
        ['otp-mfaScore', 17.570371627807617],
        ['otp-exotic', -7.202295303344727],
        ['otp-dangling', 0.15221154689788818],
        ['otp-linkOTPOutlier', -12.957178115844727],
        ['otp-hasCheckboxes', -0.124177947640419],
        ['otp-hidden', -10.21710205078125],
        ['otp-required', 0.8250524997711182],
        ['otp-nameMatch', -8.476486206054688],
        ['otp-idMatch', 6.138744831085205],
        ['otp-numericMode', 11.27781867980957],
        ['otp-autofocused', 6.795456886291504],
        ['otp-tabIndex1', -0.6812265515327454],
        ['otp-patternOTP', 2.6737730503082275],
        ['otp-maxLength1', 7.001105308532715],
        ['otp-maxLength5', -7.224270820617676],
        ['otp-minLength6', 17.555896759033203],
        ['otp-maxLength6', 6.5471391677856445],
        ['otp-maxLength20', -5.549862384796143],
        ['otp-autocompleteOTC', -0.0006696879863739014],
        ['otp-autocompleteOff', -5.922266960144043],
        ['otp-prevAligned', 0.20227113366127014],
        ['otp-prevArea', 3.185774326324463],
        ['otp-nextAligned', 0.005369991064071655],
        ['otp-nextArea', 3.4421980381011963],
        ['otp-attrMFA', 6.941361427307129],
        ['otp-attrOTP', 10.424448013305664],
        ['otp-attrOutlier', -8.047451972961426],
        ['otp-textMFA', 7.028902530670166],
        ['otp-textOTP', 9.071043968200684],
        ['otp-labelMFA', 13.25387954711914],
        ['otp-labelOTP', -6.860494136810303],
        ['otp-labelOutlier', -6.362516403198242],
        ['otp-wrapperOTP', 5.692819118499756],
        ['otp-wrapperOutlier', -6.207284450531006],
        ['otp-emailOutlierCount', -20.781003952026367],
    ],
    bias: -12.870606422424316,
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
