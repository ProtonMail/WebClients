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

const FIELD_ATTRIBUTES = [EL_ATTRIBUTES, 'name'].flat();

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

const DETECTED_FIELD_TYPE_ATTR = 'data-protonpass-field-type';

const DETECTED_FORM_TYPE_ATTR = 'data-protonpass-form-type';

const DETECTED_CLUSTER_ATTR = 'data-protonpass-cluster';

const IGNORE_ELEMENT_ATTR = 'data-protonpass-ignore';

const setInputType = (input, type) => input.setAttribute(DETECTED_FIELD_TYPE_ATTR, type);

const setFormType = (form, type) => form.setAttribute(DETECTED_FORM_TYPE_ATTR, type);

const setClusterType = (el) => el.setAttribute(DETECTED_CLUSTER_ATTR, '');

const setIgnoreType = (el) => el.setAttribute(IGNORE_ELEMENT_ATTR, '');

const boolInt = (val) => Number(val);

const safeInt = (val, fallback = 0) => (Number.isFinite(val) ? val : fallback);

const featureScore = (noteFor, key) =>
    score((fnode) => {
        const features = fnode.noteFor(noteFor);
        return features[key];
    });

const getParentFnodeForm = (fieldFnode) => {
    const field = fieldFnode.element;
    const ruleset = fieldFnode._ruleset;
    const parentForms = ruleset.get('form');
    const form = parentForms.find(({ element }) => element.contains(field));
    if (form) return form;
    const preDetectedForm = field.closest(`[${DETECTED_FORM_TYPE_ATTR}]`);
    if (preDetectedForm) return ruleset.get(preDetectedForm);
    return null;
};

const getFormTypeScore = (formFnode, type) => {
    if (!formFnode) return 0;
    if (formFnode.element.getAttribute(DETECTED_FORM_TYPE_ATTR) === type) return 1;
    return formFnode === null || formFnode === void 0 ? void 0 : formFnode.scoreFor(type);
};

const usePredetectedAttr = (attr) => (typeAttrValue) =>
    rule(dom(`[${attr}="${typeAttrValue}"]`), out(typeAttrValue), {});

const usePreDetectedCluster = (typeOut) =>
    rule(dom(`[${DETECTED_CLUSTER_ATTR}]:not([${DETECTED_FORM_TYPE_ATTR}])`), type(typeOut), {});

const usePreDetectedForm = usePredetectedAttr(DETECTED_FORM_TYPE_ATTR);

const usePreDetectedField = usePredetectedAttr(DETECTED_FIELD_TYPE_ATTR);

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

const MAX_FORM_FIELD_WALK_UP = 3;

const MAX_FORM_HEADING_WALK_UP = 3;

const MAX_HEADING_HORIZONTAL_DIST = 75;

const MAX_HEADING_VERTICAL_DIST = 150;

const MIN_AREA_SUBMIT_BTN = 3500;

const MIN_FIELD_HEIGHT = 15;

const MIN_FIELD_WIDTH = 50;

const MAX_INPUTS_PER_FORM = 40;

const MAX_FIELDS_PER_FORM = 60;

const MAX_HIDDEN_FIELD_VALUE_LENGTH = 320;

const HIDDEN_FIELD_IGNORE_VALUES = ['0', '1', 'true', 'false'];

const OTP_PATTERNS = ['d*', 'd{6}', '[0-9]*', '[0-9]{6}', '([0-9]{6})|([0-9a-fA-F]{5}-?[0-9a-fA-F]{5})'];

const kUsernameSelector = [
    'input[type="search"][name="loginName"]',
    'input[type="username"]',
    'input[name="userID"]',
    'input[name="USERNAME"]',
];

const kEmailSelector = ['input[name="email"]', 'input[id="email"]'];

const kPasswordSelector = ['input[type="text"][id="password"]'];

const formOfInterestSelector = `form:not([role="search"]):not(body > form:only-of-type):not(table td > form)`;

const headingSelector = [
    ...[1, 2, 3, 4, 5].flatMap((level) => [`h${level}, [aria-level="${level}"]`]),
    '[role="heading"]',
    '[class*="title"]',
    '[name="title"]',
].join(',');

const fieldSelector = 'input, select, textarea';

const outlierFieldSelector = [
    ':not([aria-autocomplete="list"])',
    ':not([name*="title" i]):not([id="title"])',
    ':not([name*="search" i]):not([id="search"])',
].join('');

const editableFieldSelector = [
    'input[type="email"]',
    `input[type="text"]${outlierFieldSelector}`,
    'input[type="number"]',
    'input[type="tel"]',
    'input[type="password"]',
    'input[autocomplete="one-time-code"]',
    `input[type=""]${outlierFieldSelector}`,
    'input:not([type])',
    ...kUsernameSelector,
].join(',');

const fieldOfInterestSelector = `${editableFieldSelector}, input[type="hidden"]:not([value=""]`;

const buttonSubmitSelector = [
    'button[type="submit"]',
    'button[type="button"]',
    'button[name="submit"]',
    'button[id*="password" i]',
    'button[jsaction]',
    'a[role="submit"]',
    'a[role="button"]',
    'div[role="button"]',
    'div[role="submit"]',
].join(',');

const buttonSelector = `button:not([type]), ${buttonSubmitSelector}`;

const anchorLinkSelector = `a, span[role="button"]`;

const captchaSelector = `[class*="captcha"], [id*="captcha"], [name*="captcha"]`;

const socialSelector = `[class*=social],[aria-label*=with]`;

const clusterSelector = `[role="dialog"], [role="tabpanel"], [role="group"], [role="form"], [id*="modal"], [class*="modal"], header, section, nav, footer, aside`;

const layoutSelector = `div, section, aside, main, nav`;

const usernameSelector = `input[type="text"], input[type=""], input:not([type]), input[type="tel"], ${kUsernameSelector.join(
    ','
)}`;

const passwordSelector = `input[type="password"], ${kPasswordSelector.join(',')}`;

const hiddenUsernameSelector = 'input[type="email"], input[type="text"], input[type="hidden"]';

const otpSelector = 'input[type="tel"], input[type="number"], input[type="text"], input:not([type])';

const LOGIN_RE =
    /(?:(?:n(?:ouvelleses|uevase|ewses)s|iniciarses|connex)io|anmeldedate|sign[io])n|in(?:iciarsessao|troduce)|a(?:uthenticate|nmeld(?:ung|en))|authentifier|s(?:econnect|identifi)er|novasessao|(?:introduci|conecta|entr[ae])r|connect|acceder|login/i;

const REGISTER_RE =
    /kontoerstellen|cr(?:ea(?:teaccount|rcuenta)|iarconta)|(?:nouveaucompt|creeruncompt|s?inscrir|unirs)e|re(?:gist(?:r(?:ieren|arse|ar)|er)|joindre)|nuevacuenta|neueskonto|getstarted|newaccount|novaconta|(?:com(?:mence|eca)|(?:empez|junt)a)r|signup|join/i;

