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

const kDomDialogSelector = `[role="dialog"], [role="tabpanel"], [role="group"], [role="form"], [id*="modal"], [class*="modal"]`;

const kDomClusterSelector = `${kDomDialogSelector}, header, main, nav, footer, aside`;

const kDomGroupSelector = `${kDomClusterSelector}, section`;

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

const kLayoutSelector = `div, section, aside, main, nav, label`;

const kAnchorLinkSelector = `a, [role="link"], span[role="button"]`;

const formCandidateSelector = `form, [${FORM_CLUSTER_ATTR}]`;

const inputCandidateSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="checkbox"])';

const kInputIteratorSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]), textarea, select';

const kButtonSelector = `button:not([type]), a[role="button"], ${kButtonSubmitSelector}`;

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

const matchPreviousSibling = (el, match) => {
    const prevEl = el.previousElementSibling;
    if (prevEl === null) return null;
    if (match(prevEl)) return prevEl;
    return matchPreviousSibling(prevEl, match);
};

const matchPreviousNonEmptySibling = (el) =>
    matchPreviousSibling(el, (el) => el instanceof HTMLElement && el.innerText.trim().length > 0);

const getLabelFor = (el) => {
    const forId = el.getAttribute('id') ?? el.getAttribute('name');
    const label = document.querySelector(`label[for="${forId}"]`);
    if (label) return label;
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel;
    const closestLabel = parentQuery(el, (parent) => parent.querySelector('label:not([for])'), 1);
    if (closestLabel) return closestLabel;
    const labelLike = parentQuery(el, (parent) => parent.querySelector(kFieldLabelSelector), 1);
    if (labelLike) return labelLike;
    const textNodeAbove = matchPreviousNonEmptySibling(el);
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

const MIN_AREA_SUBMIT_BTN = 3e3;

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

const PASSWORD_OUTLIER_RE = /s(?:ocialsecurity|ecanswer)|nationalid|answer|userid/i;

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
    /(?:authentication|approvals|email|login)code|phoneverification|challenge|t(?:wo(?:fa(?:ctor)?|step)|facode)|2fa|\b([mt]fa)\b/i;

const AUTHENTICATOR_ATTR_RE =
    /a(?:pplicationdauthentification|ut(?:henti(?:(?:fiz|s)ierungsapp|cat(?:ionapp|or)|fi(?:cateu|kato)r)|enticador))|genera(?:torapp|dora)/i;

const OTP_ATTR_RE = /totp(?:pin)?|o(?:netime|t[cp])|1time/i;

const OTP_OUTLIER_RE =
    /n(?:(?:ue|o)vocodigo|ouveaucode|e(?:usenden|(?:uer|w)code))|re(?:enviar|send)|envoyer|senden|enviar|send/i;

const OTP_OUTLIER_ATTR_RE = /email|sms/i;

const NEWSLETTER_RE = /newsletter|b(?:ul|o)letin|mailing/i;

const NEWSLETTER_ATTR_RE = /subscription|mailinglist|newsletter|emailform/i;

const IDENTITY_FULLNAME_ATTR_RE = /addresscontact|contactperson|addressname|yourname|fullname|\b(name)\b/i;

const IDENTITY_FIRSTNAME_ATTR_RE = /givenname|firstn(?:ame)?|\b(fname)\b/i;

const IDENTITY_MIDDLENAME_ATTR_RE = /additionalname|middlen(?:ame)?|\b(mname)\b/i;

const IDENTITY_LASTNAME_ATTR_RE = /familyn(?:ame)?|lastn(?:ame)?|surname|\b([ls]name)\b/i;

const IDENTITY_TELEPHONE_ATTR_RE = /(?:national|contact)number|(?:tele)?phone|mobile|\b(tel(?:national|local)?)\b/i;

const IDENTITY_TELEPHONE_OUTLIER_ATTR_RE = /extension|security|co(?:untry|de)|prefix/i;

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

const CC_PREFIX_ATTR_RE = /(?:payments?|new)card|c(?:ar(?:tecredit|d)|red(?:it(?:debit|card)|card))|stripe|vads/i;

const CC_NUMBER_ATTR_RE = /num(?:ero(?:de)?)?carte|c(?:ardn(?:um|[or])|bnum|cno)|\b(c(?:ard |c)number)\b/i;

const CC_OUTLIER_ATTR_RE = /c(?:ertificate|oupon)|logincard|voucher|promo/i;

const CC_CVC_ATTR_RE = /c(?:ard(?:verification|code)|cv|sc|v[cv])|payments?code|\b(c(?:cc(?:ode|vv|sc)|vn))\b/i;

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

const matchMFAAttr = test(TWO_FA_ATTR_RE);

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

const isEditorFrame = () => {
    if (document.designMode === 'on') return true;
    if (document.body?.isContentEditable) return true;
    return document.querySelector(kEditorSelector) !== null;
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
        if (field.value) fieldAttrs.push(sanitizeString(field.value));
        if (field.type === 'image' && field.alt) fieldAttrs.push(sanitizeString(field.alt));
    }
    const haystacks = [fieldText, labelText, ...fieldAttrs];
    const autocomplete = field.getAttribute('autocomplete');
    if (autocomplete) haystacks.push(sanitizeString(autocomplete));
    return haystacks;
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
    const textAbove = (() => {
        if (headings.length > 0) return headings.map((el) => el.innerText).join();
        const prevSibling = matchPreviousNonEmptySibling(el);
        const parentFirstChild = el.parentElement?.firstElementChild;
        const prevSiblingText = prevSibling?.innerText ?? '';
        const parentFirstChildText = parentFirstChild?.innerText ?? '';
        return prevSibling === parentFirstChild ? prevSiblingText : prevSiblingText + parentFirstChildText;
    })();
    return sanitizeString(textAbove);
};

const CC_ATTRIBUTES = [
    'autocomplete',
    'name',
    'id',
    'class',
    'form',
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

const CC_EXP_FULL_RE = /(mmyy|mmaa|yymm|aamm)/;

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
    if (CC_EXP_FULL_RE.test(haystack)) return false;
    if (matchCCExpMonth(haystack)) return true;
    if (field instanceof HTMLSelectElement && matchCCExp(haystack)) {
        return field.options.length >= 12 && field.options.length <= 14;
    }
    return false;
};

const isCCExpYear = (field, autocompletes, haystack) => {
    if (autocompletes.includes('cc-exp')) return false;
    if (CC_EXP_FULL_RE.test(haystack)) return false;
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
                password: true,
            },
            isCCNumber
        ),
    ],
];

const getCCHaystack = (field) => {
    const attrs = CC_ATTRIBUTES.map((attr) => field?.getAttribute(attr) ?? '');
    const labelEl = getLabelFor(field);
    const label = sanitizeString(
        (() => {
            if (!labelEl) return '';
            if (labelEl.innerText) return labelEl.innerText;
            if (labelEl.childElementCount === 0) return '';
            return Array.from(labelEl.children)
                .map((el) => el?.innerText ?? '')
                .join(' ');
        })()
    );
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
    const formEls = Array.from(form.querySelectorAll(kInputIteratorSelector)).filter(isVisibleField);
    const getAdjacent = (el, offset, tagNameFilter) => {
        const idx = formEls.indexOf(el);
        const res = idx === -1 ? null : (formEls?.[idx + offset] ?? null);
        return res && tagNameFilter && res?.tagName !== tagNameFilter ? getAdjacent(res, offset, tagNameFilter) : res;
    };
    const iterator = {
        prev: (el, tagNameFilter) => getAdjacent(el, -1, tagNameFilter),
        next: (el, tagNameFilter) => getAdjacent(el, 1, tagNameFilter),
    };
    return iterator;
};

