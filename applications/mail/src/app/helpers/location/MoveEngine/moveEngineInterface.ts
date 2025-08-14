import type { Folder, Label } from '@proton/shared/lib/interfaces';

import type { Element } from 'proton-mail/models/element';

export type MoveEngineError = {
    id: string;
    error: MoveEngineRuleResult;
};

export type MoveEngineCanMoveResult = {
    allowedElements: Element[];
    deniedElements: Element[];
    notApplicableElements: Element[];
    errors: MoveEngineError[];
};

/**
 * The result of a move engine rule.
 * - ALLOW: The move is allowed.
 * - DENY: The move is denied.
 * - NOT_APPLICABLE: Nothing to do, the rule does not apply to this move.
 */
export enum MoveEngineRuleResult {
    ALLOWED = 'ALLOWED',
    DENIED = 'DENIED',
    NOT_APPLICABLE = 'NOT_APPLICABLE',
}

// TODO How do we manage the unlabel case?
/**
 * A rule for the move engine.
 * @param {string} destinationLabelID - The ID of the target label.
 * @param {Element[]} element - The elements to move, is a list for conversations
 * @returns {MoveEngineRuleResult} The result of the rule, can be ALLOW, DENY, or NOT_APPLICABLE
 */
export type MoveEngineRule = ({
    destinationLabelID,
    element,
    labels,
    folders,
}: {
    destinationLabelID: string;
    element: Element;
    labels: Label[];
    folders: Folder[];
}) => MoveEngineRuleResult;

export const CUSTOM_FOLDER_KEY = 'customFolders';
export const CUSTOM_LABEL_KEY = 'customLabels';

export const ERROR_ELEMENT_NOT_MESSAGE = 'Element is not a message';
export const ERROR_ELEMENT_NOT_CONVERSATION = 'Element is not a conversation';
