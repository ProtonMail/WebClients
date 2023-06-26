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

const MAX_FIELDS_PER_FORM = 25;

const OTP_PATTERNS = ['d*', 'd{6}', '[0-9]*', '[0-9]{6}', '([0-9]{6})|([0-9a-fA-F]{5}-?[0-9a-fA-F]{5})'];

const kUsernameSelector = ['input[type="search"][name="loginName"]', 'input[type="username"]'];

const kEmailSelector = ['input[name="email"]', 'input[id="email"]'];

const kPasswordSelector = ['input[type="text"][id="password"]'];

const formOfInterestSelector = `form:not([role="search"]):not(body > form:only-of-type)`;

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

const clusterSelector = `[role="dialog"], [role="group"], [role="form"], [id*="modal"], [class*="modal"], header, section, nav, footer, aside`;

const layoutSelector = `div, section, aside, main, nav`;

const usernameSelector = `input[type="text"], input[type=""], input:not([type]), ${kUsernameSelector.join(',')}`;

const passwordSelector = `input[type="password"], ${kPasswordSelector.join(',')}`;

const hiddenUsernameSelector = 'input[type="email"], input[type="text"], input[type="hidden"]';

const otpSelector = 'input[type="tel"], input[type="number"], input[type="text"], input:not([type])';

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
            if ((rect.width === 0 || rect.height === 0) && elementStyle.overflow === 'hidden') return false;
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
        if (el.offsetHeight === 0 || el.offsetHeight === 0) return false;
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
    return [field, field.parentElement].every((el) =>
        quickVisibilityCheck(el, {
            minHeight: MIN_FIELD_HEIGHT,
            minWidth: MIN_FIELD_WIDTH,
        })
    );
};

const isVisibleEl = (el) =>
    quickVisibilityCheck(el, {
        minHeight: 0,
        minWidth: 0,
    });

const isFormOfInterest = (fnodeOrEl) => {
    const form = 'element' in fnodeOrEl ? fnodeOrEl.element : fnodeOrEl;
    if (form.getAttribute(DETECTED_FORM_TYPE_ATTR) !== null) return false;
    if (
        form.tagName !== 'FORM' &&
        !isVisible(form, {
            opacity: true,
        })
    )
        return false;
    const inputs = Array.from(form.querySelectorAll(editableFieldSelector)).filter((field) => !field.disabled);
    if (inputs.length > MAX_FIELDS_PER_FORM) return false;
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
    return sanitizeString(headings.map((el) => el.innerText).join(''));
};

