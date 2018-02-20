import { toText } from '../../../helpers/parserHTML';

export default (editor) => toText(editor.getHTML());