const RECOVERY_RE =
    /(?:wiederherstell|zurucksetz)en|re(?:(?:initialis|stablec)er|(?:defini|staur[ae])r|c(?:uper[ae]|ove)r|set)|problem|(?:troubl|restor|aid)e|a[jy]uda|h(?:ilfe|elp)/i;

const MULTI_STEP_RE = /p(?:rogres(?:s(?:ion|o)|o)|aso)|fortschritt|progress|s(?:chritt|t(?:age|ep))|etap[ae]|phase/i;

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
            if ((rect.width === 0 || rect.height === 0) && style.overflow === 'hidden') return false;
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

const isVisibleField = (field) => {
    if (field instanceof HTMLInputElement) {
        const { type, disabled, readOnly } = field;
        if (type === 'hidden' || disabled || readOnly) return false;
    }
    return quickVisibilityCheck(field, {
        minHeight: MIN_FIELD_HEIGHT,
        minWidth: MIN_FIELD_WIDTH,
    });
};

const isVisibleEl = (el) =>
    quickVisibilityCheck(el, {
        minHeight: 0,
        minWidth: 0,
    });

const isFormOfInterest = (fnodeOrEl) => {
    const form = 'element' in fnodeOrEl ? fnodeOrEl.element : fnodeOrEl;
    if (form.getAttribute(DETECTED_FORM_TYPE_ATTR) !== null) return false;
    if (form.getAttribute(IGNORE_ELEMENT_ATTR) !== null) return false;
    if (
        form.tagName !== 'FORM' &&
        !isVisible(form, {
            opacity: true,
        })
    )
        return false;
    const fields = Array.from(form.querySelectorAll(fieldSelector));
    const inputs = Array.from(form.querySelectorAll(editableFieldSelector)).filter((field) => !field.disabled);
    if (fields.length > MAX_FIELDS_PER_FORM || inputs.length > MAX_INPUTS_PER_FORM) {
        setIgnoreType(form);
        return false;
    }
    return (
        inputs.length > 0 &&
        inputs.some((input) =>
            isVisible(input, {
                opacity: false,
            })
        )
    );
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
    const isHiddenInput = field instanceof HTMLInputElement && field.type === 'hidden';
    const fieldAttrs = getFieldAttributes(field);
    const fieldText = isHiddenInput ? '' : getNodeText(field);
    const labelText = isHiddenInput ? '' : getFieldLabelText(field);
    const fieldset = isHiddenInput ? null : (_a = field.closest('fieldset')) !== null && _a !== void 0 ? _a : null;
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
    var _a, _b;
    const originRect = el.getBoundingClientRect();
    const parent = walkUpWhile(
        el,
        MAX_FORM_HEADING_WALK_UP
    )((parentEl, candidate) => {
        if (parentEl === document.body) return false;
        if (candidate.matches(clusterSelector)) return false;
        return true;
    });
    const headings = Array.from(parent.querySelectorAll(headingSelector)).filter((heading) => {
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

const isFieldOfInterest = (fnode) => {
    const field = fnode.element;
    if (field.getAttribute(DETECTED_FIELD_TYPE_ATTR) !== null) return false;
    if (field.getAttribute(IGNORE_ELEMENT_ATTR) !== null) return false;
    if (field.matches(`[${IGNORE_ELEMENT_ATTR}] *`)) return false;
    if (field.type === 'hidden') {
        if (getParentFnodeForm(fnode) === null) return false;
        const value = field.value.trim().toLowerCase();
        if (value === '' || value.length > MAX_HIDDEN_FIELD_VALUE_LENGTH) return false;
        if (HIDDEN_FIELD_IGNORE_VALUES.includes(value)) return false;
    }
    return true;
};

const isUserEditableFNode = (fnode) => {
    const { visible, readonly, disabled } = fnode.noteFor('field');
    return visible && !readonly && !disabled;
};

const isUserEditableField = (el) => {
    if (el.getAttribute(IGNORE_ELEMENT_ATTR) !== null) return false;
    if (el.matches(`[${IGNORE_ELEMENT_ATTR}] *`)) return false;
    const { readOnly, disabled, offsetHeight } = el;
    return (
        !readOnly &&
        !disabled &&
        offsetHeight > MIN_FIELD_HEIGHT &&
        isVisible(el, {
            opacity: false,
        })
    );
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
    if (btn.innerText === '') return false;
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
    const passwords = inputs.filter((el) => el.matches(passwordSelector));
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
    const socialEls = Array.from(parent.querySelectorAll(socialSelector));
    const btns = Array.from(form.querySelectorAll(buttonSelector));
    const submitBtns = btns.filter(isSubmitBtnCandidate);
    const btnCandidates = submits.concat(submitBtns);
    const anchors = Array.from(form.querySelectorAll(anchorLinkSelector)).filter(isVisibleEl);
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

const getFieldFeature = (fnode) => {
    var _a, _b, _c;
    const field = fnode.element;
    const fieldHaystacks = getFieldHaystacks(field);
    const formFnode = getParentFnodeForm(fnode);
    if (formFnode !== null && !formFnode.hasNoteFor('form')) formFnode.setNoteFor('form', getFormFeatures(formFnode));
    const form =
        (_a = formFnode === null || formFnode === void 0 ? void 0 : formFnode.element) !== null && _a !== void 0
            ? _a
            : field.closest('form');
    const formFeatures = formFnode === null || formFnode === void 0 ? void 0 : formFnode.noteFor('form');
    const isFormLogin = getFormTypeScore(formFnode, 'login') > 0.5;
    const isFormRegister = getFormTypeScore(formFnode, 'register') > 0.5;
    const isFormPWChange = getFormTypeScore(formFnode, 'password-change') > 0.5;
    const isFormRecovery = getFormTypeScore(formFnode, 'recovery') > 0.5;
    const isFormMFA = getFormTypeScore(formFnode, 'mfa') > 0.5;
    const detectionResults = [isFormLogin, isFormRegister, isFormPWChange, isFormRecovery, isFormMFA];
    const dangling = form === undefined || form === null;
    const exotic = !dangling && detectionResults.every((detected) => !detected);
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
              opacity: dangling,
          })
        : false;
    const prevField = typeValid
        ? (_b =
              formFeatures === null || formFeatures === void 0
                  ? void 0
                  : formFeatures.formInputIterator.prev(field)) !== null && _b !== void 0
            ? _b
            : null
        : null;
    const nextField = typeValid
        ? (_c =
              formFeatures === null || formFeatures === void 0
                  ? void 0
                  : formFeatures.formInputIterator.next(field)) !== null && _c !== void 0
            ? _c
            : null
        : null;
    return Object.assign(
        {
            formFnode,
            formFeatures,
            isFormLogin,
            isFormRegister,
            isFormPWChange,
            isFormRecovery,
            isFormMFA,
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
    const { fieldAttrs, fieldText, labelText, prevField, nextField } = fieldFeatures;
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const textUsername = matchUsername(fieldText);
    const labelUsername = matchUsername(labelText);
    const outlierUsername = any(matchUsernameOutlier)(fieldAttrs.concat(fieldText, labelText));
    const haystack = fieldAttrs.concat(fieldText).concat(labelText);
    const matchEmail = any(matchEmailAttr)(haystack);
    const loginForm = fieldFeatures.isFormLogin;
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
        ['login-fieldsCount', 3.959794521331787],
        ['login-inputCount', 7.5402631759643555],
        ['login-fieldsetCount', -33.19214630126953],
        ['login-textCount', -12.44431209564209],
        ['login-textareaCount', -5.931391716003418],
        ['login-selectCount', -7.777213096618652],
        ['login-checkboxCount', 13.026579856872559],
        ['login-radioCount', 0.023541398346424103],
        ['login-identifierCount', -9.166092872619629],
        ['login-usernameCount', 9.616862297058105],
        ['login-emailCount', -28.84518814086914],
        ['login-submitCount', -10.776402473449707],
        ['login-hasTels', -7.146113872528076],
        ['login-hasOAuth', -5.29536771774292],
        ['login-hasCaptchas', 3.0084078311920166],
        ['login-hasFiles', 0.04334818571805954],
        ['login-hasDate', -34.21398162841797],
        ['login-hasNumber', -6.14851713180542],
        ['login-noPasswordFields', -16.87078094482422],
        ['login-onePasswordField', 1.5843490362167358],
        ['login-twoPasswordFields', -17.42234992980957],
        ['login-threePasswordFields', -15.543034553527832],
        ['login-oneIdentifierField', -7.602077007293701],
        ['login-twoIdentifierFields', -7.616878986358643],
        ['login-threeIdentifierFields', -8.228114128112793],
        ['login-hasHiddenIdentifier', -1.0938867330551147],
        ['login-hasHiddenPassword', 34.83795166015625],
        ['login-autofocusedIsPassword', 13.448899269104004],
        ['login-visibleRatio', 11.00518798828125],
        ['login-inputRatio', 1.1756482124328613],
        ['login-hiddenRatio', 23.675382614135742],
        ['login-identifierRatio', 19.44095802307129],
        ['login-emailRatio', 13.193501472473145],
        ['login-usernameRatio', -10.940896987915039],
        ['login-passwordRatio', 3.8690452575683594],
        ['login-requiredRatio', -0.5289161801338196],
        ['login-patternRatio', 1.3136632442474365],
        ['login-minMaxLengthRatio', 4.876028537750244],
        ['login-pageLogin', 9.707489967346191],
        ['login-formTextLogin', 8.269813537597656],
        ['login-formAttrsLogin', 12.154019355773926],
        ['login-headingsLogin', 16.823945999145508],
        ['login-layoutLogin', 2.146436929702759],
        ['login-rememberMeCheckbox', 8.433149337768555],
        ['login-troubleLink', 20.091426849365234],
        ['login-submitLogin', 9.476685523986816],
        ['login-pageRegister', -2.241781234741211],
        ['login-formTextRegister', -0.0010483339428901672],
        ['login-formAttrsRegister', -17.64455223083496],
        ['login-headingsRegister', -15.243551254272461],
        ['login-layoutRegister', 2.1486167907714844],
        ['login-checkboxTOS', -0.1060619130730629],
        ['login-submitRegister', -4.062159061431885],
        ['login-pagePwReset', -11.32507038116455],
        ['login-formTextPwReset', -5.903774261474609],
        ['login-formAttrsPwReset', -12.378853797912598],
        ['login-headingsPwReset', -16.230419158935547],
        ['login-layoutPwReset', -4.76903772354126],
        ['login-pageRecovery', -14.274173736572266],
        ['login-formTextRecovery', 0.09684524685144424],
        ['login-formAttrsRecovery', -20.1550350189209],
        ['login-headingsRecovery', 2.4029717445373535],
        ['login-layoutRecovery', -0.7795705199241638],
        ['login-identifierRecovery', -1.9154962301254272],
        ['login-submitRecovery', -5.258755683898926],
        ['login-formTextMFA', -0.029703445732593536],
        ['login-formAttrsMFA', -15.201754570007324],
        ['login-headingsMFA', -8.440797805786133],
        ['login-layoutMFA', -4.373780727386475],
        ['login-buttonVerify', -5.5915422439575195],
        ['login-inputsMFA', -34.35983657836914],
        ['login-inputsOTP', -22.079463958740234],
        ['login-linkOTPOutlier', -2.8988375663757324],
        ['login-headingsNewsletter', -8.056485176086426],
        ['login-oneVisibleField', 1.9584364891052246],
        ['login-buttonMultiStep', 4.108728408813477],
        ['login-buttonMultiAction', 20.211091995239258],
        ['login-headingsMultiStep', -40.4975471496582],
    ],
    bias: -10.918084144592285,
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
        usePreDetectedForm('login'),
    ],
};

const results$9 = {
    coeffs: [
        ['pw-change-fieldsCount', -2.328141927719116],
        ['pw-change-inputCount', -2.0344858169555664],
        ['pw-change-fieldsetCount', -5.971837520599365],
        ['pw-change-textCount', -6.098156929016113],
        ['pw-change-textareaCount', -6.095726490020752],
        ['pw-change-selectCount', -5.901426792144775],
        ['pw-change-checkboxCount', -6.042984485626221],
        ['pw-change-radioCount', 0.023994944989681244],
        ['pw-change-identifierCount', -5.586440086364746],
        ['pw-change-usernameCount', -6.105659008026123],
        ['pw-change-emailCount', -4.160464763641357],
        ['pw-change-submitCount', -3.5611815452575684],
        ['pw-change-hasTels', -5.949265956878662],
        ['pw-change-hasOAuth', -6.036533832550049],
        ['pw-change-hasCaptchas', -5.906147480010986],
        ['pw-change-hasFiles', 0.04673599451780319],
        ['pw-change-hasDate', -6.0736985206604],
        ['pw-change-hasNumber', -9.313158988952637],
        ['pw-change-noPasswordFields', -6.035593509674072],
        ['pw-change-onePasswordField', -5.958979606628418],
        ['pw-change-twoPasswordFields', 12.419231414794922],
        ['pw-change-threePasswordFields', 19.75696563720703],
        ['pw-change-oneIdentifierField', -6.10849666595459],
        ['pw-change-twoIdentifierFields', -5.925476551055908],
        ['pw-change-threeIdentifierFields', 12.085519790649414],
        ['pw-change-hasHiddenIdentifier', 0.06351180374622345],
        ['pw-change-hasHiddenPassword', -5.992208480834961],
        ['pw-change-autofocusedIsPassword', 20.052711486816406],
        ['pw-change-visibleRatio', -3.353344440460205],
        ['pw-change-inputRatio', -3.5236284732818604],
        ['pw-change-hiddenRatio', -4.462042808532715],
        ['pw-change-identifierRatio', -5.211134910583496],
        ['pw-change-emailRatio', -5.114505290985107],
        ['pw-change-usernameRatio', -5.997938632965088],
        ['pw-change-passwordRatio', 4.097000598907471],
        ['pw-change-requiredRatio', -4.280910968780518],
        ['pw-change-patternRatio', 3.0939877033233643],
        ['pw-change-minMaxLengthRatio', -3.177375316619873],
        ['pw-change-pageLogin', -5.912123203277588],
        ['pw-change-formTextLogin', -5.954538345336914],
        ['pw-change-formAttrsLogin', -6.033879280090332],
        ['pw-change-headingsLogin', -6.079371929168701],
        ['pw-change-layoutLogin', -5.920395851135254],
        ['pw-change-rememberMeCheckbox', -6.017367362976074],
        ['pw-change-troubleLink', -3.678687334060669],
        ['pw-change-submitLogin', -6.0106353759765625],
        ['pw-change-pageRegister', -5.939888954162598],
        ['pw-change-formTextRegister', 0.08228614181280136],
        ['pw-change-formAttrsRegister', -5.908392906188965],
        ['pw-change-headingsRegister', -6.51400899887085],
        ['pw-change-layoutRegister', -5.987748146057129],
        ['pw-change-checkboxTOS', -0.10485401004552841],
        ['pw-change-submitRegister', -6.432115077972412],
        ['pw-change-pagePwReset', 16.249242782592773],
        ['pw-change-formTextPwReset', 18.412437438964844],
        ['pw-change-formAttrsPwReset', 2.505141019821167],
        ['pw-change-headingsPwReset', 17.319393157958984],
        ['pw-change-layoutPwReset', 15.466385841369629],
        ['pw-change-pageRecovery', -6.047044277191162],
        ['pw-change-formTextRecovery', 0.06445331126451492],
        ['pw-change-formAttrsRecovery', -5.97461462020874],
        ['pw-change-headingsRecovery', -6.096447467803955],
        ['pw-change-layoutRecovery', -4.273964881896973],
        ['pw-change-identifierRecovery', -5.892559051513672],
        ['pw-change-submitRecovery', 0.6769176125526428],
        ['pw-change-formTextMFA', -0.07158460468053818],
        ['pw-change-formAttrsMFA', -5.941995620727539],
        ['pw-change-headingsMFA', -6.06097412109375],
        ['pw-change-layoutMFA', -6.00581169128418],
        ['pw-change-buttonVerify', -5.930013656616211],
        ['pw-change-inputsMFA', -6.048203468322754],
        ['pw-change-inputsOTP', -6.105607509613037],
        ['pw-change-linkOTPOutlier', -6.269731521606445],
        ['pw-change-headingsNewsletter', -5.962032318115234],
        ['pw-change-oneVisibleField', -6.01531457901001],
        ['pw-change-buttonMultiStep', -5.952710151672363],
        ['pw-change-buttonMultiAction', -6.039618968963623],
        ['pw-change-headingsMultiStep', -6.116927146911621],
    ],
    bias: -3.673264980316162,
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
        usePreDetectedForm('password-change'),
    ],
};

const results$8 = {
    coeffs: [
        ['register-fieldsCount', 0.4735662043094635],
        ['register-inputCount', 0.298049658536911],
        ['register-fieldsetCount', 8.925830841064453],
        ['register-textCount', 6.799712657928467],
        ['register-textareaCount', -6.374215602874756],
        ['register-selectCount', -0.7957817316055298],
        ['register-checkboxCount', -28.232805252075195],
        ['register-radioCount', -0.10490255057811737],
        ['register-identifierCount', 6.988749980926514],
        ['register-usernameCount', 1.7300398349761963],
        ['register-emailCount', 7.71506929397583],
        ['register-submitCount', 0.6062495708465576],
        ['register-hasTels', 29.718185424804688],
        ['register-hasOAuth', 6.93161678314209],
        ['register-hasCaptchas', 7.881036281585693],
        ['register-hasFiles', 0.08925861865282059],
        ['register-hasDate', 27.27101707458496],
        ['register-hasNumber', 35.173091888427734],
        ['register-noPasswordFields', -1.6081604957580566],
        ['register-onePasswordField', -4.62910270690918],
        ['register-twoPasswordFields', 18.87358283996582],
        ['register-threePasswordFields', -6.235227584838867],
        ['register-oneIdentifierField', 3.1291961669921875],
        ['register-twoIdentifierFields', 16.30312728881836],
        ['register-threeIdentifierFields', 9.839359283447266],
        ['register-hasHiddenIdentifier', 1.034820556640625],
        ['register-hasHiddenPassword', -3.4853405952453613],
        ['register-autofocusedIsPassword', -13.463614463806152],
        ['register-visibleRatio', -7.642994403839111],
        ['register-inputRatio', -11.687370300292969],
        ['register-hiddenRatio', -3.1281845569610596],
        ['register-identifierRatio', 12.511983871459961],
        ['register-emailRatio', -2.191492795944214],
        ['register-usernameRatio', -21.71416664123535],
        ['register-passwordRatio', 16.549522399902344],
        ['register-requiredRatio', -6.516659259796143],
        ['register-patternRatio', -7.690680503845215],
        ['register-minMaxLengthRatio', -11.831298828125],
        ['register-pageLogin', -10.057042121887207],
        ['register-formTextLogin', -6.141279697418213],
        ['register-formAttrsLogin', -0.14626501500606537],
        ['register-headingsLogin', -25.925594329833984],
        ['register-layoutLogin', 9.619750022888184],
        ['register-rememberMeCheckbox', -8.656576156616211],
        ['register-troubleLink', -19.92407989501953],
        ['register-submitLogin', -5.3050079345703125],
        ['register-pageRegister', -2.1623663902282715],
        ['register-formTextRegister', -0.009550608694553375],
        ['register-formAttrsRegister', 22.045427322387695],
        ['register-headingsRegister', 13.067699432373047],
        ['register-layoutRegister', -7.583526611328125],
        ['register-checkboxTOS', 0.03456152230501175],
        ['register-submitRegister', 29.231826782226562],
        ['register-pagePwReset', -5.911370277404785],
        ['register-formTextPwReset', -5.915759563446045],
        ['register-formAttrsPwReset', -5.9014692306518555],
        ['register-headingsPwReset', -22.927261352539062],
        ['register-layoutPwReset', -15.336671829223633],
        ['register-pageRecovery', -28.133501052856445],
        ['register-formTextRecovery', 0.08677918463945389],
        ['register-formAttrsRecovery', -7.00760555267334],
        ['register-headingsRecovery', -21.971668243408203],
        ['register-layoutRecovery', -12.389852523803711],
        ['register-identifierRecovery', -33.46827697753906],
        ['register-submitRecovery', -35.03750228881836],
        ['register-formTextMFA', 0.004175491631031036],
        ['register-formAttrsMFA', 11.126914024353027],
        ['register-headingsMFA', -1.465732455253601],
        ['register-layoutMFA', -12.866311073303223],
        ['register-buttonVerify', -0.4492093026638031],
        ['register-inputsMFA', -32.05475616455078],
        ['register-inputsOTP', -22.06379508972168],
        ['register-linkOTPOutlier', 1.0413241386413574],
        ['register-headingsNewsletter', -27.202083587646484],
        ['register-oneVisibleField', -8.484563827514648],
        ['register-buttonMultiStep', 10.685437202453613],
        ['register-buttonMultiAction', -10.851394653320312],
        ['register-headingsMultiStep', 16.079875946044922],
    ],
    bias: -0.38784685730934143,
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
        usePreDetectedForm('register'),
    ],
};