const selectFormCandidates = (root = document) => {
    const candidates = Array.from(root.querySelectorAll(formCandidateSelector));
    return candidates.filter((form) => !isIgnored(form) && !attrIgnored(form));
};

const getFormComplexity = (form, options) => {
    const types = new Set();
    let score = 0;
    score += options.visibleFields * 2;
    score += options.buttons * 1;
    score += options.anchors * 0.5;
    score += options.nonVisibleFields * 0.25;
    score += options.hiddenFields * 0.1;
    for (const field of options.fields) {
        const type = field.tagName === 'INPUT' ? field.type : field.tagName;
        if (!types.has(type)) {
            score += 0.2;
            types.add(type);
        }
    }
    score += form.querySelectorAll("fieldset, [role='group'], [role='radiogroup']").length * 0.2;
    for (const el of form.querySelectorAll('div, section')) {
        if (el.children.length > 1) score += 0.2;
    }
    return score;
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
    const btns = Array.from(form.querySelectorAll(kButtonSelector)).filter(isVisibleEl);
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
    const multiStep = buttonMultiStep || headingsMultiStep;
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
    const inputsMFA =
        mfaInputs.some(({ autocomplete }) => autocomplete.includes('one-time-code')) ||
        any(matchMFA)(mfaInputsHaystack);
    const formAttrsMFA = any(matchMFA)(formAttributes);
    const formTextMFA = any(matchMFA)(formTextHaystack);
    const maybeMFA = inputsMFA || formAttrsMFA || formTextMFA;
    const haystackMFA = [...formTextHaystack, maybeMFA ? sanitizeString(form.innerText) : ''];
    const formTextAuthenticator = any(matchAuthenticator)(haystackMFA);
    const headingsOTPOutlier = matchOtpOutlier(nearestHeadingsText);
    const formOTPOutlier = any(matchOtpOutlier)(formAttributes);
    const linkOTPOutlier = any(matchOtpOutlierAction)(anchorsHaystack.concat(btnHaystack));
    const newsletterForm = any(matchNewsletter)(formTextHaystack);
    const searchForm = any(matchSearchAction)(formTextHaystack);
    const formComplexity = getFormComplexity(form, {
        fields,
        visibleFields: visibleFields.length,
        hiddenFields: hidden.length,
        nonVisibleFields: fields.length - visibleFields.length - hidden.length,
        anchors: anchors.length,
        buttons: candidateBtns.length,
    });
    return {
        formComplexity: linearScale$1(formComplexity, 0, 50),
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
        headingsOTPOutlier: boolInt(headingsOTPOutlier),
        inputsMFA: boolInt(inputsMFA),
        newsletterForm: boolInt(newsletterForm),
        searchForm: boolInt(searchForm),
        multiStepForm: boolInt(multiStep),
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
        ['login-fieldsCount', 2.065674066543579],
        ['login-inputCount', 0.9491850733757019],
        ['login-fieldsetCount', -1.189860224723816],
        ['login-textCount', -2.368138074874878],
        ['login-textareaCount', -1.3255058526992798],
        ['login-selectCount', -4.289883136749268],
        ['login-disabledCount', -0.19213023781776428],
        ['login-radioCount', -6.378592491149902],
        ['login-readOnlyCount', -6.972659587860107],
        ['login-formComplexity', -2.6383655071258545],
        ['login-identifierCount', -2.229288339614868],
        ['login-hiddenIdentifierCount', 3.156749963760376],
        ['login-usernameCount', -0.11791249364614487],
        ['login-emailCount', -4.279738426208496],
        ['login-hiddenCount', 3.1436030864715576],
        ['login-hiddenPasswordCount', 6.142287731170654],
        ['login-submitCount', -5.385858535766602],
        ['login-identitiesCount', 1.0063810348510742],
        ['login-ccsCount', -3.041745662689209],
        ['login-hasTels', -3.572767972946167],
        ['login-hasOAuth', -0.32713985443115234],
        ['login-hasCaptchas', 1.85956609249115],
        ['login-hasFiles', -0.002326665911823511],
        ['login-hasDate', -1.743984341621399],
        ['login-hasNumber', -5.98751163482666],
        ['login-oneVisibleField', 2.3347537517547607],
        ['login-twoVisibleFields', 0.1527644544839859],
        ['login-threeOrMoreVisibleFields', -1.402081847190857],
        ['login-noPasswords', -6.365621089935303],
        ['login-onePassword', 6.80683708190918],
        ['login-twoPasswords', 0.6542012095451355],
        ['login-threeOrMorePasswords', -1.0075517892837524],
        ['login-noIdentifiers', -2.0201921463012695],
        ['login-oneIdentifier', 1.101897954940796],
        ['login-twoIdentifiers', 2.3429055213928223],
        ['login-threeOrMoreIdentifiers', -4.854606628417969],
        ['login-autofocusedIsIdentifier', 3.4023258686065674],
        ['login-autofocusedIsPassword', 6.514471530914307],
        ['login-visibleRatio', 1.288650631904602],
        ['login-inputRatio', -3.28261661529541],
        ['login-hiddenRatio', -0.5867312550544739],
        ['login-identifierRatio', -2.0321459770202637],
        ['login-emailRatio', 11.888168334960938],
        ['login-usernameRatio', -3.1489248275756836],
        ['login-passwordRatio', 3.1215336322784424],
        ['login-disabledRatio', -0.19092190265655518],
        ['login-requiredRatio', 0.5831543803215027],
        ['login-checkboxRatio', -10.66311264038086],
        ['login-hiddenIdentifierRatio', 1.477758765220642],
        ['login-hiddenPasswordRatio', 6.428186416625977],
        ['login-pageLogin', 3.822286367416382],
        ['login-formTextLogin', 0.000792537466622889],
        ['login-formAttrsLogin', 4.77785062789917],
        ['login-headingsLogin', 7.796941757202148],
        ['login-layoutLogin', -0.26248061656951904],
        ['login-rememberMeCheckbox', 4.893353462219238],
        ['login-troubleLink', 3.828437089920044],
        ['login-submitLogin', 9.878599166870117],
        ['login-pageRegister', -8.365083694458008],
        ['login-formTextRegister', -6.571506977081299],
        ['login-formAttrsRegister', -7.072699069976807],
        ['login-headingsRegister', -3.4668314456939697],
        ['login-layoutRegister', 1.7515099048614502],
        ['login-pwNewRegister', -13.065201759338379],
        ['login-pwConfirmRegister', -4.624321937561035],
        ['login-submitRegister', -12.945816040039062],
        ['login-TOSRef', -2.7949252128601074],
        ['login-pagePwReset', -1.0230576992034912],
        ['login-formTextPwReset', -0.00029643686139024794],
        ['login-formAttrsPwReset', -11.048954010009766],
        ['login-headingsPwReset', -1.4110478162765503],
        ['login-layoutPwReset', 2.0068514347076416],
        ['login-pageRecovery', -1.0384728908538818],
        ['login-formTextRecovery', -9987466069729156e-51],
        ['login-formAttrsRecovery', -10.21717643737793],
        ['login-headingsRecovery', -3.247725248336792],
        ['login-layoutRecovery', 1.6090505123138428],
        ['login-identifierRecovery', 0.16260860860347748],
        ['login-submitRecovery', -5.323972702026367],
        ['login-formTextMFA', -2.5962166786193848],
        ['login-formAttrsMFA', -9.907629013061523],
        ['login-inputsMFA', -10.710271835327148],
        ['login-newsletterForm', -3.056116819381714],
        ['login-searchForm', -4.059444427490234],
        ['login-multiStepForm', 2.5043270587921143],
        ['login-multiAuthForm', 0.4261501729488373],
        ['login-multiStepForm,multiAuthForm', 6.616724967956543],
        ['login-visibleRatio,fieldsCount', -1.9838987588882446],
        ['login-visibleRatio,identifierCount', -4.1915812492370605],
        ['login-visibleRatio,passwordCount', 1.1794648170471191],
        ['login-visibleRatio,hiddenIdentifierCount', -4.151271343231201],
        ['login-visibleRatio,hiddenPasswordCount', -3.0567424297332764],
        ['login-visibleRatio,multiAuthForm', 0.47269245982170105],
        ['login-visibleRatio,multiStepForm', 7.171198844909668],
        ['login-identifierRatio,fieldsCount', -3.0577831268310547],
        ['login-identifierRatio,identifierCount', -4.342659950256348],
        ['login-identifierRatio,passwordCount', 3.8349435329437256],
        ['login-identifierRatio,hiddenIdentifierCount', 1.078778862953186],
        ['login-identifierRatio,hiddenPasswordCount', 9.055331230163574],
        ['login-identifierRatio,multiAuthForm', 5.966587543487549],
        ['login-identifierRatio,multiStepForm', -5.94552755355835],
        ['login-passwordRatio,fieldsCount', 5.585751533508301],
        ['login-passwordRatio,identifierCount', 3.7911934852600098],
        ['login-passwordRatio,passwordCount', -2.8569281101226807],
        ['login-passwordRatio,hiddenIdentifierCount', 2.18680739402771],
        ['login-passwordRatio,hiddenPasswordCount', 0.7247834205627441],
        ['login-passwordRatio,multiAuthForm', -4.8728156089782715],
        ['login-passwordRatio,multiStepForm', -14.48682975769043],
        ['login-requiredRatio,fieldsCount', 1.1553714275360107],
        ['login-requiredRatio,identifierCount', -1.8798149824142456],
        ['login-requiredRatio,passwordCount', -3.665001153945923],
        ['login-requiredRatio,hiddenIdentifierCount', 7.629134654998779],
        ['login-requiredRatio,hiddenPasswordCount', 1.2110981941223145],
        ['login-requiredRatio,multiAuthForm', 3.6172196865081787],
        ['login-requiredRatio,multiStepForm', 4.248458385467529],
    ],
    bias: -1.0169538259506226,
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
        ['pw-change-fieldsCount', -0.18726682662963867],
        ['pw-change-inputCount', -0.4979439675807953],
        ['pw-change-fieldsetCount', -0.07796870917081833],
        ['pw-change-textCount', -1.4839940071105957],
        ['pw-change-textareaCount', -0.4200403392314911],
        ['pw-change-selectCount', -0.22232507169246674],
        ['pw-change-disabledCount', -0.019885221496224403],
        ['pw-change-radioCount', -1.96670663356781],
        ['pw-change-readOnlyCount', -1.9139208793640137],
        ['pw-change-formComplexity', -0.3571806848049164],
        ['pw-change-identifierCount', -1.2346820831298828],
        ['pw-change-hiddenIdentifierCount', -1.319345235824585],
        ['pw-change-usernameCount', -1.6254311800003052],
        ['pw-change-emailCount', -1.3648278713226318],
        ['pw-change-hiddenCount', 0.1118730902671814],
        ['pw-change-hiddenPasswordCount', -0.4566466808319092],
        ['pw-change-submitCount', 0.18404969573020935],
        ['pw-change-identitiesCount', -0.5020025968551636],
        ['pw-change-ccsCount', -0.4091755747795105],
        ['pw-change-hasTels', -1.124778151512146],
        ['pw-change-hasOAuth', -1.1120322942733765],
        ['pw-change-hasCaptchas', -1.172877311706543],
        ['pw-change-hasFiles', -0.0007016449235379696],
        ['pw-change-hasDate', -4.2617406847966777e-7],
        ['pw-change-hasNumber', -0.37949618697166443],
        ['pw-change-oneVisibleField', -1.3314650058746338],
        ['pw-change-twoVisibleFields', -0.6078432202339172],
        ['pw-change-threeOrMoreVisibleFields', 0.037726398557424545],
        ['pw-change-noPasswords', -2.32890248298645],
        ['pw-change-onePassword', -1.1779742240905762],
        ['pw-change-twoPasswords', 0.5568346977233887],
        ['pw-change-threeOrMorePasswords', 3.6821489334106445],
        ['pw-change-noIdentifiers', 0.16109441220760345],
        ['pw-change-oneIdentifier', -1.4501601457595825],
        ['pw-change-twoIdentifiers', -1.3423556089401245],
        ['pw-change-threeOrMoreIdentifiers', -0.4671093821525574],
        ['pw-change-autofocusedIsIdentifier', -1.1388001441955566],
        ['pw-change-autofocusedIsPassword', -1.3299732208251953],
        ['pw-change-visibleRatio', -1.736035943031311],
        ['pw-change-inputRatio', -1.4039283990859985],
        ['pw-change-hiddenRatio', 1.3113768100738525],
        ['pw-change-identifierRatio', -1.2798486948013306],
        ['pw-change-emailRatio', -1.2205175161361694],
        ['pw-change-usernameRatio', -1.2704967260360718],
        ['pw-change-passwordRatio', 2.0016252994537354],
        ['pw-change-disabledRatio', -0.016519419848918915],
        ['pw-change-requiredRatio', 0.22337782382965088],
        ['pw-change-checkboxRatio', 0.17172597348690033],
        ['pw-change-hiddenIdentifierRatio', -1.7063757181167603],
        ['pw-change-hiddenPasswordRatio', -0.4852684736251831],
        ['pw-change-pageLogin', -1.9826011657714844],
        ['pw-change-formTextLogin', -0.00014083198038861156],
        ['pw-change-formAttrsLogin', -0.9729655981063843],
        ['pw-change-headingsLogin', -1.2613351345062256],
        ['pw-change-layoutLogin', -1.2653251886367798],
        ['pw-change-rememberMeCheckbox', -0.44499218463897705],
        ['pw-change-troubleLink', -0.8590669631958008],
        ['pw-change-submitLogin', -1.490760087966919],
        ['pw-change-pageRegister', -0.3585624098777771],
        ['pw-change-formTextRegister', -9.431297343098777e-8],
        ['pw-change-formAttrsRegister', -3.570422410964966],
        ['pw-change-headingsRegister', -4.435601234436035],
        ['pw-change-layoutRegister', -0.3979237973690033],
        ['pw-change-pwNewRegister', 6.723573207855225],
        ['pw-change-pwConfirmRegister', 0.3100561499595642],
        ['pw-change-submitRegister', -2.605980396270752],
        ['pw-change-TOSRef', -0.0617145374417305],
        ['pw-change-pagePwReset', 0.7797132134437561],
        ['pw-change-formTextPwReset', 0.08789525181055069],
        ['pw-change-formAttrsPwReset', 3.0581741333007812],
        ['pw-change-headingsPwReset', 0.5979812741279602],
        ['pw-change-layoutPwReset', 3.760495901107788],
        ['pw-change-pageRecovery', -0.9737897515296936],
        ['pw-change-formTextRecovery', 6977551674935967e-20],
        ['pw-change-formAttrsRecovery', -0.4899715483188629],
        ['pw-change-headingsRecovery', -0.35778844356536865],
        ['pw-change-layoutRecovery', -0.11804516613483429],
        ['pw-change-identifierRecovery', -0.253184050321579],
        ['pw-change-submitRecovery', 1.8767292499542236],
        ['pw-change-formTextMFA', -0.932732343673706],
        ['pw-change-formAttrsMFA', -0.4060382544994354],
        ['pw-change-inputsMFA', -0.6155609488487244],
        ['pw-change-newsletterForm', -0.011618007905781269],
        ['pw-change-searchForm', -1.164563775062561],
        ['pw-change-multiStepForm', -1.0660309791564941],
        ['pw-change-multiAuthForm', -0.47488826513290405],
        ['pw-change-multiStepForm,multiAuthForm', -0.17554567754268646],
        ['pw-change-visibleRatio,fieldsCount', -0.6603723764419556],
        ['pw-change-visibleRatio,identifierCount', -1.2536375522613525],
        ['pw-change-visibleRatio,passwordCount', -0.27719444036483765],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -0.25815248489379883],
        ['pw-change-visibleRatio,hiddenPasswordCount', -0.24583548307418823],
        ['pw-change-visibleRatio,multiAuthForm', -0.4332584738731384],
        ['pw-change-visibleRatio,multiStepForm', -2.5296902656555176],
        ['pw-change-identifierRatio,fieldsCount', -1.1613363027572632],
        ['pw-change-identifierRatio,identifierCount', -1.078560471534729],
        ['pw-change-identifierRatio,passwordCount', -1.7858856916427612],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -0.2682705521583557],
        ['pw-change-identifierRatio,hiddenPasswordCount', -0.4682198464870453],
        ['pw-change-identifierRatio,multiAuthForm', -0.33614712953567505],
        ['pw-change-identifierRatio,multiStepForm', -0.8384471535682678],
        ['pw-change-passwordRatio,fieldsCount', 1.7528362274169922],
        ['pw-change-passwordRatio,identifierCount', -1.4953421354293823],
        ['pw-change-passwordRatio,passwordCount', 2.6471364498138428],
        ['pw-change-passwordRatio,hiddenIdentifierCount', -1.5096862316131592],
        ['pw-change-passwordRatio,hiddenPasswordCount', -0.09961885213851929],
        ['pw-change-passwordRatio,multiAuthForm', -0.2077978402376175],
        ['pw-change-passwordRatio,multiStepForm', -0.37619033455848694],
        ['pw-change-requiredRatio,fieldsCount', -0.7490494847297668],
        ['pw-change-requiredRatio,identifierCount', -1.4584957361221313],
        ['pw-change-requiredRatio,passwordCount', 0.8903936743736267],
        ['pw-change-requiredRatio,hiddenIdentifierCount', -1.0788662433624268],
        ['pw-change-requiredRatio,hiddenPasswordCount', -0.7983622550964355],
        ['pw-change-requiredRatio,multiAuthForm', -0.2136901319026947],
        ['pw-change-requiredRatio,multiStepForm', -0.20603318512439728],
    ],
    bias: -1.33815598487854,
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
        ['recovery-fieldsCount', 3.288306713104248],
        ['recovery-inputCount', 0.35931628942489624],
        ['recovery-fieldsetCount', 4.841421127319336],
        ['recovery-textCount', 0.22302812337875366],
        ['recovery-textareaCount', -8.565237998962402],
        ['recovery-selectCount', -3.9215004444122314],
        ['recovery-disabledCount', -0.0998121127486229],
        ['recovery-radioCount', -2.7975258827209473],
        ['recovery-readOnlyCount', 7.691858768463135],
        ['recovery-formComplexity', -6.87824821472168],
        ['recovery-identifierCount', -0.9893704652786255],
        ['recovery-hiddenIdentifierCount', -3.669901132583618],
        ['recovery-usernameCount', 2.087224006652832],
        ['recovery-emailCount', 0.18326836824417114],
        ['recovery-hiddenCount', 4.046462059020996],
        ['recovery-hiddenPasswordCount', -4.210745334625244],
        ['recovery-submitCount', 0.39993005990982056],
        ['recovery-identitiesCount', -3.658514976501465],
        ['recovery-ccsCount', -0.509651780128479],
        ['recovery-hasTels', -0.6432074904441833],
        ['recovery-hasOAuth', -3.6021976470947266],
        ['recovery-hasCaptchas', 8.010832786560059],
        ['recovery-hasFiles', -15.27592658996582],
        ['recovery-hasDate', -3784297950915061e-20],
        ['recovery-hasNumber', -0.6117064952850342],
        ['recovery-oneVisibleField', 0.9767827987670898],
        ['recovery-twoVisibleFields', -5.63618278503418],
        ['recovery-threeOrMoreVisibleFields', -3.0627567768096924],
        ['recovery-noPasswords', 0.2598942220211029],
        ['recovery-onePassword', -5.71963357925415],
        ['recovery-twoPasswords', -2.8209187984466553],
        ['recovery-threeOrMorePasswords', -0.1799316108226776],
        ['recovery-noIdentifiers', -5.529794216156006],
        ['recovery-oneIdentifier', -1.6197022199630737],
        ['recovery-twoIdentifiers', 3.4597644805908203],
        ['recovery-threeOrMoreIdentifiers', -2.005028009414673],
        ['recovery-autofocusedIsIdentifier', 1.1256396770477295],
        ['recovery-autofocusedIsPassword', -0.02290322445333004],
        ['recovery-visibleRatio', -1.5277595520019531],
        ['recovery-inputRatio', -2.9873251914978027],
        ['recovery-hiddenRatio', 1.3869223594665527],
        ['recovery-identifierRatio', -3.702195167541504],
        ['recovery-emailRatio', 7.106283187866211],
        ['recovery-usernameRatio', 1.026324987411499],
        ['recovery-passwordRatio', -4.57121467590332],
        ['recovery-disabledRatio', -0.1322506070137024],
        ['recovery-requiredRatio', -0.5384634733200073],
        ['recovery-checkboxRatio', -14.902548789978027],
        ['recovery-hiddenIdentifierRatio', 0.16765403747558594],
        ['recovery-hiddenPasswordRatio', -7.179848670959473],
        ['recovery-pageLogin', 0.46819695830345154],
        ['recovery-formTextLogin', -23132066417019814e-21],
        ['recovery-formAttrsLogin', 1.4576468467712402],
        ['recovery-headingsLogin', -0.6432769894599915],
        ['recovery-layoutLogin', -0.08739843219518661],
        ['recovery-rememberMeCheckbox', -1.5291125774383545],
        ['recovery-troubleLink', 3.3680191040039062],
        ['recovery-submitLogin', 0.4545993208885193],
        ['recovery-pageRegister', -1.5349425077438354],
        ['recovery-formTextRegister', -0.002982604783028364],
        ['recovery-formAttrsRegister', -3.487872838973999],
        ['recovery-headingsRegister', -0.6286435127258301],
        ['recovery-layoutRegister', -12.067005157470703],
        ['recovery-pwNewRegister', -1.1817824840545654],
        ['recovery-pwConfirmRegister', -1.095012903213501],
        ['recovery-submitRegister', -0.9568105936050415],
        ['recovery-TOSRef', -6.15656042098999],
        ['recovery-pagePwReset', -2.337230682373047],
        ['recovery-formTextPwReset', -45489741751225665e-22],
        ['recovery-formAttrsPwReset', 1.9865511655807495],
        ['recovery-headingsPwReset', 4.621596813201904],
        ['recovery-layoutPwReset', 0.03263548016548157],
        ['recovery-pageRecovery', 5.945675849914551],
        ['recovery-formTextRecovery', 0.024076353758573532],
        ['recovery-formAttrsRecovery', 3.597128391265869],
        ['recovery-headingsRecovery', 5.378423690795898],
        ['recovery-layoutRecovery', 2.2262635231018066],
        ['recovery-identifierRecovery', 7.527689456939697],
        ['recovery-submitRecovery', 7.629399299621582],
        ['recovery-formTextMFA', 0.47407400608062744],
        ['recovery-formAttrsMFA', 1.9694629907608032],
        ['recovery-inputsMFA', -3.522726058959961],
        ['recovery-newsletterForm', -4.815468788146973],
        ['recovery-searchForm', 2.9590673446655273],
        ['recovery-multiStepForm', -2.7157230377197266],
        ['recovery-multiAuthForm', -2.056352376937866],
        ['recovery-multiStepForm,multiAuthForm', -1.2008188962936401],
        ['recovery-visibleRatio,fieldsCount', 1.0471813678741455],
        ['recovery-visibleRatio,identifierCount', -0.9370128512382507],
        ['recovery-visibleRatio,passwordCount', -3.0307528972625732],
        ['recovery-visibleRatio,hiddenIdentifierCount', -1.148763656616211],
        ['recovery-visibleRatio,hiddenPasswordCount', -0.8471540808677673],
        ['recovery-visibleRatio,multiAuthForm', -1.8621288537979126],
        ['recovery-visibleRatio,multiStepForm', 0.42817065119743347],
        ['recovery-identifierRatio,fieldsCount', 5.3166704177856445],
        ['recovery-identifierRatio,identifierCount', -3.714519500732422],
        ['recovery-identifierRatio,passwordCount', -5.008007049560547],
        ['recovery-identifierRatio,hiddenIdentifierCount', 2.513150691986084],
        ['recovery-identifierRatio,hiddenPasswordCount', -4.398845195770264],
        ['recovery-identifierRatio,multiAuthForm', -2.2471506595611572],
        ['recovery-identifierRatio,multiStepForm', 4.670524597167969],
        ['recovery-passwordRatio,fieldsCount', -3.016345262527466],
        ['recovery-passwordRatio,identifierCount', -4.138582706451416],
        ['recovery-passwordRatio,passwordCount', -3.61480712890625],
        ['recovery-passwordRatio,hiddenIdentifierCount', -1.1604136228561401],
        ['recovery-passwordRatio,hiddenPasswordCount', -8870710189512465e-21],
        ['recovery-passwordRatio,multiAuthForm', -0.2541200816631317],
        ['recovery-passwordRatio,multiStepForm', 0.1775313764810562],
        ['recovery-requiredRatio,fieldsCount', -4.220822811126709],
        ['recovery-requiredRatio,identifierCount', -1.3438541889190674],
        ['recovery-requiredRatio,passwordCount', -1.0871710777282715],
        ['recovery-requiredRatio,hiddenIdentifierCount', -7.641473293304443],
        ['recovery-requiredRatio,hiddenPasswordCount', -0.00039780468796379864],
        ['recovery-requiredRatio,multiAuthForm', -0.2248672991991043],
        ['recovery-requiredRatio,multiStepForm', -1.7264164686203003],
    ],
    bias: -2.3402719497680664,
    cutoff: 0.45,
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
        ['register-fieldsCount', -0.9475560784339905],
        ['register-inputCount', 1.9756413698196411],
        ['register-fieldsetCount', 11.105827331542969],
        ['register-textCount', 2.198115348815918],
        ['register-textareaCount', 3.137080192565918],
        ['register-selectCount', 0.6986119747161865],
        ['register-disabledCount', -6.275187969207764],
        ['register-radioCount', -6.502213001251221],
        ['register-readOnlyCount', -5.6887640953063965],
        ['register-formComplexity', -0.5026180744171143],
        ['register-identifierCount', 1.9043463468551636],
        ['register-hiddenIdentifierCount', 3.798166513442993],
        ['register-usernameCount', 1.8345175981521606],
        ['register-emailCount', 5.449726104736328],
        ['register-hiddenCount', -9.360424041748047],
        ['register-hiddenPasswordCount', 3.8309898376464844],
        ['register-submitCount', -2.7364394664764404],
        ['register-identitiesCount', -2.0017786026000977],
        ['register-ccsCount', -17.027097702026367],
        ['register-hasTels', 5.386133670806885],
        ['register-hasOAuth', -3.018038034439087],
        ['register-hasCaptchas', 2.9466819763183594],
        ['register-hasFiles', -5.386020660400391],
        ['register-hasDate', -0.2901080250740051],
        ['register-hasNumber', 8.108875274658203],
        ['register-oneVisibleField', 0.16603974997997284],
        ['register-twoVisibleFields', -1.4999109506607056],
        ['register-threeOrMoreVisibleFields', -1.2764071226119995],
        ['register-noPasswords', -5.813462257385254],
        ['register-onePassword', 2.3099374771118164],
        ['register-twoPasswords', 5.6728620529174805],
        ['register-threeOrMorePasswords', -0.9530256390571594],
        ['register-noIdentifiers', -3.619675397872925],
        ['register-oneIdentifier', -4.685095310211182],
        ['register-twoIdentifiers', 3.6891376972198486],
        ['register-threeOrMoreIdentifiers', 4.692525386810303],
        ['register-autofocusedIsIdentifier', 1.3313490152359009],
        ['register-autofocusedIsPassword', 13.76915168762207],
        ['register-visibleRatio', 0.847367525100708],
        ['register-inputRatio', -3.295640468597412],
        ['register-hiddenRatio', 6.336616039276123],
        ['register-identifierRatio', 1.6839886903762817],
        ['register-emailRatio', 7.001020431518555],
        ['register-usernameRatio', -3.043931245803833],
        ['register-passwordRatio', -7.491825103759766],
        ['register-disabledRatio', -2.9193243980407715],
        ['register-requiredRatio', -2.587545871734619],
        ['register-checkboxRatio', 3.502537727355957],
        ['register-hiddenIdentifierRatio', -14.423766136169434],
        ['register-hiddenPasswordRatio', 5.336142539978027],
        ['register-pageLogin', -5.274814128875732],
        ['register-formTextLogin', -1742349468258908e-21],
        ['register-formAttrsLogin', -5.170830726623535],
        ['register-headingsLogin', -5.053277492523193],
        ['register-layoutLogin', 2.815699815750122],
        ['register-rememberMeCheckbox', -9.062816619873047],
        ['register-troubleLink', -9.45419692993164],
        ['register-submitLogin', -3.3729419708251953],
        ['register-pageRegister', 7.338155269622803],
        ['register-formTextRegister', 0.0001491687580710277],
        ['register-formAttrsRegister', 4.250612735748291],
        ['register-headingsRegister', 4.360448837280273],
        ['register-layoutRegister', 1.1869025230407715],
        ['register-pwNewRegister', 4.318793296813965],
        ['register-pwConfirmRegister', 11.429852485656738],
        ['register-submitRegister', 9.639750480651855],
        ['register-TOSRef', 3.406724214553833],
        ['register-pagePwReset', -3.043694019317627],
        ['register-formTextPwReset', -885930348886177e-19],
        ['register-formAttrsPwReset', -3.471470594406128],
        ['register-headingsPwReset', -3.8972315788269043],
        ['register-layoutPwReset', -9.144514083862305],
        ['register-pageRecovery', -1.4127391576766968],
        ['register-formTextRecovery', -1893771334725741e-50],
        ['register-formAttrsRecovery', -2.746462345123291],
        ['register-headingsRecovery', -3.6820149421691895],
        ['register-layoutRecovery', 1.5878419876098633],
        ['register-identifierRecovery', 1.387682318687439],
        ['register-submitRecovery', -9.253833770751953],
        ['register-formTextMFA', -3.1656391620635986],
        ['register-formAttrsMFA', -2.738003969192505],
        ['register-inputsMFA', -8.064987182617188],
        ['register-newsletterForm', -14.648618698120117],
        ['register-searchForm', -4.509357929229736],
        ['register-multiStepForm', 5.842601776123047],
        ['register-multiAuthForm', 12.159416198730469],
        ['register-multiStepForm,multiAuthForm', 1.5711417198181152],
        ['register-visibleRatio,fieldsCount', -2.1850738525390625],
        ['register-visibleRatio,identifierCount', -2.6314024925231934],
        ['register-visibleRatio,passwordCount', -4.218010425567627],
        ['register-visibleRatio,hiddenIdentifierCount', -0.9407923817634583],
        ['register-visibleRatio,hiddenPasswordCount', -5.088012218475342],
        ['register-visibleRatio,multiAuthForm', -8.171699523925781],
        ['register-visibleRatio,multiStepForm', 5.874395370483398],
        ['register-identifierRatio,fieldsCount', -0.34214794635772705],
        ['register-identifierRatio,identifierCount', -1.0925023555755615],
        ['register-identifierRatio,passwordCount', 7.2662224769592285],
        ['register-identifierRatio,hiddenIdentifierCount', 5.2362871170043945],
        ['register-identifierRatio,hiddenPasswordCount', -3.9073712825775146],
        ['register-identifierRatio,multiAuthForm', 1.4049797058105469],
        ['register-identifierRatio,multiStepForm', -5.32907247543335],
        ['register-passwordRatio,fieldsCount', 5.690274238586426],
        ['register-passwordRatio,identifierCount', 3.475647211074829],
        ['register-passwordRatio,passwordCount', -4.42755126953125],
        ['register-passwordRatio,hiddenIdentifierCount', 4.24779748916626],
        ['register-passwordRatio,hiddenPasswordCount', -0.752798855304718],
        ['register-passwordRatio,multiAuthForm', 0.9335992336273193],
        ['register-passwordRatio,multiStepForm', 1.206589698791504],
        ['register-requiredRatio,fieldsCount', -3.7056398391723633],
        ['register-requiredRatio,identifierCount', -0.2896931767463684],
        ['register-requiredRatio,passwordCount', 1.256439447402954],
        ['register-requiredRatio,hiddenIdentifierCount', 0.3501993417739868],
        ['register-requiredRatio,hiddenPasswordCount', -0.6486811637878418],
        ['register-requiredRatio,multiAuthForm', -4.59515905380249],
        ['register-requiredRatio,multiStepForm', 3.587998151779175],
    ],
    bias: -2.345719337463379,
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
    const autocomplete = fieldFeatures.autocomplete;
    const typeEmail = fieldFeatures.type === 'email';
    const exactAttrEmail = field.matches(kEmailSelector);
    const mfaAttrs = autocomplete === 'one-time-code' || any(matchMFAAttr)(fieldAttrs);
    const attrEmail = any(matchEmailAttr)(fieldAttrs);
    const textEmail = matchEmail(fieldText);
    const labelEmail = matchEmail(labelText);
    const placeholder = field.placeholder;
    const placeholderEmailValue = any(matchEmailValue)(placeholder.split(' '));
    const placeholderEmail = placeholderEmailValue || matchEmail(sanitizeString(field.placeholder));
    return {
        autocompleteEmail: boolInt(autocomplete?.includes('email') ?? false),
        autocompleteOff: boolInt(autocomplete === 'false' || autocomplete === 'off'),
        typeEmail: boolInt(typeEmail),
        exactAttrEmail: boolInt(exactAttrEmail),
        attrEmail: boolInt(attrEmail),
        textEmail: boolInt(textEmail),
        labelEmail: boolInt(labelEmail),
        placeholderEmail: boolInt(placeholderEmail),
        searchField: boolInt(fieldFeatures.searchField),
        mfaOutlier: boolInt(mfaAttrs),
    };
};

