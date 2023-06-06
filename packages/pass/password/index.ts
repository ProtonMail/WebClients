import type { MemorablePasswordOptions } from './memorable';
import { generateMemorablePassword } from './memorable';
import type { RandomPasswordOptions } from './random';
import { generateRandomPassword } from './random';

export * from './constants';

export type GeneratePasswordOptions =
    | { type: 'random'; options: RandomPasswordOptions }
    | { type: 'memorable'; options: MemorablePasswordOptions };

export const generatePassword = (data: GeneratePasswordOptions) => {
    switch (data.type) {
        case 'random':
            return generateRandomPassword(data.options);
        case 'memorable':
            return generateMemorablePassword(data.options);
    }
};
