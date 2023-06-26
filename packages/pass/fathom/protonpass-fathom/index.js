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

const MAX_INPUTS_PER_FORM = 40;

const MAX_FIELDS_PER_FORM = 60;

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
    const fieldText = getNodeText(field);
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
        ['login-fieldsCount', 3.476411819458008],
        ['login-inputCount', 9.742335319519043],
        ['login-fieldsetCount', -49.48378372192383],
        ['login-textCount', -27.157737731933594],
        ['login-textareaCount', -6.176124095916748],
        ['login-selectCount', -9.574578285217285],
        ['login-checkboxCount', 9.387925148010254],
        ['login-radioCount', 0.04433304816484451],
        ['login-identifierCount', -7.756174087524414],
        ['login-usernameCount', 12.353835105895996],
        ['login-emailCount', -25.6317195892334],
        ['login-submitCount', -23.124040603637695],
        ['login-hasTels', -5.433887004852295],
        ['login-hasOAuth', -0.051682084798812866],
        ['login-hasCaptchas', 3.0332224369049072],
        ['login-hasFiles', -0.038495831191539764],
        ['login-hasDate', -16.814659118652344],
        ['login-hasNumber', -5.942246437072754],
        ['login-noPasswordFields', -9.185909271240234],
        ['login-onePasswordField', 3.704906702041626],
        ['login-twoPasswordFields', -15.684489250183105],
        ['login-threePasswordFields', -19.15687370300293],
        ['login-oneIdentifierField', -3.8707199096679688],
        ['login-twoIdentifierFields', -19.08070182800293],
        ['login-threeIdentifierFields', -8.352278709411621],
        ['login-hasHiddenIdentifier', -6.056629657745361],
        ['login-hasHiddenPassword', 28.033187866210938],
        ['login-autofocusedIsPassword', 8.556496620178223],
        ['login-visibleRatio', 0.07693547755479813],
        ['login-inputRatio', 3.4481465816497803],
        ['login-hiddenRatio', 9.5711669921875],
        ['login-identifierRatio', 23.35917091369629],
        ['login-emailRatio', 5.260573387145996],
        ['login-usernameRatio', -10.19013786315918],
        ['login-passwordRatio', 10.925497055053711],
        ['login-requiredRatio', 5.131502628326416],
        ['login-patternRatio', -4.572601795196533],
        ['login-minMaxLengthRatio', 6.3657636642456055],
        ['login-pageLogin', 13.619114875793457],
        ['login-formTextLogin', 8.318351745605469],
        ['login-formAttrsLogin', 6.76931095123291],
        ['login-headingsLogin', 24.745201110839844],
        ['login-layoutLogin', -0.7043539881706238],
        ['login-rememberMeCheckbox', 9.2151460647583],
        ['login-troubleLink', 19.628786087036133],
        ['login-submitLogin', 13.457365036010742],
        ['login-pageRegister', -2.5036535263061523],
        ['login-formTextRegister', -0.02814662456512451],
        ['login-formAttrsRegister', -19.560312271118164],
        ['login-headingsRegister', -13.97872543334961],
        ['login-layoutRegister', 6.494992256164551],
        ['login-checkboxTOS', -0.015684299170970917],
        ['login-submitRegister', -10.841218948364258],
        ['login-pagePwReset', -11.960735321044922],
        ['login-formTextPwReset', -6.014537811279297],
        ['login-formAttrsPwReset', -12.444998741149902],
        ['login-headingsPwReset', -16.881267547607422],
        ['login-layoutPwReset', -1.9563385248184204],
        ['login-pageRecovery', -9.786274909973145],
        ['login-formTextRecovery', 0.10622867196798325],
        ['login-formAttrsRecovery', -24.70846176147461],
        ['login-headingsRecovery', -2.3968217372894287],
        ['login-layoutRecovery', -2.314143180847168],
        ['login-identifierRecovery', 2.6236982345581055],
        ['login-submitRecovery', -10.377229690551758],
        ['login-formTextMFA', -0.049885742366313934],
        ['login-formAttrsMFA', -0.2773353159427643],
        ['login-headingsMFA', -10.777186393737793],
        ['login-layoutMFA', -4.023969650268555],
        ['login-buttonVerify', -5.439630508422852],
        ['login-inputsMFA', -17.27968406677246],
        ['login-inputsOTP', -14.349614143371582],
        ['login-linkOTPOutlier', -3.2141830921173096],
        ['login-headingsNewsletter', -9.085470199584961],
        ['login-oneVisibleField', -6.5988664627075195],
        ['login-buttonMultiStep', 1.967572569847107],
        ['login-buttonMultiAction', 10.916444778442383],
        ['login-headingsMultiStep', -30.689348220825195],
    ],
    bias: -5.649916648864746,
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
        ['pw-change-fieldsCount', -1.9230036735534668],
        ['pw-change-inputCount', -1.526308536529541],
        ['pw-change-fieldsetCount', -6.071496963500977],
        ['pw-change-textCount', -5.989854335784912],
        ['pw-change-textareaCount', -6.059200286865234],
        ['pw-change-selectCount', -6.0918192863464355],
        ['pw-change-checkboxCount', -5.936271667480469],
        ['pw-change-radioCount', 0.006015695631504059],
        ['pw-change-identifierCount', -5.532496929168701],
        ['pw-change-usernameCount', -5.9477434158325195],
        ['pw-change-emailCount', -4.136703968048096],
        ['pw-change-submitCount', -2.797398567199707],
        ['pw-change-hasTels', -5.927576541900635],
        ['pw-change-hasOAuth', -5.978420734405518],
        ['pw-change-hasCaptchas', -5.976979732513428],
        ['pw-change-hasFiles', 0.0792226567864418],
        ['pw-change-hasDate', -6.084181785583496],
        ['pw-change-hasNumber', -9.195960998535156],
        ['pw-change-noPasswordFields', -5.918756008148193],
        ['pw-change-onePasswordField', -5.982269287109375],
        ['pw-change-twoPasswordFields', 13.157468795776367],
        ['pw-change-threePasswordFields', 21.34531593322754],
        ['pw-change-oneIdentifierField', -5.989102840423584],
        ['pw-change-twoIdentifierFields', -6.111758708953857],
        ['pw-change-threeIdentifierFields', 11.386528015136719],
        ['pw-change-hasHiddenIdentifier', 0.3217802047729492],
        ['pw-change-hasHiddenPassword', -6.063476085662842],
        ['pw-change-autofocusedIsPassword', 20.214475631713867],
        ['pw-change-visibleRatio', -3.6227846145629883],
        ['pw-change-inputRatio', -3.620788097381592],
        ['pw-change-hiddenRatio', -4.258998870849609],
        ['pw-change-identifierRatio', -5.293010711669922],
        ['pw-change-emailRatio', -5.060267448425293],
        ['pw-change-usernameRatio', -6.107734680175781],
        ['pw-change-passwordRatio', 4.678285598754883],
        ['pw-change-requiredRatio', -4.330002784729004],
        ['pw-change-patternRatio', 1.6422743797302246],
        ['pw-change-minMaxLengthRatio', -2.8919105529785156],
        ['pw-change-pageLogin', -5.959614276885986],
        ['pw-change-formTextLogin', -6.105377197265625],
        ['pw-change-formAttrsLogin', -6.068812847137451],
        ['pw-change-headingsLogin', -6.098569869995117],
        ['pw-change-layoutLogin', -5.967080593109131],
        ['pw-change-rememberMeCheckbox', -5.984755992889404],
        ['pw-change-troubleLink', -3.5745320320129395],
        ['pw-change-submitLogin', -6.097064018249512],
        ['pw-change-pageRegister', -5.952792644500732],
        ['pw-change-formTextRegister', -0.03028631955385208],
        ['pw-change-formAttrsRegister', -5.989850044250488],
        ['pw-change-headingsRegister', -6.554818153381348],
        ['pw-change-layoutRegister', -5.9471659660339355],
        ['pw-change-checkboxTOS', 0.039186276495456696],
        ['pw-change-submitRegister', -6.4172444343566895],
        ['pw-change-pagePwReset', 17.210084915161133],
        ['pw-change-formTextPwReset', 18.645540237426758],
        ['pw-change-formAttrsPwReset', 2.723604679107666],
        ['pw-change-headingsPwReset', 17.28336524963379],
        ['pw-change-layoutPwReset', 14.779162406921387],
        ['pw-change-pageRecovery', -6.109409809112549],
        ['pw-change-formTextRecovery', 0.06653698533773422],
        ['pw-change-formAttrsRecovery', -5.918193340301514],
        ['pw-change-headingsRecovery', -6.039525508880615],
        ['pw-change-layoutRecovery', -4.2825846672058105],
        ['pw-change-identifierRecovery', -5.977315902709961],
        ['pw-change-submitRecovery', 0.4523531496524811],
        ['pw-change-formTextMFA', 0.035484544932842255],
        ['pw-change-formAttrsMFA', -6.002837657928467],
        ['pw-change-headingsMFA', -6.118376731872559],
        ['pw-change-layoutMFA', -5.897085666656494],
        ['pw-change-buttonVerify', -5.932022571563721],
        ['pw-change-inputsMFA', -6.028128147125244],
        ['pw-change-inputsOTP', -5.970328330993652],
        ['pw-change-linkOTPOutlier', -6.42785120010376],
        ['pw-change-headingsNewsletter', -5.976739406585693],
        ['pw-change-oneVisibleField', -5.987432956695557],
        ['pw-change-buttonMultiStep', -5.917269229888916],
        ['pw-change-buttonMultiAction', -6.00001335144043],
        ['pw-change-headingsMultiStep', -6.075878143310547],
    ],
    bias: -3.6035168170928955,
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
        ['register-fieldsCount', 1.0656908750534058],
        ['register-inputCount', -2.246748208999634],
        ['register-fieldsetCount', 12.577393531799316],
        ['register-textCount', 8.747512817382812],
        ['register-textareaCount', -2.9965503215789795],
        ['register-selectCount', 8.263691902160645],
        ['register-checkboxCount', -6.5358428955078125],
        ['register-radioCount', -0.05220991373062134],
        ['register-identifierCount', 8.03564167022705],
        ['register-usernameCount', -8.99314022064209],
        ['register-emailCount', 4.4904584884643555],
        ['register-submitCount', 10.371426582336426],
        ['register-hasTels', 22.289939880371094],
        ['register-hasOAuth', 6.568234443664551],
        ['register-hasCaptchas', 5.425934314727783],
        ['register-hasFiles', -0.10731396824121475],
        ['register-hasDate', 10.05865478515625],
        ['register-hasNumber', 46.720375061035156],
        ['register-noPasswordFields', -6.596743583679199],
        ['register-onePasswordField', 3.3089160919189453],
        ['register-twoPasswordFields', 11.677094459533691],
        ['register-threePasswordFields', -6.488158226013184],
        ['register-oneIdentifierField', 2.777775526046753],
        ['register-twoIdentifierFields', 19.340938568115234],
        ['register-threeIdentifierFields', 10.203934669494629],
        ['register-hasHiddenIdentifier', 3.503735065460205],
        ['register-hasHiddenPassword', 7.238859176635742],
        ['register-autofocusedIsPassword', -9.444023132324219],
        ['register-visibleRatio', -2.977595329284668],
        ['register-inputRatio', -8.31781005859375],
        ['register-hiddenRatio', -0.1678077131509781],
        ['register-identifierRatio', 11.851085662841797],
        ['register-emailRatio', -2.7497305870056152],
        ['register-usernameRatio', -19.185653686523438],
        ['register-passwordRatio', -0.2508660554885864],
        ['register-requiredRatio', -1.6581308841705322],
        ['register-patternRatio', -8.977261543273926],
        ['register-minMaxLengthRatio', -8.907713890075684],
        ['register-pageLogin', -11.475077629089355],
        ['register-formTextLogin', -6.60929536819458],
        ['register-formAttrsLogin', -0.28106653690338135],
        ['register-headingsLogin', -21.341279983520508],
        ['register-layoutLogin', 1.3390172719955444],
        ['register-rememberMeCheckbox', -6.466174602508545],
        ['register-troubleLink', -21.347532272338867],
        ['register-submitLogin', -4.869346618652344],
        ['register-pageRegister', -7.107511520385742],
        ['register-formTextRegister', -0.10341809689998627],
        ['register-formAttrsRegister', 17.874309539794922],
        ['register-headingsRegister', 7.025679588317871],
        ['register-layoutRegister', -2.9855828285217285],
        ['register-checkboxTOS', 0.03821348398923874],
        ['register-submitRegister', 29.4010009765625],
        ['register-pagePwReset', -6.178134918212891],
        ['register-formTextPwReset', -6.063642978668213],
        ['register-formAttrsPwReset', -5.893531322479248],
        ['register-headingsPwReset', -12.4676513671875],
        ['register-layoutPwReset', -11.46303939819336],
        ['register-pageRecovery', -25.091527938842773],
        ['register-formTextRecovery', 0.040925078094005585],
        ['register-formAttrsRecovery', -6.946219444274902],
        ['register-headingsRecovery', -35.00647735595703],
        ['register-layoutRecovery', -7.545628070831299],
        ['register-identifierRecovery', -34.3669319152832],
        ['register-submitRecovery', -25.228811264038086],
        ['register-formTextMFA', 0.0934402123093605],
        ['register-formAttrsMFA', 5.726084232330322],
        ['register-headingsMFA', -23.484474182128906],
        ['register-layoutMFA', 0.6165627837181091],
        ['register-buttonVerify', 9.528837203979492],
        ['register-inputsMFA', -16.381942749023438],
        ['register-inputsOTP', -21.94601821899414],
        ['register-linkOTPOutlier', 0.43195265531539917],
        ['register-headingsNewsletter', -23.99648666381836],
        ['register-oneVisibleField', -10.650585174560547],
        ['register-buttonMultiStep', 14.483275413513184],
        ['register-buttonMultiAction', -6.387175559997559],
        ['register-headingsMultiStep', 24.84054183959961],
    ],
    bias: -1.2142977714538574,
    cutoff: 0.88,
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
        ['recovery-fieldsCount', 0.05889822542667389],
        ['recovery-inputCount', 0.1702641397714615],
        ['recovery-fieldsetCount', 5.205628871917725],
        ['recovery-textCount', 10.763367652893066],
        ['recovery-textareaCount', -21.18470573425293],
        ['recovery-selectCount', -9.039358139038086],
        ['recovery-checkboxCount', -6.045401573181152],
        ['recovery-radioCount', 0.09288500994443893],
        ['recovery-identifierCount', 3.783784866333008],
        ['recovery-usernameCount', 30.58534812927246],
        ['recovery-emailCount', -6.088543891906738],
        ['recovery-submitCount', 0.39927104115486145],
        ['recovery-hasTels', -7.949089050292969],
        ['recovery-hasOAuth', -5.368404388427734],
        ['recovery-hasCaptchas', -3.708233594894409],
        ['recovery-hasFiles', 0.01741103082895279],
        ['recovery-hasDate', -6.0579986572265625],
        ['recovery-hasNumber', -6.028677463531494],
        ['recovery-noPasswordFields', -1.4017128944396973],
        ['recovery-onePasswordField', -22.673614501953125],
        ['recovery-twoPasswordFields', -6.248955726623535],
        ['recovery-threePasswordFields', -14.52684211730957],
        ['recovery-oneIdentifierField', 3.954700231552124],
        ['recovery-twoIdentifierFields', 6.007702350616455],
        ['recovery-threeIdentifierFields', -6.026257038116455],
        ['recovery-hasHiddenIdentifier', -19.779794692993164],
        ['recovery-hasHiddenPassword', -18.516998291015625],
        ['recovery-autofocusedIsPassword', -5.958948135375977],
        ['recovery-visibleRatio', -1.8618649244308472],
        ['recovery-inputRatio', -10.219675064086914],
        ['recovery-hiddenRatio', 5.932285308837891],
        ['recovery-identifierRatio', 6.1246137619018555],
        ['recovery-emailRatio', 2.4613332748413086],
        ['recovery-usernameRatio', 1.5808123350143433],
        ['recovery-passwordRatio', -17.733518600463867],
        ['recovery-requiredRatio', 7.615044593811035],
        ['recovery-patternRatio', -10.346702575683594],
        ['recovery-minMaxLengthRatio', 3.520214557647705],
        ['recovery-pageLogin', -4.370458602905273],
        ['recovery-formTextLogin', -6.081295967102051],
        ['recovery-formAttrsLogin', -2.202086925506592],
        ['recovery-headingsLogin', -6.50800085067749],
        ['recovery-layoutLogin', -17.88486099243164],
        ['recovery-rememberMeCheckbox', -5.951526641845703],
        ['recovery-troubleLink', 0.9688828587532043],
        ['recovery-submitLogin', -11.308968544006348],
        ['recovery-pageRegister', -11.5236177444458],
        ['recovery-formTextRegister', -0.06134999915957451],
        ['recovery-formAttrsRegister', -11.135449409484863],
        ['recovery-headingsRegister', -2.434873342514038],
        ['recovery-layoutRegister', -7.261252403259277],
        ['recovery-checkboxTOS', 0.07745716720819473],
        ['recovery-submitRegister', -6.614896297454834],
        ['recovery-pagePwReset', 8.42724323272705],
        ['recovery-formTextPwReset', -6.461925983428955],
        ['recovery-formAttrsPwReset', 11.94575023651123],
        ['recovery-headingsPwReset', 15.639286041259766],
        ['recovery-layoutPwReset', 9.082257270812988],
        ['recovery-pageRecovery', 25.15334129333496],
        ['recovery-formTextRecovery', 0.04027443379163742],
        ['recovery-formAttrsRecovery', 22.647890090942383],
        ['recovery-headingsRecovery', -4.243882656097412],
        ['recovery-layoutRecovery', 0.3356809616088867],
        ['recovery-identifierRecovery', 19.068893432617188],
        ['recovery-submitRecovery', 14.665574073791504],
        ['recovery-formTextMFA', 0.07076994329690933],
        ['recovery-formAttrsMFA', 14.406655311584473],
        ['recovery-headingsMFA', 6.549396991729736],
        ['recovery-layoutMFA', -6.092778205871582],
        ['recovery-buttonVerify', -11.010310173034668],
        ['recovery-inputsMFA', -1.4293619394302368],
        ['recovery-inputsOTP', -11.362738609313965],
        ['recovery-linkOTPOutlier', 10.45742130279541],
        ['recovery-headingsNewsletter', -13.681344032287598],
        ['recovery-oneVisibleField', 1.083751916885376],
        ['recovery-buttonMultiStep', -4.770805835723877],
        ['recovery-buttonMultiAction', -6.154256343841553],
        ['recovery-headingsMultiStep', -6.138210296630859],
    ],
    bias: -10.459270477294922,
    cutoff: 0.91,
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
        ['mfa-fieldsCount', -4.744322299957275],
        ['mfa-inputCount', -4.9689788818359375],
        ['mfa-fieldsetCount', 4.765955924987793],
        ['mfa-textCount', -2.5959043502807617],
        ['mfa-textareaCount', -20.9794864654541],
        ['mfa-selectCount', -6.0975141525268555],
        ['mfa-checkboxCount', -5.974765300750732],
        ['mfa-radioCount', 0.046673886477947235],
        ['mfa-identifierCount', -4.366030693054199],
        ['mfa-usernameCount', -4.571260929107666],
        ['mfa-emailCount', -6.698823928833008],
        ['mfa-submitCount', -2.373920440673828],
        ['mfa-hasTels', 12.964888572692871],
        ['mfa-hasOAuth', -6.528632164001465],
        ['mfa-hasCaptchas', -2.3285255432128906],
        ['mfa-hasFiles', 0.10427846759557724],
        ['mfa-hasDate', -5.963010311126709],
        ['mfa-hasNumber', 8.7017240524292],
        ['mfa-noPasswordFields', 0.20314112305641174],
        ['mfa-onePasswordField', -6.33219051361084],
        ['mfa-twoPasswordFields', -6.8110175132751465],
        ['mfa-threePasswordFields', -5.9757981300354],
        ['mfa-oneIdentifierField', -4.468320846557617],
        ['mfa-twoIdentifierFields', -5.993083477020264],
        ['mfa-threeIdentifierFields', -5.939207553863525],
        ['mfa-hasHiddenIdentifier', -3.833171844482422],
        ['mfa-hasHiddenPassword', -2.536738157272339],
        ['mfa-autofocusedIsPassword', 7.167194843292236],
        ['mfa-visibleRatio', -4.759814262390137],
        ['mfa-inputRatio', -2.596341371536255],
        ['mfa-hiddenRatio', 1.4948476552963257],
        ['mfa-identifierRatio', -4.394272804260254],
        ['mfa-emailRatio', -6.7514119148254395],
        ['mfa-usernameRatio', -5.331424236297607],
        ['mfa-passwordRatio', -5.47615385055542],
        ['mfa-requiredRatio', 7.959036350250244],
        ['mfa-patternRatio', 9.028539657592773],
        ['mfa-minMaxLengthRatio', 0.15353459119796753],
        ['mfa-pageLogin', 4.888920307159424],
        ['mfa-formTextLogin', -6.080111503601074],
        ['mfa-formAttrsLogin', -2.8624649047851562],
        ['mfa-headingsLogin', -4.3413615226745605],
        ['mfa-layoutLogin', -1.1264088153839111],
        ['mfa-rememberMeCheckbox', -5.926815509796143],
        ['mfa-troubleLink', -5.92904806137085],
        ['mfa-submitLogin', 0.030385306105017662],
        ['mfa-pageRegister', -4.749216556549072],
        ['mfa-formTextRegister', -0.0842956006526947],
        ['mfa-formAttrsRegister', -4.2371625900268555],
        ['mfa-headingsRegister', -7.326374053955078],
        ['mfa-layoutRegister', -4.652084827423096],
        ['mfa-checkboxTOS', 0.049231208860874176],
        ['mfa-submitRegister', -6.091821670532227],
        ['mfa-pagePwReset', -6.03828763961792],
        ['mfa-formTextPwReset', -6.04653263092041],
        ['mfa-formAttrsPwReset', -6.046000957489014],
        ['mfa-headingsPwReset', -6.053748607635498],
        ['mfa-layoutPwReset', -5.933687210083008],
        ['mfa-pageRecovery', 2.00288987159729],
        ['mfa-formTextRecovery', -0.05605859309434891],
        ['mfa-formAttrsRecovery', -7.581318378448486],
        ['mfa-headingsRecovery', -7.738776206970215],
        ['mfa-layoutRecovery', 2.2048280239105225],
        ['mfa-identifierRecovery', -6.068804740905762],
        ['mfa-submitRecovery', -3.677849769592285],
        ['mfa-formTextMFA', 0.0942305251955986],
        ['mfa-formAttrsMFA', 13.559548377990723],
        ['mfa-headingsMFA', 16.790224075317383],
        ['mfa-layoutMFA', 10.983575820922852],
        ['mfa-buttonVerify', 12.183700561523438],
        ['mfa-inputsMFA', 16.06976318359375],
        ['mfa-inputsOTP', 19.92092514038086],
        ['mfa-linkOTPOutlier', -2.017904758453369],
        ['mfa-headingsNewsletter', -5.973108768463135],
        ['mfa-oneVisibleField', -1.038608193397522],
        ['mfa-buttonMultiStep', 2.108959197998047],
        ['mfa-buttonMultiAction', -5.977208614349365],
        ['mfa-headingsMultiStep', 9.075553894042969],
    ],
    bias: -2.9771482944488525,
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
        ['pw-loginScore', 10.71831226348877],
        ['pw-registerScore', -12.083797454833984],
        ['pw-pwChangeScore', -4.008666038513184],
        ['pw-exotic', -14.168866157531738],
        ['pw-dangling', -0.104903943836689],
        ['pw-autocompleteNew', -2.137921094894409],
        ['pw-autocompleteCurrent', 6.252719879150391],
        ['pw-autocompleteOff', -1.2591034173965454],
        ['pw-isOnlyPassword', 4.335724353790283],
        ['pw-prevPwField', -0.72119140625],
        ['pw-nextPwField', -1.5769155025482178],
        ['pw-attrCreate', -0.9222816228866577],
        ['pw-attrCurrent', 2.6503868103027344],
        ['pw-attrConfirm', -6.3802971839904785],
        ['pw-attrReset', -0.12461365014314651],
        ['pw-textCreate', -2.220975160598755],
        ['pw-textCurrent', 6.762027263641357],
        ['pw-textConfirm', -6.3277411460876465],
        ['pw-textReset', 0.022302404046058655],
        ['pw-labelCreate', -6.4340691566467285],
        ['pw-labelCurrent', 10.372880935668945],
        ['pw-labelConfirm', -6.301670074462891],
        ['pw-labelReset', 0.12385061383247375],
        ['pw-prevPwCreate', -6.449476718902588],
        ['pw-prevPwCurrent', -7.492202281951904],
        ['pw-prevPwConfirm', -0.12123315781354904],
        ['pw-passwordOutlier', -6.537151336669922],
        ['pw-nextPwCreate', 5.644461631774902],
        ['pw-nextPwCurrent', -0.10793391615152359],
        ['pw-nextPwConfirm', -6.363923072814941],
    ],
    bias: -0.9682011604309082,
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
        ['pw[new]-loginScore', -13.380383491516113],
        ['pw[new]-registerScore', 13.280652046203613],
        ['pw[new]-pwChangeScore', 2.196667194366455],
        ['pw[new]-exotic', 14.559000015258789],
        ['pw[new]-dangling', 0.17608585953712463],
        ['pw[new]-autocompleteNew', 2.053464651107788],
        ['pw[new]-autocompleteCurrent', -7.272342681884766],
        ['pw[new]-autocompleteOff', 0.020575236529111862],
        ['pw[new]-isOnlyPassword', -2.9606614112854004],
        ['pw[new]-prevPwField', -0.8806082606315613],
        ['pw[new]-nextPwField', 9.797928810119629],
        ['pw[new]-attrCreate', 2.7809722423553467],
        ['pw[new]-attrCurrent', -3.70135760307312],
        ['pw[new]-attrConfirm', 7.233455181121826],
        ['pw[new]-attrReset', 0.030774280428886414],
        ['pw[new]-textCreate', 0.7354432940483093],
        ['pw[new]-textCurrent', -7.820827007293701],
        ['pw[new]-textConfirm', -15.752650260925293],
        ['pw[new]-textReset', 0.17634743452072144],
        ['pw[new]-labelCreate', 6.528083801269531],
        ['pw[new]-labelCurrent', -12.633218765258789],
        ['pw[new]-labelConfirm', 6.783941745758057],
        ['pw[new]-labelReset', -0.012256398797035217],
        ['pw[new]-prevPwCreate', 10.588071823120117],
        ['pw[new]-prevPwCurrent', 6.270977973937988],
        ['pw[new]-prevPwConfirm', -0.11698378622531891],
        ['pw[new]-passwordOutlier', -28.09947967529297],
        ['pw[new]-nextPwCreate', -6.387330532073975],
        ['pw[new]-nextPwCurrent', -0.17887601256370544],
        ['pw[new]-nextPwConfirm', 5.981174468994141],
    ],
    bias: -1.468902826309204,
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
        ['username-autocompleteUsername', 9.54588508605957],
        ['username-autocompleteNickname', -0.21638421714305878],
        ['username-autocompleteEmail', -7.587859153747559],
        ['username-autocompleteOff', -0.44712358713150024],
        ['username-attrUsername', 18.512184143066406],
        ['username-textUsername', 9.124335289001465],
        ['username-labelUsername', 17.89507484436035],
        ['username-outlierUsername', -7.410798072814941],
        ['username-loginUsername', 18.58080291748047],
    ],
    bias: -9.73412799835205,
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
        ['username[hidden]-exotic', -14.553815841674805],
        ['username[hidden]-dangling', -9.19474983215332],
        ['username[hidden]-attrUsername', 10.233339309692383],
        ['username[hidden]-attrEmail', 8.46167278289795],
        ['username[hidden]-usernameName', 7.04905366897583],
        ['username[hidden]-autocompleteUsername', 2.218348979949951],
        ['username[hidden]-hiddenEmailValue', 11.057571411132812],
        ['username[hidden]-hiddenTelValue', 3.1426894664764404],
        ['username[hidden]-hiddenUsernameValue', 1.6783928871154785],
    ],
    bias: -15.006036758422852,
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
        ['email-autocompleteUsername', 1.340722918510437],
        ['email-autocompleteNickname', -0.09352090954780579],
        ['email-autocompleteEmail', 6.260253429412842],
        ['email-typeEmail', 14.760725975036621],
        ['email-exactAttrEmail', 13.170543670654297],
        ['email-attrEmail', 2.2199130058288574],
        ['email-textEmail', 14.440679550170898],
        ['email-labelEmail', 16.959508895874023],
        ['email-placeholderEmail', 15.262213706970215],
        ['email-attrSearch', -13.511590957641602],
        ['email-textSearch', -13.42149543762207],
    ],
    bias: -9.34462833404541,
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
        ['otp-mfaScore', 17.14497184753418],
        ['otp-exotic', -6.509329795837402],
        ['otp-dangling', -8.287845611572266],
        ['otp-linkOTPOutlier', -12.984574317932129],
        ['otp-hasCheckboxes', -0.16361060738563538],
        ['otp-hidden', -9.6468505859375],
        ['otp-required', 0.7299773693084717],
        ['otp-nameMatch', -8.131842613220215],
        ['otp-idMatch', 5.9947309494018555],
        ['otp-numericMode', 10.71800708770752],
        ['otp-autofocused', 6.635133743286133],
        ['otp-tabIndex1', -0.4921528995037079],
        ['otp-patternOTP', 2.6397852897644043],
        ['otp-maxLength1', 6.832276821136475],
        ['otp-maxLength5', -7.4938225746154785],
        ['otp-minLength6', 12.86454963684082],
        ['otp-maxLength6', 7.042840480804443],
        ['otp-maxLength20', -5.6576337814331055],
        ['otp-autocompleteOTC', 0.018669337034225464],
        ['otp-autocompleteOff', -5.304202079772949],
        ['otp-prevAligned', 0.7956802845001221],
        ['otp-prevArea', 3.179447650909424],
        ['otp-nextAligned', 0.0017795562744140625],
        ['otp-nextArea', 3.5299370288848877],
        ['otp-attrMFA', 6.210879325866699],
        ['otp-attrOTP', 9.617476463317871],
        ['otp-attrOutlier', -8.044758796691895],
        ['otp-textMFA', 6.856443881988525],
        ['otp-textOTP', 9.008255004882812],
        ['otp-labelMFA', 12.783114433288574],
        ['otp-labelOTP', -6.5174994468688965],
        ['otp-labelOutlier', -6.518182277679443],
        ['otp-wrapperOTP', 5.243819713592529],
        ['otp-wrapperOutlier', -6.27394962310791],
        ['otp-emailOutlierCount', -19.943790435791016],
    ],
    bias: -12.672174453735352,
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