const EMAIL_FEATURES = [
    'autocompleteEmail',
    'autocompleteOff',
    'typeEmail',
    'exactAttrEmail',
    'attrEmail',
    'textEmail',
    'labelEmail',
    'placeholderEmail',
    'searchField',
    'mfaOutlier',
];

const results$5 = {
    coeffs: [
        ['email-isCC', -2.302745819091797],
        ['email-isIdentity', -4.169693470001221],
        ['email-autocompleteEmail', 3.5877737998962402],
        ['email-autocompleteOff', -1.038155198097229],
        ['email-typeEmail', 9.47666072845459],
        ['email-exactAttrEmail', 7.962523460388184],
        ['email-attrEmail', 2.1127467155456543],
        ['email-textEmail', 4.645251750946045],
        ['email-labelEmail', 11.807215690612793],
        ['email-placeholderEmail', 7.250506401062012],
        ['email-searchField', -7.989174842834473],
        ['email-mfaOutlier', -10.20360279083252],
    ],
    bias: -6.452713966369629,
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
    const headingsOTPOutlier = Boolean(formFeatures?.headingsOTPOutlier);
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
    const autocompleteOff = autocomplete !== undefined && (autocomplete === 'off' || autocomplete === 'false');
    const outlierAutocomplete =
        outlierCandidate && autocomplete !== undefined && !autocompleteOff && !autocomplete?.includes('one-time-code');
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
        headingsOTPOutlier: boolInt(headingsOTPOutlier),
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
    'headingsOTPOutlier',
    'emailOutlierCount',
    'outlierAutocomplete',
    'formComplexity',
    ...combineFeatures(['otp', 'mfa'], ['outlier', 'siblingOfInterest', 'singleInput']),
    ...combineFeatures(['autocompleteOTC'], ['linkOutlier', 'authenticator']),
];

