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

const and =
    (...predicates) =>
    (value) =>
        predicates.every((pred) => pred(value));

const or =
    (...predicates) =>
    (value) =>
        predicates.some((pred) => pred(value));

const not = (predicate) => (value) => !predicate(value);

const any = (predicate) => (values) => values.some(predicate);

const closestParent = (start, match) => {
    const parent = start.parentElement;
    if (!parent) return null;
    return match(parent) ? parent : closestParent(parent, match);
};

const closest = (start, match, maxIterations = 1) => {
    const parent = start === null || start === void 0 ? void 0 : start.parentElement;
    if (!parent) return null;
    const result = match(parent);
    return result || maxIterations <= 0 ? result : closest(parent, match, maxIterations - 1);
};

const walkUpWhile = (start, maxIterations) => (check) => {
    const parent = start.parentElement;
    if (maxIterations <= 0 || parent === null) return start;
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
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel;
    const closestLabel = closest(el, (parent) => parent.querySelector('label'), 1);
    if (closestLabel) return closestLabel;
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

const isHidden = (el) => el.__PP_HIDDEN__ === true;

const flagAsHidden = (el) => (el.__PP_HIDDEN__ = true);

const removeHiddenFlag = (el) => delete el.__PP_HIDDEN__;

const attrIgnored = (el) => el.getAttribute('data-protonpass-ignore') !== null;

const isIgnored = (el) => el.__PP_SKIP__ === true;

const getIgnoredParent = (el) => (el ? closestParent(el, isIgnored) : null);

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

const getParentFormPrediction = (el) => (el ? closestParent(el, isPrediction) : null);

const TYPE_SEPARATOR = ',';

const SCORE_SEPARATOR = ':';

const setCachedPredictionScore = (_el, type, score) => {
    const el = _el;
    const currentType = el.__PP_TYPE__;
    const flag = `${type}${SCORE_SEPARATOR}${score.toFixed(2)}`;
    if (!currentType) {
        el.__PP_TYPE__ = flag;
        return;
    }
    const types = currentType.split(TYPE_SEPARATOR);
    const existingIndex = types.findIndex((pred) => pred.startsWith(type));
    if (existingIndex !== -1) types[existingIndex] = flag;
    else types.push(flag);
    el.__PP_TYPE__ = types.join(TYPE_SEPARATOR);
};

const getCachedPredictionScore = (type) => (fnode) => {
    const types = fnode.element.__PP_TYPE__;
    if (!types) return -1;
    const predForType = types.split(TYPE_SEPARATOR).find((pred) => pred.startsWith(type));
    if (!predForType) return -1;
    const [, scoreStr] = predForType.split(SCORE_SEPARATOR);
    const score = parseFloat(scoreStr);
    return Number.isFinite(score) ? score : -1;
};

const isPredictedType = (type) => (fnode) => getCachedPredictionScore(type)(fnode) !== -1;

const isClassifiable = (el) => !(isPrediction(el) || isIgnored(el) || attrIgnored(el));

const removeClassifierFlags = (el, options) => {
    removeProcessedFlag(el);
    removePredictionFlag(el);
    if (!options.preserveIgnored) removeIgnoredFlag(el);
    el.querySelectorAll(kFieldSelector).forEach((el) => removeClassifierFlags(el, options));
};

const LOGIN_RE =
    /(?:(?:n(?:ouvelleses|uevase|ewses)s|iniciarses|connex)io|anmeldedate|sign[io])n|in(?:iciarsessao|troduce)|a(?:uthenticate|nmeld(?:ung|en))|authentifier|s(?:econnect|identifi)er|novasessao|(?:introduci|conecta|entr[ae])r|prihlasit|connect|acceder|login/i;

const REGISTER_RE =
    /kontoerstellen|cr(?:ea(?:teaccount|rcuenta)|iarconta)|(?:nouveaucompt|creeruncompt|s?inscrir|unirs)e|re(?:gist(?:r(?:ieren|arse|ar)|er)|joindre)|nuevacuenta|getstarted|neueskonto|newaccount|novaconta|(?:com(?:mence|eca)|(?:empez|junt)a)r|signup|join/i;

const RECOVERY_RE =
    /(?:wiederherstell|zurucksetz)en|re(?:(?:initialis|stablec)er|(?:defini|staur[ae])r|c(?:uper[ae]|ove)r|set)|problem|(?:troubl|restor|aid)e|a[jy]uda|h(?:ilfe|elp)/i;

const MULTI_STEP_RE = /p(?:rogres(?:s(?:ion|o)|o)|aso)|fortschritt|progress|s(?:chritt|t(?:age|ep))|etap[ae]|phase/i;

const TROUBLE_RE =
    /schwierigkeit|(?:difficult|troubl|oubli|hilf)e|i(?:nciden(?:cia|t)|ssue)|vergessen|esquecido|olvidado|needhelp|questao|problem|forgot|ayuda/i;

const PASSWORD_RE =
    /p(?:hrasesecrete|ass(?:(?:phras|cod)e|wor[dt]))|(?:c(?:havesecret|lavesecret|ontrasen)|deseguranc)a|(?:(?:zugangs|secret)cod|clesecret)e|codesecret|motdepasse|geheimnis|secret|heslo|senha|key/i;

const PASSWORD_OUTLIER_RE = /socialsecurity|nationalid|userid/i;

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

const HIDDEN_ATTR_RE = /s(?:creenreade)?ronly|(?:move)?offscreen|(?:displaynon|a11yhid)e|\b((?:is)?hidden)\b/i;

const OAUTH_ATTR_RE = /facebook|twitch|google|apple/i;

const TOS_RE =
    /(?:datenschutzrichtlini|politicadeprivacidad|confidentialit|a(?:cknowledg|gre))e|nutzungsbedingungen|(?:consentimi?ent|ac(?:ue|o)rd)o|(?:einwillig|zustimm)ung|consentement|condi(?:cione|tion)s|term(?:osdeuso|inos|sof)|(?:privacida|understan)d|guideline|consent|p(?:riva|oli)cy|accord/i;

const MFA_RE =
    /(?:authentifizierung|doisfatore|doispasso)s|(?:auth(?:entication)?cod|securitycod|doubleetap)e|(?:authentication|generator)app|(?:(?:authentifica|doublefac)teu|(?:(?:authentifika|doblefac|zweifak|twofac)t|aut(?:henticat|enticad))o)r|verifica(?:c(?:ion|ao)|tion)|multifa(?:ct(?:eu|o)|k?to)r|zweischritte|generadora|doblepaso|2(?:s(?:chritte|tep)|(?:etap[ae]|paso)s|fa)|twostep/i;

const MFA_ATTR_RE =
    /phoneverification|(?:approvals|login)code|challenge|t(?:wo(?:fa(?:ctor)?|step)|facode)|2fa|\b([mt]fa)\b/i;

const OTP_ATTR_RE = /totp(?:pin)?|o(?:netime|t[cp])|1time/i;

const OTP_OUTLIER_RE =
    /n(?:(?:ue|o)vocodigo|ouveaucode|e(?:usenden|(?:uer|w)code))|re(?:enviar|send)|envoyer|senden|enviar|send/i;

const OTP_OUTLIER_ATTR_RE = /(?:phone(?:verification)?|email|tel)pin|email|sms/i;

const NEWSLETTER_RE = /newsletter|b(?:ul|o)letin|mailing/i;

const NEWSLETTER_ATTR_RE = /subscription|mailinglist|newsletter|emailform/i;

const IDENTITY_FULLNAME_ATTR_RE = /addresscontact|contactperson|addressname|yourname|fullname|\b(name)\b/i;

const IDENTITY_FIRSTNAME_ATTR_RE = /givenname|firstn(?:ame)?|\b(fname)\b/i;

const IDENTITY_MIDDLENAME_ATTR_RE = /additionalname|middlen(?:ame)?|\b(mname)\b/i;

const IDENTITY_LASTNAME_ATTR_RE = /familyn(?:ame)?|lastn(?:ame)?|surname|\b([ls]name)\b/i;

const IDENTITY_TELEPHONE_ATTR_RE = /(?:national|contact)number|tel(?:nation|loc)al|(?:tele)?phone|mobile|\b(tel)\b/i;

const IDENTITY_TELEPHONE_PREFIX_ATTR_RE = /co(?:untry|de)|prefix/i;

const IDENTITY_ADDRESS_ATTR_RE =
    /(?:preferred|street)address|address(?:line(?:one|[1s])|1)|mailingaddr|bill(?:ing)?addr|\b(mailaddr|addr(?:ess)?|street|line1)\b/i;

const IDENTITY_ADDRESS_LINES_ATTR_END_RE = /\b.*(?:line(?:t(?:hree|wo)|[23]))$/i;

const IDENTITY_STATE_ATTR_RE = /address(?:(?:provinc|stat)e|level1)|stateprovince|\b(province|county|region|state)\b/i;

const IDENTITY_CITY_ATTR_RE = /address(?:level2|town|city)|personalcity|\b((?:local|c)ity|town)\b/i;

const IDENTITY_ZIPCODE_ATTR_RE =
    /(?:address(?:postal|zip)|post)code|address(?:postal|zip)|postalcode|zipcode|\b(zip)\b/i;

const IDENTITY_ORGANIZATION_ATTR_RE = /organization(?:name)?|companyname|\b(organization)\b/i;

const IDENTITY_COUNTRY_ATTR_RE = /addresscountry(?:name)?|countryname|\b(country)\b/i;

const IDENTITY_COUNTRY_CODE_ATTR_RE = /countrycode/i;

const EMAIL_VALUE_RE = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,5}$/;

const TEL_VALUE_RE = /^[\d()+-]{6,25}$/;

const USERNAME_VALUE_RE = /^[\w\-\.]{7,30}$/;

const reSanityCheck = (cb, options) => (str) => {
    if (options.maxLength && str.length > options.maxLength) return false;
    if (options.minLength && str.length < options.minLength) return false;
    return cb(str);
};

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

const notRe = (reg, options) => (str) => !test(reg, options)(str);

const andRe = (reg, options) => and(...reg.map((re) => test(re, options)));

const orRe = (reg, options) => or(...reg.map((re) => test(re, options)));

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

const matchEmail = or(test(EMAIL_RE), matchEmailValue);

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

const matchPasswordReset = and(andRe([PASSWORD_RE, RESET_ACTION_RE]), notRe(CONFIRM_ACTION_RE));

