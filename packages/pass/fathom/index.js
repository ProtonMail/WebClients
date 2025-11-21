import { clusters as clusters$1, dom, domQuery, out, rule, ruleset, score, type, utils } from './fathom.js';
import * as fathomWeb from './fathom.js';
import { CCFieldType, FieldType, FormType, IdentityFieldType } from './labels.js';

export { fathomWeb as fathom };

const FORM_CLUSTER_ATTR = 'data-protonpass-form';

const kFieldSelector = 'input, select, textarea';

const kFieldLabelSelector = `[class*="label"], [id*="label"]`;

const kEmailSelector = 'input[name="email"], input[id="email"], input[name="user_email"]';

const kPasswordSelector = 'input[type="password"], input[type="text"][id="password"]';

const kCaptchaSelector = `[class*="captcha"], [id*="captcha"], [name*="captcha"]`;

const kSocialSelector = `[class*=social], [aria-label*=with]`;

const kEditorElements = ['body', 'div', 'section', 'main'];

const kEditorPatterns = [
    '[class*="editor"]',
    '[class*="Editor"]',
    '[class*="EDITOR"]',
    '[id*="editor"]',
    '[id*="Editor"]',
    '[id*="EDITOR"]',
    '[class*="composer" i]',
    '[id*="composer" i]',
    '[class*="wysiwyg" i]',
    '[id*="wysiwyg" i]',
    '[class*="tinymce" i]',
    '[id*="tinymce" i]',
];

const kEditorSelector = `[contenteditable="true"], :is(${kEditorElements.join(',')}):is(${kEditorPatterns.join(',')})`;

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