const results$7 = {
    coeffs: [
        ['recovery-fieldsCount', 3.9379732608795166],
        ['recovery-inputCount', 3.5333802700042725],
        ['recovery-fieldsetCount', -18.89076042175293],
        ['recovery-textCount', 4.202059268951416],
        ['recovery-textareaCount', -27.436368942260742],
        ['recovery-selectCount', -13.464640617370605],
        ['recovery-checkboxCount', -6.080948829650879],
        ['recovery-radioCount', 0.10692089051008224],
        ['recovery-identifierCount', 5.41815185546875],
        ['recovery-usernameCount', 30.27667999267578],
        ['recovery-emailCount', -9.523040771484375],
        ['recovery-submitCount', 3.7736072540283203],
        ['recovery-hasTels', -8.951045036315918],
        ['recovery-hasOAuth', -4.231360912322998],
        ['recovery-hasCaptchas', -6.893625736236572],
        ['recovery-hasFiles', -0.017902232706546783],
        ['recovery-hasDate', -6.027544021606445],
        ['recovery-hasNumber', -5.9964776039123535],
        ['recovery-noPasswordFields', 0.056301698088645935],
        ['recovery-onePasswordField', -22.091228485107422],
        ['recovery-twoPasswordFields', -5.970115661621094],
        ['recovery-threePasswordFields', -15.118549346923828],
        ['recovery-oneIdentifierField', 6.593052864074707],
        ['recovery-twoIdentifierFields', 2.430842161178589],
        ['recovery-threeIdentifierFields', -6.140735149383545],
        ['recovery-hasHiddenIdentifier', -18.491661071777344],
        ['recovery-hasHiddenPassword', -18.861831665039062],
        ['recovery-autofocusedIsPassword', -5.90859317779541],
        ['recovery-visibleRatio', -5.0834269523620605],
        ['recovery-inputRatio', -8.948737144470215],
        ['recovery-hiddenRatio', 3.174928665161133],
        ['recovery-identifierRatio', 8.623109817504883],
        ['recovery-emailRatio', 1.0356842279434204],
        ['recovery-usernameRatio', 1.7985502481460571],
        ['recovery-passwordRatio', -17.252744674682617],
        ['recovery-requiredRatio', 9.346231460571289],
        ['recovery-patternRatio', -8.72758674621582],
        ['recovery-minMaxLengthRatio', 5.343031406402588],
        ['recovery-pageLogin', -7.112730026245117],
        ['recovery-formTextLogin', -5.970614433288574],
        ['recovery-formAttrsLogin', -4.171786785125732],
        ['recovery-headingsLogin', -3.7987210750579834],
        ['recovery-layoutLogin', -16.39241600036621],
        ['recovery-rememberMeCheckbox', -6.0302734375],
        ['recovery-troubleLink', 4.78796911239624],
        ['recovery-submitLogin', -9.129514694213867],
        ['recovery-pageRegister', -12.511719703674316],
        ['recovery-formTextRegister', 0.0367981418967247],
        ['recovery-formAttrsRegister', -7.820537090301514],
        ['recovery-headingsRegister', -2.513481378555298],
        ['recovery-layoutRegister', -8.218094825744629],
        ['recovery-checkboxTOS', 0.031146876513957977],
        ['recovery-submitRegister', -7.568479537963867],
        ['recovery-pagePwReset', 7.4344329833984375],
        ['recovery-formTextPwReset', -6.963877201080322],
        ['recovery-formAttrsPwReset', 11.071380615234375],
        ['recovery-headingsPwReset', 17.600481033325195],
        ['recovery-layoutPwReset', 2.0379884243011475],
        ['recovery-pageRecovery', 23.775794982910156],
        ['recovery-formTextRecovery', 0.010618217289447784],
        ['recovery-formAttrsRecovery', 26.072193145751953],
        ['recovery-headingsRecovery', -2.87860369682312],
        ['recovery-layoutRecovery', -2.9385414123535156],
        ['recovery-identifierRecovery', 19.120874404907227],
        ['recovery-submitRecovery', 17.28883171081543],
        ['recovery-formTextMFA', 0.09237968176603317],
        ['recovery-formAttrsMFA', 11.529726028442383],
        ['recovery-headingsMFA', 1.408328652381897],
        ['recovery-layoutMFA', -7.247463703155518],
        ['recovery-buttonVerify', -6.575063705444336],
        ['recovery-inputsMFA', 0.2650938928127289],
        ['recovery-inputsOTP', -4.017107963562012],
        ['recovery-linkOTPOutlier', 7.980850696563721],
        ['recovery-headingsNewsletter', -12.690671920776367],
        ['recovery-oneVisibleField', -3.42783522605896],
        ['recovery-buttonMultiStep', -3.1602306365966797],
        ['recovery-buttonMultiAction', -6.04498291015625],
        ['recovery-headingsMultiStep', -4.56366491317749],
    ],
    bias: -9.99149227142334,
    cutoff: 0.51,
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
        usePreDetectedForm('recovery'),
    ],
};

