import { clusters as clusters$1, dom, out, rule, ruleset, score, type, utils } from './fathom.js';
import * as fathomWeb from './fathom.js';

export { fathomWeb as fathom };

const MAX_FORM_FIELD_WALK_UP = 3;

const MAX_FORM_HEADING_WALK_UP = 3;

const MAX_HEADING_HORIZONTAL_DIST = 75;

const MAX_HEADING_VERTICAL_DIST = 150;

const MIN_AREA_SUBMIT_BTN = 3500;

const MIN_FIELD_HEIGHT = 15;

const MIN_FIELD_WIDTH = 30;

const MAX_INPUTS_PER_FORM = 40;

const MAX_FIELDS_PER_FORM = 60;

const MAX_HIDDEN_FIELD_VALUE_LENGTH = 320;

const HIDDEN_FIELD_IGNORE_VALUES = ['0', '1', 'true', 'false'];

const OTP_PATTERNS = [
    [1, 'd*'],
    [6, 'd{6}'],
    [1, '[0-9]*'],
    [6, '[0-9]{6}'],
    [5, '([0-9a-fA-F]{5}-?[0-9a-fA-F]{5})'],
];

const VALID_INPUT_TYPES = ['text', 'email', 'number', 'tel', 'password', 'hidden', 'search'];

const sanitizeString = (str) =>
    str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\d\[\]]/g, '');

const LOGIN_RE =
    /(?:(?:n(?:ouvelleses|uevase|ewses)s|iniciarses|connex)io|anmeldedate|sign[io])n|in(?:iciarsessao|troduce)|a(?:uthenticate|nmeld(?:ung|en))|authentifier|s(?:econnect|identifi)er|novasessao|(?:introduci|conecta|entr[ae])r|prihlasit|connect|acceder|login/i;

const REGISTER_RE =
    /kontoerstellen|cr(?:ea(?:teaccount|rcuenta)|iarconta)|(?:nouveaucompt|creeruncompt|s?inscrir|unirs)e|re(?:gist(?:r(?:ieren|arse|ar)|er)|joindre)|nuevacuenta|neueskonto|getstarted|newaccount|novaconta|(?:com(?:mence|eca)|(?:empez|junt)a)r|signup|join/i;

const RECOVERY_RE =
    /(?:wiederherstell|zurucksetz)en|re(?:(?:initialis|stablec)er|(?:defini|staur[ae])r|c(?:uper[ae]|ove)r|set)|problem|(?:troubl|restor|aid)e|a[jy]uda|h(?:ilfe|elp)/i;

const MULTI_STEP_RE = /p(?:rogres(?:s(?:ion|o)|o)|aso)|fortschritt|progress|s(?:chritt|t(?:age|ep))|etap[ae]|phase/i;

const TROUBLE_RE =
    /schwierigkeit|(?:difficult|troubl|oubli|hilf)e|i(?:nciden(?:cia|t)|ssue)|vergessen|esquecido|olvidado|needhelp|questao|problem|forgot|ayuda/i;

const PASSWORD_RE =
    /p(?:hrasesecrete|ass(?:(?:phras|cod)e|wor[dt]))|(?:c(?:havesecret|lavesecret|ontrasen)|deseguranc)a|(?:(?:zugangs|secret)cod|clesecret)e|codesecret|motdepasse|geheimnis|secret|heslo|senha|key/i;

const PASSWORD_OUTLIER_RE = /socialsecurity|nationalid/i;

const USERNAME_RE =
    /identi(?:fiant|ty)|u(?:tilisateur|s(?:ername|uario))|(?:identifi|benutz)er|(?:screen|nick)name|nutzername|(?:anmeld|handl)e|pseudo/i;

const USERNAME_ATTR_RE = /identifyemail|(?:custom|us)erid|loginname|a(?:cc(?:ountid|t)|ppleid)|loginid/i;

const USERNAME_OUTLIER_RE =
    /(?:nom(?:defamill|br)|tit[lr])e|(?:primeiro|sobre)nome|(?:company|middle|nach|vor)name|firstname|apellido|lastname|prenom/i;

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

const HIDDEN_ATTR_RE = /s(?:creenreade)?ronly|(?:move)?offscreen|(?:displaynon|a11yhid)e|hidden/i;

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

const OTP_OUTLIER_ATTR_RE = /(?:phone(?:verification)?|email|tel)pin|email|sms/i;

const NEWSLETTER_RE = /newsletter|b(?:ul|o)letin|mailing/i;

const NEWSLETTER_ATTR_RE = /subscription|mailinglist|newsletter|emailform/i;

const EMAIL_VALUE_RE = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,5}$/;

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

const matchRecovery = orRe([RECOVERY_RE, TROUBLE_RE]);

const matchMultiStep = test(MULTI_STEP_RE);

const matchStepAction = orRe([STEP_ACTION_RE, MULTI_STEP_RE]);

const matchOAuth = test(OAUTH_ATTR_RE);

const matchSearchAction = test(SEARCH_ACTION_RE);

const matchPasswordReset = and([andRe([PASSWORD_RE, RESET_ACTION_RE]), notRe(CONFIRM_ACTION_RE)]);

const matchPasswordResetAttr = and([matchPasswordReset, notRe(CONFIRM_ACTION_ATTR_END_RE)]);

const matchPasswordCreate = and([andRe([PASSWORD_RE, CREATE_ACTION_RE]), notRe(CONFIRM_ACTION_RE)]);

const matchPasswordCreateAttr = and([matchPasswordCreate, notRe(CONFIRM_ACTION_ATTR_END_RE)]);

const matchPasswordConfirm = andRe([PASSWORD_RE, CONFIRM_ACTION_RE]);

const matchPasswordConfirmAttr = and([andRe([PASSWORD_RE, CONFIRM_ACTION_RE]), notRe(CREATE_ACTION_ATTR_END_RE)]);

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

const FORM_CLUSTER_ATTR = 'data-protonpass-form';

const kFieldSelector = 'input, select, textarea';

const kEmailSelector = 'input[name="email"], input[id="email"]';

const kPasswordSelector = 'input[type="password"], input[type="text"][id="password"]';

const kCaptchaSelector = `[class*="captcha"], [id*="captcha"], [name*="captcha"]`;

const kSocialSelector = `[class*=social], [aria-label*=with]`;

const kEditorSelector = 'div[class*="editor" i], div[id*="editor" i], div[class*="composer" i], div[id*="composer" i]';

const kDomGroupSelector = `[role="dialog"], [role="tabpanel"], [role="group"], [role="form"], [id*="modal"], [class*="modal"], header, section, nav, footer, aside`;

const kUsernameSelector = [
    'input[type="login"]',
    'input[type="username"]',
    'input[type="search"][name="loginName"]',
    'input[type="password"][name="userID"]',
    'input[type="password"][name="USERNAME"]',
    'input[name="account"]',
    'input[name="quickconnect-id"]',
].join(',');

const kHiddenUsernameSelector = [
    '[name*="user" i]',
    '[id*="user" i]',
    '[name*="login" i]',
    '[id*="login" i]',
    '[name*="email" i]',
    '[id*="email" i]',
    '[name*="identifier" i]',
    '[id*="identifier" i]',
].join(',');

const kHeadingSelector = [
    ...[1, 2, 3, 4, 5].flatMap((level) => [`h${level}, [aria-level="${level}"]`]),
    '[role="heading"]',
    '[class*="title"]',
    '[class*="header"]',
    '[name="title"]',
    'div[style*="font-size: 2"]',
    'div[style*="font-size: 3"]',
].join(',');

const kButtonSubmitSelector = [
    'input[type="submit"]',
    'button[id*="password" i]',
    'button[type="submit"]',
    'button[type="button"]',
    'button[name="submit"]',
    'a[role="submit"]',
    'div[role="button"]',
    'div[role="submit"]',
].join(',');

const kLayoutSelector = `div, section, aside, main, nav`;

const kAnchorLinkSelector = `a, span[role="button"]`;

const formCandidateSelector = `form, [${FORM_CLUSTER_ATTR}]`;

const inputCandidateSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="checkbox"])';

const buttonSelector = `button:not([type]), a[role="button"], ${kButtonSubmitSelector}`;

const otpSelector = '[type="tel"], [type="number"], [type="text"], input:not([type])';

const cacheContext = {};

const getVisibilityCache = (key) => {
    var _a;
    return (cacheContext[key] = (_a = cacheContext[key]) !== null && _a !== void 0 ? _a : new WeakMap());
};

const clearVisibilityCache = () => Object.keys(cacheContext).forEach((key) => delete cacheContext[key]);

const withCache = (cacheMap) => (els, visible) => {
    els.forEach((el) => cacheMap.set(el, visible));
    return visible;
};

const isVisible = (fnodeOrElement, options) => {
    const element = utils.toDomElement(fnodeOrElement);
    const seen = [element];
    const cache = getVisibilityCache(JSON.stringify(options));
    if (cache.has(element)) return cache.get(element);
    const check = () => {
        const elementWindow = utils.windowForElement(element);
        const elementRect = element.getBoundingClientRect();
        const elementStyle = elementWindow.getComputedStyle(element);
        if (elementRect.width === 0 && elementRect.height === 0 && elementStyle.overflow !== 'hidden') return false;
        if (elementStyle.visibility === 'hidden') return false;
        if (elementRect.x + elementRect.width < 0 || elementRect.y + elementRect.height < 0) return false;
        for (const ancestor of utils.ancestors(element)) {
            if (ancestor === elementWindow.document.documentElement) continue;
            if (cache === null || cache === void 0 ? void 0 : cache.has(ancestor)) {
                const cachedVisible = cache.get(ancestor);
                if (!cachedVisible) return false;
                else continue;
            }
            const isElement = ancestor === element;
            if (!isElement) seen.push(ancestor);
            const style = isElement ? elementStyle : elementWindow.getComputedStyle(ancestor);
            if (style.opacity === '0' && options.opacity) return false;
            if (style.display === 'contents') continue;
            const rect = isElement ? elementRect : ancestor.getBoundingClientRect();
            if ((rect.width <= 1 || rect.height <= 1) && style.overflow === 'hidden') return false;
            if (
                style.position === 'fixed' &&
                (rect.x >= elementWindow.innerWidth || rect.y >= elementWindow.innerHeight)
            )
                return false;
        }
        return true;
    };
    const visible = check();
    return withCache(cache)(seen, visible);
};

const quickVisibilityCheck = (el, options) => {
    const cache = getVisibilityCache(JSON.stringify(options));
    if (cache.has(el)) return cache.get(el);
    const check = () => {
        const rect = el.getClientRects();
        if (rect.length === 0) return false;
        const classList = Array.from(el.classList).map(sanitizeString);
        if (any(matchHidden)(classList)) return false;
        const { visibility, display, maxHeight } = getComputedStyle(el);
        if (visibility === 'hidden' || display === 'none' || maxHeight === '0px') return false;
        if (el.offsetHeight === 0 || el.offsetWidth === 0) return false;
        if (el.offsetHeight < options.minHeight || el.offsetWidth < options.minWidth) return false;
        return true;
    };
    return withCache(cache)([el], check());
};

const isVisibleEl = (el) =>
    quickVisibilityCheck(el, {
        minHeight: 0,
        minWidth: 0,
    });

const isVisibleForm = (form) => {
    if (
        form.tagName !== 'FORM' &&
        !isVisible(form, {
            opacity: true,
        })
    )
        return false;
    const inputs = Array.from(form.querySelectorAll(inputCandidateSelector)).filter((field) => !field.disabled);
    return (
        inputs.length > 0 &&
        inputs.some((input) =>
            isVisible(input, {
                opacity: false,
            })
        )
    );
};

const isVisibleField = (field) => {
    if (field instanceof HTMLInputElement) {
        const { type, disabled, readOnly } = field;
        if (type === 'hidden' || disabled || readOnly || field.getAttribute('aria-hidden') === 'true') return false;
    }
    return quickVisibilityCheck(field, {
        minHeight: MIN_FIELD_HEIGHT,
        minWidth: MIN_FIELD_WIDTH,
    });
};

const closest = (start, match) => {
    const parent = start.parentElement;
    if (!parent) return null;
    return match(parent) ? parent : closest(parent, match);
};

const walkUpWhile = (start, maxIterations) => (check) => {
    const parent = start.parentElement;
    if (maxIterations === 0 || parent === null) return start;
    return check(parent, start) ? walkUpWhile(parent, maxIterations - 1)(check) : start;
};

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

