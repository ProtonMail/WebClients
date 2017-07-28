# This file implements the syntax highlighting of codemirror.
# The reason I'm not doing this in grunt, is that we already have a sieve.js file in /vendor/ (it implements the simple sieve parsing). So I need to give this a new name to get this working.
cp vendor/codemirror/mode/sieve/sieve.js vendor/codemirror/mode/sieve/sieveSyntax.js
