import { isCustomFolder, isCustomLabel } from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';

import type { Element } from 'proton-mail/models/element';

import type { MoveEngineCanMoveResult, MoveEngineError, MoveEngineRule } from './moveEngineInterface';
import { CUSTOM_FOLDER_KEY, CUSTOM_LABEL_KEY, MoveEngineRuleResult } from './moveEngineInterface';

export class MoveEngine {
    private rules: Record<string, MoveEngineRule> = {};

    private labels: Label[];

    private folders: Folder[];

    constructor(labels: Label[], folders: Folder[]) {
        this.labels = labels;
        this.folders = folders;
    }

    private getRuleKey(destinationLabelID: string) {
        if (isCustomFolder(destinationLabelID, this.folders)) {
            return CUSTOM_FOLDER_KEY;
        }
        if (isCustomLabel(destinationLabelID, this.labels)) {
            return CUSTOM_LABEL_KEY;
        }
        return destinationLabelID;
    }

    addRule(destinationLabelID: string, rule: MoveEngineRule) {
        this.rules[destinationLabelID] = rule;
    }

    validateMove(destinationLabelID: string, elements: Element[], removeLabel: boolean): MoveEngineCanMoveResult {
        if (removeLabel) {
            if (isCustomLabel(destinationLabelID, this.labels) || destinationLabelID === MAILBOX_LABEL_IDS.STARRED) {
                return {
                    allowedElements: elements,
                    deniedElements: [],
                    notApplicableElements: [],
                    errors: [],
                };
            }

            throw new Error(`Cannot unlabel ${destinationLabelID}`);
        }

        const rule = this.rules[this.getRuleKey(destinationLabelID)];
        if (!rule) {
            throw new Error(`No rule found for destination ${destinationLabelID}`);
        }

        const errors: MoveEngineError[] = [];
        const allowedElements: Element[] = [];
        const deniedElements: Element[] = [];
        const notApplicableElements: Element[] = [];

        for (const element of elements) {
            const result = rule({
                destinationLabelID,
                labels: this.labels,
                folders: this.folders,
                element,
            });

            if (result === MoveEngineRuleResult.ALLOWED) {
                allowedElements.push(element);
            } else {
                errors.push({ id: element.ID, error: result });

                if (result === MoveEngineRuleResult.DENIED) {
                    deniedElements.push(element);
                } else {
                    notApplicableElements.push(element);
                }
            }
        }

        return {
            allowedElements,
            deniedElements,
            notApplicableElements,
            errors,
        };
    }
}
