import { clusters as clusters$1, dom, domQuery, out, rule, ruleset, score, type, utils } from './fathom.js';
import * as fathomWeb from './fathom.js';
import { CCFieldType, FieldType, FormType, IdentityFieldType, ccFields, identityFields } from './labels.js';

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
    'input[type="button"]',
    'input[type="image"][alt]',
    'button[id*="password" i]',
    'button[type="submit"]',
    'button[type="button"]',
    'button[name="submit"]',
    'a[role="submit"]',
    'div[role="button"]',
    'div[role="submit"]',
].join(',');

const kLayoutSelector = `div, section, aside, main, nav`;

const kAnchorLinkSelector = `a, [role="link"], span[role="button"]`;

const formCandidateSelector = `form, [${FORM_CLUSTER_ATTR}]`;

const inputCandidateSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="checkbox"])';

const buttonSelector = `button:not([type]), a[role="button"], ${kButtonSubmitSelector}`;

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

const matchSibling$1 = (el, match) => {
    const prevEl = el.previousElementSibling;
    if (prevEl === null) return null;
    if (match(prevEl)) return prevEl;
    return matchSibling$1(prevEl, match);
};

const matchNonEmptySibling = (el) =>
    matchSibling$1(el, (el) => el instanceof HTMLElement && el.innerText.trim().length > 0);

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
    return els
        .map((input) => findStackedParent(input, cache, maxIterations))
        .filter((el) => Boolean(el && el !== document.body));
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

const removePredictionFlag = (el) => {
    delete el.__PP_TYPE__;
    delete el.__PP_SUBTYPE__;
};

const getParentFormPrediction = (el) => (el ? closestParent(el, isPrediction) : null);

const TYPE_SEPARATOR = ',';

const SCORE_SEPARATOR = ':';

const setCachedSubType = (_el, subType) => {
    const el = _el;
    el.__PP_SUBTYPE__ = subType;
};

const getCachedSubType = (el) => el.__PP_SUBTYPE__;

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

const OTP_PATTERNS = ['[0-9]{6}', '[0-9]{1}', '[0-9]*', 'd{6}', 'd{6}*', 'd{1}', '/d{6}', '/d{6}*', '/d{1}'];

const VALID_INPUT_TYPES = ['text', 'email', 'number', 'tel', 'password', 'hidden', 'search'];

const LOGIN_RE =
    /a(?:uthenti(?:fizierungs|cate)|nmeld(?:ung|en))|(?:(?:n(?:ouvelleses|uevase|ewses)s|iniciarses|connex)io|anmeldedate|inlogge|sign[io])n|in(?:iciarsessao|troduce)|(?:authentifie|introduci|conecta|entr[ae])r|s(?:econnect|identifi)er|novasessao|prihlasit|connect|acceder|login/i;

const REGISTER_RE =
    /kontoerstellen|cr(?:ea(?:teaccount|rcuenta)|iarconta)|(?:nouveaucompt|creeruncompt|s?inscrir|unirs)e|re(?:gist(?:r(?:ieren|arse|ar)|er)|joindre)|nuevacuenta|getstarted|neueskonto|newaccount|novaconta|(?:com(?:mence|eca)|(?:empez|junt)a)r|signup|join/i;

const RECOVERY_RE =
    /(?:wiederherstell|zurucksetz)en|re(?:(?:initialis|stablec)er|s(?:tor(?:ing|e)|et)|(?:defini|staur[ae])r|c(?:uper[ae]|ove)r)|problem|(?:troubl|aid)e|a[jy]uda|h(?:ilfe|elp)/i;

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

const SEARCH_ACTION_RE = /recherche|buscar|s(?:earch|uche)|query|find/i;

const CURRENT_VALUE_RE =
    /(?:be(?:stehend|for)|vorherig|aktuell)e|exist(?:ente|ing)|pre(?:cedent|vious)|a(?:n(?:t(?:erior|igo)|cien)|ctu[ae]l|tual)|existant|dernier|current|(?:ultim|viej)o|(?:letz|al)te|last|old/i;

const HIDDEN_ATTR_RE = /s(?:creenreade)?ronly|(?:move)?offscreen|(?:displaynon|a11yhid)e|\b((?:is)?hidden)\b/i;

const OAUTH_ATTR_RE = /facebook|twitch|google|apple/i;

const TOS_RE =
    /(?:datenschutzrichtlini|politicadeprivacidad|confidentialit|a(?:cknowledg|gre))e|nutzungsbedingungen|(?:consentimi?ent|ac(?:ue|o)rd)o|(?:einwillig|zustimm)ung|consentement|condi(?:cione|tion)s|term(?:osdeuso|inos|sof)|(?:privacida|understan)d|guideline|consent|p(?:riva|oli)cy|accord/i;

const TWO_FA_RE =
    /(?:doublefacteu|(?:doblefac|zweifak|twofac)to)r|verifica(?:c(?:ion|ao)|tion)|multifa(?:ct(?:eu|o)|k?to)r|(?:securitycod|doubleetap|authcod)e|zweischritte|dois(?:fatore|passo)s|doblepaso|2(?:s(?:chritte|tep)|(?:etap[ae]|paso)s|fa)|twostep/i;

const TWO_FA_ATTR_RE =
    /(?:a(?:uthentication|pprovals)|login)code|phoneverification|challenge|t(?:wo(?:fa(?:ctor)?|step)|facode)|2fa|\b([mt]fa)\b/i;

const AUTHENTICATOR_ATTR_RE =
    /a(?:pplicationdauthentification|ut(?:henti(?:(?:fiz|s)ierungsapp|cat(?:ionapp|or)|fi(?:cateu|kato)r)|enticador))|genera(?:torapp|dora)/i;

const OTP_ATTR_RE = /totp(?:pin)?|o(?:netime|t[cp])|1time/i;

const OTP_OUTLIER_RE =
    /n(?:(?:ue|o)vocodigo|ouveaucode|e(?:usenden|(?:uer|w)code))|re(?:enviar|send)|envoyer|senden|enviar|send/i;

const OTP_OUTLIER_ATTR_RE = /phone|email|tel|sms/i;

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

const CC_PREFIX_ATTR_RE = /(?:payments|new)card|paymentcard|c(?:ar(?:tecredit|d)|red(?:it)?card)|stripe|vads/i;

const CC_NUMBER_ATTR_RE = /num(?:ero)?carte|c(?:ardn(?:um|[or])|bnum|cno)|\b(c(?:ard |c)number)\b/i;

const CC_OUTLIER_ATTR_RE = /c(?:ertificate|oupon)|logincard|voucher|promo/i;

const CC_CVC_ATTR_RE = /c(?:ard(?:verification|code)|sc|v[cv])|payments?code|\b(ccc(?:ode|vv|sc))\b/i;

const CC_CODE_ATTR_RE = /securitycode|cardpin|pincode/i;

const CC_NAME_ATTR_RE = /accountholdername|card(?:holder)?name|cardholder|nameoncard|holdername|\b(ccname)\b/i;

const CC_EXP_ATTR_RE =
    /expir(?:ation(?:monthyear|date)|ation|ydate|y)|cardexp(?:iration)?|\b(ccexp(?:iration)?|expiry date)\b/i;

const CC_EXP_MONTH_ATTR_RE =
    /exp(?:ir(?:y(?:date(?:field)?mo|m[mo]?)|ationdatem[mo]|(?:ation|e)m[mo]?)|m[mo]?)|m(?:expiration|oisexp)|cbdatemo|cardm[mo]?|\b(cc(?:expmonth|m(?:onth|m)))\b/i;

const CC_EXP_MONTH_ATTR_END_RE = /\b\S*(?:m(?:onth|o|m))\b/i;

const CC_EXP_YEAR_ATTR_RE =
    /exp(?:ir(?:y(?:date(?:field)?year|y(?:yyy|ear|y)?)|ationdatey(?:y(?:yy)?|ear)|(?:ation|e)y(?:yyy|ear|y)?)|y(?:yyy|ear|y)?)|yexpiration|cbdateann|anne(?:ee)?xp|cardy(?:yyy|ear|y)?|\b(cc(?:expyear|y(?:ear|[ry])))\b/i;

const CC_EXP_YEAR_ATTR_END_RE = /\b\S*(?:y(?:ear|y))\b/i;

const IFRAME_FIELD_ATTR_RE = /s(?:tripeframe|ecurity)|c(?:ontrol|v[cv])|expiry|input|f(?:ield|orm)|p(?:bf|ci)/i;

const PAYMENT_ATTR_RE = /c(?:heckout|ar[dt])|payment/i;

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

const matchTwoFa = orRe([TWO_FA_RE, TWO_FA_ATTR_RE]);

const matchOtpAttr = test(OTP_ATTR_RE);

const matchOtpOutlier = test(OTP_OUTLIER_ATTR_RE);

const matchOtpOutlierAction = test(OTP_OUTLIER_RE);

const matchAuthenticator = test(AUTHENTICATOR_ATTR_RE);

const matchMFA = orRe([TWO_FA_RE, TWO_FA_ATTR_RE, OTP_ATTR_RE]);

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

const matchCCFirstName = andRe([CC_PREFIX_ATTR_RE, IDENTITY_FIRSTNAME_ATTR_RE]);

const matchCCLastName = andRe([CC_PREFIX_ATTR_RE, IDENTITY_LASTNAME_ATTR_RE]);

const matchCCNumber = test(CC_NUMBER_ATTR_RE);

const matchCCSecurityCode = andRe([CC_CODE_ATTR_RE, CC_PREFIX_ATTR_RE]);

const matchCCV = test(CC_CVC_ATTR_RE);

const matchCCOutlier = orRe([CC_OUTLIER_ATTR_RE, DOCUMENT_ATTR_RE]);

const matchCCExp = and(test(CC_EXP_ATTR_RE), notRe(DOCUMENT_ATTR_RE));

const matchCCExpMonth = and(test(CC_EXP_MONTH_ATTR_RE), not(test(CC_EXP_YEAR_ATTR_END_RE)));

const matchCCExpYear = and(test(CC_EXP_YEAR_ATTR_RE), not(test(CC_EXP_MONTH_ATTR_END_RE)));

const matchIFrameField = orRe([IFRAME_FIELD_ATTR_RE, PAYMENT_ATTR_RE]);

const normalizeString = (str, allowedChars = '') =>
    str
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(new RegExp(`[^a-zA-Z0-9${allowedChars}]`, 'g'), '');

const sanitizeString = (str) => normalizeString(str, '\\[\\]');

const sanitizeStringWithSpaces = (str) => normalizeString(str, '\\s\\[\\]');

