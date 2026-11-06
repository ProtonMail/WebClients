# Homepage

The purpose of this module is to provide a dependency-free implementation of Docs homepage. To achieve this goal, code duplicates are allowed. No code from outside of this path should be imported (unless it's a shared package). Legacy paths (drive-store) will NOT be ported here.

Files inside this path import each other with relative paths, never through the `~/homepage` alias.

Files outside this path import only from its public entry, `index.ts` (`~/homepage`), never from deeper paths. Code needed on both sides is duplicated.