const results$6 = {
    coeffs: [
        ['mfa-fieldsCount', -4.395323276519775],
        ['mfa-inputCount', -4.366836071014404],
        ['mfa-fieldsetCount', 6.29661226272583],
        ['mfa-textCount', -3.7175333499908447],
        ['mfa-textareaCount', -19.074966430664062],
        ['mfa-selectCount', -6.276325702667236],
        ['mfa-checkboxCount', 7.3947882652282715],
        ['mfa-radioCount', 0.029506079852581024],
        ['mfa-identifierCount', -3.7543091773986816],
        ['mfa-usernameCount', -3.7288055419921875],
        ['mfa-emailCount', -6.279892921447754],
        ['mfa-submitCount', -2.703752040863037],
        ['mfa-hasTels', 12.738661766052246],
        ['mfa-hasOAuth', -6.8818135261535645],
        ['mfa-hasCaptchas', -2.9786081314086914],
        ['mfa-hasFiles', -0.06666550040245056],
        ['mfa-hasDate', -5.914243221282959],
        ['mfa-hasNumber', 8.652779579162598],
        ['mfa-noPasswordFields', -0.2062336653470993],
        ['mfa-onePasswordField', -5.007927417755127],
        ['mfa-twoPasswordFields', -6.302960395812988],
        ['mfa-threePasswordFields', -6.068395137786865],
        ['mfa-oneIdentifierField', -4.371335506439209],
        ['mfa-twoIdentifierFields', -2.5096676349639893],
        ['mfa-threeIdentifierFields', -5.9931559562683105],
        ['mfa-hasHiddenIdentifier', -2.688936710357666],
        ['mfa-hasHiddenPassword', -5.918233394622803],
        ['mfa-autofocusedIsPassword', 6.923986911773682],
        ['mfa-visibleRatio', -3.3117010593414307],
        ['mfa-inputRatio', -2.7179715633392334],
        ['mfa-hiddenRatio', -1.0506269931793213],
        ['mfa-identifierRatio', -4.057555198669434],
        ['mfa-emailRatio', -6.27485990524292],
        ['mfa-usernameRatio', -4.962151527404785],
        ['mfa-passwordRatio', -4.719117164611816],
        ['mfa-requiredRatio', -0.44830605387687683],
        ['mfa-patternRatio', 10.24440860748291],
        ['mfa-minMaxLengthRatio', 0.22129562497138977],
        ['mfa-pageLogin', 1.395702838897705],
        ['mfa-formTextLogin', -5.959694862365723],
        ['mfa-formAttrsLogin', -2.0259475708007812],
        ['mfa-headingsLogin', -4.609623908996582],
        ['mfa-layoutLogin', 0.36382144689559937],
        ['mfa-rememberMeCheckbox', -5.9820556640625],
        ['mfa-troubleLink', -3.516339063644409],
        ['mfa-submitLogin', 0.6779336929321289],
        ['mfa-pageRegister', -4.169512748718262],
        ['mfa-formTextRegister', 0.09636176377534866],
        ['mfa-formAttrsRegister', -4.122895240783691],
        ['mfa-headingsRegister', -6.8369832038879395],
        ['mfa-layoutRegister', -3.8575539588928223],
        ['mfa-checkboxTOS', -0.039918117225170135],
        ['mfa-submitRegister', -6.018157958984375],
        ['mfa-pagePwReset', -5.962367534637451],
        ['mfa-formTextPwReset', -5.9390692710876465],
        ['mfa-formAttrsPwReset', -5.975425720214844],
        ['mfa-headingsPwReset', -6.112360954284668],
        ['mfa-layoutPwReset', -5.962128162384033],
        ['mfa-pageRecovery', 1.9350250959396362],
        ['mfa-formTextRecovery', -0.027035363018512726],
        ['mfa-formAttrsRecovery', -6.712761878967285],
        ['mfa-headingsRecovery', -6.854163646697998],
        ['mfa-layoutRecovery', 2.367116689682007],
        ['mfa-identifierRecovery', -6.103931903839111],
        ['mfa-submitRecovery', -1.4768518209457397],
        ['mfa-formTextMFA', -0.09521129727363586],
        ['mfa-formAttrsMFA', 14.832817077636719],
        ['mfa-headingsMFA', 18.034793853759766],
        ['mfa-layoutMFA', 12.321785926818848],
        ['mfa-buttonVerify', 11.216080665588379],
        ['mfa-inputsMFA', 16.53396224975586],
        ['mfa-inputsOTP', 17.735084533691406],
        ['mfa-linkOTPOutlier', -3.475614309310913],
        ['mfa-headingsNewsletter', -5.991207122802734],
        ['mfa-oneVisibleField', -1.1777009963989258],
        ['mfa-buttonMultiStep', 4.012061595916748],
        ['mfa-buttonMultiAction', -5.912703037261963],
        ['mfa-headingsMultiStep', 8.056865692138672],
    ],
    bias: -2.7823987007141113,
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
        usePreDetectedForm('mfa'),
    ],
};