const isIFrameField = (iframe) => {
    const title = iframe.getAttribute('title') || '';
    const name = iframe.getAttribute('name') || '';
    const ariaLabel = iframe.getAttribute('aria-label') || '';
    const id = iframe.id;
    const src = iframe.src.substring(0, 150);
    const className = iframe.className.substring(0, 150);
    const haystack = sanitizeStringWithSpaces(`${title} ${name} ${ariaLabel} ${id} ${src} ${className}`);
    return matchIFrameField(haystack);
};

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
        const iframes = Array.from(form.querySelectorAll('iframe')).filter(isIFrameField);
        const fields = [...inputs, ...iframes];
        return (
            fields.length > 0 &&
            fields.some((input) =>
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

const FIELD_ATTRIBUTES = [EL_ATTRIBUTES, 'name', 'inputmode', 'autocomplete'].flat();

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

const getAutocompletes = (field) => (field.getAttribute('autocomplete') ?? '').split(/\s+/);

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
    if (field instanceof HTMLInputElement && ['checkbox', 'submit', 'button', 'image'].includes(field.type)) {
        fieldAttrs.push(sanitizeString(field.value ?? ''));
        if (field.type === 'image') fieldAttrs.push(sanitizeString(field.alt ?? ''));
    }
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

const CC_ATTRIBUTES = [
    'autocomplete',
    'name',
    'id',
    'class',
    'aria-label',
    'aria-labelledby',
    'placeholder',
    'data-testid',
    'data-stripe',
    'data-recurly',
    'data-encrypted-name',
];

const CC_INPUT_TYPES = ['tel', 'phone', 'text', 'number', 'password'];

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

const AUTOCOMPLETE_OUTLIERS = ['given-name', 'additional-name', 'family-name', 'name'];

const guard$1 = (options, predicate) => (field, autocompletes, haystack) => {
    if (!options.password && field.getAttribute('type') === 'password') return false;
    if (autocompletes.includes(options.autocomplete)) return true;
    if (autocompletes.some((autocomplete) => AUTOCOMPLETE_OUTLIERS.includes(autocomplete))) return false;
    return predicate(field, autocompletes, haystack) && not(matchCCOutlier)(haystack);
};

const notCCIdentityOutlier = (autocompletes) => {
    if (autocompletes.includes('billing')) return false;
    if (autocompletes.includes('shipping')) return false;
    return true;
};

const isCCFirstName = (_, autocompletes, haystack) => matchCCFirstName(haystack) && notCCIdentityOutlier(autocompletes);

const isCCLastName = (_, autocompletes, haystack) => matchCCLastName(haystack) && notCCIdentityOutlier(autocompletes);

const isCCName = (_, autocomplete, haystack) => matchCCName(haystack) && notCCIdentityOutlier(autocomplete);

const isCCSecurityCode = (_, _auto, haystack) => or(matchCCV, matchCCSecurityCode)(haystack);

const isCCNumber = (_, __, haystack) => matchCCNumber(haystack);

const isCCExp = (field, _, haystack) => field instanceof HTMLInputElement && matchCCExp(haystack);

const isCCExpMonth = (field, autocompletes, haystack) => {
    if (autocompletes.includes('cc-exp')) return false;
    if (matchCCExpMonth(haystack)) return true;
    if (field instanceof HTMLSelectElement && matchCCExp(haystack)) {
        return field.options.length >= 12 && field.options.length <= 14;
    }
    return false;
};

const isCCExpYear = (field, autocompletes, haystack) => {
    if (autocompletes.includes('cc-exp')) return false;
    if (matchCCExpYear(haystack)) return true;
    if (field instanceof HTMLSelectElement && matchCCExp(haystack)) {
        for (const option of field.options) {
            if (option.innerText === YEAR_OPTION) return true;
            if (option.value === YEAR_OPTION) return true;
        }
    }
    return false;
};

const CC_MATCHERS = [
    [
        CCFieldType.FIRSTNAME,
        guard$1(
            {
                autocomplete: 'cc-given-name',
            },
            isCCFirstName
        ),
    ],
    [
        CCFieldType.LASTNAME,
        guard$1(
            {
                autocomplete: 'cc-family-name',
            },
            isCCLastName
        ),
    ],
    [
        CCFieldType.NAME,
        guard$1(
            {
                autocomplete: 'cc-name',
            },
            isCCName
        ),
    ],
    [
        CCFieldType.EXP_YEAR,
        guard$1(
            {
                autocomplete: 'cc-exp-year',
            },
            isCCExpYear
        ),
    ],
    [
        CCFieldType.EXP_MONTH,
        guard$1(
            {
                autocomplete: 'cc-exp-month',
            },
            isCCExpMonth
        ),
    ],
    [
        CCFieldType.EXP,
        guard$1(
            {
                autocomplete: 'cc-exp',
            },
            isCCExp
        ),
    ],
    [
        CCFieldType.CSC,
        guard$1(
            {
                autocomplete: 'cc-csc',
                password: true,
            },
            isCCSecurityCode
        ),
    ],
    [
        CCFieldType.NUMBER,
        guard$1(
            {
                autocomplete: 'cc-number',
            },
            isCCNumber
        ),
    ],
];

const getCCHaystack = (field) => {
    const attrs = CC_ATTRIBUTES.map((attr) => field?.getAttribute(attr) ?? '');
    const label = sanitizeString(getLabelFor(field)?.innerText ?? '');
    return sanitizeStringWithSpaces(attrs.join(' ')) + ' ' + label;
};

const getCachedCCSubtype = (el) => {
    const subType = getCachedSubType(el);
    if (subType && ccFields.has(subType)) return subType;
};

const getCCFieldType = (field) => {
    const cachedSubType = getCachedCCSubtype(field);
    if (cachedSubType) return cachedSubType;
    const type = field.getAttribute('type');
    if (field.tagName === 'INPUT' && type && !CC_INPUT_TYPES.includes(type)) return;
    const haystack = getCCHaystack(field);
    const autocompletes = getAutocompletes(field);
    if (haystack) {
        const ccType = CC_MATCHERS.find(([, test]) => test(field, autocompletes, haystack))?.[0];
        if (ccType) setCachedSubType(field, ccType);
        return ccType;
    }
};

const matchCCFieldCandidate = (input, { visible }) => {
    if (getCachedCCSubtype(input)) return true;
    if (!visible) return false;
    const ccType = getCCFieldType(input);
    if (ccType) setCachedSubType(input, ccType);
    return ccType !== undefined;
};

const isCCInputField = (fnode) => {
    const { isCC, visible } = fnode.noteFor('field');
    if (!visible) return false;
    return isCC;
};

const isCCSelectField = (fnode) => {
    const select = fnode.element;
    if (!(select instanceof HTMLSelectElement)) return false;
    if (getCachedCCSubtype(select)) return true;
    const visible = isVisible(select, {
        opacity: false,
    });
    if (!visible) return false;
    const isProcessable = isClassifiable(select);
    if (!isProcessable) return false;
    const ccType = getCCFieldType(select);
    if (ccType) setCachedSubType(select, ccType);
    return ccType !== undefined;
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

const maybeOTP = and(fInput(['text', 'number', 'tel']), fActive, not(fList));

const maybeUsername = and(
    not(fList),
    or(and(not(fMode('email')), fInput(['text', 'tel'])), fMatch(kUsernameSelector)),
    fActive
);

const maybeHiddenUsername = and(not(fList), fInput(['email', 'text', 'hidden']), not(fActive));

const isUsernameCandidate = (el) =>
    el.type === 'text' || (el.type === 'tel' && any(matchUsername)(getAllFieldHaystacks(el)));

const isEmailCandidate = (el) =>
    el.type === 'email' || (el.type === 'text' && any(matchEmail)(getAllFieldHaystacks(el)));

const isOAuthCandidate = (el) => any(matchOAuth)(getAllFieldHaystacks(el));

const isMFACandidate = (el) => ['text', 'number', 'tel'].includes(el.type);

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

const guard = (options, predicate) => (field, autocompletes, haystack) => {
    if (!options.number && field.getAttribute('type') === 'number') return false;
    if (options.autocompletes.some((match) => autocompletes.includes(match))) return true;
    return predicate(haystack);
};

const IDENTITY_MATCHERS = [
    [
        IdentityFieldType.FIRSTNAME,
        guard(
            {
                autocompletes: ['given-name'],
            },
            matchFirstName
        ),
    ],
    [
        IdentityFieldType.MIDDLENAME,
        guard(
            {
                autocompletes: ['additional-name'],
            },
            matchMiddleName
        ),
    ],
    [
        IdentityFieldType.LASTNAME,
        guard(
            {
                autocompletes: ['family-name'],
            },
            matchLastName
        ),
    ],
    [
        IdentityFieldType.FULLNAME,
        guard(
            {
                autocompletes: ['name'],
            },
            matchFullName
        ),
    ],
    [
        IdentityFieldType.TELEPHONE,
        guard(
            {
                autocompletes: ['tel', 'tel-national', 'tel-local'],
                number: true,
            },
            matchTelephone
        ),
    ],
    [
        IdentityFieldType.ORGANIZATION,
        guard(
            {
                autocompletes: ['organization'],
            },
            matchOrganization
        ),
    ],
    [
        IdentityFieldType.CITY,
        guard(
            {
                autocompletes: ['address-level2'],
            },
            matchCity
        ),
    ],
    [
        IdentityFieldType.ZIPCODE,
        guard(
            {
                autocompletes: ['postal-code'],
                number: true,
            },
            matchZipCode
        ),
    ],
    [
        IdentityFieldType.STATE,
        guard(
            {
                autocompletes: ['address-level1'],
            },
            matchState
        ),
    ],
    [
        IdentityFieldType.COUNTRY,
        guard(
            {
                autocompletes: ['country-name'],
            },
            matchCountry
        ),
    ],
    [
        IdentityFieldType.ADDRESS,
        guard(
            {
                autocompletes: ['street-address', 'address-line1'],
            },
            matchAddress
        ),
    ],
];

const IDENTITY_ATTRIBUTES = ['autocomplete', 'name', 'id', 'data-bhw'];

const IDENTITY_INPUT_TYPES = ['tel', 'phone', 'text', 'number'];

const getCachedIdentitySubType = (el) => {
    const subType = getCachedSubType(el);
    if (subType && identityFields.has(subType)) return subType;
};

const getIdentityHaystack = (input) => {
    const attrs = IDENTITY_ATTRIBUTES.map((attr) => input?.getAttribute(attr) ?? '');
    return sanitizeStringWithSpaces(attrs.join(' '));
};

const getIdentityFieldType = (input) => {
    const cachedSubType = getCachedIdentitySubType(input);
    if (cachedSubType) return cachedSubType;
    if (getCachedSubType(input) !== undefined) return;
    const type = input.getAttribute('type');
    if (type && !IDENTITY_INPUT_TYPES.includes(type)) return;
    if (input.getAttribute('autocomplete')?.includes('email')) return;
    const haystack = getIdentityHaystack(input);
    const autocompletes = getAutocompletes(input);
    if (haystack) {
        const identityType = IDENTITY_MATCHERS.find(([, test]) => test(input, autocompletes, haystack))?.[0];
        if (identityType) setCachedSubType(input, identityType);
        return identityType;
    }
};

const isAutocompleteListInput = (el) => el.getAttribute('aria-autocomplete') === 'list' || el.role === 'combobox';

const matchIdentityField = (input, { visible }) => {
    if (!visible) return false;
    if (getCachedIdentitySubType(input)) return true;
    const identityType = getIdentityFieldType(input);
    if (!identityType) return false;
    setCachedSubType(input, identityType);
    return true;
};

const isIdentity = (fnode) => {
    const input = fnode.element;
    const { isIdentity, isCC, searchField, isFormLogin, isFormRecovery, visible } = fnode.noteFor('field');
    if (!visible) return false;
    if (isCC || !isIdentity) return false;
    const identityType = getIdentityFieldType(input);
    if (!identityType) return false;
    const outlierForm = isFormLogin || isFormRecovery;
    if (outlierForm) return false;
    if (isAutocompleteListInput(input))
        return [IdentityFieldType.ADDRESS, IdentityFieldType.ZIPCODE].includes(identityType);
    if (searchField)
        return [IdentityFieldType.ADDRESS, IdentityFieldType.ZIPCODE, IdentityFieldType.CITY].includes(identityType);
    return true;
};

const { linearScale: linearScale$1 } = utils;

const getFormFeatures = (fnode) => {
    const form = fnode.element;
    const parent = getFormParent(form);
    const doc = form.ownerDocument;
    const totalFormNodes = form.querySelectorAll('*').length;
    const fields = Array.from(form.querySelectorAll(kFieldSelector));
    const visibleFields = fields.filter(isVisibleField);
    const inputs = fields.filter((el) => el.type !== 'submit' && el.type !== 'button');
    const hidden = fields.filter((el) => el.type === 'hidden');
    const visibleInputs = visibleFields.filter((el) => el.type !== 'submit' && el.type !== 'button');
    const fieldsets = form.querySelectorAll('fieldset');
    const textareas = fields.filter((el) => el.tagName === 'TEXTAREA');
    const selects = fields.filter((el, i, arr) => el.tagName === 'SELECT' && arr?.[i + 1]?.type !== 'tel');
    const texts = inputs.filter((el) => el.type === 'text');
    const tels = inputs.filter((el) => el.type === 'tel');
    const readOnly = inputs.filter((el) => el.readOnly);
    const radios = inputs.filter((el) => el.type === 'radio');
    const checkboxes = inputs.filter((el) => el.type === 'checkbox');
    const numbers = inputs.filter((el) => el.type === 'number');
    const dates = inputs.filter((el) => el.type === 'date');
    const files = inputs.filter((el) => el.type === 'file');
    const ccInputs = inputs.filter(getCCFieldType);
    const ccSelects = selects.filter(getCCFieldType);
    const ccs = ccInputs.concat(ccSelects);
    const identities = inputs.filter((el) => getIdentityFieldType(el) !== undefined);
    const required = visibleInputs.filter((el) => el.required || el.ariaRequired);
    const disabled = visibleInputs.filter((el) => el.disabled || el.ariaDisabled);
    const autofocused = visibleInputs.find((el) => el.matches('input[autofocus]:first-of-type'));
    const usernames = inputs.filter(isUsernameCandidate);
    const emails = inputs.filter(isEmailCandidate);
    const identifiers = uniqueNodes(usernames, emails);
    const [visibleIdentifiers, hiddenIdentifiers] = splitFieldsByVisibility(identifiers);
    const passwords = inputs.filter((el) => el.matches(kPasswordSelector));
    const [visiblePasswords, hiddenPasswords] = splitFieldsByVisibility(passwords);
    const mfaInputs = inputs.filter(isMFACandidate);
    const captchas = parent.querySelectorAll(kCaptchaSelector);
    const socialEls = Array.from(parent.querySelectorAll(kSocialSelector));
    const submits = visibleFields.filter((el) => el.type === 'submit');
    const btns = Array.from(form.querySelectorAll(buttonSelector)).filter(isVisibleEl);
    const btnsTypeSubmit = btns.filter((el) => el.matches('[type="submit"]'));
    const candidateBtns = btns.filter(isBtnCandidate);
    const submitBtns = btnsTypeSubmit.length > 0 ? btnsTypeSubmit : candidateBtns;
    const anchors = Array.from(form.querySelectorAll(kAnchorLinkSelector)).filter(isVisibleEl);
    const oauths = socialEls.concat(candidateBtns).filter(isOAuthCandidate);
    const layouts = Array.from(form.querySelectorAll(kLayoutSelector));
    const autofocusedIsIdentifier = Boolean(autofocused && visibleIdentifiers.includes(autofocused));
    const autofocusedIsPassword = Boolean(autofocused && visiblePasswords.includes(autofocused));
    const pageDescriptionText = getPageDescriptionText(doc);
    const nearestHeadingsText = getNearestHeadingsText(form);
    const formTextAttrText = getFormText(form);
    const formAttributes = getFormAttributes(form);
    const pwHaystack = passwords.flatMap(getAllFieldHaystacks);
    const identifierHaystack = visibleIdentifiers.flatMap(getAllFieldHaystacks);
    const btnHaystack = candidateBtns.flatMap(getAllFieldHaystacks);
    const submitBtnHaystack = submitBtns.flatMap(getAllFieldHaystacks);
    const checkboxesHaystack = checkboxes.flatMap(getAllFieldHaystacks);
    const anchorsHaystack = anchors.flatMap(getAllNodeHaystacks);
    const mfaInputsHaystack = mfaInputs.flatMap(getAllFieldHaystacks);
    const layoutHaystack = layouts.map(getNodeAttributes);
    const formTextHaystack = [formTextAttrText, nearestHeadingsText];
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
    const buttonMultiStep = any(matchStepAction)(submitBtnHaystack);
    const headingsMultiStep = matchMultiStep(nearestHeadingsText);
    const pageMultiAuth = pageLogin && pageRegister;
    const submitMultiAuth = submitRegister && (submitLogin || buttonMultiStep);
    const headingsMultiAuth = headingsLogin && headingsRegister;
    const multiAuth = pageMultiAuth || headingsMultiAuth || submitMultiAuth;
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
    const inputsMFA = any(matchMFA)(mfaInputsHaystack);
    const formAttrsMFA = any(matchMFA)(formAttributes);
    const formTextMFA = any(matchMFA)(formTextHaystack);
    const maybeMFA = inputsMFA || formAttrsMFA || formTextMFA;
    const haystackMFA = [...formTextHaystack, maybeMFA ? sanitizeString(form.innerText) : ''];
    const formTextAuthenticator = any(matchAuthenticator)(haystackMFA);
    const formOTPOutlier = any(matchOtpOutlier)(formAttributes);
    const linkOTPOutlier = any(matchOtpOutlierAction)(anchorsHaystack.concat(btnHaystack));
    const newsletterForm = any(matchNewsletter)(formTextHaystack);
    const searchForm = any(matchSearchAction)(formTextHaystack);
    return {
        formComplexity: linearScale$1(totalFormNodes, 0, 200),
        fieldsCount: linearScale$1(visibleFields.length, 1, 5),
        visibleInputsCount: linearScale$1(visibleInputs.length, 1, 5),
        inputCount: linearScale$1(visibleInputs.length, 1, 5),
        fieldsetCount: linearScale$1(fieldsets.length, 1, 5),
        textCount: linearScale$1(texts.length, 0, 3),
        readOnlyCount: linearScale$1(readOnly.length, 0, 3),
        textareaCount: linearScale$1(textareas.length, 0, 2),
        selectCount: linearScale$1(selects.length, 0, 5),
        disabledCount: linearScale$1(disabled.length, 0, 5),
        checkboxCount: linearScale$1(checkboxes.length, 0, 2),
        radioCount: linearScale$1(radios.length, 0, 5),
        identifierCount: linearScale$1(visibleIdentifiers.length, 0, 3),
        hiddenIdentifierCount: linearScale$1(hiddenIdentifiers.length, 0, 2),
        hiddenCount: linearScale$1(hidden.length, 0, 5),
        passwordCount: linearScale$1(visiblePasswords.length, 0, 2),
        hiddenPasswordCount: linearScale$1(hiddenPasswords.length, 0, 2),
        usernameCount: linearScale$1(usernames.length, 0, 2),
        emailCount: linearScale$1(emails.length, 0, 2),
        submitCount: linearScale$1(submits.length, 0, 2),
        identitiesCount: linearScale$1(identities.length, 0, 5),
        ccsCount: linearScale$1(ccs.length, 0, 5),
        hasTels: boolInt(tels.length > 0),
        hasOAuth: boolInt(oauths.length > 0),
        hasCaptchas: boolInt(captchas.length > 0),
        hasFiles: boolInt(files.length > 0),
        hasDate: boolInt(dates.length > 0),
        hasNumber: boolInt(numbers.length > 0),
        oneVisibleField: boolInt(visibleInputs.length === 1),
        twoVisibleFields: boolInt(visibleInputs.length === 2),
        threeOrMoreVisibleFields: boolInt(visibleInputs.length >= 3),
        noPasswords: boolInt(visiblePasswords.length === 0),
        onePassword: boolInt(visiblePasswords.length === 1),
        twoPasswords: boolInt(visiblePasswords.length === 2),
        threeOrMorePasswords: boolInt(visiblePasswords.length >= 3),
        noIdentifiers: boolInt(visibleIdentifiers.length === 0),
        oneIdentifier: boolInt(visibleIdentifiers.length === 1),
        twoIdentifiers: boolInt(visibleIdentifiers.length === 2),
        threeOrMoreIdentifiers: boolInt(visibleIdentifiers.length >= 3),
        autofocusedIsIdentifier: boolInt(autofocusedIsIdentifier),
        autofocusedIsPassword: boolInt(autofocusedIsPassword),
        inputRatio: safeInt(inputs.length / fields.length),
        hiddenRatio: safeInt(hidden.length / fields.length),
        visibleRatio: safeInt(visibleInputs.length / fields.length),
        checkboxRatio: safeInt(checkboxes.length / fields.length),
        emailRatio: safeInt(emails.length / fields.length),
        usernameRatio: safeInt(usernames.length / fields.length),
        hiddenIdentifierRatio: safeInt(hiddenIdentifiers.length / identifiers.length),
        hiddenPasswordRatio: safeInt(hiddenPasswords.length / passwords.length),
        identifierRatio: safeInt(visibleIdentifiers.length / visibleFields.length),
        passwordRatio: safeInt(visiblePasswords.length / visibleFields.length),
        requiredRatio: safeInt(required.length / visibleFields.length),
        disabledRatio: safeInt(disabled.length / visibleFields.length),
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
        formAttrsMFA: boolInt(formAttrsMFA),
        formTextMFA: boolInt(formTextMFA),
        formTextAuthenticator: boolInt(formTextAuthenticator),
        formOTPOutlier: boolInt(formOTPOutlier),
        linkOTPOutlier: boolInt(linkOTPOutlier),
        inputsMFA: boolInt(inputsMFA),
        newsletterForm: boolInt(newsletterForm),
        searchForm: boolInt(searchForm),
        multiStepForm: boolInt(buttonMultiStep || headingsMultiStep),
        multiAuthForm: boolInt(multiAuth),
        formInputIterator: createInputIterator(form),
        formInputMFACandidates: visibleInputs.filter(isMFACandidate).length,
    };
};

const FORM_FEATURES = [
    'fieldsCount',
    'inputCount',
    'fieldsetCount',
    'textCount',
    'textareaCount',
    'selectCount',
    'disabledCount',
    'radioCount',
    'readOnlyCount',
    'formComplexity',
    'identifierCount',
    'hiddenIdentifierCount',
    'usernameCount',
    'emailCount',
    'hiddenCount',
    'hiddenPasswordCount',
    'submitCount',
    'identitiesCount',
    'ccsCount',
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
    'disabledRatio',
    'requiredRatio',
    'checkboxRatio',
    'hiddenIdentifierRatio',
    'hiddenPasswordRatio',
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
    'newsletterForm',
    'searchForm',
    'multiStepForm',
    'multiAuthForm',
];

const FORM_COMBINED_FEATURES = [
    ...FORM_FEATURES,
    ...combineFeatures(['multiStepForm'], ['multiAuthForm']),
    ...combineFeatures(
        ['visibleRatio', 'identifierRatio', 'passwordRatio', 'requiredRatio'],
        [
            'fieldsCount',
            'identifierCount',
            'passwordCount',
            'hiddenIdentifierCount',
            'hiddenPasswordCount',
            'multiAuthForm',
            'multiStepForm',
        ]
    ),
];

const results$9 = {
    coeffs: [
        ['login-fieldsCount', 1.0291633605957031],
        ['login-inputCount', 1.9493790864944458],
        ['login-fieldsetCount', -5.897573947906494],
        ['login-textCount', -3.637324571609497],
        ['login-textareaCount', -2.7822954654693604],
        ['login-selectCount', -4.1762309074401855],
        ['login-disabledCount', -0.0003982431662734598],
        ['login-radioCount', -6.499799728393555],
        ['login-readOnlyCount', -8.42317008972168],
        ['login-formComplexity', -4.450681209564209],
        ['login-identifierCount', -2.1317520141601562],
        ['login-hiddenIdentifierCount', 3.5521767139434814],
        ['login-usernameCount', -0.5731131434440613],
        ['login-emailCount', -3.5114529132843018],
        ['login-hiddenCount', 0.21201714873313904],
        ['login-hiddenPasswordCount', 4.038363456726074],
        ['login-submitCount', -6.233595371246338],
        ['login-identitiesCount', -0.7581245303153992],
        ['login-ccsCount', -11.040373802185059],
        ['login-hasTels', -3.8106610774993896],
        ['login-hasOAuth', -1.631306767463684],
        ['login-hasCaptchas', 1.514754056930542],
        ['login-hasFiles', -0.0022412408143281937],
        ['login-hasDate', -3.9259557723999023],
        ['login-hasNumber', -4.015595436096191],
        ['login-oneVisibleField', 1.461838960647583],
        ['login-twoVisibleFields', 1.3370707035064697],
        ['login-threeOrMoreVisibleFields', 0.41238394379615784],
        ['login-noPasswords', -5.891266822814941],
        ['login-onePassword', 6.922422409057617],
        ['login-twoPasswords', -0.0835222601890564],
        ['login-threeOrMorePasswords', -2.4615018367767334],
        ['login-noIdentifiers', -1.3377622365951538],
        ['login-oneIdentifier', 1.5569984912872314],
        ['login-twoIdentifiers', 4.159701347351074],
        ['login-threeOrMoreIdentifiers', -5.531451225280762],
        ['login-autofocusedIsIdentifier', 2.3939626216888428],
        ['login-autofocusedIsPassword', 3.622821569442749],
        ['login-visibleRatio', -0.5216792821884155],
        ['login-inputRatio', -2.7669670581817627],
        ['login-hiddenRatio', 3.4679465293884277],
        ['login-identifierRatio', -2.257007360458374],
        ['login-emailRatio', 10.852377891540527],
        ['login-usernameRatio', -0.535618782043457],
        ['login-passwordRatio', 4.002608299255371],
        ['login-disabledRatio', -0.0003760844701901078],
        ['login-requiredRatio', 0.18139812350273132],
        ['login-checkboxRatio', -5.013652801513672],
        ['login-hiddenIdentifierRatio', 1.5755983591079712],
        ['login-hiddenPasswordRatio', 6.402009963989258],
        ['login-pageLogin', 2.4740967750549316],
        ['login-formTextLogin', 0.0004985865671187639],
        ['login-formAttrsLogin', 6.752856254577637],
        ['login-headingsLogin', 7.66702938079834],
        ['login-layoutLogin', 0.30983924865722656],
        ['login-rememberMeCheckbox', 3.5073156356811523],
        ['login-troubleLink', 5.632359027862549],
        ['login-submitLogin', 6.606202125549316],
        ['login-pageRegister', -8.390520095825195],
        ['login-formTextRegister', 0.00031458958983421326],
        ['login-formAttrsRegister', -7.793673515319824],
        ['login-headingsRegister', -3.0209600925445557],
        ['login-layoutRegister', 1.0637551546096802],
        ['login-pwNewRegister', -11.635344505310059],
        ['login-pwConfirmRegister', -6.067299842834473],
        ['login-submitRegister', -10.945959091186523],
        ['login-TOSRef', -2.748823404312134],
        ['login-pagePwReset', -0.48819422721862793],
        ['login-formTextPwReset', -1.0645411014556885],
        ['login-formAttrsPwReset', -6.266839027404785],
        ['login-headingsPwReset', -4.691098213195801],
        ['login-layoutPwReset', -5.718815326690674],
        ['login-pageRecovery', -2.277245044708252],
        ['login-formTextRecovery', 27280742028301623e-50],
        ['login-formAttrsRecovery', -6.524389743804932],
        ['login-headingsRecovery', -3.4704110622406006],
        ['login-layoutRecovery', 1.9817085266113281],
        ['login-identifierRecovery', 1.8469879627227783],
        ['login-submitRecovery', -6.491545677185059],
        ['login-formTextMFA', -6.2812042236328125],
        ['login-formAttrsMFA', -11.103571891784668],
        ['login-inputsMFA', -9.835773468017578],
        ['login-newsletterForm', -2.7548348903656006],
        ['login-searchForm', -5.532163619995117],
        ['login-multiStepForm', 4.273645877838135],
        ['login-multiAuthForm', -2.1783392429351807],
        ['login-multiStepForm,multiAuthForm', 5.2662858963012695],
        ['login-visibleRatio,fieldsCount', -2.1123147010803223],
        ['login-visibleRatio,identifierCount', -4.217033863067627],
        ['login-visibleRatio,passwordCount', -1.4940757751464844],
        ['login-visibleRatio,hiddenIdentifierCount', -5.089560031890869],
        ['login-visibleRatio,hiddenPasswordCount', -2.5154354572296143],
        ['login-visibleRatio,multiAuthForm', 5.716931343078613],
        ['login-visibleRatio,multiStepForm', 6.738213062286377],
        ['login-identifierRatio,fieldsCount', -3.2580885887145996],
        ['login-identifierRatio,identifierCount', -3.839945077896118],
        ['login-identifierRatio,passwordCount', 1.045548439025879],
        ['login-identifierRatio,hiddenIdentifierCount', -0.26144081354141235],
        ['login-identifierRatio,hiddenPasswordCount', 6.725069522857666],
        ['login-identifierRatio,multiAuthForm', 7.763779163360596],
        ['login-identifierRatio,multiStepForm', -4.341410160064697],
        ['login-passwordRatio,fieldsCount', 3.0687334537506104],
        ['login-passwordRatio,identifierCount', 1.6444685459136963],
        ['login-passwordRatio,passwordCount', 0.7862898707389832],
        ['login-passwordRatio,hiddenIdentifierCount', -5.467767715454102],
        ['login-passwordRatio,hiddenPasswordCount', 0.9796179533004761],
        ['login-passwordRatio,multiAuthForm', -6.206093788146973],
        ['login-passwordRatio,multiStepForm', -16.738208770751953],
        ['login-requiredRatio,fieldsCount', 0.6568785309791565],
        ['login-requiredRatio,identifierCount', 1.7841647863388062],
        ['login-requiredRatio,passwordCount', 1.9628273248672485],
        ['login-requiredRatio,hiddenIdentifierCount', 9.932710647583008],
        ['login-requiredRatio,hiddenPasswordCount', 1.5928789377212524],
        ['login-requiredRatio,multiAuthForm', -0.21070970594882965],
        ['login-requiredRatio,multiStepForm', 0.34215158224105835],
    ],
    bias: -0.5352651476860046,
    cutoff: 0.5,
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
        ['pw-change-fieldsCount', -0.33516639471054077],
        ['pw-change-inputCount', -0.5235570073127747],
        ['pw-change-fieldsetCount', -0.03886997327208519],
        ['pw-change-textCount', -1.3511979579925537],
        ['pw-change-textareaCount', -0.5120599865913391],
        ['pw-change-selectCount', -0.2650204002857208],
        ['pw-change-disabledCount', -0.014752550981938839],
        ['pw-change-radioCount', -1.3521455526351929],
        ['pw-change-readOnlyCount', -2.0401670932769775],
        ['pw-change-formComplexity', -0.345130980014801],
        ['pw-change-identifierCount', -1.2736705541610718],
        ['pw-change-hiddenIdentifierCount', -1.3690924644470215],
        ['pw-change-usernameCount', -1.5784225463867188],
        ['pw-change-emailCount', -1.424268364906311],
        ['pw-change-hiddenCount', 0.019339129328727722],
        ['pw-change-hiddenPasswordCount', -0.6907402873039246],
        ['pw-change-submitCount', -0.12267596274614334],
        ['pw-change-identitiesCount', -0.5386679172515869],
        ['pw-change-ccsCount', -0.5623294115066528],
        ['pw-change-hasTels', -1.2962231636047363],
        ['pw-change-hasOAuth', -1.1065728664398193],
        ['pw-change-hasCaptchas', -1.2131479978561401],
        ['pw-change-hasFiles', -0.0013051781570538878],
        ['pw-change-hasDate', -1915069697133731e-20],
        ['pw-change-hasNumber', -0.5048757195472717],
        ['pw-change-oneVisibleField', -1.5131258964538574],
        ['pw-change-twoVisibleFields', -0.8217511773109436],
        ['pw-change-threeOrMoreVisibleFields', -0.02058296464383602],
        ['pw-change-noPasswords', -2.1802752017974854],
        ['pw-change-onePassword', -1.1486598253250122],
        ['pw-change-twoPasswords', 0.5683368444442749],
        ['pw-change-threeOrMorePasswords', 3.7013370990753174],
        ['pw-change-noIdentifiers', 0.22932057082653046],
        ['pw-change-oneIdentifier', -1.5734087228775024],
        ['pw-change-twoIdentifiers', -1.2836182117462158],
        ['pw-change-threeOrMoreIdentifiers', -0.6046684384346008],
        ['pw-change-autofocusedIsIdentifier', -1.089181900024414],
        ['pw-change-autofocusedIsPassword', -1.2244654893875122],
        ['pw-change-visibleRatio', -1.68801748752594],
        ['pw-change-inputRatio', -1.343665599822998],
        ['pw-change-hiddenRatio', 1.0473847389221191],
        ['pw-change-identifierRatio', -1.1769078969955444],
        ['pw-change-emailRatio', -1.1789021492004395],
        ['pw-change-usernameRatio', -1.1802308559417725],
        ['pw-change-passwordRatio', 1.9273746013641357],
        ['pw-change-disabledRatio', -0.01232223305851221],
        ['pw-change-requiredRatio', 0.1128297746181488],
        ['pw-change-checkboxRatio', 0.16239182651042938],
        ['pw-change-hiddenIdentifierRatio', -1.7200793027877808],
        ['pw-change-hiddenPasswordRatio', -0.5954697728157043],
        ['pw-change-pageLogin', -1.7188749313354492],
        ['pw-change-formTextLogin', -0.0005025340942665935],
        ['pw-change-formAttrsLogin', -1.0248483419418335],
        ['pw-change-headingsLogin', -1.1824026107788086],
        ['pw-change-layoutLogin', -1.372593641281128],
        ['pw-change-rememberMeCheckbox', -0.5207581520080566],
        ['pw-change-troubleLink', -0.709453821182251],
        ['pw-change-submitLogin', -1.544339895248413],
        ['pw-change-pageRegister', -0.36760830879211426],
        ['pw-change-formTextRegister', -7570682257341077e-51],
        ['pw-change-formAttrsRegister', -3.6342427730560303],
        ['pw-change-headingsRegister', -4.604101181030273],
        ['pw-change-layoutRegister', -0.48502299189567566],
        ['pw-change-pwNewRegister', 6.606004238128662],
        ['pw-change-pwConfirmRegister', 0.3169172704219818],
        ['pw-change-submitRegister', -2.5018150806427],
        ['pw-change-TOSRef', -0.06596287339925766],
        ['pw-change-pagePwReset', 0.6605463624000549],
        ['pw-change-formTextPwReset', 0.10927335172891617],
        ['pw-change-formAttrsPwReset', 3.0621421337127686],
        ['pw-change-headingsPwReset', 1.4457688331604004],
        ['pw-change-layoutPwReset', 3.994476556777954],
        ['pw-change-pageRecovery', -1.0756680965423584],
        ['pw-change-formTextRecovery', -11792198586140843e-51],
        ['pw-change-formAttrsRecovery', -0.49434906244277954],
        ['pw-change-headingsRecovery', -0.12499485164880753],
        ['pw-change-layoutRecovery', -0.3130647838115692],
        ['pw-change-identifierRecovery', -0.275988906621933],
        ['pw-change-submitRecovery', 1.960471272468567],
        ['pw-change-formTextMFA', -0.4937115013599396],
        ['pw-change-formAttrsMFA', -0.4669804573059082],
        ['pw-change-inputsMFA', -0.6083246469497681],
        ['pw-change-newsletterForm', -0.022141404449939728],
        ['pw-change-searchForm', -0.9611409902572632],
        ['pw-change-multiStepForm', -0.9031007885932922],
        ['pw-change-multiAuthForm', -0.515902578830719],
        ['pw-change-multiStepForm,multiAuthForm', -0.16352427005767822],
        ['pw-change-visibleRatio,fieldsCount', -0.6513258218765259],
        ['pw-change-visibleRatio,identifierCount', -1.100975513458252],
        ['pw-change-visibleRatio,passwordCount', -0.29692909121513367],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -0.25542914867401123],
        ['pw-change-visibleRatio,hiddenPasswordCount', -0.3673310875892639],
        ['pw-change-visibleRatio,multiAuthForm', -0.3551057279109955],
        ['pw-change-visibleRatio,multiStepForm', -2.4308578968048096],
        ['pw-change-identifierRatio,fieldsCount', -1.1110645532608032],
        ['pw-change-identifierRatio,identifierCount', -1.0660419464111328],
        ['pw-change-identifierRatio,passwordCount', -1.6912341117858887],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -0.2634618282318115],
        ['pw-change-identifierRatio,hiddenPasswordCount', -0.6133546233177185],
        ['pw-change-identifierRatio,multiAuthForm', -0.30941206216812134],
        ['pw-change-identifierRatio,multiStepForm', -0.8727807402610779],
        ['pw-change-passwordRatio,fieldsCount', 1.7984789609909058],
        ['pw-change-passwordRatio,identifierCount', -1.456265926361084],
        ['pw-change-passwordRatio,passwordCount', 2.5823442935943604],
        ['pw-change-passwordRatio,hiddenIdentifierCount', -1.5569052696228027],
        ['pw-change-passwordRatio,hiddenPasswordCount', -0.20314495265483856],
        ['pw-change-passwordRatio,multiAuthForm', -0.2948963940143585],
        ['pw-change-passwordRatio,multiStepForm', -0.21204222738742828],
        ['pw-change-requiredRatio,fieldsCount', -0.7028433680534363],
        ['pw-change-requiredRatio,identifierCount', -1.3925490379333496],
        ['pw-change-requiredRatio,passwordCount', 0.9935040473937988],
        ['pw-change-requiredRatio,hiddenIdentifierCount', -1.0757969617843628],
        ['pw-change-requiredRatio,hiddenPasswordCount', -1.079142451286316],
        ['pw-change-requiredRatio,multiAuthForm', -0.25061386823654175],
        ['pw-change-requiredRatio,multiStepForm', -0.2430262416601181],
    ],
    bias: -1.1711890697479248,
    cutoff: 0.5,
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
        ['recovery-fieldsCount', 2.4379734992980957],
        ['recovery-inputCount', 0.0890093520283699],
        ['recovery-fieldsetCount', 4.331160068511963],
        ['recovery-textCount', -0.4704720675945282],
        ['recovery-textareaCount', -6.577117443084717],
        ['recovery-selectCount', -3.910688877105713],
        ['recovery-disabledCount', -0.08518592268228531],
        ['recovery-radioCount', -2.136352062225342],
        ['recovery-readOnlyCount', 4.239419460296631],
        ['recovery-formComplexity', -7.103043556213379],
        ['recovery-identifierCount', -1.0431780815124512],
        ['recovery-hiddenIdentifierCount', -2.581488847732544],
        ['recovery-usernameCount', 1.3551501035690308],
        ['recovery-emailCount', -0.664086639881134],
        ['recovery-hiddenCount', 4.508864879608154],
        ['recovery-hiddenPasswordCount', -3.1419930458068848],
        ['recovery-submitCount', 1.3883490562438965],
        ['recovery-identitiesCount', -2.6201908588409424],
        ['recovery-ccsCount', -0.5980291366577148],
        ['recovery-hasTels', 1.2028706073760986],
        ['recovery-hasOAuth', -2.1554982662200928],
        ['recovery-hasCaptchas', 8.347885131835938],
        ['recovery-hasFiles', -15.873945236206055],
        ['recovery-hasDate', -4714505485026166e-20],
        ['recovery-hasNumber', -0.5068539977073669],
        ['recovery-oneVisibleField', 0.024498226121068],
        ['recovery-twoVisibleFields', -3.848410129547119],
        ['recovery-threeOrMoreVisibleFields', -2.7255032062530518],
        ['recovery-noPasswords', 0.02289392612874508],
        ['recovery-onePassword', -4.935323238372803],
        ['recovery-twoPasswords', -3.7876994609832764],
        ['recovery-threeOrMorePasswords', -0.1680247187614441],
        ['recovery-noIdentifiers', -6.453045845031738],
        ['recovery-oneIdentifier', -0.9712529182434082],
        ['recovery-twoIdentifiers', 2.2027480602264404],
        ['recovery-threeOrMoreIdentifiers', -2.2616515159606934],
        ['recovery-autofocusedIsIdentifier', 0.34288617968559265],
        ['recovery-autofocusedIsPassword', -0.007384353782981634],
        ['recovery-visibleRatio', -0.8506177067756653],
        ['recovery-inputRatio', -2.2298007011413574],
        ['recovery-hiddenRatio', -0.6860164403915405],
        ['recovery-identifierRatio', -3.4498233795166016],
        ['recovery-emailRatio', 7.168710231781006],
        ['recovery-usernameRatio', 1.5678694248199463],
        ['recovery-passwordRatio', -3.7714600563049316],
        ['recovery-disabledRatio', -0.085176020860672],
        ['recovery-requiredRatio', -0.264578640460968],
        ['recovery-checkboxRatio', -12.139756202697754],
        ['recovery-hiddenIdentifierRatio', 0.7568886280059814],
        ['recovery-hiddenPasswordRatio', -5.473459720611572],
        ['recovery-pageLogin', 1.2028510570526123],
        ['recovery-formTextLogin', -0.00017460643721278757],
        ['recovery-formAttrsLogin', 2.1698341369628906],
        ['recovery-headingsLogin', -1.7311606407165527],
        ['recovery-layoutLogin', -1.0241694450378418],
        ['recovery-rememberMeCheckbox', -1.1549694538116455],
        ['recovery-troubleLink', 6.0412163734436035],
        ['recovery-submitLogin', -4.058685779571533],
        ['recovery-pageRegister', -3.5623619556427],
        ['recovery-formTextRegister', -10306098650691886e-51],
        ['recovery-formAttrsRegister', -2.7175045013427734],
        ['recovery-headingsRegister', -1.514564871788025],
        ['recovery-layoutRegister', -13.317666053771973],
        ['recovery-pwNewRegister', -1.6263751983642578],
        ['recovery-pwConfirmRegister', -1.5987848043441772],
        ['recovery-submitRegister', -1.2142468690872192],
        ['recovery-TOSRef', -6.9628586769104],
        ['recovery-pagePwReset', -2.646260976791382],
        ['recovery-formTextPwReset', -3384204319445416e-20],
        ['recovery-formAttrsPwReset', 2.2213401794433594],
        ['recovery-headingsPwReset', 3.7917890548706055],
        ['recovery-layoutPwReset', 0.025495324283838272],
        ['recovery-pageRecovery', 5.122389316558838],
        ['recovery-formTextRecovery', 501679714943748e-19],
        ['recovery-formAttrsRecovery', 4.812497138977051],
        ['recovery-headingsRecovery', 5.58487606048584],
        ['recovery-layoutRecovery', 2.727311849594116],
        ['recovery-identifierRecovery', 6.243952751159668],
        ['recovery-submitRecovery', 7.847846508026123],
        ['recovery-formTextMFA', 0.7155585289001465],
        ['recovery-formAttrsMFA', 4.5128607749938965],
        ['recovery-inputsMFA', -2.1649184226989746],
        ['recovery-newsletterForm', -5.2134623527526855],
        ['recovery-searchForm', 5.395840167999268],
        ['recovery-multiStepForm', -1.906358242034912],
        ['recovery-multiAuthForm', -2.2554609775543213],
        ['recovery-multiStepForm,multiAuthForm', -0.44480299949645996],
        ['recovery-visibleRatio,fieldsCount', -0.18381382524967194],
        ['recovery-visibleRatio,identifierCount', -0.6416285037994385],
        ['recovery-visibleRatio,passwordCount', -3.092456102371216],
        ['recovery-visibleRatio,hiddenIdentifierCount', 1.3182957172393799],
        ['recovery-visibleRatio,hiddenPasswordCount', -0.4408978223800659],
        ['recovery-visibleRatio,multiAuthForm', -2.2429044246673584],
        ['recovery-visibleRatio,multiStepForm', -2.6903834342956543],
        ['recovery-identifierRatio,fieldsCount', 4.340691566467285],
        ['recovery-identifierRatio,identifierCount', -3.3632278442382812],
        ['recovery-identifierRatio,passwordCount', -4.7524495124816895],
        ['recovery-identifierRatio,hiddenIdentifierCount', 4.314511299133301],
        ['recovery-identifierRatio,hiddenPasswordCount', -2.4439735412597656],
        ['recovery-identifierRatio,multiAuthForm', -2.5610759258270264],
        ['recovery-identifierRatio,multiStepForm', 5.1107892990112305],
        ['recovery-passwordRatio,fieldsCount', -3.096700668334961],
        ['recovery-passwordRatio,identifierCount', -3.825806140899658],
        ['recovery-passwordRatio,passwordCount', -3.2265255451202393],
        ['recovery-passwordRatio,hiddenIdentifierCount', -0.6666386127471924],
        ['recovery-passwordRatio,hiddenPasswordCount', -8301071648020297e-20],
        ['recovery-passwordRatio,multiAuthForm', -0.10536698997020721],
        ['recovery-passwordRatio,multiStepForm', -0.5606514811515808],
        ['recovery-requiredRatio,fieldsCount', -2.8574671745300293],
        ['recovery-requiredRatio,identifierCount', 0.4356671869754791],
        ['recovery-requiredRatio,passwordCount', -1.7258524894714355],
        ['recovery-requiredRatio,hiddenIdentifierCount', -7.795442581176758],
        ['recovery-requiredRatio,hiddenPasswordCount', -0.00042179322917945683],
        ['recovery-requiredRatio,multiAuthForm', -0.07835042476654053],
        ['recovery-requiredRatio,multiStepForm', -1.7213170528411865],
    ],
    bias: -2.418424606323242,
    cutoff: 0.5,
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
        ['register-fieldsCount', -0.8299300074577332],
        ['register-inputCount', 1.964868426322937],
        ['register-fieldsetCount', 12.187782287597656],
        ['register-textCount', -0.2022344022989273],
        ['register-textareaCount', 4.866732597351074],
        ['register-selectCount', -0.18592242896556854],
        ['register-disabledCount', -6.414729118347168],
        ['register-radioCount', -6.231941223144531],
        ['register-readOnlyCount', -5.390655040740967],
        ['register-formComplexity', 2.6196787357330322],
        ['register-identifierCount', 2.7491326332092285],
        ['register-hiddenIdentifierCount', -2.1029038429260254],
        ['register-usernameCount', -0.8031745553016663],
        ['register-emailCount', 4.9627461433410645],
        ['register-hiddenCount', -7.862725734710693],
        ['register-hiddenPasswordCount', 1.6524672508239746],
        ['register-submitCount', -2.4643614292144775],
        ['register-identitiesCount', -3.9670956134796143],
        ['register-ccsCount', -16.13517951965332],
        ['register-hasTels', 5.1112380027771],
        ['register-hasOAuth', -0.5858070254325867],
        ['register-hasCaptchas', 2.7728466987609863],
        ['register-hasFiles', -5.714384078979492],
        ['register-hasDate', -0.343068391084671],
        ['register-hasNumber', 7.584923267364502],
        ['register-oneVisibleField', 1.0834300518035889],
        ['register-twoVisibleFields', -1.1465963125228882],
        ['register-threeOrMoreVisibleFields', -0.17454542219638824],
        ['register-noPasswords', -5.482156276702881],
        ['register-onePassword', 2.787663459777832],
        ['register-twoPasswords', 4.8324666023254395],
        ['register-threeOrMorePasswords', -1.7704063653945923],
        ['register-noIdentifiers', -4.184779644012451],
        ['register-oneIdentifier', -5.4120564460754395],
        ['register-twoIdentifiers', 4.889397144317627],
        ['register-threeOrMoreIdentifiers', 5.937286853790283],
        ['register-autofocusedIsIdentifier', -1.235860824584961],
        ['register-autofocusedIsPassword', 8.010180473327637],
        ['register-visibleRatio', 0.5281854271888733],
        ['register-inputRatio', -2.322761297225952],
        ['register-hiddenRatio', 2.6337485313415527],
        ['register-identifierRatio', 1.5465619564056396],
        ['register-emailRatio', 6.249098300933838],
        ['register-usernameRatio', -1.435988426208496],
        ['register-passwordRatio', -6.469338417053223],
        ['register-disabledRatio', -4.9995598793029785],
        ['register-requiredRatio', -2.5973377227783203],
        ['register-checkboxRatio', 2.2540459632873535],
        ['register-hiddenIdentifierRatio', -6.856910228729248],
        ['register-hiddenPasswordRatio', 4.569215774536133],
        ['register-pageLogin', -5.864623069763184],
        ['register-formTextLogin', -1.0299580566197619e-7],
        ['register-formAttrsLogin', -0.917593240737915],
        ['register-headingsLogin', -6.512570858001709],
        ['register-layoutLogin', 4.653754711151123],
        ['register-rememberMeCheckbox', -8.208090782165527],
        ['register-troubleLink', -6.614607810974121],
        ['register-submitLogin', -5.65608549118042],
        ['register-pageRegister', 8.519174575805664],
        ['register-formTextRegister', 0.022119762375950813],
        ['register-formAttrsRegister', 5.253970623016357],
        ['register-headingsRegister', 4.85473108291626],
        ['register-layoutRegister', 0.047868628054857254],
        ['register-pwNewRegister', 2.8933231830596924],
        ['register-pwConfirmRegister', 8.566994667053223],
        ['register-submitRegister', 11.151612281799316],
        ['register-TOSRef', 3.6769421100616455],
        ['register-pagePwReset', -2.28369402885437],
        ['register-formTextPwReset', -0.0078007872216403484],
        ['register-formAttrsPwReset', -0.6789377927780151],
        ['register-headingsPwReset', 0.4543275833129883],
        ['register-layoutPwReset', -4.95003080368042],
        ['register-pageRecovery', -2.0456008911132812],
        ['register-formTextRecovery', -5178028939033323e-51],
        ['register-formAttrsRecovery', -2.002868175506592],
        ['register-headingsRecovery', -5.110259532928467],
        ['register-layoutRecovery', 0.06261555105447769],
        ['register-identifierRecovery', 0.6796858906745911],
        ['register-submitRecovery', -8.810681343078613],
        ['register-formTextMFA', -5.88112211227417],
        ['register-formAttrsMFA', -5.471724510192871],
        ['register-inputsMFA', -8.90638542175293],
        ['register-newsletterForm', -16.0900821685791],
        ['register-searchForm', -5.6578497886657715],
        ['register-multiStepForm', 3.7175941467285156],
        ['register-multiAuthForm', 9.579988479614258],
        ['register-multiStepForm,multiAuthForm', 0.9071222543716431],
        ['register-visibleRatio,fieldsCount', -3.1356334686279297],
        ['register-visibleRatio,identifierCount', -2.9469594955444336],
        ['register-visibleRatio,passwordCount', -5.890524387359619],
        ['register-visibleRatio,hiddenIdentifierCount', -1.3686153888702393],
        ['register-visibleRatio,hiddenPasswordCount', -2.93333101272583],
        ['register-visibleRatio,multiAuthForm', -7.955042362213135],
        ['register-visibleRatio,multiStepForm', 8.27769947052002],
        ['register-identifierRatio,fieldsCount', -0.2920648157596588],
        ['register-identifierRatio,identifierCount', 0.33722999691963196],
        ['register-identifierRatio,passwordCount', 5.041901111602783],
        ['register-identifierRatio,hiddenIdentifierCount', 5.038072109222412],
        ['register-identifierRatio,hiddenPasswordCount', -2.2211222648620605],
        ['register-identifierRatio,multiAuthForm', 4.555029392242432],
        ['register-identifierRatio,multiStepForm', -5.447917461395264],
        ['register-passwordRatio,fieldsCount', 3.426218271255493],
        ['register-passwordRatio,identifierCount', 0.695747971534729],
        ['register-passwordRatio,passwordCount', -5.241281986236572],
        ['register-passwordRatio,hiddenIdentifierCount', 9.498517990112305],
        ['register-passwordRatio,hiddenPasswordCount', -1.9497883319854736],
        ['register-passwordRatio,multiAuthForm', -6.9538116455078125],
        ['register-passwordRatio,multiStepForm', 1.6827112436294556],
        ['register-requiredRatio,fieldsCount', -2.653508186340332],
        ['register-requiredRatio,identifierCount', -1.5900651216506958],
        ['register-requiredRatio,passwordCount', 3.0171959400177],
        ['register-requiredRatio,hiddenIdentifierCount', 3.570266008377075],
        ['register-requiredRatio,hiddenPasswordCount', -3.4063453674316406],
        ['register-requiredRatio,multiAuthForm', -4.913093090057373],
        ['register-requiredRatio,multiStepForm', 3.7631289958953857],
    ],
    bias: -2.491853713989258,
    cutoff: 0.5,
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
        autocompleteEmail: boolInt(fieldFeatures.autocomplete?.includes('email') ?? false),
        autocompleteOTP: boolInt(fieldFeatures.autocomplete === 'one-time-code'),
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
    'autocompleteEmail',
    'autocompleteOTP',
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
        ['email-isCC', -2.347639322280884],
        ['email-isIdentity', -6.31914758682251],
        ['email-autocompleteEmail', 1.607893705368042],
        ['email-autocompleteOTP', -7.483442306518555],
        ['email-typeEmail', 9.27720832824707],
        ['email-exactAttrEmail', 8.28184700012207],
        ['email-attrEmail', 1.430545687675476],
        ['email-textEmail', 8.701736450195312],
        ['email-labelEmail', 11.581730842590332],
        ['email-placeholderEmail', 3.1633388996124268],
        ['email-searchField', -8.984328269958496],
    ],
    bias: -6.396362781524658,
    cutoff: 0.5,
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

