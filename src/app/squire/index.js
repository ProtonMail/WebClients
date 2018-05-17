import addFile from './directives/addFile';
import addLink from './directives/addLink';
import colorList from './directives/colorList';
import colorPopover from './directives/colorPopover';
import moreToggle from './directives/moreToggle';
import plainTextArea from './directives/plainTextArea';
import squire from './directives/squire';
import squireActions from './directives/squireActions';
import squireSelectColor from './directives/squireSelectColor';
import squireSelectFontFamily from './directives/squireSelectFontFamily';
import squireSelectFontSize from './directives/squireSelectFontSize';
import squireToolbar from './directives/squireToolbar';
import squireState from './directives/squireState';
import squireModalListener from './directives/squireModalListener';
import editorModel from './factories/editorModel';
import editorState from './factories/editorState';
import squireEditor from './factories/squireEditor';
import addLinkModal from './modals/addLinkModal';
import addFileModal from './modals/addFileModal';
import editorDropzone from './services/editorDropzone';
import editorListener from './services/editorListener';
import removeInlineWatcher from './services/removeInlineWatcher';
import squireExecAction from './services/squireExecAction';
import textToHtmlMail from './services/textToHtmlMail';
import toggleModeEditor from './services/toggleModeEditor';

export default angular
    .module('proton.squire', [])
    .directive('addFile', addFile)
    .directive('addLink', addLink)
    .directive('colorList', colorList)
    .directive('colorPopover', colorPopover)
    .directive('moreToggle', moreToggle)
    .directive('plainTextArea', plainTextArea)
    .directive('squire', squire)
    .directive('squireModalListener', squireModalListener)
    .directive('squireActions', squireActions)
    .directive('squireSelectColor', squireSelectColor)
    .directive('squireSelectFontFamily', squireSelectFontFamily)
    .directive('squireSelectFontSize', squireSelectFontSize)
    .directive('squireToolbar', squireToolbar)
    .directive('squireState', squireState)
    .factory('editorModel', editorModel)
    .factory('editorState', editorState)
    .factory('squireEditor', squireEditor)
    .factory('editorDropzone', editorDropzone)
    .factory('editorListener', editorListener)
    .factory('removeInlineWatcher', removeInlineWatcher)
    .factory('squireExecAction', squireExecAction)
    .factory('addLinkModal', addLinkModal)
    .factory('addFileModal', addFileModal)
    .factory('textToHtmlMail', textToHtmlMail)
    .factory('toggleModeEditor', toggleModeEditor).name;
