# Docs Editor

The Docs Editor will be presented by Docs in a sandboxed iframe via for example docs-editor.proton.me.

The editor establishes a bidirectional line of communication with the parent Docs client via the PostMesasge API.

More information can be found in the design doc here: https://confluence.protontech.ch/pages/viewpage.action?pageId=182012028#ProtonDocsDesignDocClientandAPI-Editorsandbox

## Standalone Sheet development

See [STANDALONE_SHEET.md](./src/standalone-sheet/STANDALONE_SHEET.md) for a localhost entry that runs the Sheets editor without the Docs shell or RTS.

## Standalone Docs development

See [STANDALONE_DOC.md](./src/standalone-doc/STANDALONE_DOC.md) for a localhost entry that runs Docs with an in-memory document and no parent bridge or RTS.