const identity = [
    rule(type('field').when(isIdentity), type('identity-field'), {}),
    rule(type('identity-field'), type(FieldType.IDENTITY), {}),
    ...outRuleWithCache('field-candidate', FieldType.IDENTITY, () => () => true),
];

const { linearScale } = utils;

const matchSibling = (sibling, match) => {
    if (!sibling) return false;
    if (sibling?.getAttribute('type') !== match.type) return false;
    const maxLength = sibling.getAttribute('maxlength');
    if (maxLength && parseInt(maxLength, 10) > 1) return false;
    const minLength = sibling.getAttribute('minlength');
    if (minLength && parseInt(minLength) > 1) return false;
    const { top, bottom, width, area } = getNodeRect(sibling);
    if (width >= 100) return false;
    const topMatch = Math.abs(match.rect.top - top) <= 2;
    const bottomMatch = Math.abs(match.rect.bottom - bottom) <= 2;
    const aligned = topMatch && bottomMatch;
    if (!aligned) return false;
    const areaMatch = Math.abs(match.rect.area - area) < 16;
    if (!areaMatch) return false;
    return true;
};

const getOTPFieldFeatures = (fnode) => {
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField, type, maxLength } = fieldFeatures;
    const form = fieldFeatures?.formFnode?.element;
    const formFeatures = fieldFeatures.formFeatures;
    const formComplexity = formFeatures?.formComplexity ?? 0;
    const formMFA = Boolean(formFeatures?.formMFA);
    const formAuthenticator = Boolean(formFeatures?.formTextAuthenticator);
    const formOTPOutlier = Boolean(formFeatures?.formOTPOutlier);
    const linkOutlier = Boolean(formFeatures?.linkOTPOutlier);
    const formInputMFACandidates = formFeatures?.formInputMFACandidates ?? 0;
    const isNumeric = field.inputMode === 'numeric';
    const patternOTP = !isNumeric && OTP_PATTERNS.some((pattern) => field.pattern?.trim() === pattern);
    const exactNames = ['code', 'token', 'otp', 'otc', 'totp'];
    const nameMatch = exactNames.some((match) => field.name === match);
    const idMatch = exactNames.some((match) => field.id === match);
    const singleInput = formInputMFACandidates === 1;
    const rect = getNodeRect(field);
    const similarBefore = matchSibling(prevField, {
        type,
        rect,
    });
    const similarAfter = matchSibling(nextField, {
        type,
        rect,
    });
    const siblingOfInterest = similarAfter || similarBefore;
    const attrOTP = any(matchOtpAttr)(fieldAttrs);
    const attrMFA = any(matchTwoFa)(fieldAttrs);
    const attrOutlier = any(matchOtpOutlier)(fieldAttrs);
    const textOTP = matchOtpAttr(fieldText);
    const textMFA = matchTwoFa(fieldText);
    const textAuthenticator = matchAuthenticator(fieldText);
    const labelOTP = matchOtpAttr(labelText);
    const labelMFA = matchTwoFa(labelText);
    const labelAuthenticator = matchAuthenticator(labelText);
    const labelOutlier = matchOtpOutlier(labelText);
    const parents = [getNthParent(field)(1), getNthParent(field)(2)];
    const parentAttrs = parents.flatMap(getBaseAttributes);
    const parentOTP = any(matchOtpAttr)(parentAttrs);
    const parentOutlier = any(matchOtpOutlier)(parentAttrs);
    const maxLen = maxLength ? parseInt(maxLength, 10) : null;
    const maxLengthInvalid = Boolean(maxLen && (maxLen > 20 || (maxLen > 1 && maxLen < 5)));
    const maxLength1 = maxLen === 1;
    const maxLength6 = maxLen === 6;
    const mfa = formMFA || labelMFA || textMFA || attrMFA;
    const otp = parentOTP || attrOTP || textOTP || labelOTP;
    const authenticator = formAuthenticator || textAuthenticator || labelAuthenticator;
    const unexpectedInputCount = !formInputMFACandidates || formInputMFACandidates > 6;
    const autocomplete = fieldFeatures.autocomplete;
    const outlierCandidate = (mfa || otp) && !authenticator;
    const emailOutlierCount = outlierCandidate ? ((form?.innerText ?? '').match(/[a-z0-9*._-]@/gi)?.length ?? 0) : 0;
    const autocompleteOff = autocomplete !== null && (autocomplete === 'off' || autocomplete === 'false');
    const outlierAutocomplete =
        outlierCandidate && autocomplete !== null && !autocompleteOff && !autocomplete.includes('one-time-code');
    const formOutlier = formOTPOutlier || parentOutlier;
    const fieldOutlier = attrOutlier || labelOutlier;
    const outlier = formOutlier || fieldOutlier;
    return {
        mfa: boolInt(mfa),
        otp: boolInt(otp),
        authenticator: boolInt(authenticator),
        outlier: boolInt(outlier),
        formOutlier: boolInt(formOutlier),
        fieldOutlier: boolInt(fieldOutlier),
        linkOutlier: boolInt(linkOutlier),
        outlierAutocomplete: boolInt(outlierAutocomplete),
        formComplexity,
        emailOutlierCount: linearScale(emailOutlierCount, 0, 2),
        unexpectedInputCount: boolInt(unexpectedInputCount),
        singleInput: boolInt(singleInput),
        nameMatch: boolInt(nameMatch),
        idMatch: boolInt(idMatch),
        numericMode: boolInt(isNumeric),
        patternOTP: boolInt(patternOTP),
        maxLengthInvalid: boolInt(maxLengthInvalid),
        maxLength1: boolInt(maxLength1),
        maxLength6: boolInt(maxLength6),
        autocompleteOTC: boolInt(fieldFeatures.autocomplete?.includes('one-time-code') ?? false),
        siblingOfInterest: boolInt(siblingOfInterest),
        attrOTP: boolInt(attrOTP),
        textOTP: boolInt(textOTP),
        parentOTP: boolInt(parentOTP),
        labelOTP: boolInt(labelOTP),
        formMFA: boolInt(formMFA),
        attrMFA: boolInt(attrMFA),
        textMFA: boolInt(textMFA),
        labelMFA: boolInt(labelMFA),
        formAuthenticator: boolInt(formAuthenticator),
        textAuthenticator: boolInt(textAuthenticator),
        labelAuthenticator: boolInt(labelAuthenticator),
    };
};