const results$4 = {
    coeffs: [
        ['otp-isCC', -1.8438317775726318],
        ['otp-isIdentity', -3.7338287830352783],
        ['otp-numericMode', -1.1955515146255493],
        ['otp-nameMatch', 3.137355089187622],
        ['otp-idMatch', 4.983297824859619],
        ['otp-autocompleteOTC', 1.11063551902771],
        ['otp-patternOTP', 1.1910730600357056],
        ['otp-formMFA', 0.8229154944419861],
        ['otp-formAuthenticator', 7.3669867515563965],
        ['otp-attrOTP', 1.612715721130371],
        ['otp-textOTP', -6.938820838928223],
        ['otp-labelOTP', 1.245690107345581],
        ['otp-parentOTP', -0.008902612142264843],
        ['otp-attrMFA', 4.251642227172852],
        ['otp-textMFA', 3.5818188190460205],
        ['otp-labelMFA', 6.952996730804443],
        ['otp-textAuthenticator', 0.03550104796886444],
        ['otp-labelAuthenticator', 3.5033862590789795],
        ['otp-maxLength1', 0.19571354985237122],
        ['otp-maxLength6', 2.6550066471099854],
        ['otp-maxLengthInvalid', -6.747822284698486],
        ['otp-siblingOfInterest', 8.022333145141602],
        ['otp-unexpectedInputCount', -1.7552534341812134],
        ['otp-fieldOutlier', -3.2916226387023926],
        ['otp-linkOutlier', -4.439039707183838],
        ['otp-headingsOTPOutlier', -9.866660118103027],
        ['otp-emailOutlierCount', -1.9656665325164795],
        ['otp-outlierAutocomplete', -8.1957368850708],
        ['otp-formComplexity', -4.277226448059082],
        ['otp-otp,outlier', -2.2121992111206055],
        ['otp-otp,siblingOfInterest', -4.709403991699219],
        ['otp-otp,singleInput', 1.5918281078338623],
        ['otp-mfa,outlier', -0.21563389897346497],
        ['otp-mfa,siblingOfInterest', 0.5864216685295105],
        ['otp-mfa,singleInput', 4.585051536560059],
        ['otp-autocompleteOTC,linkOutlier', -1.6606892347335815],
        ['otp-autocompleteOTC,authenticator', 0.5420308709144592],
    ],
    bias: -7.3531670570373535,
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

const isAutocompleteOTP = (value) => value?.includes('one-time-code') ?? false;

const getPasswordFieldFeatures = (fnode) => {
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField, isCC, isIdentity } = fieldFeatures;
    const passwordOutlier = any(matchPasswordOutlier)(fieldAttrs.concat(labelText, fieldText));
    const outlier = isCC || isIdentity || passwordOutlier;
    const attrCurrent = any(matchPasswordCurrentAttr)(fieldAttrs);
    const textCurrent = matchPasswordCurrent(fieldText);
    const labelCurrent = matchPasswordCurrent(labelText);
    const current = attrCurrent || textCurrent || labelCurrent;
    const attrCreate = any(matchPasswordCreateAttr)(fieldAttrs);
    const textCreate = matchPasswordCreate(fieldText);
    const labelCreate = matchPasswordCreate(labelText);
    const create = attrCreate || textCreate || labelCreate;
    const attrConfirm = any(matchPasswordConfirmAttr)(fieldAttrs);
    const textConfirm = matchPasswordConfirm(fieldText);
    const labelConfirm = matchPasswordConfirm(labelText);
    const confirm = attrConfirm || textConfirm || labelConfirm;
    const attrReset = any(matchPasswordResetAttr)(fieldAttrs);
    const textReset = matchPasswordReset(fieldText);
    const labelReset = matchPasswordReset(labelText);
    const reset = attrReset || textReset || labelReset;
    const maybeCurrent = current;
    const maybeNew = create || confirm || reset;
    const autocomplete = outlier ? '' : fieldFeatures.autocomplete;
    const autocompleteNew = isAutocompleteNewPassword(autocomplete);
    const autocompleteCurrent = isAutocompleteCurrentPassword(autocomplete);
    const prevPwField = prevField && prevField.getAttribute('type') === 'password' ? prevField : null;
    const nextPwField = nextField && nextField.getAttribute('type') === 'password' ? nextField : null;
    const prevPwHaystack = prevPwField ? getAllFieldHaystacks(prevPwField) : [];
    const nextPwHaystack = nextPwField ? getAllFieldHaystacks(nextPwField) : [];
    const prevAutocomplete = prevPwField?.getAttribute('autocomplete');
    const prevAutocompleteCurrent = isAutocompleteCurrentPassword(prevAutocomplete);
    const prevPwCurrent = prevAutocompleteCurrent || any(matchPasswordCurrent)(prevPwHaystack);
    const prevAutocompleteNew = isAutocompleteNewPassword(prevAutocomplete);
    const prevPwNew = prevAutocompleteNew || any(matchPasswordCreate)(prevPwHaystack);
    const nextAutocomplete = nextPwField?.getAttribute('autocomplete');
    const nextAutocompleteCurrent = isAutocompleteCurrentPassword(nextAutocomplete);
    const nextPwCurrent = nextAutocompleteCurrent || any(matchPasswordCurrent)(nextPwHaystack);
    const nextAutocompleteNew = isAutocompleteNewPassword(nextAutocomplete);
    const nextPwNew = nextAutocompleteNew || any(matchPasswordCreate)(nextPwHaystack);
    const nextPwConfirm = any(matchPasswordConfirm)(nextPwHaystack);
    return {
        loginScore: boolInt(fieldFeatures.isFormLogin),
        registerScore: boolInt(fieldFeatures.isFormRegister),
        exotic: boolInt(fieldFeatures.isFormNoop),
        maybeNew: boolInt(maybeNew),
        maybeCurrent: boolInt(maybeCurrent),
        autocompleteNew: boolInt(autocompleteNew),
        autocompleteCurrent: boolInt(autocompleteCurrent),
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
        labelCreate: boolInt(labelCreate),
        labelCurrent: boolInt(labelCurrent),
        labelConfirm: boolInt(labelConfirm),
        passwordOutlier: boolInt(passwordOutlier),
        prevPwNew: boolInt(prevPwNew),
        prevPwCurrent: boolInt(prevPwCurrent),
        nextPwNew: boolInt(nextPwNew),
        nextPwCurrent: boolInt(nextPwCurrent),
        nextPwConfirm: boolInt(nextPwConfirm),
    };
};

