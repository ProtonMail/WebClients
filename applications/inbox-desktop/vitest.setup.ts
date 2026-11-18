// The shared URL matcher relies on `Uint8Array.fromBase64`, which Node < 25 lacks (Electron has it).
import "core-js/proposals/array-buffer-base64";
import "./src/utils/tests/electronMock";
import "./src/utils/tests/electronStoreMock";
import "./src/utils/tests/sentryMock";
