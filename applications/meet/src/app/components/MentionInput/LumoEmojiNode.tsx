import type { ReactElement } from 'react';

import type { NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import { $applyNodeReplacement, DecoratorNode } from 'lexical';

import { type LumoEmojiId, getLumoEmojiToken } from '../../utils/lumoEmojis/lumoEmojis';
import { LumoEmoji } from '../LumoEmoji/LumoEmoji';

type SerializedLumoEmojiNode = Spread<{ lumoEmojiId: LumoEmojiId }, SerializedLexicalNode>;

export class LumoEmojiNode extends DecoratorNode<ReactElement> {
    __lumoEmojiId: LumoEmojiId;

    static getType() {
        return 'lumo-emoji';
    }

    static clone(node: LumoEmojiNode) {
        return new LumoEmojiNode(node.__lumoEmojiId, node.__key);
    }

    static importJSON(serialized: SerializedLumoEmojiNode) {
        return $applyNodeReplacement(new LumoEmojiNode(serialized.lumoEmojiId));
    }

    constructor(lumoEmojiId: LumoEmojiId, key?: NodeKey) {
        super(key);
        this.__lumoEmojiId = lumoEmojiId;
    }

    exportJSON(): SerializedLumoEmojiNode {
        return {
            ...super.exportJSON(),
            type: 'lumo-emoji',
            lumoEmojiId: this.__lumoEmojiId,
        };
    }

    createDOM() {
        return document.createElement('span');
    }

    updateDOM() {
        return false;
    }

    getTextContent() {
        return getLumoEmojiToken(this.__lumoEmojiId);
    }

    isKeyboardSelectable() {
        return false;
    }

    decorate() {
        return <LumoEmoji id={this.__lumoEmojiId} />;
    }
}

export const $createLumoEmojiNode = (lumoEmojiId: LumoEmojiId) => $applyNodeReplacement(new LumoEmojiNode(lumoEmojiId));
