import type { DetectionRulesV2 } from './types';

export const RULES_V2_MOCK: DetectionRulesV2 = {
    version: '2',
    rules: {
        'example.com': {
            exclude: ['header', 'footer'],
            include: [
                {
                    selector: ['form[data-test="login"]'],
                    formType: 'login',
                    fields: [{ selector: ['input[type="email"]'], fieldType: 'email' }],
                },
            ],
        },
        'example.com/path': {
            exclude: ['sidebar'],
        },
        'proton.me/path': {
            include: [{ selector: ['form'], formType: 'register' }],
        },
    },
};
