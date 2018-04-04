import { toText } from '../../../helpers/parserHTML';

export default (editor, convertImages = false) => toText(editor.getHTML(), true, convertImages);
