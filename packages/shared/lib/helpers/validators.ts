/* eslint-disable no-useless-escape */
export const REGEX_URL = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
export const REGEX_DOMAIN = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+/;
export const REGEX_HEX_COLOR = /^#([a-f0-9]{3,4}|[a-f0-9]{4}(?:[a-f0-9]{2}){1,2})\b$/i;
export const REGEX_NUMBER = /^\d+$/;
export const REGEX_BASE64_IMAGE = /^data:image\/(?:gif|png|jpeg|bmp|webp|svg\+xml|apng|tiff);base64/;

export const isEmpty = (value = '') => !value.length;
export const maxLength = (value = '', limit = 0) => value.length <= limit;
export const minLength = (value = '', limit = 0) => value.length >= limit;
export const isURL = (value = '') => REGEX_URL.test(value);
export const isDomain = (value = '') => REGEX_DOMAIN.test(value);
export const isHexColor = (value = '') => REGEX_HEX_COLOR.test(value);
export const isNumber = (value = '') => REGEX_NUMBER.test(value);
export const isBase64Image = (value = '') => REGEX_BASE64_IMAGE.test(value);