const OTP_FEATURES = [
    'numericMode',
    'nameMatch',
    'idMatch',
    'autocompleteOTC',
    'patternOTP',
    'formMFA',
    'formAuthenticator',
    'attrOTP',
    'textOTP',
    'labelOTP',
    'parentOTP',
    'attrMFA',
    'textMFA',
    'labelMFA',
    'textAuthenticator',
    'labelAuthenticator',
    'maxLength1',
    'maxLength6',
    'maxLengthInvalid',
    'siblingOfInterest',
    'unexpectedInputCount',
    'fieldOutlier',
    'linkOutlier',
    'emailOutlierCount',
    'outlierAutocomplete',
    'formComplexity',
    ...combineFeatures(['otp', 'mfa'], ['outlier', 'siblingOfInterest', 'singleInput']),
    ...combineFeatures(['autocompleteOTC'], ['linkOutlier', 'authenticator']),
];

const results$4 = {
    coeffs: [
        ['otp-isCC', -2.885006904602051],
        ['otp-isIdentity', -1.9026038646697998],
        ['otp-numericMode', 1.9320131540298462],
        ['otp-nameMatch', 3.0029664039611816],
        ['otp-idMatch', 4.780257225036621],
        ['otp-autocompleteOTC', 2.130598306655884],
        ['otp-patternOTP', 0.6519807577133179],
        ['otp-formMFA', 0.38025662302970886],
        ['otp-formAuthenticator', 7.274387359619141],
        ['otp-attrOTP', 3.507416009902954],
        ['otp-textOTP', -5.621504783630371],
        ['otp-labelOTP', 4.251974582672119],
        ['otp-parentOTP', -0.5162607431411743],
        ['otp-attrMFA', 5.633530616760254],
        ['otp-textMFA', 5.7865729331970215],
        ['otp-labelMFA', 4.828885078430176],
        ['otp-textAuthenticator', 0.0032947640866041183],
        ['otp-labelAuthenticator', 1.0596591234207153],
        ['otp-maxLength1', 1.3797115087509155],
        ['otp-maxLength6', 5.689800262451172],
        ['otp-maxLengthInvalid', -6.251493453979492],
        ['otp-siblingOfInterest', 5.3990278244018555],
        ['otp-unexpectedInputCount', -1.7573425769805908],
        ['otp-fieldOutlier', -3.4718334674835205],
        ['otp-linkOutlier', -4.453066825866699],
        ['otp-emailOutlierCount', -1.6180461645126343],
        ['otp-outlierAutocomplete', -8.794614791870117],
        ['otp-formComplexity', -4.036585807800293],
        ['otp-otp,outlier', 0.35172584652900696],
        ['otp-otp,siblingOfInterest', -2.406111478805542],
        ['otp-otp,singleInput', 0.3638089597225189],
        ['otp-mfa,outlier', -3.8992555141448975],
        ['otp-mfa,siblingOfInterest', 0.08972718566656113],
        ['otp-mfa,singleInput', 4.198761940002441],
        ['otp-autocompleteOTC,linkOutlier', -3.0311548709869385],
        ['otp-autocompleteOTC,authenticator', 0.2640325427055359],
    ],
    bias: -7.5056281089782715,
    cutoff: 0.55,
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

const isAutocompleteCurrentPassword = (value) => value === 'current-password';

const isAutocompleteNewPassword = (value) => value === 'new-password';

const isAutocompleteOTP = (value) => value === 'one-time-code';

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
        autocompleteOTP: boolInt(isAutocompleteOTP(autocomplete)),
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
    'autocompleteOTP',
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
        ['password-isCC', -1.7323689460754395],
        ['password-isIdentity', -14610466381252062e-51],
        ['password-loginScore', 7.9406232833862305],
        ['password-registerScore', -7.9792656898498535],
        ['password-pwChangeScore', -0.23887799680233002],
        ['password-exotic', -4.861611843109131],
        ['password-autocompleteNew', 0.2725328207015991],
        ['password-autocompleteCurrent', -0.41572296619415283],
        ['password-autocompleteOTP', -1.2637768983840942],
        ['password-autocompleteOff', -0.9620888829231262],
        ['password-isOnlyPassword', 0.16694983839988708],
        ['password-prevPwField', -5.093209743499756],
        ['password-nextPwField', 1.2344714403152466],
        ['password-attrCreate', 0.041903056204319],
        ['password-attrCurrent', 1.3353360891342163],
        ['password-attrConfirm', -1.6644070148468018],
        ['password-attrReset', 0.15163713693618774],
        ['password-textCreate', -4.560153007507324],
        ['password-textCurrent', -0.004861949943006039],
        ['password-textConfirm', -0.7591946721076965],
        ['password-textReset', -7816714573802031e-51],
        ['password-labelCreate', -3.984454870223999],
        ['password-labelCurrent', 2.6639482975006104],
        ['password-labelConfirm', -1.1955653429031372],
        ['password-labelReset', -11074591714373417e-51],
        ['password-prevPwNew', -1.9293909072875977],
        ['password-prevPwCurrent', -2.1050047874450684],
        ['password-prevPwConfirm', -6609591504131081e-51],
        ['password-nextPwNew', 2.865455150604248],
        ['password-nextPwCurrent', -0.0022453495766967535],
        ['password-nextPwConfirm', -6.108919143676758],
        ['password-passwordOutlier', -12.759978294372559],
        ['password-prevPwCurrent,nextPwNew', -2.1613125801086426],
    ],
    bias: 0.6774619817733765,
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
        ['new-password-isCC', -7.953068256378174],
        ['new-password-isIdentity', 9318638195717899e-51],
        ['new-password-loginScore', -8.22635555267334],
        ['new-password-registerScore', 7.725493907928467],
        ['new-password-pwChangeScore', 1.5441616773605347],
        ['new-password-exotic', 1.935632586479187],
        ['new-password-autocompleteNew', -1.7432457208633423],
        ['new-password-autocompleteCurrent', 0.8969491720199585],
        ['new-password-autocompleteOTP', -4.7504377365112305],
        ['new-password-autocompleteOff', 1.9881325960159302],
        ['new-password-isOnlyPassword', 0.1328059881925583],
        ['new-password-prevPwField', 5.329315185546875],
        ['new-password-nextPwField', -2.120497465133667],
        ['new-password-attrCreate', -0.022353030741214752],
        ['new-password-attrCurrent', -1.968435525894165],
        ['new-password-attrConfirm', 1.39047372341156],
        ['new-password-attrReset', -0.16465023159980774],
        ['new-password-textCreate', 4.640706539154053],
        ['new-password-textCurrent', 0.3733176589012146],
        ['new-password-textConfirm', 0.8230962753295898],
        ['new-password-textReset', 28189257136546075e-21],
        ['new-password-labelCreate', 2.9183270931243896],
        ['new-password-labelCurrent', -2.9797203540802],
        ['new-password-labelConfirm', 1.0775363445281982],
        ['new-password-labelReset', -7512565455034157e-51],
        ['new-password-prevPwNew', 1.6909044981002808],
        ['new-password-prevPwCurrent', 1.9912831783294678],
        ['new-password-prevPwConfirm', 9555575210735144e-51],
        ['new-password-nextPwNew', -2.541019916534424],
        ['new-password-nextPwCurrent', 0.006285436451435089],
        ['new-password-nextPwConfirm', 6.399428844451904],
        ['new-password-passwordOutlier', -13.063116073608398],
        ['new-password-prevPwCurrent,nextPwNew', 1.9962656497955322],
    ],
    bias: -1.2658257484436035,
    cutoff: 0.5,
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
    const { fieldAttrs, fieldText, labelText, prevField, isFormLogin } = fieldFeatures;
    const { autocomplete } = fieldFeatures;
    const autocompleteOff = (autocomplete !== null && autocomplete === 'off') || autocomplete === 'false';
    const autocompleteUsername = Boolean(autocomplete?.includes('username') || autocomplete?.includes('nickname'));
    const autocompleteEmail = Boolean(autocomplete?.includes('email'));
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const textUsername = matchUsername(fieldText);
    const labelUsername = matchUsername(labelText);
    const username = attrUsername || textUsername || labelUsername;
    const outlierAttrs = any(matchUsernameOutlier)(fieldAttrs);
    const outlierText = matchUsernameOutlier(fieldText);
    const outlierLabel = matchUsernameOutlier(labelText);
    const outlierEmail = !username && any(matchEmailAttr)(fieldAttrs.concat(fieldText, labelText));
    const outlier = outlierAttrs || outlierText || outlierLabel || outlierEmail;
    const isFirstField = prevField === null;
    const loginUsername = isFormLogin && isFirstField && !outlier;
    return {
        autocompleteUsername: boolInt(autocompleteUsername),
        autocompleteEmail: boolInt(autocompleteEmail),
        autocompleteOff: boolInt(autocompleteOff),
        attrUsername: boolInt(attrUsername),
        textUsername: boolInt(textUsername),
        labelUsername: boolInt(labelUsername),
        outlierText: boolInt(outlierText),
        outlierAttrs: boolInt(outlierAttrs),
        outlierLabel: boolInt(outlierLabel),
        outlierEmail: boolInt(outlierEmail),
        loginUsername: boolInt(loginUsername),
        searchField: boolInt(fieldFeatures.searchField),
    };
};