const isFieldOfInterest = (fnodeOrEl) => {
    const field = 'element' in fnodeOrEl ? fnodeOrEl.element : fnodeOrEl;
    if (field.getAttribute(DETECTED_FIELD_TYPE_ATTR) !== null) return false;
    if (field.getAttribute(IGNORE_ELEMENT_ATTR) !== null) return false;
    if (field.matches(`[${IGNORE_ELEMENT_ATTR}] *`)) return false;
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
        ['login-fieldsCount', 1.1355623006820679],
        ['login-inputCount', 4.763380527496338],
        ['login-fieldsetCount', -33.251041412353516],
        ['login-textCount', -19.160554885864258],
        ['login-textareaCount', -6.608048915863037],
        ['login-selectCount', -8.106895446777344],
        ['login-checkboxCount', 8.493768692016602],
        ['login-radioCount', -0.07074849307537079],
        ['login-identifierCount', -9.053391456604004],
        ['login-usernameCount', 9.402348518371582],
        ['login-emailCount', -21.560070037841797],
        ['login-submitCount', -17.038145065307617],
        ['login-hasTels', -2.1212921142578125],
        ['login-hasOAuth', 5.133286952972412],
        ['login-hasCaptchas', 0.7126177549362183],
        ['login-hasFiles', -0.01080390065908432],
        ['login-hasDate', -20.922334671020508],
        ['login-hasNumber', -5.949841022491455],
        ['login-noPasswordFields', -11.414291381835938],
        ['login-onePasswordField', 4.838042736053467],
        ['login-twoPasswordFields', -15.449756622314453],
        ['login-threePasswordFields', -16.682781219482422],
        ['login-oneIdentifierField', -4.652057647705078],
        ['login-twoIdentifierFields', -21.46659278869629],
        ['login-threeIdentifierFields', -6.950486183166504],
        ['login-hasHiddenIdentifier', -4.416884422302246],
        ['login-hasHiddenPassword', 31.306726455688477],
        ['login-autofocusedIsPassword', 12.5630464553833],
        ['login-visibleRatio', 5.648737907409668],
        ['login-inputRatio', 2.139577627182007],
        ['login-hiddenRatio', 14.567235946655273],
        ['login-identifierRatio', 21.083295822143555],
        ['login-emailRatio', 7.74742317199707],
        ['login-usernameRatio', -12.420759201049805],
        ['login-passwordRatio', 8.15035629272461],
        ['login-requiredRatio', 3.470599412918091],
        ['login-patternRatio', -10.074667930603027],
        ['login-minMaxLengthRatio', 3.9550256729125977],
        ['login-pageLogin', 11.739165306091309],
        ['login-formTextLogin', 8.321688652038574],
        ['login-formAttrsLogin', 11.091041564941406],
        ['login-headingsLogin', 23.821239471435547],
        ['login-layoutLogin', -0.4947270452976227],
        ['login-rememberMeCheckbox', 8.463838577270508],
        ['login-troubleLink', 20.825897216796875],
        ['login-submitLogin', 11.017196655273438],
        ['login-pageRegister', -11.50528335571289],
        ['login-formTextRegister', 0.05285073071718216],
        ['login-formAttrsRegister', -12.129691123962402],
        ['login-headingsRegister', -13.444784164428711],
        ['login-layoutRegister', 4.403345108032227],
        ['login-checkboxTOS', 0.01677914708852768],
        ['login-submitRegister', -12.25086498260498],
        ['login-pagePwReset', -11.366806983947754],
        ['login-formTextPwReset', -6.113980293273926],
        ['login-formAttrsPwReset', -12.215126991271973],
        ['login-headingsPwReset', -13.93960952758789],
        ['login-layoutPwReset', -6.1615800857543945],
        ['login-pageRecovery', -11.398153305053711],
        ['login-formTextRecovery', 0.06830518692731857],
        ['login-formAttrsRecovery', -22.96946144104004],
        ['login-headingsRecovery', -0.6034258008003235],
        ['login-layoutRecovery', -1.4213597774505615],
        ['login-identifierRecovery', -0.5686647295951843],
        ['login-submitRecovery', -7.136401653289795],
        ['login-formTextMFA', -0.02695503830909729],
        ['login-formAttrsMFA', -4.949987888336182],
        ['login-headingsMFA', -12.318875312805176],
        ['login-layoutMFA', -4.275561809539795],
        ['login-buttonVerify', -9.405313491821289],
        ['login-inputsMFA', -19.930252075195312],
        ['login-inputsOTP', -11.684473037719727],
        ['login-linkOTPOutlier', -3.4157752990722656],
        ['login-headingsNewsletter', -10.050466537475586],
        ['login-oneVisibleField', -6.828252792358398],
        ['login-buttonMultiStep', 2.696187973022461],
        ['login-buttonMultiAction', 12.980491638183594],
        ['login-headingsMultiStep', -21.327739715576172],
    ],
    bias: -6.191012859344482,
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
        ['pw-change-fieldsCount', -1.8905194997787476],
        ['pw-change-inputCount', -1.4105281829833984],
        ['pw-change-fieldsetCount', -5.948991775512695],
        ['pw-change-textCount', -5.993552207946777],
        ['pw-change-textareaCount', -6.047896862030029],
        ['pw-change-selectCount', -6.005041122436523],
        ['pw-change-checkboxCount', -6.009345531463623],
        ['pw-change-radioCount', 0.07432200759649277],
        ['pw-change-identifierCount', -5.599872589111328],
        ['pw-change-usernameCount', -6.0182671546936035],
        ['pw-change-emailCount', -4.061913967132568],
        ['pw-change-submitCount', -2.633451223373413],
        ['pw-change-hasTels', -6.114523410797119],
        ['pw-change-hasOAuth', -6.040955066680908],
        ['pw-change-hasCaptchas', -5.903961658477783],
        ['pw-change-hasFiles', -0.052064232528209686],
        ['pw-change-hasDate', -5.937105178833008],
        ['pw-change-hasNumber', -9.45037841796875],
        ['pw-change-noPasswordFields', -5.908724308013916],
        ['pw-change-onePasswordField', -6.064635276794434],
        ['pw-change-twoPasswordFields', 12.991647720336914],
        ['pw-change-threePasswordFields', 21.049665451049805],
        ['pw-change-oneIdentifierField', -6.0060319900512695],
        ['pw-change-twoIdentifierFields', -5.982127666473389],
        ['pw-change-threeIdentifierFields', 11.584372520446777],
        ['pw-change-hasHiddenIdentifier', -0.542025089263916],
        ['pw-change-hasHiddenPassword', -5.96303653717041],
        ['pw-change-autofocusedIsPassword', 20.017961502075195],
        ['pw-change-visibleRatio', -3.514214038848877],
        ['pw-change-inputRatio', -3.562633514404297],
        ['pw-change-hiddenRatio', -4.119080543518066],
        ['pw-change-identifierRatio', -5.380735397338867],
        ['pw-change-emailRatio', -5.199976921081543],
        ['pw-change-usernameRatio', -6.0368218421936035],
        ['pw-change-passwordRatio', 4.331997394561768],
        ['pw-change-requiredRatio', -4.229219436645508],
        ['pw-change-patternRatio', 2.8192896842956543],
        ['pw-change-minMaxLengthRatio', -2.6695737838745117],
        ['pw-change-pageLogin', -5.927186965942383],
        ['pw-change-formTextLogin', -5.893957138061523],
        ['pw-change-formAttrsLogin', -6.038341999053955],
        ['pw-change-headingsLogin', -6.097726821899414],
        ['pw-change-layoutLogin', -5.914788246154785],
        ['pw-change-rememberMeCheckbox', -6.040974140167236],
        ['pw-change-troubleLink', -3.639340400695801],
        ['pw-change-submitLogin', -5.911762714385986],
        ['pw-change-pageRegister', -6.093072414398193],
        ['pw-change-formTextRegister', -0.00032401084899902344],
        ['pw-change-formAttrsRegister', -6.018734931945801],
        ['pw-change-headingsRegister', -6.404661655426025],
        ['pw-change-layoutRegister', -6.114635467529297],
        ['pw-change-checkboxTOS', -0.053598012775182724],
        ['pw-change-submitRegister', -6.299765110015869],
        ['pw-change-pagePwReset', 17.607240676879883],
        ['pw-change-formTextPwReset', 17.982526779174805],
        ['pw-change-formAttrsPwReset', 2.979520559310913],
        ['pw-change-headingsPwReset', 18.144865036010742],
        ['pw-change-layoutPwReset', 14.529269218444824],
        ['pw-change-pageRecovery', -5.9573493003845215],
        ['pw-change-formTextRecovery', 0.07011238485574722],
        ['pw-change-formAttrsRecovery', -6.049671173095703],
        ['pw-change-headingsRecovery', -6.0072102546691895],
        ['pw-change-layoutRecovery', -4.326732158660889],
        ['pw-change-identifierRecovery', -5.905726432800293],
        ['pw-change-submitRecovery', 0.5093019008636475],
        ['pw-change-formTextMFA', -0.11052067577838898],
        ['pw-change-formAttrsMFA', -6.086422920227051],
        ['pw-change-headingsMFA', -6.044895648956299],
        ['pw-change-layoutMFA', -6.0225677490234375],
        ['pw-change-buttonVerify', -6.093196392059326],
        ['pw-change-inputsMFA', -6.087519645690918],
        ['pw-change-inputsOTP', -5.946453094482422],
        ['pw-change-linkOTPOutlier', -6.448505878448486],
        ['pw-change-headingsNewsletter', -5.963879585266113],
        ['pw-change-oneVisibleField', -5.9260573387146],
        ['pw-change-buttonMultiStep', -6.102262496948242],
        ['pw-change-buttonMultiAction', -5.993837356567383],
        ['pw-change-headingsMultiStep', -5.937338829040527],
    ],
    bias: -3.803746223449707,
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
        ['register-fieldsCount', 8.538492202758789],
        ['register-inputCount', 9.256195068359375],
        ['register-fieldsetCount', 5.276212692260742],
        ['register-textCount', -2.0993924140930176],
        ['register-textareaCount', -11.914311408996582],
        ['register-selectCount', 2.2492523193359375],
        ['register-checkboxCount', -6.354204177856445],
        ['register-radioCount', 0.0634632483124733],
        ['register-identifierCount', 8.883319854736328],
        ['register-usernameCount', -3.7073254585266113],
        ['register-emailCount', 3.7844886779785156],
        ['register-submitCount', -6.5437846183776855],
        ['register-hasTels', 22.647485733032227],
        ['register-hasOAuth', 5.4285125732421875],
        ['register-hasCaptchas', 5.672909736633301],
        ['register-hasFiles', 0.07270433753728867],
        ['register-hasDate', 10.242889404296875],
        ['register-hasNumber', 43.14438247680664],
        ['register-noPasswordFields', -5.479557514190674],
        ['register-onePasswordField', 3.4993395805358887],
        ['register-twoPasswordFields', 10.074254989624023],
        ['register-threePasswordFields', -6.203159809112549],
        ['register-oneIdentifierField', 4.607091426849365],
        ['register-twoIdentifierFields', 17.827486038208008],
        ['register-threeIdentifierFields', 10.787399291992188],
        ['register-hasHiddenIdentifier', 1.7350624799728394],
        ['register-hasHiddenPassword', 2.8850839138031006],
        ['register-autofocusedIsPassword', -8.840317726135254],
        ['register-visibleRatio', -10.401057243347168],
        ['register-inputRatio', -8.354260444641113],
        ['register-hiddenRatio', -12.908157348632812],
        ['register-identifierRatio', 12.94273567199707],
        ['register-emailRatio', 1.6133774518966675],
        ['register-usernameRatio', -21.488733291625977],
        ['register-passwordRatio', -6.9523515701293945],
        ['register-requiredRatio', -1.6470621824264526],
        ['register-patternRatio', -3.089524984359741],
        ['register-minMaxLengthRatio', -8.433477401733398],
        ['register-pageLogin', -6.4498162269592285],
        ['register-formTextLogin', -6.290961265563965],
        ['register-formAttrsLogin', -3.2188055515289307],
        ['register-headingsLogin', -18.172836303710938],
        ['register-layoutLogin', 3.5392520427703857],
        ['register-rememberMeCheckbox', -6.262150764465332],
        ['register-troubleLink', -18.902700424194336],
        ['register-submitLogin', -7.1879353523254395],
        ['register-pageRegister', -3.24295711517334],
        ['register-formTextRegister', 0.08915739506483078],
        ['register-formAttrsRegister', 23.354434967041016],
        ['register-headingsRegister', 3.0757927894592285],
        ['register-layoutRegister', -5.275457382202148],
        ['register-checkboxTOS', -0.04915614426136017],
        ['register-submitRegister', 19.78207015991211],
        ['register-pagePwReset', -6.193929672241211],
        ['register-formTextPwReset', -5.961477756500244],
        ['register-formAttrsPwReset', -6.102858543395996],
        ['register-headingsPwReset', -12.947494506835938],
        ['register-layoutPwReset', -11.264128684997559],
        ['register-pageRecovery', -25.809978485107422],
        ['register-formTextRecovery', 0.08481358736753464],
        ['register-formAttrsRecovery', -6.983564853668213],
        ['register-headingsRecovery', -29.784832000732422],
        ['register-layoutRecovery', -8.656810760498047],
        ['register-identifierRecovery', -27.414989471435547],
        ['register-submitRecovery', -26.473176956176758],
        ['register-formTextMFA', 0.11115720123052597],
        ['register-formAttrsMFA', 6.889259338378906],
        ['register-headingsMFA', -25.508861541748047],
        ['register-layoutMFA', -0.19628693163394928],
        ['register-buttonVerify', 17.909616470336914],
        ['register-inputsMFA', -21.2530574798584],
        ['register-inputsOTP', -25.613998413085938],
        ['register-linkOTPOutlier', 0.28036439418792725],
        ['register-headingsNewsletter', -31.763275146484375],
        ['register-oneVisibleField', -6.5972514152526855],
        ['register-buttonMultiStep', 8.908740043640137],
        ['register-buttonMultiAction', 0.8021572232246399],
        ['register-headingsMultiStep', 34.52647399902344],
    ],
    bias: -0.3610994815826416,
    cutoff: 0.48,
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
        ['recovery-fieldsCount', -3.8813884258270264],
        ['recovery-inputCount', -4.354074001312256],
        ['recovery-fieldsetCount', 3.6742024421691895],
        ['recovery-textCount', 17.554536819458008],
        ['recovery-textareaCount', -26.80936050415039],
        ['recovery-selectCount', -12.35957145690918],
        ['recovery-checkboxCount', -5.95285701751709],
        ['recovery-radioCount', 0.11049912124872208],
        ['recovery-identifierCount', 5.366873741149902],
        ['recovery-usernameCount', 24.88453483581543],
        ['recovery-emailCount', -7.190375328063965],
        ['recovery-submitCount', -1.5797189474105835],
        ['recovery-hasTels', -9.686944007873535],
        ['recovery-hasOAuth', -4.5214715003967285],
        ['recovery-hasCaptchas', -0.7565193772315979],
        ['recovery-hasFiles', 0.0013943761587142944],
        ['recovery-hasDate', -6.015322208404541],
        ['recovery-hasNumber', -5.967057704925537],
        ['recovery-noPasswordFields', -2.695310592651367],
        ['recovery-onePasswordField', -22.74993324279785],
        ['recovery-twoPasswordFields', -6.623157978057861],
        ['recovery-threePasswordFields', -14.37044620513916],
        ['recovery-oneIdentifierField', 4.982587814331055],
        ['recovery-twoIdentifierFields', 12.907966613769531],
        ['recovery-threeIdentifierFields', -6.5119500160217285],
        ['recovery-hasHiddenIdentifier', -9.686955451965332],
        ['recovery-hasHiddenPassword', -17.20008659362793],
        ['recovery-autofocusedIsPassword', -6.072747707366943],
        ['recovery-visibleRatio', -0.39977309107780457],
        ['recovery-inputRatio', -10.14619255065918],
        ['recovery-hiddenRatio', 3.339195728302002],
        ['recovery-identifierRatio', 7.569453239440918],
        ['recovery-emailRatio', 1.4429242610931396],
        ['recovery-usernameRatio', -0.7824577689170837],
        ['recovery-passwordRatio', -18.022869110107422],
        ['recovery-requiredRatio', 4.548587799072266],
        ['recovery-patternRatio', -14.460312843322754],
        ['recovery-minMaxLengthRatio', 4.336585521697998],
        ['recovery-pageLogin', -3.172060489654541],
        ['recovery-formTextLogin', -5.973512649536133],
        ['recovery-formAttrsLogin', -1.8400764465332031],
        ['recovery-headingsLogin', -5.64328145980835],
        ['recovery-layoutLogin', -18.80329132080078],
        ['recovery-rememberMeCheckbox', -5.945774078369141],
        ['recovery-troubleLink', -1.8992713689804077],
        ['recovery-submitLogin', -9.298649787902832],
        ['recovery-pageRegister', -8.223359107971191],
        ['recovery-formTextRegister', 0.04321108013391495],
        ['recovery-formAttrsRegister', -9.046728134155273],
        ['recovery-headingsRegister', -4.83827018737793],
        ['recovery-layoutRegister', -8.593584060668945],
        ['recovery-checkboxTOS', -0.11209563910961151],
        ['recovery-submitRegister', -7.497485160827637],
        ['recovery-pagePwReset', 7.995177268981934],
        ['recovery-formTextPwReset', -7.52202033996582],
        ['recovery-formAttrsPwReset', 10.152557373046875],
        ['recovery-headingsPwReset', 14.36906909942627],
        ['recovery-layoutPwReset', 4.560173034667969],
        ['recovery-pageRecovery', 21.182706832885742],
        ['recovery-formTextRecovery', -0.002993538975715637],
        ['recovery-formAttrsRecovery', 28.624706268310547],
        ['recovery-headingsRecovery', -2.0102055072784424],
        ['recovery-layoutRecovery', -1.365278959274292],
        ['recovery-identifierRecovery', 17.44461441040039],
        ['recovery-submitRecovery', 14.276229858398438],
        ['recovery-formTextMFA', -0.06085530295968056],
        ['recovery-formAttrsMFA', 18.279815673828125],
        ['recovery-headingsMFA', 5.286545753479004],
        ['recovery-layoutMFA', -6.266842365264893],
        ['recovery-buttonVerify', -6.794367790222168],
        ['recovery-inputsMFA', 1.5568634271621704],
        ['recovery-inputsOTP', -11.623855590820312],
        ['recovery-linkOTPOutlier', 9.66189956665039],
        ['recovery-headingsNewsletter', -13.116776466369629],
        ['recovery-oneVisibleField', 0.7249116897583008],
        ['recovery-buttonMultiStep', -2.5024545192718506],
        ['recovery-buttonMultiAction', -6.217154502868652],
        ['recovery-headingsMultiStep', -6.0256805419921875],
    ],
    bias: -11.931768417358398,
    cutoff: 0.5,
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
        ['mfa-fieldsCount', -4.562154293060303],
        ['mfa-inputCount', -4.738060474395752],
        ['mfa-fieldsetCount', 5.815161228179932],
        ['mfa-textCount', -2.1479413509368896],
        ['mfa-textareaCount', -7.507555961608887],
        ['mfa-selectCount', -6.073482990264893],
        ['mfa-checkboxCount', -5.9832763671875],
        ['mfa-radioCount', 0.10457361489534378],
        ['mfa-identifierCount', -4.318046569824219],
        ['mfa-usernameCount', -4.912649154663086],
        ['mfa-emailCount', -6.8586273193359375],
        ['mfa-submitCount', -2.7004194259643555],
        ['mfa-hasTels', 12.524815559387207],
        ['mfa-hasOAuth', -6.449890613555908],
        ['mfa-hasCaptchas', -2.020270586013794],
        ['mfa-hasFiles', -0.10789000988006592],
        ['mfa-hasDate', -6.100653648376465],
        ['mfa-hasNumber', 8.285893440246582],
        ['mfa-noPasswordFields', 0.3770389258861542],
        ['mfa-onePasswordField', -6.164493083953857],
        ['mfa-twoPasswordFields', -8.069938659667969],
        ['mfa-threePasswordFields', -5.955802917480469],
        ['mfa-oneIdentifierField', -4.501762390136719],
        ['mfa-twoIdentifierFields', -6.062448024749756],
        ['mfa-threeIdentifierFields', -5.964874267578125],
        ['mfa-hasHiddenIdentifier', -4.614016056060791],
        ['mfa-hasHiddenPassword', -2.370753526687622],
        ['mfa-autofocusedIsPassword', 7.290717124938965],
        ['mfa-visibleRatio', -4.963132381439209],
        ['mfa-inputRatio', -2.6257147789001465],
        ['mfa-hiddenRatio', 2.187129497528076],
        ['mfa-identifierRatio', -4.272348403930664],
        ['mfa-emailRatio', -6.803333759307861],
        ['mfa-usernameRatio', -5.426384925842285],
        ['mfa-passwordRatio', -5.573799133300781],
        ['mfa-requiredRatio', 7.763760566711426],
        ['mfa-patternRatio', 9.379803657531738],
        ['mfa-minMaxLengthRatio', 0.06798785924911499],
        ['mfa-pageLogin', 4.904084205627441],
        ['mfa-formTextLogin', -5.959112167358398],
        ['mfa-formAttrsLogin', -3.275479316711426],
        ['mfa-headingsLogin', -3.6943185329437256],
        ['mfa-layoutLogin', -1.226912260055542],
        ['mfa-rememberMeCheckbox', -6.097424030303955],
        ['mfa-troubleLink', -6.070406913757324],
        ['mfa-submitLogin', 0.544768214225769],
        ['mfa-pageRegister', -4.381555080413818],
        ['mfa-formTextRegister', -0.04896632581949234],
        ['mfa-formAttrsRegister', -4.07174825668335],
        ['mfa-headingsRegister', -7.524143218994141],
        ['mfa-layoutRegister', -4.359222888946533],
        ['mfa-checkboxTOS', 0.08780232816934586],
        ['mfa-submitRegister', -6.030905723571777],
        ['mfa-pagePwReset', -6.0256452560424805],
        ['mfa-formTextPwReset', -5.9067888259887695],
        ['mfa-formAttrsPwReset', -5.961642265319824],
        ['mfa-headingsPwReset', -5.927562236785889],
        ['mfa-layoutPwReset', -5.900778770446777],
        ['mfa-pageRecovery', 0.6008087396621704],
        ['mfa-formTextRecovery', 0.07413103431463242],
        ['mfa-formAttrsRecovery', -7.343374252319336],
        ['mfa-headingsRecovery', -7.505827903747559],
        ['mfa-layoutRecovery', 1.637089729309082],
        ['mfa-identifierRecovery', -5.9346232414245605],
        ['mfa-submitRecovery', -1.9953685998916626],
        ['mfa-formTextMFA', -0.07797364890575409],
        ['mfa-formAttrsMFA', 14.404839515686035],
        ['mfa-headingsMFA', 16.151775360107422],
        ['mfa-layoutMFA', 11.830810546875],
        ['mfa-buttonVerify', 16.200763702392578],
        ['mfa-inputsMFA', 15.874187469482422],
        ['mfa-inputsOTP', 18.77117347717285],
        ['mfa-linkOTPOutlier', -2.157121181488037],
        ['mfa-headingsNewsletter', -6.042220115661621],
        ['mfa-oneVisibleField', -1.298577904701233],
        ['mfa-buttonMultiStep', 2.16080641746521],
        ['mfa-buttonMultiAction', -6.041523456573486],
        ['mfa-headingsMultiStep', 8.99375057220459],
    ],
    bias: -2.9362802505493164,
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
        ['pw-loginScore', 10.641457557678223],
        ['pw-registerScore', -12.294971466064453],
        ['pw-pwChangeScore', -5.858157157897949],
        ['pw-exotic', -13.886439323425293],
        ['pw-dangling', 0.08179745078086853],
        ['pw-autocompleteNew', -2.338120222091675],
        ['pw-autocompleteCurrent', 6.17539119720459],
        ['pw-autocompleteOff', -1.4191677570343018],
        ['pw-isOnlyPassword', 4.448286533355713],
        ['pw-prevPwField', -0.857531726360321],
        ['pw-nextPwField', -1.3053454160690308],
        ['pw-attrCreate', -1.1936423778533936],
        ['pw-attrCurrent', 2.3205888271331787],
        ['pw-attrConfirm', -6.280523777008057],
        ['pw-attrReset', 0.11766806244850159],
        ['pw-textCreate', -1.9658623933792114],
        ['pw-textCurrent', 6.196298599243164],
        ['pw-textConfirm', -6.213725566864014],
        ['pw-textReset', 0.13439226150512695],
        ['pw-labelCreate', -6.7388153076171875],
        ['pw-labelCurrent', 8.916902542114258],
        ['pw-labelConfirm', -6.044126033782959],
        ['pw-labelReset', 0.02049925923347473],
        ['pw-prevPwCreate', -6.254580020904541],
        ['pw-prevPwCurrent', -8.324673652648926],
        ['pw-prevPwConfirm', -0.03859192132949829],
        ['pw-passwordOutlier', -6.4049072265625],
        ['pw-nextPwCreate', 8.662205696105957],
        ['pw-nextPwCurrent', 0.0804552435874939],
        ['pw-nextPwConfirm', -6.56833553314209],
    ],
    bias: -0.8496546745300293,
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
        ['pw[new]-loginScore', -12.818286895751953],
        ['pw[new]-registerScore', 14.391039848327637],
        ['pw[new]-pwChangeScore', 3.8583357334136963],
        ['pw[new]-exotic', 14.944093704223633],
        ['pw[new]-dangling', 0.01147034764289856],
        ['pw[new]-autocompleteNew', 1.937711477279663],
        ['pw[new]-autocompleteCurrent', -6.303101539611816],
        ['pw[new]-autocompleteOff', 0.05009519308805466],
        ['pw[new]-isOnlyPassword', -1.8822622299194336],
        ['pw[new]-prevPwField', -0.9273902177810669],
        ['pw[new]-nextPwField', 10.212031364440918],
        ['pw[new]-attrCreate', 2.8045084476470947],
        ['pw[new]-attrCurrent', -3.1503069400787354],
        ['pw[new]-attrConfirm', 7.030887603759766],
        ['pw[new]-attrReset', 0.15765908360481262],
        ['pw[new]-textCreate', 0.34003350138664246],
        ['pw[new]-textCurrent', -6.781454563140869],
        ['pw[new]-textConfirm', -14.910846710205078],
        ['pw[new]-textReset', -0.020956680178642273],
        ['pw[new]-labelCreate', 6.481372833251953],
        ['pw[new]-labelCurrent', -11.452016830444336],
        ['pw[new]-labelConfirm', 6.575648784637451],
        ['pw[new]-labelReset', -0.006697759032249451],
        ['pw[new]-prevPwCreate', 10.976064682006836],
        ['pw[new]-prevPwCurrent', 6.388694763183594],
        ['pw[new]-prevPwConfirm', -0.02127930521965027],
        ['pw[new]-passwordOutlier', -27.94105339050293],
        ['pw[new]-nextPwCreate', -7.970671653747559],
        ['pw[new]-nextPwCurrent', 0.0712692141532898],
        ['pw[new]-nextPwConfirm', 6.354267120361328],
    ],
    bias: -3.577942371368408,
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
        ['username-autocompleteUsername', 9.451613426208496],
        ['username-autocompleteNickname', 0.1632990539073944],
        ['username-autocompleteEmail', -7.572577953338623],
        ['username-autocompleteOff', -0.5966719388961792],
        ['username-attrUsername', 18.789812088012695],
        ['username-textUsername', 9.346637725830078],
        ['username-labelUsername', 18.075145721435547],
        ['username-outlierUsername', -7.24393892288208],
        ['username-loginUsername', 18.600061416625977],
    ],
    bias: -9.685571670532227,
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
        ['username[hidden]-exotic', -14.28313159942627],
        ['username[hidden]-dangling', -8.845052719116211],
        ['username[hidden]-attrUsername', 10.007988929748535],
        ['username[hidden]-attrEmail', 8.135770797729492],
        ['username[hidden]-usernameName', 7.19795036315918],
        ['username[hidden]-autocompleteUsername', 2.159972667694092],
        ['username[hidden]-hiddenEmailValue', 10.909231185913086],
        ['username[hidden]-hiddenTelValue', 3.1017119884490967],
        ['username[hidden]-hiddenUsernameValue', 1.1918127536773682],
    ],
    bias: -14.698594093322754,
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
        ['email-autocompleteUsername', 1.3386619091033936],
        ['email-autocompleteNickname', 0.030624866485595703],
        ['email-autocompleteEmail', 6.226199150085449],
        ['email-typeEmail', 14.801067352294922],
        ['email-exactAttrEmail', 13.285578727722168],
        ['email-attrEmail', 2.1859824657440186],
        ['email-textEmail', 14.388238906860352],
        ['email-labelEmail', 16.965810775756836],
        ['email-placeholderEmail', 15.240095138549805],
        ['email-attrSearch', -13.434276580810547],
        ['email-textSearch', -13.587753295898438],
    ],
    bias: -9.35390853881836,
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
        ['otp-mfaScore', 17.035140991210938],
        ['otp-exotic', -6.434988498687744],
        ['otp-dangling', -8.661128044128418],
        ['otp-linkOTPOutlier', -13.309165954589844],
        ['otp-hasCheckboxes', -0.15255984663963318],
        ['otp-hidden', -9.42695426940918],
        ['otp-required', 0.6906564831733704],
        ['otp-nameMatch', -7.9712233543396],
        ['otp-idMatch', 5.880772590637207],
        ['otp-numericMode', 10.771245002746582],
        ['otp-autofocused', 6.667666435241699],
        ['otp-tabIndex1', -0.4183298647403717],
        ['otp-patternOTP', 2.565016746520996],
        ['otp-maxLength1', 6.846598148345947],
        ['otp-maxLength5', -7.520528316497803],
        ['otp-minLength6', 15.481284141540527],
        ['otp-maxLength6', 7.481283664703369],
        ['otp-maxLength20', -5.349724769592285],
        ['otp-autocompleteOTC', 0.00940607488155365],
        ['otp-autocompleteOff', -5.283377647399902],
        ['otp-prevAligned', 1.0224826335906982],
        ['otp-prevArea', 3.2456870079040527],
        ['otp-nextAligned', 0.153750479221344],
        ['otp-nextArea', 3.583932399749756],
        ['otp-attrMFA', 6.238754749298096],
        ['otp-attrOTP', 10.070791244506836],
        ['otp-attrOutlier', -8.079120635986328],
        ['otp-textMFA', 6.965402603149414],
        ['otp-textOTP', 8.90609073638916],
        ['otp-labelMFA', 13.188558578491211],
        ['otp-labelOTP', -6.522705554962158],
        ['otp-labelOutlier', -6.539332389831543],
        ['otp-wrapperOTP', 4.760901927947998],
        ['otp-wrapperOutlier', -6.1014180183410645],
        ['otp-emailOutlierCount', -19.811132431030273],
    ],
    bias: -12.716947555541992,
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

