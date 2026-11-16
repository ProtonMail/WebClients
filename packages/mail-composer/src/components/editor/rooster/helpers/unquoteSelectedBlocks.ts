import {
    createFormatContainer,
    getOperationalBlocks,
    hasSelectionInBlock,
    isBlockGroupOfType,
    mutateBlock,
    setParagraphNotImplicit,
} from 'roosterjs-content-model-dom';
import type {
    ReadonlyContentModelBlock,
    ReadonlyContentModelBlockGroup,
    ReadonlyContentModelFormatContainer,
    ReadonlyContentModelListItem,
} from 'roosterjs-content-model-types';
import type { EditorAdapter } from 'roosterjs-editor-adapter';

const isQuote = (block: ReadonlyContentModelBlock): block is ReadonlyContentModelFormatContainer =>
    isBlockGroupOfType<ReadonlyContentModelFormatContainer>(block, 'FormatContainer') && block.tagName === 'blockquote';

const splitQuoteAroundSelection = (
    parent: ReadonlyContentModelBlockGroup,
    quote: ReadonlyContentModelFormatContainer
) => {
    const selectedIndexes = quote.blocks.flatMap((block, index) => (hasSelectionInBlock(block) ? [index] : []));
    if (!selectedIndexes.length) {
        return;
    }
    const first = selectedIndexes[0];
    const last = selectedIndexes[selectedIndexes.length - 1];
    const selected = quote.blocks.slice(first, last + 1);
    const wrap = (blocks: readonly ReadonlyContentModelBlock[]) => {
        if (!blocks.length) {
            return [];
        }
        const container = createFormatContainer('blockquote', quote.format);
        mutateBlock(container).blocks.push(...blocks);
        return [container];
    };

    selected.forEach(setParagraphNotImplicit);
    const parentBlocks = mutateBlock(parent).blocks;
    parentBlocks.splice(
        parentBlocks.indexOf(quote),
        1,
        ...wrap(quote.blocks.slice(0, first)),
        ...selected,
        ...wrap(quote.blocks.slice(last + 1))
    );
};

/**
 * roosterjs 9 merges a new quote into an adjacent one and then unquotes the whole quote,
 * while roosterjs 8 only unquotes the selected blocks.
 * When every selected block is quoted, this splits each quote around the selection and unquotes only the selected part.
 * @returns false when some selected block is not quoted, leaving the content untouched
 */
export const unquoteSelectedBlocks = (editor: EditorAdapter) => {
    let unquoted = false;

    editor.focus();
    editor.formatContentModel(
        (model, context) => {
            const operationalBlocks = getOperationalBlocks<
                ReadonlyContentModelFormatContainer | ReadonlyContentModelListItem
            >(
                model,
                ['FormatContainer', 'ListItem'],
                ['TableCell'],
                true,
                (group) => group.blockGroupType !== 'FormatContainer' || group.tagName === 'blockquote'
            );
            if (!operationalBlocks.length || !operationalBlocks.every(({ block }) => isQuote(block))) {
                return false;
            }

            operationalBlocks.forEach(({ block, parent }) => {
                if (isQuote(block)) {
                    splitQuoteAroundSelection(parent, block);
                }
            });
            context.newPendingFormat = 'preserve';
            unquoted = true;
            return true;
        },
        { apiName: 'toggleBlockQuote' }
    );

    return unquoted;
};