const USERNAME_FEATURES = [
    'autocompleteUsername',
    'autocompleteEmail',
    'autocompleteOff',
    'attrUsername',
    'textUsername',
    'labelUsername',
    'outlierText',
    'outlierAttrs',
    'outlierLabel',
    'outlierEmail',
    'loginUsername',
    'searchField',
];

const results$1 = {
    coeffs: [
        ['username-isCC', -2.633117914199829],
        ['username-isIdentity', -1.430008053779602],
        ['username-autocompleteUsername', 0.9156535267829895],
        ['username-autocompleteEmail', 0.046332307159900665],
        ['username-autocompleteOff', -0.698256254196167],
        ['username-attrUsername', 11.273198127746582],
        ['username-textUsername', 2.921024799346924],
        ['username-labelUsername', 11.591675758361816],
        ['username-outlierText', -1.2419283390045166],
        ['username-outlierAttrs', -1.7273695468902588],
        ['username-outlierLabel', -1.9592667818069458],
        ['username-outlierEmail', -3.009730815887451],
        ['username-loginUsername', 12.306347846984863],
        ['username-searchField', -7.13927698135376],
    ],
    bias: -6.583202838897705,
    cutoff: 0.5,
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
    const { fieldAttrs, autocomplete, value } = fieldFeatures;
    const typeHidden = field.type === 'hidden';
    const visibleReadonly =
        field.readOnly &&
        !typeHidden &&
        isVisible(field, {
            opacity: true,
        });
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const attrEmail = any(matchEmailAttr)(fieldAttrs);
    const attrMatch = field.matches('[name="username"],[id="username"]');
    const autocompleteUsername = Boolean(autocomplete?.includes('username'));
    const autocompleteEmail = Boolean(autocomplete?.includes('email'));
    const valueCandidate = value.length < 100;
    const valueEmail = valueCandidate && matchEmailValue(value);
    const valueTel = valueCandidate && matchTelValue(value);
    const valueUsername = valueCandidate && matchUsernameValue(value);
    return {
        exotic: boolInt(fieldFeatures.isFormNoop),
        visibleReadonly: boolInt(visibleReadonly),
        attrUsername: boolInt(attrUsername),
        attrEmail: boolInt(attrEmail),
        attrMatch: boolInt(attrMatch),
        autocompleteUsername: boolInt(autocompleteUsername),
        autocompleteEmail: boolInt(autocompleteEmail),
        valueEmail: boolInt(valueEmail),
        valueTel: boolInt(valueTel),
        valueUsername: boolInt(valueUsername),
    };
};