const results$5 = {
    coeffs: [
        ['pw-loginScore', 10.75177001953125],
        ['pw-registerScore', -17.146486282348633],
        ['pw-pwChangeScore', -1.2392102479934692],
        ['pw-exotic', -11.802390098571777],
        ['pw-dangling', -0.03076031804084778],
        ['pw-autocompleteNew', -2.6773242950439453],
        ['pw-autocompleteCurrent', 2.7206718921661377],
        ['pw-autocompleteOff', -3.420081377029419],
        ['pw-isOnlyPassword', 8.607702255249023],
        ['pw-prevPwField', 8.711747169494629],
        ['pw-nextPwField', -3.8851373195648193],
        ['pw-attrCreate', -4.169117450714111],
        ['pw-attrCurrent', 7.98618745803833],
        ['pw-attrConfirm', -7.111163139343262],
        ['pw-attrReset', 0.07219916582107544],
        ['pw-textCreate', -6.316244602203369],
        ['pw-textCurrent', 3.2334084510803223],
        ['pw-textConfirm', -7.054976940155029],
        ['pw-textReset', -0.04725968837738037],
        ['pw-labelCreate', -7.236816883087158],
        ['pw-labelCurrent', 11.486950874328613],
        ['pw-labelConfirm', -7.028957366943359],
        ['pw-labelReset', 0.07404208183288574],
        ['pw-prevPwCreate', -8.344447135925293],
        ['pw-prevPwCurrent', -14.073869705200195],
        ['pw-prevPwConfirm', 0.02774547040462494],
        ['pw-passwordOutlier', -7.552212715148926],
        ['pw-nextPwCreate', 14.040101051330566],
        ['pw-nextPwCurrent', 0.09744825959205627],
        ['pw-nextPwConfirm', -7.48187780380249],
    ],
    bias: -7.468796730041504,
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
        usePreDetectedField('password'),
    ],
};

