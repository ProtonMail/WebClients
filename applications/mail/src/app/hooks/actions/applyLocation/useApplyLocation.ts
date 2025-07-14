import useFlag from '@proton/unleash/useFlag';

import type { Element } from 'proton-mail/models/element';

export interface ApplyLocationParams {
    elements: Element[];
    labelChanges: { [labelID: string]: boolean }; // true: add, false: remove
    createFilters?: boolean;
}

export const useApplyLocation = () => {
    const enabled = useFlag('ApplyLabelsOptimisticRefactoring');

    const applyLocation = ({ elements, labelChanges, createFilters }: ApplyLocationParams): Promise<void> => {
        console.log('applyLocation', { elements, labelChanges, createFilters });
        throw new Error('Not implemented');
    };

    return { enabled, applyLocation };
};