const matchPasswordResetAttr = and(matchPasswordReset, notRe(CONFIRM_ACTION_ATTR_END_RE));

const matchPasswordCreate = and(andRe([PASSWORD_RE, CREATE_ACTION_RE]), notRe(CONFIRM_ACTION_RE));

const matchPasswordCreateAttr = and(matchPasswordCreate, notRe(CONFIRM_ACTION_ATTR_END_RE));

const matchPasswordConfirm = andRe([PASSWORD_RE, CONFIRM_ACTION_RE]);

const matchPasswordConfirmAttr = and(andRe([PASSWORD_RE, CONFIRM_ACTION_RE]), notRe(CREATE_ACTION_ATTR_END_RE));

const matchPasswordCurrent = and(andRe([PASSWORD_RE, CURRENT_VALUE_RE]), notRe(CONFIRM_ACTION_RE));

const matchPasswordCurrentAttr = and(matchPasswordCurrent, notRe(CONFIRM_ACTION_ATTR_END_RE));

const matchPasswordOutlier = test(PASSWORD_OUTLIER_RE);

const matchHidden = test(HIDDEN_ATTR_RE);

const matchMfa = test(MFA_RE);

const matchMfaAttr = test(MFA_ATTR_RE);

const matchOtpAttr = test(OTP_ATTR_RE);

const matchOtpOutlier = orRe([OTP_OUTLIER_ATTR_RE, OTP_OUTLIER_RE]);

const matchNewsletter = test(NEWSLETTER_RE);

orRe([NEWSLETTER_RE, NEWSLETTER_ATTR_RE]);

const matchFullName = and(test(IDENTITY_FULLNAME_ATTR_RE), (str) => !str.includes('[name]'));

const matchFirstName = test(IDENTITY_FIRSTNAME_ATTR_RE);

const matchMiddleName = test(IDENTITY_MIDDLENAME_ATTR_RE);

const matchLastName = test(IDENTITY_LASTNAME_ATTR_RE);

const matchTelephone = and(test(IDENTITY_TELEPHONE_ATTR_RE), notRe(IDENTITY_TELEPHONE_PREFIX_ATTR_RE));

const matchOrganization = test(IDENTITY_ORGANIZATION_ATTR_RE);

const matchCity = test(IDENTITY_CITY_ATTR_RE);

const matchZipCode = test(IDENTITY_ZIPCODE_ATTR_RE);

const matchState = test(IDENTITY_STATE_ATTR_RE);

const matchCountry = and(test(IDENTITY_COUNTRY_ATTR_RE), notRe(IDENTITY_COUNTRY_CODE_ATTR_RE));

const matchAddress = and(test(IDENTITY_ADDRESS_ATTR_RE), notRe(IDENTITY_ADDRESS_LINES_ATTR_END_RE));

const normalizeString = (str, allowedChars = '') =>
    str
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(new RegExp(`[^a-zA-Z0-9${allowedChars}]`, 'g'), '');

const sanitizeString = (str) => normalizeString(str, '\\[\\]');

const sanitizeStringWithSpaces = (str) => normalizeString(str, '\\s\\[\\]');

const cacheContext = {};

const getVisibilityCache = (key) => {
    var _a;
    return (cacheContext[key] = (_a = cacheContext[key]) !== null && _a !== void 0 ? _a : new WeakMap());
};

const clearVisibilityCache = () => Object.keys(cacheContext).forEach((key) => delete cacheContext[key]);

const SCROLLBAR_WIDTH = 16;

const getCachedVisbility = (el, options) => {
    var _a;
    const opacityCache = getVisibilityCache('visibility:op');
    const cache = getVisibilityCache('visibility');
    if (options.opacity) return (_a = opacityCache.get(el)) !== null && _a !== void 0 ? _a : cache.get(el);
    else return cache.get(el);
};

const setCachedVisibility = (cacheMap) => (els, visible) => els.forEach((el) => cacheMap.set(el, visible));

const containedInAncestor = (rect, ancestorRect) =>
    rect.top <= ancestorRect.bottom &&
    rect.bottom >= ancestorRect.top &&
    rect.left <= ancestorRect.right &&
    rect.right >= ancestorRect.left;

const isNegligibleRect = (rect) => rect.width <= 1 || rect.height <= 1;

const isVisible = (fnodeOrElement, options) => {
    const element = utils.toDomElement(fnodeOrElement);
    const seen = [];
    let transparent = false;
    const cache = getVisibilityCache(options.opacity ? 'visibility:op' : 'visibility');
    const cachedVisibility = getCachedVisbility(element, options);
    if (cachedVisibility !== undefined) return cachedVisibility;
    const win = utils.windowForElement(element);
    const doc = win.document;
    const viewportWidth = win.innerWidth || doc.documentElement.clientWidth;
    const viewportHeight = win.innerHeight || doc.documentElement.clientHeight;
    const scrollWidth = Math.max(viewportWidth, doc.documentElement.scrollWidth, doc.body.scrollWidth);
    const scrollHeight = Math.max(viewportHeight, doc.documentElement.scrollHeight, doc.body.scrollHeight);
    const { scrollX, scrollY } = win;
    const isOnScreen = ({ x, y, width, height }) => {
        const left = x + scrollX;
        const right = x + scrollX + width;
        const top = y + scrollY;
        const bottom = y + scrollY + height;
        return (
            right >= 0 && left <= scrollWidth - SCROLLBAR_WIDTH && bottom >= 0 && top <= scrollHeight - SCROLLBAR_WIDTH
        );
    };
    const check = () => {
        var _a;
        let prevRef = null;
        for (const ancestor of utils.ancestors(element)) {
            let rect = null;
            const getRect = () => (rect = rect !== null && rect !== void 0 ? rect : ancestor.getBoundingClientRect());
            if (ancestor === doc.body)
                return (prevRef === null || prevRef === void 0 ? void 0 : prevRef.absolute)
                    ? isOnScreen(prevRef.rect)
                    : true;
            const cachedVisibility = getCachedVisbility(ancestor, options);
            if (cachedVisibility !== undefined) return cachedVisibility;
            const { opacity, display, position, overflow, visibility } = win.getComputedStyle(ancestor);
            seen.push(ancestor);
            if (opacity === '0' && options.opacity) {
                transparent = true;
                return false;
            }
            if (visibility === 'hidden') return false;
            if (overflow === 'hidden') {
                if (
                    (prevRef === null || prevRef === void 0 ? void 0 : prevRef.rect) &&
                    !containedInAncestor(prevRef.rect, getRect())
                )
                    return false;
                if (isNegligibleRect(getRect())) return false;
            }
            if ((prevRef === null || prevRef === void 0 ? void 0 : prevRef.absolute) && position === 'static') {
                seen.pop();
                continue;
            }
            if (position === 'fixed')
                return isOnScreen(
                    (_a = prevRef === null || prevRef === void 0 ? void 0 : prevRef.rect) !== null && _a !== void 0
                        ? _a
                        : getRect()
                );
            if (display === 'contents') {
                prevRef = null;
                continue;
            }
            prevRef =
                prevRef !== null && prevRef !== void 0
                    ? prevRef
                    : {
                          rect: getRect(),
                      };
            prevRef.rect = getRect();
            prevRef.absolute = position === 'absolute';
            continue;
        }
        return true;
    };
    const visible = check();
    if (options.opacity) {
        if (visible || !transparent) setCachedVisibility(getVisibilityCache('visibility'))(seen, visible);
        else setCachedVisibility(getVisibilityCache('visibility'))(seen.slice(0, -1), visible);
    }
    setCachedVisibility(cache)(seen, visible);
    return visible;
};

const quickVisibilityCheck = (el, options) => {
    const cache = getVisibilityCache(`${options.minWidth}:${options.minHeight}`);
    if (cache.has(el)) return cache.get(el);
    const check = () => {
        const rect = el.getClientRects();
        if (rect.length === 0) return false;
        const classList = Array.from(el.classList).map(sanitizeStringWithSpaces);
        if (any(matchHidden)(classList)) return false;
        const { visibility, display, maxHeight } = getComputedStyle(el);
        if (visibility === 'hidden' || display === 'none' || maxHeight === '0px') return false;
        if (el.offsetHeight === 0 || el.offsetWidth === 0) return false;
        if (el.offsetHeight < options.minHeight || el.offsetWidth < options.minWidth) return false;
        return true;
    };
    const visible = check();
    setCachedVisibility(cache)([el], visible);
    return visible;
};

const isVisibleEl = (el) =>
    quickVisibilityCheck(el, {
        minHeight: 0,
        minWidth: 0,
    });