const results$4 = {
    coeffs: [
        ['pw[new]-loginScore', -10.597649574279785],
        ['pw[new]-registerScore', 17.983842849731445],
        ['pw[new]-pwChangeScore', 4.019167423248291],
        ['pw[new]-exotic', 21.694046020507812],
        ['pw[new]-dangling', -0.0889088585972786],
        ['pw[new]-autocompleteNew', -0.4913681149482727],
        ['pw[new]-autocompleteCurrent', -2.267260789871216],
        ['pw[new]-autocompleteOff', -3.2532460689544678],
        ['pw[new]-isOnlyPassword', -4.442958831787109],
        ['pw[new]-prevPwField', 2.38360595703125],
        ['pw[new]-nextPwField', 8.372313499450684],
        ['pw[new]-attrCreate', 1.3300259113311768],
        ['pw[new]-attrCurrent', -2.775810956954956],
        ['pw[new]-attrConfirm', 9.268539428710938],
        ['pw[new]-attrReset', -0.11055495589971542],
        ['pw[new]-textCreate', 2.9505066871643066],
        ['pw[new]-textCurrent', -2.8904058933258057],
        ['pw[new]-textConfirm', -19.227638244628906],
        ['pw[new]-textReset', -0.08743633329868317],
        ['pw[new]-labelCreate', 7.280177116394043],
        ['pw[new]-labelCurrent', -12.406343460083008],
        ['pw[new]-labelConfirm', 9.002056121826172],
        ['pw[new]-labelReset', -0.10036442428827286],
        ['pw[new]-prevPwCreate', 9.066038131713867],
        ['pw[new]-prevPwCurrent', 8.975605010986328],
        ['pw[new]-prevPwConfirm', 0.0022034645080566406],
        ['pw[new]-passwordOutlier', -28.71733856201172],
        ['pw[new]-nextPwCreate', -9.583775520324707],
        ['pw[new]-nextPwCurrent', 0.04823225736618042],
        ['pw[new]-nextPwConfirm', 8.175686836242676],
    ],
    bias: -5.281591415405273,
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
        usePreDetectedField('new-password'),
    ],
};