const PW_FEATURES = [
    'loginScore',
    'registerScore',
    'exotic',
    'passwordOutlier',
    'autocompleteNew',
    'autocompleteCurrent',
    'autocompleteOTP',
    'autocompleteOff',
    'attrCurrent',
    'textCurrent',
    'labelCurrent',
    'attrCreate',
    'textCreate',
    'labelCreate',
    'attrConfirm',
    'textConfirm',
    'labelConfirm',
    'attrReset',
    'prevPwField',
    'prevPwNew',
    'prevPwCurrent',
    'nextPwField',
    'nextPwNew',
    'nextPwCurrent',
    'nextPwConfirm',
    ...combineFeatures(['prevPwCurrent'], ['nextPwNew']),
    ...combineFeatures(['registerScore'], ['maybeCurrent', 'autocompleteCurrent']),
    ...combineFeatures(['loginScore'], ['maybeNew', 'autocompleteNew']),
];

const results$3 = {
    coeffs: [
        ['password-isCC', -2.5636372566223145],
        ['password-isIdentity', -6781988971828856e-51],
        ['password-loginScore', 6.946640968322754],
        ['password-registerScore', -9.36110782623291],
        ['password-exotic', -6.27876091003418],
        ['password-passwordOutlier', -7.014529705047607],
        ['password-autocompleteNew', -6.448522567749023],
        ['password-autocompleteCurrent', 1.3389664888381958],
        ['password-autocompleteOTP', -1.9562480449676514],
        ['password-autocompleteOff', -1.9217503070831299],
        ['password-attrCurrent', 2.2498087882995605],
        ['password-textCurrent', 0.5041653513908386],
        ['password-labelCurrent', 2.727182149887085],
        ['password-attrCreate', -1.176269292831421],
        ['password-textCreate', -4.626845836639404],
        ['password-labelCreate', -5.221868515014648],
        ['password-attrConfirm', -2.85477876663208],
        ['password-textConfirm', -0.8420363664627075],
        ['password-labelConfirm', -1.530185580253601],
        ['password-attrReset', 0.11559787392616272],
        ['password-prevPwField', -5.866302013397217],
        ['password-prevPwNew', -2.9317009449005127],
        ['password-prevPwCurrent', -1.408396601676941],
        ['password-nextPwField', -2.4775726795196533],
        ['password-nextPwNew', 3.6663472652435303],
        ['password-nextPwCurrent', -0.00045114950626157224],
        ['password-nextPwConfirm', -5.2512640953063965],
        ['password-prevPwCurrent,nextPwNew', -1.3818113803863525],
        ['password-registerScore,maybeCurrent', -0.06804154813289642],
        ['password-registerScore,autocompleteCurrent', -2.1098783016204834],
        ['password-loginScore,maybeNew', 1.4841408729553223],
        ['password-loginScore,autocompleteNew', 2.0451042652130127],
    ],
    bias: 3.3999741077423096,
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
        ['new-password-isCC', -7.750640869140625],
        ['new-password-isIdentity', 12313653447692564e-51],
        ['new-password-loginScore', -7.434292316436768],
        ['new-password-registerScore', 7.0830979347229],
        ['new-password-exotic', 3.3626904487609863],
        ['new-password-passwordOutlier', -14.2278470993042],
        ['new-password-autocompleteNew', 4.349693775177002],
        ['new-password-autocompleteCurrent', -1.82951021194458],
        ['new-password-autocompleteOTP', -6.418908596038818],
        ['new-password-autocompleteOff', -0.1893405318260193],
        ['new-password-attrCurrent', -1.5728305578231812],
        ['new-password-textCurrent', -0.6776870489120483],
        ['new-password-labelCurrent', -2.7903196811676025],
        ['new-password-attrCreate', 0.6300671696662903],
        ['new-password-textCreate', 5.1784443855285645],
        ['new-password-labelCreate', 4.848267078399658],
        ['new-password-attrConfirm', 2.2062582969665527],
        ['new-password-textConfirm', 0.7371813654899597],
        ['new-password-labelConfirm', 1.4755524396896362],
        ['new-password-attrReset', -0.0861111581325531],
        ['new-password-prevPwField', 4.440598011016846],
        ['new-password-prevPwNew', 2.434648275375366],
        ['new-password-prevPwCurrent', 1.7866837978363037],
        ['new-password-nextPwField', -1.20454740524292],
        ['new-password-nextPwNew', -2.017737627029419],
        ['new-password-nextPwCurrent', 0.018719302490353584],
        ['new-password-nextPwConfirm', 6.023489475250244],
        ['new-password-prevPwCurrent,nextPwNew', 1.8443115949630737],
        ['new-password-registerScore,maybeCurrent', 0.04274522885680199],
        ['new-password-registerScore,autocompleteCurrent', 2.153658866882324],
        ['new-password-loginScore,maybeNew', -2.9734034538269043],
        ['new-password-loginScore,autocompleteNew', -2.209329605102539],
    ],
    bias: -0.5809531211853027,
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
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevInput, isFormLogin } = fieldFeatures;
    const { autocomplete } = fieldFeatures;
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const textUsername = matchUsername(fieldText);
    const labelUsername = matchUsername(labelText);
    const username = attrUsername || textUsername || labelUsername;
    const emailMatch = field.matches(kEmailSelector) || any(matchEmailAttr)(fieldAttrs.concat(fieldText, labelText));
    const outlierAttrs = any(matchUsernameOutlier)(fieldAttrs);
    const outlierText = matchUsernameOutlier(fieldText);
    const outlierLabel = matchUsernameOutlier(labelText);
    const outlierEmail = !username && emailMatch;
    const outlier = outlierAttrs || outlierText || outlierLabel || outlierEmail;
    const autocompleteOff = autocomplete !== undefined && (autocomplete === 'off' || autocomplete === 'false');
    const autocompleteEmail = Boolean(autocomplete?.includes('email'));
    const autocompleteUsername =
        !emailMatch && Boolean(autocomplete?.includes('username') || autocomplete?.includes('nickname'));
    const firstFormField = prevInput === null;
    const maybeCandidate = !(outlier || username);
    const firstLoginFormField = isFormLogin && firstFormField && maybeCandidate;
    return {
        autocompleteUsername: boolInt(autocompleteUsername),
        autocompleteEmail: boolInt(autocompleteEmail),
        autocompleteOff: boolInt(autocompleteOff),
        firstLoginFormField: boolInt(firstLoginFormField),
        attrUsername: boolInt(attrUsername),
        textUsername: boolInt(textUsername),
        labelUsername: boolInt(labelUsername),
        outlierText: boolInt(outlierText),
        outlierAttrs: boolInt(outlierAttrs),
        outlierLabel: boolInt(outlierLabel),
        outlierEmail: boolInt(outlierEmail),
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
    'firstLoginFormField',
    'searchField',
];

