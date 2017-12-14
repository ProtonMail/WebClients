import addFilePopover from './directives/addFilePopover';
import addLinkPopover from './directives/addLinkPopover';
import colorList from './directives/colorList';
import colorPopover from './directives/colorPopover';
import moreToggle from './directives/moreToggle';
import plainTextArea from './directives/plainTextArea';
import squire from './directives/squire';
import squireActions from './directives/squireActions';
import squirePopover from './directives/squirePopover';
import squireSelectColor from './directives/squireSelectColor';
import squireSelectFontFamily from './directives/squireSelectFontFamily';
import squireSelectFontSize from './directives/squireSelectFontSize';
import squireToolbar from './directives/squireToolbar';
import editorModel from './factories/editorModel';
import squireDropdown from './factories/squireDropdown';
import squireEditor from './factories/squireEditor';
import editorDropzone from './services/editorDropzone';
import editorListener from './services/editorListener';
import htmlToTextMail from './services/htmlToTextMail';
import removeInlineWatcher from './services/removeInlineWatcher';
import squireExecAction from './services/squireExecAction';
import textToHtmlMail from './services/textToHtmlMail';
import toggleModeEditor from './services/toggleModeEditor';

export default angular
    .module('proton.squire', [])
    .directive('addFilePopover', addFilePopover)
    .directive('addLinkPopover', addLinkPopover)
    .directive('colorList', colorList)
    .directive('colorPopover', colorPopover)
    .directive('moreToggle', moreToggle)
    .directive('plainTextArea', plainTextArea)
    .directive('squire', squire)
    .directive('squireActions', squireActions)
    .directive('squirePopover', squirePopover)
    .directive('squireSelectColor', squireSelectColor)
    .directive('squireSelectFontFamily', squireSelectFontFamily)
    .directive('squireSelectFontSize', squireSelectFontSize)
    .directive('squireToolbar', squireToolbar)
    .factory('editorModel', editorModel)
    .factory('squireDropdown', squireDropdown)
    .factory('squireEditor', squireEditor)
    .factory('editorDropzone', editorDropzone)
    .factory('editorListener', editorListener)
    .factory('htmlToTextMail', htmlToTextMail)
    .factory('removeInlineWatcher', removeInlineWatcher)
    .factory('squireExecAction', squireExecAction)
    .factory('textToHtmlMail', textToHtmlMail)
    .factory('toggleModeEditor', toggleModeEditor).name;