const isVisibleForm = (form) => {
    const visible = (() => {
        if (
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
    })();
    if (!visible) flagAsHidden(form);
    return visible;
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
        .map(sanitizeStringWithSpaces);

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

const getNodeAttributes = (node) => sanitizeStringWithSpaces(getBaseAttributes(node).join(''));

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

var FormType;

(function (FormType) {
    FormType['LOGIN'] = 'login';
    FormType['NOOP'] = 'noop';
    FormType['PASSWORD_CHANGE'] = 'password-change';
    FormType['RECOVERY'] = 'recovery';
    FormType['REGISTER'] = 'register';
})(FormType || (FormType = {}));

var FieldType;

(function (FieldType) {
    FieldType['EMAIL'] = 'email';
    FieldType['IDENTITY'] = 'identity';
    FieldType['OTP'] = 'otp';
    FieldType['PASSWORD_CURRENT'] = 'password';
    FieldType['PASSWORD_NEW'] = 'new-password';
    FieldType['USERNAME'] = 'username';
    FieldType['USERNAME_HIDDEN'] = 'username-hidden';
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
        if (!fnode.hasNoteFor(`${type}-prediction`)) {
            setCachedPredictionScore(fnode.element, type, getTypeScore(fnode, type));
        }
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

const typeScoreToleranceTest = (type) => (fnode) => fnode.scoreFor(type) > TOLERANCE_LEVEL;

const getTypeScore = (node, type) => {
    var _a;
    if (!node) return 0;
    if (node.hasNoteFor(`${type}-prediction`))
        return (_a = node.noteFor(`${type}-prediction`)) !== null && _a !== void 0 ? _a : 0;
    return node.scoreFor(type);
};

const outRuleWithCache = (candidateType, predictionType, typeScoreTest = typeScoreToleranceTest) => [
    rule(
        type(candidateType).when(isPredictedType(predictionType)),
        type(`${predictionType}-prediction`).note(getCachedPredictionScore(predictionType)),
        {}
    ),
    rule(type(predictionType).when(typeScoreTest(predictionType)), type(`${predictionType}-prediction`), {}),
    rule(type(`${predictionType}-prediction`), out(predictionType).through(typeEffect(predictionType)), {}),
];

const combineFeatures = (arr1, arr2) => arr1.flatMap((item1) => arr2.map((item2) => [item1, item2]));

const withFnodeEl = (fn) => (fnode) => fn(fnode.element);

const getFormClassification = (formFnode) => {
    const login = getTypeScore(formFnode, FormType.LOGIN) > 0.5;
    const register = getTypeScore(formFnode, FormType.REGISTER) > 0.5;
    const pwChange = getTypeScore(formFnode, FormType.PASSWORD_CHANGE) > 0.5;
    const recovery = getTypeScore(formFnode, FormType.RECOVERY) > 0.5;
    const detectionResults = [login, register, pwChange, recovery];
    const noop = detectionResults.every((detected) => !detected);
    return {
        login,
        register,
        pwChange,
        recovery,
        noop,
    };
};

const isNoopForm = (formFnode) => getFormClassification(formFnode).noop;

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

const fType = (types) => (fnode) => types.includes(fnode.element.type);

const fMatch = (selector) => (fnode) => fnode.element.matches(selector);

const fInputMode = (inputMode) => (fnode) => fnode.element.inputMode === inputMode;

const fActive = (fnode) => isActiveFieldFNode(fnode);

const fList = (fnode) =>
    fnode.element.getAttribute('aria-autocomplete') === 'list' || fnode.element.role === 'combobox';

const maybeEmail = and(not(fList), or(fType(['email', 'text']), fInputMode('email')), fActive);

const maybePassword = and(fMatch(kPasswordSelector), fActive);

const maybeOTP = and(not(fList), fMatch(otpSelector), fActive);

const maybeUsername = and(
    not(fList),
    or(and(not(fInputMode('email')), fType(['text', 'tel'])), fMatch(kUsernameSelector)),
    fActive
);

const maybeHiddenUsername = and(not(fList), fType(['email', 'text', 'hidden']), not(fActive));

const isUsernameCandidate = (el) => !el.matches('input[type="email"]') && any(matchUsername)(getAllFieldHaystacks(el));

const isEmailCandidate = (el) => el.matches('input[type="email"]') || any(matchEmail)(getAllFieldHaystacks(el));

const isOAuthCandidate = (el) => any(matchOAuth)(getAllFieldHaystacks(el));

const isBtnCandidate = (btn) => {
    if (btn.getAttribute('type') === 'submit') return true;
    if (btn.innerText.trim().length <= 1) return false;
    const height = btn.offsetHeight;
    const width = btn.offsetWidth;
    return height * width > MIN_AREA_SUBMIT_BTN;
};

const isProcessableField = (input) => {
    const processed = isProcessed(input);
    const hidden = isHidden(input);
    return (
        (!processed || hidden) &&
        isVisibleField(input) &&
        isVisible(input, {
            opacity: false,
        })
    );
};

const isClassifiableField = (fnode) => isClassifiable(fnode.element) && getParentFormFnode(fnode) !== null;

const selectInputCandidates = (target = document) =>
    Array.from(target.querySelectorAll(inputCandidateSelector)).filter(isClassifiable);

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
    return candidates.filter((form) => !isIgnored(form) && !attrIgnored(form));
};

const { linearScale } = utils;

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
    const btnsTypeSubmit = btns.filter((el) => el.matches('[type="submit"]'));
    const candidateBtns = btns.filter(isBtnCandidate);
    const submitBtns = btnsTypeSubmit.length > 0 ? btnsTypeSubmit : candidateBtns;
    const anchors = Array.from(form.querySelectorAll(kAnchorLinkSelector)).filter(isVisibleEl);
    const oauths = socialEls.concat(candidateBtns).filter(isOAuthCandidate);
    const layouts = Array.from(form.querySelectorAll(kLayoutSelector));
    const autofocusedIsIdentifier = Boolean(autofocused && identifiers.includes(autofocused));
    const autofocusedIsPassword = Boolean(autofocused && passwords.includes(autofocused));
    const pageDescriptionText = getPageDescriptionText(doc);
    const nearestHeadingsText = getNearestHeadingsText(form);
    const formTextAttrText = getFormText(form);
    const formAttributes = getFormAttributes(form);
    const pwHaystack = pws.flatMap(getAllFieldHaystacks);
    const identifierHaystack = identifiers.flatMap(getAllFieldHaystacks);
    const btnHaystack = candidateBtns.flatMap(getAllFieldHaystacks);
    const submitBtnHaystack = submitBtns.flatMap(getAllFieldHaystacks);
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
    const inputsMFA = any(matchMfaAttr)(mfaInputsHaystack);
    const inputsOTP = any(matchOtpAttr)(mfaInputsHaystack);
    const formTextMFA = matchMfa(formTextAttrText.concat(nearestHeadingsText));
    const formAttrsMFA = any(matchMfaAttr)(formAttributes);
    const formOTPOutlier = any(matchOtpOutlier)(formAttributes);
    const linkOTPOutlier = any(matchOtpOutlier)(anchorsHaystack.concat(btnHaystack));
    const newsletterForm = any(matchNewsletter)(outlierHaystack);
    const searchForm = any(matchSearchAction)(outlierHaystack);
    const buttonMultiStep = any(matchStepAction)(submitBtnHaystack);
    const headingsMultiStep = matchMultiStep(nearestHeadingsText);
    return {
        fieldsCount: linearScale(visibleFields.length, 1, 5),
        inputCount: linearScale(visibleInputs.length, 1, 5),
        fieldsetCount: linearScale(fieldsets.length, 1, 5),
        textCount: linearScale(texts.length, 0, 3),
        textareaCount: linearScale(textareas.length, 0, 2),
        selectCount: linearScale(selects.length, 0, 2),
        optionsCount: linearScale(optionsCount, 0, 5),
        checkboxCount: linearScale(checkboxes.length, 0, 2),
        radioCount: linearScale(radios.length, 0, 5),
        identifierCount: linearScale(identifiers.length, 0, 2),
        hiddenIdentifierCount: linearScale(hiddenIdentifiers.length, 0, 2),
        hiddenCount: linearScale(hidden.length, 0, 5),
        passwordCount: linearScale(passwords.length, 0, 2),
        hiddenPasswordCount: linearScale(hiddenPasswords.length, 0, 2),
        usernameCount: linearScale(usernames.length, 0, 2),
        emailCount: linearScale(emails.length, 0, 2),
        submitCount: linearScale(submits.length, 0, 2),
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
        visibleInputsCount: safeInt(visibleInputs.length),
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
        formMFA: boolInt(formTextMFA || formAttrsMFA),
        formTextMFA: boolInt(formTextMFA),
        formAttrsMFA: boolInt(formAttrsMFA),
        formOTPOutlier: boolInt(formOTPOutlier),
        linkOTPOutlier: boolInt(linkOTPOutlier),
        inputsMFA: boolInt(inputsMFA),
        inputsOTP: boolInt(inputsOTP),
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
    'inputsMFA',
    'inputsOTP',
    'newsletterForm',
    'searchForm',
    'multiStepForm',
    'multiAuthForm',
];

const FORM_COMBINED_FEATURES = [
    ...FORM_FEATURES,
    ...combineFeatures(
        ['visibleRatio', 'identifierRatio', 'passwordRatio', 'requiredRatio'],
        [
            'fieldsCount',
            'identifierCount',
            'passwordCount',
            'hiddenIdentifierCount',
            'hiddenPasswordCount',
            'multiStepForm',
        ]
    ),
];

const results$9 = {
    coeffs: [
        ['login-fieldsCount', 7.167146682739258],
        ['login-inputCount', 3.7743349075317383],
        ['login-fieldsetCount', -19.668621063232422],
        ['login-textCount', -10.44151782989502],
        ['login-textareaCount', -6.036571025848389],
        ['login-selectCount', -6.2117767333984375],
        ['login-optionsCount', -6.1895647048950195],
        ['login-radioCount', -6.0006890296936035],
        ['login-identifierCount', -2.997849225997925],
        ['login-hiddenIdentifierCount', 8.058938026428223],
        ['login-usernameCount', 2.0050694942474365],
        ['login-emailCount', -9.847891807556152],
        ['login-hiddenCount', 5.802109241485596],
        ['login-hiddenPasswordCount', 9.463436126708984],
        ['login-submitCount', -2.4706923961639404],
        ['login-hasTels', -6.492319107055664],
        ['login-hasOAuth', 6.337643623352051],
        ['login-hasCaptchas', 3.052582263946533],
        ['login-hasFiles', -6.015785217285156],
        ['login-hasDate', -19.1082706451416],
        ['login-hasNumber', -6.109776973724365],
        ['login-oneVisibleField', 5.8721418380737305],
        ['login-twoVisibleFields', 7.6295166015625],
        ['login-threeOrMoreVisibleFields', -1.4597933292388916],
        ['login-noPasswords', -13.256819725036621],
        ['login-onePassword', 10.233048439025879],
        ['login-twoPasswords', -12.263589859008789],
        ['login-threeOrMorePasswords', -6.061360836029053],
        ['login-noIdentifiers', -9.274943351745605],
        ['login-oneIdentifier', -2.1087942123413086],
        ['login-twoIdentifiers', -2.278709888458252],
        ['login-threeOrMoreIdentifiers', -8.637213706970215],
        ['login-autofocusedIsIdentifier', 8.694189071655273],
        ['login-autofocusedIsPassword', 14.97588062286377],
        ['login-visibleRatio', 7.659941673278809],
        ['login-inputRatio', -4.783163070678711],
        ['login-hiddenRatio', -5.862645149230957],
        ['login-identifierRatio', 10.29220199584961],
        ['login-emailRatio', 1.5556299686431885],
        ['login-usernameRatio', -7.604471683502197],
        ['login-passwordRatio', -1.2910985946655273],
        ['login-requiredRatio', 1.5573618412017822],
        ['login-checkboxRatio', 26.815109252929688],
        ['login-pageLogin', 14.147826194763184],
        ['login-formTextLogin', 8.312342643737793],
        ['login-formAttrsLogin', 2.0472633838653564],
        ['login-headingsLogin', 13.913389205932617],
        ['login-layoutLogin', 0.2521330416202545],
        ['login-rememberMeCheckbox', 8.166378021240234],
        ['login-troubleLink', 12.31041145324707],
        ['login-submitLogin', 13.914986610412598],
        ['login-pageRegister', -13.970909118652344],
        ['login-formTextRegister', -0.029135406017303467],
        ['login-formAttrsRegister', -19.318700790405273],
        ['login-headingsRegister', -10.672750473022461],
        ['login-layoutRegister', -2.445223331451416],
        ['login-pwNewRegister', -17.599233627319336],
        ['login-pwConfirmRegister', -12.271825790405273],
        ['login-submitRegister', -12.232919692993164],
        ['login-TOSRef', -5.756188869476318],
        ['login-pagePwReset', -10.373188018798828],
        ['login-formTextPwReset', -5.9868669509887695],
        ['login-formAttrsPwReset', -11.624041557312012],
        ['login-headingsPwReset', -12.544187545776367],
        ['login-layoutPwReset', -3.2486376762390137],
        ['login-pageRecovery', 0.17004932463169098],
        ['login-formTextRecovery', 0.08492819219827652],
        ['login-formAttrsRecovery', -22.73809051513672],
        ['login-headingsRecovery', -10.622419357299805],
        ['login-layoutRecovery', 5.587097644805908],
        ['login-identifierRecovery', 4.285861968994141],
        ['login-submitRecovery', -12.429203987121582],
        ['login-formTextMFA', -14.686058044433594],
        ['login-formAttrsMFA', -19.80980682373047],
        ['login-inputsMFA', -19.8371639251709],
        ['login-inputsOTP', -16.768272399902344],
        ['login-newsletterForm', -9.054252624511719],
        ['login-searchForm', -6.658482074737549],
        ['login-multiStepForm', -1.83180832862854],
        ['login-multiAuthForm', 15.086395263671875],
        ['login-visibleRatio,fieldsCount', -7.011424541473389],
        ['login-visibleRatio,identifierCount', -11.46633243560791],
        ['login-visibleRatio,passwordCount', 13.935803413391113],
        ['login-visibleRatio,hiddenIdentifierCount', -4.581971645355225],
        ['login-visibleRatio,hiddenPasswordCount', -12.718472480773926],
        ['login-visibleRatio,multiStepForm', 5.5024733543396],
        ['login-identifierRatio,fieldsCount', -21.286340713500977],
        ['login-identifierRatio,identifierCount', 9.158336639404297],
        ['login-identifierRatio,passwordCount', -8.970537185668945],
        ['login-identifierRatio,hiddenIdentifierCount', -2.154344081878662],
        ['login-identifierRatio,hiddenPasswordCount', 16.531700134277344],
        ['login-identifierRatio,multiStepForm', 11.330455780029297],
        ['login-passwordRatio,fieldsCount', 12.869614601135254],
        ['login-passwordRatio,identifierCount', -8.79238510131836],
        ['login-passwordRatio,passwordCount', -3.4946510791778564],
        ['login-passwordRatio,hiddenIdentifierCount', 21.798233032226562],
        ['login-passwordRatio,hiddenPasswordCount', 34.564979553222656],
        ['login-passwordRatio,multiStepForm', -12.678118705749512],
        ['login-requiredRatio,fieldsCount', 13.545104026794434],
        ['login-requiredRatio,identifierCount', -5.675007343292236],
        ['login-requiredRatio,passwordCount', 9.593323707580566],
        ['login-requiredRatio,hiddenIdentifierCount', -21.264158248901367],
        ['login-requiredRatio,hiddenPasswordCount', 17.53164291381836],
        ['login-requiredRatio,multiStepForm', 15.075560569763184],
    ],
    bias: -6.3323235511779785,
    cutoff: 0.49,
};

const login = {
    name: FormType.LOGIN,
    coeffs: FORM_COMBINED_FEATURES.map((feat) => {
        var _a, _b;
        return [
            `login-${feat}`,
            (_b =
                (_a = results$9.coeffs.find(([feature]) => feature === `login-${feat}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$9.bias,
    cutoff: results$9.cutoff,
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

const results$8 = {
    coeffs: [
        ['pw-change-fieldsCount', -3.3809263706207275],
        ['pw-change-inputCount', -3.1277501583099365],
        ['pw-change-fieldsetCount', -6.10205602645874],
        ['pw-change-textCount', -6.030473709106445],
        ['pw-change-textareaCount', -6.035557270050049],
        ['pw-change-selectCount', -6.00916862487793],
        ['pw-change-optionsCount', -5.979971885681152],
        ['pw-change-radioCount', -6.01702356338501],
        ['pw-change-identifierCount', -5.486696720123291],
        ['pw-change-hiddenIdentifierCount', -4.443164825439453],
        ['pw-change-usernameCount', -6.045909404754639],
        ['pw-change-emailCount', -4.870093822479248],
        ['pw-change-hiddenCount', -3.410625457763672],
        ['pw-change-hiddenPasswordCount', -5.98894739151001],
        ['pw-change-submitCount', -3.9626827239990234],
        ['pw-change-hasTels', -5.928023338317871],
        ['pw-change-hasOAuth', -6.027510166168213],
        ['pw-change-hasCaptchas', -5.95013427734375],
        ['pw-change-hasFiles', -6.069545269012451],
        ['pw-change-hasDate', -6.06043815612793],
        ['pw-change-hasNumber', -8.979818344116211],
        ['pw-change-oneVisibleField', -5.574887752532959],
        ['pw-change-twoVisibleFields', -3.293182611465454],
        ['pw-change-threeOrMoreVisibleFields', -1.8784431219100952],
        ['pw-change-noPasswords', -5.967793941497803],
        ['pw-change-onePassword', -5.395130634307861],
        ['pw-change-twoPasswords', 7.605116844177246],
        ['pw-change-threeOrMorePasswords', 22.51252555847168],
        ['pw-change-noIdentifiers', -2.652466297149658],
        ['pw-change-oneIdentifier', -6.056519031524658],
        ['pw-change-twoIdentifiers', -6.059515953063965],
        ['pw-change-threeOrMoreIdentifiers', 1.4755604267120361],
        ['pw-change-autofocusedIsIdentifier', -5.935357570648193],
        ['pw-change-autofocusedIsPassword', 15.837705612182617],
        ['pw-change-visibleRatio', -4.02976131439209],
        ['pw-change-inputRatio', -4.1580095291137695],
        ['pw-change-hiddenRatio', -3.6690847873687744],
        ['pw-change-identifierRatio', -5.808073043823242],
        ['pw-change-emailRatio', -5.231339454650879],
        ['pw-change-usernameRatio', -6.101770877838135],
        ['pw-change-passwordRatio', 4.156726360321045],
        ['pw-change-requiredRatio', -2.736117362976074],
        ['pw-change-checkboxRatio', -6.0688066482543945],
        ['pw-change-pageLogin', -6.149713516235352],
        ['pw-change-formTextLogin', -6.04823112487793],
        ['pw-change-formAttrsLogin', -6.004699230194092],
        ['pw-change-headingsLogin', -5.936070919036865],
        ['pw-change-layoutLogin', -6.221706867218018],
        ['pw-change-rememberMeCheckbox', -5.971604347229004],
        ['pw-change-troubleLink', -3.7774603366851807],
        ['pw-change-submitLogin', -6.1778693199157715],
        ['pw-change-pageRegister', -6.033801555633545],
        ['pw-change-formTextRegister', -0.002049177885055542],
        ['pw-change-formAttrsRegister', -5.9403533935546875],
        ['pw-change-headingsRegister', -6.406411647796631],
        ['pw-change-layoutRegister', -5.97374153137207],
        ['pw-change-pwNewRegister', 13.134254455566406],
        ['pw-change-pwConfirmRegister', 7.411303520202637],
        ['pw-change-submitRegister', -7.1263651847839355],
        ['pw-change-TOSRef', -6.786911487579346],
        ['pw-change-pagePwReset', 15.328141212463379],
        ['pw-change-formTextPwReset', 23.657779693603516],
        ['pw-change-formAttrsPwReset', 14.526533126831055],
        ['pw-change-headingsPwReset', 18.355791091918945],
        ['pw-change-layoutPwReset', 17.324661254882812],
        ['pw-change-pageRecovery', -5.999022006988525],
        ['pw-change-formTextRecovery', -0.027839645743370056],
        ['pw-change-formAttrsRecovery', -5.98990535736084],
        ['pw-change-headingsRecovery', -3.6077163219451904],
        ['pw-change-layoutRecovery', -4.098057270050049],
        ['pw-change-identifierRecovery', -5.963034629821777],
        ['pw-change-submitRecovery', 3.3104186058044434],
        ['pw-change-formTextMFA', -5.979908466339111],
        ['pw-change-formAttrsMFA', -6.1019206047058105],
        ['pw-change-inputsMFA', -5.930591583251953],
        ['pw-change-inputsOTP', -6.032792091369629],
        ['pw-change-newsletterForm', -5.945498466491699],
        ['pw-change-searchForm', -6.028439044952393],
        ['pw-change-multiStepForm', -5.9145050048828125],
        ['pw-change-multiAuthForm', -6.000322341918945],
        ['pw-change-visibleRatio,fieldsCount', -3.446410894393921],
        ['pw-change-visibleRatio,identifierCount', -5.776082992553711],
        ['pw-change-visibleRatio,passwordCount', 3.2504262924194336],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -2.2261788845062256],
        ['pw-change-visibleRatio,hiddenPasswordCount', -5.956650733947754],
        ['pw-change-visibleRatio,multiStepForm', -6.010085105895996],
        ['pw-change-identifierRatio,fieldsCount', -4.593516826629639],
        ['pw-change-identifierRatio,identifierCount', -5.429786205291748],
        ['pw-change-identifierRatio,passwordCount', -4.405040264129639],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -6.026313781738281],
        ['pw-change-identifierRatio,hiddenPasswordCount', -5.961729526519775],
        ['pw-change-identifierRatio,multiStepForm', -5.920186519622803],
        ['pw-change-passwordRatio,fieldsCount', 5.4826812744140625],
        ['pw-change-passwordRatio,identifierCount', -4.338562965393066],
        ['pw-change-passwordRatio,passwordCount', 9.109149932861328],
        ['pw-change-passwordRatio,hiddenIdentifierCount', 0.1481127142906189],
        ['pw-change-passwordRatio,hiddenPasswordCount', -5.9953227043151855],
        ['pw-change-passwordRatio,multiStepForm', -6.02192497253418],
        ['pw-change-requiredRatio,fieldsCount', -4.002516746520996],
        ['pw-change-requiredRatio,identifierCount', -5.922187805175781],
        ['pw-change-requiredRatio,passwordCount', 3.6439921855926514],
        ['pw-change-requiredRatio,hiddenIdentifierCount', 0.0023303914349526167],
        ['pw-change-requiredRatio,hiddenPasswordCount', -5.924592018127441],
        ['pw-change-requiredRatio,multiStepForm', -6.043758392333984],
    ],
    bias: -4.281217575073242,
    cutoff: 1,
};

const passwordChange = {
    name: FormType.PASSWORD_CHANGE,
    coeffs: FORM_COMBINED_FEATURES.map((key) => {
        var _a, _b;
        return [
            `pw-change-${key}`,
            (_b =
                (_a = results$8.coeffs.find(([feature]) => feature === `pw-change-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$8.bias,
    cutoff: results$8.cutoff,
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

const results$7 = {
    coeffs: [
        ['recovery-fieldsCount', 5.613603115081787],
        ['recovery-inputCount', 4.155726432800293],
        ['recovery-fieldsetCount', 5.250283241271973],
        ['recovery-textCount', -2.1982674598693848],
        ['recovery-textareaCount', -12.159770965576172],
        ['recovery-selectCount', -7.300044536590576],
        ['recovery-optionsCount', -7.502495288848877],
        ['recovery-radioCount', -5.921194076538086],
        ['recovery-identifierCount', 0.4908513128757477],
        ['recovery-hiddenIdentifierCount', -14.038566589355469],
        ['recovery-usernameCount', 7.272862911224365],
        ['recovery-emailCount', 0.0742768943309784],
        ['recovery-hiddenCount', 6.994524955749512],
        ['recovery-hiddenPasswordCount', -10.524628639221191],
        ['recovery-submitCount', 16.943256378173828],
        ['recovery-hasTels', -2.269686698913574],
        ['recovery-hasOAuth', -14.258925437927246],
        ['recovery-hasCaptchas', 4.739481449127197],
        ['recovery-hasFiles', -22.373167037963867],
        ['recovery-hasDate', -6.054858207702637],
        ['recovery-hasNumber', -6.100506782531738],
        ['recovery-oneVisibleField', -4.2369465827941895],
        ['recovery-twoVisibleFields', -4.4915900230407715],
        ['recovery-threeOrMoreVisibleFields', 1.6071919202804565],
        ['recovery-noPasswords', -2.0074775218963623],
        ['recovery-onePassword', -11.927130699157715],
        ['recovery-twoPasswords', -6.3364481925964355],
        ['recovery-threeOrMorePasswords', -6.093911647796631],
        ['recovery-noIdentifiers', -12.928533554077148],
        ['recovery-oneIdentifier', 2.3243868350982666],
        ['recovery-twoIdentifiers', -3.7820167541503906],
        ['recovery-threeOrMoreIdentifiers', -8.110208511352539],
        ['recovery-autofocusedIsIdentifier', 1.1493083238601685],
        ['recovery-autofocusedIsPassword', -5.980759620666504],
        ['recovery-visibleRatio', 1.6392390727996826],
        ['recovery-inputRatio', -6.751960754394531],
        ['recovery-hiddenRatio', -1.5771023035049438],
        ['recovery-identifierRatio', 1.740364909172058],
        ['recovery-emailRatio', 0.6909741163253784],
        ['recovery-usernameRatio', 7.523598670959473],
        ['recovery-passwordRatio', -10.133199691772461],
        ['recovery-requiredRatio', -1.7164517641067505],
        ['recovery-checkboxRatio', -6.0642266273498535],
        ['recovery-pageLogin', -2.5376620292663574],
        ['recovery-formTextLogin', -6.016737937927246],
        ['recovery-formAttrsLogin', -0.1911991387605667],
        ['recovery-headingsLogin', 6.437591075897217],
        ['recovery-layoutLogin', -11.908319473266602],
        ['recovery-rememberMeCheckbox', -5.992555618286133],
        ['recovery-troubleLink', 8.295344352722168],
        ['recovery-submitLogin', -5.8815131187438965],
        ['recovery-pageRegister', -10.93452262878418],
        ['recovery-formTextRegister', -0.015407174825668335],
        ['recovery-formAttrsRegister', -8.320123672485352],
        ['recovery-headingsRegister', -8.491991996765137],
        ['recovery-layoutRegister', -10.729426383972168],
        ['recovery-pwNewRegister', -6.0533294677734375],
        ['recovery-pwConfirmRegister', -5.959406852722168],
        ['recovery-submitRegister', -6.65123987197876],
        ['recovery-TOSRef', -16.630971908569336],
        ['recovery-pagePwReset', 8.896230697631836],
        ['recovery-formTextPwReset', -6.769909858703613],
        ['recovery-formAttrsPwReset', 3.904691696166992],
        ['recovery-headingsPwReset', 7.513852119445801],
        ['recovery-layoutPwReset', 7.776735305786133],
        ['recovery-pageRecovery', 15.508672714233398],
        ['recovery-formTextRecovery', 0.08142692595720291],
        ['recovery-formAttrsRecovery', 15.852108001708984],
        ['recovery-headingsRecovery', 10.129376411437988],
        ['recovery-layoutRecovery', 0.813812792301178],
        ['recovery-identifierRecovery', 17.160966873168945],
        ['recovery-submitRecovery', 17.290061950683594],
        ['recovery-formTextMFA', -1.5049338340759277],
        ['recovery-formAttrsMFA', 12.685754776000977],
        ['recovery-inputsMFA', -14.735794067382812],
        ['recovery-inputsOTP', -8.237467765808105],
        ['recovery-newsletterForm', -12.157657623291016],
        ['recovery-searchForm', -10.873307228088379],
        ['recovery-multiStepForm', 4.163763046264648],
        ['recovery-multiAuthForm', -6.4468674659729],
        ['recovery-visibleRatio,fieldsCount', -2.4433367252349854],
        ['recovery-visibleRatio,identifierCount', -0.6125858426094055],
        ['recovery-visibleRatio,passwordCount', -8.803550720214844],
        ['recovery-visibleRatio,hiddenIdentifierCount', -7.8773603439331055],
        ['recovery-visibleRatio,hiddenPasswordCount', -14.82009506225586],
        ['recovery-visibleRatio,multiStepForm', 1.910726547241211],
        ['recovery-identifierRatio,fieldsCount', 1.5550788640975952],
        ['recovery-identifierRatio,identifierCount', 3.6244068145751953],
        ['recovery-identifierRatio,passwordCount', -11.575698852539062],
        ['recovery-identifierRatio,hiddenIdentifierCount', -18.6844425201416],
        ['recovery-identifierRatio,hiddenPasswordCount', -16.219568252563477],
        ['recovery-identifierRatio,multiStepForm', -0.36277127265930176],
        ['recovery-passwordRatio,fieldsCount', -11.305088996887207],
        ['recovery-passwordRatio,identifierCount', -11.810965538024902],
        ['recovery-passwordRatio,passwordCount', -9.381779670715332],
        ['recovery-passwordRatio,hiddenIdentifierCount', -6.106698036193848],
        ['recovery-passwordRatio,hiddenPasswordCount', -6.067366123199463],
        ['recovery-passwordRatio,multiStepForm', -6.351515293121338],
        ['recovery-requiredRatio,fieldsCount', -22.309520721435547],
        ['recovery-requiredRatio,identifierCount', 2.183687686920166],
        ['recovery-requiredRatio,passwordCount', -6.2800726890563965],
        ['recovery-requiredRatio,hiddenIdentifierCount', 25.015764236450195],
        ['recovery-requiredRatio,hiddenPasswordCount', -11.183259010314941],
        ['recovery-requiredRatio,multiStepForm', -9.745171546936035],
    ],
    bias: -5.638995170593262,
    cutoff: 0.49,
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
        ['register-fieldsCount', 12.152952194213867],
        ['register-inputCount', 11.352153778076172],
        ['register-fieldsetCount', 7.691730499267578],
        ['register-textCount', 4.895721435546875],
        ['register-textareaCount', 4.292281627655029],
        ['register-selectCount', -5.840476989746094],
        ['register-optionsCount', 4.604709625244141],
        ['register-radioCount', -1.1720232963562012],
        ['register-identifierCount', -3.0425169467926025],
        ['register-hiddenIdentifierCount', 18.337160110473633],
        ['register-usernameCount', -6.6267266273498535],
        ['register-emailCount', -7.300809383392334],
        ['register-hiddenCount', -17.762174606323242],
        ['register-hiddenPasswordCount', -15.548566818237305],
        ['register-submitCount', 7.093825340270996],
        ['register-hasTels', -7.161774635314941],
        ['register-hasOAuth', 3.947859287261963],
        ['register-hasCaptchas', 6.877015590667725],
        ['register-hasFiles', -6.369163513183594],
        ['register-hasDate', 10.282831192016602],
        ['register-hasNumber', 18.44855499267578],
        ['register-oneVisibleField', -1.2193869352340698],
        ['register-twoVisibleFields', 8.623381614685059],
        ['register-threeOrMoreVisibleFields', 5.080740928649902],
        ['register-noPasswords', -12.650031089782715],
        ['register-onePassword', -4.703586578369141],
        ['register-twoPasswords', 26.14938735961914],
        ['register-threeOrMorePasswords', -12.7553071975708],
        ['register-noIdentifiers', -10.78227710723877],
        ['register-oneIdentifier', -3.1472182273864746],
        ['register-twoIdentifiers', 3.7526700496673584],
        ['register-threeOrMoreIdentifiers', -11.72402572631836],
        ['register-autofocusedIsIdentifier', -1.7431814670562744],
        ['register-autofocusedIsPassword', 29.418352127075195],
        ['register-visibleRatio', 4.845757484436035],
        ['register-inputRatio', -7.652520179748535],
        ['register-hiddenRatio', 19.72456169128418],
        ['register-identifierRatio', 13.6694917678833],
        ['register-emailRatio', -5.617606163024902],
        ['register-usernameRatio', -1.7644928693771362],
        ['register-passwordRatio', -11.950482368469238],
        ['register-requiredRatio', -5.935697078704834],
        ['register-checkboxRatio', -27.763769149780273],
        ['register-pageLogin', -7.4340291023254395],
        ['register-formTextLogin', -6.100903034210205],
        ['register-formAttrsLogin', -0.8429033756256104],
        ['register-headingsLogin', -7.129387378692627],
        ['register-layoutLogin', 8.54798412322998],
        ['register-rememberMeCheckbox', -11.715625762939453],
        ['register-troubleLink', -13.777667045593262],
        ['register-submitLogin', -5.15095853805542],
        ['register-pageRegister', 14.205588340759277],
        ['register-formTextRegister', -0.006929077208042145],
        ['register-formAttrsRegister', 3.9156627655029297],
        ['register-headingsRegister', 12.97982406616211],
        ['register-layoutRegister', -0.8945397734642029],
        ['register-pwNewRegister', 10.407278060913086],
        ['register-pwConfirmRegister', 10.258511543273926],
        ['register-submitRegister', 27.287878036499023],
        ['register-TOSRef', 5.301908016204834],
        ['register-pagePwReset', -6.773916721343994],
        ['register-formTextPwReset', -10.740901947021484],
        ['register-formAttrsPwReset', -6.087606906890869],
        ['register-headingsPwReset', -19.776954650878906],
        ['register-layoutPwReset', -63.483551025390625],
        ['register-pageRecovery', -5.656133651733398],
        ['register-formTextRecovery', 0.03803417831659317],
        ['register-formAttrsRecovery', -39.932071685791016],
        ['register-headingsRecovery', -1.3948094844818115],
        ['register-layoutRecovery', -2.4122371673583984],
        ['register-identifierRecovery', 5.584828853607178],
        ['register-submitRecovery', -42.406917572021484],
        ['register-formTextMFA', -10.215619087219238],
        ['register-formAttrsMFA', -10.493953704833984],
        ['register-inputsMFA', -9.283592224121094],
        ['register-inputsOTP', -7.580175876617432],
        ['register-newsletterForm', -16.68770408630371],
        ['register-searchForm', -6.129755973815918],
        ['register-multiStepForm', -4.106363773345947],
        ['register-multiAuthForm', -12.96544361114502],
        ['register-visibleRatio,fieldsCount', -12.074410438537598],
        ['register-visibleRatio,identifierCount', -0.22365052998065948],
        ['register-visibleRatio,passwordCount', 0.4335995316505432],
        ['register-visibleRatio,hiddenIdentifierCount', 16.05516815185547],
        ['register-visibleRatio,hiddenPasswordCount', -5.285999774932861],
        ['register-visibleRatio,multiStepForm', 15.589274406433105],
        ['register-identifierRatio,fieldsCount', 1.494274377822876],
        ['register-identifierRatio,identifierCount', 18.581043243408203],
        ['register-identifierRatio,passwordCount', -30.898710250854492],
        ['register-identifierRatio,hiddenIdentifierCount', -20.667530059814453],
        ['register-identifierRatio,hiddenPasswordCount', 38.148048400878906],
        ['register-identifierRatio,multiStepForm', 5.607511520385742],
        ['register-passwordRatio,fieldsCount', 8.558664321899414],
        ['register-passwordRatio,identifierCount', -34.660423278808594],
        ['register-passwordRatio,passwordCount', -12.744463920593262],
        ['register-passwordRatio,hiddenIdentifierCount', 12.843822479248047],
        ['register-passwordRatio,hiddenPasswordCount', 6.800741195678711],
        ['register-passwordRatio,multiStepForm', 12.28433609008789],
        ['register-requiredRatio,fieldsCount', -27.336931228637695],
        ['register-requiredRatio,identifierCount', 22.784486770629883],
        ['register-requiredRatio,passwordCount', -1.2609316110610962],
        ['register-requiredRatio,hiddenIdentifierCount', 13.246378898620605],
        ['register-requiredRatio,hiddenPasswordCount', -7.740203380584717],
        ['register-requiredRatio,multiStepForm', -1.6803227663040161],
    ],
    bias: -7.759067058563232,
    cutoff: 0.54,
};

const register = {
    name: FormType.REGISTER,
    coeffs: FORM_COMBINED_FEATURES.map((key) => {
        var _a, _b;
        return [
            `register-${key}`,
            (_b =
                (_a = results$6.coeffs.find(([feature]) => feature === `register-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$6.bias,
    cutoff: results$6.cutoff,
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

const getEmailFieldFeatures = (fnode) => {
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText } = fieldFeatures;
    const typeEmail = fieldFeatures.type === 'email';
    const exactAttrEmail = field.matches(kEmailSelector);
    const attrEmail = any(matchEmailAttr)(fieldAttrs);
    const textEmail = matchEmail(fieldText);
    const labelEmail = matchEmail(labelText);
    const placeholderEmail = any(or(matchEmailValue, matchEmail))(field.placeholder.split(' '));
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

const results$5 = {
    coeffs: [
        ['email-autocompleteUsername', 1.422879934310913],
        ['email-autocompleteNickname', 0.06123584508895874],
        ['email-autocompleteEmail', 6.039527416229248],
        ['email-typeEmail', 15.077214241027832],
        ['email-exactAttrEmail', 13.114316940307617],
        ['email-attrEmail', 2.7811479568481445],
        ['email-textEmail', 15.807499885559082],
        ['email-labelEmail', 17.429636001586914],
        ['email-placeholderEmail', 3.715912103652954],
        ['email-searchField', -15.843851089477539],
    ],
    bias: -9.902606010437012,
    cutoff: 0.5,
};

const email = {
    name: FieldType.EMAIL,
    coeffs: EMAIL_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `email-${key}`,
            (_b =
                (_a = results$5.coeffs.find(([feature]) => feature === `email-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$5.bias,
    cutoff: results$5.cutoff,
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

var IdentityFieldType;

(function (IdentityFieldType) {
    IdentityFieldType[(IdentityFieldType['FULLNAME'] = 1)] = 'FULLNAME';
    IdentityFieldType[(IdentityFieldType['FIRSTNAME'] = 2)] = 'FIRSTNAME';
    IdentityFieldType[(IdentityFieldType['MIDDLENAME'] = 3)] = 'MIDDLENAME';
    IdentityFieldType[(IdentityFieldType['LASTNAME'] = 4)] = 'LASTNAME';
    IdentityFieldType[(IdentityFieldType['TELEPHONE'] = 5)] = 'TELEPHONE';
    IdentityFieldType[(IdentityFieldType['ADDRESS'] = 6)] = 'ADDRESS';
    IdentityFieldType[(IdentityFieldType['STATE'] = 7)] = 'STATE';
    IdentityFieldType[(IdentityFieldType['CITY'] = 8)] = 'CITY';
    IdentityFieldType[(IdentityFieldType['ZIPCODE'] = 9)] = 'ZIPCODE';
    IdentityFieldType[(IdentityFieldType['ORGANIZATION'] = 10)] = 'ORGANIZATION';
    IdentityFieldType[(IdentityFieldType['COUNTRY'] = 11)] = 'COUNTRY';
})(IdentityFieldType || (IdentityFieldType = {}));

const IDENTITY_RE_MAP = [
    [IdentityFieldType.FIRSTNAME, matchFirstName],
    [IdentityFieldType.MIDDLENAME, matchMiddleName],
    [IdentityFieldType.LASTNAME, matchLastName],
    [IdentityFieldType.FULLNAME, matchFullName],
    [IdentityFieldType.TELEPHONE, matchTelephone],
    [IdentityFieldType.ORGANIZATION, matchOrganization],
    [IdentityFieldType.CITY, matchCity],
    [IdentityFieldType.ZIPCODE, matchZipCode],
    [IdentityFieldType.STATE, matchState],
    [IdentityFieldType.COUNTRY, matchCountry],
    [IdentityFieldType.ADDRESS, matchAddress],
];

const IDENTITY_ATTRIBUTES = ['autocomplete', 'name', 'id', 'data-bhw'];

const IDENTITY_INPUT_TYPES = ['tel', 'phone', 'text', 'number'];

const getIdentityHaystack = (input) => {
    const attrs = IDENTITY_ATTRIBUTES.map((attr) => {
        var _a;
        return (_a = input === null || input === void 0 ? void 0 : input.getAttribute(attr)) !== null && _a !== void 0
            ? _a
            : '';
    });
    return sanitizeStringWithSpaces(attrs.join(' '));
};

const getIdentityFieldType = (input) => {
    var _a;
    const haystack = getIdentityHaystack(input);
    if (haystack)
        return (_a = IDENTITY_RE_MAP.find(([, test]) => test(haystack))) === null || _a === void 0 ? void 0 : _a[0];
};

const isAutocompleteListInput = (el) => el.getAttribute('aria-autocomplete') === 'list' || el.role === 'combobox';

const maybeIdentity = (fnode) => {
    const input = fnode.element;
    const { visible, isFormLogin, type, searchField } = fnode.noteFor('field');
    if ((type && !IDENTITY_INPUT_TYPES.includes(type)) || !visible || isFormLogin) return false;
    const identityType = getIdentityFieldType(input);
    if (!identityType) return false;
    if (isAutocompleteListInput(input))
        return [IdentityFieldType.ADDRESS, IdentityFieldType.ZIPCODE].includes(identityType);
    if (type === 'number') return [IdentityFieldType.TELEPHONE, IdentityFieldType.ZIPCODE].includes(identityType);
    if (searchField)
        return [IdentityFieldType.ADDRESS, IdentityFieldType.ZIPCODE, identityType === IdentityFieldType.CITY].includes(
            identityType
        );
    return true;
};

const identity = [
    rule(type('field').when(maybeIdentity), type('identity-field'), {}),
    rule(type('identity-field'), type(FieldType.IDENTITY), {}),
    ...outRuleWithCache('field-candidate', FieldType.IDENTITY, () => () => true),
];

const getOTPFieldFeatures = (fnode) => {
    var _a, _b, _c, _d, _e;
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField, type, minLength, maxLength } = fieldFeatures;
    const formFeatures = fieldFeatures.formFeatures;
    const formMFA = Boolean(formFeatures === null || formFeatures === void 0 ? void 0 : formFeatures.formMFA);
    const formOTPOutlier = Boolean(
        formFeatures === null || formFeatures === void 0 ? void 0 : formFeatures.formOTPOutlier
    );
    const linkOutlier = Boolean(
        formFeatures === null || formFeatures === void 0 ? void 0 : formFeatures.linkOTPOutlier
    );
    const visibleInputsCount =
        formFeatures === null || formFeatures === void 0 ? void 0 : formFeatures.visibleInputsCount;
    const patternOTP = OTP_PATTERNS.some(
        ([maxLength, pattern]) => field.pattern.includes(pattern) && maxLength === field.maxLength
    );
    const exactNames = ['code', 'token', 'otp', 'otc', 'totp'];
    const nameMatch = exactNames.some((match) => field.name === match);
    const idMatch = exactNames.some((match) => field.id === match);
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
          bottom === (nextRect === null || nextRect === void 0 ? void 0 : nextRect.bottom)
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
    const formText =
        (_c =
            (_b =
                (_a = fieldFeatures === null || fieldFeatures === void 0 ? void 0 : fieldFeatures.formFnode) === null ||
                _a === void 0
                    ? void 0
                    : _a.element) === null || _b === void 0
                ? void 0
                : _b.innerText) !== null && _c !== void 0
            ? _c
            : '';
    const parents = [getNthParent(field)(1), getNthParent(field)(2)];
    const wrapperAttrs = parents.flatMap(getBaseAttributes);
    const wrapperOTP = any(matchOtpAttr)(wrapperAttrs);
    const wrapperOutlier = any(matchOtpOutlier)(wrapperAttrs);
    const invalidInputCount = !(visibleInputsCount === 1 || visibleInputsCount === 6);
    const maxLengthExpected = maxLength === 1 || maxLength === 6;
    const maxLengthInvalid = maxLength > 10;
    const siblingOfInterest = prevAligned || nextAligned;
    const otpSmells = wrapperOTP || attrOTP || textOTP || labelOTP;
    const emailOutlierCount = otpSmells
        ? (_e = (_d = formText.match(/@/g)) === null || _d === void 0 ? void 0 : _d.length) !== null && _e !== void 0
            ? _e
            : 0
        : 0;
    return {
        formMFA: boolInt(fieldFeatures.isFormNoop && formMFA),
        formOutlier: boolInt(formOTPOutlier),
        fieldOutlier: boolInt(wrapperOutlier || attrOutlier || labelOutlier),
        linkOutlier: boolInt(linkOutlier),
        emailOutlierCount: boolInt(emailOutlierCount > 1),
        inputCountOutlier: boolInt(invalidInputCount),
        nameMatch: boolInt(nameMatch),
        idMatch: boolInt(idMatch),
        numericMode: boolInt(field.inputMode === 'numeric'),
        patternOTP: boolInt(patternOTP),
        maxLengthExpected: boolInt(maxLengthExpected),
        maxLengthInvalid: boolInt(maxLengthInvalid),
        maxLength1: boolInt(maxLength === 1),
        maxLength5: boolInt(maxLength === 5),
        minLength6: boolInt(minLength === 6),
        maxLength6: boolInt(maxLength === 6),
        autocompleteOTC: boolInt(fieldFeatures.autocomplete === 'one-time-code'),
        siblingOfInterest: boolInt(siblingOfInterest),
        prevAligned: boolInt(prevAligned),
        prevArea: boolInt(prevArea),
        nextAligned: boolInt(nextAligned),
        nextArea: boolInt(nextArea),
        attrOTP: boolInt(attrOTP),
        textOTP: boolInt(textOTP),
        wrapperOTP: boolInt(wrapperOTP),
        labelOTP: boolInt(labelOTP),
        attrMFA: boolInt(attrMFA),
        textMFA: boolInt(textMFA),
        labelMFA: boolInt(labelMFA),
    };
};

const BASE_OTP_FIELD_FEATURES = [
    'formMFA',
    'formOutlier',
    'fieldOutlier',
    'linkOutlier',
    'emailOutlierCount',
    'inputCountOutlier',
    'nameMatch',
    'idMatch',
    'numericMode',
    'patternOTP',
    'maxLengthExpected',
    'maxLengthInvalid',
    'maxLength1',
    'maxLength5',
    'minLength6',
    'maxLength6',
    'autocompleteOTC',
    'prevAligned',
    'prevArea',
    'nextAligned',
    'nextArea',
    'attrMFA',
    'attrOTP',
    'textMFA',
    'textOTP',
    'labelMFA',
    'labelOTP',
    'wrapperOTP',
];

const OTP_FIELD_FEATURES = [
    ...BASE_OTP_FIELD_FEATURES,
    ...combineFeatures(
        ['autocompleteOTC', 'siblingOfInterest', 'formMFA'],
        ['inputCountOutlier', 'maxLengthInvalid', 'attrOTP']
    ),
];

const results$4 = {
    coeffs: [
        ['otp-formMFA', 7.771900177001953],
        ['otp-formOutlier', -0.04360857233405113],
        ['otp-fieldOutlier', -14.93850040435791],
        ['otp-linkOutlier', -15.19876766204834],
        ['otp-emailOutlierCount', -20.635622024536133],
        ['otp-inputCountOutlier', -4.404586315155029],
        ['otp-nameMatch', 11.083649635314941],
        ['otp-idMatch', 8.304197311401367],
        ['otp-numericMode', 6.63908052444458],
        ['otp-patternOTP', 11.01827621459961],
        ['otp-maxLengthExpected', 1.5373173952102661],
        ['otp-maxLengthInvalid', -6.062628269195557],
        ['otp-maxLength1', 4.458582401275635],
        ['otp-maxLength5', -7.512012481689453],
        ['otp-minLength6', 15.0722017288208],
        ['otp-maxLength6', -7.584023952484131],
        ['otp-autocompleteOTC', 5.740074634552002],
        ['otp-prevAligned', 4.224268913269043],
        ['otp-prevArea', 2.773845672607422],
        ['otp-nextAligned', 3.857393741607666],
        ['otp-nextArea', 2.5566060543060303],
        ['otp-attrMFA', 32.71980285644531],
        ['otp-attrOTP', 20.423227310180664],
        ['otp-textMFA', 6.684645652770996],
        ['otp-textOTP', 1.1047155857086182],
        ['otp-labelMFA', 18.526269912719727],
        ['otp-labelOTP', 8.603682518005371],
        ['otp-wrapperOTP', -10.004483222961426],
        ['otp-autocompleteOTC,inputCountOutlier', -4.689912796020508],
        ['otp-autocompleteOTC,maxLengthInvalid', -18.661497116088867],
        ['otp-autocompleteOTC,attrOTP', 5.988102436065674],
        ['otp-siblingOfInterest,inputCountOutlier', -7.615082263946533],
        ['otp-siblingOfInterest,maxLengthInvalid', -6.08467435836792],
        ['otp-siblingOfInterest,attrOTP', 5.977667331695557],
        ['otp-formMFA,inputCountOutlier', 9.612953186035156],
        ['otp-formMFA,maxLengthInvalid', -12.804899215698242],
        ['otp-formMFA,attrOTP', 6.108048439025879],
    ],
    bias: -11.110547065734863,
    cutoff: 0.5,
};

const otp = {
    name: FieldType.OTP,
    coeffs: OTP_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `otp-${key}`,
            (_b =
                (_a = results$4.coeffs.find(([feature]) => feature === `otp-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$4.bias,
    cutoff: results$4.cutoff,
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

const isAutocompleteCurrentPassword = (value) => value === 'current-password' || value === 'password';

const isAutocompleteNewPassword = (value) => value === 'new-password';

const getPasswordFieldFeatures = (fnode) => {
    var _a, _b;
    const fieldFeatures = fnode.noteFor('field');
    const { autocomplete, fieldAttrs, fieldText, labelText, prevField, nextField } = fieldFeatures;
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
    const prevPwField = prevField && prevField.getAttribute('type') === 'password' ? prevField : null;
    const nextPwField = nextField && nextField.getAttribute('type') === 'password' ? nextField : null;
    const prevPwHaystack = prevPwField ? getAllFieldHaystacks(prevPwField) : [];
    const nextPwHaystack = nextPwField ? getAllFieldHaystacks(nextPwField) : [];
    const prevAutocomplete =
        prevPwField === null || prevPwField === void 0 ? void 0 : prevPwField.getAttribute('autocomplete');
    const prevAutocompleteCurrent = isAutocompleteCurrentPassword(prevAutocomplete);
    const prevPwCurrent = prevAutocompleteCurrent || any(matchPasswordCurrent)(prevPwHaystack);
    const prevAutocompleteNew = isAutocompleteNewPassword(prevAutocomplete);
    const prevPwNew = prevAutocompleteNew || any(matchPasswordCreate)(prevPwHaystack);
    const prevPwConfirm = any(matchPasswordConfirm)(prevPwHaystack);
    const nextAutocomplete =
        nextPwField === null || nextPwField === void 0 ? void 0 : nextPwField.getAttribute('autocomplete');
    const nextAutocompleteCurrent = isAutocompleteCurrentPassword(nextAutocomplete);
    const nextPwCurrent = nextAutocompleteCurrent || any(matchPasswordCurrent)(nextPwHaystack);
    const nextAutocompleteNew = isAutocompleteNewPassword(nextAutocomplete);
    const nextPwNew = nextAutocompleteNew || any(matchPasswordCreate)(nextPwHaystack);
    const nextPwConfirm = any(matchPasswordConfirm)(nextPwHaystack);
    return {
        loginScore: boolInt(fieldFeatures.isFormLogin),
        registerScore: boolInt(fieldFeatures.isFormRegister),
        pwChangeScore: boolInt(fieldFeatures.isFormPWChange),
        exotic: boolInt(fieldFeatures.isFormNoop),
        autocompleteNew: boolInt(isAutocompleteNewPassword(autocomplete)),
        autocompleteCurrent: boolInt(isAutocompleteCurrentPassword(autocomplete)),
        autocompleteOff: boolInt(fieldFeatures.autocomplete === 'off'),
        isOnlyPassword:
            (_b = (_a = fieldFeatures.formFeatures) === null || _a === void 0 ? void 0 : _a.onePassword) !== null &&
            _b !== void 0
                ? _b
                : 0,
        prevPwField: boolInt(prevPwField !== null),
        nextPwField: boolInt(nextPwField !== null),
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
        prevPwNew: boolInt(prevPwNew),
        prevPwCurrent: boolInt(prevPwCurrent),
        prevPwConfirm: boolInt(prevPwConfirm),
        nextPwNew: boolInt(nextPwNew),
        nextPwCurrent: boolInt(nextPwCurrent),
        nextPwConfirm: boolInt(nextPwConfirm),
    };
};

const BASE_PW_FIELD_FEATURES = [
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
    'prevPwNew',
    'prevPwCurrent',
    'prevPwConfirm',
    'nextPwNew',
    'nextPwCurrent',
    'nextPwConfirm',
    'passwordOutlier',
];

const PW_FIELD_FEATURES = [...BASE_PW_FIELD_FEATURES, ...combineFeatures(['prevPwCurrent'], ['nextPwNew'])];

const results$3 = {
    coeffs: [
        ['pw-loginScore', 11.489188194274902],
        ['pw-registerScore', -12.317614555358887],
        ['pw-pwChangeScore', -3.3522896766662598],
        ['pw-exotic', -11.274672508239746],
        ['pw-autocompleteNew', -3.2165679931640625],
        ['pw-autocompleteCurrent', 1.107975721359253],
        ['pw-autocompleteOff', -1.5637125968933105],
        ['pw-isOnlyPassword', 1.6692641973495483],
        ['pw-prevPwField', -3.853325843811035],
        ['pw-nextPwField', -2.6056430339813232],
        ['pw-attrCreate', -2.091197967529297],
        ['pw-attrCurrent', 2.623647451400757],
        ['pw-attrConfirm', -6.392003536224365],
        ['pw-attrReset', 0.0007354617118835449],
        ['pw-textCreate', -2.4505302906036377],
        ['pw-textCurrent', 1.7695688009262085],
        ['pw-textConfirm', -6.402401924133301],
        ['pw-textReset', -0.1697392612695694],
        ['pw-labelCreate', -7.204258441925049],
        ['pw-labelCurrent', 14.438202857971191],
        ['pw-labelConfirm', -6.259541988372803],
        ['pw-labelReset', 0.015617117285728455],
        ['pw-prevPwNew', -6.184617519378662],
        ['pw-prevPwCurrent', -6.242441177368164],
        ['pw-prevPwConfirm', -0.17926810681819916],
        ['pw-nextPwNew', 9.929208755493164],
        ['pw-nextPwCurrent', -7.612186431884766],
        ['pw-nextPwConfirm', -6.865516662597656],
        ['pw-passwordOutlier', -17.66224479675293],
        ['pw-prevPwCurrent,nextPwNew', -5.839819431304932],
    ],
    bias: 0.2366154044866562,
    cutoff: 0.5,
};

const password = {
    name: FieldType.PASSWORD_CURRENT,
    coeffs: PW_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `pw-${key}`,
            (_b =
                (_a = results$3.coeffs.find(([feature]) => feature === `pw-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$3.bias,
    cutoff: results$3.cutoff,
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

const results$2 = {
    coeffs: [
        ['pw[new]-loginScore', -10.936930656433105],
        ['pw[new]-registerScore', 11.831424713134766],
        ['pw[new]-pwChangeScore', 5.067559242248535],
        ['pw[new]-exotic', 11.193541526794434],
        ['pw[new]-autocompleteNew', 2.4367527961730957],
        ['pw[new]-autocompleteCurrent', -1.0056599378585815],
        ['pw[new]-autocompleteOff', 1.5895371437072754],
        ['pw[new]-isOnlyPassword', -1.4990589618682861],
        ['pw[new]-prevPwField', 3.6485674381256104],
        ['pw[new]-nextPwField', 1.4125449657440186],
        ['pw[new]-attrCreate', 2.043544292449951],
        ['pw[new]-attrCurrent', -1.0884264707565308],
        ['pw[new]-attrConfirm', 6.419448375701904],
        ['pw[new]-attrReset', 0.08130821585655212],
        ['pw[new]-textCreate', 2.1415109634399414],
        ['pw[new]-textCurrent', -1.3681634664535522],
        ['pw[new]-textConfirm', 6.278629779815674],
        ['pw[new]-textReset', 0.07996046543121338],
        ['pw[new]-labelCreate', 7.23655891418457],
        ['pw[new]-labelCurrent', -13.138494491577148],
        ['pw[new]-labelConfirm', 6.407430171966553],
        ['pw[new]-labelReset', -0.02614663541316986],
        ['pw[new]-prevPwNew', 6.290370941162109],
        ['pw[new]-prevPwCurrent', 6.439488887786865],
        ['pw[new]-prevPwConfirm', 0.02449376881122589],
        ['pw[new]-nextPwNew', -10.66829776763916],
        ['pw[new]-nextPwCurrent', 7.651172161102295],
        ['pw[new]-nextPwConfirm', 7.5237345695495605],
        ['pw[new]-passwordOutlier', -23.131240844726562],
        ['pw[new]-prevPwCurrent,nextPwNew', 5.949848651885986],
    ],
    bias: -0.42535680532455444,
    cutoff: 0.5,
};

const newPassword = {
    name: FieldType.PASSWORD_NEW,
    coeffs: PW_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `pw[new]-${key}`,
            (_b =
                (_a = results$2.coeffs.find(([feature]) => feature === `pw[new]-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$2.bias,
    cutoff: results$2.cutoff,
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

const results$1 = {
    coeffs: [
        ['username-autocompleteUsername', 8.727046012878418],
        ['username-autocompleteNickname', -0.2054200917482376],
        ['username-autocompleteEmail', -6.400381565093994],
        ['username-autocompleteOff', -0.4214320778846741],
        ['username-attrUsername', 17.859210968017578],
        ['username-textUsername', 15.59371280670166],
        ['username-labelUsername', 17.55240821838379],
        ['username-outlierUsername', 0.07585844397544861],
        ['username-loginUsername', 18.52303123474121],
        ['username-searchField', -13.451205253601074],
    ],
    bias: -9.966038703918457,
    cutoff: 0.5,
};

const username = {
    name: FieldType.USERNAME,
    coeffs: USERNAME_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `username-${key}`,
            (_b =
                (_a = results$1.coeffs.find(([feature]) => feature === `username-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$1.bias,
    cutoff: results$1.cutoff,
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

const results = {
    coeffs: [
        ['username[hidden]-exotic', -10.682938575744629],
        ['username[hidden]-attrUsername', 21.034669876098633],
        ['username[hidden]-attrEmail', 13.188990592956543],
        ['username[hidden]-usernameAttr', 15.255407333374023],
        ['username[hidden]-autocompleteUsername', 4.695377826690674],
        ['username[hidden]-visibleReadonly', 11.520600318908691],
        ['username[hidden]-hiddenEmailValue', 24.007482528686523],
        ['username[hidden]-hiddenTelValue', 6.628058433532715],
        ['username[hidden]-hiddenUsernameValue', 7.225632190704346],
    ],
    bias: -30.55059242248535,
    cutoff: 0.5,
};

const usernameHidden = {
    name: FieldType.USERNAME_HIDDEN,
    coeffs: HIDDEN_USER_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `username[hidden]-${key}`,
            (_b =
                (_a = results.coeffs.find(([feature]) => feature === `username[hidden]-${key}`)) === null ||
                _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results.bias,
    cutoff: results.cutoff,
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
    const autocomplete = field.getAttribute('autocomplete');
    const disabled = field.disabled;
    const typeValid = type !== 'hidden';
    const tabIndex = field.tabIndex;
    const visible = typeValid
        ? isVisibleField(field) &&
          isVisible(field, {
              opacity: false,
          })
        : false;
    if (typeValid) (visible ? removeHiddenFlag : flagAsHidden)(field);
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
    const buttons = clusterable(Array.from(document.querySelectorAll(kButtonSubmitSelector)).filter(isBtnCandidate));
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
        if (invalidType) return flagAsIgnored(input);
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
            if (unprocessedFields)
                removeClassifierFlags(form, {
                    preserveIgnored: false,
                });
            return runDetection || unprocessedFields;
        }
        if (isVisibleForm(form)) {
            removeHiddenFlag(form);
            return true;
        }
        return runDetection;
    }, false);
    if (runForForms) return true;
    const runForFields = selectInputCandidates().some(isProcessableField);
    return runForFields;
};

const noop = [
    rule(type('form').when(isNoopForm), type(FormType.NOOP), {}),
    ...outRuleWithCache('form-candidate', FormType.NOOP, () => () => true),
];

const definitions = [
    login,
    register,
    passwordChange,
    recovery,
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
                ...noop,
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
                ...identity,
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
    IdentityFieldType,
    TEXT_ATTRIBUTES,
    attrIgnored,
    buttonSelector,
    cacheContext,
    clearDetectionCache,
    clearVisibilityCache,
    createInputIterator,
    fieldTypes,
    flagAsHidden,
    flagAsIgnored,
    flagAsProcessed,
    flagCluster,
    flagSubtreeAsIgnored,
    formCandidateSelector,
    formTypes,
    getAttributes,
    getBaseAttributes,
    getCachedPredictionScore,
    getFieldAttributes,
    getFormAttributes,
    getFormParent,
    getIdentityFieldType,
    getIdentityHaystack,
    getIgnoredParent,
    getParentFormPrediction,
    getTextAttributes,
    getTypeScore,
    getVisibilityCache,
    inputCandidateSelector,
    isBtnCandidate,
    isClassifiable,
    isClassifiableField,
    isCluster,
    isEmailCandidate,
    isHidden,
    isIgnored,
    isOAuthCandidate,
    isPredictedType,
    isPrediction,
    isProcessableField,
    isProcessed,
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
    maybeIdentity,
    maybeOTP,
    maybePassword,
    maybeUsername,
    otpSelector,
    prepass,
    removeClassifierFlags,
    removeHiddenFlag,
    removeIgnoredFlag,
    removePredictionFlag,
    removeProcessedFlag,
    rulesetMaker,
    selectFormCandidates,
    selectInputCandidates,
    setCachedPredictionScore,
    shouldRunClassifier,
    splitFieldsByVisibility,
    trainees,
};