const results$3 = {
    coeffs: [
        ['username-autocompleteUsername', 10.189189910888672],
        ['username-autocompleteNickname', 0.047887831926345825],
        ['username-autocompleteEmail', -7.582530975341797],
        ['username-autocompleteOff', -0.594472348690033],
        ['username-attrUsername', 19.003849029541016],
        ['username-textUsername', 9.134489059448242],
        ['username-labelUsername', 18.361602783203125],
        ['username-outlierUsername', -7.339851379394531],
        ['username-loginUsername', 19.01384735107422],
    ],
    bias: -9.829115867614746,
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
        usePreDetectedField('username'),
    ],
};

const results$2 = {
    coeffs: [
        ['username[hidden]-exotic', -16.237403869628906],
        ['username[hidden]-dangling', -10.978893280029297],
        ['username[hidden]-attrUsername', 10.869028091430664],
        ['username[hidden]-attrEmail', 8.855441093444824],
        ['username[hidden]-usernameName', 7.637635231018066],
        ['username[hidden]-autocompleteUsername', 1.845189094543457],
        ['username[hidden]-hiddenEmailValue', 11.22754955291748],
        ['username[hidden]-hiddenTelValue', 3.1019139289855957],
        ['username[hidden]-hiddenUsernameValue', 1.3236868381500244],
    ],
    bias: -15.385270118713379,
    cutoff: 0.5,
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
        usePreDetectedField('username-hidden'),
    ],
};

const results$1 = {
    coeffs: [
        ['email-autocompleteUsername', 1.2508904933929443],
        ['email-autocompleteNickname', 0.05804356932640076],
        ['email-autocompleteEmail', 6.05881404876709],
        ['email-typeEmail', 15.04201602935791],
        ['email-exactAttrEmail', 13.502848625183105],
        ['email-attrEmail', 2.4297544956207275],
        ['email-textEmail', 14.59887981414795],
        ['email-labelEmail', 17.082408905029297],
        ['email-placeholderEmail', 14.762406349182129],
        ['email-attrSearch', -13.346348762512207],
        ['email-textSearch', -13.58211612701416],
    ],
    bias: -9.480331420898438,
    cutoff: 0.99,
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
        usePreDetectedField('email'),
    ],
};

const results = {
    coeffs: [
        ['otp-mfaScore', 16.945167541503906],
        ['otp-exotic', -6.558409214019775],
        ['otp-dangling', -8.9082670211792],
        ['otp-linkOTPOutlier', -13.026409149169922],
        ['otp-hasCheckboxes', 9.289191246032715],
        ['otp-hidden', -9.304394721984863],
        ['otp-required', 0.6070271134376526],
        ['otp-nameMatch', -7.950246810913086],
        ['otp-idMatch', 6.177604675292969],
        ['otp-numericMode', 10.808379173278809],
        ['otp-autofocused', 6.645445346832275],
        ['otp-tabIndex1', -0.4051257073879242],
        ['otp-patternOTP', 2.466226577758789],
        ['otp-maxLength1', 6.6401047706604],
        ['otp-maxLength5', -7.930680751800537],
        ['otp-minLength6', 16.0556640625],
        ['otp-maxLength6', 7.229676246643066],
        ['otp-maxLength20', -5.644721508026123],
        ['otp-autocompleteOTC', -0.15374663472175598],
        ['otp-autocompleteOff', -5.380837917327881],
        ['otp-prevAligned', -2.3382480144500732],
        ['otp-prevArea', 3.596942901611328],
        ['otp-nextAligned', 0.09254425764083862],
        ['otp-nextArea', 3.928192377090454],
        ['otp-attrMFA', 6.276501655578613],
        ['otp-attrOTP', 9.214783668518066],
        ['otp-attrOutlier', -7.949092864990234],
        ['otp-textMFA', 3.586887836456299],
        ['otp-textOTP', 9.274606704711914],
        ['otp-labelMFA', 12.888026237487793],
        ['otp-labelOTP', -6.427654266357422],
        ['otp-labelOutlier', -6.589134216308594],
        ['otp-wrapperOTP', 5.348502159118652],
        ['otp-wrapperOutlier', -6.03956413269043],
        ['otp-emailOutlierCount', -19.8823184967041],
    ],
    bias: -12.598294258117676,
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
        usePreDetectedField('otp'),
    ],
};

const { clusters } = clusters$1;

const CLUSTER_MAX_X_DIST = 50;

const CLUSTER_MAX_Y_DIST = 275;

const CLUSTER_ALIGNMENT_TOLERANCE = 0.05;

const CLUSTER_SANITY_CHECK_MAX_ITERATIONS = 3;

const CLUSTER_MAX_ANCHORED_PARENT_ITERATIONS = 20;

const CLUSTER_TABLE_MAX_COLS = 3;

const CLUSTER_TABLE_MAX_AREA = 15e4;

const CLUSTER_MAX_ELEMENTS = 100;

const getCommonAncestor = (elementA, elementB) => {
    if (elementA === elementB) return elementA;
    return elementA.contains(elementB)
        ? elementA
        : elementA.parentElement
        ? getCommonAncestor(elementA.parentElement, elementB)
        : elementA;
};

const findPositionedParent = (el, cache, maxIterations = CLUSTER_MAX_ANCHORED_PARENT_ITERATIONS) => {
    if (cache.some((group) => group.contains(el))) return null;
    const parent = el.parentElement;
    if (maxIterations === 0 || !parent) return null;
    const computedStyle = getComputedStyle(parent);
    const position = computedStyle.getPropertyValue('position');
    if (position === 'fixed' || position === 'absolute') {
        cache.push(parent);
        return parent;
    }
    return findPositionedParent(parent, cache, maxIterations - 1);
};

