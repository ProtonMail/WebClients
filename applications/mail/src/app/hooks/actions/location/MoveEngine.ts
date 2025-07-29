import { isCustomFolder, isCustomLabel } from '@proton/mail/helpers/location';
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

    private getRuleKey(targetLabelID: string) {
        if (isCustomFolder(targetLabelID, this.folders)) {
            return CUSTOM_FOLDER_KEY;
        }
        if (isCustomLabel(targetLabelID, this.labels)) {
            return CUSTOM_LABEL_KEY;
        }
        return targetLabelID;
    }

    addRule(targetLabelID: string, rule: MoveEngineRule) {
        this.rules[targetLabelID] = rule;
    }

    validateMove(targetLabelID: string, elements: Element[]): MoveEngineCanMoveResult {
        const rule = this.rules[this.getRuleKey(targetLabelID)];
        if (!rule) {
            throw new Error(`No rule found for destination ${targetLabelID}`);
        }

        const errors: MoveEngineError[] = [];
        const allowedElements: Element[] = [];
        const deniedElements: Element[] = [];
        const notApplicableElements: Element[] = [];

        for (const element of elements) {
            const result = rule({
                targetLabelID,
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