const results$1 = {
    coeffs: [
        ['username-isCC', -2.692028284072876],
        ['username-isIdentity', -1.7940101623535156],
        ['username-autocompleteUsername', 1.5201926231384277],
        ['username-autocompleteEmail', -0.09516911953687668],
        ['username-autocompleteOff', -0.676824152469635],
        ['username-attrUsername', 12.206316947937012],
        ['username-textUsername', 11.20547103881836],
        ['username-labelUsername', 12.179003715515137],
        ['username-outlierText', -1.290200114250183],
        ['username-outlierAttrs', -1.8079599142074585],
        ['username-outlierLabel', -0.957481324672699],
        ['username-outlierEmail', -3.2352871894836426],
        ['username-firstLoginFormField', 13.292522430419922],
        ['username-searchField', -7.991785049438477],
    ],
    bias: -6.445306301116943,
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
    const attrMatch = field.matches('[name="username"],[id="username"],[name="account"]');
    const autocompleteUsername = Boolean(autocomplete?.includes('username'));
    const autocompleteEmail = Boolean(autocomplete?.includes('email'));
    const autocompleteAccount = Boolean(autocomplete?.includes('account'));
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
        autocompleteAccount: boolInt(autocompleteAccount),
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
        ['username-hidden-isCC', -0.022124962881207466],
        ['username-hidden-isIdentity', 11780463731647404e-51],
        ['username-hidden-exotic', -3.3256540298461914],
        ['username-hidden-visibleReadonly', 4.350417137145996],
        ['username-hidden-attrUsername', 9.107187271118164],
        ['username-hidden-attrEmail', 7.355875015258789],
        ['username-hidden-attrMatch', 10.116140365600586],
        ['username-hidden-autocompleteUsername', 1.0870623588562012],
        ['username-hidden-autocompleteEmail', 1.5898197889328003],
        ['username-hidden-valueEmail', 9.99262809753418],
        ['username-hidden-valueTel', 0.11103510856628418],
        ['username-hidden-valueUsername', 0.07664205878973007],
    ],
    bias: -12.758004188537598,
    cutoff: 0.5,
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
    const maxLength = field.getAttribute('maxlength');
    const pattern = field.pattern;
    const autocomplete = field.getAttribute('autocomplete')?.trim().toLowerCase();
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
    const prevInput = typeValid ? (formFeatures?.formInputIterator.prev(field, 'INPUT') ?? null) : null;
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
        prevInput,
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
        return candidate.querySelectorAll(kButtonSelector).length === 0;
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
    const domGroups = Array.from(doc.querySelectorAll(kDomClusterSelector)).filter((el) => el !== document.body);
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
    getFormComplexity,
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
    isEditorFrame,
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
    kButtonSelector,
    kButtonSubmitSelector,
    kCaptchaSelector,
    kDomClusterSelector,
    kDomDialogSelector,
    kDomGroupSelector,
    kEditorElements,
    kEditorPatterns,
    kEditorSelector,
    kEmailSelector,
    kFieldLabelSelector,
    kFieldSelector,
    kHeadingSelector,
    kHiddenUsernameSelector,
    kInputIteratorSelector,
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