const parentQuery = (start, match, maxIterations = 1) => {
    const parent = start?.parentElement;
    if (!parent) return null;
    const result = match(parent);
    return result || maxIterations <= 0 ? result : parentQuery(parent, match, maxIterations - 1);
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

const matchSibling = (el, match) => {
    const prevEl = el.previousElementSibling;
    if (prevEl === null) return null;
    if (match(prevEl)) return prevEl;
    return matchSibling(prevEl, match);
};

const matchNonEmptySibling = (el) =>
    matchSibling(el, (el) => el instanceof HTMLElement && el.innerText.trim().length > 0);

const getLabelFor = (el) => {
    const forId = el.getAttribute('id') ?? el.getAttribute('name');
    const label = document.querySelector(`label[for="${forId}"]`);
    if (label) return label;
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel;
    const closestLabel = parentQuery(el, (parent) => parent.querySelector('label'), 1);
    if (closestLabel) return closestLabel;
    const labelLike = parentQuery(el, (parent) => parent.querySelector(kFieldLabelSelector), 1);
    if (labelLike) return labelLike;
    const textNodeAbove = matchNonEmptySibling(el);
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

const matchPredictedType = (type) => (str) => str.split(SCORE_SEPARATOR)?.[0] === type;

const setCachedPredictionScore = (_el, type, score) => {
    const el = _el;
    const currentType = el.__PP_TYPE__;
    const flag = `${type}${SCORE_SEPARATOR}${score.toFixed(2)}`;
    if (!currentType) {
        el.__PP_TYPE__ = flag;
        return;
    }
    const types = currentType.split(TYPE_SEPARATOR);
    const existingIndex = types.findIndex(matchPredictedType(type));
    if (existingIndex !== -1) types[existingIndex] = flag;
    else types.push(flag);
    el.__PP_TYPE__ = types.join(TYPE_SEPARATOR);
};

const getCachedPredictionScore = (type) => (fnode) => {
    const types = fnode.element.__PP_TYPE__;
    if (!types) return -1;
    const predForType = types.split(TYPE_SEPARATOR).find(matchPredictedType(type));
    if (!predForType) return -1;
    const [, scoreStr] = predForType.split(SCORE_SEPARATOR);
    const score = parseFloat(scoreStr);
    return Number.isFinite(score) ? score : -1;
};

const isPredictedType = (type) => (fnode) => getCachedPredictionScore(type)(fnode) !== -1;

const isPredictedForm = or(...Object.values(FormType).map((type) => isPredictedType(type)));

const isPredictedField = or(...Object.values(FieldType).map((type) => isPredictedType(type)));

const isClassifiable = (el) => !(isPrediction(el) || isIgnored(el) || attrIgnored(el));

const removeClassifierFlags = (target, options) => {
    const clean = (el) => {
        removeProcessedFlag(el);
        removePredictionFlag(el);
        if (!options.preserveIgnored) removeIgnoredFlag(el);
    };
    clean(target);
    target.querySelectorAll(kFieldSelector).forEach(clean);
    options.fields?.forEach(clean);
};

const isShadowRoot = (el) => el instanceof ShadowRoot;

const isShadowElement = (el) => isShadowRoot(el.getRootNode());

const isCustomElementWithShadowRoot = (el) => Boolean(el.tagName.includes('-') && el.shadowRoot);

const shadowPiercingAncestors = function* (element) {
    yield element;
    let current = element;
    let parent;
    while ((parent = getShadowPiercingParent(current)) && parent?.nodeType === Node.ELEMENT_NODE) {
        yield parent;
        current = parent;
    }
};

const getShadowPiercingParent = (node) => {
    const parent = node.parentNode;
    if (!parent) return null;
    if (isShadowRoot(parent)) return parent.host;
    else return parent;
};

const shadowPiercingContains = (container, el) => {
    let current = el;
    if (container.contains(el)) return true;
    if (!isShadowElement(el)) return false;
    const containerShadowRoot = 'shadowRoot' in container ? container.shadowRoot : null;
    if (containerShadowRoot?.contains(el)) return true;
    while (current) {
        const rootNode = current.getRootNode();
        if (rootNode === document) return false;
        if (!isShadowRoot(rootNode)) return false;
        const host = rootNode.host;
        if (host === container) return true;
        if (container.contains(host)) return true;
        if (containerShadowRoot?.contains(host)) return true;
        current = host;
    }
    return false;
};

const shallowShadowQuerySelector = (el, selector) => {
    if (!(el instanceof HTMLElement)) return el.querySelector(selector);
    return el.querySelector(selector) ?? el.shadowRoot?.querySelector(selector) ?? null;
};

const MAX_FORM_FIELD_WALK_UP = 3;

const MAX_FORM_HEADING_WALK_UP = 3;

const MAX_HEADING_HORIZONTAL_DIST = 75;

const MAX_HEADING_VERTICAL_DIST = 150;

const MIN_AREA_SUBMIT_BTN = 3500;

const MIN_FIELD_HEIGHT = 15;

const MIN_FIELD_WIDTH = 30;

const MAX_INPUTS_PER_FORM = 50;

const MAX_FIELDS_PER_FORM = 100;

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

const LOGIN_RE =
    /(?:(?:n(?:ouvelleses|uevase|ewses)s|iniciarses|connex)io|anmeldedate|inlogge|sign[io])n|in(?:iciarsessao|troduce)|a(?:uthenticate|nmeld(?:ung|en))|authentifier|s(?:econnect|identifi)er|novasessao|(?:introduci|conecta|entr[ae])r|prihlasit|connect|acceder|login/i;

const REGISTER_RE =
    /kontoerstellen|cr(?:ea(?:teaccount|rcuenta)|iarconta)|(?:nouveaucompt|creeruncompt|s?inscrir|unirs)e|re(?:gist(?:r(?:ieren|arse|ar)|er)|joindre)|nuevacuenta|getstarted|neueskonto|newaccount|novaconta|(?:com(?:mence|eca)|(?:empez|junt)a)r|signup|join/i;

const RECOVERY_RE =
    /(?:wiederherstell|zurucksetz)en|re(?:(?:initialis|stablec)er|(?:defini|staur[ae])r|c(?:uper[ae]|ove)r|set)|problem|(?:troubl|restor|aid)e|a[jy]uda|h(?:ilfe|elp)/i;

const MULTI_STEP_RE = /p(?:rogres(?:s(?:ion|o)|o)|aso)|fortschritt|progress|s(?:chritt|t(?:age|ep))|etap[ae]|phase/i;

const TROUBLE_RE =
    /schwierigkeit|(?:difficult|troubl|oubli|hilf)e|i(?:nciden(?:cia|t)|ssue)|vergessen|esquecido|olvidado|needhelp|questao|problem|forgot|ayuda/i;

const PASSWORD_RE =
    /p(?:hrasesecrete|ass(?:(?:phras|cod)e|wor[dt]))|(?:c(?:havesecret|lavesecret|ontrasen)|deseguranc)a|(?:(?:zugangs|secret)cod|clesecret)e|wachtwoord|codesecret|motdepasse|geheimnis|secret|heslo|senha|key/i;

const PASSWORD_OUTLIER_RE = /socialsecurity|nationalid|userid/i;

const USERNAME_RE =
    /gebruikersnaam|(?:identifi(?:cado|e)|benutze)r|identi(?:fiant|ty)|u(?:tilisateur|s(?:ername|uario))|(?:screen|nick)name|nutzername|(?:anmeld|handl)e|pseudo/i;

const USERNAME_ATTR_RE = /(?:custom|us)erid|login(?:name|id)|a(?:cc(?:ountid|t)|ppleid)/i;

const USERNAME_OUTLIER_RE =
    /(?:nom(?:defamill|br)|tit[lr])e|(?:primeiro|sobre)nome|(?:company|middle|nach|vor)name|firstname|apellido|lastname|prenom/i;

const EMAIL_RE = /co(?:urriel|rrei?o)|email/i;

const EMAIL_ATTR_RE = /usermail/i;

const CREATE_ACTION_RE = /erstellen|n(?:o(?:uveau|vo)|uevo|e[uw])|cr(?:e(?:a(?:te|r)|er)|iar)|set/i;

const CREATE_ACTION_ATTR_END_RE = /\b\S*(?:fst|1)\b/i;

const RESET_ACTION_RE =
    /(?:a(?:ktualisiere|nder)|zurucksetze)n|(?:re(?:initialise|stablece|defini)|mettreajou)r|a(?:ctualiz|tualiz|lter)ar|c(?:ambiar|hange)|update|reset/i;

const CONFIRM_ACTION_RE =
    /digitarnovamente|v(?:olveraescribi|erifi(?:ca|e))r|saisiranouveau|(?:erneuteingeb|wiederhol|bestatig)en|verif(?:izieren|y)|re(?:pe(?:t[ei]r|at)|type)|confirm|again/i;

const CONFIRM_ACTION_ATTR_END_RE = /\b\S*(?:snd|bis|2)\b/i;

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

const IDENTITY_TELEPHONE_ATTR_RE = /(?:national|contact)number|(?:tele)?phone|mobile|\b(tel(?:national|local)?)\b/i;

const IDENTITY_TELEPHONE_OUTLIER_ATTR_RE = /extension|security|co(?:untry|de)|p(?:refix|in)/i;

const IDENTITY_ADDRESS_ATTR_RE =
    /(?:preferred|street)address|address(?:line(?:one|[1s])|1)|mailingaddr|bill(?:ing)?addr|\b(mailaddr|addr(?:ess)?|street|line1)\b/i;

const IDENTITY_ADDRESS_LINES_ATTR_END_RE = /\b\S*(?:line(?:t(?:hree|wo)|[23]))\b/i;

const IDENTITY_STATE_ATTR_RE = /address(?:(?:provinc|stat)e|level1)|stateprovince|\b(province|county|region|state)\b/i;

const IDENTITY_CITY_ATTR_RE = /address(?:level2|town|city)|personalcity|\b((?:local|c)ity|town)\b/i;

const IDENTITY_ZIPCODE_ATTR_RE =
    /(?:address(?:postal|zip)|post)code|address(?:postal|zip)|postalcode|zipcode|\b(zip)\b/i;

const IDENTITY_ORGANIZATION_ATTR_RE = /organization(?:name)?|companyname|\b(organization)\b/i;

const IDENTITY_COUNTRY_ATTR_RE = /addresscountry(?:name)?|countryname|\b(country)\b/i;

const IDENTITY_COUNTRY_CODE_ATTR_RE = /countrycode/i;

const CC_PREFIX_ATTR_START_RE =
    /\b(?:(?:payments|new)card|paymentcard|c(?:ar(?:tecredit|d)|red(?:it)?card|[bc])|stripe|vads)\S+/i;

const CC_NUMBER_ATTR_RE = /num(?:ero)?carte|c(?:ardn(?:um|[or])|bnum|cno)|\b(c(?:ard |c)number)\b/i;

const CC_NUMBER_OUTLIER_ATTR_RE = /logincard/i;

const CC_CVC_ATTR_RE = /c(?:ard(?:verification|code)|sc|v[cv])|payments?code|\b(security code|ccc(?:ode|vv|sc))\b/i;

const CC_NAME_ATTR_RE = /accountholdername|card(?:holder)?name|cardholder|nameoncard|holdername|\b(ccname)\b/i;

const CC_EXP_ATTR_RE =
    /expir(?:ation(?:monthyear|date)|ation|ydate|y)|cardexp(?:iration)?|\b(ccexp(?:iration)?|expiry date)\b/i;

const CC_EXP_MONTH_ATTR_RE =
    /exp(?:ir(?:y(?:date(?:field)?mo|m[mo]?)|ationdatem[mo]|(?:ation|e)m[mo]?)|m[mo]?)|m(?:expiration|oisexp)|cbdatemo|cardm[mo]?|\b(cc(?:expmonth|m(?:onth|m)))\b/i;

const CC_EXP_MONTH_ATTR_END_RE = /\b\S*(?:m(?:onth|o|m))\b/i;

const CC_EXP_YEAR_ATTR_RE =
    /exp(?:ir(?:y(?:date(?:field)?year|y(?:yyy|ear|y)?)|ationdatey(?:y(?:yy)?|ear)|(?:ation|e)y(?:yyy|ear|y)?)|y(?:yyy|ear|y)?)|yexpiration|cbdateann|anne(?:ee)?xp|cardy(?:yyy|ear|y)?|\b(cc(?:expyear|y(?:ear|[ry])))\b/i;

const CC_EXP_YEAR_ATTR_END_RE = /\b\S*(?:y(?:ear|y))\b/i;

const IFRAME_FIELD_ATTR_RE = /security|checkout|c(?:ontrol|v[cv])|payment|input|f(?:ield|orm)|card|pci/i;

const DOCUMENT_ATTR_RE =
    /s(?:ocialsecurity|ubscription)|membership|nationalid|i(?:nsurance|dcard)|p(?:asse?por|ermi)t|contract|licen[cs]e/i;

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
        options ?? {
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

const matchTelephone = and(test(IDENTITY_TELEPHONE_ATTR_RE), notRe(IDENTITY_TELEPHONE_OUTLIER_ATTR_RE));

const matchOrganization = test(IDENTITY_ORGANIZATION_ATTR_RE);

const matchCity = test(IDENTITY_CITY_ATTR_RE);

const matchZipCode = test(IDENTITY_ZIPCODE_ATTR_RE);

const matchState = test(IDENTITY_STATE_ATTR_RE);

const matchCountry = and(test(IDENTITY_COUNTRY_ATTR_RE), notRe(IDENTITY_COUNTRY_CODE_ATTR_RE));

const matchAddress = and(test(IDENTITY_ADDRESS_ATTR_RE), notRe(IDENTITY_ADDRESS_LINES_ATTR_END_RE));

const matchCCName = test(CC_NAME_ATTR_RE);

const matchCCFirstName = andRe([CC_PREFIX_ATTR_START_RE, IDENTITY_FIRSTNAME_ATTR_RE]);

const matchCCLastName = andRe([CC_PREFIX_ATTR_START_RE, IDENTITY_LASTNAME_ATTR_RE]);

const matchCCNumber = and(test(CC_NUMBER_ATTR_RE), notRe(CC_NUMBER_OUTLIER_ATTR_RE));

const matchCCSecurityCode = test(CC_CVC_ATTR_RE);

const matchCCExp = and(test(CC_EXP_ATTR_RE), notRe(DOCUMENT_ATTR_RE));

const matchCCExpMonth = and(test(CC_EXP_MONTH_ATTR_RE), not(orRe([DOCUMENT_ATTR_RE, CC_EXP_YEAR_ATTR_END_RE])));

const matchCCExpYear = and(test(CC_EXP_YEAR_ATTR_RE), not(orRe([DOCUMENT_ATTR_RE, CC_EXP_MONTH_ATTR_END_RE])));

const matchIFrameField = test(IFRAME_FIELD_ATTR_RE);

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

const getVisibilityCache = (key) => (cacheContext[key] = cacheContext[key] ?? new WeakMap());

const clearVisibilityCache = () => Object.keys(cacheContext).forEach((key) => delete cacheContext[key]);

const SCROLLBAR_WIDTH = 16;

const getCachedVisbility = (el, options) => {
    const opacityCache = getVisibilityCache('visibility:op');
    const cache = getVisibilityCache('visibility');
    if (options.opacity) return opacityCache.get(el) ?? cache.get(el);
    else return cache.get(el);
};

const setCachedVisibility = (cacheMap) => (els, visible) => els.forEach((el) => cacheMap.set(el, visible));

const containedInAncestor = (rect, ancestorRect) =>
    rect.top <= ancestorRect.bottom &&
    rect.bottom >= ancestorRect.top &&
    rect.left <= ancestorRect.right &&
    rect.right >= ancestorRect.left;

const isNegligibleRect = (rect) => rect.width <= 1 || rect.height <= 1;

const HIDDEN_CLIP = ['rect(0px, 0px, 0px, 0px)', 'rect(0, 0, 0, 0)', 'rect(1px, 1px, 1px, 1px)'];

const HIDDEN_CLIP_PATH = ['circle(0', 'polygon()', 'inset(100%)', 'inset(50% 50% 50% 50%)'];

const isClipped = (clip, path) => {
    if (clip && clip !== 'auto') return HIDDEN_CLIP.some((value) => clip.includes(value));
    if (path && path !== 'none') return HIDDEN_CLIP_PATH.some((value) => path.includes(value));
    return false;
};

const isVisible = (fnodeOrElement, options) => {
    const useCache = !options.skipCache;
    const element = utils.toDomElement(fnodeOrElement);
    const seen = [];
    let transparent = false;
    const cache = getVisibilityCache(options.opacity ? 'visibility:op' : 'visibility');
    const cachedVisibility = getCachedVisbility(element, options);
    if (useCache && cachedVisibility !== undefined) return cachedVisibility;
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
        let prevRef = null;
        for (const ancestor of shadowPiercingAncestors(element)) {
            let rect = null;
            const getRect = () => (rect = rect ?? ancestor.getBoundingClientRect());
            if (ancestor === doc.body) return prevRef?.absolute ? isOnScreen(prevRef.rect) : true;
            const cachedVisibility = getCachedVisbility(ancestor, options);
            if (useCache && cachedVisibility !== undefined) return cachedVisibility;
            const { opacity, display, position, overflow, visibility, clip, clipPath } = win.getComputedStyle(ancestor);
            seen.push(ancestor);
            const opacityValue = Math.floor(parseFloat(opacity) * 10);
            if (opacityValue === 0 && options.opacity) {
                transparent = true;
                return false;
            }
            if (visibility === 'hidden' || display === 'none') return false;
            if (prevRef?.absolute && position === 'static') {
                seen.pop();
                continue;
            }
            if (isClipped(clip, clipPath)) return false;
            if (overflow === 'hidden') {
                if (prevRef?.rect && !containedInAncestor(prevRef.rect, getRect())) return false;
                if (isNegligibleRect(getRect())) return false;
            }
            if (position === 'absolute' && !isOnScreen(getRect())) return false;
            if (position === 'fixed') return isOnScreen(prevRef?.rect ?? getRect());
            if (display === 'contents') {
                prevRef = null;
                continue;
            }
            prevRef = prevRef ?? {
                rect: getRect(),
            };
            prevRef.rect = getRect();
            prevRef.absolute = position === 'absolute';
            continue;
        }
        return true;
    };
    const visible = check();
    if (useCache) {
        if (options.opacity) {
            if (visible || !transparent) setCachedVisibility(getVisibilityCache('visibility'))(seen, visible);
            else setCachedVisibility(getVisibilityCache('visibility'))(seen.slice(0, -1), visible);
        }
        setCachedVisibility(cache)(seen, visible);
    }
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

const isVisibleForm = (form, options = {}) => {
    const visible = (() => {
        if (
            !isVisible(form, {
                opacity: true,
                ...options,
            })
        )
            return false;
        if (isCustomElementWithShadowRoot(form) || isShadowElement(form)) return true;
        const inputs = Array.from(form.querySelectorAll(inputCandidateSelector)).filter((field) => !field.disabled);
        return (
            inputs.length > 0 &&
            inputs.some((input) =>
                isVisible(input, {
                    opacity: false,
                    ...options,
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

const OVERRIDE_FORMS = new Set();

const OVERRIDE_FIELDS = new Set();

const addFormOverride = (el) => OVERRIDE_FORMS.add(el);

const addFieldOverride = (el) => OVERRIDE_FIELDS.add(el);

const clearOverrides = () => {
    OVERRIDE_FORMS.clear();
    OVERRIDE_FORMS.clear();
};

const getOverridableForms = () => Array.from(OVERRIDE_FORMS);

const getOverridableFields = () => Array.from(OVERRIDE_FIELDS);

const matchFormOverrides = () => domQuery(getOverridableForms);

const matchFieldOverrides = () => domQuery(getOverridableFields);

const acceptFormOverride = (fnode) => isPredictedForm(fnode) && isVisibleForm(fnode.element);

const acceptFieldOverride = (fnode) => isPredictedField(fnode) && isVisibleField(fnode.element);

const overrides = [
    rule(matchFormOverrides(), type('override-form'), {}),
    rule(matchFieldOverrides(), type('override-field'), {}),
    rule(type('override-form').when(acceptFormOverride), type('form-candidate'), {}),
    rule(type('override-field').when(acceptFieldOverride), type('field-candidate'), {}),
];

const flagOverride = ({ form, formType, fields }) => {
    if (isVisibleForm(form)) {
        removePredictionFlag(form);
        setCachedPredictionScore(form, formType, 1);
        if (isShadowElement(form)) addFormOverride(form);
        else if (form.tagName !== 'FORM') flagCluster(form);
        fields.forEach(({ field, fieldType }) => {
            removePredictionFlag(field);
            setCachedPredictionScore(field, fieldType, 1);
            if (isShadowElement(field)) addFieldOverride(field);
        });
    }
};

const TEXT_ATTRIBUTES = [
    'title',
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'placeholder',
    'autocomplete',
    'legend',
    'label',
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
    const pageTitle = doc.title;
    const metaDescription = doc.querySelector('meta[name="description"]');
    const descriptionContent = metaDescription?.getAttribute('content') ?? '';
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
    const textAbove = (headings.length === 0 ? matchNonEmptySibling(el) : null)?.innerText ?? '';
    return sanitizeString(textAbove + headings.map((el) => el.innerText).join(''));
};

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

const normalize = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'boolean') return boolInt(val);
    return 0;
};

const featureScore = (noteFor, feat) =>
    score((fnode) => {
        const features = fnode.noteFor(noteFor);
        if (Array.isArray(feat)) return feat.map((k) => features[k]).reduce((a, b) => normalize(a) * normalize(b));
        return normalize(features[feat]);
    });

const getFieldScoreRules = (featureType, fieldType, fieldFeatures) => {
    const base = ['isCC', 'isIdentity'].map((key) =>
        rule(type(fieldType), featureScore('field', key), {
            name: `${fieldType}-${key}`,
        })
    );
    const specific = fieldFeatures.map((key) =>
        rule(type(fieldType), featureScore(featureType, key), {
            name: `${fieldType}-${key.toString()}`,
        })
    );
    return base.concat(specific);
};

const getFeaturesFromRules = (rules) => rules.map((rule) => rule.name);

const getFeatureCoeffs = (features, results) =>
    features.map((feat) => [feat, results.coeffs.find(([feature]) => feature === feat)?.[1] ?? 0]);

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
    if (!node) return 0;
    if (node.hasNoteFor(`${type}-prediction`)) return node.noteFor(`${type}-prediction`) ?? 0;
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

const fType = (type) => (fnode) => fnode.hasType(type);

const fInput = (types) => (fnode) => types.includes(fnode.element.type);

const fMatch = (selector) => (fnode) => fnode.element.matches(selector);

const fMode = (mode) => (fnode) => fnode.element.inputMode === mode;

const fActive = (fnode) => isActiveFieldFNode(fnode);

const fList = (fnode) =>
    fnode.element.getAttribute('aria-autocomplete') === 'list' || fnode.element.role === 'combobox';

const maybeEmail = and(not(fList), or(fInput(['email', 'text']), fMode('email')), fActive);

const maybePassword = and(not(fList), fMatch(kPasswordSelector), fActive);

const maybeOTP = and(fMatch(otpSelector), fActive, not(fList));

const maybeUsername = and(
    not(fList),
    or(and(not(fMode('email')), fInput(['text', 'tel'])), fMatch(kUsernameSelector)),
    fActive
);

const maybeHiddenUsername = and(not(fList), fInput(['email', 'text', 'hidden']), not(fActive));

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

const isClassifiableField = (fnode) =>
    fnode.element.tagName === 'INPUT' && isClassifiable(fnode.element) && getParentFormFnode(fnode) !== null;

const selectInputCandidates = (target = document) =>
    Array.from(target.querySelectorAll(inputCandidateSelector)).filter(isClassifiable);

const getFormParent = (form) =>
    walkUpWhile(form, MAX_FORM_FIELD_WALK_UP)((el) => el.querySelectorAll(formCandidateSelector).length <= 1);

const createInputIterator = (form) => {
    const formEls = Array.from(form.querySelectorAll(inputCandidateSelector)).filter(isVisibleField);
    return {
        prev(input) {
            const idx = formEls.indexOf(input);
            return idx === -1 ? null : (formEls?.[idx - 1] ?? null);
        },
        next(input) {
            const idx = formEls.indexOf(input);
            return idx === -1 ? null : (formEls?.[idx + 1] ?? null);
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
    const selects = visibleFields.filter(
        (el, idx, fields) => el.matches('select') && fields?.[idx + 1]?.type !== 'tel'
    );
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
        ['login-fieldsCount', 2.927386999130249],
        ['login-inputCount', -3.2543792724609375],
        ['login-fieldsetCount', -14.76281452178955],
        ['login-textCount', -8.013647079467773],
        ['login-textareaCount', -2219774432887789e-20],
        ['login-selectCount', -2.823698043823242],
        ['login-optionsCount', -1.2686188220977783],
        ['login-radioCount', -1908447529785917e-21],
        ['login-identifierCount', -2.4707329273223877],
        ['login-hiddenIdentifierCount', 4.882876396179199],
        ['login-usernameCount', 2.056591749191284],
        ['login-emailCount', -6.087424278259277],
        ['login-hiddenCount', 3.2987406253814697],
        ['login-hiddenPasswordCount', 14.524750709533691],
        ['login-submitCount', -0.9761279225349426],
        ['login-hasTels', -7.437732696533203],
        ['login-hasOAuth', 0.7324386239051819],
        ['login-hasCaptchas', 0.7022740244865417],
        ['login-hasFiles', -2.193360382207743e-9],
        ['login-hasDate', -7.2847747802734375],
        ['login-hasNumber', -0.004490213468670845],
        ['login-oneVisibleField', 2.6503803730010986],
        ['login-twoVisibleFields', 2.0250656604766846],
        ['login-threeOrMoreVisibleFields', 2.746363639831543],
        ['login-noPasswords', -11.211564064025879],
        ['login-onePassword', 4.97740364074707],
        ['login-twoPasswords', 1.44840669631958],
        ['login-threeOrMorePasswords', -15508992419199785e-22],
        ['login-noIdentifiers', -6.666215896606445],
        ['login-oneIdentifier', -0.5753201246261597],
        ['login-twoIdentifiers', -4.068027496337891],
        ['login-threeOrMoreIdentifiers', 1.1641502380371094],
        ['login-autofocusedIsIdentifier', 5.847702503204346],
        ['login-autofocusedIsPassword', 4.789667129516602],
        ['login-visibleRatio', 6.811248779296875],
        ['login-inputRatio', 1.8377376794815063],
        ['login-hiddenRatio', -2.8419692516326904],
        ['login-identifierRatio', 7.262697696685791],
        ['login-emailRatio', 2.452265977859497],
        ['login-usernameRatio', -2.7334070205688477],
        ['login-passwordRatio', -1.8226083517074585],
        ['login-requiredRatio', 2.333298921585083],
        ['login-checkboxRatio', 5.8323798179626465],
        ['login-pageLogin', 6.752157688140869],
        ['login-formTextLogin', -13685522288930847e-35],
        ['login-formAttrsLogin', 5.468729496002197],
        ['login-headingsLogin', 10.272502899169922],
        ['login-layoutLogin', 0.42712992429733276],
        ['login-rememberMeCheckbox', -7036733934255579e-28],
        ['login-troubleLink', 5.0849528312683105],
        ['login-submitLogin', 6.433938026428223],
        ['login-pageRegister', -6.045196533203125],
        ['login-formTextRegister', -218104815278139e-37],
        ['login-formAttrsRegister', -9.967616081237793],
        ['login-headingsRegister', -5.589053153991699],
        ['login-layoutRegister', -0.04577741026878357],
        ['login-pwNewRegister', -11.433897018432617],
        ['login-pwConfirmRegister', -10.519221305847168],
        ['login-submitRegister', -8.391153335571289],
        ['login-TOSRef', -3.419415235519409],
        ['login-pagePwReset', -1.4481520652770996],
        ['login-formTextPwReset', -10131755677489362e-27],
        ['login-formAttrsPwReset', -4.175885200500488],
        ['login-headingsPwReset', -7.875174522399902],
        ['login-layoutPwReset', -2.553452968597412],
        ['login-pageRecovery', -1.5019268989562988],
        ['login-formTextRecovery', -18484673928116512e-39],
        ['login-formAttrsRecovery', -13.830994606018066],
        ['login-headingsRecovery', -3.226344108581543],
        ['login-layoutRecovery', 2.394576072692871],
        ['login-identifierRecovery', 2.3322746753692627],
        ['login-submitRecovery', -7.402976989746094],
        ['login-formTextMFA', -10.994258880615234],
        ['login-formAttrsMFA', -10.444348335266113],
        ['login-inputsMFA', -8.76530933380127],
        ['login-inputsOTP', -5.610021114349365],
        ['login-newsletterForm', -3.5700602531433105],
        ['login-searchForm', -0.8535319566726685],
        ['login-multiStepForm', 1.2927677631378174],
        ['login-multiAuthForm', 9.19002914428711],
        ['login-visibleRatio,fieldsCount', -5.157893657684326],
        ['login-visibleRatio,identifierCount', -11.271872520446777],
        ['login-visibleRatio,passwordCount', 14.3850679397583],
        ['login-visibleRatio,hiddenIdentifierCount', -8.699604034423828],
        ['login-visibleRatio,hiddenPasswordCount', -2.1918187141418457],
        ['login-visibleRatio,multiStepForm', 0.4164973199367523],
        ['login-identifierRatio,fieldsCount', -5.915432929992676],
        ['login-identifierRatio,identifierCount', 3.634165048599243],
        ['login-identifierRatio,passwordCount', -3.7690846920013428],
        ['login-identifierRatio,hiddenIdentifierCount', -6.606818675994873],
        ['login-identifierRatio,hiddenPasswordCount', 1.2294526100158691],
        ['login-identifierRatio,multiStepForm', 4.659262657165527],
        ['login-passwordRatio,fieldsCount', 3.1342639923095703],
        ['login-passwordRatio,identifierCount', -3.4466683864593506],
        ['login-passwordRatio,passwordCount', -1.1097996234893799],
        ['login-passwordRatio,hiddenIdentifierCount', 10.566566467285156],
        ['login-passwordRatio,hiddenPasswordCount', 3.5204670429229736],
        ['login-passwordRatio,multiStepForm', -11.874865531921387],
        ['login-requiredRatio,fieldsCount', 11.365732192993164],
        ['login-requiredRatio,identifierCount', -6.3213348388671875],
        ['login-requiredRatio,passwordCount', 0.056943926960229874],
        ['login-requiredRatio,hiddenIdentifierCount', -2.74527645111084],
        ['login-requiredRatio,hiddenPasswordCount', 0.8426334261894226],
        ['login-requiredRatio,multiStepForm', 7.065277576446533],
    ],
    bias: -5.087364196777344,
    cutoff: 0.39,
};

const login = {
    name: FormType.LOGIN,
    coeffs: FORM_COMBINED_FEATURES.map((feat) => [
        `login-${feat}`,
        results$9.coeffs.find(([feature]) => feature === `login-${feat}`)?.[1] ?? 0,
    ]),
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
        ['pw-change-fieldsCount', -0.8003398180007935],
        ['pw-change-inputCount', -0.5977025628089905],
        ['pw-change-fieldsetCount', -0.018019281327724457],
        ['pw-change-textCount', -2.440077304840088],
        ['pw-change-textareaCount', -0.01958930864930153],
        ['pw-change-selectCount', -0.05547895282506943],
        ['pw-change-optionsCount', -0.1839827299118042],
        ['pw-change-radioCount', -0.0011174671817570925],
        ['pw-change-identifierCount', -1.9528924226760864],
        ['pw-change-hiddenIdentifierCount', -0.16626088321208954],
        ['pw-change-usernameCount', -1.0097063779830933],
        ['pw-change-emailCount', -1.1200976371765137],
        ['pw-change-hiddenCount', 0.16562728583812714],
        ['pw-change-hiddenPasswordCount', -0.8589988946914673],
        ['pw-change-submitCount', 0.08790040016174316],
        ['pw-change-hasTels', -0.07132917642593384],
        ['pw-change-hasOAuth', -0.10009688884019852],
        ['pw-change-hasCaptchas', -1.2217967510223389],
        ['pw-change-hasFiles', -0.01040494441986084],
        ['pw-change-hasDate', -2.0127440336636937e-7],
        ['pw-change-hasNumber', -0.011200589127838612],
        ['pw-change-oneVisibleField', -2.4513721466064453],
        ['pw-change-twoVisibleFields', -0.8646877408027649],
        ['pw-change-threeOrMoreVisibleFields', -0.19265295565128326],
        ['pw-change-noPasswords', -3.6528546810150146],
        ['pw-change-onePassword', -2.41567325592041],
        ['pw-change-twoPasswords', 0.6560733914375305],
        ['pw-change-threeOrMorePasswords', 1.3284480571746826],
        ['pw-change-noIdentifiers', 0.1327512413263321],
        ['pw-change-oneIdentifier', -3.553849935531616],
        ['pw-change-twoIdentifiers', -0.14857202768325806],
        ['pw-change-threeOrMoreIdentifiers', 0.8301963210105896],
        ['pw-change-autofocusedIsIdentifier', -0.4890234172344208],
        ['pw-change-autofocusedIsPassword', 1.3183847665786743],
        ['pw-change-visibleRatio', -2.1909615993499756],
        ['pw-change-inputRatio', -2.229562759399414],
        ['pw-change-hiddenRatio', 0.25980111956596375],
        ['pw-change-identifierRatio', -2.2596535682678223],
        ['pw-change-emailRatio', -1.9559518098831177],
        ['pw-change-usernameRatio', -1.234608769416809],
        ['pw-change-passwordRatio', 2.4192352294921875],
        ['pw-change-requiredRatio', 0.7251404523849487],
        ['pw-change-checkboxRatio', -0.027139052748680115],
        ['pw-change-pageLogin', -2.3448030948638916],
        ['pw-change-formTextLogin', -3843739705189364e-21],
        ['pw-change-formAttrsLogin', -1.8989006280899048],
        ['pw-change-headingsLogin', -1.2718592882156372],
        ['pw-change-layoutLogin', -1.31723153591156],
        ['pw-change-rememberMeCheckbox', -9147154742095154e-21],
        ['pw-change-troubleLink', 0.26023784279823303],
        ['pw-change-submitLogin', -1.85972261428833],
        ['pw-change-pageRegister', -0.671941339969635],
        ['pw-change-formTextRegister', 8152288176362957e-39],
        ['pw-change-formAttrsRegister', -0.15533530712127686],
        ['pw-change-headingsRegister', -0.7995667457580566],
        ['pw-change-layoutRegister', -0.22368404269218445],
        ['pw-change-pwNewRegister', 3.7181036472320557],
        ['pw-change-pwConfirmRegister', 0.4877666234970093],
        ['pw-change-submitRegister', -1.472888469696045],
        ['pw-change-TOSRef', -1.9528347253799438],
        ['pw-change-pagePwReset', 1.0883983373641968],
        ['pw-change-formTextPwReset', 0.7956320643424988],
        ['pw-change-formAttrsPwReset', 1.5076905488967896],
        ['pw-change-headingsPwReset', 3.3397092819213867],
        ['pw-change-layoutPwReset', 2.1316018104553223],
        ['pw-change-pageRecovery', -0.1275588572025299],
        ['pw-change-formTextRecovery', 16271038720201348e-39],
        ['pw-change-formAttrsRecovery', -0.05342748761177063],
        ['pw-change-headingsRecovery', 1.1696268320083618],
        ['pw-change-layoutRecovery', 0.6638686656951904],
        ['pw-change-identifierRecovery', -0.0005311351269483566],
        ['pw-change-submitRecovery', 0.905691385269165],
        ['pw-change-formTextMFA', -0.018483905121684074],
        ['pw-change-formAttrsMFA', -0.007028530817478895],
        ['pw-change-inputsMFA', -0.004924382548779249],
        ['pw-change-inputsOTP', -0.012569128535687923],
        ['pw-change-newsletterForm', -12464525980249164e-22],
        ['pw-change-searchForm', -0.06412463635206223],
        ['pw-change-multiStepForm', -1.5244776010513306],
        ['pw-change-multiAuthForm', -35159680464857956e-22],
        ['pw-change-visibleRatio,fieldsCount', -0.46611645817756653],
        ['pw-change-visibleRatio,identifierCount', -1.3680189847946167],
        ['pw-change-visibleRatio,passwordCount', 1.0877652168273926],
        ['pw-change-visibleRatio,hiddenIdentifierCount', 0.0971020832657814],
        ['pw-change-visibleRatio,hiddenPasswordCount', -0.4656573534011841],
        ['pw-change-visibleRatio,multiStepForm', -0.5300998091697693],
        ['pw-change-identifierRatio,fieldsCount', 0.3579360544681549],
        ['pw-change-identifierRatio,identifierCount', -0.8637275099754333],
        ['pw-change-identifierRatio,passwordCount', 0.3035129904747009],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -0.0028712484054267406],
        ['pw-change-identifierRatio,hiddenPasswordCount', -0.00012595430598594248],
        ['pw-change-identifierRatio,multiStepForm', -0.2640132009983063],
        ['pw-change-passwordRatio,fieldsCount', 0.6886065602302551],
        ['pw-change-passwordRatio,identifierCount', 0.31139788031578064],
        ['pw-change-passwordRatio,passwordCount', 2.589139938354492],
        ['pw-change-passwordRatio,hiddenIdentifierCount', -0.214838445186615],
        ['pw-change-passwordRatio,hiddenPasswordCount', -0.4709770381450653],
        ['pw-change-passwordRatio,multiStepForm', -0.411338210105896],
        ['pw-change-requiredRatio,fieldsCount', -0.11764531582593918],
        ['pw-change-requiredRatio,identifierCount', -0.48298370838165283],
        ['pw-change-requiredRatio,passwordCount', 0.8789266347885132],
        ['pw-change-requiredRatio,hiddenIdentifierCount', 0.2618640959262848],
        ['pw-change-requiredRatio,hiddenPasswordCount', -0.0007013130816631019],
        ['pw-change-requiredRatio,multiStepForm', -0.3574320375919342],
    ],
    bias: -2.4839224815368652,
    cutoff: 0.99,
};

const passwordChange = {
    name: FormType.PASSWORD_CHANGE,
    coeffs: FORM_COMBINED_FEATURES.map((key) => [
        `pw-change-${key}`,
        results$8.coeffs.find(([feature]) => feature === `pw-change-${key}`)?.[1] ?? 0,
    ]),
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
        ['recovery-fieldsCount', 5.313049793243408],
        ['recovery-inputCount', 4.359094142913818],
        ['recovery-fieldsetCount', 1.691162109375],
        ['recovery-textCount', -5.312057018280029],
        ['recovery-textareaCount', -6.405457973480225],
        ['recovery-selectCount', -4.2464919090271],
        ['recovery-optionsCount', -5.148159503936768],
        ['recovery-radioCount', -0.0037921557668596506],
        ['recovery-identifierCount', -1.282425880432129],
        ['recovery-hiddenIdentifierCount', -6.861511707305908],
        ['recovery-usernameCount', 8.797577857971191],
        ['recovery-emailCount', 0.32599663734436035],
        ['recovery-hiddenCount', 6.106296062469482],
        ['recovery-hiddenPasswordCount', -13.269256591796875],
        ['recovery-submitCount', 6.688168048858643],
        ['recovery-hasTels', -3.8338215351104736],
        ['recovery-hasOAuth', -3.203033685684204],
        ['recovery-hasCaptchas', 1.7261978387832642],
        ['recovery-hasFiles', -12.78122615814209],
        ['recovery-hasDate', -4.193575975364183e-8],
        ['recovery-hasNumber', -0.5085955262184143],
        ['recovery-oneVisibleField', -2.723554849624634],
        ['recovery-twoVisibleFields', -3.4646363258361816],
        ['recovery-threeOrMoreVisibleFields', -1.0035455226898193],
        ['recovery-noPasswords', 3.2684388160705566],
        ['recovery-onePassword', -8.870177268981934],
        ['recovery-twoPasswords', -3.353058099746704],
        ['recovery-threeOrMorePasswords', -1.5386360883712769],
        ['recovery-noIdentifiers', -7.489476203918457],
        ['recovery-oneIdentifier', 2.1236608028411865],
        ['recovery-twoIdentifiers', 0.5434704422950745],
        ['recovery-threeOrMoreIdentifiers', -5.022843360900879],
        ['recovery-autofocusedIsIdentifier', 0.5459277033805847],
        ['recovery-autofocusedIsPassword', -4072559997569947e-27],
        ['recovery-visibleRatio', 3.16082763671875],
        ['recovery-inputRatio', -6.980765342712402],
        ['recovery-hiddenRatio', -1.3351936340332031],
        ['recovery-identifierRatio', -0.6959307193756104],
        ['recovery-emailRatio', -2.8819143772125244],
        ['recovery-usernameRatio', 1.8502178192138672],
        ['recovery-passwordRatio', -5.3822922706604],
        ['recovery-requiredRatio', -0.9553635120391846],
        ['recovery-checkboxRatio', -0.12489757686853409],
        ['recovery-pageLogin', -0.4934912323951721],
        ['recovery-formTextLogin', -4178651943220757e-20],
        ['recovery-formAttrsLogin', -1.6605228185653687],
        ['recovery-headingsLogin', 1.2534046173095703],
        ['recovery-layoutLogin', -8.705461502075195],
        ['recovery-rememberMeCheckbox', -0.4900079071521759],
        ['recovery-troubleLink', 7.031951904296875],
        ['recovery-submitLogin', -2.582918167114258],
        ['recovery-pageRegister', -4.889695167541504],
        ['recovery-formTextRegister', 1228747416456525e-38],
        ['recovery-formAttrsRegister', -3.192971706390381],
        ['recovery-headingsRegister', -1.9337795972824097],
        ['recovery-layoutRegister', -4.12026309967041],
        ['recovery-pwNewRegister', -1.578752875328064],
        ['recovery-pwConfirmRegister', -1.5129172801971436],
        ['recovery-submitRegister', -2.5925095081329346],
        ['recovery-TOSRef', -10.534214973449707],
        ['recovery-pagePwReset', -2.070256471633911],
        ['recovery-formTextPwReset', -1.5393427610397339],
        ['recovery-formAttrsPwReset', 1.6444480419158936],
        ['recovery-headingsPwReset', 5.953372478485107],
        ['recovery-layoutPwReset', 0.08728691190481186],
        ['recovery-pageRecovery', 9.450271606445312],
        ['recovery-formTextRecovery', 3481874263464502e-40],
        ['recovery-formAttrsRecovery', 9.650130271911621],
        ['recovery-headingsRecovery', 4.172167778015137],
        ['recovery-layoutRecovery', 0.16524472832679749],
        ['recovery-identifierRecovery', 8.075864791870117],
        ['recovery-submitRecovery', 9.927176475524902],
        ['recovery-formTextMFA', -1.462562084197998],
        ['recovery-formAttrsMFA', 5.369898796081543],
        ['recovery-inputsMFA', -4.528599739074707],
        ['recovery-inputsOTP', -0.8863404393196106],
        ['recovery-newsletterForm', -1.8659414052963257],
        ['recovery-searchForm', -1.7143646478652954],
        ['recovery-multiStepForm', 0.4358965754508972],
        ['recovery-multiAuthForm', -1.7528802156448364],
        ['recovery-visibleRatio,fieldsCount', -4.500779151916504],
        ['recovery-visibleRatio,identifierCount', 0.449527382850647],
        ['recovery-visibleRatio,passwordCount', -2.844212293624878],
        ['recovery-visibleRatio,hiddenIdentifierCount', -0.6468444466590881],
        ['recovery-visibleRatio,hiddenPasswordCount', -3.30956768989563],
        ['recovery-visibleRatio,multiStepForm', 2.562746286392212],
        ['recovery-identifierRatio,fieldsCount', 3.3151984214782715],
        ['recovery-identifierRatio,identifierCount', 5.806978225708008],
        ['recovery-identifierRatio,passwordCount', -3.4098384380340576],
        ['recovery-identifierRatio,hiddenIdentifierCount', -5.544137001037598],
        ['recovery-identifierRatio,hiddenPasswordCount', -13.254154205322266],
        ['recovery-identifierRatio,multiStepForm', 0.15300121903419495],
        ['recovery-passwordRatio,fieldsCount', -2.917494297027588],
        ['recovery-passwordRatio,identifierCount', -3.1850242614746094],
        ['recovery-passwordRatio,passwordCount', -3.38489031791687],
        ['recovery-passwordRatio,hiddenIdentifierCount', -0.43917569518089294],
        ['recovery-passwordRatio,hiddenPasswordCount', -7.08546998851034e-9],
        ['recovery-passwordRatio,multiStepForm', -0.0272145327180624],
        ['recovery-requiredRatio,fieldsCount', -11.467854499816895],
        ['recovery-requiredRatio,identifierCount', 2.9054698944091797],
        ['recovery-requiredRatio,passwordCount', -0.07127892971038818],
        ['recovery-requiredRatio,hiddenIdentifierCount', 3.1550774574279785],
        ['recovery-requiredRatio,hiddenPasswordCount', -4.482492710344843e-10],
        ['recovery-requiredRatio,multiStepForm', -4.407073497772217],
    ],
    bias: -4.079639434814453,
    cutoff: 0.52,
};

const recovery = {
    name: FormType.RECOVERY,
    coeffs: FORM_COMBINED_FEATURES.map((key) => [
        `recovery-${key}`,
        results$7.coeffs.find(([feature]) => feature === `recovery-${key}`)?.[1] ?? 0,
    ]),
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
        ['register-fieldsCount', 5.210845947265625],
        ['register-inputCount', 6.766363143920898],
        ['register-fieldsetCount', 6.3033294677734375],
        ['register-textCount', 8.334157943725586],
        ['register-textareaCount', 3.51412296295166],
        ['register-selectCount', -3.9812235832214355],
        ['register-optionsCount', 0.333624929189682],
        ['register-radioCount', -0.00950750894844532],
        ['register-identifierCount', -3.371565103530884],
        ['register-hiddenIdentifierCount', 12.204707145690918],
        ['register-usernameCount', 3.9893641471862793],
        ['register-emailCount', 0.5911213159561157],
        ['register-hiddenCount', -13.403359413146973],
        ['register-hiddenPasswordCount', 3.73751163482666],
        ['register-submitCount', -1.3575936555862427],
        ['register-hasTels', -2.342338800430298],
        ['register-hasOAuth', -0.8879578113555908],
        ['register-hasCaptchas', 3.625269889831543],
        ['register-hasFiles', -1.8751925230026245],
        ['register-hasDate', -38469165969856525e-31],
        ['register-hasNumber', 9.350281715393066],
        ['register-oneVisibleField', -2.761307716369629],
        ['register-twoVisibleFields', 1.1022155284881592],
        ['register-threeOrMoreVisibleFields', -0.5204487442970276],
        ['register-noPasswords', -6.163815021514893],
        ['register-onePassword', -2.0012378692626953],
        ['register-twoPasswords', 7.790881156921387],
        ['register-threeOrMorePasswords', -0.9433362483978271],
        ['register-noIdentifiers', -1.0110069513320923],
        ['register-oneIdentifier', -0.9724254012107849],
        ['register-twoIdentifiers', 1.857569932937622],
        ['register-threeOrMoreIdentifiers', -7.738020896911621],
        ['register-autofocusedIsIdentifier', -0.109257772564888],
        ['register-autofocusedIsPassword', 2.954988718032837],
        ['register-visibleRatio', -1.086391806602478],
        ['register-inputRatio', -6.14445686340332],
        ['register-hiddenRatio', 13.006001472473145],
        ['register-identifierRatio', 7.567465782165527],
        ['register-emailRatio', -3.304899215698242],
        ['register-usernameRatio', -7.604073524475098],
        ['register-passwordRatio', -1.3865065574645996],
        ['register-requiredRatio', -3.082972764968872],
        ['register-checkboxRatio', -9.311186790466309],
        ['register-pageLogin', -5.471749782562256],
        ['register-formTextLogin', -3478850540972189e-26],
        ['register-formAttrsLogin', -1.3656343221664429],
        ['register-headingsLogin', -5.377528190612793],
        ['register-layoutLogin', 2.697298288345337],
        ['register-rememberMeCheckbox', -1.7344321012496948],
        ['register-troubleLink', -10.924565315246582],
        ['register-submitLogin', -7.327751636505127],
        ['register-pageRegister', 9.941000938415527],
        ['register-formTextRegister', 1904707811099754e-38],
        ['register-formAttrsRegister', 5.490270614624023],
        ['register-headingsRegister', 8.987611770629883],
        ['register-layoutRegister', 0.9015561938285828],
        ['register-pwNewRegister', 9.980866432189941],
        ['register-pwConfirmRegister', 4.711257457733154],
        ['register-submitRegister', 18.09737777709961],
        ['register-TOSRef', 4.484897613525391],
        ['register-pagePwReset', -0.764405369758606],
        ['register-formTextPwReset', -4943932260380746e-31],
        ['register-formAttrsPwReset', -0.0011132756480947137],
        ['register-headingsPwReset', -3.8719642162323],
        ['register-layoutPwReset', -17.70720863342285],
        ['register-pageRecovery', -0.8422960042953491],
        ['register-formTextRecovery', -13737517259775442e-39],
        ['register-formAttrsRecovery', -8.507560729980469],
        ['register-headingsRecovery', -1.9731109142303467],
        ['register-layoutRecovery', 0.4243716299533844],
        ['register-identifierRecovery', -0.09292946755886078],
        ['register-submitRecovery', -15.362475395202637],
        ['register-formTextMFA', -2.7634973526000977],
        ['register-formAttrsMFA', -6.3655219078063965],
        ['register-inputsMFA', -0.4413621425628662],
        ['register-inputsOTP', -1.6210463047027588],
        ['register-newsletterForm', -8.16782283782959],
        ['register-searchForm', -3.7734289169311523],
        ['register-multiStepForm', -0.12080948799848557],
        ['register-multiAuthForm', 1.215602993965149],
        ['register-visibleRatio,fieldsCount', -9.350564956665039],
        ['register-visibleRatio,identifierCount', 0.5288902521133423],
        ['register-visibleRatio,passwordCount', -3.445997476577759],
        ['register-visibleRatio,hiddenIdentifierCount', -4.455558776855469],
        ['register-visibleRatio,hiddenPasswordCount', -7.486689567565918],
        ['register-visibleRatio,multiStepForm', 5.98289680480957],
        ['register-identifierRatio,fieldsCount', 4.1536030769348145],
        ['register-identifierRatio,identifierCount', 10.563194274902344],
        ['register-identifierRatio,passwordCount', -6.924158573150635],
        ['register-identifierRatio,hiddenIdentifierCount', -7.879584312438965],
        ['register-identifierRatio,hiddenPasswordCount', 0.6761246919631958],
        ['register-identifierRatio,multiStepForm', 6.52324104309082],
        ['register-passwordRatio,fieldsCount', -1.0286563634872437],
        ['register-passwordRatio,identifierCount', -7.375979423522949],
        ['register-passwordRatio,passwordCount', -3.801306962966919],
        ['register-passwordRatio,hiddenIdentifierCount', 4.798539161682129],
        ['register-passwordRatio,hiddenPasswordCount', -6.760272026062012],
        ['register-passwordRatio,multiStepForm', 8.325553894042969],
        ['register-requiredRatio,fieldsCount', -6.023263931274414],
        ['register-requiredRatio,identifierCount', 5.185380458831787],
        ['register-requiredRatio,passwordCount', 0.8526945114135742],
        ['register-requiredRatio,hiddenIdentifierCount', -3.339123487472534],
        ['register-requiredRatio,hiddenPasswordCount', -4489044840738643e-21],
        ['register-requiredRatio,multiStepForm', 3.838860034942627],
    ],
    bias: -2.88071346282959,
    cutoff: 0.47,
};

const register = {
    name: FormType.REGISTER,
    coeffs: FORM_COMBINED_FEATURES.map((key) => [
        `register-${key}`,
        results$6.coeffs.find(([feature]) => feature === `register-${key}`)?.[1] ?? 0,
    ]),
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

const EMAIL_FEATURES = [
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
        ['email-isCC', -0.4428045153617859],
        ['email-isIdentity', -9.341217994689941],
        ['email-autocompleteUsername', 0.8845581412315369],
        ['email-autocompleteNickname', 1546155699091786e-38],
        ['email-autocompleteEmail', 0.6183565258979797],
        ['email-typeEmail', 11.186606407165527],
        ['email-exactAttrEmail', 10.04401969909668],
        ['email-attrEmail', 1.757777214050293],
        ['email-textEmail', 11.131197929382324],
        ['email-labelEmail', 13.647784233093262],
        ['email-placeholderEmail', 2.1679694652557373],
        ['email-searchField', -9.075803756713867],
    ],
    bias: -7.502569198608398,
    cutoff: 0.97,
};

const scores$5 = getFieldScoreRules('email-field', FieldType.EMAIL, EMAIL_FEATURES);

const email = {
    name: FieldType.EMAIL,
    coeffs: getFeatureCoeffs(getFeaturesFromRules(scores$5), results$5),
    bias: results$5.bias,
    cutoff: results$5.cutoff,
    getRules: () => [
        rule(type('email-field'), type(FieldType.EMAIL), {}),
        ...scores$5,
        ...outRuleWithCache('field-candidate', FieldType.EMAIL),
    ],
};

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
    const attrs = IDENTITY_ATTRIBUTES.map((attr) => input?.getAttribute(attr) ?? '');
    return sanitizeStringWithSpaces(attrs.join(' '));
};

const getIdentityFieldType = (input) => {
    const haystack = getIdentityHaystack(input);
    if (haystack) return IDENTITY_RE_MAP.find(([, test]) => test(haystack))?.[0];
};

const isAutocompleteListInput = (el) => el.getAttribute('aria-autocomplete') === 'list' || el.role === 'combobox';

const matchIdentityField = (input, { form, searchField, type, visible }) => {
    const outlierField =
        (type && !IDENTITY_INPUT_TYPES.includes(type)) || input.getAttribute('autocomplete')?.includes('email');
    const outlierForm = form.login || form.recovery;
    if (!visible || outlierForm || outlierField) return false;
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

const isIdentity = (fnode) => {
    const { isIdentity, isCC } = fnode.noteFor('field');
    return isIdentity && !isCC;
};

const identity = [
    rule(type('field').when(isIdentity), type('identity-field'), {}),
    rule(type('identity-field'), type(FieldType.IDENTITY), {}),
    ...outRuleWithCache('field-candidate', FieldType.IDENTITY, () => () => true),
];

const getOTPFieldFeatures = (fnode) => {
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField, type, minLength, maxLength } = fieldFeatures;
    const formFeatures = fieldFeatures.formFeatures;
    const formMFA = Boolean(formFeatures?.formMFA);
    const formOTPOutlier = Boolean(formFeatures?.formOTPOutlier);
    const linkOutlier = Boolean(formFeatures?.linkOTPOutlier);
    const visibleInputsCount = formFeatures?.visibleInputsCount;
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
    const prevCheck = maybeGroup && prevField && prevField?.getAttribute('type') === type;
    const nextCheck = maybeGroup && nextField && nextField?.getAttribute('type') === type;
    const prevAligned = prevCheck ? top === prevRect?.top && bottom === prevRect?.bottom : false;
    const prevArea = prevCheck ? area === prevRect?.area : false;
    const nextAligned = nextCheck ? top === nextRect?.top && bottom === nextRect?.bottom : false;
    const nextArea = nextCheck ? area === nextRect?.area : false;
    const attrOTP = any(matchOtpAttr)(fieldAttrs);
    const attrMFA = any(matchMfaAttr)(fieldAttrs);
    const attrOutlier = any(matchOtpOutlier)(fieldAttrs);
    const textOTP = matchOtpAttr(fieldText);
    const textMFA = matchMfa(fieldText);
    const labelOTP = matchOtpAttr(labelText);
    const labelMFA = matchMfa(labelText);
    const labelOutlier = matchOtpOutlier(labelText);
    const formText = fieldFeatures?.formFnode?.element?.innerText ?? '';
    const parents = [getNthParent(field)(1), getNthParent(field)(2)];
    const wrapperAttrs = parents.flatMap(getBaseAttributes);
    const wrapperOTP = any(matchOtpAttr)(wrapperAttrs);
    const wrapperOutlier = any(matchOtpOutlier)(wrapperAttrs);
    const invalidInputCount = !(visibleInputsCount === 1 || visibleInputsCount === 6);
    const maxLengthExpected = maxLength === 1 || maxLength === 6;
    const maxLengthInvalid = maxLength > 10;
    const siblingOfInterest = prevAligned || nextAligned;
    const otpSmells = wrapperOTP || attrOTP || textOTP || labelOTP;
    const emailOutlierCount = otpSmells ? (formText.match(/@/g)?.length ?? 0) : 0;
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

const OTP_FEATURES = [
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
    ...combineFeatures(
        ['autocompleteOTC', 'siblingOfInterest', 'formMFA'],
        ['inputCountOutlier', 'maxLengthInvalid', 'attrOTP']
    ),
];

const results$4 = {
    coeffs: [
        ['otp-isCC', -0.20493924617767334],
        ['otp-isIdentity', -3.531562089920044],
        ['otp-formMFA', 5.521277904510498],
        ['otp-formOutlier', -0.22839659452438354],
        ['otp-fieldOutlier', -11.264449119567871],
        ['otp-linkOutlier', -6.512322902679443],
        ['otp-emailOutlierCount', -5.389652729034424],
        ['otp-inputCountOutlier', -1.3378182649612427],
        ['otp-nameMatch', 5.206925392150879],
        ['otp-idMatch', 3.6877825260162354],
        ['otp-numericMode', 3.7926275730133057],
        ['otp-patternOTP', 3.404642343521118],
        ['otp-maxLengthExpected', 1.293200969696045],
        ['otp-maxLengthInvalid', -0.33193057775497437],
        ['otp-maxLength1', 1.607079029083252],
        ['otp-maxLength5', -1.089479923248291],
        ['otp-minLength6', 4.325993537902832],
        ['otp-maxLength6', -0.2972670793533325],
        ['otp-autocompleteOTC', 3.539438247680664],
        ['otp-prevAligned', 1.9763542413711548],
        ['otp-prevArea', 1.422334909439087],
        ['otp-nextAligned', 1.5550743341445923],
        ['otp-nextArea', 1.562651515007019],
        ['otp-attrMFA', 15.993041038513184],
        ['otp-attrOTP', 10.855820655822754],
        ['otp-textMFA', 4.178463935852051],
        ['otp-textOTP', -1.785516619682312],
        ['otp-labelMFA', 7.088779449462891],
        ['otp-labelOTP', 1.4286224842071533],
        ['otp-wrapperOTP', -5.322438716888428],
        ['otp-autocompleteOTC,inputCountOutlier', -0.1939711719751358],
        ['otp-autocompleteOTC,maxLengthInvalid', -7.578559875488281],
        ['otp-autocompleteOTC,attrOTP', -31712491117633106e-38],
        ['otp-siblingOfInterest,inputCountOutlier', -0.7930904626846313],
        ['otp-siblingOfInterest,maxLengthInvalid', -0.0875760167837143],
        ['otp-siblingOfInterest,attrOTP', 4.341383252892683e-9],
        ['otp-formMFA,inputCountOutlier', 1.4842898845672607],
        ['otp-formMFA,maxLengthInvalid', -6.331032752990723],
        ['otp-formMFA,attrOTP', 1.4451402425765991],
    ],
    bias: -7.380406856536865,
    cutoff: 0.5,
};

const scores$4 = getFieldScoreRules('otp-field', FieldType.OTP, OTP_FEATURES);

const otp = {
    name: FieldType.OTP,
    coeffs: getFeatureCoeffs(getFeaturesFromRules(scores$4), results$4),
    bias: results$4.bias,
    cutoff: results$4.cutoff,
    getRules: () => [
        rule(type('otp-field'), type(FieldType.OTP), {}),
        ...getFieldScoreRules('otp-field', FieldType.OTP, OTP_FEATURES),
        ...outRuleWithCache('field-candidate', FieldType.OTP),
    ],
};

const isAutocompleteCurrentPassword = (value) => value === 'current-password' || value === 'password';

const isAutocompleteNewPassword = (value) => value === 'new-password';

const getPasswordFieldFeatures = (fnode) => {
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
    const prevAutocomplete = prevPwField?.getAttribute('autocomplete');
    const prevAutocompleteCurrent = isAutocompleteCurrentPassword(prevAutocomplete);
    const prevPwCurrent = prevAutocompleteCurrent || any(matchPasswordCurrent)(prevPwHaystack);
    const prevAutocompleteNew = isAutocompleteNewPassword(prevAutocomplete);
    const prevPwNew = prevAutocompleteNew || any(matchPasswordCreate)(prevPwHaystack);
    const prevPwConfirm = any(matchPasswordConfirm)(prevPwHaystack);
    const nextAutocomplete = nextPwField?.getAttribute('autocomplete');
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
        isOnlyPassword: fieldFeatures.formFeatures?.onePassword ?? 0,
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

const PW_FEATURES = [
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
    ...combineFeatures(['prevPwCurrent'], ['nextPwNew']),
];

const results$3 = {
    coeffs: [
        ['password-isCC', -21457571980088797e-39],
        ['password-isIdentity', -2060605343088789e-38],
        ['password-loginScore', 10.37464427947998],
        ['password-registerScore', -5.8348259925842285],
        ['password-pwChangeScore', 0.6545398831367493],
        ['password-exotic', -10965262823602501e-39],
        ['password-autocompleteNew', -2.1763060092926025],
        ['password-autocompleteCurrent', 1.0594096183776855],
        ['password-autocompleteOff', -0.13250236213207245],
        ['password-isOnlyPassword', 1.2031595706939697],
        ['password-prevPwField', -2.258246660232544],
        ['password-nextPwField', -2.9027814865112305],
        ['password-attrCreate', -1.8392138481140137],
        ['password-attrCurrent', 1.1045093536376953],
        ['password-attrConfirm', -0.6964134573936462],
        ['password-attrReset', -19909722754405682e-39],
        ['password-textCreate', -1.6081569194793701],
        ['password-textCurrent', 1.3878214359283447],
        ['password-textConfirm', -0.28001299500465393],
        ['password-textReset', -1847973565884983e-38],
        ['password-labelCreate', -0.2799703776836395],
        ['password-labelCurrent', 3.5015904903411865],
        ['password-labelConfirm', -0.29814308881759644],
        ['password-labelReset', -19993835837285778e-39],
        ['password-prevPwNew', -1.6690737009048462],
        ['password-prevPwCurrent', -1.3657258749008179],
        ['password-prevPwConfirm', -21403677003044097e-39],
        ['password-nextPwNew', 5.956696510314941],
        ['password-nextPwCurrent', -0.0018757592188194394],
        ['password-nextPwConfirm', -2.2174417972564697],
        ['password-passwordOutlier', -8.391630172729492],
        ['password-prevPwCurrent,nextPwNew', -1.2457809448242188],
    ],
    bias: -2.442491054534912,
    cutoff: 0.5,
};

const scores$3 = getFieldScoreRules('password-field', FieldType.PASSWORD_CURRENT, PW_FEATURES);

const password = {
    name: FieldType.PASSWORD_CURRENT,
    coeffs: getFeatureCoeffs(getFeaturesFromRules(scores$3), results$3),
    bias: results$3.bias,
    cutoff: results$3.cutoff,
    getRules: () => [
        rule(type('password-field'), type(FieldType.PASSWORD_CURRENT), {}),
        ...scores$3,
        ...outRuleWithCache('field-candidate', FieldType.PASSWORD_CURRENT),
    ],
};

const results$2 = {
    coeffs: [
        ['new-password-isCC', 10809256113264183e-40],
        ['new-password-isIdentity', -19137336420329306e-39],
        ['new-password-loginScore', -9.528014183044434],
        ['new-password-registerScore', 6.408717632293701],
        ['new-password-pwChangeScore', 2.076183319091797],
        ['new-password-exotic', 3.0075714588165283],
        ['new-password-autocompleteNew', -0.2956458032131195],
        ['new-password-autocompleteCurrent', -0.9853854775428772],
        ['new-password-autocompleteOff', 0.5837144255638123],
        ['new-password-isOnlyPassword', 0.012302965857088566],
        ['new-password-prevPwField', 2.371279716491699],
        ['new-password-nextPwField', -0.030298715457320213],
        ['new-password-attrCreate', 1.6346499919891357],
        ['new-password-attrCurrent', -1.2929123640060425],
        ['new-password-attrConfirm', 0.5855518579483032],
        ['new-password-attrReset', -19363412911712975e-39],
        ['new-password-textCreate', 1.5180071592330933],
        ['new-password-textCurrent', -1.6761455535888672],
        ['new-password-textConfirm', 0.31734028458595276],
        ['new-password-textReset', -19507585130751167e-39],
        ['new-password-labelCreate', 0.21326036751270294],
        ['new-password-labelCurrent', -3.847903251647949],
        ['new-password-labelConfirm', 0.39629510045051575],
        ['new-password-labelReset', 4421461244124282e-39],
        ['new-password-prevPwNew', 1.2098488807678223],
        ['new-password-prevPwCurrent', 1.4759600162506104],
        ['new-password-prevPwConfirm', 21072390132731102e-39],
        ['new-password-nextPwNew', -3.6918656826019287],
        ['new-password-nextPwCurrent', 0.019466396421194077],
        ['new-password-nextPwConfirm', 3.8985795974731445],
        ['new-password-passwordOutlier', -12.142952919006348],
        ['new-password-prevPwCurrent,nextPwNew', 1.4427424669265747],
    ],
    bias: 0.805936872959137,
    cutoff: 0.51,
};

const scores$2 = getFieldScoreRules('password-field', FieldType.PASSWORD_NEW, PW_FEATURES);

const newPassword = {
    name: FieldType.PASSWORD_NEW,
    coeffs: getFeatureCoeffs(getFeaturesFromRules(scores$2), results$2),
    bias: results$2.bias,
    cutoff: results$2.cutoff,
    getRules: () => [
        rule(type('password-field'), type(FieldType.PASSWORD_NEW), {}),
        ...scores$2,
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

const USERNAME_FEATURES = [
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
        ['username-isCC', -0.6073178648948669],
        ['username-isIdentity', -1.8205775022506714],
        ['username-autocompleteUsername', 1.9679150581359863],
        ['username-autocompleteNickname', -9387854979800755e-39],
        ['username-autocompleteEmail', -0.37613362073898315],
        ['username-autocompleteOff', -0.40994301438331604],
        ['username-attrUsername', 13.586647987365723],
        ['username-textUsername', 11.194229125976562],
        ['username-labelUsername', 13.071738243103027],
        ['username-outlierUsername', 0.27147698402404785],
        ['username-loginUsername', 13.411073684692383],
        ['username-searchField', -1.5172803401947021],
    ],
    bias: -7.492874622344971,
    cutoff: 0.49,
};

const scores$1 = getFieldScoreRules('username-field', FieldType.USERNAME, USERNAME_FEATURES);

const username = {
    name: FieldType.USERNAME,
    coeffs: getFeatureCoeffs(getFeaturesFromRules(scores$1), results$1),
    bias: results$1.bias,
    cutoff: results$1.cutoff,
    getRules: () => [
        rule(type('username-field'), type(FieldType.USERNAME), {}),
        ...scores$1,
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

const USERNAME_HIDDEN_FEATURES = [
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
        ['username-hidden-isCC', 19612200708557957e-39],
        ['username-hidden-isIdentity', 17091548724939827e-39],
        ['username-hidden-exotic', -0.654423177242279],
        ['username-hidden-attrUsername', 8.978160858154297],
        ['username-hidden-attrEmail', 7.603890419006348],
        ['username-hidden-usernameAttr', 8.995283126831055],
        ['username-hidden-autocompleteUsername', 1.220141053199768],
        ['username-hidden-visibleReadonly', 5.932170867919922],
        ['username-hidden-hiddenEmailValue', 10.559565544128418],
        ['username-hidden-hiddenTelValue', 0.3799050450325012],
        ['username-hidden-hiddenUsernameValue', -0.03197519853711128],
    ],
    bias: -13.085716247558594,
    cutoff: 0.52,
};

const scores = getFieldScoreRules('username-hidden-field', FieldType.USERNAME_HIDDEN, USERNAME_HIDDEN_FEATURES);

const usernameHidden = {
    name: FieldType.USERNAME_HIDDEN,
    coeffs: getFeatureCoeffs(getFeaturesFromRules(scores), results),
    bias: results.bias,
    cutoff: results.cutoff,
    getRules: () => [
        rule(type('username-hidden-field'), type(FieldType.USERNAME_HIDDEN), {}),
        ...scores,
        ...outRuleWithCache('field-candidate', FieldType.USERNAME_HIDDEN),
    ],
};

const CC_ATTRIBUTES = [
    'autocomplete',
    'name',
    'id',
    'class',
    'aria-label',
    'placeholder',
    'data-testid',
    'data-stripe',
    'data-recurly',
];

const CC_INPUT_TYPES = ['tel', 'phone', 'text', 'number'];

const CC_EXP_YEAR_FORMAT = ['YYYY', 'AAAA', 'YY', 'AA'];

const CC_EXP_MONTH_FORMAT = ['MM', 'LL'];

const CC_EXP_SEPARATOR = ['', '/', '-'];

const CC_EXP_DEFAULT_FORMAT = {
    separator: '/',
    fullYear: false,
    monthFirst: true,
};

const CC_EXP_FORMATS = [
    {
        fullYear: true,
        monthFirst: true,
    },
    {
        fullYear: false,
        monthFirst: true,
    },
    {
        fullYear: true,
        monthFirst: false,
    },
    {
        fullYear: false,
        monthFirst: false,
    },
];

const MAX_LENGTH_FORMAT_MAP = {
    4: {
        separator: '',
        fullYear: false,
        monthFirst: true,
    },
    5: {
        separator: '/',
        fullYear: false,
        monthFirst: true,
    },
    6: {
        separator: '',
        fullYear: true,
        monthFirst: true,
    },
    7: {
        separator: '/',
        fullYear: true,
        monthFirst: true,
    },
};

const YEAR_OPTION = (new Date().getFullYear() + 1).toString();

const generateExpirationString = ({ fullYear, separator, monthFirst }) => {
    const month = '01';
    const year = fullYear ? '2025' : '25';
    return monthFirst ? `${month}${separator}${year}` : `${year}${separator}${month}`;
};

const getExpirationFormatFromPattern = (pattern) => {
    try {
        const regex = new RegExp(`^${pattern}$`);
        for (const format of CC_EXP_FORMATS) {
            for (const separator of CC_EXP_SEPARATOR) {
                const testString = generateExpirationString({
                    ...format,
                    separator,
                });
                if (regex.test(testString)) {
                    return {
                        separator,
                        fullYear: format.fullYear,
                        monthFirst: format.monthFirst,
                    };
                }
            }
        }
    } catch {}
};

const getCCFormatHaystack = (input) => {
    const { placeholder, className, id, name } = input;
    const ariaLabel = input.getAttribute('aria-label');
    const label = getLabelFor(input)?.innerText;
    return [className, id, name, ariaLabel, placeholder.replace(/\s/g, ''), label?.replace(/\s/g, '')]
        .filter(Boolean)
        .join(' ')
        .toUpperCase();
};

const getExpirationFormatFromMaxLength = (maxLength) => MAX_LENGTH_FORMAT_MAP[maxLength];

const getExpirationFormatFromAttributes = (input) => {
    const haystack = getCCFormatHaystack(input);
    for (const separator of CC_EXP_SEPARATOR) {
        for (const year of CC_EXP_YEAR_FORMAT) {
            for (const monthFirst of [true, false]) {
                if (haystack.includes(monthFirst ? `MM${separator}${year}` : `${year}${separator}MM`)) {
                    return {
                        separator,
                        fullYear: year.length === 4,
                        monthFirst,
                    };
                }
            }
        }
    }
};

const getExpirationFormat = (field, allowFallback = true) => {
    if (field instanceof HTMLInputElement) {
        const validMaxLength = field.maxLength >= 4;
        const validPattern = field.pattern && (field.maxLength === -1 || validMaxLength);
        return (
            getExpirationFormatFromAttributes(field) ||
            (validPattern && getExpirationFormatFromPattern(field.pattern)) ||
            (validMaxLength && getExpirationFormatFromMaxLength(field.maxLength)) ||
            (allowFallback ? CC_EXP_DEFAULT_FORMAT : undefined)
        );
    }
};

const formatExpirationDate = (month, year, { fullYear, separator, monthFirst }) => {
    const formattedYear = fullYear ? year.slice(0, 4) : year.slice(-2);
    const formattedMonth = month.padStart(2, '0');
    const components = monthFirst ? [formattedMonth, formattedYear] : [formattedYear, formattedMonth];
    return components.join(separator);
};

const getSelectOptions = (el) =>
    Array.from(el.options)
        .map((opt) => opt.value)
        .filter(Boolean);

const getInputExpirationMonthFormat = (input) => {
    const haystack = getCCFormatHaystack(input);
    if (CC_EXP_MONTH_FORMAT.some((pattern) => haystack.includes(pattern)))
        return {
            padding: true,
        };
    return {
        padding: input.minLength === 2 || input.maxLength === 2,
    };
};

const getInputExpirationYearFormat = (input) => {
    if (input.minLength === 4)
        return {
            fullYear: true,
        };
    const haystack = getCCFormatHaystack(input);
    for (const year of CC_EXP_YEAR_FORMAT) {
        if (haystack.includes(year))
            return {
                fullYear: year.length === 4,
            };
    }
    return {
        fullYear: false,
    };
};

const getSelectExpirationYearFormat = (select) => {
    const options = getSelectOptions(select);
    if (options.some((value) => /^\d{4}$/.test(value)))
        return {
            fullYear: true,
        };
    if (options.some((value) => /^\d{2}$/.test(value)))
        return {
            fullYear: false,
        };
};

const getSelectExpirationMonthFormat = (select) => {
    const options = getSelectOptions(select);
    if (options.some((value) => /^0[1-9]$/.test(value)))
        return {
            padding: true,
        };
    if (options.some((value) => /^([1-9]|1[0-2])$/.test(value)))
        return {
            padding: false,
        };
};

const notCCIdentityOutlier = (field) => {
    const autocomplete = field?.autocomplete ?? '';
    if (autocomplete.includes('cc-given-name')) return true;
    if (autocomplete.includes('cc-family-name')) return true;
    if (autocomplete.includes('cc-additional-name')) return true;
    if (autocomplete.includes('billing')) return false;
    if (autocomplete.includes('shipping')) return false;
    return true;
};

const isCCFirstName = (field, haystack) => matchCCFirstName(haystack) && notCCIdentityOutlier(field);

const isCCLastName = (field, haystack) => matchCCLastName(haystack) && notCCIdentityOutlier(field);

const isCCName = (field, haystack) => matchCCName(haystack) && notCCIdentityOutlier(field);

const isCCSecurityCode = (_, haystack) => matchCCSecurityCode(haystack);

const isCCNumber = (_, haystack) => matchCCNumber(haystack);

const isCCExp = (field, haystack) => field instanceof HTMLInputElement && matchCCExp(haystack);

const isCCExpMonth = (field, haystack) => {
    if (matchCCExpMonth(haystack)) return true;
    if (field instanceof HTMLSelectElement && matchCCExp(haystack)) {
        return field.options.length >= 12 && field.options.length <= 14;
    }
    return false;
};

const isCCExpYear = (field, haystack) => {
    if (matchCCExpYear(haystack)) return true;
    if (field instanceof HTMLSelectElement && matchCCExp(haystack)) {
        for (const option of field.options) {
            if (option.innerText === YEAR_OPTION) return true;
            if (option.value === YEAR_OPTION) return true;
        }
    }
    return false;
};

const CC_RE_MAP = [
    [CCFieldType.FIRSTNAME, isCCFirstName],
    [CCFieldType.LASTNAME, isCCLastName],
    [CCFieldType.NAME, isCCName],
    [CCFieldType.EXP_YEAR, isCCExpYear],
    [CCFieldType.EXP_MONTH, isCCExpMonth],
    [CCFieldType.EXP, isCCExp],
    [CCFieldType.CSC, isCCSecurityCode],
    [CCFieldType.NUMBER, isCCNumber],
];

const getCCHaystack = (field) => {
    const attrs = CC_ATTRIBUTES.map((attr) => field?.getAttribute(attr) ?? '');
    const label = sanitizeString(getLabelFor(field)?.innerText ?? '');
    return sanitizeStringWithSpaces(attrs.join(' ')) + ' ' + label;
};

const getCCFieldType = (field) => {
    const haystack = getCCHaystack(field);
    if (haystack) return CC_RE_MAP.find(([, test]) => test(field, haystack))?.[0];
};

const matchCCInputField = (input, { type, visible }) => {
    if (!visible) return false;
    if (type && !CC_INPUT_TYPES.includes(type)) return false;
    const ccType = getCCFieldType(input);
    return ccType !== undefined;
};

const isCCInputField = (fnode) => {
    const { isCC } = fnode.noteFor('field');
    return isCC;
};

const isCCSelectField = (fnode) => {
    const select = fnode.element;
    if (!(select instanceof HTMLSelectElement)) return false;
    const visible = isVisible(select, {
        opacity: false,
    });
    if (!visible) return false;
    const isProcessable = isClassifiable(select);
    if (!isProcessable) return false;
    const ccType = getCCFieldType(select);
    return ccType !== undefined;
};

const getFieldFeature = (fnode) => {
    const field = fnode.element;
    const fieldHaystacks = getFieldHaystacks(field);
    const formFnode = getParentFormFnode(fnode);
    if (formFnode !== null && !formFnode.hasNoteFor('form')) formFnode.setNoteFor('form', getFormFeatures(formFnode));
    const formFeatures = formFnode?.noteFor('form');
    const form = getFormClassification(formFnode);
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
    const isIdentity = matchIdentityField(field, {
        visible,
        form,
        searchField,
        type,
    });
    const isCC = matchCCInputField(field, {
        visible,
        type,
    });
    const prevField = typeValid ? (formFeatures?.formInputIterator.prev(field) ?? null) : null;
    const nextField = typeValid ? (formFeatures?.formInputIterator.next(field) ?? null) : null;
    return {
        formFnode,
        formFeatures,
        isFormLogin: form.login,
        isFormRegister: form.register,
        isFormPWChange: form.pwChange,
        isFormRecovery: form.recovery,
        isFormNoop: form.noop,
        isIdentity,
        isCC,
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
        ...fieldHaystacks,
    };
};

const cc = [
    rule(type('field').when(isCCInputField), type('cc-field'), {}),
    rule(type('field-candidate').when(isCCSelectField), type('cc-field'), {}),
    rule(type('cc-field'), type(FieldType.CREDIT_CARD), {}),
    ...outRuleWithCache('field-candidate', FieldType.CREDIT_CARD, () => () => true),
];

const TABLE_MAX_COLS = 3;

const TABLE_MAX_AREA = 15e4;

const PAGE_FORM_RATIO = 0.7;

const isTopFrame = () => {
    try {
        return window.self === window.top;
    } catch (e) {
        return false;
    }
};

const nodeOfInterest = (el) => isClassifiable(el) && el.querySelector('input') !== null;

const excludeForms = (doc = document) => {
    const bodyElCount = document.body.querySelectorAll('*').length;
    return doc.querySelectorAll('form').forEach((form) => {
        if (nodeOfInterest(form)) {
            const fieldCount = form.querySelectorAll(kFieldSelector).length;
            const inputCount = form.querySelectorAll(inputCandidateSelector).length;
            const iframeCount = form.querySelectorAll('iframe').length;
            const invalidFieldCount =
                inputCount + iframeCount === 0 || inputCount > MAX_INPUTS_PER_FORM || fieldCount > MAX_FIELDS_PER_FORM;
            const topFrame = isTopFrame();
            const formElCount = form.querySelectorAll('*').length;
            const pageFormMatch = topFrame && form.matches('body > form');
            const pageFormSignal = topFrame && invalidFieldCount;
            const pageForm = (pageFormMatch || pageFormSignal) && formElCount / bodyElCount >= PAGE_FORM_RATIO;
            const invalidSignal = invalidFieldCount || pageForm;
            if (invalidSignal && !pageForm) return flagSubtreeAsIgnored(form);
            if (invalidSignal && pageForm) return flagAsIgnored(form);
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

const { clusters } = clusters$1;

const CLUSTER_MAX_X_DIST = 50;

const CLUSTER_MAX_Y_DIST = 275;

const CLUSTER_ALIGNMENT_TOLERANCE = 0.05;

const CLUSTER_MAX_ELEMENTS = 50;

const context = {
    cache: new WeakMap(),
};

const getElementData = (el) => {
    const data = context.cache.get(el) ?? {
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
    )((parent, candidate) => {
        if (parent.tagName === 'HTML') return false;
        if (candidate === node) return true;
        return candidate.querySelectorAll(buttonSelector).length === 0;
    });
};

const isIFrameOfInterest = (iframe) => {
    const title = iframe.getAttribute('title') || '';
    const name = iframe.getAttribute('name') || '';
    const ariaLabel = iframe.getAttribute('aria-label') || '';
    const { id, src, className } = iframe;
    const haystack = sanitizeStringWithSpaces(`${title} ${name} ${ariaLabel} ${id} ${src} ${className}`);
    return matchIFrameField(haystack);
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
    const iframes = clusterable(Array.from(doc.querySelectorAll('iframe')).filter(isIFrameOfInterest));
    const candidates = uniqueNodes(fieldsOfInterest, buttons, iframes);
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
        .filter((ancestor) => {
            if (isTopFrame() && document.body === ancestor) return false;
            return ancestor.querySelectorAll(inputCandidateSelector).length > 0;
        });
    const result = pruneNested(ancestors);
    result.forEach(flagCluster);
    context.cache = new WeakMap();
    return result;
};

const prepass = (doc = document) => {
    excludeForms(doc);
    excludeClusterableNodes(doc);
    excludeFields(doc);
    resolveFormClusters(doc);
};

const shouldRunClassifier = () => {
    const formCandidates = getOverridableForms().concat(selectFormCandidates());
    const shouldRunForForms = formCandidates.reduce((runDetection, form) => {
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
    if (shouldRunForForms) return true;
    const fieldCandidates = getOverridableFields().concat(selectInputCandidates());
    return fieldCandidates.some(isProcessableField);
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
                rule(dom('input, select'), type('field-candidate'), {}),
                ...overrides,
                rule(type('form-candidate').when(withFnodeEl(isClassifiable)), type('form-element'), {}),
                rule(type('form-element').when(withFnodeEl(isVisibleForm)), type('form').note(getFormFeatures), {}),
                rule(type('form-element'), out('form').through(processFormEffect), {}),
                ...noop,
                rule(type('field-candidate').when(isClassifiableField), type('field').note(getFieldFeature), {}),
                ...identity,
                ...cc,
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

const clearDetectionCache = () => {
    clearVisibilityCache();
    clearOverrides();
};

export {
    CC_ATTRIBUTES,
    CC_INPUT_TYPES,
    EL_ATTRIBUTES,
    FIELD_ATTRIBUTES,
    FORM_ATTRIBUTES,
    FORM_CLUSTER_ATTR,
    OVERRIDE_FIELDS,
    OVERRIDE_FORMS,
    TEXT_ATTRIBUTES,
    addFieldOverride,
    addFormOverride,
    attrIgnored,
    buttonSelector,
    cacheContext,
    clearDetectionCache,
    clearOverrides,
    clearVisibilityCache,
    createInputIterator,
    fType,
    flagAsHidden,
    flagAsIgnored,
    flagAsProcessed,
    flagCluster,
    flagOverride,
    flagSubtreeAsIgnored,
    formCandidateSelector,
    formatExpirationDate,
    getAttributes,
    getBaseAttributes,
    getCCFieldType,
    getCCHaystack,
    getCachedPredictionScore,
    getExpirationFormat,
    getFieldAttributes,
    getFormAttributes,
    getFormParent,
    getIdentityFieldType,
    getIdentityHaystack,
    getIgnoredParent,
    getInputExpirationMonthFormat,
    getInputExpirationYearFormat,
    getOverridableFields,
    getOverridableForms,
    getParentFormPrediction,
    getSelectExpirationMonthFormat,
    getSelectExpirationYearFormat,
    getTextAttributes,
    getTypeScore,
    getVisibilityCache,
    inputCandidateSelector,
    isBtnCandidate,
    isCCInputField,
    isCCSelectField,
    isClassifiable,
    isClassifiableField,
    isCluster,
    isCustomElementWithShadowRoot,
    isEmailCandidate,
    isHidden,
    isIdentity,
    isIgnored,
    isOAuthCandidate,
    isPredictedField,
    isPredictedForm,
    isPredictedType,
    isPrediction,
    isProcessableField,
    isProcessed,
    isShadowElement,
    isShadowRoot,
    isUsernameCandidate,
    isVisible,
    isVisibleEl,
    isVisibleField,
    isVisibleForm,
    kAnchorLinkSelector,
    kButtonSubmitSelector,
    kCaptchaSelector,
    kDomGroupSelector,
    kEditorElements,
    kEditorPatterns,
    kEditorSelector,
    kEmailSelector,
    kFieldLabelSelector,
    kFieldSelector,
    kHeadingSelector,
    kHiddenUsernameSelector,
    kLayoutSelector,
    kPasswordSelector,
    kSocialSelector,
    kUsernameSelector,
    matchCCInputField,
    matchIdentityField,
    matchPredictedType,
    maybeEmail,
    maybeHiddenUsername,
    maybeOTP,
    maybePassword,
    maybeUsername,
    otpSelector,
    overrides,
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
    shadowPiercingAncestors,
    shadowPiercingContains,
    shallowShadowQuerySelector,
    shouldRunClassifier,
    splitFieldsByVisibility,
    trainees,
};
