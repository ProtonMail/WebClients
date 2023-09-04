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
        ['login-fieldsCount', 13.579686164855957],
        ['login-inputCount', 9.84705924987793],
        ['login-fieldsetCount', -13.812128067016602],
        ['login-textCount', 5.443991184234619],
        ['login-textareaCount', -6.004219055175781],
        ['login-selectCount', -6.858480930328369],
        ['login-optionsCount', -6.466980457305908],
        ['login-radioCount', -5.974116325378418],
        ['login-identifierCount', -3.1851468086242676],
        ['login-hiddenIdentifierCount', 10.208684921264648],
        ['login-usernameCount', 10.807714462280273],
        ['login-emailCount', -7.515251159667969],
        ['login-hiddenCount', 16.268156051635742],
        ['login-hiddenPasswordCount', 16.30748748779297],
        ['login-submitCount', -3.488231658935547],
        ['login-hasTels', -9.749866485595703],
        ['login-hasOAuth', 4.291736602783203],
        ['login-hasCaptchas', -1.6728270053863525],
        ['login-hasFiles', -5.972683429718018],
        ['login-hasDate', -16.156526565551758],
        ['login-hasNumber', -5.927528381347656],
        ['login-oneVisibleField', 9.392728805541992],
        ['login-twoVisibleFields', 2.5622434616088867],
        ['login-threeOrMoreVisibleFields', -13.261070251464844],
        ['login-noPasswords', -16.95838165283203],
        ['login-onePassword', 11.70108699798584],
        ['login-twoPasswords', -19.38691520690918],
        ['login-threeOrMorePasswords', -6.123312950134277],
        ['login-noIdentifiers', -16.271066665649414],
        ['login-oneIdentifier', -1.731781005859375],
        ['login-twoIdentifiers', 2.1029975414276123],
        ['login-threeOrMoreIdentifiers', -7.881538391113281],
        ['login-autofocusedIsIdentifier', 12.200773239135742],
        ['login-autofocusedIsPassword', 42.848106384277344],
        ['login-visibleRatio', 2.56543231010437],
        ['login-inputRatio', 5.744941234588623],
        ['login-hiddenRatio', -26.971723556518555],
        ['login-identifierRatio', 13.529948234558105],
        ['login-emailRatio', -2.8681254386901855],
        ['login-usernameRatio', -24.960412979125977],
        ['login-passwordRatio', -3.060084342956543],
        ['login-requiredRatio', 1.5123082399368286],
        ['login-checkboxRatio', 48.76902770996094],
        ['login-pageLogin', 16.4226016998291],
        ['login-formTextLogin', 6.976861476898193],
        ['login-formAttrsLogin', 5.911652088165283],
        ['login-headingsLogin', 16.58487319946289],
        ['login-layoutLogin', 6.311992168426514],
        ['login-rememberMeCheckbox', 8.443793296813965],
        ['login-troubleLink', 20.376693725585938],
        ['login-submitLogin', 12.363264083862305],
        ['login-pageRegister', -12.901202201843262],
        ['login-formTextRegister', 0.09751971811056137],
        ['login-formAttrsRegister', -20.278072357177734],
        ['login-headingsRegister', -13.11659049987793],
        ['login-layoutRegister', 0.9088019132614136],
        ['login-pwNewRegister', -28.232946395874023],
        ['login-pwConfirmRegister', -20.75241470336914],
        ['login-submitRegister', -21.679487228393555],
        ['login-TOSRef', 5.689417362213135],
        ['login-pagePwReset', -6.117144584655762],
        ['login-formTextPwReset', -6.004324436187744],
        ['login-formAttrsPwReset', -7.387979984283447],
        ['login-headingsPwReset', -11.095043182373047],
        ['login-layoutPwReset', 1.129456877708435],
        ['login-pageRecovery', -3.2096004486083984],
        ['login-formTextRecovery', -0.05897531285881996],
        ['login-formAttrsRecovery', -41.5538330078125],
        ['login-headingsRecovery', -5.31503963470459],
        ['login-layoutRecovery', -0.7176696062088013],
        ['login-identifierRecovery', 1.508125901222229],
        ['login-submitRecovery', -9.008040428161621],
        ['login-formTextMFA', -0.0742376446723938],
        ['login-formAttrsMFA', -32.29767990112305],
        ['login-headingsMFA', -17.653562545776367],
        ['login-layoutMFA', -4.691511631011963],
        ['login-buttonVerify', -6.600189208984375],
        ['login-inputsMFA', -23.839305877685547],
        ['login-inputsOTP', -31.35911750793457],
        ['login-linkOTPOutlier', -5.142894744873047],
        ['login-newsletterForm', -8.675042152404785],
        ['login-searchForm', -6.7248454093933105],
        ['login-multiStepForm', 3.7029964923858643],
        ['login-multiAuthForm', 17.22262954711914],
        ['login-visibleRatio,fieldsCount', -9.74300479888916],
        ['login-visibleRatio,identifierCount', -14.670576095581055],
        ['login-visibleRatio,passwordCount', 11.981603622436523],
        ['login-visibleRatio,hiddenIdentifierCount', -18.779787063598633],
        ['login-visibleRatio,hiddenPasswordCount', 45.12097930908203],
        ['login-identifierRatio,fieldsCount', -29.840633392333984],
        ['login-identifierRatio,identifierCount', 14.603984832763672],
        ['login-identifierRatio,passwordCount', -15.716425895690918],
        ['login-identifierRatio,hiddenIdentifierCount', 5.744332790374756],
        ['login-identifierRatio,hiddenPasswordCount', -8.190534591674805],
        ['login-passwordRatio,fieldsCount', 7.606005668640137],
        ['login-passwordRatio,identifierCount', -15.104533195495605],
        ['login-passwordRatio,passwordCount', -7.5666728019714355],
        ['login-passwordRatio,hiddenIdentifierCount', 38.064449310302734],
        ['login-passwordRatio,hiddenPasswordCount', -2.847954034805298],
        ['login-requiredRatio,fieldsCount', 8.156652450561523],
        ['login-requiredRatio,identifierCount', -19.242324829101562],
        ['login-requiredRatio,passwordCount', 19.32948875427246],
        ['login-requiredRatio,hiddenIdentifierCount', -31.11879539489746],
        ['login-requiredRatio,hiddenPasswordCount', 20.83793067932129],
    ],
    bias: -8.960040092468262,
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
        ['pw-change-fieldsCount', -2.925889253616333],
        ['pw-change-inputCount', -2.519439458847046],
        ['pw-change-fieldsetCount', -6.060182094573975],
        ['pw-change-textCount', -5.916891574859619],
        ['pw-change-textareaCount', -5.923375129699707],
        ['pw-change-selectCount', -6.079122066497803],
        ['pw-change-optionsCount', -5.965888977050781],
        ['pw-change-radioCount', -6.044174671173096],
        ['pw-change-identifierCount', -5.407836437225342],
        ['pw-change-hiddenIdentifierCount', -3.52567982673645],
        ['pw-change-usernameCount', -6.056415557861328],
        ['pw-change-emailCount', -4.737851142883301],
        ['pw-change-hiddenCount', -4.159277439117432],
        ['pw-change-hiddenPasswordCount', -5.932567596435547],
        ['pw-change-submitCount', -3.794250249862671],
        ['pw-change-hasTels', -5.93418025970459],
        ['pw-change-hasOAuth', -5.933425426483154],
        ['pw-change-hasCaptchas', -5.928577423095703],
        ['pw-change-hasFiles', -6.042403221130371],
        ['pw-change-hasDate', -6.003408432006836],
        ['pw-change-hasNumber', -5.964302062988281],
        ['pw-change-oneVisibleField', -5.994521141052246],
        ['pw-change-twoVisibleFields', -3.3243606090545654],
        ['pw-change-threeOrMoreVisibleFields', -0.9153913259506226],
        ['pw-change-noPasswords', -5.9902567863464355],
        ['pw-change-onePassword', -5.9249677658081055],
        ['pw-change-twoPasswords', 9.04548168182373],
        ['pw-change-threeOrMorePasswords', 22.834186553955078],
        ['pw-change-noIdentifiers', -0.8690082430839539],
        ['pw-change-oneIdentifier', -5.978860378265381],
        ['pw-change-twoIdentifiers', -5.969848155975342],
        ['pw-change-threeOrMoreIdentifiers', 3.7982773780822754],
        ['pw-change-autofocusedIsIdentifier', -5.918277740478516],
        ['pw-change-autofocusedIsPassword', 20.777605056762695],
        ['pw-change-visibleRatio', -3.9139785766601562],
        ['pw-change-inputRatio', -4.106815338134766],
        ['pw-change-hiddenRatio', -4.707705497741699],
        ['pw-change-identifierRatio', -5.690192222595215],
        ['pw-change-emailRatio', -5.243147850036621],
        ['pw-change-usernameRatio', -6.078103542327881],
        ['pw-change-passwordRatio', 2.1844170093536377],
        ['pw-change-requiredRatio', -4.442323207855225],
        ['pw-change-checkboxRatio', -6.006374359130859],
        ['pw-change-pageLogin', -6.416450023651123],
        ['pw-change-formTextLogin', -6.082954406738281],
        ['pw-change-formAttrsLogin', -5.940528869628906],
        ['pw-change-headingsLogin', -6.00663423538208],
        ['pw-change-layoutLogin', -6.062338352203369],
        ['pw-change-rememberMeCheckbox', -6.053900718688965],
        ['pw-change-troubleLink', -3.74429988861084],
        ['pw-change-submitLogin', -6.022520542144775],
        ['pw-change-pageRegister', -5.923137187957764],
        ['pw-change-formTextRegister', -0.062261588871479034],
        ['pw-change-formAttrsRegister', -5.968058109283447],
        ['pw-change-headingsRegister', -5.98602819442749],
        ['pw-change-layoutRegister', -6.05936861038208],
        ['pw-change-pwNewRegister', 11.166543960571289],
        ['pw-change-pwConfirmRegister', 8.090400695800781],
        ['pw-change-submitRegister', -7.265867710113525],
        ['pw-change-TOSRef', -6.802220821380615],
        ['pw-change-pagePwReset', 15.626482963562012],
        ['pw-change-formTextPwReset', 23.81220245361328],
        ['pw-change-formAttrsPwReset', 1.7162792682647705],
        ['pw-change-headingsPwReset', 18.024507522583008],
        ['pw-change-layoutPwReset', 17.568920135498047],
        ['pw-change-pageRecovery', -6.075684547424316],
        ['pw-change-formTextRecovery', -0.042517997324466705],
        ['pw-change-formAttrsRecovery', -5.981190204620361],
        ['pw-change-headingsRecovery', -6.043046951293945],
        ['pw-change-layoutRecovery', -3.7861905097961426],
        ['pw-change-identifierRecovery', -5.936452388763428],
        ['pw-change-submitRecovery', -0.33672574162483215],
        ['pw-change-formTextMFA', 0.03293929249048233],
        ['pw-change-formAttrsMFA', -6.026731014251709],
        ['pw-change-headingsMFA', -5.9526777267456055],
        ['pw-change-layoutMFA', -6.016188144683838],
        ['pw-change-buttonVerify', -6.067421913146973],
        ['pw-change-inputsMFA', -6.048427581787109],
        ['pw-change-inputsOTP', -6.043373107910156],
        ['pw-change-linkOTPOutlier', -5.963919639587402],
        ['pw-change-newsletterForm', -6.018017768859863],
        ['pw-change-searchForm', -5.910163402557373],
        ['pw-change-multiStepForm', -6.062363147735596],
        ['pw-change-multiAuthForm', -5.948858737945557],
        ['pw-change-visibleRatio,fieldsCount', -2.6839351654052734],
        ['pw-change-visibleRatio,identifierCount', -5.746217250823975],
        ['pw-change-visibleRatio,passwordCount', 2.5926549434661865],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -2.3656301498413086],
        ['pw-change-visibleRatio,hiddenPasswordCount', -6.079700469970703],
        ['pw-change-identifierRatio,fieldsCount', -4.55754280090332],
        ['pw-change-identifierRatio,identifierCount', -5.38360595703125],
        ['pw-change-identifierRatio,passwordCount', -4.481517314910889],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -5.980190753936768],
        ['pw-change-identifierRatio,hiddenPasswordCount', -5.91384744644165],
        ['pw-change-passwordRatio,fieldsCount', 4.64896297454834],
        ['pw-change-passwordRatio,identifierCount', -4.4718403816223145],
        ['pw-change-passwordRatio,passwordCount', 7.675714015960693],
        ['pw-change-passwordRatio,hiddenIdentifierCount', 0.6029994487762451],
        ['pw-change-passwordRatio,hiddenPasswordCount', -5.915081977844238],
        ['pw-change-requiredRatio,fieldsCount', -4.731739044189453],
        ['pw-change-requiredRatio,identifierCount', -6.092100620269775],
        ['pw-change-requiredRatio,passwordCount', -0.8812475800514221],
        ['pw-change-requiredRatio,hiddenIdentifierCount', 2.6479709148406982],
        ['pw-change-requiredRatio,hiddenPasswordCount', -5.963202953338623],
    ],
    bias: -4.207690238952637,
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
        ['register-fieldsCount', 1.5531052350997925],
        ['register-inputCount', 4.809399604797363],
        ['register-fieldsetCount', 4.68303918838501],
        ['register-textCount', 4.856708526611328],
        ['register-textareaCount', 0.3812011778354645],
        ['register-selectCount', -13.064475059509277],
        ['register-optionsCount', 8.355161666870117],
        ['register-radioCount', 8.438986778259277],
        ['register-identifierCount', 6.950457572937012],
        ['register-hiddenIdentifierCount', 29.591766357421875],
        ['register-usernameCount', -7.219218730926514],
        ['register-emailCount', 1.7055281400680542],
        ['register-hiddenCount', -17.294958114624023],
        ['register-hiddenPasswordCount', 12.476357460021973],
        ['register-submitCount', 3.988590717315674],
        ['register-hasTels', 0.3183409869670868],
        ['register-hasOAuth', 3.819967031478882],
        ['register-hasCaptchas', 5.371250629425049],
        ['register-hasFiles', -6.05821418762207],
        ['register-hasDate', 19.766000747680664],
        ['register-hasNumber', 18.778974533081055],
        ['register-oneVisibleField', 0.5886516571044922],
        ['register-twoVisibleFields', 2.682443857192993],
        ['register-threeOrMoreVisibleFields', -1.7466766834259033],
        ['register-noPasswords', -4.813371658325195],
        ['register-onePassword', 1.7292356491088867],
        ['register-twoPasswords', 17.62159538269043],
        ['register-threeOrMorePasswords', -13.17177963256836],
        ['register-noIdentifiers', -8.46222972869873],
        ['register-oneIdentifier', 1.1012775897979736],
        ['register-twoIdentifiers', 14.227035522460938],
        ['register-threeOrMoreIdentifiers', 22.41490364074707],
        ['register-autofocusedIsIdentifier', 4.512907028198242],
        ['register-autofocusedIsPassword', 9.957367897033691],
        ['register-visibleRatio', -3.396435499191284],
        ['register-inputRatio', -5.968061447143555],
        ['register-hiddenRatio', 1.169516921043396],
        ['register-identifierRatio', 1.7186797857284546],
        ['register-emailRatio', -2.993565559387207],
        ['register-usernameRatio', -5.646374225616455],
        ['register-passwordRatio', 0.0006993053248152137],
        ['register-requiredRatio', -12.73731803894043],
        ['register-checkboxRatio', -39.19088363647461],
        ['register-pageLogin', -8.624646186828613],
        ['register-formTextLogin', -5.988137245178223],
        ['register-formAttrsLogin', -5.558932304382324],
        ['register-headingsLogin', -15.485187530517578],
        ['register-layoutLogin', 12.13718032836914],
        ['register-rememberMeCheckbox', -13.022344589233398],
        ['register-troubleLink', -12.170385360717773],
        ['register-submitLogin', -8.794814109802246],
        ['register-pageRegister', 3.1935839653015137],
        ['register-formTextRegister', -0.016222640872001648],
        ['register-formAttrsRegister', 9.719532012939453],
        ['register-headingsRegister', 15.940906524658203],
        ['register-layoutRegister', -10.379812240600586],
        ['register-pwNewRegister', 11.668684005737305],
        ['register-pwConfirmRegister', -0.18180769681930542],
        ['register-submitRegister', 26.887914657592773],
        ['register-TOSRef', 14.40587043762207],
        ['register-pagePwReset', -7.505476474761963],
        ['register-formTextPwReset', -11.09890365600586],
        ['register-formAttrsPwReset', -6.146913051605225],
        ['register-headingsPwReset', -26.277067184448242],
        ['register-layoutPwReset', -46.5500373840332],
        ['register-pageRecovery', -7.1671013832092285],
        ['register-formTextRecovery', -0.010926015675067902],
        ['register-formAttrsRecovery', -7.764219284057617],
        ['register-headingsRecovery', -17.455406188964844],
        ['register-layoutRecovery', -3.08323335647583],
        ['register-identifierRecovery', -15.953300476074219],
        ['register-submitRecovery', -33.01133346557617],
        ['register-formTextMFA', 0.049520380795001984],
        ['register-formAttrsMFA', -8.534997940063477],
        ['register-headingsMFA', -12.870424270629883],
        ['register-layoutMFA', 2.470594882965088],
        ['register-buttonVerify', -6.503914833068848],
        ['register-inputsMFA', -4.68481969833374],
        ['register-inputsOTP', -21.783649444580078],
        ['register-linkOTPOutlier', 2.369840621948242],
        ['register-newsletterForm', -25.94290542602539],
        ['register-searchForm', -7.6409406661987305],
        ['register-multiStepForm', 8.964444160461426],
        ['register-multiAuthForm', -15.878436088562012],
        ['register-visibleRatio,fieldsCount', -5.937838554382324],
        ['register-visibleRatio,identifierCount', 4.882147312164307],
        ['register-visibleRatio,passwordCount', 12.539003372192383],
        ['register-visibleRatio,hiddenIdentifierCount', -8.334639549255371],
        ['register-visibleRatio,hiddenPasswordCount', -34.481666564941406],
        ['register-identifierRatio,fieldsCount', 5.519084453582764],
        ['register-identifierRatio,identifierCount', 2.9108312129974365],
        ['register-identifierRatio,passwordCount', -34.964111328125],
        ['register-identifierRatio,hiddenIdentifierCount', -42.66314697265625],
        ['register-identifierRatio,hiddenPasswordCount', 14.84352970123291],
        ['register-passwordRatio,fieldsCount', 2.124969244003296],
        ['register-passwordRatio,identifierCount', -38.69178771972656],
        ['register-passwordRatio,passwordCount', -6.215864181518555],
        ['register-passwordRatio,hiddenIdentifierCount', 1.5689589977264404],
        ['register-passwordRatio,hiddenPasswordCount', -9.170960426330566],
        ['register-requiredRatio,fieldsCount', -1.7318027019500732],
        ['register-requiredRatio,identifierCount', -3.4504451751708984],
        ['register-requiredRatio,passwordCount', -10.308083534240723],
        ['register-requiredRatio,hiddenIdentifierCount', 21.47762107849121],
        ['register-requiredRatio,hiddenPasswordCount', -8.672821044921875],
    ],
    bias: -0.016910402104258537,
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
        ['recovery-fieldsCount', 3.2647864818573],
        ['recovery-inputCount', 2.2119319438934326],
        ['recovery-fieldsetCount', -10.027751922607422],
        ['recovery-textCount', -2.945523500442505],
        ['recovery-textareaCount', -18.342422485351562],
        ['recovery-selectCount', -13.768583297729492],
        ['recovery-optionsCount', -17.496538162231445],
        ['recovery-radioCount', -5.949767112731934],
        ['recovery-identifierCount', 1.0420836210250854],
        ['recovery-hiddenIdentifierCount', -9.518954277038574],
        ['recovery-usernameCount', 9.639254570007324],
        ['recovery-emailCount', 3.2648322582244873],
        ['recovery-hiddenCount', 2.5952303409576416],
        ['recovery-hiddenPasswordCount', -11.931419372558594],
        ['recovery-submitCount', 7.856451511383057],
        ['recovery-hasTels', -15.642678260803223],
        ['recovery-hasOAuth', -14.143163681030273],
        ['recovery-hasCaptchas', 0.5376536846160889],
        ['recovery-hasFiles', -34.89630126953125],
        ['recovery-hasDate', -6.058959484100342],
        ['recovery-hasNumber', -6.062159061431885],
        ['recovery-oneVisibleField', -6.542551040649414],
        ['recovery-twoVisibleFields', -1.6478822231292725],
        ['recovery-threeOrMoreVisibleFields', 4.490854263305664],
        ['recovery-noPasswords', 1.2400637865066528],
        ['recovery-onePassword', -10.681783676147461],
        ['recovery-twoPasswords', -6.322780132293701],
        ['recovery-threeOrMorePasswords', -6.145326614379883],
        ['recovery-noIdentifiers', -13.223711013793945],
        ['recovery-oneIdentifier', 1.2987892627716064],
        ['recovery-twoIdentifiers', 3.013702869415283],
        ['recovery-threeOrMoreIdentifiers', -7.174580097198486],
        ['recovery-autofocusedIsIdentifier', -1.5817840099334717],
        ['recovery-autofocusedIsPassword', -6.075239181518555],
        ['recovery-visibleRatio', 0.2786864638328552],
        ['recovery-inputRatio', -4.559954643249512],
        ['recovery-hiddenRatio', -0.17634302377700806],
        ['recovery-identifierRatio', -0.6828321218490601],
        ['recovery-emailRatio', 0.04928882420063019],
        ['recovery-usernameRatio', 9.092541694641113],
        ['recovery-passwordRatio', -9.424104690551758],
        ['recovery-requiredRatio', -0.09306442737579346],
        ['recovery-checkboxRatio', -6.0350565910339355],
        ['recovery-pageLogin', -2.063318967819214],
        ['recovery-formTextLogin', -6.066505432128906],
        ['recovery-formAttrsLogin', 0.4759218096733093],
        ['recovery-headingsLogin', 4.0113205909729],
        ['recovery-layoutLogin', -12.115954399108887],
        ['recovery-rememberMeCheckbox', -5.939202308654785],
        ['recovery-troubleLink', 6.735955238342285],
        ['recovery-submitLogin', -5.16038179397583],
        ['recovery-pageRegister', -11.459251403808594],
        ['recovery-formTextRegister', -0.08657284080982208],
        ['recovery-formAttrsRegister', -11.422060012817383],
        ['recovery-headingsRegister', -4.167426586151123],
        ['recovery-layoutRegister', -8.92830753326416],
        ['recovery-pwNewRegister', -6.007083415985107],
        ['recovery-pwConfirmRegister', -6.0347442626953125],
        ['recovery-submitRegister', -7.169671535491943],
        ['recovery-TOSRef', -13.79799747467041],
        ['recovery-pagePwReset', 7.492627143859863],
        ['recovery-formTextPwReset', -6.504414081573486],
        ['recovery-formAttrsPwReset', 12.4937162399292],
        ['recovery-headingsPwReset', 13.230081558227539],
        ['recovery-layoutPwReset', 7.095366477966309],
        ['recovery-pageRecovery', 16.869586944580078],
        ['recovery-formTextRecovery', -0.07347393035888672],
        ['recovery-formAttrsRecovery', 21.972166061401367],
        ['recovery-headingsRecovery', 4.459465503692627],
        ['recovery-layoutRecovery', 1.7759681940078735],
        ['recovery-identifierRecovery', 16.220291137695312],
        ['recovery-submitRecovery', 16.720401763916016],
        ['recovery-formTextMFA', 0.062381140887737274],
        ['recovery-formAttrsMFA', 11.18996524810791],
        ['recovery-headingsMFA', -8.250007629394531],
        ['recovery-layoutMFA', -6.056315898895264],
        ['recovery-buttonVerify', 0.47779369354248047],
        ['recovery-inputsMFA', 6.236765384674072],
        ['recovery-inputsOTP', -0.49496951699256897],
        ['recovery-linkOTPOutlier', 0.3709350526332855],
        ['recovery-newsletterForm', -13.835336685180664],
        ['recovery-searchForm', -12.54694938659668],
        ['recovery-multiStepForm', 2.299872875213623],
        ['recovery-multiAuthForm', -6.186383247375488],
        ['recovery-visibleRatio,fieldsCount', 3.21638822555542],
        ['recovery-visibleRatio,identifierCount', 0.2898636758327484],
        ['recovery-visibleRatio,passwordCount', -8.785131454467773],
        ['recovery-visibleRatio,hiddenIdentifierCount', -12.68801498413086],
        ['recovery-visibleRatio,hiddenPasswordCount', -13.721454620361328],
        ['recovery-identifierRatio,fieldsCount', 6.283812522888184],
        ['recovery-identifierRatio,identifierCount', 0.9075475931167603],
        ['recovery-identifierRatio,passwordCount', -10.508017539978027],
        ['recovery-identifierRatio,hiddenIdentifierCount', -22.682842254638672],
        ['recovery-identifierRatio,hiddenPasswordCount', -14.301908493041992],
        ['recovery-passwordRatio,fieldsCount', -10.015974044799805],
        ['recovery-passwordRatio,identifierCount', -10.794465065002441],
        ['recovery-passwordRatio,passwordCount', -8.88046646118164],
        ['recovery-passwordRatio,hiddenIdentifierCount', -6.040380954742432],
        ['recovery-passwordRatio,hiddenPasswordCount', -6.092259883880615],
        ['recovery-requiredRatio,fieldsCount', 6.31121301651001],
        ['recovery-requiredRatio,identifierCount', 0.746566891670227],
        ['recovery-requiredRatio,passwordCount', -8.657540321350098],
        ['recovery-requiredRatio,hiddenIdentifierCount', 8.262990951538086],
        ['recovery-requiredRatio,hiddenPasswordCount', -10.362761497497559],
    ],
    bias: -3.955371618270874,
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
        ['mfa-fieldsCount', -2.544562816619873],
        ['mfa-inputCount', -1.635489821434021],
        ['mfa-fieldsetCount', 9.15323543548584],
        ['mfa-textCount', 6.08388614654541],
        ['mfa-textareaCount', -20.422948837280273],
        ['mfa-selectCount', -5.977659225463867],
        ['mfa-optionsCount', -6.083576679229736],
        ['mfa-radioCount', -6.028054237365723],
        ['mfa-identifierCount', -3.025423288345337],
        ['mfa-hiddenIdentifierCount', -2.5163726806640625],
        ['mfa-usernameCount', -3.538187026977539],
        ['mfa-emailCount', -6.115623950958252],
        ['mfa-hiddenCount', -0.3475402593612671],
        ['mfa-hiddenPasswordCount', -0.6551740169525146],
        ['mfa-submitCount', -3.5167934894561768],
        ['mfa-hasTels', 13.268797874450684],
        ['mfa-hasOAuth', -6.581116199493408],
        ['mfa-hasCaptchas', -2.8457343578338623],
        ['mfa-hasFiles', -6.042555809020996],
        ['mfa-hasDate', -6.0312581062316895],
        ['mfa-hasNumber', 12.872323036193848],
        ['mfa-oneVisibleField', 4.906072616577148],
        ['mfa-twoVisibleFields', -5.143502712249756],
        ['mfa-threeOrMoreVisibleFields', -0.8912911415100098],
        ['mfa-noPasswords', -4.544436454772949],
        ['mfa-onePassword', -5.397622108459473],
        ['mfa-twoPasswords', -6.0419535636901855],
        ['mfa-threeOrMorePasswords', -6.019688129425049],
        ['mfa-noIdentifiers', -7.481579303741455],
        ['mfa-oneIdentifier', -4.1370110511779785],
        ['mfa-twoIdentifiers', -0.5638031959533691],
        ['mfa-threeOrMoreIdentifiers', 4.148438930511475],
        ['mfa-autofocusedIsIdentifier', -4.205093860626221],
        ['mfa-autofocusedIsPassword', 8.008735656738281],
        ['mfa-visibleRatio', 1.8138145208358765],
        ['mfa-inputRatio', -5.020998477935791],
        ['mfa-hiddenRatio', 2.0538089275360107],
        ['mfa-identifierRatio', -2.8918755054473877],
        ['mfa-emailRatio', -5.604092597961426],
        ['mfa-usernameRatio', -4.459407806396484],
        ['mfa-passwordRatio', -5.6489739418029785],
        ['mfa-requiredRatio', 3.6790432929992676],
        ['mfa-checkboxRatio', 12.64542293548584],
        ['mfa-pageLogin', 4.655957221984863],
        ['mfa-formTextLogin', -6.007010459899902],
        ['mfa-formAttrsLogin', -1.5736005306243896],
        ['mfa-headingsLogin', -5.0391950607299805],
        ['mfa-layoutLogin', 1.0899221897125244],
        ['mfa-rememberMeCheckbox', 10.118618965148926],
        ['mfa-troubleLink', -3.4020960330963135],
        ['mfa-submitLogin', 2.015533208847046],
        ['mfa-pageRegister', -1.8170206546783447],
        ['mfa-formTextRegister', -0.05781705677509308],
        ['mfa-formAttrsRegister', -4.078064441680908],
        ['mfa-headingsRegister', -8.172782897949219],
        ['mfa-layoutRegister', -2.4134480953216553],
        ['mfa-pwNewRegister', -5.996033668518066],
        ['mfa-pwConfirmRegister', -5.920267105102539],
        ['mfa-submitRegister', -5.959743022918701],
        ['mfa-TOSRef', -2.984605550765991],
        ['mfa-pagePwReset', -6.025835990905762],
        ['mfa-formTextPwReset', -6.010921478271484],
        ['mfa-formAttrsPwReset', -5.936952114105225],
        ['mfa-headingsPwReset', -6.021554470062256],
        ['mfa-layoutPwReset', -5.983805179595947],
        ['mfa-pageRecovery', 2.3191850185394287],
        ['mfa-formTextRecovery', 0.07522324472665787],
        ['mfa-formAttrsRecovery', -6.058867931365967],
        ['mfa-headingsRecovery', -6.066012859344482],
        ['mfa-layoutRecovery', 2.5519537925720215],
        ['mfa-identifierRecovery', -6.0817437171936035],
        ['mfa-submitRecovery', 5.3210883140563965],
        ['mfa-formTextMFA', -0.024375438690185547],
        ['mfa-formAttrsMFA', 14.620351791381836],
        ['mfa-headingsMFA', 10.916263580322266],
        ['mfa-layoutMFA', 14.81666088104248],
        ['mfa-buttonVerify', 17.919843673706055],
        ['mfa-inputsMFA', 17.605487823486328],
        ['mfa-inputsOTP', 19.511211395263672],
        ['mfa-linkOTPOutlier', -0.4133373498916626],
        ['mfa-newsletterForm', -5.969015121459961],
        ['mfa-searchForm', -6.758202075958252],
        ['mfa-multiStepForm', 6.30035924911499],
        ['mfa-multiAuthForm', -5.995444297790527],
        ['mfa-visibleRatio,fieldsCount', 0.953558623790741],
        ['mfa-visibleRatio,identifierCount', -3.2152581214904785],
        ['mfa-visibleRatio,passwordCount', -4.810113906860352],
        ['mfa-visibleRatio,hiddenIdentifierCount', -6.3678789138793945],
        ['mfa-visibleRatio,hiddenPasswordCount', 0.11472829431295395],
        ['mfa-identifierRatio,fieldsCount', 0.0619293749332428],
        ['mfa-identifierRatio,identifierCount', -2.057779550552368],
        ['mfa-identifierRatio,passwordCount', -5.6595611572265625],
        ['mfa-identifierRatio,hiddenIdentifierCount', 1.149451732635498],
        ['mfa-identifierRatio,hiddenPasswordCount', 2.9197285175323486],
        ['mfa-passwordRatio,fieldsCount', -5.390740394592285],
        ['mfa-passwordRatio,identifierCount', -5.664175033569336],
        ['mfa-passwordRatio,passwordCount', -5.838875770568848],
        ['mfa-passwordRatio,hiddenIdentifierCount', -7.965145587921143],
        ['mfa-passwordRatio,hiddenPasswordCount', -5.933684349060059],
        ['mfa-requiredRatio,fieldsCount', -3.778599739074707],
        ['mfa-requiredRatio,identifierCount', -3.265744686126709],
        ['mfa-requiredRatio,passwordCount', -4.2468461990356445],
        ['mfa-requiredRatio,hiddenIdentifierCount', -6.021049499511719],
        ['mfa-requiredRatio,hiddenPasswordCount', -5.988615036010742],
    ],
    bias: -5.360292911529541,
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
        ['pw-loginScore', 12.739957809448242],
        ['pw-registerScore', -13.83711051940918],
        ['pw-pwChangeScore', 2.6888020038604736],
        ['pw-exotic', -10.913069725036621],
        ['pw-autocompleteNew', -2.9604105949401855],
        ['pw-autocompleteCurrent', 0.3228495419025421],
        ['pw-autocompleteOff', -6.219422817230225],
        ['pw-isOnlyPassword', 5.380703926086426],
        ['pw-prevPwField', 4.624813556671143],
        ['pw-nextPwField', -6.811601638793945],
        ['pw-attrCreate', -4.784603595733643],
        ['pw-attrCurrent', 2.9155373573303223],
        ['pw-attrConfirm', -7.224999904632568],
        ['pw-attrReset', -0.09489240497350693],
        ['pw-textCreate', -2.437514066696167],
        ['pw-textCurrent', 1.2711818218231201],
        ['pw-textConfirm', -7.38468074798584],
        ['pw-textReset', -0.05835674703121185],
        ['pw-labelCreate', -7.974427223205566],
        ['pw-labelCurrent', 13.942910194396973],
        ['pw-labelConfirm', -7.604363441467285],
        ['pw-labelReset', 0.17025385797023773],
        ['pw-prevPwCreate', -10.659224510192871],
        ['pw-prevPwCurrent', -13.258618354797363],
        ['pw-prevPwConfirm', 0.14202432334423065],
        ['pw-passwordOutlier', -7.739381313323975],
        ['pw-nextPwCreate', 13.943869590759277],
        ['pw-nextPwCurrent', -8.411789894104004],
        ['pw-nextPwConfirm', -8.085434913635254],
    ],
    bias: -4.577766418457031,
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
        ['pw[new]-loginScore', -11.068865776062012],
        ['pw[new]-registerScore', 13.990347862243652],
        ['pw[new]-pwChangeScore', 1.5684667825698853],
        ['pw[new]-exotic', 15.992005348205566],
        ['pw[new]-autocompleteNew', 1.2843233346939087],
        ['pw[new]-autocompleteCurrent', -0.654076874256134],
        ['pw[new]-autocompleteOff', -1.3254421949386597],
        ['pw[new]-isOnlyPassword', -2.009779214859009],
        ['pw[new]-prevPwField', 0.5926238298416138],
        ['pw[new]-nextPwField', 9.481810569763184],
        ['pw[new]-attrCreate', 3.600404977798462],
        ['pw[new]-attrCurrent', 1.0595051050186157],
        ['pw[new]-attrConfirm', 7.81159782409668],
        ['pw[new]-attrReset', 0.09859524667263031],
        ['pw[new]-textCreate', 1.3179728984832764],
        ['pw[new]-textCurrent', -1.2126917839050293],
        ['pw[new]-textConfirm', -15.896987915039062],
        ['pw[new]-textReset', -0.1468087136745453],
        ['pw[new]-labelCreate', 8.288077354431152],
        ['pw[new]-labelCurrent', -11.814041137695312],
        ['pw[new]-labelConfirm', 7.988063335418701],
        ['pw[new]-labelReset', -0.14673013985157013],
        ['pw[new]-prevPwCreate', 11.244683265686035],
        ['pw[new]-prevPwCurrent', 10.071718215942383],
        ['pw[new]-prevPwConfirm', 0.06218649446964264],
        ['pw[new]-passwordOutlier', -28.44277000427246],
        ['pw[new]-nextPwCreate', -12.942852973937988],
        ['pw[new]-nextPwCurrent', 8.51215934753418],
        ['pw[new]-nextPwConfirm', 10.324564933776855],
    ],
    bias: -3.3691680431365967,
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
        ['username-autocompleteUsername', 8.249536514282227],
        ['username-autocompleteNickname', -0.19547009468078613],
        ['username-autocompleteEmail', -6.63749361038208],
        ['username-autocompleteOff', -0.41384589672088623],
        ['username-attrUsername', 18.256254196166992],
        ['username-textUsername', 16.00668716430664],
        ['username-labelUsername', 17.579833984375],
        ['username-outlierUsername', -0.24868986010551453],
        ['username-loginUsername', 18.514404296875],
        ['username-searchField', -7.108214378356934],
    ],
    bias: -9.667710304260254,
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
        ['username[hidden]-exotic', -7.270430088043213],
        ['username[hidden]-attrUsername', 14.061312675476074],
        ['username[hidden]-attrEmail', 12.979175567626953],
        ['username[hidden]-usernameAttr', 16.32271957397461],
        ['username[hidden]-autocompleteUsername', 1.252109408378601],
        ['username[hidden]-visibleReadonly', 12.900712013244629],
        ['username[hidden]-hiddenEmailValue', 14.801158905029297],
        ['username[hidden]-hiddenTelValue', 6.699094295501709],
        ['username[hidden]-hiddenUsernameValue', -0.8359353542327881],
    ],
    bias: -20.659727096557617,
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
        ['email-autocompleteUsername', 1.1122764348983765],
        ['email-autocompleteNickname', -0.07430101931095123],
        ['email-autocompleteEmail', 5.919528484344482],
        ['email-typeEmail', 14.189041137695312],
        ['email-exactAttrEmail', 12.25171184539795],
        ['email-attrEmail', 2.476418972015381],
        ['email-textEmail', 13.441658020019531],
        ['email-labelEmail', 16.513750076293945],
        ['email-placeholderEmail', 13.652795791625977],
        ['email-searchField', -23.383142471313477],
    ],
    bias: -9.144218444824219,
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
        ['otp-mfaScore', 33.968162536621094],
        ['otp-exotic', -7.381203651428223],
        ['otp-linkOTPOutlier', -30.479320526123047],
        ['otp-hasCheckboxes', 7.426492214202881],
        ['otp-hidden', -0.05140963941812515],
        ['otp-required', -3.609832763671875],
        ['otp-nameMatch', 2.6111948490142822],
        ['otp-idMatch', 9.0510835647583],
        ['otp-numericMode', -8.096405029296875],
        ['otp-autofocused', 0.9923461675643921],
        ['otp-tabIndex1', 3.120621919631958],
        ['otp-patternOTP', 6.871208190917969],
        ['otp-maxLength1', 5.035065174102783],
        ['otp-maxLength5', -8.418095588684082],
        ['otp-minLength6', 15.580820083618164],
        ['otp-maxLength6', 8.499652862548828],
        ['otp-maxLength20', -0.9673820734024048],
        ['otp-autocompleteOTC', -0.04863691329956055],
        ['otp-autocompleteOff', -2.932197093963623],
        ['otp-prevAligned', -0.18011614680290222],
        ['otp-prevArea', -0.3314058184623718],
        ['otp-nextAligned', 0.11932329833507538],
        ['otp-nextArea', -0.000802947033662349],
        ['otp-attrMFA', 7.647372722625732],
        ['otp-attrOTP', 2.1019771099090576],
        ['otp-attrOutlier', -10.672264099121094],
        ['otp-textMFA', 6.636882305145264],
        ['otp-textOTP', -15.697175025939941],
        ['otp-labelMFA', -1.77126944065094],
        ['otp-labelOTP', -0.03413158655166626],
        ['otp-labelOutlier', -6.487143039703369],
        ['otp-wrapperOTP', 5.763751029968262],
        ['otp-wrapperOutlier', -6.2342352867126465],
        ['otp-emailOutlierCount', -18.55229377746582],
    ],
    bias: -11.901654243469238,
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
