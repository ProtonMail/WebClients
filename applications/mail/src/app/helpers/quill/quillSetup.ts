import Quill from 'quill';

import ProtonImage from './quillProtonImage';

/**
 * Current solution for images is pretty simple yet it has been a long journey to get here.
 * There is what I learnt:
 * - Never refer to a manual import of Parchment, Quill use another instance and nothing match (especially for classes)
 * - Use instead Quill.import to get what you need (log Quill constructor to have a list)
 * - There is restrictions of what types of object can be inserted where. By inheritate from the right class, you should be able to be accepted
 * - Parent class for images are in Quill.import('blots/embed');
 * - It's also possible to hook on the standard image by importing "formats/image" but a new type felt better
 */

const Block = Quill.import('blots/block');
Block.tagName = 'div';
Quill.register(Block);

Quill.register(ProtonImage);

console.log('Quill', Quill);