const getSiblingWith = (el, match) => {
    const prevEl = el.previousElementSibling;
    if (prevEl === null) return null;
    if (match(prevEl)) return prevEl;
    return getSiblingWith(prevEl, match);
};

const getLabelFor = (el) => {
    var _a;
    const forId = (_a = el.getAttribute('id')) !== null && _a !== void 0 ? _a : el.getAttribute('name');
    const label = document.querySelector(`label[for="${forId}"]`);
    if (label) return label;
    const closest = el.closest('label');
    if (closest) return closest;
    const siblingLabel = getSiblingWith(el, (sibling) => sibling.tagName === 'LABEL');
    if (siblingLabel) return siblingLabel;
    const parent = getNthParent(el)(2);
    const parentLabels = parent.querySelectorAll('label');
    if (parentLabels.length === 1) return parentLabels[0];
    const textNodeAbove = getSiblingWith(el, (el) => el instanceof HTMLElement && el.innerText.trim().length > 0);
    if (textNodeAbove) return textNodeAbove;
    return null;
};

const getRectCenter = (rect) => ({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
});

const getRectMinDistance = (rectA, rectB) => {
    const centerA = getRectCenter(rectA);
    const centerB = getRectCenter(rectB);
    const dx = Math.abs(centerA.x - centerB.x) - (rectA.width + rectB.width) / 2;
    const dy = Math.abs(centerA.y - centerB.y) - (rectA.height + rectB.height) / 2;
    return {
        dx,
        dy,
    };
};

const pruneNested = (els) =>
    els.reduce((acc, el) => {
        for (let i = 0; i <= acc.length - 1; i++) {
            if (acc[i] === el) continue;
            if (acc[i].contains(el)) return acc;
            if (el.contains(acc[i])) {
                acc[i] = el;
                return acc;
            }
        }
        acc.push(el);
        return acc;
    }, []);

const getCommonAncestor = (elementA, elementB) => {
    if (elementA === elementB) return elementA;
    return elementA.contains(elementB)
        ? elementA
        : elementA.parentElement
        ? getCommonAncestor(elementA.parentElement, elementB)
        : elementA;
};

const findStackedParent = (el, cache = [], maxIterations) => {
    if (cache.some((group) => group.contains(el))) return null;
    const parent = el.parentElement;
    if (maxIterations === 0 || !parent) return null;
    const computedStyle = getComputedStyle(parent);
    const position = computedStyle.getPropertyValue('position');
    if (position === 'fixed' || position === 'absolute') {
        cache.push(parent);
        return parent;
    }
    return findStackedParent(parent, cache, maxIterations - 1);
};

const findStackedParents = (els, maxIterations) => {
    const cache = [];
    return els.map((input) => findStackedParent(input, cache, maxIterations)).filter((el) => Boolean(el));
};

const isCluster = (el) => el.getAttribute(FORM_CLUSTER_ATTR) !== null;

const flagCluster = (el) => el.setAttribute(FORM_CLUSTER_ATTR, '');

const isIgnored = (el) => el.__PP_SKIP__ === true;

const getIgnoredParent = (el) => (el ? closest(el, isIgnored) : null);

const flagAsIgnored = (el) => (el.__PP_SKIP__ = true);

const removeIgnoredFlag = (el) => delete el.__PP_SKIP__;

const flagSubtreeAsIgnored = (el) => {
    flagAsIgnored(el);
    el.querySelectorAll(kFieldSelector).forEach(flagAsIgnored);
};

const isProcessed = (el) => el.__PP_SEEN__ === true;

const flagAsProcessed = (el) => (el.__PP_SEEN__ = true);

const removeProcessedFlag = (el) => delete el.__PP_SEEN__;

const isPrediction = (el) => el.__PP_TYPE__ !== undefined;

const removePredictionFlag = (el) => delete el.__PP_TYPE__;

const getParentFormPrediction = (el) => (el ? closest(el, isPrediction) : null);

const setPrediction = (_el, type) => {
    const el = _el;
    const currentType = el.__PP_TYPE__;
    el.__PP_TYPE__ = currentType ? Array.from(new Set(currentType.split(',').concat(type))).join(',') : type;
};

const isPredictedType = (type) => (fnode) => {
    const types = fnode.element.__PP_TYPE__;
    return types ? types.split(',').includes(type) : false;
};

const isClassifiable = (form) => !(isPrediction(form) || isIgnored(form));

const removeClassifierFlags = (el) => {
    removeProcessedFlag(el);
    removePredictionFlag(el);
    removeIgnoredFlag(el);
    el.querySelectorAll(kFieldSelector).forEach(removeClassifierFlags);
};

var FormType;

(function (FormType) {
    FormType['LOGIN'] = 'login';
    FormType['REGISTER'] = 'register';
    FormType['PASSWORD_CHANGE'] = 'password-change';
    FormType['RECOVERY'] = 'recovery';
    FormType['MFA'] = 'mfa';
    FormType['NOOP'] = 'noop';
})(FormType || (FormType = {}));

var FieldType;

(function (FieldType) {
    FieldType['EMAIL'] = 'email';
    FieldType['USERNAME'] = 'username';
    FieldType['USERNAME_HIDDEN'] = 'username-hidden';
    FieldType['PASSWORD_CURRENT'] = 'password';
    FieldType['PASSWORD_NEW'] = 'new-password';
    FieldType['OTP'] = 'otp';
})(FieldType || (FieldType = {}));

const formTypes = Object.values(FormType);

const fieldTypes = Object.values(FieldType);

const TOLERANCE_LEVEL = 0.5;

const boolInt = (val) => Number(val);

const safeInt = (val, fallback = 0) => (Number.isFinite(val) ? val : fallback);

const throughEffect = (effect) => (fnode) => {
    effect(fnode);
    return fnode;
};

const typeEffect = (type) =>
    throughEffect((fnode) => {
        flagAsProcessed(fnode.element);
        setPrediction(fnode.element, type);
    });

const processFormEffect = throughEffect((fnode) => flagAsProcessed(fnode.element));

const processFieldEffect = throughEffect((fnode) => {
    const { visible, type } = fnode.noteFor('field');
    if (visible || type === 'hidden') flagAsProcessed(fnode.element);
});

const featureScore = (noteFor, key) =>
    score((fnode) => {
        const features = fnode.noteFor(noteFor);
        if (Array.isArray(key)) return key.map((k) => features[k]).reduce((a, b) => a * b);
        return features[key];
    });

const getParentFormFnode = (fieldFnode) => {
    const field = fieldFnode.element;
    const ruleset = fieldFnode._ruleset;
    const parentForms = ruleset.get(type('form'));
    const form = parentForms.find(({ element }) => element.contains(field));
    if (form) return form;
    const preDetectedForm = getParentFormPrediction(field);
    if (preDetectedForm) return ruleset.get(preDetectedForm);
    return null;
};

const belongsToType = (type) => (fnode) => fnode.scoreFor(type) > TOLERANCE_LEVEL;

const getFormTypeScore = (formFnode, type) => {
    if (!formFnode) return 0;
    if (isPredictedType(type)(formFnode)) return 1;
    return formFnode === null || formFnode === void 0 ? void 0 : formFnode.scoreFor(type);
};

const outRuleWithCache = (typeIn, typeOut) => [
    rule(type(typeIn).when(isPredictedType(typeOut)), type(`${typeOut}-cache`), {}),
    rule(type(`${typeOut}-cache`), type('cache'), {}),
    rule(type(typeOut).when(belongsToType(typeOut)), type(`${typeOut}-result`), {}),
    rule(type(`${typeOut}-cache`), type(`${typeOut}-result`), {}),
    rule(type(`${typeOut}-result`), out(typeOut).through(typeEffect(typeOut)), {}),
];

const combineFeatures = (arr1, arr2) => arr1.flatMap((item1) => arr2.map((item2) => [item1, item2]));

const withFnodeEl = (fn) => (fnode) => fn(fnode.element);

const getFormClassification = (formFnode) => {
    const login = getFormTypeScore(formFnode, FormType.LOGIN) > 0.5;
    const register = getFormTypeScore(formFnode, FormType.REGISTER) > 0.5;
    const pwChange = getFormTypeScore(formFnode, FormType.PASSWORD_CHANGE) > 0.5;
    const recovery = getFormTypeScore(formFnode, FormType.RECOVERY) > 0.5;
    const mfa = getFormTypeScore(formFnode, FormType.MFA) > 0.5;
    const detectionResults = [login, register, pwChange, recovery, mfa];
    const noop = detectionResults.every((detected) => !detected);
    return {
        login,
        register,
        pwChange,
        recovery,
        mfa,
        noop,
    };
};

const isNoopForm = (formFnode) => getFormClassification(formFnode).noop;

const getFormParent = (form) =>
    walkUpWhile(form, MAX_FORM_FIELD_WALK_UP)((el) => el.querySelectorAll(formCandidateSelector).length <= 1);

const createInputIterator = (form) => {
    const formEls = Array.from(form.querySelectorAll(inputCandidateSelector)).filter(isVisibleField);
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

const selectFormCandidates = (root = document) => {
    const candidates = Array.from(root.querySelectorAll(formCandidateSelector));
    return candidates.filter((form) => !isIgnored(form));
};

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

const FIELD_ATTRIBUTES = [EL_ATTRIBUTES, 'name', 'inputmode'].flat();

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

const getAllNodeHaystacks = (node) => [getNodeText(node), getNodeAttributes(node)];

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
    const isHiddenInput = field instanceof HTMLInputElement && field.type === 'hidden';
    const checkLabel = field instanceof HTMLInputElement && ['text', 'email', 'tel', 'password'].includes(field.type);
    const fieldAttrs = getFieldAttributes(field);
    const fieldText = isHiddenInput ? '' : getNodeText(field);
    const labelText = checkLabel && !isHiddenInput ? getFieldLabelText(field) : '';
    return {
        fieldAttrs,
        fieldText,
        labelText,
    };
};

const getAllFieldHaystacks = (field) => {
    const { fieldAttrs, fieldText, labelText } = getFieldHaystacks(field);
    return [fieldText, labelText, ...fieldAttrs];
};

const getNearestHeadingsText = (el) => {
    var _a, _b;
    const originRect = el.getBoundingClientRect();
    const parent = walkUpWhile(
        el,
        MAX_FORM_HEADING_WALK_UP
    )((parentEl, candidate) => {
        if (parentEl === document.body) return false;
        if (candidate.matches(kDomGroupSelector)) return false;
        return true;
    });
    const headings = Array.from(parent.querySelectorAll(kHeadingSelector)).filter((heading) => {
        if (el.contains(heading)) return true;
        const headingRect = heading.getBoundingClientRect();
        const { dx, dy } = getRectMinDistance(originRect, headingRect);
        return dx < MAX_HEADING_HORIZONTAL_DIST && dy < MAX_HEADING_VERTICAL_DIST;
    });
    const textAbove =
        (_b =
            (_a =
                headings.length === 0
                    ? getSiblingWith(el, (el) => el instanceof HTMLElement && el.innerText.trim().length > 0)
                    : null) === null || _a === void 0
                ? void 0
                : _a.innerText) !== null && _b !== void 0
            ? _b
            : '';
    return sanitizeString(textAbove + headings.map((el) => el.innerText).join(''));
};

