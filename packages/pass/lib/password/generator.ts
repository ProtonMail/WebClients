import type { MemorablePasswordOptions } from './memorable';
import { generateMemorablePassword } from './memorable';
import type { RandomPasswordOptions } from './random';
import { generateRandomPassword } from './random';

export type GeneratePasswordMode = 'random' | 'memorable';

export type GeneratePasswordConfig<T extends GeneratePasswordMode = GeneratePasswordMode> = Extract<
    { type: 'random'; options: RandomPasswordOptions } | { type: 'memorable'; options: MemorablePasswordOptions },
    { type: T }
>;

export const generatePassword = (data: GeneratePasswordConfig) => {
    switch (data.type) {
        case 'random':
            return generateRandomPassword(data.options);
        case 'memorable':
            return generateMemorablePassword(data.options);
    }
};