const USERNAME_HIDDEN_FEATURES = [
    'exotic',
    'visibleReadonly',
    'attrUsername',
    'attrEmail',
    'attrMatch',
    'autocompleteUsername',
    'autocompleteEmail',
    'valueEmail',
    'valueTel',
    'valueUsername',
];

const results = {
    coeffs: [
        ['username-hidden-isCC', -5069218786957208e-21],
        ['username-hidden-isIdentity', -12434394166266283e-51],
        ['username-hidden-exotic', -3.327122688293457],
        ['username-hidden-visibleReadonly', 4.001387119293213],
        ['username-hidden-attrUsername', 8.459402084350586],
        ['username-hidden-attrEmail', 6.698646545410156],
        ['username-hidden-attrMatch', 11.342423439025879],
        ['username-hidden-autocompleteUsername', -3.5891025066375732],
        ['username-hidden-autocompleteEmail', 1.5537992715835571],
        ['username-hidden-valueEmail', 9.995153427124023],
        ['username-hidden-valueTel', 1.316414713859558],
        ['username-hidden-valueUsername', 2.0308327674865723],
    ],
    bias: -12.415574073791504,
    cutoff: 0.53,
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
    const minLength = field.getAttribute('minlength');
    const maxLength = field.getAttribute('maxLength');
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
    const isCC = matchCCFieldCandidate(field, {
        visible,
    });
    const isIdentity =
        !isCC &&
        matchIdentityField(field, {
            visible,
            form,
            searchField,
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
    const iframes = clusterable(Array.from(doc.querySelectorAll('iframe')).filter(isIFrameField));
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
    const rules = ruleset(aggregation.rules, aggregation.coeffs, aggregation.biases, prepass);
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
    getCachedCCSubtype,
    getCachedIdentitySubType,
    getCachedPredictionScore,
    getCachedSubType,
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
    isIFrameField,
    isIdentity,
    isIgnored,
    isMFACandidate,
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
    matchCCFieldCandidate,
    matchIdentityField,
    matchPredictedType,
    maybeEmail,
    maybeHiddenUsername,
    maybeOTP,
    maybePassword,
    maybeUsername,
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
    setCachedSubType,
    shadowPiercingAncestors,
    shadowPiercingContains,
    shallowShadowQuerySelector,
    shouldRunClassifier,
    splitFieldsByVisibility,
    trainees,
};