const compare = (a, b) => {
    const isFieldA = a.matches(fieldSelector) && a.matches(':not([type="submit"])');
    const isFieldB = b.matches(fieldSelector) && b.matches(':not([type="submit"])');
    const rectA = a.getBoundingClientRect();
    const rectB = b.getBoundingClientRect();
    const leftRatio = Math.abs(rectA.left / rectB.left);
    const topRatio = Math.abs(rectA.top / rectB.top);
    const xAlign = leftRatio > 1 - CLUSTER_ALIGNMENT_TOLERANCE && leftRatio < 1 + CLUSTER_ALIGNMENT_TOLERANCE;
    const yAlign = topRatio > 1 - CLUSTER_ALIGNMENT_TOLERANCE && topRatio < 1 + CLUSTER_ALIGNMENT_TOLERANCE;
    const { dx, dy } = getRectMinDistance(rectA, rectB);
    const maxDx = CLUSTER_MAX_X_DIST;
    const maxDy = CLUSTER_MAX_Y_DIST / (isFieldA && isFieldB ? 2 : 1);
    if (xAlign && yAlign) return true;
    if (xAlign && dy < maxDy) return true;
    if (yAlign && dx < maxDx) return true;
    if (dx < maxDx && dy < maxDy) return true;
    return false;
};

const getExcludedElements = (doc) => {
    const tableEls = Array.from(doc.querySelectorAll('table')).filter((table) => {
        if (table.querySelector('thead') !== null) return true;
        if (table.querySelector('table')) return false;
        const cellCount = Math.max(...Array.from(table.rows).map((row) => row.cells.length));
        if (cellCount > CLUSTER_TABLE_MAX_COLS) return true;
        const { area } = getNodeRect(table);
        if (area > CLUSTER_TABLE_MAX_AREA) return true;
        return false;
    });
    tableEls.forEach(setIgnoreType);
    return tableEls;
};

const getFormLikeClusters = (doc) => {
    const preDetected = Array.from(doc.querySelectorAll(`[${DETECTED_FORM_TYPE_ATTR}], [${DETECTED_CLUSTER_ATTR}]`));
    const forms = preDetected.concat(
        getExcludedElements(doc),
        Array.from(doc.querySelectorAll(formOfInterestSelector))
    );
    const filterFormEls = (els) => els.filter((el) => !forms.some((form) => form.contains(el)) && isVisibleField(el));
    const fields = filterFormEls(
        Array.from(doc.querySelectorAll(fieldSelector)).filter((el) => el.getAttribute('type') !== 'hidden')
    );
    const inputs = fields.filter((el) => el.matches(editableFieldSelector));
    if (inputs.length === 0) return [];
    const domGroups = Array.from(doc.querySelectorAll(clusterSelector)).filter(
        (el) => el !== document.body && el.querySelectorAll(editableFieldSelector).length > 0
    );
    const cache = [];
    const positionedEls = inputs.map((input) => findPositionedParent(input, cache)).filter((el) => Boolean(el));
    const groups = domGroups.filter((el) => !positionedEls.some((stack) => el.contains(stack))).concat(positionedEls);
    const buttons = filterFormEls(
        Array.from(document.querySelectorAll(buttonSubmitSelector)).filter(isSubmitBtnCandidate)
    );
    const candidates = Array.from(new Set([...fields, ...buttons]));
    if (candidates.length > CLUSTER_MAX_ELEMENTS) return [];
    const theClusters = clusters(candidates, 1, (a, b) => {
        const groupA = groups.find((group) => group.contains(a));
        const groupB = groups.find((group) => group.contains(b));
        if (groupA !== groupB) {
            const oneInGroup = groupA === undefined || groupB === undefined;
            const groupWrap = oneInGroup || !(groupA.contains(groupB) || groupB.contains(groupA));
            if (groupWrap) return Number.MAX_SAFE_INTEGER;
        }
        if (groupA && groupB && groupA === groupB) return 0;
        return compare(a, b) ? 0 : Number.MAX_SAFE_INTEGER;
    });
    const ancestors = theClusters
        .map((cluster) => {
            if (cluster.length === 1) {
                const start = cluster[0];
                return walkUpWhile(
                    start,
                    CLUSTER_SANITY_CHECK_MAX_ITERATIONS
                )((_, candidate) => candidate === start || candidate.childElementCount === 1);
            }
            return cluster.reduce(getCommonAncestor);
        })
        .filter((ancestor) => {
            const formWrap = forms.some((form) => form.contains(ancestor));
            const containsFields = ancestor.querySelectorAll(editableFieldSelector).length > 0;
            return !formWrap && containsFields && document.body !== ancestor && ancestor.tagName !== 'FORM';
        });
    const results = Array.from(
        new Set(
            ancestors.filter((ancestor, _, allAncestors) => {
                const ancestorWrap = allAncestors.some((el) => ancestor !== el && el.contains(ancestor));
                return !ancestorWrap;
            })
        )
    );
    results.forEach(setClusterType);
    return results;
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
                rule(dom(`${formOfInterestSelector}:not([${DETECTED_FORM_TYPE_ATTR}])`), type('form-el'), {}),
                rule(formLikeDom(), type('form-el'), {}),
                usePreDetectedCluster('form-el'),
                rule(type('form-el'), out('form-el'), {}),
                rule(type('form-el').when(isFormOfInterest), type('form').note(getFormFeatures), {}),
                rule(type('form'), out('form'), {}),
                rule(dom(fieldOfInterestSelector).when(isFieldOfInterest), type('field').note(getFieldFeature), {}),
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
    DETECTED_CLUSTER_ATTR,
    DETECTED_FIELD_TYPE_ATTR,
    DETECTED_FORM_TYPE_ATTR,
    EL_ATTRIBUTES,
    FIELD_ATTRIBUTES,
    FORM_ATTRIBUTES,
    IGNORE_ELEMENT_ATTR,
    TEXT_ATTRIBUTES,
    anchorLinkSelector,
    buttonSelector,
    buttonSubmitSelector,
    cacheContext,
    captchaSelector,
    clearVisibilityCache,
    clusterSelector,
    createInputIterator,
    editableFieldSelector,
    fieldOfInterestSelector,
    fieldSelector,
    formOfInterestSelector,
    getAttributes,
    getBaseAttributes,
    getFieldAttributes,
    getFormAttributes,
    getFormParent,
    getTextAttributes,
    getVisibilityCache,
    headingSelector,
    hiddenUsernameSelector,
    isEmailCandidate,
    isFieldOfInterest,
    isFormOfInterest,
    isOAuthCandidate,
    isSubmitBtnCandidate,
    isUserEditableField,
    isUsernameCandidate,
    isVisible,
    isVisibleEl,
    isVisibleField,
    layoutSelector,
    maybeEmail,
    maybeHiddenUsername,
    maybeOTP,
    maybePassword,
    maybeUsername,
    otpSelector,
    passwordSelector,
    rulesetMaker,
    setClusterType,
    setFormType,
    setIgnoreType,
    setInputType,
    socialSelector,
    splitFieldsByVisibility,
    trainees,
    usernameSelector,
};