const CLUSTER_TABLE_MAX_AREA = 1e5;

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
    const exclude = Array.from(doc.querySelectorAll('table')).filter((table) => {
        if (table.querySelector('thead') !== null) return true;
        if (table.querySelector('table')) return false;
        const cellCount = Math.max(...Array.from(table.rows).map((row) => row.cells.length));
        if (cellCount > CLUSTER_TABLE_MAX_COLS) return true;
        const { area } = getNodeRect(table);
        if (area > CLUSTER_TABLE_MAX_AREA) return true;
        return false;
    });
    exclude.forEach(setIgnoreType);
    return exclude;
};

const getFormLikeClusters = (doc) => {
    const preDetected = Array.from(doc.querySelectorAll(`[${DETECTED_FORM_TYPE_ATTR}], [${DETECTED_CLUSTER_ATTR}]`));
    const forms = preDetected.concat(
        getExcludedElements(doc),
        Array.from(doc.querySelectorAll(formOfInterestSelector))
    );
    const filterFormEls = (els) => els.filter((el) => !forms.some((form) => form.contains(el)) && isVisibleField(el));
    const fields = filterFormEls(Array.from(doc.querySelectorAll(fieldSelector)));
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
            const formWrap = forms.some((form) => ancestor.contains(form) || form.contains(ancestor));
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
