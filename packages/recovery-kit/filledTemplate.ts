import { getTemplate } from './index';
// To avoid this asset getting included in the account bundle
import filledTemplate from './templates/filled_template.pdf';

export const getFilledTemplate = () => {
    return getTemplate(filledTemplate);
};
