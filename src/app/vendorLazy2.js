import CodeMirror from 'codemirror';
import 'codemirror/addon/display/autorefresh';
import 'codemirror/addon/lint/lint';
import 'codemirror/mode/sieve/sieve';

import 'angular-ui-codemirror';

import '../sass/vendorLazy2.scss';

window.CodeMirror = CodeMirror;

export default angular.module('vendorLazy2', ['ui.codemirror']);