const isActiveFieldFNode = (fnode) => {
    const { visible, readonly, disabled } = fnode.noteFor('field');
    return visible && !readonly && !disabled;
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

const fType = (fnode, types) => types.includes(fnode.element.type);

const fMatch = (fnode, selector) => fnode.element.matches(selector);

const fMode = (fnode, inputMode) => fnode.element.inputMode === inputMode;

const fActive = (fn) => (fnode) => fn(fnode) && isActiveFieldFNode(fnode);

const maybeEmail = fActive((fnode) => fType(fnode, ['email', 'text']) || fMode(fnode, 'email'));

const maybePassword = fActive((fnode) => fMatch(fnode, kPasswordSelector));

const maybeOTP = fActive((fnode) => fMatch(fnode, otpSelector));

const maybeUsername = fActive(
    (fnode) => (!fMode(fnode, 'email') && fType(fnode, ['text', 'tel'])) || fMatch(fnode, kUsernameSelector)
);

const maybeHiddenUsername = (fnode) => fType(fnode, ['email', 'text', 'hidden']) && !isActiveFieldFNode(fnode);

const isUsernameCandidate = (el) => !el.matches('input[type="email"]') && any(matchUsername)(getAllFieldHaystacks(el));

const isEmailCandidate = (el) => el.matches('input[type="email"]') || any(matchEmail)(getAllFieldHaystacks(el));

const isOAuthCandidate = (el) => any(matchOAuth)(getAllFieldHaystacks(el));

const isSubmitBtnCandidate = (btn) => {
    if (btn.getAttribute('type') === 'submit') return true;
    if (btn.innerText.trim().length <= 1) return false;
    const height = btn.offsetHeight;
    const width = btn.offsetWidth;
    return height * width > MIN_AREA_SUBMIT_BTN;
};

const isProcessableField = (input) =>
    !isProcessed(input) &&
    isVisibleField(input) &&
    isVisible(input, {
        opacity: false,
    });

const isClassifiableField = (fnode) => isClassifiable(fnode.element) && getParentFormFnode(fnode) !== null;

const selectInputCandidates = (target = document) =>
    Array.from(target.querySelectorAll(inputCandidateSelector)).filter(isClassifiable);

const { linearScale: linearScale$1 } = utils;

const getFormFeatures = (fnode) => {
    const form = fnode.element;
    const parent = getFormParent(form);
    const fields = Array.from(form.querySelectorAll(kFieldSelector));
    const visibleFields = fields.filter(isVisibleField);
    const doc = form.ownerDocument;
    const inputs = fields.filter((el) => el.matches('input:not([type="submit"])'));
    const visibleInputs = visibleFields.filter((el) => el.matches('input:not([type="submit"])'));
    const fieldsets = form.querySelectorAll('fieldset');
    const textareas = visibleFields.filter((el) => el.matches('textarea'));
    const selects = visibleFields.filter((el, idx, fields) => {
        var _a;
        return (
            el.matches('select') &&
            ((_a = fields === null || fields === void 0 ? void 0 : fields[idx + 1]) === null || _a === void 0
                ? void 0
                : _a.type) !== 'tel'
        );
    });
    const optionsCount = selects.reduce((total, el) => total + el.querySelectorAll('option').length, 0);
    const submits = visibleFields.filter((el) => el.matches('[type="submit"]'));
    const hidden = inputs.filter((el) => el.matches('[type="hidden"]'));
    const texts = visibleInputs.filter((el) => el.matches('[type="text"]'));
    const usernames = inputs.filter(isUsernameCandidate);
    const emails = inputs.filter(isEmailCandidate);
    const tels = inputs.filter((el) => el.matches('[type="tel"]'));
    const pws = inputs.filter((el) => el.matches(kPasswordSelector));
    const [identifiers, hiddenIdentifiers] = splitFieldsByVisibility(uniqueNodes(usernames, emails, tels));
    const [passwords, hiddenPasswords] = splitFieldsByVisibility(pws);
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
    const captchas = parent.querySelectorAll(kCaptchaSelector);
    const socialEls = Array.from(parent.querySelectorAll(kSocialSelector));
    const btns = Array.from(form.querySelectorAll(buttonSelector));
    const submitBtns = btns.filter(isSubmitBtnCandidate);
    const btnCandidates = submits.concat(submitBtns);
    const anchors = Array.from(form.querySelectorAll(kAnchorLinkSelector)).filter(isVisibleEl);
    const oauths = socialEls.concat(submitBtns).filter(isOAuthCandidate);
    const layouts = Array.from(form.querySelectorAll(kLayoutSelector));
    const autofocusedIsIdentifier = Boolean(autofocused && identifiers.includes(autofocused));
    const autofocusedIsPassword = Boolean(autofocused && passwords.includes(autofocused));
    const pageDescriptionText = getPageDescriptionText(doc);
    const nearestHeadingsText = getNearestHeadingsText(form);
    const formTextAttrText = getFormText(form);
    const formAttributes = getFormAttributes(form);
    const pwHaystack = pws.flatMap(getAllFieldHaystacks);
    const identifierHaystack = identifiers.flatMap(getAllFieldHaystacks);
    const submitBtnHaystack = btnCandidates.flatMap(getAllFieldHaystacks);
    const checkboxesHaystack = checkboxes.flatMap(getAllFieldHaystacks);
    const anchorsHaystack = anchors.flatMap(getAllNodeHaystacks);
    const mfaInputsHaystack = mfas.flatMap(getAllFieldHaystacks);
    const layoutHaystack = layouts.map(getNodeAttributes);
    const outlierHaystack = [formTextAttrText, formTextAttrText, nearestHeadingsText];
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
    const TOSRef = any(matchTOS)(checkboxesHaystack.concat(anchorsHaystack));
    const submitRegister = any(matchRegister)(submitBtnHaystack);
    const pwNewRegister = any(matchPasswordCreateAttr)(pwHaystack);
    const pwConfirmRegister = any(matchPasswordConfirmAttr)(pwHaystack);
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
    const identifierRecovery = any(matchRecovery)(identifierHaystack);
    const formTextMFA = matchMfa(formTextAttrText);
    const formAttrsMFA = any(matchMfaAttr)(formAttributes);
    const headingsMFA = matchMfa(nearestHeadingsText);
    const layoutMFA = any(matchMfa)(layoutHaystack);
    const buttonVerify = any(matchMfaAction)(submitBtnHaystack);
    const inputsMFA = any(matchMfaAttr)(mfaInputsHaystack);
    const inputsOTP = any(matchOtpAttr)(mfaInputsHaystack);
    const linkOTPOutlier = any(matchOtpOutlier)(anchorsHaystack.concat(submitBtnHaystack));
    const newsletterForm = any(matchNewsletter)(outlierHaystack);
    const searchForm = any(matchSearchAction)(outlierHaystack);
    const buttonMultiStep = any(matchStepAction)(submitBtnHaystack);
    const headingsMultiStep = matchMultiStep(nearestHeadingsText);
    return {
        fieldsCount: linearScale$1(visibleFields.length, 1, 5),
        inputCount: linearScale$1(visibleInputs.length, 1, 5),
        fieldsetCount: linearScale$1(fieldsets.length, 1, 5),
        textCount: linearScale$1(texts.length, 0, 3),
        textareaCount: linearScale$1(textareas.length, 0, 2),
        selectCount: linearScale$1(selects.length, 0, 2),
        optionsCount: linearScale$1(optionsCount, 0, 5),
        checkboxCount: linearScale$1(checkboxes.length, 0, 2),
        radioCount: linearScale$1(radios.length, 0, 5),
        identifierCount: linearScale$1(identifiers.length, 0, 2),
        hiddenIdentifierCount: linearScale$1(hiddenIdentifiers.length, 0, 2),
        hiddenCount: linearScale$1(hidden.length, 0, 5),
        passwordCount: linearScale$1(passwords.length, 0, 2),
        hiddenPasswordCount: linearScale$1(hiddenPasswords.length, 0, 2),
        usernameCount: linearScale$1(usernames.length, 0, 2),
        emailCount: linearScale$1(emails.length, 0, 2),
        submitCount: linearScale$1(submits.length, 0, 2),
        hasTels: boolInt(tels.length > 0),
        hasOAuth: boolInt(oauths.length > 0),
        hasCaptchas: boolInt(captchas.length > 0),
        hasFiles: boolInt(files.length > 0),
        hasDate: boolInt(dates.length > 0),
        hasNumber: boolInt(numbers.length > 0),
        oneVisibleField: boolInt(visibleInputs.length === 1),
        twoVisibleFields: boolInt(visibleInputs.length === 2),
        threeOrMoreVisibleFields: boolInt(visibleInputs.length >= 3),
        noPasswords: boolInt(passwords.length === 0),
        onePassword: boolInt(passwords.length === 1),
        twoPasswords: boolInt(passwords.length === 2),
        threeOrMorePasswords: boolInt(passwords.length >= 3),
        noIdentifiers: boolInt(identifiers.length === 0),
        oneIdentifier: boolInt(identifiers.length === 1),
        twoIdentifiers: boolInt(identifiers.length === 2),
        threeOrMoreIdentifiers: boolInt(identifiers.length >= 3),
        autofocusedIsIdentifier: boolInt(autofocusedIsIdentifier),
        autofocusedIsPassword: boolInt(autofocusedIsPassword),
        inputRatio: safeInt(inputs.length / fields.length),
        hiddenRatio: safeInt(hidden.length / fields.length),
        visibleRatio: safeInt(visibleInputs.length / fields.length),
        identifierRatio: safeInt(identifiers.length / visibleFields.length),
        emailRatio: safeInt(emails.length / visibleFields.length),
        usernameRatio: safeInt(usernames.length / visibleFields.length),
        passwordRatio: safeInt(passwords.length / visibleFields.length),
        checkboxRatio: safeInt(checkboxes.length / visibleFields.length),
        requiredRatio: safeInt(required.length / visibleFields.length),
        patternRatio: safeInt(patterns.length / visibleFields.length),
        minMaxLengthRatio: safeInt(minMaxLengths.length / visibleFields.length),
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
        pwNewRegister: boolInt(pwNewRegister),
        pwConfirmRegister: boolInt(pwConfirmRegister),
        submitRegister: boolInt(submitRegister),
        TOSRef: boolInt(TOSRef),
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
        newsletterForm: boolInt(newsletterForm),
        searchForm: boolInt(searchForm),
        multiStepForm: boolInt(buttonMultiStep || headingsMultiStep),
        multiAuthForm: boolInt(submitRegister && submitLogin),
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
    'optionsCount',
    'radioCount',
    'identifierCount',
    'hiddenIdentifierCount',
    'usernameCount',
    'emailCount',
    'hiddenCount',
    'hiddenPasswordCount',
    'submitCount',
    'hasTels',
    'hasOAuth',
    'hasCaptchas',
    'hasFiles',
    'hasDate',
    'hasNumber',
    'oneVisibleField',
    'twoVisibleFields',
    'threeOrMoreVisibleFields',
    'noPasswords',
    'onePassword',
    'twoPasswords',
    'threeOrMorePasswords',
    'noIdentifiers',
    'oneIdentifier',
    'twoIdentifiers',
    'threeOrMoreIdentifiers',
    'autofocusedIsIdentifier',
    'autofocusedIsPassword',
    'visibleRatio',
    'inputRatio',
    'hiddenRatio',
    'identifierRatio',
    'emailRatio',
    'usernameRatio',
    'passwordRatio',
    'requiredRatio',
    'checkboxRatio',
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
    'pwNewRegister',
    'pwConfirmRegister',
    'submitRegister',
    'TOSRef',
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
    'newsletterForm',
    'searchForm',
    'multiStepForm',
    'multiAuthForm',
];

const results$a = {
    coeffs: [
        ['login-fieldsCount', 10.281940460205078],
        ['login-inputCount', 4.495297908782959],
        ['login-fieldsetCount', -9.419057846069336],
        ['login-textCount', 1.313175916671753],
        ['login-textareaCount', -6.078880310058594],
        ['login-selectCount', -6.156236171722412],
        ['login-optionsCount', -6.020345687866211],
        ['login-radioCount', -5.9554362297058105],
        ['login-identifierCount', -2.889153242111206],
        ['login-hiddenIdentifierCount', 8.567635536193848],
        ['login-usernameCount', 8.723286628723145],
        ['login-emailCount', -8.789202690124512],
        ['login-hiddenCount', 13.80506420135498],
        ['login-hiddenPasswordCount', 17.68339729309082],
        ['login-submitCount', -0.3967853784561157],
        ['login-hasTels', -4.759357929229736],
        ['login-hasOAuth', 4.977762699127197],
        ['login-hasCaptchas', -2.326605796813965],
        ['login-hasFiles', -6.030536651611328],
        ['login-hasDate', -12.042951583862305],
        ['login-hasNumber', -6.081310272216797],
        ['login-oneVisibleField', 8.925634384155273],
        ['login-twoVisibleFields', 5.320556640625],
        ['login-threeOrMoreVisibleFields', -9.270559310913086],
        ['login-noPasswords', -17.743749618530273],
        ['login-onePassword', 11.039867401123047],
        ['login-twoPasswords', -15.154229164123535],
        ['login-threeOrMorePasswords', -6.160081386566162],
        ['login-noIdentifiers', -12.613479614257812],
        ['login-oneIdentifier', -3.0901336669921875],
        ['login-twoIdentifiers', 0.2294725477695465],
        ['login-threeOrMoreIdentifiers', -7.313997268676758],
        ['login-autofocusedIsIdentifier', 11.861833572387695],
        ['login-autofocusedIsPassword', 39.055320739746094],
        ['login-visibleRatio', 2.3000988960266113],
        ['login-inputRatio', 3.6795170307159424],
        ['login-hiddenRatio', -22.86846351623535],
        ['login-identifierRatio', 15.334659576416016],
        ['login-emailRatio', -1.3742127418518066],
        ['login-usernameRatio', -20.692886352539062],
        ['login-passwordRatio', -5.553801536560059],
        ['login-requiredRatio', 2.7559244632720947],
        ['login-checkboxRatio', 56.78965377807617],
        ['login-pageLogin', 13.927964210510254],
        ['login-formTextLogin', 8.39407730102539],
        ['login-formAttrsLogin', 4.591018199920654],
        ['login-headingsLogin', 15.740533828735352],
        ['login-layoutLogin', 4.9119977951049805],
        ['login-rememberMeCheckbox', 7.743219375610352],
        ['login-troubleLink', 19.482458114624023],
        ['login-submitLogin', 11.539225578308105],
        ['login-pageRegister', -12.612848281860352],
        ['login-formTextRegister', 0.08013574033975601],
        ['login-formAttrsRegister', -15.045478820800781],
        ['login-headingsRegister', -14.033061027526855],
        ['login-layoutRegister', -4.077324867248535],
        ['login-pwNewRegister', -27.663772583007812],
        ['login-pwConfirmRegister', -18.372894287109375],
        ['login-submitRegister', -18.738677978515625],
        ['login-TOSRef', 3.0513646602630615],
        ['login-pagePwReset', -6.121976852416992],
        ['login-formTextPwReset', -6.076430320739746],
        ['login-formAttrsPwReset', -7.773496150970459],
        ['login-headingsPwReset', -11.713652610778809],
        ['login-layoutPwReset', 2.10801100730896],
        ['login-pageRecovery', -2.1968162059783936],
        ['login-formTextRecovery', 0.02466670423746109],
        ['login-formAttrsRecovery', -39.62900161743164],
        ['login-headingsRecovery', -4.673851490020752],
        ['login-layoutRecovery', -0.4867432415485382],
        ['login-identifierRecovery', 0.8753186464309692],
        ['login-submitRecovery', -8.377469062805176],
        ['login-formTextMFA', -0.0051373764872550964],
        ['login-formAttrsMFA', -30.593318939208984],
        ['login-headingsMFA', -17.62803077697754],
        ['login-layoutMFA', -4.655709266662598],
        ['login-buttonVerify', -6.62949275970459],
        ['login-inputsMFA', -20.19489288330078],
        ['login-inputsOTP', -32.185462951660156],
        ['login-linkOTPOutlier', -3.8857266902923584],
        ['login-newsletterForm', -8.004288673400879],
        ['login-searchForm', -7.370604991912842],
        ['login-multiStepForm', 3.738436460494995],
        ['login-multiAuthForm', 15.353819847106934],
        ['login-visibleRatio,fieldsCount', -7.147522449493408],
        ['login-visibleRatio,identifierCount', -15.44670581817627],
        ['login-visibleRatio,passwordCount', 11.621954917907715],
        ['login-visibleRatio,hiddenIdentifierCount', -14.806196212768555],
        ['login-visibleRatio,hiddenPasswordCount', 31.261964797973633],
        ['login-identifierRatio,fieldsCount', -27.431827545166016],
        ['login-identifierRatio,identifierCount', 15.470547676086426],
        ['login-identifierRatio,passwordCount', -12.783434867858887],
        ['login-identifierRatio,hiddenIdentifierCount', 7.890777111053467],
        ['login-identifierRatio,hiddenPasswordCount', -11.522420883178711],
        ['login-passwordRatio,fieldsCount', 7.83971643447876],
        ['login-passwordRatio,identifierCount', -12.399267196655273],
        ['login-passwordRatio,passwordCount', -8.254180908203125],
        ['login-passwordRatio,hiddenIdentifierCount', 31.89457893371582],
        ['login-passwordRatio,hiddenPasswordCount', 3.883559226989746],
        ['login-requiredRatio,fieldsCount', 7.86624002456665],
        ['login-requiredRatio,identifierCount', -21.282522201538086],
        ['login-requiredRatio,passwordCount', 16.560365676879883],
        ['login-requiredRatio,hiddenIdentifierCount', -28.510496139526367],
        ['login-requiredRatio,hiddenPasswordCount', 18.21741485595703],
    ],
    bias: -6.205162525177002,
    cutoff: 0.49,
};

const FORM_COMBINED_FEATURES = [
    ...FORM_FEATURES,
    ...combineFeatures(
        ['visibleRatio', 'identifierRatio', 'passwordRatio', 'requiredRatio'],
        ['fieldsCount', 'identifierCount', 'passwordCount', 'hiddenIdentifierCount', 'hiddenPasswordCount']
    ),
];

const login = {
    name: FormType.LOGIN,
    coeffs: FORM_COMBINED_FEATURES.map((feat) => {
        var _a, _b;
        return [
            `login-${feat}`,
            (_b =
                (_a = results$a.coeffs.find(([feature]) => feature === `login-${feat}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$a.bias,
    cutoff: results$a.cutoff,
    getRules: () => [
        rule(type('form'), type(FormType.LOGIN), {}),
        ...FORM_COMBINED_FEATURES.map((feat) =>
            rule(type(FormType.LOGIN), featureScore('form', feat), {
                name: `login-${feat}`,
            })
        ),
        ...outRuleWithCache('form-candidate', FormType.LOGIN),
    ],
};

const results$9 = {
    coeffs: [
        ['pw-change-fieldsCount', -2.7494688034057617],
        ['pw-change-inputCount', -2.361482620239258],
        ['pw-change-fieldsetCount', -6.00706148147583],
        ['pw-change-textCount', -6.060689449310303],
        ['pw-change-textareaCount', -6.016555309295654],
        ['pw-change-selectCount', -6.009349822998047],
        ['pw-change-optionsCount', -6.098063945770264],
        ['pw-change-radioCount', -6.062087535858154],
        ['pw-change-identifierCount', -5.488682746887207],
        ['pw-change-hiddenIdentifierCount', -3.6318421363830566],
        ['pw-change-usernameCount', -6.072628021240234],
        ['pw-change-emailCount', -4.674100875854492],
        ['pw-change-hiddenCount', -4.124039173126221],
        ['pw-change-hiddenPasswordCount', -6.097792148590088],
        ['pw-change-submitCount', -3.712773561477661],
        ['pw-change-hasTels', -5.996026039123535],
        ['pw-change-hasOAuth', -5.940362930297852],
        ['pw-change-hasCaptchas', -6.109816074371338],
        ['pw-change-hasFiles', -5.91138219833374],
        ['pw-change-hasDate', -6.040260314941406],
        ['pw-change-hasNumber', -6.107475280761719],
        ['pw-change-oneVisibleField', -6.075191020965576],
        ['pw-change-twoVisibleFields', -3.4423763751983643],
        ['pw-change-threeOrMoreVisibleFields', -0.3013835549354553],
        ['pw-change-noPasswords', -5.996437072753906],
        ['pw-change-onePassword', -5.911196708679199],
        ['pw-change-twoPasswords', 9.587265968322754],
        ['pw-change-threeOrMorePasswords', 21.48872947692871],
        ['pw-change-noIdentifiers', -1.1704716682434082],
        ['pw-change-oneIdentifier', -5.919676780700684],
        ['pw-change-twoIdentifiers', -6.037460803985596],
        ['pw-change-threeOrMoreIdentifiers', 5.527417182922363],
        ['pw-change-autofocusedIsIdentifier', -6.070947647094727],
        ['pw-change-autofocusedIsPassword', 19.614280700683594],
        ['pw-change-visibleRatio', -3.962277412414551],
        ['pw-change-inputRatio', -4.061270236968994],
        ['pw-change-hiddenRatio', -4.700681686401367],
        ['pw-change-identifierRatio', -5.738019943237305],
        ['pw-change-emailRatio', -5.348212718963623],
        ['pw-change-usernameRatio', -6.074145793914795],
        ['pw-change-passwordRatio', 2.0438923835754395],
        ['pw-change-requiredRatio', -4.437033653259277],
        ['pw-change-checkboxRatio', -5.998251438140869],
        ['pw-change-pageLogin', -6.622378826141357],
        ['pw-change-formTextLogin', -5.988846778869629],
        ['pw-change-formAttrsLogin', -6.053709030151367],
        ['pw-change-headingsLogin', -6.0492448806762695],
        ['pw-change-layoutLogin', -6.091543197631836],
        ['pw-change-rememberMeCheckbox', -6.073766708374023],
        ['pw-change-troubleLink', -3.631777763366699],
        ['pw-change-submitLogin', -6.008042335510254],
        ['pw-change-pageRegister', -6.091817378997803],
        ['pw-change-formTextRegister', 0.06552907079458237],
        ['pw-change-formAttrsRegister', -5.9438395500183105],
        ['pw-change-headingsRegister', -6.1038126945495605],
        ['pw-change-layoutRegister', -6.008273124694824],
        ['pw-change-pwNewRegister', 11.502280235290527],
        ['pw-change-pwConfirmRegister', 8.689380645751953],
        ['pw-change-submitRegister', -7.455827236175537],
        ['pw-change-TOSRef', -7.2145161628723145],
        ['pw-change-pagePwReset', 15.063043594360352],
        ['pw-change-formTextPwReset', 22.239526748657227],
        ['pw-change-formAttrsPwReset', 2.128528594970703],
        ['pw-change-headingsPwReset', 17.194448471069336],
        ['pw-change-layoutPwReset', 17.08711051940918],
        ['pw-change-pageRecovery', -5.934609889984131],
        ['pw-change-formTextRecovery', -0.03902352228760719],
        ['pw-change-formAttrsRecovery', -5.971250057220459],
        ['pw-change-headingsRecovery', -5.957339286804199],
        ['pw-change-layoutRecovery', -3.798733711242676],
        ['pw-change-identifierRecovery', -6.086173057556152],
        ['pw-change-submitRecovery', 0.05023133009672165],
        ['pw-change-formTextMFA', -0.023767419159412384],
        ['pw-change-formAttrsMFA', -6.021453380584717],
        ['pw-change-headingsMFA', -6.044894695281982],
        ['pw-change-layoutMFA', -5.958799362182617],
        ['pw-change-buttonVerify', -5.927059650421143],
        ['pw-change-inputsMFA', -5.963044166564941],
        ['pw-change-inputsOTP', -6.008167266845703],
        ['pw-change-linkOTPOutlier', -6.0265212059021],
        ['pw-change-newsletterForm', -6.0115814208984375],
        ['pw-change-searchForm', -5.993492126464844],
        ['pw-change-multiStepForm', -6.062385082244873],
        ['pw-change-multiAuthForm', -5.956419467926025],
        ['pw-change-visibleRatio,fieldsCount', -2.6268386840820312],
        ['pw-change-visibleRatio,identifierCount', -5.696330547332764],
        ['pw-change-visibleRatio,passwordCount', 2.7552099227905273],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -2.8015027046203613],
        ['pw-change-visibleRatio,hiddenPasswordCount', -5.939085960388184],
        ['pw-change-identifierRatio,fieldsCount', -4.421377182006836],
        ['pw-change-identifierRatio,identifierCount', -5.38013219833374],
        ['pw-change-identifierRatio,passwordCount', -4.431553363800049],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -5.9823994636535645],
        ['pw-change-identifierRatio,hiddenPasswordCount', -5.957791805267334],
        ['pw-change-passwordRatio,fieldsCount', 4.8794426918029785],
        ['pw-change-passwordRatio,identifierCount', -4.331790447235107],
        ['pw-change-passwordRatio,passwordCount', 7.352481365203857],
        ['pw-change-passwordRatio,hiddenIdentifierCount', -0.5714568495750427],
        ['pw-change-passwordRatio,hiddenPasswordCount', -6.057157516479492],
        ['pw-change-requiredRatio,fieldsCount', -4.470158100128174],
        ['pw-change-requiredRatio,identifierCount', -6.0662946701049805],
        ['pw-change-requiredRatio,passwordCount', -0.23945266008377075],
        ['pw-change-requiredRatio,hiddenIdentifierCount', 3.702942132949829],
        ['pw-change-requiredRatio,hiddenPasswordCount', -5.927608013153076],
    ],
    bias: -4.255237102508545,
    cutoff: 1,
};

const passwordChange = {
    name: FormType.PASSWORD_CHANGE,
    coeffs: FORM_COMBINED_FEATURES.map((key) => {
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
        rule(type('form'), type(FormType.PASSWORD_CHANGE), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type(FormType.PASSWORD_CHANGE), featureScore('form', key), {
                name: `pw-change-${key}`,
            })
        ),
        ...outRuleWithCache('form-candidate', FormType.PASSWORD_CHANGE),
    ],
};

const results$8 = {
    coeffs: [
        ['register-fieldsCount', 1.7081316709518433],
        ['register-inputCount', 5.445847511291504],
        ['register-fieldsetCount', 4.720628261566162],
        ['register-textCount', 4.333401203155518],
        ['register-textareaCount', -1.0252082347869873],
        ['register-selectCount', -13.039253234863281],
        ['register-optionsCount', 8.750110626220703],
        ['register-radioCount', 8.465249061584473],
        ['register-identifierCount', 7.556044101715088],
        ['register-hiddenIdentifierCount', 28.30471420288086],
        ['register-usernameCount', -8.96547794342041],
        ['register-emailCount', 0.3914388418197632],
        ['register-hiddenCount', -17.046018600463867],
        ['register-hiddenPasswordCount', 14.144415855407715],
        ['register-submitCount', 4.150322437286377],
        ['register-hasTels', -0.19854861497879028],
        ['register-hasOAuth', 5.395517349243164],
        ['register-hasCaptchas', 4.619261264801025],
        ['register-hasFiles', -6.088930130004883],
        ['register-hasDate', 17.220277786254883],
        ['register-hasNumber', 17.82880401611328],
        ['register-oneVisibleField', 0.39447250962257385],
        ['register-twoVisibleFields', 3.0496726036071777],
        ['register-threeOrMoreVisibleFields', -1.181364893913269],
        ['register-noPasswords', -4.50567626953125],
        ['register-onePassword', 1.9991048574447632],
        ['register-twoPasswords', 17.47783851623535],
        ['register-threeOrMorePasswords', -13.254918098449707],
        ['register-noIdentifiers', -9.166597366333008],
        ['register-oneIdentifier', 1.2733794450759888],
        ['register-twoIdentifiers', 14.461280822753906],
        ['register-threeOrMoreIdentifiers', 23.59315299987793],
        ['register-autofocusedIsIdentifier', 5.380165100097656],
        ['register-autofocusedIsPassword', 9.806367874145508],
        ['register-visibleRatio', -3.392340898513794],
        ['register-inputRatio', -6.402334690093994],
        ['register-hiddenRatio', 1.3898476362228394],
        ['register-identifierRatio', 1.4731719493865967],
        ['register-emailRatio', -2.674802541732788],
        ['register-usernameRatio', -4.582566261291504],
        ['register-passwordRatio', 1.5247384309768677],
        ['register-requiredRatio', -13.35191535949707],
        ['register-checkboxRatio', -39.70021438598633],
        ['register-pageLogin', -7.7242231369018555],
        ['register-formTextLogin', -6.082503318786621],
        ['register-formAttrsLogin', -6.540432453155518],
        ['register-headingsLogin', -15.847450256347656],
        ['register-layoutLogin', 11.929388046264648],
        ['register-rememberMeCheckbox', -13.317244529724121],
        ['register-troubleLink', -11.1639404296875],
        ['register-submitLogin', -10.457748413085938],
        ['register-pageRegister', 3.2635374069213867],
        ['register-formTextRegister', -0.03944449499249458],
        ['register-formAttrsRegister', 9.222463607788086],
        ['register-headingsRegister', 16.86965560913086],
        ['register-layoutRegister', -10.606130599975586],
        ['register-pwNewRegister', 12.254098892211914],
        ['register-pwConfirmRegister', 0.7535836696624756],
        ['register-submitRegister', 27.64754295349121],
        ['register-TOSRef', 15.137409210205078],
        ['register-pagePwReset', -7.498521327972412],
        ['register-formTextPwReset', -10.98878288269043],
        ['register-formAttrsPwReset', -6.155905723571777],
        ['register-headingsPwReset', -26.670209884643555],
        ['register-layoutPwReset', -48.3482666015625],
        ['register-pageRecovery', -8.845760345458984],
        ['register-formTextRecovery', 0.09396561235189438],
        ['register-formAttrsRecovery', -7.777119159698486],
        ['register-headingsRecovery', -16.76322364807129],
        ['register-layoutRecovery', -3.1146740913391113],
        ['register-identifierRecovery', -16.856861114501953],
        ['register-submitRecovery', -32.65952682495117],
        ['register-formTextMFA', -0.08682683855295181],
        ['register-formAttrsMFA', -10.590898513793945],
        ['register-headingsMFA', -14.24187183380127],
        ['register-layoutMFA', 3.134754180908203],
        ['register-buttonVerify', -5.137732982635498],
        ['register-inputsMFA', -4.5803375244140625],
        ['register-inputsOTP', -23.833772659301758],
        ['register-linkOTPOutlier', 1.1417629718780518],
        ['register-newsletterForm', -27.387924194335938],
        ['register-searchForm', -7.1573262214660645],
        ['register-multiStepForm', 8.949834823608398],
        ['register-multiAuthForm', -14.5880126953125],
        ['register-visibleRatio,fieldsCount', -5.859263896942139],
        ['register-visibleRatio,identifierCount', 4.9013214111328125],
        ['register-visibleRatio,passwordCount', 12.715662956237793],
        ['register-visibleRatio,hiddenIdentifierCount', -4.220526218414307],
        ['register-visibleRatio,hiddenPasswordCount', -33.97904968261719],
        ['register-identifierRatio,fieldsCount', 6.354767322540283],
        ['register-identifierRatio,identifierCount', 3.1382360458374023],
        ['register-identifierRatio,passwordCount', -35.726287841796875],
        ['register-identifierRatio,hiddenIdentifierCount', -43.61851119995117],
        ['register-identifierRatio,hiddenPasswordCount', 16.28394889831543],
        ['register-passwordRatio,fieldsCount', -0.5351467728614807],
        ['register-passwordRatio,identifierCount', -39.59172058105469],
        ['register-passwordRatio,passwordCount', -7.423892498016357],
        ['register-passwordRatio,hiddenIdentifierCount', 3.368546724319458],
        ['register-passwordRatio,hiddenPasswordCount', -13.979362487792969],
        ['register-requiredRatio,fieldsCount', -1.1085882186889648],
        ['register-requiredRatio,identifierCount', -3.811516284942627],
        ['register-requiredRatio,passwordCount', -10.615630149841309],
        ['register-requiredRatio,hiddenIdentifierCount', 22.50450325012207],
        ['register-requiredRatio,hiddenPasswordCount', -7.314464569091797],
    ],
    bias: 0.19865666329860687,
    cutoff: 0.47,
};

const register = {
    name: FormType.REGISTER,
    coeffs: FORM_COMBINED_FEATURES.map((key) => {
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
        rule(type('form'), type(FormType.REGISTER), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type(FormType.REGISTER), featureScore('form', key), {
                name: `register-${key}`,
            })
        ),
        ...outRuleWithCache('form-candidate', FormType.REGISTER),
    ],
};

const results$7 = {
    coeffs: [
        ['recovery-fieldsCount', 3.1706464290618896],
        ['recovery-inputCount', 2.1765682697296143],
        ['recovery-fieldsetCount', -9.496301651000977],
        ['recovery-textCount', -2.8987069129943848],
        ['recovery-textareaCount', -18.594593048095703],
        ['recovery-selectCount', -13.674627304077148],
        ['recovery-optionsCount', -17.33370590209961],
        ['recovery-radioCount', -6.070949077606201],
        ['recovery-identifierCount', 1.007500410079956],
        ['recovery-hiddenIdentifierCount', -9.295701026916504],
        ['recovery-usernameCount', 9.75251293182373],
        ['recovery-emailCount', 3.1136062145233154],
        ['recovery-hiddenCount', 2.7585597038269043],
        ['recovery-hiddenPasswordCount', -11.615537643432617],
        ['recovery-submitCount', 7.980977535247803],
        ['recovery-hasTels', -15.636341094970703],
        ['recovery-hasOAuth', -13.858526229858398],
        ['recovery-hasCaptchas', 0.5581567883491516],
        ['recovery-hasFiles', -34.435359954833984],
        ['recovery-hasDate', -6.077753067016602],
        ['recovery-hasNumber', -6.034072399139404],
        ['recovery-oneVisibleField', -6.635979175567627],
        ['recovery-twoVisibleFields', -1.6205297708511353],
        ['recovery-threeOrMoreVisibleFields', 4.038835525512695],
        ['recovery-noPasswords', 1.5852354764938354],
        ['recovery-onePassword', -10.595808029174805],
        ['recovery-twoPasswords', -6.2112956047058105],
        ['recovery-threeOrMorePasswords', -5.971559524536133],
        ['recovery-noIdentifiers', -13.254354476928711],
        ['recovery-oneIdentifier', 1.2359222173690796],
        ['recovery-twoIdentifiers', 2.7512545585632324],
        ['recovery-threeOrMoreIdentifiers', -6.849569797515869],
        ['recovery-autofocusedIsIdentifier', -1.5649433135986328],
        ['recovery-autofocusedIsPassword', -5.942017555236816],
        ['recovery-visibleRatio', 0.3713679909706116],
        ['recovery-inputRatio', -4.5995283126831055],
        ['recovery-hiddenRatio', -0.2241121083498001],
        ['recovery-identifierRatio', -0.7165627479553223],
        ['recovery-emailRatio', 0.06144002825021744],
        ['recovery-usernameRatio', 8.968745231628418],
        ['recovery-passwordRatio', -9.141769409179688],
        ['recovery-requiredRatio', -0.07649124413728714],
        ['recovery-checkboxRatio', -6.062506198883057],
        ['recovery-pageLogin', -2.060392379760742],
        ['recovery-formTextLogin', -5.910265922546387],
        ['recovery-formAttrsLogin', 0.3767252564430237],
        ['recovery-headingsLogin', 3.9526076316833496],
        ['recovery-layoutLogin', -11.728992462158203],
        ['recovery-rememberMeCheckbox', -5.920112133026123],
        ['recovery-troubleLink', 6.511658668518066],
        ['recovery-submitLogin', -5.026706695556641],
        ['recovery-pageRegister', -11.19863510131836],
        ['recovery-formTextRegister', 0.09580708295106888],
        ['recovery-formAttrsRegister', -11.228416442871094],
        ['recovery-headingsRegister', -3.899078369140625],
        ['recovery-layoutRegister', -8.489550590515137],
        ['recovery-pwNewRegister', -5.93338680267334],
        ['recovery-pwConfirmRegister', -5.961478233337402],
        ['recovery-submitRegister', -7.106944561004639],
        ['recovery-TOSRef', -13.637484550476074],
        ['recovery-pagePwReset', 7.5010085105896],
        ['recovery-formTextPwReset', -6.1347832679748535],
        ['recovery-formAttrsPwReset', 12.3878755569458],
        ['recovery-headingsPwReset', 13.227123260498047],
        ['recovery-layoutPwReset', 6.017177581787109],
        ['recovery-pageRecovery', 16.691831588745117],
        ['recovery-formTextRecovery', 0.001506127417087555],
        ['recovery-formAttrsRecovery', 21.79227638244629],
        ['recovery-headingsRecovery', 4.388773441314697],
        ['recovery-layoutRecovery', 1.7729685306549072],
        ['recovery-identifierRecovery', 16.097187042236328],
        ['recovery-submitRecovery', 16.70568084716797],
        ['recovery-formTextMFA', 0.03691533952951431],
        ['recovery-formAttrsMFA', 10.846054077148438],
        ['recovery-headingsMFA', -8.327635765075684],
        ['recovery-layoutMFA', -6.110226631164551],
        ['recovery-buttonVerify', 0.5040489435195923],
        ['recovery-inputsMFA', 6.5060811042785645],
        ['recovery-inputsOTP', -0.4516093134880066],
        ['recovery-linkOTPOutlier', 0.3702349066734314],
        ['recovery-newsletterForm', -14.203194618225098],
        ['recovery-searchForm', -12.834273338317871],
        ['recovery-multiStepForm', 2.3002750873565674],
        ['recovery-multiAuthForm', -6.229105472564697],
        ['recovery-visibleRatio,fieldsCount', 3.2334988117218018],
        ['recovery-visibleRatio,identifierCount', 0.3067696988582611],
        ['recovery-visibleRatio,passwordCount', -8.530856132507324],
        ['recovery-visibleRatio,hiddenIdentifierCount', -12.218610763549805],
        ['recovery-visibleRatio,hiddenPasswordCount', -13.471202850341797],
        ['recovery-identifierRatio,fieldsCount', 6.116110324859619],
        ['recovery-identifierRatio,identifierCount', 0.8029772043228149],
        ['recovery-identifierRatio,passwordCount', -10.43006420135498],
        ['recovery-identifierRatio,hiddenIdentifierCount', -23.04059600830078],
        ['recovery-identifierRatio,hiddenPasswordCount', -14.267412185668945],
        ['recovery-passwordRatio,fieldsCount', -9.75239372253418],
        ['recovery-passwordRatio,identifierCount', -10.54693603515625],
        ['recovery-passwordRatio,passwordCount', -8.740160942077637],
        ['recovery-passwordRatio,hiddenIdentifierCount', -6.045868873596191],
        ['recovery-passwordRatio,hiddenPasswordCount', -6.021505832672119],
        ['recovery-requiredRatio,fieldsCount', 5.856142997741699],
        ['recovery-requiredRatio,identifierCount', 0.8988180160522461],
        ['recovery-requiredRatio,passwordCount', -8.597713470458984],
        ['recovery-requiredRatio,hiddenIdentifierCount', 8.37182331085205],
        ['recovery-requiredRatio,hiddenPasswordCount', -9.381244659423828],
    ],
    bias: -4.035372734069824,
    cutoff: 0.5,
};

const recovery = {
    name: FormType.RECOVERY,
    coeffs: FORM_COMBINED_FEATURES.map((key) => {
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
        rule(type('form'), type(FormType.RECOVERY), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type(FormType.RECOVERY), featureScore('form', key), {
                name: `recovery-${key}`,
            })
        ),
        ...outRuleWithCache('form-candidate', FormType.RECOVERY),
    ],
};

const results$6 = {
    coeffs: [
        ['mfa-fieldsCount', -2.428225040435791],
        ['mfa-inputCount', -1.539454460144043],
        ['mfa-fieldsetCount', 9.196701049804688],
        ['mfa-textCount', 5.665975570678711],
        ['mfa-textareaCount', -19.53679656982422],
        ['mfa-selectCount', -6.008809566497803],
        ['mfa-optionsCount', -6.096486568450928],
        ['mfa-radioCount', -6.028292655944824],
        ['mfa-identifierCount', -3.036637783050537],
        ['mfa-hiddenIdentifierCount', -2.4391658306121826],
        ['mfa-usernameCount', -3.4752237796783447],
        ['mfa-emailCount', -6.144618034362793],
        ['mfa-hiddenCount', -0.30017808079719543],
        ['mfa-hiddenPasswordCount', -0.4452032148838043],
        ['mfa-submitCount', -3.5690019130706787],
        ['mfa-hasTels', 13.08484935760498],
        ['mfa-hasOAuth', -6.654138088226318],
        ['mfa-hasCaptchas', -2.952349901199341],
        ['mfa-hasFiles', -6.020414352416992],
        ['mfa-hasDate', -6.05616569519043],
        ['mfa-hasNumber', 12.966322898864746],
        ['mfa-oneVisibleField', 5.037277698516846],
        ['mfa-twoVisibleFields', -5.159391403198242],
        ['mfa-threeOrMoreVisibleFields', -0.9343327879905701],
        ['mfa-noPasswords', -4.629420280456543],
        ['mfa-onePassword', -5.445255279541016],
        ['mfa-twoPasswords', -6.057365894317627],
        ['mfa-threeOrMorePasswords', -6.074880123138428],
        ['mfa-noIdentifiers', -7.494084358215332],
        ['mfa-oneIdentifier', -4.196770191192627],
        ['mfa-twoIdentifiers', -0.8048654198646545],
        ['mfa-threeOrMoreIdentifiers', 4.503909587860107],
        ['mfa-autofocusedIsIdentifier', -4.33329963684082],
        ['mfa-autofocusedIsPassword', 9.127509117126465],
        ['mfa-visibleRatio', 1.8381620645523071],
        ['mfa-inputRatio', -5.097467422485352],
        ['mfa-hiddenRatio', 2.0447051525115967],
        ['mfa-identifierRatio', -2.78062105178833],
        ['mfa-emailRatio', -5.754024505615234],
        ['mfa-usernameRatio', -4.41794490814209],
        ['mfa-passwordRatio', -5.755529880523682],
        ['mfa-requiredRatio', 3.8269002437591553],
        ['mfa-checkboxRatio', 12.583271980285645],
        ['mfa-pageLogin', 4.656621932983398],
        ['mfa-formTextLogin', -5.994166374206543],
        ['mfa-formAttrsLogin', -1.7478142976760864],
        ['mfa-headingsLogin', -5.071212291717529],
        ['mfa-layoutLogin', 0.8410121202468872],
        ['mfa-rememberMeCheckbox', 10.101339340209961],
        ['mfa-troubleLink', -3.1627986431121826],
        ['mfa-submitLogin', 1.7969037294387817],
        ['mfa-pageRegister', -1.7440632581710815],
        ['mfa-formTextRegister', -0.029343537986278534],
        ['mfa-formAttrsRegister', -4.01002836227417],
        ['mfa-headingsRegister', -8.071850776672363],
        ['mfa-layoutRegister', -2.1444737911224365],
        ['mfa-pwNewRegister', -5.966364860534668],
        ['mfa-pwConfirmRegister', -5.993445873260498],
        ['mfa-submitRegister', -6.036019325256348],
        ['mfa-TOSRef', -3.035245656967163],
        ['mfa-pagePwReset', -6.013423919677734],
        ['mfa-formTextPwReset', -6.065517902374268],
        ['mfa-formAttrsPwReset', -5.946979999542236],
        ['mfa-headingsPwReset', -6.087158679962158],
        ['mfa-layoutPwReset', -6.030163288116455],
        ['mfa-pageRecovery', 2.2928314208984375],
        ['mfa-formTextRecovery', -0.09545064717531204],
        ['mfa-formAttrsRecovery', -5.945108890533447],
        ['mfa-headingsRecovery', -6.082511901855469],
        ['mfa-layoutRecovery', 2.438258171081543],
        ['mfa-identifierRecovery', -5.913790225982666],
        ['mfa-submitRecovery', 5.627370357513428],
        ['mfa-formTextMFA', -0.07053942233324051],
        ['mfa-formAttrsMFA', 14.648538589477539],
        ['mfa-headingsMFA', 10.928214073181152],
        ['mfa-layoutMFA', 14.684030532836914],
        ['mfa-buttonVerify', 18.0830135345459],
        ['mfa-inputsMFA', 17.70334815979004],
        ['mfa-inputsOTP', 19.449506759643555],
        ['mfa-linkOTPOutlier', -0.6171749234199524],
        ['mfa-newsletterForm', -6.0170159339904785],
        ['mfa-searchForm', -6.729122638702393],
        ['mfa-multiStepForm', 6.367999076843262],
        ['mfa-multiAuthForm', -6.065805912017822],
        ['mfa-visibleRatio,fieldsCount', 0.9322911500930786],
        ['mfa-visibleRatio,identifierCount', -3.1687724590301514],
        ['mfa-visibleRatio,passwordCount', -4.760208606719971],
        ['mfa-visibleRatio,hiddenIdentifierCount', -6.4057698249816895],
        ['mfa-visibleRatio,hiddenPasswordCount', 0.20721003413200378],
        ['mfa-identifierRatio,fieldsCount', -0.007902204059064388],
        ['mfa-identifierRatio,identifierCount', -1.8425041437149048],
        ['mfa-identifierRatio,passwordCount', -5.5279998779296875],
        ['mfa-identifierRatio,hiddenIdentifierCount', 1.9322036504745483],
        ['mfa-identifierRatio,hiddenPasswordCount', 3.67769193649292],
        ['mfa-passwordRatio,fieldsCount', -5.436975955963135],
        ['mfa-passwordRatio,identifierCount', -5.41810417175293],
        ['mfa-passwordRatio,passwordCount', -5.717063903808594],
        ['mfa-passwordRatio,hiddenIdentifierCount', -8.104668617248535],
        ['mfa-passwordRatio,hiddenPasswordCount', -6.102854251861572],
        ['mfa-requiredRatio,fieldsCount', -3.7131834030151367],
        ['mfa-requiredRatio,identifierCount', -2.9502034187316895],
        ['mfa-requiredRatio,passwordCount', -4.213314056396484],
        ['mfa-requiredRatio,hiddenIdentifierCount', -5.990048408508301],
        ['mfa-requiredRatio,hiddenPasswordCount', -6.051021575927734],
    ],
    bias: -5.358344554901123,
    cutoff: 0.5,
};

const mfa = {
    name: FormType.MFA,
    coeffs: FORM_COMBINED_FEATURES.map((key) => {
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
        rule(type('form'), type(FormType.MFA), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type(FormType.MFA), featureScore('form', key), {
                name: `mfa-${key}`,
            })
        ),
        ...outRuleWithCache('form-candidate', FormType.MFA),
    ],
};

const getPasswordFieldFeatures = (fnode) => {
    var _a, _b;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField } = fieldFeatures;
    const attrCreate = any(matchPasswordCreateAttr)(fieldAttrs);
    const attrCurrent = any(matchPasswordCurrentAttr)(fieldAttrs);
    const attrConfirm = any(matchPasswordConfirmAttr)(fieldAttrs);
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
        loginScore: boolInt(fieldFeatures.isFormLogin),
        registerScore: boolInt(fieldFeatures.isFormRegister),
        pwChangeScore: boolInt(fieldFeatures.isFormPWChange),
        exotic: boolInt(fieldFeatures.isFormNoop),
        autocompleteNew: boolInt(fieldFeatures.autocomplete === 'new-password'),
        autocompleteCurrent: boolInt(fieldFeatures.autocomplete === 'current-password'),
        autocompleteOff: boolInt(fieldFeatures.autocomplete === 'off'),
        isOnlyPassword:
            (_b = (_a = fieldFeatures.formFeatures) === null || _a === void 0 ? void 0 : _a.onePassword) !== null &&
            _b !== void 0
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

const results$5 = {
    coeffs: [
        ['pw-loginScore', 12.643980979919434],
        ['pw-registerScore', -14.194168090820312],
        ['pw-pwChangeScore', 1.66200852394104],
        ['pw-exotic', -10.78492546081543],
        ['pw-autocompleteNew', -3.037773609161377],
        ['pw-autocompleteCurrent', 0.3075679838657379],
        ['pw-autocompleteOff', -6.433254718780518],
        ['pw-isOnlyPassword', 5.332669734954834],
        ['pw-prevPwField', 4.668947219848633],
        ['pw-nextPwField', -6.822936534881592],
        ['pw-attrCreate', -5.082516670227051],
        ['pw-attrCurrent', 2.933382034301758],
        ['pw-attrConfirm', -7.1980180740356445],
        ['pw-attrReset', -0.007558882236480713],
        ['pw-textCreate', -2.3324320316314697],
        ['pw-textCurrent', 1.3471189737319946],
        ['pw-textConfirm', -7.316954612731934],
        ['pw-textReset', -0.15216898918151855],
        ['pw-labelCreate', -8.00786018371582],
        ['pw-labelCurrent', 13.927122116088867],
        ['pw-labelConfirm', -7.442504405975342],
        ['pw-labelReset', 0.06924088299274445],
        ['pw-prevPwCreate', -9.879806518554688],
        ['pw-prevPwCurrent', -12.765348434448242],
        ['pw-prevPwConfirm', 0.10917805135250092],
        ['pw-passwordOutlier', -7.628660202026367],
        ['pw-nextPwCreate', 14.54041576385498],
        ['pw-nextPwCurrent', -8.333958625793457],
        ['pw-nextPwConfirm', -7.914557456970215],
    ],
    bias: -4.26195764541626,
    cutoff: 0.5,
};

const password = {
    name: FieldType.PASSWORD_CURRENT,
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
        rule(type('password-field'), type(FieldType.PASSWORD_CURRENT), {}),
        ...PW_FIELD_FEATURES.map((key) =>
            rule(type(FieldType.PASSWORD_CURRENT), featureScore('password-field', key), {
                name: `pw-${key}`,
            })
        ),
        ...outRuleWithCache('field-candidate', FieldType.PASSWORD_CURRENT),
    ],
};

const results$4 = {
    coeffs: [
        ['pw[new]-loginScore', -12.57532024383545],
        ['pw[new]-registerScore', 12.695426940917969],
        ['pw[new]-pwChangeScore', 0.17264139652252197],
        ['pw[new]-exotic', 15.447803497314453],
        ['pw[new]-autocompleteNew', 1.4155420064926147],
        ['pw[new]-autocompleteCurrent', -0.37462034821510315],
        ['pw[new]-autocompleteOff', -1.2090482711791992],
        ['pw[new]-isOnlyPassword', -2.14148211479187],
        ['pw[new]-prevPwField', 1.2775799036026],
        ['pw[new]-nextPwField', 9.6073637008667],
        ['pw[new]-attrCreate', 3.510326862335205],
        ['pw[new]-attrCurrent', 2.2917003631591797],
        ['pw[new]-attrConfirm', 7.671233654022217],
        ['pw[new]-attrReset', -0.15888682007789612],
        ['pw[new]-textCreate', 1.6739929914474487],
        ['pw[new]-textCurrent', -1.5650490522384644],
        ['pw[new]-textConfirm', -16.070348739624023],
        ['pw[new]-textReset', -0.1519380658864975],
        ['pw[new]-labelCreate', 7.997567653656006],
        ['pw[new]-labelCurrent', -13.12088680267334],
        ['pw[new]-labelConfirm', 7.955244541168213],
        ['pw[new]-labelReset', 0.13827522099018097],
        ['pw[new]-prevPwCreate', 11.034363746643066],
        ['pw[new]-prevPwCurrent', 9.543022155761719],
        ['pw[new]-prevPwConfirm', -0.06624716520309448],
        ['pw[new]-passwordOutlier', -29.06149673461914],
        ['pw[new]-nextPwCreate', -12.231315612792969],
        ['pw[new]-nextPwCurrent', 8.467833518981934],
        ['pw[new]-nextPwConfirm', 9.578030586242676],
    ],
    bias: -2.6305291652679443,
    cutoff: 0.5,
};

const newPassword = {
    name: FieldType.PASSWORD_NEW,
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
        rule(type('password-field'), type(FieldType.PASSWORD_NEW), {}),
        ...PW_FIELD_FEATURES.map((key) =>
            rule(type(FieldType.PASSWORD_NEW), featureScore('password-field', key), {
                name: `pw[new]-${key}`,
            })
        ),
        ...outRuleWithCache('field-candidate', FieldType.PASSWORD_NEW),
    ],
};

const getUsernameFieldFeatures = (fnode) => {
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField } = fieldFeatures;
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const textUsername = matchUsername(fieldText);
    const labelUsername = matchUsername(labelText);
    const outlierUsername = any(matchUsernameOutlier)(fieldAttrs.concat(fieldText, labelText));
    const haystack = fieldAttrs.concat(fieldText).concat(labelText);
    const outlier = outlierUsername || any(matchEmailAttr)(haystack);
    const loginForm = fieldFeatures.isFormLogin;
    const isFirstField = prevField === null;
    const loginUsername = loginForm && isFirstField && !outlier;
    return {
        autocompleteUsername: boolInt(fieldFeatures.autocomplete === 'username'),
        autocompleteNickname: boolInt(fieldFeatures.autocomplete === 'nickname'),
        autocompleteEmail: boolInt(fieldFeatures.autocomplete === 'email'),
        autocompleteOff: boolInt(fieldFeatures.autocomplete === 'off'),
        attrUsername: boolInt(attrUsername),
        textUsername: boolInt(textUsername),
        labelUsername: boolInt(labelUsername),
        outlierUsername: boolInt(outlier),
        loginUsername: boolInt(loginUsername),
        searchField: boolInt(fieldFeatures.searchField),
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
    'searchField',
];

const results$3 = {
    coeffs: [
        ['username-autocompleteUsername', 8.905208587646484],
        ['username-autocompleteNickname', -0.17964087426662445],
        ['username-autocompleteEmail', -6.5482401847839355],
        ['username-autocompleteOff', -0.5077144503593445],
        ['username-attrUsername', 18.578128814697266],
        ['username-textUsername', 16.18467903137207],
        ['username-labelUsername', 17.828170776367188],
        ['username-outlierUsername', -0.4201034605503082],
        ['username-loginUsername', 18.48188591003418],
        ['username-searchField', -6.935512542724609],
    ],
    bias: -9.644998550415039,
    cutoff: 0.5,
};

const username = {
    name: FieldType.USERNAME,
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
        rule(type('username-field'), type(FieldType.USERNAME), {}),
        ...USERNAME_FIELD_FEATURES.map((key) =>
            rule(type(FieldType.USERNAME), featureScore('username-field', key), {
                name: `username-${key}`,
            })
        ),
        ...outRuleWithCache('field-candidate', FieldType.USERNAME),
    ],
};

const getHiddenUserFieldFeatures = (fnode) => {
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, autocomplete } = fieldFeatures;
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const attrEmail = any(matchEmailAttr)(fieldAttrs);
    const usernameAttr = field.matches('[name="username"],[id="username"]');
    const autocompleteUsername = autocomplete === 'username';
    const visibleReadonly =
        field.readOnly &&
        isVisible(field, {
            opacity: true,
        }) &&
        field.type !== 'hidden';
    const valueEmail = matchEmailValue(fieldFeatures.value);
    const valueTel = matchTelValue(fieldFeatures.value);
    const valueUsername = matchUsernameValue(fieldFeatures.value);
    return {
        exotic: boolInt(fieldFeatures.isFormNoop),
        attrUsername: boolInt(attrUsername),
        attrEmail: boolInt(attrEmail),
        usernameAttr: boolInt(usernameAttr),
        autocompleteUsername: boolInt(autocompleteUsername),
        visibleReadonly: boolInt(visibleReadonly),
        hiddenEmailValue: boolInt(valueEmail),
        hiddenTelValue: boolInt(valueTel),
        hiddenUsernameValue: boolInt(valueUsername),
    };
};

const HIDDEN_USER_FIELD_FEATURES = [
    'exotic',
    'attrUsername',
    'attrEmail',
    'usernameAttr',
    'autocompleteUsername',
    'visibleReadonly',
    'hiddenEmailValue',
    'hiddenTelValue',
    'hiddenUsernameValue',
];

const results$2 = {
    coeffs: [
        ['username[hidden]-exotic', -7.48110818862915],
        ['username[hidden]-attrUsername', 14.148943901062012],
        ['username[hidden]-attrEmail', 13.167851448059082],
        ['username[hidden]-usernameAttr', 15.792003631591797],
        ['username[hidden]-autocompleteUsername', 1.1990786790847778],
        ['username[hidden]-visibleReadonly', 13.169424057006836],
        ['username[hidden]-hiddenEmailValue', 14.930179595947266],
        ['username[hidden]-hiddenTelValue', 6.762125015258789],
        ['username[hidden]-hiddenUsernameValue', -0.7231078147888184],
    ],
    bias: -20.871732711791992,
    cutoff: 0.5,
};

const usernameHidden = {
    name: FieldType.USERNAME_HIDDEN,
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
        rule(type('username-hidden-field'), type(FieldType.USERNAME_HIDDEN), {}),
        ...HIDDEN_USER_FIELD_FEATURES.map((key) =>
            rule(type(FieldType.USERNAME_HIDDEN), featureScore('username-hidden-field', key), {
                name: `username[hidden]-${key}`,
            })
        ),
        ...outRuleWithCache('field-candidate', FieldType.USERNAME_HIDDEN),
    ],
};

const getEmailFieldFeatures = (fnode) => {
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText } = fieldFeatures;
    const typeEmail = fieldFeatures.type === 'email';
    const exactAttrEmail = field.matches(kEmailSelector);
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
        searchField: boolInt(fieldFeatures.searchField),
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
    'searchField',
];

const results$1 = {
    coeffs: [
        ['email-autocompleteUsername', 1.023108959197998],
        ['email-autocompleteNickname', 0.14581337571144104],
        ['email-autocompleteEmail', 6.3687214851379395],
        ['email-typeEmail', 14.861259460449219],
        ['email-exactAttrEmail', 13.004132270812988],
        ['email-attrEmail', 2.3430042266845703],
        ['email-textEmail', 13.878275871276855],
        ['email-labelEmail', 17.080272674560547],
        ['email-placeholderEmail', 14.05381965637207],
        ['email-searchField', -23.969375610351562],
    ],
    bias: -9.363481521606445,
    cutoff: 0.5,
};

const email = {
    name: FieldType.EMAIL,
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
        rule(type('email-field'), type(FieldType.EMAIL), {}),
        ...EMAIL_FIELD_FEATURES.map((key) =>
            rule(type(FieldType.EMAIL), featureScore('email-field', key), {
                name: `email-${key}`,
            })
        ),
        ...outRuleWithCache('field-candidate', FieldType.EMAIL),
    ],
};

const { linearScale } = utils;

const getOTPFieldFeatures = (fnode) => {
    var _a, _b, _c, _d;
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField, type, minLength, maxLength } = fieldFeatures;
    const form = (_a = fieldFeatures.formFnode) === null || _a === void 0 ? void 0 : _a.element;
    const formMfa = fieldFeatures.isFormMFA;
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
    const patternOTP = OTP_PATTERNS.some(
        ([maxLength, pattern]) => field.pattern.includes(pattern) && maxLength === field.maxLength
    );
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
        exotic: boolInt(fieldFeatures.isFormNoop),
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

const results = {
    coeffs: [
        ['otp-mfaScore', 34.79245376586914],
        ['otp-exotic', -7.113471508026123],
        ['otp-linkOTPOutlier', -31.06525230407715],
        ['otp-hasCheckboxes', 7.236322402954102],
        ['otp-hidden', -0.15454243123531342],
        ['otp-required', -3.77836012840271],
        ['otp-nameMatch', 2.480717420578003],
        ['otp-idMatch', 9.100417137145996],
        ['otp-numericMode', -8.364502906799316],
        ['otp-autofocused', 1.1956796646118164],
        ['otp-tabIndex1', 3.0828685760498047],
        ['otp-patternOTP', 7.138646602630615],
        ['otp-maxLength1', 5.305088996887207],
        ['otp-maxLength5', -7.859643936157227],
        ['otp-minLength6', 17.01879119873047],
        ['otp-maxLength6', 8.356025695800781],
        ['otp-maxLength20', -1.214147686958313],
        ['otp-autocompleteOTC', 0.10733400285243988],
        ['otp-autocompleteOff', -3.2738990783691406],
        ['otp-prevAligned', -0.6670558452606201],
        ['otp-prevArea', -0.16458170115947723],
        ['otp-nextAligned', 0.03656797111034393],
        ['otp-nextArea', -0.16739341616630554],
        ['otp-attrMFA', 7.698232173919678],
        ['otp-attrOTP', 1.5168410539627075],
        ['otp-attrOutlier', -10.483864784240723],
        ['otp-textMFA', 6.719542503356934],
        ['otp-textOTP', -16.924318313598633],
        ['otp-labelMFA', -1.163057565689087],
        ['otp-labelOTP', -0.03833712637424469],
        ['otp-labelOutlier', -6.4860734939575195],
        ['otp-wrapperOTP', 7.776916980743408],
        ['otp-wrapperOutlier', -6.439656734466553],
        ['otp-emailOutlierCount', -19.29450035095215],
    ],
    bias: -11.896392822265625,
    cutoff: 0.51,
};

const otp = {
    name: FieldType.OTP,
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
        rule(type('otp-field'), type(FieldType.OTP), {}),
        ...OTP_FIELD_FEATURES.map((key) =>
            rule(type(FieldType.OTP), featureScore('otp-field', key), {
                name: `otp-${key}`,
            })
        ),
        ...outRuleWithCache('field-candidate', FieldType.OTP),
    ],
};

const getFieldFeature = (fnode) => {
    var _a, _b;
    const field = fnode.element;
    const fieldHaystacks = getFieldHaystacks(field);
    const formFnode = getParentFormFnode(fnode);
    if (formFnode !== null && !formFnode.hasNoteFor('form')) formFnode.setNoteFor('form', getFormFeatures(formFnode));
    const formFeatures = formFnode === null || formFnode === void 0 ? void 0 : formFnode.noteFor('form');
    const formClassification = getFormClassification(formFnode);
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
    const tabIndex = field.tabIndex;
    const visible = typeValid
        ? isVisibleField(field) &&
          isVisible(field, {
              opacity: false,
          })
        : false;
    const searchField = visible && any(matchSearchAction)(fieldHaystacks.fieldAttrs.concat(fieldHaystacks.fieldText));
    const prevField = typeValid
        ? (_a =
              formFeatures === null || formFeatures === void 0
                  ? void 0
                  : formFeatures.formInputIterator.prev(field)) !== null && _a !== void 0
            ? _a
            : null
        : null;
    const nextField = typeValid
        ? (_b =
              formFeatures === null || formFeatures === void 0
                  ? void 0
                  : formFeatures.formInputIterator.next(field)) !== null && _b !== void 0
            ? _b
            : null
        : null;
    return Object.assign(
        {
            formFnode,
            formFeatures,
            isFormLogin: formClassification.login,
            isFormRegister: formClassification.register,
            isFormPWChange: formClassification.pwChange,
            isFormRecovery: formClassification.recovery,
            isFormMFA: formClassification.mfa,
            isFormNoop: formClassification.noop,
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
            searchField,
        },
        fieldHaystacks
    );
};

const { clusters } = clusters$1;

const CLUSTER_MAX_X_DIST = 50;

const CLUSTER_MAX_Y_DIST = 275;

const CLUSTER_ALIGNMENT_TOLERANCE = 0.05;

const CLUSTER_MAX_ELEMENTS = 50;

const context = {
    cache: new WeakMap(),
};

const getElementData = (el) => {
    var _a;
    const data =
        (_a = context.cache.get(el)) !== null && _a !== void 0
            ? _a
            : {
                  isField: el.matches(kFieldSelector) && el.matches(':not([type="submit"])'),
                  rect: el.getBoundingClientRect(),
              };
    context.cache.set(el, data);
    return data;
};

const compare = (elA, elB) => {
    const a = getElementData(elA);
    const b = getElementData(elB);
    const maxDx = CLUSTER_MAX_X_DIST;
    const maxDy = CLUSTER_MAX_Y_DIST / (a.isField && b.isField ? 2 : 1);
    const { dx, dy } = getRectMinDistance(a.rect, b.rect);
    const leftRatio = Math.abs(a.rect.left / b.rect.left);
    const topRatio = Math.abs(a.rect.top / b.rect.top);
    const xAlign = leftRatio > 1 - CLUSTER_ALIGNMENT_TOLERANCE && leftRatio < 1 + CLUSTER_ALIGNMENT_TOLERANCE;
    const yAlign = topRatio > 1 - CLUSTER_ALIGNMENT_TOLERANCE && topRatio < 1 + CLUSTER_ALIGNMENT_TOLERANCE;
    if (xAlign && yAlign) return true;
    if (xAlign && dy < maxDy) return true;
    if (yAlign && dx < maxDx) return true;
    if (dx < maxDx && dy < maxDy) return true;
    return false;
};

const handleSingletonCluster = (cluster) => {
    const node = cluster[0];
    return walkUpWhile(
        node,
        5
    )((_, candidate) => candidate === node || candidate.querySelectorAll(buttonSelector).length === 0);
};

const resolveFormClusters = (doc) => {
    const forms = selectFormCandidates(doc);
    const clusterable = (els) => els.filter((el) => !forms.some((ex) => ex.contains(el)) && isVisibleField(el));
    const fields = Array.from(doc.querySelectorAll(kFieldSelector));
    const fieldsOfInterest = clusterable(
        fields.filter((el) => isClassifiable(el) && el.getAttribute('type') !== 'hidden')
    );
    const inputs = fieldsOfInterest.filter((field) => field.matches(inputCandidateSelector));
    if (inputs.length === 0 || inputs.length > CLUSTER_MAX_ELEMENTS) return [];
    const domGroups = Array.from(doc.querySelectorAll(kDomGroupSelector)).filter((el) => el !== document.body);
    const positionedEls = findStackedParents(inputs, 20);
    const groups = pruneNested(
        domGroups.filter((el) => !positionedEls.some((stack) => el.contains(stack))).concat(positionedEls)
    );
    const buttons = clusterable(
        Array.from(document.querySelectorAll(kButtonSubmitSelector)).filter(isSubmitBtnCandidate)
    );
    const candidates = uniqueNodes(fieldsOfInterest, buttons);
    if (candidates.length > CLUSTER_MAX_ELEMENTS) return [];
    const groupByInput = new WeakMap(candidates.map((el) => [el, groups.find((group) => group.contains(el))]));
    const theClusters = clusters(candidates, 1, (a, b) => {
        if (a.parentElement === b.parentElement) return 0;
        const groupA = groupByInput.get(a);
        const groupB = groupByInput.get(b);
        if (groupA !== groupB) return Number.MAX_SAFE_INTEGER;
        if (groupA && groupA === groupB) return 0;
        return compare(a, b) ? 0 : Number.MAX_SAFE_INTEGER;
    });
    const ancestors = theClusters
        .map((cluster) => (cluster.length === 1 ? handleSingletonCluster(cluster) : cluster.reduce(getCommonAncestor)))
        .filter(
            (ancestor) => document.body !== ancestor && ancestor.querySelectorAll(inputCandidateSelector).length > 0
        );
    const result = pruneNested(ancestors);
    result.forEach(flagCluster);
    context.cache = new WeakMap();
    return result;
};

const TABLE_MAX_COLS = 3;

const TABLE_MAX_AREA = 15e4;

const nodeOfInterest = (el) => isClassifiable(el) && el.querySelector('input') !== null;

const excludeForms = (doc = document) => {
    const bodyElCount = document.body.querySelectorAll('*').length;
    return doc.querySelectorAll('form').forEach((form) => {
        if (nodeOfInterest(form)) {
            const fieldCount = form.querySelectorAll(kFieldSelector).length;
            const inputCount = form.querySelectorAll(inputCandidateSelector).length;
            const invalidFieldCount =
                inputCount === 0 || inputCount > MAX_INPUTS_PER_FORM || fieldCount > MAX_FIELDS_PER_FORM;
            const pageForm = form.matches('body > form');
            const formElCount = form.querySelectorAll('*').length;
            const invalidPageForm = pageForm && formElCount >= bodyElCount * 0.8;
            const invalidCount = invalidFieldCount || invalidPageForm;
            if (invalidCount && !pageForm) return flagSubtreeAsIgnored(form);
            if (invalidCount && pageForm) return flagAsIgnored(form);
            if (form.matches('table form') && form.closest('table').querySelectorAll('form').length > 2)
                return flagAsIgnored(form);
        }
    });
};

const excludeClusterableNodes = (doc = document) => {
    doc.querySelectorAll('table').forEach((table) => {
        if (nodeOfInterest(table) && !table.querySelector('table') && table.closest('form') === null) {
            const nestedForms = table.querySelectorAll('form');
            if (nestedForms.length > 2) return flagSubtreeAsIgnored(table);
            if (!nestedForms.length) {
                if (table.querySelector('thead') !== null) return flagSubtreeAsIgnored(table);
                const cellCount = Math.max(...Array.from(table.rows).map((row) => row.cells.length));
                if (cellCount > TABLE_MAX_COLS || getNodeRect(table).area > TABLE_MAX_AREA)
                    return flagSubtreeAsIgnored(table);
            }
        }
    });
    doc.querySelectorAll(kEditorSelector).forEach(flagSubtreeAsIgnored);
};

const excludeFields = (doc = document) => {
    doc.querySelectorAll('input').forEach((input) => {
        if (!isClassifiable(input)) return;
        const invalidType = !VALID_INPUT_TYPES.includes(input.type);
        const listElement = input.getAttribute('aria-autocomplete') === 'list';
        if (invalidType || listElement) return flagAsIgnored(input);
        if (input.type === 'hidden') {
            const value = input.value.trim();
            const invalidValueLength = !value.length || value.length > MAX_HIDDEN_FIELD_VALUE_LENGTH;
            if (
                invalidValueLength ||
                HIDDEN_FIELD_IGNORE_VALUES.includes(value) ||
                !input.matches(kHiddenUsernameSelector)
            )
                return flagAsIgnored(input);
        }
    });
};

const prepass = (doc = document) => {
    excludeForms(doc);
    excludeClusterableNodes(doc);
    excludeFields(doc);
    resolveFormClusters(doc);
};

const shouldRunClassifier = () => {
    const runForForms = selectFormCandidates().reduce((runDetection, form) => {
        if (isProcessed(form)) {
            const unprocessedFields = selectInputCandidates(form).some(isProcessableField);
            if (unprocessedFields) removeClassifierFlags(form);
            return runDetection || unprocessedFields;
        }
        if (isVisibleForm(form)) return true;
        return runDetection;
    }, false);
    if (runForForms) return true;
    const runForFields = selectInputCandidates().some(isProcessableField);
    return runForFields;
};

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
                rule(dom(formCandidateSelector), type('form-candidate'), {}),
                rule(dom('input'), type('field-candidate'), {}),
                rule(type('form-candidate').when(withFnodeEl(isClassifiable)), type('form-element'), {}),
                rule(type('form-element').when(withFnodeEl(isVisibleForm)), type('form').note(getFormFeatures), {}),
                rule(type('form-element'), out('form').through(processFormEffect), {}),
                rule(type('form').when(isNoopForm), type(FormType.NOOP), {}),
                rule(type(FormType.NOOP), out(FormType.NOOP), {}),
                rule(type('field-candidate').when(isClassifiableField), type('field').note(getFieldFeature), {}),
                rule(type('field').when(maybeUsername), type('username-field').note(getUsernameFieldFeatures), {}),
                rule(
                    type('field').when(maybeHiddenUsername),
                    type('username-hidden-field').note(getHiddenUserFieldFeatures),
                    {}
                ),
                rule(type('field').when(maybeEmail), type('email-field').note(getEmailFieldFeatures), {}),
                rule(type('field').when(maybePassword), type('password-field').note(getPasswordFieldFeatures), {}),
                rule(type('field').when(maybeOTP), type('otp-field').note(getOTPFieldFeatures), {}),
                rule(type('field'), out('field').through(processFieldEffect), {}),
            ],
            coeffs: [],
            biases: [],
        }
    );
    const rules = ruleset(aggregation.rules, aggregation.coeffs, aggregation.biases);
    return rules;
};

const clearDetectionCache = () => clearVisibilityCache();

export {
    EL_ATTRIBUTES,
    FIELD_ATTRIBUTES,
    FORM_ATTRIBUTES,
    FORM_CLUSTER_ATTR,
    FieldType,
    FormType,
    TEXT_ATTRIBUTES,
    buttonSelector,
    cacheContext,
    clearDetectionCache,
    clearVisibilityCache,
    createInputIterator,
    fieldTypes,
    flagAsIgnored,
    flagAsProcessed,
    flagCluster,
    flagSubtreeAsIgnored,
    formCandidateSelector,
    formTypes,
    getAttributes,
    getBaseAttributes,
    getFieldAttributes,
    getFormAttributes,
    getFormParent,
    getIgnoredParent,
    getParentFormPrediction,
    getTextAttributes,
    getVisibilityCache,
    inputCandidateSelector,
    isClassifiable,
    isClassifiableField,
    isCluster,
    isEmailCandidate,
    isIgnored,
    isOAuthCandidate,
    isPredictedType,
    isPrediction,
    isProcessableField,
    isProcessed,
    isSubmitBtnCandidate,
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
    maybeOTP,
    maybePassword,
    maybeUsername,
    otpSelector,
    prepass,
    removeClassifierFlags,
    removeIgnoredFlag,
    removePredictionFlag,
    removeProcessedFlag,
    rulesetMaker,
    selectFormCandidates,
    selectInputCandidates,
    setPrediction,
    shouldRunClassifier,
    splitFieldsByVisibility,
    trainees,
};
