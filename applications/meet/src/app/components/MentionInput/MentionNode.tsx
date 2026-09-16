import type { EditorConfig, LexicalNode, NodeKey, SerializedTextNode, Spread } from 'lexical';
import { $applyNodeReplacement, TextNode } from 'lexical';

import clsx from '@proton/utils/clsx';

const MENTION_ID_ATTRIBUTE = 'data-mention-id';

export type SerializedMentionNode = Spread<{ mentionId: string; mentionClassName: string }, SerializedTextNode>;

/** Mention as a token-mode TextNode: atomic for editing, with id separate from display text. */
export class MentionNode extends TextNode {
    __mentionId: string;

    __mentionClassName: string;

    static getType() {
        return 'mention';
    }

    static clone(node: MentionNode) {
        return new MentionNode(node.__mentionId, node.__text, node.__mentionClassName, node.__key);
    }

    constructor(mentionId: string, text: string, mentionClassName: string, key?: NodeKey) {
        super(text, key);
        this.__mentionId = mentionId;
        this.__mentionClassName = mentionClassName;
    }

    getMentionId() {
        return this.__mentionId;
    }

    getClassName() {
        return clsx('text-nowrap', this.__mentionClassName);
    }

    createDOM(config: EditorConfig) {
        const element = super.createDOM(config);

        element.className = this.getClassName();
        element.setAttribute(MENTION_ID_ATTRIBUTE, this.__mentionId);

        return element;
    }

    updateDOM(previous: this, element: HTMLElement, config: EditorConfig) {
        const updated = super.updateDOM(previous, element, config);

        // Names arrive asynchronously; restyle when the label changes.
        if (previous.__mentionClassName !== this.__mentionClassName) {
            element.className = this.getClassName();
        }

        return updated;
    }

    static importJSON(serialized: SerializedMentionNode) {
        return $applyNodeReplacement(
            new MentionNode(serialized.mentionId, serialized.text, serialized.mentionClassName).setMode('token')
        );
    }

    exportJSON(): SerializedMentionNode {
        return {
            ...super.exportJSON(),
            type: 'mention',
            mentionId: this.__mentionId,
            mentionClassName: this.__mentionClassName,
        };
    }

    /** Keeps the mention out of Lexical's plain-text entity handling. */
    isTextEntity() {
        return true;
    }

    canInsertTextBefore() {
        return false;
    }

    canInsertTextAfter() {
        return false;
    }
}

export const $createMentionNode = (mentionId: string, text: string, className: string) =>
    $applyNodeReplacement(new MentionNode(mentionId, text, className).setMode('token'));

export const $isMentionNode = (node: LexicalNode | null | undefined): node is MentionNode =>
    node instanceof MentionNode;
