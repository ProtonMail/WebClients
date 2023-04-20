import browser from '@proton/pass/globals/browser';

export const EXTENSION_PREFIX = 'protonpass';

export const CONTENT_SCRIPT_INJECTED_MESSAGE = `${EXTENSION_PREFIX}-cs-injected`;

export const INPUT_STYLES_ATTR = `data-${EXTENSION_PREFIX}-styles-reset`;
export const DETECTED_FORM_ID_ATTR = `data-${EXTENSION_PREFIX}-form-id`;
export const PROCESSED_INPUT_ATTR = `data-${EXTENSION_PREFIX}-processed`;

export const ICON_ROOT_CLASSNAME = `${EXTENSION_PREFIX}-input`;
export const ICON_WRAPPER_CLASSNAME = `${ICON_ROOT_CLASSNAME}--wrapper`;
export const ICON_CLASSNAME = `${ICON_ROOT_CLASSNAME}--icon`;
export const ICON_CIRCLE_LOADER = `${ICON_ROOT_CLASSNAME}--loader`;
export const ICON_SVG = `${ICON_ROOT_CLASSNAME}--svg`;
export const ICON_PADDING = 8;
export const ICON_MAX_HEIGHT = 25;
export const ICON_MIN_HEIGHT = 18;
export const DROPDOWN_WIDTH = 250;
export const MIN_DROPDOWN_HEIGHT = 60;
export const NOTIFICATION_HEIGHT = 335;
export const NOTIFICATION_WIDTH = 320;
export const ACTIVE_ICON_SRC = browser.runtime.getURL('/assets/protonpass-icon.svg');
export const DROPDOWN_IFRAME_SRC = browser.runtime.getURL('/dropdown.html');
export const NOTIFICATION_IFRAME_SRC = browser.runtime.getURL('/notification.html');
