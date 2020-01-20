import React from 'react';
import ReactQuill from 'react-quill';
import Quill from 'quill';

// This style will be lazy loaded by LazyRichTextEditor
import 'react-quill/dist/quill.snow.css';

const Block = Quill.import('blots/block');
Block.tagName = 'div';
Quill.register(Block);

const RichTextEditor = ({ ...rest }) => <ReactQuill {...rest} />;

export default RichTextEditor;
