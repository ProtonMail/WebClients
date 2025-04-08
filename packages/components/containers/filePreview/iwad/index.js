var Module = typeof Module != 'undefined' ? Module : {};
var ENVIRONMENT_IS_WEB = typeof window == 'object';
var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != 'undefined';
var ENVIRONMENT_IS_NODE =
    typeof process == 'object' &&
    typeof process.versions == 'object' &&
    typeof process.versions.node == 'string' &&
    process.type != 'renderer';
if (ENVIRONMENT_IS_NODE) {
}
Module['expectedDataFileDownloads'] ??= 0;
Module['expectedDataFileDownloads']++;
(() => {
    var isPthread = typeof ENVIRONMENT_IS_PTHREAD != 'undefined' && ENVIRONMENT_IS_PTHREAD;
    var isWasmWorker = typeof ENVIRONMENT_IS_WASM_WORKER != 'undefined' && ENVIRONMENT_IS_WASM_WORKER;
    if (isPthread || isWasmWorker) return;
    var isNode =
        typeof process === 'object' &&
        typeof process.versions === 'object' &&
        typeof process.versions.node === 'string';
    function loadPackage(metadata) {
        var PACKAGE_PATH = '';
        if (typeof window === 'object') {
            PACKAGE_PATH = window['encodeURIComponent'](
                window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + '/'
            );
        } else if (typeof process === 'undefined' && typeof location !== 'undefined') {
            PACKAGE_PATH = encodeURIComponent(location.pathname.substring(0, location.pathname.lastIndexOf('/')) + '/');
        }
        var PACKAGE_NAME = '../index.data';
        var REMOTE_PACKAGE_BASE = 'index.data';
        var REMOTE_PACKAGE_NAME = Module['locateFile']
            ? Module['locateFile'](REMOTE_PACKAGE_BASE, '')
            : REMOTE_PACKAGE_BASE;
        var REMOTE_PACKAGE_SIZE = metadata['remote_package_size'];
        function fetchRemotePackage(packageName, packageSize, callback, errback) {
            if (isNode) {
                require('fs').readFile(packageName, (err, contents) => {
                    if (err) {
                        errback(err);
                    } else {
                        callback(contents.buffer);
                    }
                });
                return;
            }
            Module['dataFileDownloads'] ??= {};
            fetch(packageName)
                .catch((cause) => Promise.reject(new Error(`Network Error: ${packageName}`, { cause })))
                .then((response) => {
                    if (!response.ok) {
                        return Promise.reject(new Error(`${response.status}: ${response.url}`));
                    }
                    if (!response.body && response.arrayBuffer) {
                        return response.arrayBuffer().then(callback);
                    }
                    const reader = response.body.getReader();
                    const iterate = () =>
                        reader
                            .read()
                            .then(handleChunk)
                            .catch((cause) =>
                                Promise.reject(
                                    new Error(`Unexpected error while handling : ${response.url} ${cause}`, { cause })
                                )
                            );
                    const chunks = [];
                    const headers = response.headers;
                    const total = Number(headers.get('Content-Length') ?? packageSize);
                    let loaded = 0;
                    const handleChunk = ({ done, value }) => {
                        if (!done) {
                            chunks.push(value);
                            loaded += value.length;
                            Module['dataFileDownloads'][packageName] = { loaded, total };
                            let totalLoaded = 0;
                            let totalSize = 0;
                            for (const download of Object.values(Module['dataFileDownloads'])) {
                                totalLoaded += download.loaded;
                                totalSize += download.total;
                            }
                            Module['setStatus']?.(`Downloading data... (${totalLoaded}/${totalSize})`);
                            return iterate();
                        } else {
                            const packageData = new Uint8Array(chunks.map((c) => c.length).reduce((a, b) => a + b, 0));
                            let offset = 0;
                            for (const chunk of chunks) {
                                packageData.set(chunk, offset);
                                offset += chunk.length;
                            }
                            callback(packageData.buffer);
                        }
                    };
                    Module['setStatus']?.('Downloading data...');
                    return iterate();
                });
        }
        function handleError(error) {
            console.error('package error:', error);
        }
        var fetchedCallback = null;
        var fetched = Module['getPreloadedPackage']
            ? Module['getPreloadedPackage'](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE)
            : null;
        if (!fetched)
            fetchRemotePackage(
                REMOTE_PACKAGE_NAME,
                REMOTE_PACKAGE_SIZE,
                (data) => {
                    if (fetchedCallback) {
                        fetchedCallback(data);
                        fetchedCallback = null;
                    } else {
                        fetched = data;
                    }
                },
                handleError
            );
        function runWithFS(Module) {
            function assert(check, msg) {
                if (!check) throw msg + new Error().stack;
            }
            Module['FS_createPath']('/', 'defaults', true, true);
            function DataRequest(start, end, audio) {
                this.start = start;
                this.end = end;
                this.audio = audio;
            }
            DataRequest.prototype = {
                requests: {},
                open: function (mode, name) {
                    this.name = name;
                    this.requests[name] = this;
                    Module['addRunDependency'](`fp ${this.name}`);
                },
                send: function () {},
                onload: function () {
                    var byteArray = this.byteArray.subarray(this.start, this.end);
                    this.finish(byteArray);
                },
                finish: function (byteArray) {
                    var that = this;
                    Module['FS_createDataFile'](this.name, null, byteArray, true, true, true);
                    Module['removeRunDependency'](`fp ${that.name}`);
                    this.requests[this.name] = null;
                },
            };
            var files = metadata['files'];
            for (var i = 0; i < files.length; ++i) {
                new DataRequest(files[i]['start'], files[i]['end'], files[i]['audio'] || 0).open(
                    'GET',
                    files[i]['filename']
                );
            }
            function processPackageData(arrayBuffer) {
                assert(arrayBuffer, 'Loading data file failed.');
                assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData');
                var byteArray = new Uint8Array(arrayBuffer);
                DataRequest.prototype.byteArray = byteArray;
                var files = metadata['files'];
                for (var i = 0; i < files.length; ++i) {
                    DataRequest.prototype.requests[files[i].filename].onload();
                }
                Module['removeRunDependency']('datafile_../index.data');
            }
            Module['addRunDependency']('datafile_../index.data');
            Module['preloadResults'] ??= {};
            Module['preloadResults'][PACKAGE_NAME] = { fromCache: false };
            if (fetched) {
                processPackageData(fetched);
                fetched = null;
            } else {
                fetchedCallback = processPackageData;
            }
        }
        if (Module['calledRun']) {
            runWithFS(Module);
        } else {
            (Module['preRun'] ??= []).push(runWithFS);
        }
    }
    loadPackage({
        files: [
            { filename: '/defaults/prboomX.cfg', start: 0, end: 1432 },
            { filename: '/prboomx.wad', start: 1432, end: 471655 },
        ],
        remote_package_size: 471655,
    });
})();
var moduleOverrides = Object.assign({}, Module);
var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
    throw toThrow;
};
var scriptDirectory = '';
function locateFile(path) {
    if (Module['locateFile']) {
        return Module['locateFile'](path, scriptDirectory);
    }
    return scriptDirectory + path;
}
var readAsync, readBinary;
if (ENVIRONMENT_IS_NODE) {
    var fs = require('fs');
    var nodePath = require('path');
    scriptDirectory = __dirname + '/';
    readBinary = (filename) => {
        filename = isFileURI(filename) ? new URL(filename) : filename;
        var ret = fs.readFileSync(filename);
        return ret;
    };
    readAsync = async (filename, binary = true) => {
        filename = isFileURI(filename) ? new URL(filename) : filename;
        var ret = fs.readFileSync(filename, binary ? undefined : 'utf8');
        return ret;
    };
    if (!Module['thisProgram'] && process.argv.length > 1) {
        thisProgram = process.argv[1].replace(/\\/g, '/');
    }
    arguments_ = process.argv.slice(2);
    if (typeof module != 'undefined') {
        module['exports'] = Module;
    }
    quit_ = (status, toThrow) => {
        process.exitCode = status;
        throw toThrow;
    };
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href;
    } else if (typeof document != 'undefined' && document.currentScript) {
        scriptDirectory = document.currentScript.src;
    }
    if (scriptDirectory.startsWith('blob:')) {
        scriptDirectory = '';
    } else {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, '').lastIndexOf('/') + 1);
    }
    {
        if (ENVIRONMENT_IS_WORKER) {
            readBinary = (url) => {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                xhr.responseType = 'arraybuffer';
                xhr.send(null);
                return new Uint8Array(xhr.response);
            };
        }
        readAsync = async (url) => {
            if (isFileURI(url)) {
                return new Promise((resolve, reject) => {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.responseType = 'arraybuffer';
                    xhr.onload = () => {
                        if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
                            resolve(xhr.response);
                            return;
                        }
                        reject(xhr.status);
                    };
                    xhr.onerror = reject;
                    xhr.send(null);
                });
            }
            var response = await fetch(url, { credentials: 'same-origin' });
            if (response.ok) {
                return response.arrayBuffer();
            }
            throw new Error(response.status + ' : ' + response.url);
        };
    }
} else {
}
var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.error.bind(console);
Object.assign(Module, moduleOverrides);
moduleOverrides = null;
if (Module['arguments']) arguments_ = Module['arguments'];
if (Module['thisProgram']) thisProgram = Module['thisProgram'];
var wasmBinary = Module['wasmBinary'];
var wasmMemory;
var ABORT = false;
var EXITSTATUS;
function assert(condition, text) {
    if (!condition) {
        abort(text);
    }
}
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAP64, HEAPU64, HEAPF64;
var runtimeInitialized = false;
var dataURIPrefix = 'data:application/octet-stream;base64,';
var isDataURI = (filename) => filename.startsWith(dataURIPrefix);
var isFileURI = (filename) => filename.startsWith('file://');
function updateMemoryViews() {
    var b = wasmMemory.buffer;
    Module['HEAP8'] = HEAP8 = new Int8Array(b);
    Module['HEAP16'] = HEAP16 = new Int16Array(b);
    Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
    Module['HEAPU16'] = HEAPU16 = new Uint16Array(b);
    Module['HEAP32'] = HEAP32 = new Int32Array(b);
    Module['HEAPU32'] = HEAPU32 = new Uint32Array(b);
    Module['HEAPF32'] = HEAPF32 = new Float32Array(b);
    Module['HEAPF64'] = HEAPF64 = new Float64Array(b);
    Module['HEAP64'] = HEAP64 = new BigInt64Array(b);
    Module['HEAPU64'] = HEAPU64 = new BigUint64Array(b);
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATPOSTRUN__ = [];
function preRun() {
    if (Module['preRun']) {
        if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
        while (Module['preRun'].length) {
            addOnPreRun(Module['preRun'].shift());
        }
    }
    callRuntimeCallbacks(__ATPRERUN__);
}
function initRuntime() {
    runtimeInitialized = true;
    if (!Module['noFSInit'] && !FS.initialized) FS.init();
    FS.ignorePermissions = false;
    TTY.init();
    PIPEFS.root = FS.mount(PIPEFS, {}, null);
    callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
    callRuntimeCallbacks(__ATMAIN__);
}
function postRun() {
    if (Module['postRun']) {
        if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
        while (Module['postRun'].length) {
            addOnPostRun(Module['postRun'].shift());
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb);
}
function addOnInit(cb) {
    __ATINIT__.unshift(cb);
}
function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb);
}
var runDependencies = 0;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
    return id;
}
function addRunDependency(id) {
    runDependencies++;
    Module['monitorRunDependencies']?.(runDependencies);
}
function removeRunDependency(id) {
    runDependencies--;
    Module['monitorRunDependencies']?.(runDependencies);
    if (runDependencies == 0) {
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback();
        }
    }
}
function abort(what) {
    Module['onAbort']?.(what);
    what = 'Aborted(' + what + ')';
    err(what);
    ABORT = true;
    what += '. Build with -sASSERTIONS for more info.';
    var e = new WebAssembly.RuntimeError(what);
    throw e;
}
var wasmBinaryFile;
function findWasmBinary() {
    var f = 'index.wasm';
    if (!isDataURI(f)) {
        return locateFile(f);
    }
    return f;
}
function getBinarySync(file) {
    if (file == wasmBinaryFile && wasmBinary) {
        return new Uint8Array(wasmBinary);
    }
    if (readBinary) {
        return readBinary(file);
    }
    throw 'both async and sync fetching of the wasm failed';
}
async function getWasmBinary(binaryFile) {
    if (!wasmBinary) {
        try {
            var response = await readAsync(binaryFile);
            return new Uint8Array(response);
        } catch {}
    }
    return getBinarySync(binaryFile);
}
async function instantiateArrayBuffer(binaryFile, imports) {
    try {
        var binary = await getWasmBinary(binaryFile);
        var instance = await WebAssembly.instantiate(binary, imports);
        return instance;
    } catch (reason) {
        err(`failed to asynchronously prepare wasm: ${reason}`);
        abort(reason);
    }
}
async function instantiateAsync(binary, binaryFile, imports) {
    if (
        !binary &&
        typeof WebAssembly.instantiateStreaming == 'function' &&
        !isDataURI(binaryFile) &&
        !isFileURI(binaryFile) &&
        !ENVIRONMENT_IS_NODE
    ) {
        try {
            var response = fetch(binaryFile, { credentials: 'same-origin' });
            var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
            return instantiationResult;
        } catch (reason) {
            err(`wasm streaming compile failed: ${reason}`);
            err('falling back to ArrayBuffer instantiation');
        }
    }
    return instantiateArrayBuffer(binaryFile, imports);
}
function getWasmImports() {
    return { a: wasmImports };
}
async function createWasm() {
    function receiveInstance(instance, module) {
        wasmExports = instance.exports;
        wasmMemory = wasmExports['Qd'];
        updateMemoryViews();
        wasmTable = wasmExports['Sd'];
        addOnInit(wasmExports['Rd']);
        removeRunDependency('wasm-instantiate');
        return wasmExports;
    }
    addRunDependency('wasm-instantiate');
    function receiveInstantiationResult(result) {
        return receiveInstance(result['instance']);
    }
    var info = getWasmImports();
    if (Module['instantiateWasm']) {
        try {
            return Module['instantiateWasm'](info, receiveInstance);
        } catch (e) {
            err(`Module.instantiateWasm callback failed with error: ${e}`);
            return false;
        }
    }
    wasmBinaryFile ??= findWasmBinary();
    var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
    var exports = receiveInstantiationResult(result);
    return exports;
}
var ASM_CONSTS = {
    608072: () => {
        Module.restore_busy = 1;
        FS.mkdir('/dwasm');
        FS.mount(IDBFS, {}, '/dwasm');
        console.info('Loading data...');
        FS.syncfs(true, function (err) {
            if (err) console.warn('Failed to load data:', err);
            else console.info('Data loaded.');
            Module.restore_busy = 0;
        });
    },
    608329: () => Module.restore_busy,
    608357: () => {
        console.info('Saving data...');
        FS.syncfs(function (err) {
            if (err) console.warn('Failed to save data:', err);
            else console.info('Data saved.');
        });
    },
    608505: () => {
        if (typeof Module.hideConsole === 'function') Module.hideConsole();
    },
    608573: () => {
        if (typeof Module.showConsole === 'function') Module.showConsole();
    },
    608641: () => {
        if (typeof Module.winResized === 'function') Module.winResized();
    },
    608707: () => {
        if (typeof Module.captureMouse === 'function') Module.captureMouse();
    },
    608777: ($0) => {
        var str = UTF8ToString($0) + '\n\n' + 'Abort/Retry/Ignore/AlwaysIgnore? [ariA] :';
        var reply = window.prompt(str, 'i');
        if (reply === null) {
            reply = 'i';
        }
        return allocate(intArrayFromString(reply), 'i8', ALLOC_NORMAL);
    },
    609002: () => {
        if (typeof AudioContext !== 'undefined') {
            return true;
        } else if (typeof webkitAudioContext !== 'undefined') {
            return true;
        }
        return false;
    },
    609149: () => {
        if (
            typeof navigator.mediaDevices !== 'undefined' &&
            typeof navigator.mediaDevices.getUserMedia !== 'undefined'
        ) {
            return true;
        } else if (typeof navigator.webkitGetUserMedia !== 'undefined') {
            return true;
        }
        return false;
    },
    609383: ($0) => {
        if (typeof Module['SDL2'] === 'undefined') {
            Module['SDL2'] = {};
        }
        var SDL2 = Module['SDL2'];
        if (!$0) {
            SDL2.audio = {};
        } else {
            SDL2.capture = {};
        }
        if (!SDL2.audioContext) {
            if (typeof AudioContext !== 'undefined') {
                SDL2.audioContext = new AudioContext();
            } else if (typeof webkitAudioContext !== 'undefined') {
                SDL2.audioContext = new webkitAudioContext();
            }
            if (SDL2.audioContext) {
                if (typeof navigator.userActivation === 'undefined') {
                    autoResumeAudioContext(SDL2.audioContext);
                }
            }
        }
        return SDL2.audioContext === undefined ? -1 : 0;
    },
    609935: () => {
        var SDL2 = Module['SDL2'];
        return SDL2.audioContext.sampleRate;
    },
    610003: ($0, $1, $2, $3) => {
        var SDL2 = Module['SDL2'];
        var have_microphone = function (stream) {
            if (SDL2.capture.silenceTimer !== undefined) {
                clearInterval(SDL2.capture.silenceTimer);
                SDL2.capture.silenceTimer = undefined;
                SDL2.capture.silenceBuffer = undefined;
            }
            SDL2.capture.mediaStreamNode = SDL2.audioContext.createMediaStreamSource(stream);
            SDL2.capture.scriptProcessorNode = SDL2.audioContext.createScriptProcessor($1, $0, 1);
            SDL2.capture.scriptProcessorNode.onaudioprocess = function (audioProcessingEvent) {
                if (SDL2 === undefined || SDL2.capture === undefined) {
                    return;
                }
                audioProcessingEvent.outputBuffer.getChannelData(0).fill(0);
                SDL2.capture.currentCaptureBuffer = audioProcessingEvent.inputBuffer;
                dynCall('vi', $2, [$3]);
            };
            SDL2.capture.mediaStreamNode.connect(SDL2.capture.scriptProcessorNode);
            SDL2.capture.scriptProcessorNode.connect(SDL2.audioContext.destination);
            SDL2.capture.stream = stream;
        };
        var no_microphone = function (error) {};
        SDL2.capture.silenceBuffer = SDL2.audioContext.createBuffer($0, $1, SDL2.audioContext.sampleRate);
        SDL2.capture.silenceBuffer.getChannelData(0).fill(0);
        var silence_callback = function () {
            SDL2.capture.currentCaptureBuffer = SDL2.capture.silenceBuffer;
            dynCall('vi', $2, [$3]);
        };
        SDL2.capture.silenceTimer = setInterval(silence_callback, ($1 / SDL2.audioContext.sampleRate) * 1e3);
        if (navigator.mediaDevices !== undefined && navigator.mediaDevices.getUserMedia !== undefined) {
            navigator.mediaDevices
                .getUserMedia({ audio: true, video: false })
                .then(have_microphone)
                .catch(no_microphone);
        } else if (navigator.webkitGetUserMedia !== undefined) {
            navigator.webkitGetUserMedia({ audio: true, video: false }, have_microphone, no_microphone);
        }
    },
    611696: ($0, $1, $2, $3) => {
        var SDL2 = Module['SDL2'];
        SDL2.audio.scriptProcessorNode = SDL2.audioContext['createScriptProcessor']($1, 0, $0);
        SDL2.audio.scriptProcessorNode['onaudioprocess'] = function (e) {
            if (SDL2 === undefined || SDL2.audio === undefined) {
                return;
            }
            if (SDL2.audio.silenceTimer !== undefined) {
                clearInterval(SDL2.audio.silenceTimer);
                SDL2.audio.silenceTimer = undefined;
                SDL2.audio.silenceBuffer = undefined;
            }
            SDL2.audio.currentOutputBuffer = e['outputBuffer'];
            dynCall('vi', $2, [$3]);
        };
        SDL2.audio.scriptProcessorNode['connect'](SDL2.audioContext['destination']);
        if (SDL2.audioContext.state === 'suspended') {
            SDL2.audio.silenceBuffer = SDL2.audioContext.createBuffer($0, $1, SDL2.audioContext.sampleRate);
            SDL2.audio.silenceBuffer.getChannelData(0).fill(0);
            var silence_callback = function () {
                if (typeof navigator.userActivation !== 'undefined') {
                    if (navigator.userActivation.hasBeenActive) {
                        SDL2.audioContext.resume();
                    }
                }
                SDL2.audio.currentOutputBuffer = SDL2.audio.silenceBuffer;
                dynCall('vi', $2, [$3]);
                SDL2.audio.currentOutputBuffer = undefined;
            };
            SDL2.audio.silenceTimer = setInterval(silence_callback, ($1 / SDL2.audioContext.sampleRate) * 1e3);
        }
    },
    612871: ($0, $1) => {
        var SDL2 = Module['SDL2'];
        var numChannels = SDL2.capture.currentCaptureBuffer.numberOfChannels;
        for (var c = 0; c < numChannels; ++c) {
            var channelData = SDL2.capture.currentCaptureBuffer.getChannelData(c);
            if (channelData.length != $1) {
                throw (
                    'Web Audio capture buffer length mismatch! Destination size: ' +
                    channelData.length +
                    ' samples vs expected ' +
                    $1 +
                    ' samples!'
                );
            }
            if (numChannels == 1) {
                for (var j = 0; j < $1; ++j) {
                    setValue($0 + j * 4, channelData[j], 'float');
                }
            } else {
                for (var j = 0; j < $1; ++j) {
                    setValue($0 + (j * numChannels + c) * 4, channelData[j], 'float');
                }
            }
        }
    },
    613476: ($0, $1) => {
        var SDL2 = Module['SDL2'];
        var buf = $0 >>> 2;
        var numChannels = SDL2.audio.currentOutputBuffer['numberOfChannels'];
        for (var c = 0; c < numChannels; ++c) {
            var channelData = SDL2.audio.currentOutputBuffer['getChannelData'](c);
            if (channelData.length != $1) {
                throw (
                    'Web Audio output buffer length mismatch! Destination size: ' +
                    channelData.length +
                    ' samples vs expected ' +
                    $1 +
                    ' samples!'
                );
            }
            for (var j = 0; j < $1; ++j) {
                channelData[j] = HEAPF32[buf + (j * numChannels + c)];
            }
        }
    },
    613965: ($0) => {
        var SDL2 = Module['SDL2'];
        if ($0) {
            if (SDL2.capture.silenceTimer !== undefined) {
                clearInterval(SDL2.capture.silenceTimer);
            }
            if (SDL2.capture.stream !== undefined) {
                var tracks = SDL2.capture.stream.getAudioTracks();
                for (var i = 0; i < tracks.length; i++) {
                    SDL2.capture.stream.removeTrack(tracks[i]);
                }
            }
            if (SDL2.capture.scriptProcessorNode !== undefined) {
                SDL2.capture.scriptProcessorNode.onaudioprocess = function (audioProcessingEvent) {};
                SDL2.capture.scriptProcessorNode.disconnect();
            }
            if (SDL2.capture.mediaStreamNode !== undefined) {
                SDL2.capture.mediaStreamNode.disconnect();
            }
            SDL2.capture = undefined;
        } else {
            if (SDL2.audio.scriptProcessorNode != undefined) {
                SDL2.audio.scriptProcessorNode.disconnect();
            }
            if (SDL2.audio.silenceTimer !== undefined) {
                clearInterval(SDL2.audio.silenceTimer);
            }
            SDL2.audio = undefined;
        }
        if (SDL2.audioContext !== undefined && SDL2.audio === undefined && SDL2.capture === undefined) {
            SDL2.audioContext.close();
            SDL2.audioContext = undefined;
        }
    },
    614971: ($0, $1, $2) => {
        var w = $0;
        var h = $1;
        var pixels = $2;
        if (!Module['SDL2']) Module['SDL2'] = {};
        var SDL2 = Module['SDL2'];
        if (SDL2.ctxCanvas !== Module['canvas']) {
            SDL2.ctx = Module['createContext'](Module['canvas'], false, true);
            SDL2.ctxCanvas = Module['canvas'];
        }
        if (SDL2.w !== w || SDL2.h !== h || SDL2.imageCtx !== SDL2.ctx) {
            SDL2.image = SDL2.ctx.createImageData(w, h);
            SDL2.w = w;
            SDL2.h = h;
            SDL2.imageCtx = SDL2.ctx;
        }
        var data = SDL2.image.data;
        var src = pixels / 4;
        var dst = 0;
        var num;
        if (typeof CanvasPixelArray !== 'undefined' && data instanceof CanvasPixelArray) {
            num = data.length;
            while (dst < num) {
                var val = HEAP32[src];
                data[dst] = val & 255;
                data[dst + 1] = (val >> 8) & 255;
                data[dst + 2] = (val >> 16) & 255;
                data[dst + 3] = 255;
                src++;
                dst += 4;
            }
        } else {
            if (SDL2.data32Data !== data) {
                SDL2.data32 = new Int32Array(data.buffer);
                SDL2.data8 = new Uint8Array(data.buffer);
                SDL2.data32Data = data;
            }
            var data32 = SDL2.data32;
            num = data32.length;
            data32.set(HEAP32.subarray(src, src + num));
            var data8 = SDL2.data8;
            var i = 3;
            var j = i + 4 * num;
            if (num % 8 == 0) {
                while (i < j) {
                    data8[i] = 255;
                    i = (i + 4) | 0;
                    data8[i] = 255;
                    i = (i + 4) | 0;
                    data8[i] = 255;
                    i = (i + 4) | 0;
                    data8[i] = 255;
                    i = (i + 4) | 0;
                    data8[i] = 255;
                    i = (i + 4) | 0;
                    data8[i] = 255;
                    i = (i + 4) | 0;
                    data8[i] = 255;
                    i = (i + 4) | 0;
                    data8[i] = 255;
                    i = (i + 4) | 0;
                }
            } else {
                while (i < j) {
                    data8[i] = 255;
                    i = (i + 4) | 0;
                }
            }
        }
        SDL2.ctx.putImageData(SDL2.image, 0, 0);
    },
    616439: ($0, $1, $2, $3, $4) => {
        var w = $0;
        var h = $1;
        var hot_x = $2;
        var hot_y = $3;
        var pixels = $4;
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        var image = ctx.createImageData(w, h);
        var data = image.data;
        var src = pixels / 4;
        var dst = 0;
        var num;
        if (typeof CanvasPixelArray !== 'undefined' && data instanceof CanvasPixelArray) {
            num = data.length;
            while (dst < num) {
                var val = HEAP32[src];
                data[dst] = val & 255;
                data[dst + 1] = (val >> 8) & 255;
                data[dst + 2] = (val >> 16) & 255;
                data[dst + 3] = (val >> 24) & 255;
                src++;
                dst += 4;
            }
        } else {
            var data32 = new Int32Array(data.buffer);
            num = data32.length;
            data32.set(HEAP32.subarray(src, src + num));
        }
        ctx.putImageData(image, 0, 0);
        var url =
            hot_x === 0 && hot_y === 0
                ? 'url(' + canvas.toDataURL() + '), auto'
                : 'url(' + canvas.toDataURL() + ') ' + hot_x + ' ' + hot_y + ', auto';
        var urlBuf = _malloc(url.length + 1);
        stringToUTF8(url, urlBuf, url.length + 1);
        return urlBuf;
    },
    617427: ($0) => {
        if (Module['canvas']) {
            Module['canvas'].style['cursor'] = UTF8ToString($0);
        }
    },
    617510: () => {
        if (Module['canvas']) {
            Module['canvas'].style['cursor'] = 'none';
        }
    },
    617579: () => window.innerWidth,
    617609: () => window.innerHeight,
};
class ExitStatus {
    name = 'ExitStatus';
    constructor(status) {
        this.message = `Program terminated with exit(${status})`;
        this.status = status;
    }
}
var callRuntimeCallbacks = (callbacks) => {
    while (callbacks.length > 0) {
        callbacks.shift()(Module);
    }
};
var noExitRuntime = Module['noExitRuntime'] || true;
function setValue(ptr, value, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
        case 'i1':
            HEAP8[ptr] = value;
            break;
        case 'i8':
            HEAP8[ptr] = value;
            break;
        case 'i16':
            HEAP16[ptr >> 1] = value;
            break;
        case 'i32':
            HEAP32[ptr >> 2] = value;
            break;
        case 'i64':
            HEAP64[ptr >> 3] = BigInt(value);
            break;
        case 'float':
            HEAPF32[ptr >> 2] = value;
            break;
        case 'double':
            HEAPF64[ptr >> 3] = value;
            break;
        case '*':
            HEAPU32[ptr >> 2] = value;
            break;
        default:
            abort(`invalid type for setValue: ${type}`);
    }
}
var stackRestore = (val) => __emscripten_stack_restore(val);
var stackSave = () => _emscripten_stack_get_current();
var PATH = {
    isAbs: (path) => path.charAt(0) === '/',
    splitPath: (filename) => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
    },
    normalizeArray: (parts, allowAboveRoot) => {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === '.') {
                parts.splice(i, 1);
            } else if (last === '..') {
                parts.splice(i, 1);
                up++;
            } else if (up) {
                parts.splice(i, 1);
                up--;
            }
        }
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift('..');
            }
        }
        return parts;
    },
    normalize: (path) => {
        var isAbsolute = PATH.isAbs(path),
            trailingSlash = path.substr(-1) === '/';
        path = PATH.normalizeArray(
            path.split('/').filter((p) => !!p),
            !isAbsolute
        ).join('/');
        if (!path && !isAbsolute) {
            path = '.';
        }
        if (path && trailingSlash) {
            path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
    },
    dirname: (path) => {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
            return '.';
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
    },
    basename: (path) => path && path.match(/([^\/]+|\/)\/*$/)[1],
    join: (...paths) => PATH.normalize(paths.join('/')),
    join2: (l, r) => PATH.normalize(l + '/' + r),
};
var initRandomFill = () => {
    if (ENVIRONMENT_IS_NODE) {
        var nodeCrypto = require('crypto');
        return (view) => nodeCrypto.randomFillSync(view);
    }
    return (view) => crypto.getRandomValues(view);
};
var randomFill = (view) => {
    (randomFill = initRandomFill())(view);
};
var PATH_FS = {
    resolve: (...args) => {
        var resolvedPath = '',
            resolvedAbsolute = false;
        for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? args[i] : FS.cwd();
            if (typeof path != 'string') {
                throw new TypeError('Arguments to path.resolve must be strings');
            } else if (!path) {
                return '';
            }
            resolvedPath = path + '/' + resolvedPath;
            resolvedAbsolute = PATH.isAbs(path);
        }
        resolvedPath = PATH.normalizeArray(
            resolvedPath.split('/').filter((p) => !!p),
            !resolvedAbsolute
        ).join('/');
        return (resolvedAbsolute ? '/' : '') + resolvedPath || '.';
    },
    relative: (from, to) => {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== '') break;
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== '') break;
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break;
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
    },
};
var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder() : undefined;
var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead = NaN) => {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
    }
    var str = '';
    while (idx < endPtr) {
        var u0 = heapOrArray[idx++];
        if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue;
        }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 224) == 192) {
            str += String.fromCharCode(((u0 & 31) << 6) | u1);
            continue;
        }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 240) == 224) {
            u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
            u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
        if (u0 < 65536) {
            str += String.fromCharCode(u0);
        } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
        }
    }
    return str;
};
var FS_stdin_getChar_buffer = [];
var lengthBytesUTF8 = (str) => {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var c = str.charCodeAt(i);
        if (c <= 127) {
            len++;
        } else if (c <= 2047) {
            len += 2;
        } else if (c >= 55296 && c <= 57343) {
            len += 4;
            ++i;
        } else {
            len += 3;
        }
    }
    return len;
};
var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
        }
        if (u <= 127) {
            if (outIdx >= endIdx) break;
            heap[outIdx++] = u;
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            heap[outIdx++] = 192 | (u >> 6);
            heap[outIdx++] = 128 | (u & 63);
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            heap[outIdx++] = 224 | (u >> 12);
            heap[outIdx++] = 128 | ((u >> 6) & 63);
            heap[outIdx++] = 128 | (u & 63);
        } else {
            if (outIdx + 3 >= endIdx) break;
            heap[outIdx++] = 240 | (u >> 18);
            heap[outIdx++] = 128 | ((u >> 12) & 63);
            heap[outIdx++] = 128 | ((u >> 6) & 63);
            heap[outIdx++] = 128 | (u & 63);
        }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx;
};
function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array;
}
var FS_stdin_getChar = () => {
    if (!FS_stdin_getChar_buffer.length) {
        var result = null;
        if (ENVIRONMENT_IS_NODE) {
            var BUFSIZE = 256;
            var buf = Buffer.alloc(BUFSIZE);
            var bytesRead = 0;
            var fd = process.stdin.fd;
            try {
                bytesRead = fs.readSync(fd, buf, 0, BUFSIZE);
            } catch (e) {
                if (e.toString().includes('EOF')) bytesRead = 0;
                else throw e;
            }
            if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
            }
        } else if (typeof window != 'undefined' && typeof window.prompt == 'function') {
            result = window.prompt('Input: ');
            if (result !== null) {
                result += '\n';
            }
        } else {
        }
        if (!result) {
            return null;
        }
        FS_stdin_getChar_buffer = intArrayFromString(result, true);
    }
    return FS_stdin_getChar_buffer.shift();
};
var TTY = {
    ttys: [],
    init() {},
    shutdown() {},
    register(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops };
        FS.registerDevice(dev, TTY.stream_ops);
    },
    stream_ops: {
        open(stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(43);
            }
            stream.tty = tty;
            stream.seekable = false;
        },
        close(stream) {
            stream.tty.ops.fsync(stream.tty);
        },
        fsync(stream) {
            stream.tty.ops.fsync(stream.tty);
        },
        read(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(60);
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty);
                } catch (e) {
                    throw new FS.ErrnoError(29);
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(6);
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result;
            }
            if (bytesRead) {
                stream.node.atime = Date.now();
            }
            return bytesRead;
        },
        write(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(60);
            }
            try {
                for (var i = 0; i < length; i++) {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
                }
            } catch (e) {
                throw new FS.ErrnoError(29);
            }
            if (length) {
                stream.node.mtime = stream.node.ctime = Date.now();
            }
            return i;
        },
    },
    default_tty_ops: {
        get_char(tty) {
            return FS_stdin_getChar();
        },
        put_char(tty, val) {
            if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output));
                tty.output = [];
            } else {
                if (val != 0) tty.output.push(val);
            }
        },
        fsync(tty) {
            if (tty.output && tty.output.length > 0) {
                out(UTF8ArrayToString(tty.output));
                tty.output = [];
            }
        },
        ioctl_tcgets(tty) {
            return {
                c_iflag: 25856,
                c_oflag: 5,
                c_cflag: 191,
                c_lflag: 35387,
                c_cc: [
                    3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0,
                ],
            };
        },
        ioctl_tcsets(tty, optional_actions, data) {
            return 0;
        },
        ioctl_tiocgwinsz(tty) {
            return [24, 80];
        },
    },
    default_tty1_ops: {
        put_char(tty, val) {
            if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output));
                tty.output = [];
            } else {
                if (val != 0) tty.output.push(val);
            }
        },
        fsync(tty) {
            if (tty.output && tty.output.length > 0) {
                err(UTF8ArrayToString(tty.output));
                tty.output = [];
            }
        },
    },
};
var zeroMemory = (address, size) => {
    HEAPU8.fill(0, address, address + size);
};
var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
var mmapAlloc = (size) => {
    size = alignMemory(size, 65536);
    var ptr = _emscripten_builtin_memalign(65536, size);
    if (ptr) zeroMemory(ptr, size);
    return ptr;
};
var MEMFS = {
    ops_table: null,
    mount(mount) {
        return MEMFS.createNode(null, '/', 16895, 0);
    },
    createNode(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(63);
        }
        MEMFS.ops_table ||= {
            dir: {
                node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr,
                    lookup: MEMFS.node_ops.lookup,
                    mknod: MEMFS.node_ops.mknod,
                    rename: MEMFS.node_ops.rename,
                    unlink: MEMFS.node_ops.unlink,
                    rmdir: MEMFS.node_ops.rmdir,
                    readdir: MEMFS.node_ops.readdir,
                    symlink: MEMFS.node_ops.symlink,
                },
                stream: { llseek: MEMFS.stream_ops.llseek },
            },
            file: {
                node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr },
                stream: {
                    llseek: MEMFS.stream_ops.llseek,
                    read: MEMFS.stream_ops.read,
                    write: MEMFS.stream_ops.write,
                    allocate: MEMFS.stream_ops.allocate,
                    mmap: MEMFS.stream_ops.mmap,
                    msync: MEMFS.stream_ops.msync,
                },
            },
            link: {
                node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr,
                    readlink: MEMFS.node_ops.readlink,
                },
                stream: {},
            },
            chrdev: {
                node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr },
                stream: FS.chrdev_stream_ops,
            },
        };
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {};
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null;
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.atime = node.mtime = node.ctime = Date.now();
        if (parent) {
            parent.contents[name] = node;
            parent.atime = parent.mtime = parent.ctime = node.atime;
        }
        return node;
    },
    getFileDataAsTypedArray(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents);
    },
    expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
    },
    resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0;
        } else {
            var oldContents = node.contents;
            node.contents = new Uint8Array(newSize);
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
            }
            node.usedBytes = newSize;
        }
    },
    node_ops: {
        getattr(node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096;
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes;
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length;
            } else {
                attr.size = 0;
            }
            attr.atime = new Date(node.atime);
            attr.mtime = new Date(node.mtime);
            attr.ctime = new Date(node.ctime);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr;
        },
        setattr(node, attr) {
            for (const key of ['mode', 'atime', 'mtime', 'ctime']) {
                if (attr[key] != null) {
                    node[key] = attr[key];
                }
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size);
            }
        },
        lookup(parent, name) {
            throw MEMFS.doesNotExistError;
        },
        mknod(parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev);
        },
        rename(old_node, new_dir, new_name) {
            var new_node;
            try {
                new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {}
            if (new_node) {
                if (FS.isDir(old_node.mode)) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(55);
                    }
                }
                FS.hashRemoveNode(new_node);
            }
            delete old_node.parent.contents[old_node.name];
            new_dir.contents[new_name] = old_node;
            old_node.name = new_name;
            new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
        },
        unlink(parent, name) {
            delete parent.contents[name];
            parent.ctime = parent.mtime = Date.now();
        },
        rmdir(parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(55);
            }
            delete parent.contents[name];
            parent.ctime = parent.mtime = Date.now();
        },
        readdir(node) {
            return ['.', '..', ...Object.keys(node.contents)];
        },
        symlink(parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node;
        },
        readlink(node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(28);
            }
            return node.link;
        },
    },
    stream_ops: {
        read(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset);
            } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
            }
            return size;
        },
        write(stream, buffer, offset, length, position, canOwn) {
            if (buffer.buffer === HEAP8.buffer) {
                canOwn = false;
            }
            if (!length) return 0;
            var node = stream.node;
            node.mtime = node.ctime = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length;
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = buffer.slice(offset, offset + length);
                    node.usedBytes = length;
                    return length;
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length;
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) {
                node.contents.set(buffer.subarray(offset, offset + length), position);
            } else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i];
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length;
        },
        llseek(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position;
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes;
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(28);
            }
            return position;
        },
        allocate(stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },
        mmap(stream, length, position, prot, flags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43);
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && contents && contents.buffer === HEAP8.buffer) {
                allocated = false;
                ptr = contents.byteOffset;
            } else {
                allocated = true;
                ptr = mmapAlloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(48);
                }
                if (contents) {
                    if (position > 0 || position + length < contents.length) {
                        if (contents.subarray) {
                            contents = contents.subarray(position, position + length);
                        } else {
                            contents = Array.prototype.slice.call(contents, position, position + length);
                        }
                    }
                    HEAP8.set(contents, ptr);
                }
            }
            return { ptr, allocated };
        },
        msync(stream, buffer, offset, length, mmapFlags) {
            MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0;
        },
    },
};
var asyncLoad = async (url) => {
    var arrayBuffer = await readAsync(url);
    return new Uint8Array(arrayBuffer);
};
var FS_createDataFile = (parent, name, fileData, canRead, canWrite, canOwn) => {
    FS.createDataFile(parent, name, fileData, canRead, canWrite, canOwn);
};
var preloadPlugins = Module['preloadPlugins'] || [];
var FS_handledByPreloadPlugin = (byteArray, fullname, finish, onerror) => {
    if (typeof Browser != 'undefined') Browser.init();
    var handled = false;
    preloadPlugins.forEach((plugin) => {
        if (handled) return;
        if (plugin['canHandle'](fullname)) {
            plugin['handle'](byteArray, fullname, finish, onerror);
            handled = true;
        }
    });
    return handled;
};
var FS_createPreloadedFile = (
    parent,
    name,
    url,
    canRead,
    canWrite,
    onload,
    onerror,
    dontCreateFile,
    canOwn,
    preFinish
) => {
    var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
    var dep = getUniqueRunDependency(`cp ${fullname}`);
    function processData(byteArray) {
        function finish(byteArray) {
            preFinish?.();
            if (!dontCreateFile) {
                FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            onload?.();
            removeRunDependency(dep);
        }
        if (
            FS_handledByPreloadPlugin(byteArray, fullname, finish, () => {
                onerror?.();
                removeRunDependency(dep);
            })
        ) {
            return;
        }
        finish(byteArray);
    }
    addRunDependency(dep);
    if (typeof url == 'string') {
        asyncLoad(url).then(processData, onerror);
    } else {
        processData(url);
    }
};
var FS_modeStringToFlags = (str) => {
    var flagModes = { r: 0, 'r+': 2, w: 512 | 64 | 1, 'w+': 512 | 64 | 2, a: 1024 | 64 | 1, 'a+': 1024 | 64 | 2 };
    var flags = flagModes[str];
    if (typeof flags == 'undefined') {
        throw new Error(`Unknown file open mode: ${str}`);
    }
    return flags;
};
var FS_getMode = (canRead, canWrite) => {
    var mode = 0;
    if (canRead) mode |= 292 | 73;
    if (canWrite) mode |= 146;
    return mode;
};
var IDBFS = {
    dbs: {},
    indexedDB: () => {
        if (typeof indexedDB != 'undefined') return indexedDB;
        var ret = null;
        if (typeof window == 'object')
            ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        return ret;
    },
    DB_VERSION: 21,
    DB_STORE_NAME: 'FILE_DATA',
    queuePersist: (mount) => {
        function onPersistComplete() {
            if (mount.idbPersistState === 'again') startPersist();
            else mount.idbPersistState = 0;
        }
        function startPersist() {
            mount.idbPersistState = 'idb';
            IDBFS.syncfs(mount, false, onPersistComplete);
        }
        if (!mount.idbPersistState) {
            mount.idbPersistState = setTimeout(startPersist, 0);
        } else if (mount.idbPersistState === 'idb') {
            mount.idbPersistState = 'again';
        }
    },
    mount: (mount) => {
        var mnt = MEMFS.mount(mount);
        if (mount?.opts?.autoPersist) {
            mnt.idbPersistState = 0;
            var memfs_node_ops = mnt.node_ops;
            mnt.node_ops = Object.assign({}, mnt.node_ops);
            mnt.node_ops.mknod = (parent, name, mode, dev) => {
                var node = memfs_node_ops.mknod(parent, name, mode, dev);
                node.node_ops = mnt.node_ops;
                node.idbfs_mount = mnt.mount;
                node.memfs_stream_ops = node.stream_ops;
                node.stream_ops = Object.assign({}, node.stream_ops);
                node.stream_ops.write = (stream, buffer, offset, length, position, canOwn) => {
                    stream.node.isModified = true;
                    return node.memfs_stream_ops.write(stream, buffer, offset, length, position, canOwn);
                };
                node.stream_ops.close = (stream) => {
                    var n = stream.node;
                    if (n.isModified) {
                        IDBFS.queuePersist(n.idbfs_mount);
                        n.isModified = false;
                    }
                    if (n.memfs_stream_ops.close) return n.memfs_stream_ops.close(stream);
                };
                return node;
            };
            mnt.node_ops.mkdir = (...args) => (IDBFS.queuePersist(mnt.mount), memfs_node_ops.mkdir(...args));
            mnt.node_ops.rmdir = (...args) => (IDBFS.queuePersist(mnt.mount), memfs_node_ops.rmdir(...args));
            mnt.node_ops.symlink = (...args) => (IDBFS.queuePersist(mnt.mount), memfs_node_ops.symlink(...args));
            mnt.node_ops.unlink = (...args) => (IDBFS.queuePersist(mnt.mount), memfs_node_ops.unlink(...args));
            mnt.node_ops.rename = (...args) => (IDBFS.queuePersist(mnt.mount), memfs_node_ops.rename(...args));
        }
        return mnt;
    },
    syncfs: (mount, populate, callback) => {
        IDBFS.getLocalSet(mount, (err, local) => {
            if (err) return callback(err);
            IDBFS.getRemoteSet(mount, (err, remote) => {
                if (err) return callback(err);
                var src = populate ? remote : local;
                var dst = populate ? local : remote;
                IDBFS.reconcile(src, dst, callback);
            });
        });
    },
    quit: () => {
        Object.values(IDBFS.dbs).forEach((value) => value.close());
        IDBFS.dbs = {};
    },
    getDB: (name, callback) => {
        var db = IDBFS.dbs[name];
        if (db) {
            return callback(null, db);
        }
        var req;
        try {
            req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
            return callback(e);
        }
        if (!req) {
            return callback('Unable to connect to IndexedDB');
        }
        req.onupgradeneeded = (e) => {
            var db = e.target.result;
            var transaction = e.target.transaction;
            var fileStore;
            if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
            } else {
                fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
            }
            if (!fileStore.indexNames.contains('timestamp')) {
                fileStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
        req.onsuccess = () => {
            db = req.result;
            IDBFS.dbs[name] = db;
            callback(null, db);
        };
        req.onerror = (e) => {
            callback(e.target.error);
            e.preventDefault();
        };
    },
    getLocalSet: (mount, callback) => {
        var entries = {};
        function isRealDir(p) {
            return p !== '.' && p !== '..';
        }
        function toAbsolute(root) {
            return (p) => PATH.join2(root, p);
        }
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
        while (check.length) {
            var path = check.pop();
            var stat;
            try {
                stat = FS.stat(path);
            } catch (e) {
                return callback(e);
            }
            if (FS.isDir(stat.mode)) {
                check.push(...FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
            }
            entries[path] = { timestamp: stat.mtime };
        }
        return callback(null, { type: 'local', entries });
    },
    getRemoteSet: (mount, callback) => {
        var entries = {};
        IDBFS.getDB(mount.mountpoint, (err, db) => {
            if (err) return callback(err);
            try {
                var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
                transaction.onerror = (e) => {
                    callback(e.target.error);
                    e.preventDefault();
                };
                var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                var index = store.index('timestamp');
                index.openKeyCursor().onsuccess = (event) => {
                    var cursor = event.target.result;
                    if (!cursor) {
                        return callback(null, { type: 'remote', db, entries });
                    }
                    entries[cursor.primaryKey] = { timestamp: cursor.key };
                    cursor.continue();
                };
            } catch (e) {
                return callback(e);
            }
        });
    },
    loadLocalEntry: (path, callback) => {
        var stat, node;
        try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
        } catch (e) {
            return callback(e);
        }
        if (FS.isDir(stat.mode)) {
            return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
            node.contents = MEMFS.getFileDataAsTypedArray(node);
            return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
            return callback(new Error('node type not supported'));
        }
    },
    storeLocalEntry: (path, entry, callback) => {
        try {
            if (FS.isDir(entry['mode'])) {
                FS.mkdirTree(path, entry['mode']);
            } else if (FS.isFile(entry['mode'])) {
                FS.writeFile(path, entry['contents'], { canOwn: true });
            } else {
                return callback(new Error('node type not supported'));
            }
            FS.chmod(path, entry['mode']);
            FS.utime(path, entry['timestamp'], entry['timestamp']);
        } catch (e) {
            return callback(e);
        }
        callback(null);
    },
    removeLocalEntry: (path, callback) => {
        try {
            var stat = FS.stat(path);
            if (FS.isDir(stat.mode)) {
                FS.rmdir(path);
            } else if (FS.isFile(stat.mode)) {
                FS.unlink(path);
            }
        } catch (e) {
            return callback(e);
        }
        callback(null);
    },
    loadRemoteEntry: (store, path, callback) => {
        var req = store.get(path);
        req.onsuccess = (event) => callback(null, event.target.result);
        req.onerror = (e) => {
            callback(e.target.error);
            e.preventDefault();
        };
    },
    storeRemoteEntry: (store, path, entry, callback) => {
        try {
            var req = store.put(entry, path);
        } catch (e) {
            callback(e);
            return;
        }
        req.onsuccess = (event) => callback();
        req.onerror = (e) => {
            callback(e.target.error);
            e.preventDefault();
        };
    },
    removeRemoteEntry: (store, path, callback) => {
        var req = store.delete(path);
        req.onsuccess = (event) => callback();
        req.onerror = (e) => {
            callback(e.target.error);
            e.preventDefault();
        };
    },
    reconcile: (src, dst, callback) => {
        var total = 0;
        var create = [];
        Object.keys(src.entries).forEach((key) => {
            var e = src.entries[key];
            var e2 = dst.entries[key];
            if (!e2 || e['timestamp'].getTime() != e2['timestamp'].getTime()) {
                create.push(key);
                total++;
            }
        });
        var remove = [];
        Object.keys(dst.entries).forEach((key) => {
            if (!src.entries[key]) {
                remove.push(key);
                total++;
            }
        });
        if (!total) {
            return callback(null);
        }
        var errored = false;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        function done(err) {
            if (err && !errored) {
                errored = true;
                return callback(err);
            }
        }
        transaction.onerror = transaction.onabort = (e) => {
            done(e.target.error);
            e.preventDefault();
        };
        transaction.oncomplete = (e) => {
            if (!errored) {
                callback(null);
            }
        };
        create.sort().forEach((path) => {
            if (dst.type === 'local') {
                IDBFS.loadRemoteEntry(store, path, (err, entry) => {
                    if (err) return done(err);
                    IDBFS.storeLocalEntry(path, entry, done);
                });
            } else {
                IDBFS.loadLocalEntry(path, (err, entry) => {
                    if (err) return done(err);
                    IDBFS.storeRemoteEntry(store, path, entry, done);
                });
            }
        });
        remove
            .sort()
            .reverse()
            .forEach((path) => {
                if (dst.type === 'local') {
                    IDBFS.removeLocalEntry(path, done);
                } else {
                    IDBFS.removeRemoteEntry(store, path, done);
                }
            });
    },
};
var FS = {
    root: null,
    mounts: [],
    devices: {},
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: '/',
    initialized: false,
    ignorePermissions: true,
    ErrnoError: class {
        name = 'ErrnoError';
        constructor(errno) {
            this.errno = errno;
        }
    },
    filesystems: null,
    syncFSRequests: 0,
    readFiles: {},
    FSStream: class {
        shared = {};
        get object() {
            return this.node;
        }
        set object(val) {
            this.node = val;
        }
        get isRead() {
            return (this.flags & 2097155) !== 1;
        }
        get isWrite() {
            return (this.flags & 2097155) !== 0;
        }
        get isAppend() {
            return this.flags & 1024;
        }
        get flags() {
            return this.shared.flags;
        }
        set flags(val) {
            this.shared.flags = val;
        }
        get position() {
            return this.shared.position;
        }
        set position(val) {
            this.shared.position = val;
        }
    },
    FSNode: class {
        node_ops = {};
        stream_ops = {};
        readMode = 292 | 73;
        writeMode = 146;
        mounted = null;
        constructor(parent, name, mode, rdev) {
            if (!parent) {
                parent = this;
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.rdev = rdev;
            this.atime = this.mtime = this.ctime = Date.now();
        }
        get read() {
            return (this.mode & this.readMode) === this.readMode;
        }
        set read(val) {
            val ? (this.mode |= this.readMode) : (this.mode &= ~this.readMode);
        }
        get write() {
            return (this.mode & this.writeMode) === this.writeMode;
        }
        set write(val) {
            val ? (this.mode |= this.writeMode) : (this.mode &= ~this.writeMode);
        }
        get isFolder() {
            return FS.isDir(this.mode);
        }
        get isDevice() {
            return FS.isChrdev(this.mode);
        }
    },
    lookupPath(path, opts = {}) {
        if (!path) {
            throw new FS.ErrnoError(44);
        }
        opts.follow_mount ??= true;
        if (!PATH.isAbs(path)) {
            path = FS.cwd() + '/' + path;
        }
        linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
            var parts = path.split('/').filter((p) => !!p);
            var current = FS.root;
            var current_path = '/';
            for (var i = 0; i < parts.length; i++) {
                var islast = i === parts.length - 1;
                if (islast && opts.parent) {
                    break;
                }
                if (parts[i] === '.') {
                    continue;
                }
                if (parts[i] === '..') {
                    current_path = PATH.dirname(current_path);
                    current = current.parent;
                    continue;
                }
                current_path = PATH.join2(current_path, parts[i]);
                try {
                    current = FS.lookupNode(current, parts[i]);
                } catch (e) {
                    if (e?.errno === 44 && islast && opts.noent_okay) {
                        return { path: current_path };
                    }
                    throw e;
                }
                if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
                    current = current.mounted.root;
                }
                if (FS.isLink(current.mode) && (!islast || opts.follow)) {
                    if (!current.node_ops.readlink) {
                        throw new FS.ErrnoError(52);
                    }
                    var link = current.node_ops.readlink(current);
                    if (!PATH.isAbs(link)) {
                        link = PATH.dirname(current_path) + '/' + link;
                    }
                    path = link + '/' + parts.slice(i + 1).join('/');
                    continue linkloop;
                }
            }
            return { path: current_path, node: current };
        }
        throw new FS.ErrnoError(32);
    },
    getPath(node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length - 1] !== '/' ? `${mount}/${path}` : mount + path;
            }
            path = path ? `${node.name}/${path}` : node.name;
            node = node.parent;
        }
    },
    hashName(parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
    },
    hashAddNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
    },
    hashRemoveNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next;
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break;
                }
                current = current.name_next;
            }
        }
    },
    lookupNode(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node;
            }
        }
        return FS.lookup(parent, name);
    },
    createNode(parent, name, mode, rdev) {
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node;
    },
    destroyNode(node) {
        FS.hashRemoveNode(node);
    },
    isRoot(node) {
        return node === node.parent;
    },
    isMountpoint(node) {
        return !!node.mounted;
    },
    isFile(mode) {
        return (mode & 61440) === 32768;
    },
    isDir(mode) {
        return (mode & 61440) === 16384;
    },
    isLink(mode) {
        return (mode & 61440) === 40960;
    },
    isChrdev(mode) {
        return (mode & 61440) === 8192;
    },
    isBlkdev(mode) {
        return (mode & 61440) === 24576;
    },
    isFIFO(mode) {
        return (mode & 61440) === 4096;
    },
    isSocket(mode) {
        return (mode & 49152) === 49152;
    },
    flagsToPermissionString(flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if (flag & 512) {
            perms += 'w';
        }
        return perms;
    },
    nodePermissions(node, perms) {
        if (FS.ignorePermissions) {
            return 0;
        }
        if (perms.includes('r') && !(node.mode & 292)) {
            return 2;
        } else if (perms.includes('w') && !(node.mode & 146)) {
            return 2;
        } else if (perms.includes('x') && !(node.mode & 73)) {
            return 2;
        }
        return 0;
    },
    mayLookup(dir) {
        if (!FS.isDir(dir.mode)) return 54;
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
    },
    mayCreate(dir, name) {
        if (!FS.isDir(dir.mode)) {
            return 54;
        }
        try {
            var node = FS.lookupNode(dir, name);
            return 20;
        } catch (e) {}
        return FS.nodePermissions(dir, 'wx');
    },
    mayDelete(dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name);
        } catch (e) {
            return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
            return errCode;
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return 54;
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 10;
            }
        } else {
            if (FS.isDir(node.mode)) {
                return 31;
            }
        }
        return 0;
    },
    mayOpen(node, flags) {
        if (!node) {
            return 44;
        }
        if (FS.isLink(node.mode)) {
            return 32;
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== 'r' || flags & (512 | 64)) {
                return 31;
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
    },
    checkOpExists(op, err) {
        if (!op) {
            throw new FS.ErrnoError(err);
        }
        return op;
    },
    MAX_OPEN_FDS: 4096,
    nextfd() {
        for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
            if (!FS.streams[fd]) {
                return fd;
            }
        }
        throw new FS.ErrnoError(33);
    },
    getStreamChecked(fd) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8);
        }
        return stream;
    },
    getStream: (fd) => FS.streams[fd],
    createStream(stream, fd = -1) {
        stream = Object.assign(new FS.FSStream(), stream);
        if (fd == -1) {
            fd = FS.nextfd();
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
    },
    closeStream(fd) {
        FS.streams[fd] = null;
    },
    dupStream(origStream, fd = -1) {
        var stream = FS.createStream(origStream, fd);
        stream.stream_ops?.dup?.(stream);
        return stream;
    },
    chrdev_stream_ops: {
        open(stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            stream.stream_ops.open?.(stream);
        },
        llseek() {
            throw new FS.ErrnoError(70);
        },
    },
    major: (dev) => dev >> 8,
    minor: (dev) => dev & 255,
    makedev: (ma, mi) => (ma << 8) | mi,
    registerDevice(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
    },
    getDevice: (dev) => FS.devices[dev],
    getMounts(mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push(...m.mounts);
        }
        return mounts;
    },
    syncfs(populate, callback) {
        if (typeof populate == 'function') {
            callback = populate;
            populate = false;
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
        function doCallback(errCode) {
            FS.syncFSRequests--;
            return callback(errCode);
        }
        function done(errCode) {
            if (errCode) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(errCode);
                }
                return;
            }
            if (++completed >= mounts.length) {
                doCallback(null);
            }
        }
        mounts.forEach((mount) => {
            if (!mount.type.syncfs) {
                return done(null);
            }
            mount.type.syncfs(mount, populate, done);
        });
    },
    mount(type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(10);
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(54);
            }
        }
        var mount = { type, opts, mountpoint, mounts: [] };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot;
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount);
            }
        }
        return mountRoot;
    },
    unmount(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(28);
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach((hash) => {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.includes(current.mount)) {
                    FS.destroyNode(current);
                }
                current = next;
            }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1);
    },
    lookup(parent, name) {
        return parent.node_ops.lookup(parent, name);
    },
    mknod(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name) {
            throw new FS.ErrnoError(28);
        }
        if (name === '.' || name === '..') {
            throw new FS.ErrnoError(20);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
    },
    statfs(path) {
        return FS.statfsNode(FS.lookupPath(path, { follow: true }).node);
    },
    statfsStream(stream) {
        return FS.statfsNode(stream.node);
    },
    statfsNode(node) {
        var rtn = {
            bsize: 4096,
            frsize: 4096,
            blocks: 1e6,
            bfree: 5e5,
            bavail: 5e5,
            files: FS.nextInode,
            ffree: FS.nextInode - 1,
            fsid: 42,
            flags: 2,
            namelen: 255,
        };
        if (node.node_ops.statfs) {
            Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
        }
        return rtn;
    },
    create(path, mode = 438) {
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
    },
    mkdir(path, mode = 511) {
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
    },
    mkdirTree(path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i]) continue;
            d += '/' + dirs[i];
            try {
                FS.mkdir(d, mode);
            } catch (e) {
                if (e.errno != 20) throw e;
            }
        }
    },
    mkdev(path, mode, dev) {
        if (typeof dev == 'undefined') {
            dev = mode;
            mode = 438;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
    },
    symlink(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
    },
    rename(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(75);
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
            throw new FS.ErrnoError(28);
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
            throw new FS.ErrnoError(55);
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {}
        if (old_node === new_node) {
            return;
        }
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
            throw new FS.ErrnoError(10);
        }
        if (new_dir !== old_dir) {
            errCode = FS.nodePermissions(old_dir, 'w');
            if (errCode) {
                throw new FS.ErrnoError(errCode);
            }
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name);
            old_node.parent = new_dir;
        } catch (e) {
            throw e;
        } finally {
            FS.hashAddNode(old_node);
        }
    },
    rmdir(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
    },
    readdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
        return readdir(node);
    },
    unlink(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
    },
    readlink(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(28);
        }
        return link.node_ops.readlink(link);
    },
    stat(path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
        return getattr(node);
    },
    lstat(path) {
        return FS.stat(path, true);
    },
    chmod(path, mode, dontFollow) {
        var node;
        if (typeof path == 'string') {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
        } else {
            node = path;
        }
        var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
        setattr(node, { mode: (mode & 4095) | (node.mode & ~4095), ctime: Date.now(), dontFollow });
    },
    lchmod(path, mode) {
        FS.chmod(path, mode, true);
    },
    fchmod(fd, mode) {
        var stream = FS.getStreamChecked(fd);
        FS.chmod(stream.node, mode);
    },
    chown(path, uid, gid, dontFollow) {
        var node;
        if (typeof path == 'string') {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
        } else {
            node = path;
        }
        var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
        setattr(node, { timestamp: Date.now(), dontFollow });
    },
    lchown(path, uid, gid) {
        FS.chown(path, uid, gid, true);
    },
    fchown(fd, uid, gid) {
        var stream = FS.getStreamChecked(fd);
        FS.chown(stream.node, uid, gid);
    },
    truncate(path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path == 'string') {
            var lookup = FS.lookupPath(path, { follow: true });
            node = lookup.node;
        } else {
            node = path;
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
        setattr(node, { size: len, timestamp: Date.now() });
    },
    ftruncate(fd, len) {
        var stream = FS.getStreamChecked(fd);
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
    },
    utime(path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
        setattr(node, { atime, mtime });
    },
    open(path, flags, mode = 438) {
        if (path === '') {
            throw new FS.ErrnoError(44);
        }
        flags = typeof flags == 'string' ? FS_modeStringToFlags(flags) : flags;
        if (flags & 64) {
            mode = (mode & 4095) | 32768;
        } else {
            mode = 0;
        }
        var node;
        var isDirPath;
        if (typeof path == 'object') {
            node = path;
        } else {
            isDirPath = path.endsWith('/');
            var lookup = FS.lookupPath(path, { follow: !(flags & 131072), noent_okay: true });
            node = lookup.node;
            path = lookup.path;
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(20);
                }
            } else if (isDirPath) {
                throw new FS.ErrnoError(31);
            } else {
                node = FS.mknod(path, mode | 511, 0);
                created = true;
            }
        }
        if (!node) {
            throw new FS.ErrnoError(44);
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512;
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
        }
        if (!created) {
            var errCode = FS.mayOpen(node, flags);
            if (errCode) {
                throw new FS.ErrnoError(errCode);
            }
        }
        if (flags & 512 && !created) {
            FS.truncate(node, 0);
        }
        flags &= ~(128 | 512 | 131072);
        var stream = FS.createStream({
            node,
            path: FS.getPath(node),
            flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false,
        });
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
        }
        if (created) {
            FS.chmod(node, mode & 511);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
            }
        }
        return stream;
    },
    close(stream) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream);
            }
        } catch (e) {
            throw e;
        } finally {
            FS.closeStream(stream.fd);
        }
        stream.fd = null;
    },
    isClosed(stream) {
        return stream.fd === null;
    },
    llseek(stream, offset, whence) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
            throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
    },
    read(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(28);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
            position = stream.position;
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
    },
    write(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
            FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
            position = stream.position;
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
    },
    allocate(stream, offset, length) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
    },
    mmap(stream, length, position, prot, flags) {
        if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(43);
        }
        if (!length) {
            throw new FS.ErrnoError(28);
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags);
    },
    msync(stream, buffer, offset, length, mmapFlags) {
        if (!stream.stream_ops.msync) {
            return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
    },
    ioctl(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
    },
    readFile(path, opts = {}) {
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
            throw new Error(`Invalid encoding type "${opts.encoding}"`);
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
            ret = UTF8ArrayToString(buf);
        } else if (opts.encoding === 'binary') {
            ret = buf;
        }
        FS.close(stream);
        return ret;
    },
    writeFile(path, data, opts = {}) {
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data == 'string') {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
            throw new Error('Unsupported data type');
        }
        FS.close(stream);
    },
    cwd: () => FS.currentPath,
    chdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
            throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
    },
    createDefaultDirectories() {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
    },
    createDefaultDevices() {
        FS.mkdir('/dev');
        FS.registerDevice(FS.makedev(1, 3), {
            read: () => 0,
            write: (stream, buffer, offset, length, pos) => length,
            llseek: () => 0,
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        var randomBuffer = new Uint8Array(1024),
            randomLeft = 0;
        var randomByte = () => {
            if (randomLeft === 0) {
                randomFill(randomBuffer);
                randomLeft = randomBuffer.byteLength;
            }
            return randomBuffer[--randomLeft];
        };
        FS.createDevice('/dev', 'random', randomByte);
        FS.createDevice('/dev', 'urandom', randomByte);
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
    },
    createSpecialDirectories() {
        FS.mkdir('/proc');
        var proc_self = FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount(
            {
                mount() {
                    var node = FS.createNode(proc_self, 'fd', 16895, 73);
                    node.stream_ops = { llseek: MEMFS.stream_ops.llseek };
                    node.node_ops = {
                        lookup(parent, name) {
                            var fd = +name;
                            var stream = FS.getStreamChecked(fd);
                            var ret = {
                                parent: null,
                                mount: { mountpoint: 'fake' },
                                node_ops: { readlink: () => stream.path },
                                id: fd + 1,
                            };
                            ret.parent = ret;
                            return ret;
                        },
                        readdir() {
                            return Array.from(FS.streams.entries())
                                .filter(([k, v]) => v)
                                .map(([k, v]) => k.toString());
                        },
                    };
                    return node;
                },
            },
            {},
            '/proc/self/fd'
        );
    },
    createStandardStreams(input, output, error) {
        if (input) {
            FS.createDevice('/dev', 'stdin', input);
        } else {
            FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (output) {
            FS.createDevice('/dev', 'stdout', null, output);
        } else {
            FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (error) {
            FS.createDevice('/dev', 'stderr', null, error);
        } else {
            FS.symlink('/dev/tty1', '/dev/stderr');
        }
        var stdin = FS.open('/dev/stdin', 0);
        var stdout = FS.open('/dev/stdout', 1);
        var stderr = FS.open('/dev/stderr', 1);
    },
    staticInit() {
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = { MEMFS, IDBFS };
    },
    init(input, output, error) {
        FS.initialized = true;
        input ??= Module['stdin'];
        output ??= Module['stdout'];
        error ??= Module['stderr'];
        FS.createStandardStreams(input, output, error);
    },
    quit() {
        FS.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue;
            }
            FS.close(stream);
        }
    },
    findObject(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (!ret.exists) {
            return null;
        }
        return ret.object;
    },
    analyzePath(path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            path = lookup.path;
        } catch (e) {}
        var ret = {
            isRoot: false,
            exists: false,
            error: 0,
            name: null,
            path: null,
            object: null,
            parentExists: false,
            parentPath: null,
            parentObject: null,
        };
        try {
            var lookup = FS.lookupPath(path, { parent: true });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === '/';
        } catch (e) {
            ret.error = e.errno;
        }
        return ret;
    },
    createPath(parent, path, canRead, canWrite) {
        parent = typeof parent == 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current);
            } catch (e) {}
            parent = current;
        }
        return current;
    },
    createFile(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode);
    },
    createDataFile(parent, name, data, canRead, canWrite, canOwn) {
        var path = name;
        if (parent) {
            parent = typeof parent == 'string' ? parent : FS.getPath(parent);
            path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data == 'string') {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr;
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, 577);
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode);
        }
    },
    createDevice(parent, name, input, output) {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(!!input, !!output);
        FS.createDevice.major ??= 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open(stream) {
                stream.seekable = false;
            },
            close(stream) {
                if (output?.buffer?.length) {
                    output(10);
                }
            },
            read(stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input();
                    } catch (e) {
                        throw new FS.ErrnoError(29);
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(6);
                    }
                    if (result === null || result === undefined) break;
                    bytesRead++;
                    buffer[offset + i] = result;
                }
                if (bytesRead) {
                    stream.node.atime = Date.now();
                }
                return bytesRead;
            },
            write(stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i]);
                    } catch (e) {
                        throw new FS.ErrnoError(29);
                    }
                }
                if (length) {
                    stream.node.mtime = stream.node.ctime = Date.now();
                }
                return i;
            },
        });
        return FS.mkdev(path, mode, dev);
    },
    forceLoadFile(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (typeof XMLHttpRequest != 'undefined') {
            throw new Error(
                'Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.'
            );
        } else {
            try {
                obj.contents = readBinary(obj.url);
                obj.usedBytes = obj.contents.length;
            } catch (e) {
                throw new FS.ErrnoError(29);
            }
        }
    },
    createLazyFile(parent, name, url, canRead, canWrite) {
        class LazyUint8Array {
            lengthKnown = false;
            chunks = [];
            get(idx) {
                if (idx > this.length - 1 || idx < 0) {
                    return undefined;
                }
                var chunkOffset = idx % this.chunkSize;
                var chunkNum = (idx / this.chunkSize) | 0;
                return this.getter(chunkNum)[chunkOffset];
            }
            setDataGetter(getter) {
                this.getter = getter;
            }
            cacheLength() {
                var xhr = new XMLHttpRequest();
                xhr.open('HEAD', url, false);
                xhr.send(null);
                if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304))
                    throw new Error("Couldn't load " + url + '. Status: ' + xhr.status);
                var datalength = Number(xhr.getResponseHeader('Content-length'));
                var header;
                var hasByteServing = (header = xhr.getResponseHeader('Accept-Ranges')) && header === 'bytes';
                var usesGzip = (header = xhr.getResponseHeader('Content-Encoding')) && header === 'gzip';
                var chunkSize = 1024 * 1024;
                if (!hasByteServing) chunkSize = datalength;
                var doXHR = (from, to) => {
                    if (from > to) throw new Error('invalid range (' + from + ', ' + to + ') or no bytes requested!');
                    if (to > datalength - 1)
                        throw new Error('only ' + datalength + ' bytes available! programmer error!');
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, false);
                    if (datalength !== chunkSize) xhr.setRequestHeader('Range', 'bytes=' + from + '-' + to);
                    xhr.responseType = 'arraybuffer';
                    if (xhr.overrideMimeType) {
                        xhr.overrideMimeType('text/plain; charset=x-user-defined');
                    }
                    xhr.send(null);
                    if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304))
                        throw new Error("Couldn't load " + url + '. Status: ' + xhr.status);
                    if (xhr.response !== undefined) {
                        return new Uint8Array(xhr.response || []);
                    }
                    return intArrayFromString(xhr.responseText || '', true);
                };
                var lazyArray = this;
                lazyArray.setDataGetter((chunkNum) => {
                    var start = chunkNum * chunkSize;
                    var end = (chunkNum + 1) * chunkSize - 1;
                    end = Math.min(end, datalength - 1);
                    if (typeof lazyArray.chunks[chunkNum] == 'undefined') {
                        lazyArray.chunks[chunkNum] = doXHR(start, end);
                    }
                    if (typeof lazyArray.chunks[chunkNum] == 'undefined') throw new Error('doXHR failed!');
                    return lazyArray.chunks[chunkNum];
                });
                if (usesGzip || !datalength) {
                    chunkSize = datalength = 1;
                    datalength = this.getter(0).length;
                    chunkSize = datalength;
                    out('LazyFiles on gzip forces download of the whole file when length is accessed');
                }
                this._length = datalength;
                this._chunkSize = chunkSize;
                this.lengthKnown = true;
            }
            get length() {
                if (!this.lengthKnown) {
                    this.cacheLength();
                }
                return this._length;
            }
            get chunkSize() {
                if (!this.lengthKnown) {
                    this.cacheLength();
                }
                return this._chunkSize;
            }
        }
        if (typeof XMLHttpRequest != 'undefined') {
            if (!ENVIRONMENT_IS_WORKER)
                throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
            var lazyArray = new LazyUint8Array();
            var properties = { isDevice: false, contents: lazyArray };
        } else {
            var properties = { isDevice: false, url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents;
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url;
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: function () {
                    return this.contents.length;
                },
            },
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach((key) => {
            var fn = node.stream_ops[key];
            stream_ops[key] = (...args) => {
                FS.forceLoadFile(node);
                return fn(...args);
            };
        });
        function writeChunks(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i];
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i);
                }
            }
            return size;
        }
        stream_ops.read = (stream, buffer, offset, length, position) => {
            FS.forceLoadFile(node);
            return writeChunks(stream, buffer, offset, length, position);
        };
        stream_ops.mmap = (stream, length, position, prot, flags) => {
            FS.forceLoadFile(node);
            var ptr = mmapAlloc(length);
            if (!ptr) {
                throw new FS.ErrnoError(48);
            }
            writeChunks(stream, HEAP8, ptr, length, position);
            return { ptr, allocated: true };
        };
        node.stream_ops = stream_ops;
        return node;
    },
};
var UTF8ToString = (ptr, maxBytesToRead) => (ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '');
var SYSCALLS = {
    DEFAULT_POLLMASK: 5,
    calculateAt(dirfd, path, allowEmpty) {
        if (PATH.isAbs(path)) {
            return path;
        }
        var dir;
        if (dirfd === -100) {
            dir = FS.cwd();
        } else {
            var dirstream = SYSCALLS.getStreamFromFD(dirfd);
            dir = dirstream.path;
        }
        if (path.length == 0) {
            if (!allowEmpty) {
                throw new FS.ErrnoError(44);
            }
            return dir;
        }
        return dir + '/' + path;
    },
    writeStat(buf, stat) {
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[(buf + 4) >> 2] = stat.mode;
        HEAPU32[(buf + 8) >> 2] = stat.nlink;
        HEAP32[(buf + 12) >> 2] = stat.uid;
        HEAP32[(buf + 16) >> 2] = stat.gid;
        HEAP32[(buf + 20) >> 2] = stat.rdev;
        HEAP64[(buf + 24) >> 3] = BigInt(stat.size);
        HEAP32[(buf + 32) >> 2] = 4096;
        HEAP32[(buf + 36) >> 2] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        HEAP64[(buf + 40) >> 3] = BigInt(Math.floor(atime / 1e3));
        HEAPU32[(buf + 48) >> 2] = (atime % 1e3) * 1e3 * 1e3;
        HEAP64[(buf + 56) >> 3] = BigInt(Math.floor(mtime / 1e3));
        HEAPU32[(buf + 64) >> 2] = (mtime % 1e3) * 1e3 * 1e3;
        HEAP64[(buf + 72) >> 3] = BigInt(Math.floor(ctime / 1e3));
        HEAPU32[(buf + 80) >> 2] = (ctime % 1e3) * 1e3 * 1e3;
        HEAP64[(buf + 88) >> 3] = BigInt(stat.ino);
        return 0;
    },
    writeStatFs(buf, stats) {
        HEAP32[(buf + 4) >> 2] = stats.bsize;
        HEAP32[(buf + 40) >> 2] = stats.bsize;
        HEAP32[(buf + 8) >> 2] = stats.blocks;
        HEAP32[(buf + 12) >> 2] = stats.bfree;
        HEAP32[(buf + 16) >> 2] = stats.bavail;
        HEAP32[(buf + 20) >> 2] = stats.files;
        HEAP32[(buf + 24) >> 2] = stats.ffree;
        HEAP32[(buf + 28) >> 2] = stats.fsid;
        HEAP32[(buf + 44) >> 2] = stats.flags;
        HEAP32[(buf + 36) >> 2] = stats.namelen;
    },
    doMsync(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
        }
        if (flags & 2) {
            return 0;
        }
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
    },
    getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream;
    },
    varargs: undefined,
    getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
    },
};
function ___syscall_chmod(path, mode) {
    try {
        path = SYSCALLS.getStr(path);
        FS.chmod(path, mode);
        return 0;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
function ___syscall_faccessat(dirfd, path, amode, flags) {
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        if (amode & ~7) {
            return -28;
        }
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node) {
            return -44;
        }
        var perms = '';
        if (amode & 4) perms += 'r';
        if (amode & 2) perms += 'w';
        if (amode & 1) perms += 'x';
        if (perms && FS.nodePermissions(node, perms)) {
            return -2;
        }
        return 0;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
var syscallGetVarargI = () => {
    var ret = HEAP32[+SYSCALLS.varargs >> 2];
    SYSCALLS.varargs += 4;
    return ret;
};
var syscallGetVarargP = syscallGetVarargI;
function ___syscall_fcntl64(fd, cmd, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (cmd) {
            case 0: {
                var arg = syscallGetVarargI();
                if (arg < 0) {
                    return -28;
                }
                while (FS.streams[arg]) {
                    arg++;
                }
                var newStream;
                newStream = FS.dupStream(stream, arg);
                return newStream.fd;
            }
            case 1:
            case 2:
                return 0;
            case 3:
                return stream.flags;
            case 4: {
                var arg = syscallGetVarargI();
                stream.flags |= arg;
                return 0;
            }
            case 12: {
                var arg = syscallGetVarargP();
                var offset = 0;
                HEAP16[(arg + offset) >> 1] = 2;
                return 0;
            }
            case 13:
            case 14:
                return 0;
        }
        return -28;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
function ___syscall_fstat64(fd, buf) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        return SYSCALLS.writeStat(buf, FS.stat(stream.path));
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
function ___syscall_getdents64(fd, dirp, count) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        stream.getdents ||= FS.readdir(stream.path);
        var struct_size = 280;
        var pos = 0;
        var off = FS.llseek(stream, 0, 1);
        var startIdx = Math.floor(off / struct_size);
        var endIdx = Math.min(stream.getdents.length, startIdx + Math.floor(count / struct_size));
        for (var idx = startIdx; idx < endIdx; idx++) {
            var id;
            var type;
            var name = stream.getdents[idx];
            if (name === '.') {
                id = stream.node.id;
                type = 4;
            } else if (name === '..') {
                var lookup = FS.lookupPath(stream.path, { parent: true });
                id = lookup.node.id;
                type = 4;
            } else {
                var child;
                try {
                    child = FS.lookupNode(stream.node, name);
                } catch (e) {
                    if (e?.errno === 28) {
                        continue;
                    }
                    throw e;
                }
                id = child.id;
                type = FS.isChrdev(child.mode) ? 2 : FS.isDir(child.mode) ? 4 : FS.isLink(child.mode) ? 10 : 8;
            }
            HEAP64[(dirp + pos) >> 3] = BigInt(id);
            HEAP64[(dirp + pos + 8) >> 3] = BigInt((idx + 1) * struct_size);
            HEAP16[(dirp + pos + 16) >> 1] = 280;
            HEAP8[dirp + pos + 18] = type;
            stringToUTF8(name, dirp + pos + 19, 256);
            pos += struct_size;
        }
        FS.llseek(stream, idx * struct_size, 0);
        return pos;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
function ___syscall_ioctl(fd, op, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (op) {
            case 21509: {
                if (!stream.tty) return -59;
                return 0;
            }
            case 21505: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tcgets) {
                    var termios = stream.tty.ops.ioctl_tcgets(stream);
                    var argp = syscallGetVarargP();
                    HEAP32[argp >> 2] = termios.c_iflag || 0;
                    HEAP32[(argp + 4) >> 2] = termios.c_oflag || 0;
                    HEAP32[(argp + 8) >> 2] = termios.c_cflag || 0;
                    HEAP32[(argp + 12) >> 2] = termios.c_lflag || 0;
                    for (var i = 0; i < 32; i++) {
                        HEAP8[argp + i + 17] = termios.c_cc[i] || 0;
                    }
                    return 0;
                }
                return 0;
            }
            case 21510:
            case 21511:
            case 21512: {
                if (!stream.tty) return -59;
                return 0;
            }
            case 21506:
            case 21507:
            case 21508: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tcsets) {
                    var argp = syscallGetVarargP();
                    var c_iflag = HEAP32[argp >> 2];
                    var c_oflag = HEAP32[(argp + 4) >> 2];
                    var c_cflag = HEAP32[(argp + 8) >> 2];
                    var c_lflag = HEAP32[(argp + 12) >> 2];
                    var c_cc = [];
                    for (var i = 0; i < 32; i++) {
                        c_cc.push(HEAP8[argp + i + 17]);
                    }
                    return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag, c_oflag, c_cflag, c_lflag, c_cc });
                }
                return 0;
            }
            case 21519: {
                if (!stream.tty) return -59;
                var argp = syscallGetVarargP();
                HEAP32[argp >> 2] = 0;
                return 0;
            }
            case 21520: {
                if (!stream.tty) return -59;
                return -28;
            }
            case 21531: {
                var argp = syscallGetVarargP();
                return FS.ioctl(stream, op, argp);
            }
            case 21523: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tiocgwinsz) {
                    var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
                    var argp = syscallGetVarargP();
                    HEAP16[argp >> 1] = winsize[0];
                    HEAP16[(argp + 2) >> 1] = winsize[1];
                }
                return 0;
            }
            case 21524: {
                if (!stream.tty) return -59;
                return 0;
            }
            case 21515: {
                if (!stream.tty) return -59;
                return 0;
            }
            default:
                return -28;
        }
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
function ___syscall_lstat64(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.writeStat(buf, FS.lstat(path));
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
function ___syscall_mkdirat(dirfd, path, mode) {
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        FS.mkdir(path, mode, 0);
        return 0;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
function ___syscall_newfstatat(dirfd, path, buf, flags) {
    try {
        path = SYSCALLS.getStr(path);
        var nofollow = flags & 256;
        var allowEmpty = flags & 4096;
        flags = flags & ~6400;
        path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
        return SYSCALLS.writeStat(buf, nofollow ? FS.lstat(path) : FS.stat(path));
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
function ___syscall_openat(dirfd, path, flags, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        var mode = varargs ? syscallGetVarargI() : 0;
        return FS.open(path, flags, mode).fd;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
var PIPEFS = {
    BUCKET_BUFFER_SIZE: 8192,
    mount(mount) {
        return FS.createNode(null, '/', 16384 | 511, 0);
    },
    createPipe() {
        var pipe = { buckets: [], refcnt: 2 };
        pipe.buckets.push({ buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE), offset: 0, roffset: 0 });
        var rName = PIPEFS.nextname();
        var wName = PIPEFS.nextname();
        var rNode = FS.createNode(PIPEFS.root, rName, 4096, 0);
        var wNode = FS.createNode(PIPEFS.root, wName, 4096, 0);
        rNode.pipe = pipe;
        wNode.pipe = pipe;
        var readableStream = FS.createStream({
            path: rName,
            node: rNode,
            flags: 0,
            seekable: false,
            stream_ops: PIPEFS.stream_ops,
        });
        rNode.stream = readableStream;
        var writableStream = FS.createStream({
            path: wName,
            node: wNode,
            flags: 1,
            seekable: false,
            stream_ops: PIPEFS.stream_ops,
        });
        wNode.stream = writableStream;
        return { readable_fd: readableStream.fd, writable_fd: writableStream.fd };
    },
    stream_ops: {
        poll(stream) {
            var pipe = stream.node.pipe;
            if ((stream.flags & 2097155) === 1) {
                return 256 | 4;
            }
            if (pipe.buckets.length > 0) {
                for (var i = 0; i < pipe.buckets.length; i++) {
                    var bucket = pipe.buckets[i];
                    if (bucket.offset - bucket.roffset > 0) {
                        return 64 | 1;
                    }
                }
            }
            return 0;
        },
        dup(stream) {
            stream.node.pipe.refcnt++;
        },
        ioctl(stream, request, varargs) {
            return 28;
        },
        fsync(stream) {
            return 28;
        },
        read(stream, buffer, offset, length, position) {
            var pipe = stream.node.pipe;
            var currentLength = 0;
            for (var i = 0; i < pipe.buckets.length; i++) {
                var bucket = pipe.buckets[i];
                currentLength += bucket.offset - bucket.roffset;
            }
            var data = buffer.subarray(offset, offset + length);
            if (length <= 0) {
                return 0;
            }
            if (currentLength == 0) {
                throw new FS.ErrnoError(6);
            }
            var toRead = Math.min(currentLength, length);
            var totalRead = toRead;
            var toRemove = 0;
            for (var i = 0; i < pipe.buckets.length; i++) {
                var currBucket = pipe.buckets[i];
                var bucketSize = currBucket.offset - currBucket.roffset;
                if (toRead <= bucketSize) {
                    var tmpSlice = currBucket.buffer.subarray(currBucket.roffset, currBucket.offset);
                    if (toRead < bucketSize) {
                        tmpSlice = tmpSlice.subarray(0, toRead);
                        currBucket.roffset += toRead;
                    } else {
                        toRemove++;
                    }
                    data.set(tmpSlice);
                    break;
                } else {
                    var tmpSlice = currBucket.buffer.subarray(currBucket.roffset, currBucket.offset);
                    data.set(tmpSlice);
                    data = data.subarray(tmpSlice.byteLength);
                    toRead -= tmpSlice.byteLength;
                    toRemove++;
                }
            }
            if (toRemove && toRemove == pipe.buckets.length) {
                toRemove--;
                pipe.buckets[toRemove].offset = 0;
                pipe.buckets[toRemove].roffset = 0;
            }
            pipe.buckets.splice(0, toRemove);
            return totalRead;
        },
        write(stream, buffer, offset, length, position) {
            var pipe = stream.node.pipe;
            var data = buffer.subarray(offset, offset + length);
            var dataLen = data.byteLength;
            if (dataLen <= 0) {
                return 0;
            }
            var currBucket = null;
            if (pipe.buckets.length == 0) {
                currBucket = { buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE), offset: 0, roffset: 0 };
                pipe.buckets.push(currBucket);
            } else {
                currBucket = pipe.buckets[pipe.buckets.length - 1];
            }
            assert(currBucket.offset <= PIPEFS.BUCKET_BUFFER_SIZE);
            var freeBytesInCurrBuffer = PIPEFS.BUCKET_BUFFER_SIZE - currBucket.offset;
            if (freeBytesInCurrBuffer >= dataLen) {
                currBucket.buffer.set(data, currBucket.offset);
                currBucket.offset += dataLen;
                return dataLen;
            } else if (freeBytesInCurrBuffer > 0) {
                currBucket.buffer.set(data.subarray(0, freeBytesInCurrBuffer), currBucket.offset);
                currBucket.offset += freeBytesInCurrBuffer;
                data = data.subarray(freeBytesInCurrBuffer, data.byteLength);
            }
            var numBuckets = (data.byteLength / PIPEFS.BUCKET_BUFFER_SIZE) | 0;
            var remElements = data.byteLength % PIPEFS.BUCKET_BUFFER_SIZE;
            for (var i = 0; i < numBuckets; i++) {
                var newBucket = {
                    buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
                    offset: PIPEFS.BUCKET_BUFFER_SIZE,
                    roffset: 0,
                };
                pipe.buckets.push(newBucket);
                newBucket.buffer.set(data.subarray(0, PIPEFS.BUCKET_BUFFER_SIZE));
                data = data.subarray(PIPEFS.BUCKET_BUFFER_SIZE, data.byteLength);
            }
            if (remElements > 0) {
                var newBucket = {
                    buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
                    offset: data.byteLength,
                    roffset: 0,
                };
                pipe.buckets.push(newBucket);
                newBucket.buffer.set(data);
            }
            return dataLen;
        },
        close(stream) {
            var pipe = stream.node.pipe;
            pipe.refcnt--;
            if (pipe.refcnt === 0) {
                pipe.buckets = null;
            }
        },
    },
    nextname() {
        if (!PIPEFS.nextname.current) {
            PIPEFS.nextname.current = 0;
        }
        return 'pipe[' + PIPEFS.nextname.current++ + ']';
    },
};
function ___syscall_pipe(fdPtr) {
    try {
        if (fdPtr == 0) {
            throw new FS.ErrnoError(21);
        }
        var res = PIPEFS.createPipe();
        HEAP32[fdPtr >> 2] = res.readable_fd;
        HEAP32[(fdPtr + 4) >> 2] = res.writable_fd;
        return 0;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
function ___syscall_rmdir(path) {
    try {
        path = SYSCALLS.getStr(path);
        FS.rmdir(path);
        return 0;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
function ___syscall_stat64(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.writeStat(buf, FS.stat(path));
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
function ___syscall_symlinkat(target, dirfd, linkpath) {
    try {
        target = SYSCALLS.getStr(target);
        linkpath = SYSCALLS.getStr(linkpath);
        linkpath = SYSCALLS.calculateAt(dirfd, linkpath);
        FS.symlink(target, linkpath);
        return 0;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
function ___syscall_unlinkat(dirfd, path, flags) {
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        if (flags === 0) {
            FS.unlink(path);
        } else if (flags === 512) {
            FS.rmdir(path);
        } else {
            abort('Invalid flags passed to unlinkat');
        }
        return 0;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
var readI53FromI64 = (ptr) => HEAPU32[ptr >> 2] + HEAP32[(ptr + 4) >> 2] * 4294967296;
function ___syscall_utimensat(dirfd, path, times, flags) {
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path, true);
        var now = Date.now(),
            atime,
            mtime;
        if (!times) {
            atime = now;
            mtime = now;
        } else {
            var seconds = readI53FromI64(times);
            var nanoseconds = HEAP32[(times + 8) >> 2];
            if (nanoseconds == 1073741823) {
                atime = now;
            } else if (nanoseconds == 1073741822) {
                atime = null;
            } else {
                atime = seconds * 1e3 + nanoseconds / (1e3 * 1e3);
            }
            times += 16;
            seconds = readI53FromI64(times);
            nanoseconds = HEAP32[(times + 8) >> 2];
            if (nanoseconds == 1073741823) {
                mtime = now;
            } else if (nanoseconds == 1073741822) {
                mtime = null;
            } else {
                mtime = seconds * 1e3 + nanoseconds / (1e3 * 1e3);
            }
        }
        if ((mtime ?? atime) !== null) {
            FS.utime(path, atime, mtime);
        }
        return 0;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
var __abort_js = () => abort('');
var isLeapYear = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
var MONTH_DAYS_LEAP_CUMULATIVE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
var MONTH_DAYS_REGULAR_CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
var ydayFromDate = (date) => {
    var leap = isLeapYear(date.getFullYear());
    var monthDaysCumulative = leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE;
    var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
    return yday;
};
var INT53_MAX = 9007199254740992;
var INT53_MIN = -9007199254740992;
var bigintToI53Checked = (num) => (num < INT53_MIN || num > INT53_MAX ? NaN : Number(num));
function __localtime_js(time, tmPtr) {
    time = bigintToI53Checked(time);
    var date = new Date(time * 1e3);
    HEAP32[tmPtr >> 2] = date.getSeconds();
    HEAP32[(tmPtr + 4) >> 2] = date.getMinutes();
    HEAP32[(tmPtr + 8) >> 2] = date.getHours();
    HEAP32[(tmPtr + 12) >> 2] = date.getDate();
    HEAP32[(tmPtr + 16) >> 2] = date.getMonth();
    HEAP32[(tmPtr + 20) >> 2] = date.getFullYear() - 1900;
    HEAP32[(tmPtr + 24) >> 2] = date.getDay();
    var yday = ydayFromDate(date) | 0;
    HEAP32[(tmPtr + 28) >> 2] = yday;
    HEAP32[(tmPtr + 36) >> 2] = -(date.getTimezoneOffset() * 60);
    var start = new Date(date.getFullYear(), 0, 1);
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
    HEAP32[(tmPtr + 32) >> 2] = dst;
}
var __mktime_js = function (tmPtr) {
    var ret = (() => {
        var date = new Date(
            HEAP32[(tmPtr + 20) >> 2] + 1900,
            HEAP32[(tmPtr + 16) >> 2],
            HEAP32[(tmPtr + 12) >> 2],
            HEAP32[(tmPtr + 8) >> 2],
            HEAP32[(tmPtr + 4) >> 2],
            HEAP32[tmPtr >> 2],
            0
        );
        var dst = HEAP32[(tmPtr + 32) >> 2];
        var guessedOffset = date.getTimezoneOffset();
        var start = new Date(date.getFullYear(), 0, 1);
        var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
        var winterOffset = start.getTimezoneOffset();
        var dstOffset = Math.min(winterOffset, summerOffset);
        if (dst < 0) {
            HEAP32[(tmPtr + 32) >> 2] = Number(summerOffset != winterOffset && dstOffset == guessedOffset);
        } else if (dst > 0 != (dstOffset == guessedOffset)) {
            var nonDstOffset = Math.max(winterOffset, summerOffset);
            var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
            date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4);
        }
        HEAP32[(tmPtr + 24) >> 2] = date.getDay();
        var yday = ydayFromDate(date) | 0;
        HEAP32[(tmPtr + 28) >> 2] = yday;
        HEAP32[tmPtr >> 2] = date.getSeconds();
        HEAP32[(tmPtr + 4) >> 2] = date.getMinutes();
        HEAP32[(tmPtr + 8) >> 2] = date.getHours();
        HEAP32[(tmPtr + 12) >> 2] = date.getDate();
        HEAP32[(tmPtr + 16) >> 2] = date.getMonth();
        HEAP32[(tmPtr + 20) >> 2] = date.getYear();
        var timeMs = date.getTime();
        if (isNaN(timeMs)) {
            return -1;
        }
        return timeMs / 1e3;
    })();
    return BigInt(ret);
};
function __mmap_js(len, prot, flags, fd, offset, allocated, addr) {
    offset = bigintToI53Checked(offset);
    try {
        if (isNaN(offset)) return 61;
        var stream = SYSCALLS.getStreamFromFD(fd);
        var res = FS.mmap(stream, len, offset, prot, flags);
        var ptr = res.ptr;
        HEAP32[allocated >> 2] = res.allocated;
        HEAPU32[addr >> 2] = ptr;
        return 0;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
function __munmap_js(addr, len, prot, flags, fd, offset) {
    offset = bigintToI53Checked(offset);
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        if (prot & 2) {
            SYSCALLS.doMsync(addr, stream, len, flags, offset);
        }
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return -e.errno;
    }
}
var __tzset_js = (timezone, daylight, std_name, dst_name) => {
    var currentYear = new Date().getFullYear();
    var winter = new Date(currentYear, 0, 1);
    var summer = new Date(currentYear, 6, 1);
    var winterOffset = winter.getTimezoneOffset();
    var summerOffset = summer.getTimezoneOffset();
    var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
    HEAPU32[timezone >> 2] = stdTimezoneOffset * 60;
    HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
    var extractZone = (timezoneOffset) => {
        var sign = timezoneOffset >= 0 ? '-' : '+';
        var absOffset = Math.abs(timezoneOffset);
        var hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
        var minutes = String(absOffset % 60).padStart(2, '0');
        return `UTC${sign}${hours}${minutes}`;
    };
    var winterName = extractZone(winterOffset);
    var summerName = extractZone(summerOffset);
    if (summerOffset < winterOffset) {
        stringToUTF8(winterName, std_name, 17);
        stringToUTF8(summerName, dst_name, 17);
    } else {
        stringToUTF8(winterName, dst_name, 17);
        stringToUTF8(summerName, std_name, 17);
    }
};
var _emscripten_get_now = () => performance.now();
var _emscripten_date_now = () => Date.now();
var nowIsMonotonic = 1;
var checkWasiClock = (clock_id) => clock_id >= 0 && clock_id <= 3;
function _clock_time_get(clk_id, ignored_precision, ptime) {
    ignored_precision = bigintToI53Checked(ignored_precision);
    if (!checkWasiClock(clk_id)) {
        return 28;
    }
    var now;
    if (clk_id === 0) {
        now = _emscripten_date_now();
    } else if (nowIsMonotonic) {
        now = _emscripten_get_now();
    } else {
        return 52;
    }
    var nsec = Math.round(now * 1e3 * 1e3);
    HEAP64[ptime >> 3] = BigInt(nsec);
    return 0;
}
var handleException = (e) => {
    if (e instanceof ExitStatus || e == 'unwind') {
        return EXITSTATUS;
    }
    quit_(1, e);
};
var runtimeKeepaliveCounter = 0;
var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
var _proc_exit = (code) => {
    EXITSTATUS = code;
    if (!keepRuntimeAlive()) {
        Module['onExit']?.(code);
        ABORT = true;
    }
    quit_(code, new ExitStatus(code));
};
var exitJS = (status, implicit) => {
    EXITSTATUS = status;
    _proc_exit(status);
};
var _exit = exitJS;
var maybeExit = () => {
    if (!keepRuntimeAlive()) {
        try {
            _exit(EXITSTATUS);
        } catch (e) {
            handleException(e);
        }
    }
};
var callUserCallback = (func) => {
    if (ABORT) {
        return;
    }
    try {
        func();
        maybeExit();
    } catch (e) {
        handleException(e);
    }
};
var safeSetTimeout = (func, timeout) =>
    setTimeout(() => {
        callUserCallback(func);
    }, timeout);
var warnOnce = (text) => {
    warnOnce.shown ||= {};
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        if (ENVIRONMENT_IS_NODE) text = 'warning: ' + text;
        err(text);
    }
};
var Browser = {
    useWebGL: false,
    isFullscreen: false,
    pointerLock: false,
    moduleContextCreatedCallbacks: [],
    workers: [],
    preloadedImages: {},
    preloadedAudios: {},
    init() {
        if (Browser.initted) return;
        Browser.initted = true;
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
            return !Module['noImageDecoding'] && /\.(jpg|jpeg|png|bmp|webp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
            var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            if (b.size !== byteArray.length) {
                b = new Blob([new Uint8Array(byteArray).buffer], { type: Browser.getMimetype(name) });
            }
            var url = URL.createObjectURL(b);
            var img = new Image();
            img.onload = () => {
                var canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                Browser.preloadedImages[name] = canvas;
                URL.revokeObjectURL(url);
                onload?.(byteArray);
            };
            img.onerror = (event) => {
                err(`Image ${url} could not be decoded`);
                onerror?.();
            };
            img.src = url;
        };
        preloadPlugins.push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
            return !Module['noAudioDecoding'] && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
            var done = false;
            function finish(audio) {
                if (done) return;
                done = true;
                Browser.preloadedAudios[name] = audio;
                onload?.(byteArray);
            }
            var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            var url = URL.createObjectURL(b);
            var audio = new Audio();
            audio.addEventListener('canplaythrough', () => finish(audio), false);
            audio.onerror = function audio_onerror(event) {
                if (done) return;
                err(`warning: browser could not fully decode audio ${name}, trying slower base64 approach`);
                function encode64(data) {
                    var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                    var PAD = '=';
                    var ret = '';
                    var leftchar = 0;
                    var leftbits = 0;
                    for (var i = 0; i < data.length; i++) {
                        leftchar = (leftchar << 8) | data[i];
                        leftbits += 8;
                        while (leftbits >= 6) {
                            var curr = (leftchar >> (leftbits - 6)) & 63;
                            leftbits -= 6;
                            ret += BASE[curr];
                        }
                    }
                    if (leftbits == 2) {
                        ret += BASE[(leftchar & 3) << 4];
                        ret += PAD + PAD;
                    } else if (leftbits == 4) {
                        ret += BASE[(leftchar & 15) << 2];
                        ret += PAD;
                    }
                    return ret;
                }
                audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
                finish(audio);
            };
            audio.src = url;
            safeSetTimeout(() => {
                finish(audio);
            }, 1e4);
        };
        preloadPlugins.push(audioPlugin);
        function pointerLockChange() {
            Browser.pointerLock =
                document['pointerLockElement'] === Module['canvas'] ||
                document['mozPointerLockElement'] === Module['canvas'] ||
                document['webkitPointerLockElement'] === Module['canvas'] ||
                document['msPointerLockElement'] === Module['canvas'];
        }
        var canvas = Module['canvas'];
        if (canvas) {
            canvas.requestPointerLock =
                canvas['requestPointerLock'] ||
                canvas['mozRequestPointerLock'] ||
                canvas['webkitRequestPointerLock'] ||
                canvas['msRequestPointerLock'] ||
                (() => {});
            canvas.exitPointerLock =
                document['exitPointerLock'] ||
                document['mozExitPointerLock'] ||
                document['webkitExitPointerLock'] ||
                document['msExitPointerLock'] ||
                (() => {});
            canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
            document.addEventListener('pointerlockchange', pointerLockChange, false);
            document.addEventListener('mozpointerlockchange', pointerLockChange, false);
            document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
            document.addEventListener('mspointerlockchange', pointerLockChange, false);
            if (Module['elementPointerLock']) {
                canvas.addEventListener(
                    'click',
                    (ev) => {
                        if (!Browser.pointerLock && Module['canvas'].requestPointerLock) {
                            Module['canvas'].requestPointerLock();
                            ev.preventDefault();
                        }
                    },
                    false
                );
            }
        }
    },
    createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module['ctx'] && canvas == Module['canvas']) return Module['ctx'];
        var ctx;
        var contextHandle;
        if (useWebGL) {
            var contextAttributes = { antialias: false, alpha: false, majorVersion: 1 };
            if (webGLContextAttributes) {
                for (var attribute in webGLContextAttributes) {
                    contextAttributes[attribute] = webGLContextAttributes[attribute];
                }
            }
            if (typeof GL != 'undefined') {
                contextHandle = GL.createContext(canvas, contextAttributes);
                if (contextHandle) {
                    ctx = GL.getContext(contextHandle).GLctx;
                }
            }
        } else {
            ctx = canvas.getContext('2d');
        }
        if (!ctx) return null;
        if (setInModule) {
            Module['ctx'] = ctx;
            if (useWebGL) GL.makeContextCurrent(contextHandle);
            Browser.useWebGL = useWebGL;
            Browser.moduleContextCreatedCallbacks.forEach((callback) => callback());
            Browser.init();
        }
        return ctx;
    },
    fullscreenHandlersInstalled: false,
    lockPointer: undefined,
    resizeCanvas: undefined,
    requestFullscreen(lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer == 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas == 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullscreenChange() {
            Browser.isFullscreen = false;
            var canvasContainer = canvas.parentNode;
            if (
                (document['fullscreenElement'] ||
                    document['mozFullScreenElement'] ||
                    document['msFullscreenElement'] ||
                    document['webkitFullscreenElement'] ||
                    document['webkitCurrentFullScreenElement']) === canvasContainer
            ) {
                canvas.exitFullscreen = Browser.exitFullscreen;
                if (Browser.lockPointer) canvas.requestPointerLock();
                Browser.isFullscreen = true;
                if (Browser.resizeCanvas) {
                    Browser.setFullscreenCanvasSize();
                } else {
                    Browser.updateCanvasDimensions(canvas);
                }
            } else {
                canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
                canvasContainer.parentNode.removeChild(canvasContainer);
                if (Browser.resizeCanvas) {
                    Browser.setWindowedCanvasSize();
                } else {
                    Browser.updateCanvasDimensions(canvas);
                }
            }
            Module['onFullScreen']?.(Browser.isFullscreen);
            Module['onFullscreen']?.(Browser.isFullscreen);
        }
        if (!Browser.fullscreenHandlersInstalled) {
            Browser.fullscreenHandlersInstalled = true;
            document.addEventListener('fullscreenchange', fullscreenChange, false);
            document.addEventListener('mozfullscreenchange', fullscreenChange, false);
            document.addEventListener('webkitfullscreenchange', fullscreenChange, false);
            document.addEventListener('MSFullscreenChange', fullscreenChange, false);
        }
        var canvasContainer = document.createElement('div');
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        canvasContainer.requestFullscreen =
            canvasContainer['requestFullscreen'] ||
            canvasContainer['mozRequestFullScreen'] ||
            canvasContainer['msRequestFullscreen'] ||
            (canvasContainer['webkitRequestFullscreen']
                ? () => canvasContainer['webkitRequestFullscreen'](Element['ALLOW_KEYBOARD_INPUT'])
                : null) ||
            (canvasContainer['webkitRequestFullScreen']
                ? () => canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT'])
                : null);
        canvasContainer.requestFullscreen();
    },
    exitFullscreen() {
        if (!Browser.isFullscreen) {
            return false;
        }
        var CFS =
            document['exitFullscreen'] ||
            document['cancelFullScreen'] ||
            document['mozCancelFullScreen'] ||
            document['msExitFullscreen'] ||
            document['webkitCancelFullScreen'] ||
            (() => {});
        CFS.apply(document, []);
        return true;
    },
    safeSetTimeout(func, timeout) {
        return safeSetTimeout(func, timeout);
    },
    getMimetype(name) {
        return {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            bmp: 'image/bmp',
            ogg: 'audio/ogg',
            wav: 'audio/wav',
            mp3: 'audio/mpeg',
        }[name.substr(name.lastIndexOf('.') + 1)];
    },
    getUserMedia(func) {
        window.getUserMedia ||= navigator['getUserMedia'] || navigator['mozGetUserMedia'];
        window.getUserMedia(func);
    },
    getMovementX(event) {
        return event['movementX'] || event['mozMovementX'] || event['webkitMovementX'] || 0;
    },
    getMovementY(event) {
        return event['movementY'] || event['mozMovementY'] || event['webkitMovementY'] || 0;
    },
    getMouseWheelDelta(event) {
        var delta = 0;
        switch (event.type) {
            case 'DOMMouseScroll':
                delta = event.detail / 3;
                break;
            case 'mousewheel':
                delta = event.wheelDelta / 120;
                break;
            case 'wheel':
                delta = event.deltaY;
                switch (event.deltaMode) {
                    case 0:
                        delta /= 100;
                        break;
                    case 1:
                        delta /= 3;
                        break;
                    case 2:
                        delta *= 80;
                        break;
                    default:
                        throw 'unrecognized mouse wheel delta mode: ' + event.deltaMode;
                }
                break;
            default:
                throw 'unrecognized mouse wheel event: ' + event.type;
        }
        return delta;
    },
    mouseX: 0,
    mouseY: 0,
    mouseMovementX: 0,
    mouseMovementY: 0,
    touches: {},
    lastTouches: {},
    calculateMouseCoords(pageX, pageY) {
        var rect = Module['canvas'].getBoundingClientRect();
        var cw = Module['canvas'].width;
        var ch = Module['canvas'].height;
        var scrollX = typeof window.scrollX != 'undefined' ? window.scrollX : window.pageXOffset;
        var scrollY = typeof window.scrollY != 'undefined' ? window.scrollY : window.pageYOffset;
        var adjustedX = pageX - (scrollX + rect.left);
        var adjustedY = pageY - (scrollY + rect.top);
        adjustedX = adjustedX * (cw / rect.width);
        adjustedY = adjustedY * (ch / rect.height);
        return { x: adjustedX, y: adjustedY };
    },
    setMouseCoords(pageX, pageY) {
        const { x, y } = Browser.calculateMouseCoords(pageX, pageY);
        Browser.mouseMovementX = x - Browser.mouseX;
        Browser.mouseMovementY = y - Browser.mouseY;
        Browser.mouseX = x;
        Browser.mouseY = y;
    },
    calculateMouseEvent(event) {
        if (Browser.pointerLock) {
            if (event.type != 'mousemove' && 'mozMovementX' in event) {
                Browser.mouseMovementX = Browser.mouseMovementY = 0;
            } else {
                Browser.mouseMovementX = Browser.getMovementX(event);
                Browser.mouseMovementY = Browser.getMovementY(event);
            }
            Browser.mouseX += Browser.mouseMovementX;
            Browser.mouseY += Browser.mouseMovementY;
        } else {
            if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
                var touch = event.touch;
                if (touch === undefined) {
                    return;
                }
                var coords = Browser.calculateMouseCoords(touch.pageX, touch.pageY);
                if (event.type === 'touchstart') {
                    Browser.lastTouches[touch.identifier] = coords;
                    Browser.touches[touch.identifier] = coords;
                } else if (event.type === 'touchend' || event.type === 'touchmove') {
                    var last = Browser.touches[touch.identifier];
                    last ||= coords;
                    Browser.lastTouches[touch.identifier] = last;
                    Browser.touches[touch.identifier] = coords;
                }
                return;
            }
            Browser.setMouseCoords(event.pageX, event.pageY);
        }
    },
    resizeListeners: [],
    updateResizeListeners() {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach((listener) => listener(canvas.width, canvas.height));
    },
    setCanvasSize(width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
    },
    windowedWidth: 0,
    windowedHeight: 0,
    setFullscreenCanvasSize() {
        if (typeof SDL != 'undefined') {
            var flags = HEAPU32[SDL.screen >> 2];
            flags = flags | 8388608;
            HEAP32[SDL.screen >> 2] = flags;
        }
        Browser.updateCanvasDimensions(Module['canvas']);
        Browser.updateResizeListeners();
    },
    setWindowedCanvasSize() {
        if (typeof SDL != 'undefined') {
            var flags = HEAPU32[SDL.screen >> 2];
            flags = flags & ~8388608;
            HEAP32[SDL.screen >> 2] = flags;
        }
        Browser.updateCanvasDimensions(Module['canvas']);
        Browser.updateResizeListeners();
    },
    updateCanvasDimensions(canvas, wNative, hNative) {
        if (wNative && hNative) {
            canvas.widthNative = wNative;
            canvas.heightNative = hNative;
        } else {
            wNative = canvas.widthNative;
            hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
            if (w / h < Module['forcedAspectRatio']) {
                w = Math.round(h * Module['forcedAspectRatio']);
            } else {
                h = Math.round(w / Module['forcedAspectRatio']);
            }
        }
        if (
            (document['fullscreenElement'] ||
                document['mozFullScreenElement'] ||
                document['msFullscreenElement'] ||
                document['webkitFullscreenElement'] ||
                document['webkitCurrentFullScreenElement']) === canvas.parentNode &&
            typeof screen != 'undefined'
        ) {
            var factor = Math.min(screen.width / w, screen.height / h);
            w = Math.round(w * factor);
            h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
            if (canvas.width != w) canvas.width = w;
            if (canvas.height != h) canvas.height = h;
            if (typeof canvas.style != 'undefined') {
                canvas.style.removeProperty('width');
                canvas.style.removeProperty('height');
            }
        } else {
            if (canvas.width != wNative) canvas.width = wNative;
            if (canvas.height != hNative) canvas.height = hNative;
            if (typeof canvas.style != 'undefined') {
                if (w != wNative || h != hNative) {
                    canvas.style.setProperty('width', w + 'px', 'important');
                    canvas.style.setProperty('height', h + 'px', 'important');
                } else {
                    canvas.style.removeProperty('width');
                    canvas.style.removeProperty('height');
                }
            }
        }
    },
};
var EGL = {
    errorCode: 12288,
    defaultDisplayInitialized: false,
    currentContext: 0,
    currentReadSurface: 0,
    currentDrawSurface: 0,
    contextAttributes: { alpha: false, depth: false, stencil: false, antialias: false },
    stringCache: {},
    setErrorCode(code) {
        EGL.errorCode = code;
    },
    chooseConfig(display, attribList, config, config_size, numConfigs) {
        if (display != 62e3) {
            EGL.setErrorCode(12296);
            return 0;
        }
        if (attribList) {
            for (;;) {
                var param = HEAP32[attribList >> 2];
                if (param == 12321) {
                    var alphaSize = HEAP32[(attribList + 4) >> 2];
                    EGL.contextAttributes.alpha = alphaSize > 0;
                } else if (param == 12325) {
                    var depthSize = HEAP32[(attribList + 4) >> 2];
                    EGL.contextAttributes.depth = depthSize > 0;
                } else if (param == 12326) {
                    var stencilSize = HEAP32[(attribList + 4) >> 2];
                    EGL.contextAttributes.stencil = stencilSize > 0;
                } else if (param == 12337) {
                    var samples = HEAP32[(attribList + 4) >> 2];
                    EGL.contextAttributes.antialias = samples > 0;
                } else if (param == 12338) {
                    var samples = HEAP32[(attribList + 4) >> 2];
                    EGL.contextAttributes.antialias = samples == 1;
                } else if (param == 12544) {
                    var requestedPriority = HEAP32[(attribList + 4) >> 2];
                    EGL.contextAttributes.lowLatency = requestedPriority != 12547;
                } else if (param == 12344) {
                    break;
                }
                attribList += 8;
            }
        }
        if ((!config || !config_size) && !numConfigs) {
            EGL.setErrorCode(12300);
            return 0;
        }
        if (numConfigs) {
            HEAP32[numConfigs >> 2] = 1;
        }
        if (config && config_size > 0) {
            HEAPU32[config >> 2] = 62002;
        }
        EGL.setErrorCode(12288);
        return 1;
    },
};
var _eglBindAPI = (api) => {
    if (api == 12448) {
        EGL.setErrorCode(12288);
        return 1;
    }
    EGL.setErrorCode(12300);
    return 0;
};
var _eglChooseConfig = (display, attrib_list, configs, config_size, numConfigs) =>
    EGL.chooseConfig(display, attrib_list, configs, config_size, numConfigs);
var GLctx;
var webgl_enable_ANGLE_instanced_arrays = (ctx) => {
    var ext = ctx.getExtension('ANGLE_instanced_arrays');
    if (ext) {
        ctx['vertexAttribDivisor'] = (index, divisor) => ext['vertexAttribDivisorANGLE'](index, divisor);
        ctx['drawArraysInstanced'] = (mode, first, count, primcount) =>
            ext['drawArraysInstancedANGLE'](mode, first, count, primcount);
        ctx['drawElementsInstanced'] = (mode, count, type, indices, primcount) =>
            ext['drawElementsInstancedANGLE'](mode, count, type, indices, primcount);
        return 1;
    }
};
var webgl_enable_OES_vertex_array_object = (ctx) => {
    var ext = ctx.getExtension('OES_vertex_array_object');
    if (ext) {
        ctx['createVertexArray'] = () => ext['createVertexArrayOES']();
        ctx['deleteVertexArray'] = (vao) => ext['deleteVertexArrayOES'](vao);
        ctx['bindVertexArray'] = (vao) => ext['bindVertexArrayOES'](vao);
        ctx['isVertexArray'] = (vao) => ext['isVertexArrayOES'](vao);
        return 1;
    }
};
var webgl_enable_WEBGL_draw_buffers = (ctx) => {
    var ext = ctx.getExtension('WEBGL_draw_buffers');
    if (ext) {
        ctx['drawBuffers'] = (n, bufs) => ext['drawBuffersWEBGL'](n, bufs);
        return 1;
    }
};
var webgl_enable_EXT_polygon_offset_clamp = (ctx) =>
    !!(ctx.extPolygonOffsetClamp = ctx.getExtension('EXT_polygon_offset_clamp'));
var webgl_enable_EXT_clip_control = (ctx) => !!(ctx.extClipControl = ctx.getExtension('EXT_clip_control'));
var webgl_enable_WEBGL_polygon_mode = (ctx) => !!(ctx.webglPolygonMode = ctx.getExtension('WEBGL_polygon_mode'));
var webgl_enable_WEBGL_multi_draw = (ctx) => !!(ctx.multiDrawWebgl = ctx.getExtension('WEBGL_multi_draw'));
var getEmscriptenSupportedExtensions = (ctx) => {
    var supportedExtensions = [
        'ANGLE_instanced_arrays',
        'EXT_blend_minmax',
        'EXT_disjoint_timer_query',
        'EXT_frag_depth',
        'EXT_shader_texture_lod',
        'EXT_sRGB',
        'OES_element_index_uint',
        'OES_fbo_render_mipmap',
        'OES_standard_derivatives',
        'OES_texture_float',
        'OES_texture_half_float',
        'OES_texture_half_float_linear',
        'OES_vertex_array_object',
        'WEBGL_color_buffer_float',
        'WEBGL_depth_texture',
        'WEBGL_draw_buffers',
        'EXT_clip_control',
        'EXT_color_buffer_half_float',
        'EXT_depth_clamp',
        'EXT_float_blend',
        'EXT_polygon_offset_clamp',
        'EXT_texture_compression_bptc',
        'EXT_texture_compression_rgtc',
        'EXT_texture_filter_anisotropic',
        'KHR_parallel_shader_compile',
        'OES_texture_float_linear',
        'WEBGL_blend_func_extended',
        'WEBGL_compressed_texture_astc',
        'WEBGL_compressed_texture_etc',
        'WEBGL_compressed_texture_etc1',
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_compressed_texture_s3tc_srgb',
        'WEBGL_debug_renderer_info',
        'WEBGL_debug_shaders',
        'WEBGL_lose_context',
        'WEBGL_multi_draw',
        'WEBGL_polygon_mode',
    ];
    return (ctx.getSupportedExtensions() || []).filter((ext) => supportedExtensions.includes(ext));
};
var registerPreMainLoop = (f) => {
    typeof MainLoop != 'undefined' && MainLoop.preMainLoop.push(f);
};
var GL = {
    counter: 1,
    buffers: [],
    programs: [],
    framebuffers: [],
    renderbuffers: [],
    textures: [],
    shaders: [],
    vaos: [],
    contexts: [],
    offscreenCanvases: {},
    queries: [],
    byteSizeByTypeRoot: 5120,
    byteSizeByType: [1, 1, 2, 2, 4, 4, 4, 2, 3, 4, 8],
    stringCache: {},
    unpackAlignment: 4,
    unpackRowLength: 0,
    recordError: (errorCode) => {
        if (!GL.lastError) {
            GL.lastError = errorCode;
        }
    },
    getNewId: (table) => {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
            table[i] = null;
        }
        return ret;
    },
    genObject: (n, buffers, createFunction, objectTable) => {
        for (var i = 0; i < n; i++) {
            var buffer = GLctx[createFunction]();
            var id = buffer && GL.getNewId(objectTable);
            if (buffer) {
                buffer.name = id;
                objectTable[id] = buffer;
            } else {
                GL.recordError(1282);
            }
            HEAP32[(buffers + i * 4) >> 2] = id;
        }
    },
    MAX_TEMP_BUFFER_SIZE: 2097152,
    numTempVertexBuffersPerSize: 64,
    log2ceilLookup: (i) => 32 - Math.clz32(i === 0 ? 0 : i - 1),
    generateTempBuffers: (quads, context) => {
        var largestIndex = GL.log2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
        context.tempVertexBufferCounters1 = [];
        context.tempVertexBufferCounters2 = [];
        context.tempVertexBufferCounters1.length = context.tempVertexBufferCounters2.length = largestIndex + 1;
        context.tempVertexBuffers1 = [];
        context.tempVertexBuffers2 = [];
        context.tempVertexBuffers1.length = context.tempVertexBuffers2.length = largestIndex + 1;
        context.tempIndexBuffers = [];
        context.tempIndexBuffers.length = largestIndex + 1;
        for (var i = 0; i <= largestIndex; ++i) {
            context.tempIndexBuffers[i] = null;
            context.tempVertexBufferCounters1[i] = context.tempVertexBufferCounters2[i] = 0;
            var ringbufferLength = GL.numTempVertexBuffersPerSize;
            context.tempVertexBuffers1[i] = [];
            context.tempVertexBuffers2[i] = [];
            var ringbuffer1 = context.tempVertexBuffers1[i];
            var ringbuffer2 = context.tempVertexBuffers2[i];
            ringbuffer1.length = ringbuffer2.length = ringbufferLength;
            for (var j = 0; j < ringbufferLength; ++j) {
                ringbuffer1[j] = ringbuffer2[j] = null;
            }
        }
        if (quads) {
            context.tempQuadIndexBuffer = GLctx.createBuffer();
            context.GLctx.bindBuffer(34963, context.tempQuadIndexBuffer);
            var numIndexes = GL.MAX_TEMP_BUFFER_SIZE >> 1;
            var quadIndexes = new Uint16Array(numIndexes);
            var i = 0,
                v = 0;
            while (1) {
                quadIndexes[i++] = v;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v + 1;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v + 2;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v + 2;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v + 3;
                if (i >= numIndexes) break;
                v += 4;
            }
            context.GLctx.bufferData(34963, quadIndexes, 35044);
            context.GLctx.bindBuffer(34963, null);
        }
    },
    getTempVertexBuffer: (sizeBytes) => {
        var idx = GL.log2ceilLookup(sizeBytes);
        var ringbuffer = GL.currentContext.tempVertexBuffers1[idx];
        var nextFreeBufferIndex = GL.currentContext.tempVertexBufferCounters1[idx];
        GL.currentContext.tempVertexBufferCounters1[idx] =
            (GL.currentContext.tempVertexBufferCounters1[idx] + 1) & (GL.numTempVertexBuffersPerSize - 1);
        var vbo = ringbuffer[nextFreeBufferIndex];
        if (vbo) {
            return vbo;
        }
        var prevVBO = GLctx.getParameter(34964);
        ringbuffer[nextFreeBufferIndex] = GLctx.createBuffer();
        GLctx.bindBuffer(34962, ringbuffer[nextFreeBufferIndex]);
        GLctx.bufferData(34962, 1 << idx, 35048);
        GLctx.bindBuffer(34962, prevVBO);
        return ringbuffer[nextFreeBufferIndex];
    },
    getTempIndexBuffer: (sizeBytes) => {
        var idx = GL.log2ceilLookup(sizeBytes);
        var ibo = GL.currentContext.tempIndexBuffers[idx];
        if (ibo) {
            return ibo;
        }
        var prevIBO = GLctx.getParameter(34965);
        GL.currentContext.tempIndexBuffers[idx] = GLctx.createBuffer();
        GLctx.bindBuffer(34963, GL.currentContext.tempIndexBuffers[idx]);
        GLctx.bufferData(34963, 1 << idx, 35048);
        GLctx.bindBuffer(34963, prevIBO);
        return GL.currentContext.tempIndexBuffers[idx];
    },
    newRenderingFrameStarted: () => {
        if (!GL.currentContext) {
            return;
        }
        var vb = GL.currentContext.tempVertexBuffers1;
        GL.currentContext.tempVertexBuffers1 = GL.currentContext.tempVertexBuffers2;
        GL.currentContext.tempVertexBuffers2 = vb;
        vb = GL.currentContext.tempVertexBufferCounters1;
        GL.currentContext.tempVertexBufferCounters1 = GL.currentContext.tempVertexBufferCounters2;
        GL.currentContext.tempVertexBufferCounters2 = vb;
        var largestIndex = GL.log2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
        for (var i = 0; i <= largestIndex; ++i) {
            GL.currentContext.tempVertexBufferCounters1[i] = 0;
        }
    },
    getSource: (shader, count, string, length) => {
        var source = '';
        for (var i = 0; i < count; ++i) {
            var len = length ? HEAPU32[(length + i * 4) >> 2] : undefined;
            source += UTF8ToString(HEAPU32[(string + i * 4) >> 2], len);
        }
        return source;
    },
    calcBufLength: (size, type, stride, count) => {
        if (stride > 0) {
            return count * stride;
        }
        var typeSize = GL.byteSizeByType[type - GL.byteSizeByTypeRoot];
        return size * typeSize * count;
    },
    usedTempBuffers: [],
    preDrawHandleClientVertexAttribBindings: (count) => {
        GL.resetBufferBinding = false;
        for (var i = 0; i < GL.currentContext.maxVertexAttribs; ++i) {
            var cb = GL.currentContext.clientBuffers[i];
            if (!cb.clientside || !cb.enabled) continue;
            GL.resetBufferBinding = true;
            var size = GL.calcBufLength(cb.size, cb.type, cb.stride, count);
            var buf = GL.getTempVertexBuffer(size);
            GLctx.bindBuffer(34962, buf);
            GLctx.bufferSubData(34962, 0, HEAPU8.subarray(cb.ptr, cb.ptr + size));
            cb.vertexAttribPointerAdaptor.call(GLctx, i, cb.size, cb.type, cb.normalized, cb.stride, 0);
        }
    },
    postDrawHandleClientVertexAttribBindings: () => {
        if (GL.resetBufferBinding) {
            GLctx.bindBuffer(34962, GL.buffers[GLctx.currentArrayBufferBinding]);
        }
    },
    createContext: (canvas, webGLContextAttributes) => {
        if (!canvas.getContextSafariWebGL2Fixed) {
            canvas.getContextSafariWebGL2Fixed = canvas.getContext;
            function fixedGetContext(ver, attrs) {
                var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
                return (ver == 'webgl') == gl instanceof WebGLRenderingContext ? gl : null;
            }
            canvas.getContext = fixedGetContext;
        }
        var ctx = canvas.getContext('webgl', webGLContextAttributes);
        if (!ctx) return 0;
        var handle = GL.registerContext(ctx, webGLContextAttributes);
        return handle;
    },
    registerContext: (ctx, webGLContextAttributes) => {
        var handle = GL.getNewId(GL.contexts);
        var context = {
            handle,
            attributes: webGLContextAttributes,
            version: webGLContextAttributes.majorVersion,
            GLctx: ctx,
        };
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (
            typeof webGLContextAttributes.enableExtensionsByDefault == 'undefined' ||
            webGLContextAttributes.enableExtensionsByDefault
        ) {
            GL.initExtensions(context);
        }
        context.maxVertexAttribs = context.GLctx.getParameter(34921);
        context.clientBuffers = [];
        for (var i = 0; i < context.maxVertexAttribs; i++) {
            context.clientBuffers[i] = {
                enabled: false,
                clientside: false,
                size: 0,
                type: 0,
                normalized: 0,
                stride: 0,
                ptr: 0,
                vertexAttribPointerAdaptor: null,
            };
        }
        GL.generateTempBuffers(false, context);
        return handle;
    },
    makeContextCurrent: (contextHandle) => {
        GL.currentContext = GL.contexts[contextHandle];
        Module['ctx'] = GLctx = GL.currentContext?.GLctx;
        return !(contextHandle && !GLctx);
    },
    getContext: (contextHandle) => GL.contexts[contextHandle],
    deleteContext: (contextHandle) => {
        if (GL.currentContext === GL.contexts[contextHandle]) {
            GL.currentContext = null;
        }
        if (typeof JSEvents == 'object') {
            JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
        }
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) {
            GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        }
        GL.contexts[contextHandle] = null;
    },
    initExtensions: (context) => {
        context ||= GL.currentContext;
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
        var GLctx = context.GLctx;
        webgl_enable_WEBGL_multi_draw(GLctx);
        webgl_enable_EXT_polygon_offset_clamp(GLctx);
        webgl_enable_EXT_clip_control(GLctx);
        webgl_enable_WEBGL_polygon_mode(GLctx);
        webgl_enable_ANGLE_instanced_arrays(GLctx);
        webgl_enable_OES_vertex_array_object(GLctx);
        webgl_enable_WEBGL_draw_buffers(GLctx);
        {
            GLctx.disjointTimerQueryExt = GLctx.getExtension('EXT_disjoint_timer_query');
        }
        getEmscriptenSupportedExtensions(GLctx).forEach((ext) => {
            if (!ext.includes('lose_context') && !ext.includes('debug')) {
                GLctx.getExtension(ext);
            }
        });
    },
};
var _eglCreateContext = (display, config, hmm, contextAttribs) => {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    var glesContextVersion = 1;
    for (;;) {
        var param = HEAP32[contextAttribs >> 2];
        if (param == 12440) {
            glesContextVersion = HEAP32[(contextAttribs + 4) >> 2];
        } else if (param == 12344) {
            break;
        } else {
            EGL.setErrorCode(12292);
            return 0;
        }
        contextAttribs += 8;
    }
    if (glesContextVersion != 2) {
        EGL.setErrorCode(12293);
        return 0;
    }
    EGL.contextAttributes.majorVersion = glesContextVersion - 1;
    EGL.contextAttributes.minorVersion = 0;
    EGL.context = GL.createContext(Module['canvas'], EGL.contextAttributes);
    if (EGL.context != 0) {
        EGL.setErrorCode(12288);
        GL.makeContextCurrent(EGL.context);
        Browser.useWebGL = true;
        Browser.moduleContextCreatedCallbacks.forEach((callback) => callback());
        GL.makeContextCurrent(null);
        return 62004;
    } else {
        EGL.setErrorCode(12297);
        return 0;
    }
};
var _eglCreateWindowSurface = (display, config, win, attrib_list) => {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    if (config != 62002) {
        EGL.setErrorCode(12293);
        return 0;
    }
    EGL.setErrorCode(12288);
    return 62006;
};
var _eglDestroyContext = (display, context) => {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    if (context != 62004) {
        EGL.setErrorCode(12294);
        return 0;
    }
    GL.deleteContext(EGL.context);
    EGL.setErrorCode(12288);
    if (EGL.currentContext == context) {
        EGL.currentContext = 0;
    }
    return 1;
};
var _eglDestroySurface = (display, surface) => {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    if (surface != 62006) {
        EGL.setErrorCode(12301);
        return 1;
    }
    if (EGL.currentReadSurface == surface) {
        EGL.currentReadSurface = 0;
    }
    if (EGL.currentDrawSurface == surface) {
        EGL.currentDrawSurface = 0;
    }
    EGL.setErrorCode(12288);
    return 1;
};
var _eglGetConfigAttrib = (display, config, attribute, value) => {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    if (config != 62002) {
        EGL.setErrorCode(12293);
        return 0;
    }
    if (!value) {
        EGL.setErrorCode(12300);
        return 0;
    }
    EGL.setErrorCode(12288);
    switch (attribute) {
        case 12320:
            HEAP32[value >> 2] = EGL.contextAttributes.alpha ? 32 : 24;
            return 1;
        case 12321:
            HEAP32[value >> 2] = EGL.contextAttributes.alpha ? 8 : 0;
            return 1;
        case 12322:
            HEAP32[value >> 2] = 8;
            return 1;
        case 12323:
            HEAP32[value >> 2] = 8;
            return 1;
        case 12324:
            HEAP32[value >> 2] = 8;
            return 1;
        case 12325:
            HEAP32[value >> 2] = EGL.contextAttributes.depth ? 24 : 0;
            return 1;
        case 12326:
            HEAP32[value >> 2] = EGL.contextAttributes.stencil ? 8 : 0;
            return 1;
        case 12327:
            HEAP32[value >> 2] = 12344;
            return 1;
        case 12328:
            HEAP32[value >> 2] = 62002;
            return 1;
        case 12329:
            HEAP32[value >> 2] = 0;
            return 1;
        case 12330:
            HEAP32[value >> 2] = 4096;
            return 1;
        case 12331:
            HEAP32[value >> 2] = 16777216;
            return 1;
        case 12332:
            HEAP32[value >> 2] = 4096;
            return 1;
        case 12333:
            HEAP32[value >> 2] = 0;
            return 1;
        case 12334:
            HEAP32[value >> 2] = 0;
            return 1;
        case 12335:
            HEAP32[value >> 2] = 12344;
            return 1;
        case 12337:
            HEAP32[value >> 2] = EGL.contextAttributes.antialias ? 4 : 0;
            return 1;
        case 12338:
            HEAP32[value >> 2] = EGL.contextAttributes.antialias ? 1 : 0;
            return 1;
        case 12339:
            HEAP32[value >> 2] = 4;
            return 1;
        case 12340:
            HEAP32[value >> 2] = 12344;
            return 1;
        case 12341:
        case 12342:
        case 12343:
            HEAP32[value >> 2] = -1;
            return 1;
        case 12345:
        case 12346:
            HEAP32[value >> 2] = 0;
            return 1;
        case 12347:
            HEAP32[value >> 2] = 0;
            return 1;
        case 12348:
            HEAP32[value >> 2] = 1;
            return 1;
        case 12349:
        case 12350:
            HEAP32[value >> 2] = 0;
            return 1;
        case 12351:
            HEAP32[value >> 2] = 12430;
            return 1;
        case 12352:
            HEAP32[value >> 2] = 4;
            return 1;
        case 12354:
            HEAP32[value >> 2] = 0;
            return 1;
        default:
            EGL.setErrorCode(12292);
            return 0;
    }
};
var _eglGetDisplay = (nativeDisplayType) => {
    EGL.setErrorCode(12288);
    if (nativeDisplayType != 0 && nativeDisplayType != 1) {
        return 0;
    }
    return 62e3;
};
var _eglGetError = () => EGL.errorCode;
var _eglInitialize = (display, majorVersion, minorVersion) => {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    if (majorVersion) {
        HEAP32[majorVersion >> 2] = 1;
    }
    if (minorVersion) {
        HEAP32[minorVersion >> 2] = 4;
    }
    EGL.defaultDisplayInitialized = true;
    EGL.setErrorCode(12288);
    return 1;
};
var _eglMakeCurrent = (display, draw, read, context) => {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    if (context != 0 && context != 62004) {
        EGL.setErrorCode(12294);
        return 0;
    }
    if ((read != 0 && read != 62006) || (draw != 0 && draw != 62006)) {
        EGL.setErrorCode(12301);
        return 0;
    }
    GL.makeContextCurrent(context ? EGL.context : null);
    EGL.currentContext = context;
    EGL.currentDrawSurface = draw;
    EGL.currentReadSurface = read;
    EGL.setErrorCode(12288);
    return 1;
};
var stringToNewUTF8 = (str) => {
    var size = lengthBytesUTF8(str) + 1;
    var ret = _malloc(size);
    if (ret) stringToUTF8(str, ret, size);
    return ret;
};
var _eglQueryString = (display, name) => {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    EGL.setErrorCode(12288);
    if (EGL.stringCache[name]) return EGL.stringCache[name];
    var ret;
    switch (name) {
        case 12371:
            ret = stringToNewUTF8('Emscripten');
            break;
        case 12372:
            ret = stringToNewUTF8('1.4 Emscripten EGL');
            break;
        case 12373:
            ret = stringToNewUTF8('');
            break;
        case 12429:
            ret = stringToNewUTF8('OpenGL_ES');
            break;
        default:
            EGL.setErrorCode(12300);
            return 0;
    }
    EGL.stringCache[name] = ret;
    return ret;
};
var _eglSwapBuffers = (dpy, surface) => {
    if (!EGL.defaultDisplayInitialized) {
        EGL.setErrorCode(12289);
    } else if (!GLctx) {
        EGL.setErrorCode(12290);
    } else if (GLctx.isContextLost()) {
        EGL.setErrorCode(12302);
    } else {
        EGL.setErrorCode(12288);
        return 1;
    }
    return 0;
};
var setMainLoop = (iterFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
    MainLoop.func = iterFunc;
    MainLoop.arg = arg;
    var thisMainLoopId = MainLoop.currentlyRunningMainloop;
    function checkIsRunning() {
        if (thisMainLoopId < MainLoop.currentlyRunningMainloop) {
            maybeExit();
            return false;
        }
        return true;
    }
    MainLoop.running = false;
    MainLoop.runner = function MainLoop_runner() {
        if (ABORT) return;
        if (MainLoop.queue.length > 0) {
            var start = Date.now();
            var blocker = MainLoop.queue.shift();
            blocker.func(blocker.arg);
            if (MainLoop.remainingBlockers) {
                var remaining = MainLoop.remainingBlockers;
                var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
                if (blocker.counted) {
                    MainLoop.remainingBlockers = next;
                } else {
                    next = next + 0.5;
                    MainLoop.remainingBlockers = (8 * remaining + next) / 9;
                }
            }
            MainLoop.updateStatus();
            if (!checkIsRunning()) return;
            setTimeout(MainLoop.runner, 0);
            return;
        }
        if (!checkIsRunning()) return;
        MainLoop.currentFrameNumber = (MainLoop.currentFrameNumber + 1) | 0;
        if (
            MainLoop.timingMode == 1 &&
            MainLoop.timingValue > 1 &&
            MainLoop.currentFrameNumber % MainLoop.timingValue != 0
        ) {
            MainLoop.scheduler();
            return;
        } else if (MainLoop.timingMode == 0) {
            MainLoop.tickStartTime = _emscripten_get_now();
        }
        MainLoop.runIter(iterFunc);
        if (!checkIsRunning()) return;
        MainLoop.scheduler();
    };
    if (!noSetTiming) {
        if (fps && fps > 0) {
            _emscripten_set_main_loop_timing(0, 1e3 / fps);
        } else {
            _emscripten_set_main_loop_timing(1, 1);
        }
        MainLoop.scheduler();
    }
    if (simulateInfiniteLoop) {
        throw 'unwind';
    }
};
var MainLoop = {
    running: false,
    scheduler: null,
    method: '',
    currentlyRunningMainloop: 0,
    func: null,
    arg: 0,
    timingMode: 0,
    timingValue: 0,
    currentFrameNumber: 0,
    queue: [],
    preMainLoop: [],
    postMainLoop: [],
    pause() {
        MainLoop.scheduler = null;
        MainLoop.currentlyRunningMainloop++;
    },
    resume() {
        MainLoop.currentlyRunningMainloop++;
        var timingMode = MainLoop.timingMode;
        var timingValue = MainLoop.timingValue;
        var func = MainLoop.func;
        MainLoop.func = null;
        setMainLoop(func, 0, false, MainLoop.arg, true);
        _emscripten_set_main_loop_timing(timingMode, timingValue);
        MainLoop.scheduler();
    },
    updateStatus() {
        if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = MainLoop.remainingBlockers ?? 0;
            var expected = MainLoop.expectedBlockers ?? 0;
            if (remaining) {
                if (remaining < expected) {
                    Module['setStatus'](`{message} ({expected - remaining}/{expected})`);
                } else {
                    Module['setStatus'](message);
                }
            } else {
                Module['setStatus']('');
            }
        }
    },
    init() {
        Module['preMainLoop'] && MainLoop.preMainLoop.push(Module['preMainLoop']);
        Module['postMainLoop'] && MainLoop.postMainLoop.push(Module['postMainLoop']);
    },
    runIter(func) {
        if (ABORT) return;
        for (var pre of MainLoop.preMainLoop) {
            if (pre() === false) {
                return;
            }
        }
        callUserCallback(func);
        for (var post of MainLoop.postMainLoop) {
            post();
        }
    },
    nextRAF: 0,
    fakeRequestAnimationFrame(func) {
        var now = Date.now();
        if (MainLoop.nextRAF === 0) {
            MainLoop.nextRAF = now + 1e3 / 60;
        } else {
            while (now + 2 >= MainLoop.nextRAF) {
                MainLoop.nextRAF += 1e3 / 60;
            }
        }
        var delay = Math.max(MainLoop.nextRAF - now, 0);
        setTimeout(func, delay);
    },
    requestAnimationFrame(func) {
        if (typeof requestAnimationFrame == 'function') {
            requestAnimationFrame(func);
            return;
        }
        var RAF = MainLoop.fakeRequestAnimationFrame;
        RAF(func);
    },
};
var _emscripten_set_main_loop_timing = (mode, value) => {
    MainLoop.timingMode = mode;
    MainLoop.timingValue = value;
    if (!MainLoop.func) {
        return 1;
    }
    if (!MainLoop.running) {
        MainLoop.running = true;
    }
    if (mode == 0) {
        MainLoop.scheduler = function MainLoop_scheduler_setTimeout() {
            var timeUntilNextTick = Math.max(0, MainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
            setTimeout(MainLoop.runner, timeUntilNextTick);
        };
        MainLoop.method = 'timeout';
    } else if (mode == 1) {
        MainLoop.scheduler = function MainLoop_scheduler_rAF() {
            MainLoop.requestAnimationFrame(MainLoop.runner);
        };
        MainLoop.method = 'rAF';
    } else if (mode == 2) {
        if (typeof MainLoop.setImmediate == 'undefined') {
            if (typeof setImmediate == 'undefined') {
                var setImmediates = [];
                var emscriptenMainLoopMessageId = 'setimmediate';
                var MainLoop_setImmediate_messageHandler = (event) => {
                    if (
                        event.data === emscriptenMainLoopMessageId ||
                        event.data.target === emscriptenMainLoopMessageId
                    ) {
                        event.stopPropagation();
                        setImmediates.shift()();
                    }
                };
                addEventListener('message', MainLoop_setImmediate_messageHandler, true);
                MainLoop.setImmediate = (func) => {
                    setImmediates.push(func);
                    if (ENVIRONMENT_IS_WORKER) {
                        Module['setImmediates'] ??= [];
                        Module['setImmediates'].push(func);
                        postMessage({ target: emscriptenMainLoopMessageId });
                    } else postMessage(emscriptenMainLoopMessageId, '*');
                };
            } else {
                MainLoop.setImmediate = setImmediate;
            }
        }
        MainLoop.scheduler = function MainLoop_scheduler_setImmediate() {
            MainLoop.setImmediate(MainLoop.runner);
        };
        MainLoop.method = 'immediate';
    }
    return 0;
};
var _eglSwapInterval = (display, interval) => {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    if (interval == 0) _emscripten_set_main_loop_timing(0, 0);
    else _emscripten_set_main_loop_timing(1, interval);
    EGL.setErrorCode(12288);
    return 1;
};
var _eglTerminate = (display) => {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    EGL.currentContext = 0;
    EGL.currentReadSurface = 0;
    EGL.currentDrawSurface = 0;
    EGL.defaultDisplayInitialized = false;
    EGL.setErrorCode(12288);
    return 1;
};
var _eglWaitClient = () => {
    EGL.setErrorCode(12288);
    return 1;
};
var _eglWaitGL = _eglWaitClient;
var _eglWaitNative = (nativeEngineId) => {
    EGL.setErrorCode(12288);
    return 1;
};
var readEmAsmArgsArray = [];
var readEmAsmArgs = (sigPtr, buf) => {
    readEmAsmArgsArray.length = 0;
    var ch;
    while ((ch = HEAPU8[sigPtr++])) {
        var wide = ch != 105;
        wide &= ch != 112;
        buf += wide && buf % 8 ? 4 : 0;
        readEmAsmArgsArray.push(
            ch == 112
                ? HEAPU32[buf >> 2]
                : ch == 106
                  ? HEAP64[buf >> 3]
                  : ch == 105
                    ? HEAP32[buf >> 2]
                    : HEAPF64[buf >> 3]
        );
        buf += wide ? 8 : 4;
    }
    return readEmAsmArgsArray;
};
var runEmAsmFunction = (code, sigPtr, argbuf) => {
    var args = readEmAsmArgs(sigPtr, argbuf);
    return ASM_CONSTS[code](...args);
};
var _emscripten_asm_const_int = (code, sigPtr, argbuf) => runEmAsmFunction(code, sigPtr, argbuf);
var runMainThreadEmAsm = (emAsmAddr, sigPtr, argbuf, sync) => {
    var args = readEmAsmArgs(sigPtr, argbuf);
    return ASM_CONSTS[emAsmAddr](...args);
};
var _emscripten_asm_const_int_sync_on_main_thread = (emAsmAddr, sigPtr, argbuf) =>
    runMainThreadEmAsm(emAsmAddr, sigPtr, argbuf, 1);
var _emscripten_asm_const_ptr_sync_on_main_thread = (emAsmAddr, sigPtr, argbuf) =>
    runMainThreadEmAsm(emAsmAddr, sigPtr, argbuf, 1);
var _emscripten_cancel_main_loop = () => {
    MainLoop.pause();
    MainLoop.func = null;
};
var JSEvents = {
    memcpy(target, src, size) {
        HEAP8.set(HEAP8.subarray(src, src + size), target);
    },
    removeAllEventListeners() {
        while (JSEvents.eventHandlers.length) {
            JSEvents._removeHandler(JSEvents.eventHandlers.length - 1);
        }
        JSEvents.deferredCalls = [];
    },
    inEventHandler: 0,
    deferredCalls: [],
    deferCall(targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
            if (arrA.length != arrB.length) return false;
            for (var i in arrA) {
                if (arrA[i] != arrB[i]) return false;
            }
            return true;
        }
        for (var call of JSEvents.deferredCalls) {
            if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
                return;
            }
        }
        JSEvents.deferredCalls.push({ targetFunction, precedence, argsList });
        JSEvents.deferredCalls.sort((x, y) => x.precedence < y.precedence);
    },
    removeDeferredCalls(targetFunction) {
        JSEvents.deferredCalls = JSEvents.deferredCalls.filter((call) => call.targetFunction != targetFunction);
    },
    canPerformEventHandlerRequests() {
        if (navigator.userActivation) {
            return navigator.userActivation.isActive;
        }
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls;
    },
    runDeferredCalls() {
        if (!JSEvents.canPerformEventHandlerRequests()) {
            return;
        }
        var deferredCalls = JSEvents.deferredCalls;
        JSEvents.deferredCalls = [];
        for (var call of deferredCalls) {
            call.targetFunction(...call.argsList);
        }
    },
    eventHandlers: [],
    removeAllHandlersOnTarget: (target, eventTypeString) => {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (
                JSEvents.eventHandlers[i].target == target &&
                (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)
            ) {
                JSEvents._removeHandler(i--);
            }
        }
    },
    _removeHandler(i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1);
    },
    registerOrRemoveHandler(eventHandler) {
        if (!eventHandler.target) {
            return -4;
        }
        if (eventHandler.callbackfunc) {
            eventHandler.eventListenerFunc = function (event) {
                ++JSEvents.inEventHandler;
                JSEvents.currentEventHandler = eventHandler;
                JSEvents.runDeferredCalls();
                eventHandler.handlerFunc(event);
                JSEvents.runDeferredCalls();
                --JSEvents.inEventHandler;
            };
            eventHandler.target.addEventListener(
                eventHandler.eventTypeString,
                eventHandler.eventListenerFunc,
                eventHandler.useCapture
            );
            JSEvents.eventHandlers.push(eventHandler);
        } else {
            for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                if (
                    JSEvents.eventHandlers[i].target == eventHandler.target &&
                    JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString
                ) {
                    JSEvents._removeHandler(i--);
                }
            }
        }
        return 0;
    },
    getNodeNameForTarget(target) {
        if (!target) return '';
        if (target == window) return '#window';
        if (target == screen) return '#screen';
        return target?.nodeName || '';
    },
    fullscreenEnabled() {
        return document.fullscreenEnabled || document.webkitFullscreenEnabled;
    },
};
var currentFullscreenStrategy = {};
var maybeCStringToJsString = (cString) => (cString > 2 ? UTF8ToString(cString) : cString);
var specialHTMLTargets = [0, typeof document != 'undefined' ? document : 0, typeof window != 'undefined' ? window : 0];
var findEventTarget = (target) => {
    target = maybeCStringToJsString(target);
    var domElement =
        specialHTMLTargets[target] || (typeof document != 'undefined' ? document.querySelector(target) : null);
    return domElement;
};
var findCanvasEventTarget = findEventTarget;
var _emscripten_get_canvas_element_size = (target, width, height) => {
    var canvas = findCanvasEventTarget(target);
    if (!canvas) return -4;
    HEAP32[width >> 2] = canvas.width;
    HEAP32[height >> 2] = canvas.height;
};
var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
var stringToUTF8OnStack = (str) => {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8(str, ret, size);
    return ret;
};
var getCanvasElementSize = (target) => {
    var sp = stackSave();
    var w = stackAlloc(8);
    var h = w + 4;
    var targetInt = stringToUTF8OnStack(target.id);
    var ret = _emscripten_get_canvas_element_size(targetInt, w, h);
    var size = [HEAP32[w >> 2], HEAP32[h >> 2]];
    stackRestore(sp);
    return size;
};
var _emscripten_set_canvas_element_size = (target, width, height) => {
    var canvas = findCanvasEventTarget(target);
    if (!canvas) return -4;
    canvas.width = width;
    canvas.height = height;
    return 0;
};
var setCanvasElementSize = (target, width, height) => {
    if (!target.controlTransferredOffscreen) {
        target.width = width;
        target.height = height;
    } else {
        var sp = stackSave();
        var targetInt = stringToUTF8OnStack(target.id);
        _emscripten_set_canvas_element_size(targetInt, width, height);
        stackRestore(sp);
    }
};
var registerRestoreOldStyle = (canvas) => {
    var canvasSize = getCanvasElementSize(canvas);
    var oldWidth = canvasSize[0];
    var oldHeight = canvasSize[1];
    var oldCssWidth = canvas.style.width;
    var oldCssHeight = canvas.style.height;
    var oldBackgroundColor = canvas.style.backgroundColor;
    var oldDocumentBackgroundColor = document.body.style.backgroundColor;
    var oldPaddingLeft = canvas.style.paddingLeft;
    var oldPaddingRight = canvas.style.paddingRight;
    var oldPaddingTop = canvas.style.paddingTop;
    var oldPaddingBottom = canvas.style.paddingBottom;
    var oldMarginLeft = canvas.style.marginLeft;
    var oldMarginRight = canvas.style.marginRight;
    var oldMarginTop = canvas.style.marginTop;
    var oldMarginBottom = canvas.style.marginBottom;
    var oldDocumentBodyMargin = document.body.style.margin;
    var oldDocumentOverflow = document.documentElement.style.overflow;
    var oldDocumentScroll = document.body.scroll;
    var oldImageRendering = canvas.style.imageRendering;
    function restoreOldStyle() {
        var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
        if (!fullscreenElement) {
            document.removeEventListener('fullscreenchange', restoreOldStyle);
            document.removeEventListener('webkitfullscreenchange', restoreOldStyle);
            setCanvasElementSize(canvas, oldWidth, oldHeight);
            canvas.style.width = oldCssWidth;
            canvas.style.height = oldCssHeight;
            canvas.style.backgroundColor = oldBackgroundColor;
            if (!oldDocumentBackgroundColor) document.body.style.backgroundColor = 'white';
            document.body.style.backgroundColor = oldDocumentBackgroundColor;
            canvas.style.paddingLeft = oldPaddingLeft;
            canvas.style.paddingRight = oldPaddingRight;
            canvas.style.paddingTop = oldPaddingTop;
            canvas.style.paddingBottom = oldPaddingBottom;
            canvas.style.marginLeft = oldMarginLeft;
            canvas.style.marginRight = oldMarginRight;
            canvas.style.marginTop = oldMarginTop;
            canvas.style.marginBottom = oldMarginBottom;
            document.body.style.margin = oldDocumentBodyMargin;
            document.documentElement.style.overflow = oldDocumentOverflow;
            document.body.scroll = oldDocumentScroll;
            canvas.style.imageRendering = oldImageRendering;
            if (canvas.GLctxObject) canvas.GLctxObject.GLctx.viewport(0, 0, oldWidth, oldHeight);
            if (currentFullscreenStrategy.canvasResizedCallback) {
                ((a1, a2, a3) => dynCall_iiii(currentFullscreenStrategy.canvasResizedCallback, a1, a2, a3))(
                    37,
                    0,
                    currentFullscreenStrategy.canvasResizedCallbackUserData
                );
            }
        }
    }
    document.addEventListener('fullscreenchange', restoreOldStyle);
    document.addEventListener('webkitfullscreenchange', restoreOldStyle);
    return restoreOldStyle;
};
var setLetterbox = (element, topBottom, leftRight) => {
    element.style.paddingLeft = element.style.paddingRight = leftRight + 'px';
    element.style.paddingTop = element.style.paddingBottom = topBottom + 'px';
};
var getBoundingClientRect = (e) =>
    specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : { left: 0, top: 0 };
var JSEvents_resizeCanvasForFullscreen = (target, strategy) => {
    var restoreOldStyle = registerRestoreOldStyle(target);
    var cssWidth = strategy.softFullscreen ? innerWidth : screen.width;
    var cssHeight = strategy.softFullscreen ? innerHeight : screen.height;
    var rect = getBoundingClientRect(target);
    var windowedCssWidth = rect.width;
    var windowedCssHeight = rect.height;
    var canvasSize = getCanvasElementSize(target);
    var windowedRttWidth = canvasSize[0];
    var windowedRttHeight = canvasSize[1];
    if (strategy.scaleMode == 3) {
        setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
        cssWidth = windowedCssWidth;
        cssHeight = windowedCssHeight;
    } else if (strategy.scaleMode == 2) {
        if (cssWidth * windowedRttHeight < windowedRttWidth * cssHeight) {
            var desiredCssHeight = (windowedRttHeight * cssWidth) / windowedRttWidth;
            setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
            cssHeight = desiredCssHeight;
        } else {
            var desiredCssWidth = (windowedRttWidth * cssHeight) / windowedRttHeight;
            setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
            cssWidth = desiredCssWidth;
        }
    }
    target.style.backgroundColor ||= 'black';
    document.body.style.backgroundColor ||= 'black';
    target.style.width = cssWidth + 'px';
    target.style.height = cssHeight + 'px';
    if (strategy.filteringMode == 1) {
        target.style.imageRendering = 'optimizeSpeed';
        target.style.imageRendering = '-moz-crisp-edges';
        target.style.imageRendering = '-o-crisp-edges';
        target.style.imageRendering = '-webkit-optimize-contrast';
        target.style.imageRendering = 'optimize-contrast';
        target.style.imageRendering = 'crisp-edges';
        target.style.imageRendering = 'pixelated';
    }
    var dpiScale = strategy.canvasResolutionScaleMode == 2 ? devicePixelRatio : 1;
    if (strategy.canvasResolutionScaleMode != 0) {
        var newWidth = (cssWidth * dpiScale) | 0;
        var newHeight = (cssHeight * dpiScale) | 0;
        setCanvasElementSize(target, newWidth, newHeight);
        if (target.GLctxObject) target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight);
    }
    return restoreOldStyle;
};
var JSEvents_requestFullscreen = (target, strategy) => {
    if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
        JSEvents_resizeCanvasForFullscreen(target, strategy);
    }
    if (target.requestFullscreen) {
        target.requestFullscreen();
    } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    } else {
        return JSEvents.fullscreenEnabled() ? -3 : -1;
    }
    currentFullscreenStrategy = strategy;
    if (strategy.canvasResizedCallback) {
        ((a1, a2, a3) => dynCall_iiii(strategy.canvasResizedCallback, a1, a2, a3))(
            37,
            0,
            strategy.canvasResizedCallbackUserData
        );
    }
    return 0;
};
var _emscripten_exit_fullscreen = () => {
    if (!JSEvents.fullscreenEnabled()) return -1;
    JSEvents.removeDeferredCalls(JSEvents_requestFullscreen);
    var d = specialHTMLTargets[1];
    if (d.exitFullscreen) {
        d.fullscreenElement && d.exitFullscreen();
    } else if (d.webkitExitFullscreen) {
        d.webkitFullscreenElement && d.webkitExitFullscreen();
    } else {
        return -1;
    }
    return 0;
};
var requestPointerLock = (target) => {
    if (target.requestPointerLock) {
        target.requestPointerLock();
    } else {
        if (document.body.requestPointerLock) {
            return -3;
        }
        return -1;
    }
    return 0;
};
var _emscripten_exit_pointerlock = () => {
    JSEvents.removeDeferredCalls(requestPointerLock);
    if (document.exitPointerLock) {
        document.exitPointerLock();
    } else {
        return -1;
    }
    return 0;
};
var __emscripten_runtime_keepalive_clear = () => {
    noExitRuntime = false;
    runtimeKeepaliveCounter = 0;
};
var _emscripten_force_exit = (status) => {
    __emscripten_runtime_keepalive_clear();
    _exit(status);
};
var _emscripten_get_device_pixel_ratio = () => (typeof devicePixelRatio == 'number' && devicePixelRatio) || 1;
var _emscripten_get_element_css_size = (target, width, height) => {
    target = findEventTarget(target);
    if (!target) return -4;
    var rect = getBoundingClientRect(target);
    HEAPF64[width >> 3] = rect.width;
    HEAPF64[height >> 3] = rect.height;
    return 0;
};
var fillGamepadEventData = (eventStruct, e) => {
    HEAPF64[eventStruct >> 3] = e.timestamp;
    for (var i = 0; i < e.axes.length; ++i) {
        HEAPF64[(eventStruct + i * 8 + 16) >> 3] = e.axes[i];
    }
    for (var i = 0; i < e.buttons.length; ++i) {
        if (typeof e.buttons[i] == 'object') {
            HEAPF64[(eventStruct + i * 8 + 528) >> 3] = e.buttons[i].value;
        } else {
            HEAPF64[(eventStruct + i * 8 + 528) >> 3] = e.buttons[i];
        }
    }
    for (var i = 0; i < e.buttons.length; ++i) {
        if (typeof e.buttons[i] == 'object') {
            HEAP8[eventStruct + i + 1040] = e.buttons[i].pressed;
        } else {
            HEAP8[eventStruct + i + 1040] = e.buttons[i] == 1;
        }
    }
    HEAP8[eventStruct + 1104] = e.connected;
    HEAP32[(eventStruct + 1108) >> 2] = e.index;
    HEAP32[(eventStruct + 8) >> 2] = e.axes.length;
    HEAP32[(eventStruct + 12) >> 2] = e.buttons.length;
    stringToUTF8(e.id, eventStruct + 1112, 64);
    stringToUTF8(e.mapping, eventStruct + 1176, 64);
};
var _emscripten_get_gamepad_status = (index, gamepadState) => {
    if (index < 0 || index >= JSEvents.lastGamepadState.length) return -5;
    if (!JSEvents.lastGamepadState[index]) return -7;
    fillGamepadEventData(gamepadState, JSEvents.lastGamepadState[index]);
    return 0;
};
var _emscripten_get_num_gamepads = () => JSEvents.lastGamepadState.length;
var _emscripten_get_screen_size = (width, height) => {
    HEAP32[width >> 2] = screen.width;
    HEAP32[height >> 2] = screen.height;
};
var _glActiveTexture = (x0) => GLctx.activeTexture(x0);
var _emscripten_glActiveTexture = _glActiveTexture;
var _glAttachShader = (program, shader) => {
    GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
};
var _emscripten_glAttachShader = _glAttachShader;
var _glBeginQueryEXT = (target, id) => {
    GLctx.disjointTimerQueryExt['beginQueryEXT'](target, GL.queries[id]);
};
var _emscripten_glBeginQueryEXT = _glBeginQueryEXT;
var _glBindAttribLocation = (program, index, name) => {
    GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
};
var _emscripten_glBindAttribLocation = _glBindAttribLocation;
var _glBindBuffer = (target, buffer) => {
    if (target == 34962) {
        GLctx.currentArrayBufferBinding = buffer;
    } else if (target == 34963) {
        GLctx.currentElementArrayBufferBinding = buffer;
    }
    GLctx.bindBuffer(target, GL.buffers[buffer]);
};
var _emscripten_glBindBuffer = _glBindBuffer;
var _glBindFramebuffer = (target, framebuffer) => {
    GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
};
var _emscripten_glBindFramebuffer = _glBindFramebuffer;
var _glBindRenderbuffer = (target, renderbuffer) => {
    GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
};
var _emscripten_glBindRenderbuffer = _glBindRenderbuffer;
var _glBindTexture = (target, texture) => {
    GLctx.bindTexture(target, GL.textures[texture]);
};
var _emscripten_glBindTexture = _glBindTexture;
var _glBindVertexArray = (vao) => {
    GLctx.bindVertexArray(GL.vaos[vao]);
    var ibo = GLctx.getParameter(34965);
    GLctx.currentElementArrayBufferBinding = ibo ? ibo.name | 0 : 0;
};
var _glBindVertexArrayOES = _glBindVertexArray;
var _emscripten_glBindVertexArrayOES = _glBindVertexArrayOES;
var _glBlendColor = (x0, x1, x2, x3) => GLctx.blendColor(x0, x1, x2, x3);
var _emscripten_glBlendColor = _glBlendColor;
var _glBlendEquation = (x0) => GLctx.blendEquation(x0);
var _emscripten_glBlendEquation = _glBlendEquation;
var _glBlendEquationSeparate = (x0, x1) => GLctx.blendEquationSeparate(x0, x1);
var _emscripten_glBlendEquationSeparate = _glBlendEquationSeparate;
var _glBlendFunc = (x0, x1) => GLctx.blendFunc(x0, x1);
var _emscripten_glBlendFunc = _glBlendFunc;
var _glBlendFuncSeparate = (x0, x1, x2, x3) => GLctx.blendFuncSeparate(x0, x1, x2, x3);
var _emscripten_glBlendFuncSeparate = _glBlendFuncSeparate;
var _glBufferData = (target, size, data, usage) => {
    GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage);
};
var _emscripten_glBufferData = _glBufferData;
var _glBufferSubData = (target, offset, size, data) => {
    GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size));
};
var _emscripten_glBufferSubData = _glBufferSubData;
var _glCheckFramebufferStatus = (x0) => GLctx.checkFramebufferStatus(x0);
var _emscripten_glCheckFramebufferStatus = _glCheckFramebufferStatus;
var _glClear = (x0) => GLctx.clear(x0);
var _emscripten_glClear = _glClear;
var _glClearColor = (x0, x1, x2, x3) => GLctx.clearColor(x0, x1, x2, x3);
var _emscripten_glClearColor = _glClearColor;
var _glClearDepthf = (x0) => GLctx.clearDepth(x0);
var _emscripten_glClearDepthf = _glClearDepthf;
var _glClearStencil = (x0) => GLctx.clearStencil(x0);
var _emscripten_glClearStencil = _glClearStencil;
var _glClipControlEXT = (origin, depth) => {
    GLctx.extClipControl['clipControlEXT'](origin, depth);
};
var _emscripten_glClipControlEXT = _glClipControlEXT;
var _glColorMask = (red, green, blue, alpha) => {
    GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
};
var _emscripten_glColorMask = _glColorMask;
var _glCompileShader = (shader) => {
    GLctx.compileShader(GL.shaders[shader]);
};
var _emscripten_glCompileShader = _glCompileShader;
var _glCompressedTexImage2D = (target, level, internalFormat, width, height, border, imageSize, data) => {
    GLctx.compressedTexImage2D(
        target,
        level,
        internalFormat,
        width,
        height,
        border,
        HEAPU8.subarray(data, data + imageSize)
    );
};
var _emscripten_glCompressedTexImage2D = _glCompressedTexImage2D;
var _glCompressedTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, imageSize, data) => {
    GLctx.compressedTexSubImage2D(
        target,
        level,
        xoffset,
        yoffset,
        width,
        height,
        format,
        HEAPU8.subarray(data, data + imageSize)
    );
};
var _emscripten_glCompressedTexSubImage2D = _glCompressedTexSubImage2D;
var _glCopyTexImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => GLctx.copyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7);
var _emscripten_glCopyTexImage2D = _glCopyTexImage2D;
var _glCopyTexSubImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => GLctx.copyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7);
var _emscripten_glCopyTexSubImage2D = _glCopyTexSubImage2D;
var _glCreateProgram = () => {
    var id = GL.getNewId(GL.programs);
    var program = GLctx.createProgram();
    program.name = id;
    program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
    program.uniformIdCounter = 1;
    GL.programs[id] = program;
    return id;
};
var _emscripten_glCreateProgram = _glCreateProgram;
var _glCreateShader = (shaderType) => {
    var id = GL.getNewId(GL.shaders);
    GL.shaders[id] = GLctx.createShader(shaderType);
    return id;
};
var _emscripten_glCreateShader = _glCreateShader;
var _glCullFace = (x0) => GLctx.cullFace(x0);
var _emscripten_glCullFace = _glCullFace;
var _glDeleteBuffers = (n, buffers) => {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[(buffers + i * 4) >> 2];
        var buffer = GL.buffers[id];
        if (!buffer) continue;
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
        if (id == GLctx.currentArrayBufferBinding) GLctx.currentArrayBufferBinding = 0;
        if (id == GLctx.currentElementArrayBufferBinding) GLctx.currentElementArrayBufferBinding = 0;
    }
};
var _emscripten_glDeleteBuffers = _glDeleteBuffers;
var _glDeleteFramebuffers = (n, framebuffers) => {
    for (var i = 0; i < n; ++i) {
        var id = HEAP32[(framebuffers + i * 4) >> 2];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue;
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null;
    }
};
var _emscripten_glDeleteFramebuffers = _glDeleteFramebuffers;
var _glDeleteProgram = (id) => {
    if (!id) return;
    var program = GL.programs[id];
    if (!program) {
        GL.recordError(1281);
        return;
    }
    GLctx.deleteProgram(program);
    program.name = 0;
    GL.programs[id] = null;
};
var _emscripten_glDeleteProgram = _glDeleteProgram;
var _glDeleteQueriesEXT = (n, ids) => {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[(ids + i * 4) >> 2];
        var query = GL.queries[id];
        if (!query) continue;
        GLctx.disjointTimerQueryExt['deleteQueryEXT'](query);
        GL.queries[id] = null;
    }
};
var _emscripten_glDeleteQueriesEXT = _glDeleteQueriesEXT;
var _glDeleteRenderbuffers = (n, renderbuffers) => {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[(renderbuffers + i * 4) >> 2];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue;
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null;
    }
};
var _emscripten_glDeleteRenderbuffers = _glDeleteRenderbuffers;
var _glDeleteShader = (id) => {
    if (!id) return;
    var shader = GL.shaders[id];
    if (!shader) {
        GL.recordError(1281);
        return;
    }
    GLctx.deleteShader(shader);
    GL.shaders[id] = null;
};
var _emscripten_glDeleteShader = _glDeleteShader;
var _glDeleteTextures = (n, textures) => {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[(textures + i * 4) >> 2];
        var texture = GL.textures[id];
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null;
    }
};
var _emscripten_glDeleteTextures = _glDeleteTextures;
var _glDeleteVertexArrays = (n, vaos) => {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[(vaos + i * 4) >> 2];
        GLctx.deleteVertexArray(GL.vaos[id]);
        GL.vaos[id] = null;
    }
};
var _glDeleteVertexArraysOES = _glDeleteVertexArrays;
var _emscripten_glDeleteVertexArraysOES = _glDeleteVertexArraysOES;
var _glDepthFunc = (x0) => GLctx.depthFunc(x0);
var _emscripten_glDepthFunc = _glDepthFunc;
var _glDepthMask = (flag) => {
    GLctx.depthMask(!!flag);
};
var _emscripten_glDepthMask = _glDepthMask;
var _glDepthRangef = (x0, x1) => GLctx.depthRange(x0, x1);
var _emscripten_glDepthRangef = _glDepthRangef;
var _glDetachShader = (program, shader) => {
    GLctx.detachShader(GL.programs[program], GL.shaders[shader]);
};
var _emscripten_glDetachShader = _glDetachShader;
var _glDisable = (x0) => GLctx.disable(x0);
var _emscripten_glDisable = _glDisable;
var _glDisableVertexAttribArray = (index) => {
    var cb = GL.currentContext.clientBuffers[index];
    cb.enabled = false;
    GLctx.disableVertexAttribArray(index);
};
var _emscripten_glDisableVertexAttribArray = _glDisableVertexAttribArray;
var _glDrawArrays = (mode, first, count) => {
    GL.preDrawHandleClientVertexAttribBindings(first + count);
    GLctx.drawArrays(mode, first, count);
    GL.postDrawHandleClientVertexAttribBindings();
};
var _emscripten_glDrawArrays = _glDrawArrays;
var _glDrawArraysInstanced = (mode, first, count, primcount) => {
    GLctx.drawArraysInstanced(mode, first, count, primcount);
};
var _glDrawArraysInstancedANGLE = _glDrawArraysInstanced;
var _emscripten_glDrawArraysInstancedANGLE = _glDrawArraysInstancedANGLE;
var tempFixedLengthArray = [];
var _glDrawBuffers = (n, bufs) => {
    var bufArray = tempFixedLengthArray[n];
    for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[(bufs + i * 4) >> 2];
    }
    GLctx.drawBuffers(bufArray);
};
var _glDrawBuffersWEBGL = _glDrawBuffers;
var _emscripten_glDrawBuffersWEBGL = _glDrawBuffersWEBGL;
var _glDrawElements = (mode, count, type, indices) => {
    var buf;
    var vertexes = 0;
    if (!GLctx.currentElementArrayBufferBinding) {
        var size = GL.calcBufLength(1, type, 0, count);
        buf = GL.getTempIndexBuffer(size);
        GLctx.bindBuffer(34963, buf);
        GLctx.bufferSubData(34963, 0, HEAPU8.subarray(indices, indices + size));
        if (count > 0) {
            for (var i = 0; i < GL.currentContext.maxVertexAttribs; ++i) {
                var cb = GL.currentContext.clientBuffers[i];
                if (cb.clientside && cb.enabled) {
                    let arrayClass;
                    switch (type) {
                        case 5121:
                            arrayClass = Uint8Array;
                            break;
                        case 5123:
                            arrayClass = Uint16Array;
                            break;
                        default:
                            GL.recordError(1282);
                            return;
                    }
                    vertexes =
                        new arrayClass(HEAPU8.buffer, indices, count).reduce((max, current) => Math.max(max, current)) +
                        1;
                    break;
                }
            }
        }
        indices = 0;
    }
    GL.preDrawHandleClientVertexAttribBindings(vertexes);
    GLctx.drawElements(mode, count, type, indices);
    GL.postDrawHandleClientVertexAttribBindings(count);
    if (!GLctx.currentElementArrayBufferBinding) {
        GLctx.bindBuffer(34963, null);
    }
};
var _emscripten_glDrawElements = _glDrawElements;
var _glDrawElementsInstanced = (mode, count, type, indices, primcount) => {
    GLctx.drawElementsInstanced(mode, count, type, indices, primcount);
};
var _glDrawElementsInstancedANGLE = _glDrawElementsInstanced;
var _emscripten_glDrawElementsInstancedANGLE = _glDrawElementsInstancedANGLE;
var _glEnable = (x0) => GLctx.enable(x0);
var _emscripten_glEnable = _glEnable;
var _glEnableVertexAttribArray = (index) => {
    var cb = GL.currentContext.clientBuffers[index];
    cb.enabled = true;
    GLctx.enableVertexAttribArray(index);
};
var _emscripten_glEnableVertexAttribArray = _glEnableVertexAttribArray;
var _glEndQueryEXT = (target) => {
    GLctx.disjointTimerQueryExt['endQueryEXT'](target);
};
var _emscripten_glEndQueryEXT = _glEndQueryEXT;
var _glFinish = () => GLctx.finish();
var _emscripten_glFinish = _glFinish;
var _glFlush = () => GLctx.flush();
var _emscripten_glFlush = _glFlush;
var _glFramebufferRenderbuffer = (target, attachment, renderbuffertarget, renderbuffer) => {
    GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer]);
};
var _emscripten_glFramebufferRenderbuffer = _glFramebufferRenderbuffer;
var _glFramebufferTexture2D = (target, attachment, textarget, texture, level) => {
    GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level);
};
var _emscripten_glFramebufferTexture2D = _glFramebufferTexture2D;
var _glFrontFace = (x0) => GLctx.frontFace(x0);
var _emscripten_glFrontFace = _glFrontFace;
var _glGenBuffers = (n, buffers) => {
    GL.genObject(n, buffers, 'createBuffer', GL.buffers);
};
var _emscripten_glGenBuffers = _glGenBuffers;
var _glGenFramebuffers = (n, ids) => {
    GL.genObject(n, ids, 'createFramebuffer', GL.framebuffers);
};
var _emscripten_glGenFramebuffers = _glGenFramebuffers;
var _glGenQueriesEXT = (n, ids) => {
    for (var i = 0; i < n; i++) {
        var query = GLctx.disjointTimerQueryExt['createQueryEXT']();
        if (!query) {
            GL.recordError(1282);
            while (i < n) HEAP32[(ids + i++ * 4) >> 2] = 0;
            return;
        }
        var id = GL.getNewId(GL.queries);
        query.name = id;
        GL.queries[id] = query;
        HEAP32[(ids + i * 4) >> 2] = id;
    }
};
var _emscripten_glGenQueriesEXT = _glGenQueriesEXT;
var _glGenRenderbuffers = (n, renderbuffers) => {
    GL.genObject(n, renderbuffers, 'createRenderbuffer', GL.renderbuffers);
};
var _emscripten_glGenRenderbuffers = _glGenRenderbuffers;
var _glGenTextures = (n, textures) => {
    GL.genObject(n, textures, 'createTexture', GL.textures);
};
var _emscripten_glGenTextures = _glGenTextures;
var _glGenVertexArrays = (n, arrays) => {
    GL.genObject(n, arrays, 'createVertexArray', GL.vaos);
};
var _glGenVertexArraysOES = _glGenVertexArrays;
var _emscripten_glGenVertexArraysOES = _glGenVertexArraysOES;
var _glGenerateMipmap = (x0) => GLctx.generateMipmap(x0);
var _emscripten_glGenerateMipmap = _glGenerateMipmap;
var __glGetActiveAttribOrUniform = (funcName, program, index, bufSize, length, size, type, name) => {
    program = GL.programs[program];
    var info = GLctx[funcName](program, index);
    if (info) {
        var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
        if (size) HEAP32[size >> 2] = info.size;
        if (type) HEAP32[type >> 2] = info.type;
    }
};
var _glGetActiveAttrib = (program, index, bufSize, length, size, type, name) =>
    __glGetActiveAttribOrUniform('getActiveAttrib', program, index, bufSize, length, size, type, name);
var _emscripten_glGetActiveAttrib = _glGetActiveAttrib;
var _glGetActiveUniform = (program, index, bufSize, length, size, type, name) =>
    __glGetActiveAttribOrUniform('getActiveUniform', program, index, bufSize, length, size, type, name);
var _emscripten_glGetActiveUniform = _glGetActiveUniform;
var _glGetAttachedShaders = (program, maxCount, count, shaders) => {
    var result = GLctx.getAttachedShaders(GL.programs[program]);
    var len = result.length;
    if (len > maxCount) {
        len = maxCount;
    }
    HEAP32[count >> 2] = len;
    for (var i = 0; i < len; ++i) {
        var id = GL.shaders.indexOf(result[i]);
        HEAP32[(shaders + i * 4) >> 2] = id;
    }
};
var _emscripten_glGetAttachedShaders = _glGetAttachedShaders;
var _glGetAttribLocation = (program, name) => GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
var _emscripten_glGetAttribLocation = _glGetAttribLocation;
var writeI53ToI64 = (ptr, num) => {
    HEAPU32[ptr >> 2] = num;
    var lower = HEAPU32[ptr >> 2];
    HEAPU32[(ptr + 4) >> 2] = (num - lower) / 4294967296;
};
var emscriptenWebGLGet = (name_, p, type) => {
    if (!p) {
        GL.recordError(1281);
        return;
    }
    var ret = undefined;
    switch (name_) {
        case 36346:
            ret = 1;
            break;
        case 36344:
            if (type != 0 && type != 1) {
                GL.recordError(1280);
            }
            return;
        case 36345:
            ret = 0;
            break;
        case 34466:
            var formats = GLctx.getParameter(34467);
            ret = formats ? formats.length : 0;
            break;
    }
    if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof result) {
            case 'number':
                ret = result;
                break;
            case 'boolean':
                ret = result ? 1 : 0;
                break;
            case 'string':
                GL.recordError(1280);
                return;
            case 'object':
                if (result === null) {
                    switch (name_) {
                        case 34964:
                        case 35725:
                        case 34965:
                        case 36006:
                        case 36007:
                        case 32873:
                        case 34229:
                        case 34068: {
                            ret = 0;
                            break;
                        }
                        default: {
                            GL.recordError(1280);
                            return;
                        }
                    }
                } else if (
                    result instanceof Float32Array ||
                    result instanceof Uint32Array ||
                    result instanceof Int32Array ||
                    result instanceof Array
                ) {
                    for (var i = 0; i < result.length; ++i) {
                        switch (type) {
                            case 0:
                                HEAP32[(p + i * 4) >> 2] = result[i];
                                break;
                            case 2:
                                HEAPF32[(p + i * 4) >> 2] = result[i];
                                break;
                            case 4:
                                HEAP8[p + i] = result[i] ? 1 : 0;
                                break;
                        }
                    }
                    return;
                } else {
                    try {
                        ret = result.name | 0;
                    } catch (e) {
                        GL.recordError(1280);
                        err(
                            `GL_INVALID_ENUM in glGet${type}v: Unknown object returned from WebGL getParameter(${name_})! (error: ${e})`
                        );
                        return;
                    }
                }
                break;
            default:
                GL.recordError(1280);
                err(
                    `GL_INVALID_ENUM in glGet${type}v: Native code calling glGet${type}v(${name_}) and it returns ${result} of type ${typeof result}!`
                );
                return;
        }
    }
    switch (type) {
        case 1:
            writeI53ToI64(p, ret);
            break;
        case 0:
            HEAP32[p >> 2] = ret;
            break;
        case 2:
            HEAPF32[p >> 2] = ret;
            break;
        case 4:
            HEAP8[p] = ret ? 1 : 0;
            break;
    }
};
var _glGetBooleanv = (name_, p) => emscriptenWebGLGet(name_, p, 4);
var _emscripten_glGetBooleanv = _glGetBooleanv;
var _glGetBufferParameteriv = (target, value, data) => {
    if (!data) {
        GL.recordError(1281);
        return;
    }
    HEAP32[data >> 2] = GLctx.getBufferParameter(target, value);
};
var _emscripten_glGetBufferParameteriv = _glGetBufferParameteriv;
var _glGetError = () => {
    var error = GLctx.getError() || GL.lastError;
    GL.lastError = 0;
    return error;
};
var _emscripten_glGetError = _glGetError;
var _glGetFloatv = (name_, p) => emscriptenWebGLGet(name_, p, 2);
var _emscripten_glGetFloatv = _glGetFloatv;
var _glGetFramebufferAttachmentParameteriv = (target, attachment, pname, params) => {
    var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
    if (result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
        result = result.name | 0;
    }
    HEAP32[params >> 2] = result;
};
var _emscripten_glGetFramebufferAttachmentParameteriv = _glGetFramebufferAttachmentParameteriv;
var _glGetIntegerv = (name_, p) => emscriptenWebGLGet(name_, p, 0);
var _emscripten_glGetIntegerv = _glGetIntegerv;
var _glGetProgramInfoLog = (program, maxLength, length, infoLog) => {
    var log = GLctx.getProgramInfoLog(GL.programs[program]);
    if (log === null) log = '(unknown error)';
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
};
var _emscripten_glGetProgramInfoLog = _glGetProgramInfoLog;
var _glGetProgramiv = (program, pname, p) => {
    if (!p) {
        GL.recordError(1281);
        return;
    }
    if (program >= GL.counter) {
        GL.recordError(1281);
        return;
    }
    program = GL.programs[program];
    if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(program);
        if (log === null) log = '(unknown error)';
        HEAP32[p >> 2] = log.length + 1;
    } else if (pname == 35719) {
        if (!program.maxUniformLength) {
            var numActiveUniforms = GLctx.getProgramParameter(program, 35718);
            for (var i = 0; i < numActiveUniforms; ++i) {
                program.maxUniformLength = Math.max(
                    program.maxUniformLength,
                    GLctx.getActiveUniform(program, i).name.length + 1
                );
            }
        }
        HEAP32[p >> 2] = program.maxUniformLength;
    } else if (pname == 35722) {
        if (!program.maxAttributeLength) {
            var numActiveAttributes = GLctx.getProgramParameter(program, 35721);
            for (var i = 0; i < numActiveAttributes; ++i) {
                program.maxAttributeLength = Math.max(
                    program.maxAttributeLength,
                    GLctx.getActiveAttrib(program, i).name.length + 1
                );
            }
        }
        HEAP32[p >> 2] = program.maxAttributeLength;
    } else if (pname == 35381) {
        if (!program.maxUniformBlockNameLength) {
            var numActiveUniformBlocks = GLctx.getProgramParameter(program, 35382);
            for (var i = 0; i < numActiveUniformBlocks; ++i) {
                program.maxUniformBlockNameLength = Math.max(
                    program.maxUniformBlockNameLength,
                    GLctx.getActiveUniformBlockName(program, i).length + 1
                );
            }
        }
        HEAP32[p >> 2] = program.maxUniformBlockNameLength;
    } else {
        HEAP32[p >> 2] = GLctx.getProgramParameter(program, pname);
    }
};
var _emscripten_glGetProgramiv = _glGetProgramiv;
var _glGetQueryObjecti64vEXT = (id, pname, params) => {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    var query = GL.queries[id];
    var param;
    {
        param = GLctx.disjointTimerQueryExt['getQueryObjectEXT'](query, pname);
    }
    var ret;
    if (typeof param == 'boolean') {
        ret = param ? 1 : 0;
    } else {
        ret = param;
    }
    writeI53ToI64(params, ret);
};
var _emscripten_glGetQueryObjecti64vEXT = _glGetQueryObjecti64vEXT;
var _glGetQueryObjectivEXT = (id, pname, params) => {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    var query = GL.queries[id];
    var param = GLctx.disjointTimerQueryExt['getQueryObjectEXT'](query, pname);
    var ret;
    if (typeof param == 'boolean') {
        ret = param ? 1 : 0;
    } else {
        ret = param;
    }
    HEAP32[params >> 2] = ret;
};
var _emscripten_glGetQueryObjectivEXT = _glGetQueryObjectivEXT;
var _glGetQueryObjectui64vEXT = _glGetQueryObjecti64vEXT;
var _emscripten_glGetQueryObjectui64vEXT = _glGetQueryObjectui64vEXT;
var _glGetQueryObjectuivEXT = _glGetQueryObjectivEXT;
var _emscripten_glGetQueryObjectuivEXT = _glGetQueryObjectuivEXT;
var _glGetQueryivEXT = (target, pname, params) => {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    HEAP32[params >> 2] = GLctx.disjointTimerQueryExt['getQueryEXT'](target, pname);
};
var _emscripten_glGetQueryivEXT = _glGetQueryivEXT;
var _glGetRenderbufferParameteriv = (target, pname, params) => {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    HEAP32[params >> 2] = GLctx.getRenderbufferParameter(target, pname);
};
var _emscripten_glGetRenderbufferParameteriv = _glGetRenderbufferParameteriv;
var _glGetShaderInfoLog = (shader, maxLength, length, infoLog) => {
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null) log = '(unknown error)';
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
};
var _emscripten_glGetShaderInfoLog = _glGetShaderInfoLog;
var _glGetShaderPrecisionFormat = (shaderType, precisionType, range, precision) => {
    var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
    HEAP32[range >> 2] = result.rangeMin;
    HEAP32[(range + 4) >> 2] = result.rangeMax;
    HEAP32[precision >> 2] = result.precision;
};
var _emscripten_glGetShaderPrecisionFormat = _glGetShaderPrecisionFormat;
var _glGetShaderSource = (shader, bufSize, length, source) => {
    var result = GLctx.getShaderSource(GL.shaders[shader]);
    if (!result) return;
    var numBytesWrittenExclNull = bufSize > 0 && source ? stringToUTF8(result, source, bufSize) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
};
var _emscripten_glGetShaderSource = _glGetShaderSource;
var _glGetShaderiv = (shader, pname, p) => {
    if (!p) {
        GL.recordError(1281);
        return;
    }
    if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = '(unknown error)';
        var logLength = log ? log.length + 1 : 0;
        HEAP32[p >> 2] = logLength;
    } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = source ? source.length + 1 : 0;
        HEAP32[p >> 2] = sourceLength;
    } else {
        HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname);
    }
};
var _emscripten_glGetShaderiv = _glGetShaderiv;
var webglGetExtensions = () => {
    var exts = getEmscriptenSupportedExtensions(GLctx);
    exts = exts.concat(exts.map((e) => 'GL_' + e));
    return exts;
};
var _glGetString = (name_) => {
    var ret = GL.stringCache[name_];
    if (!ret) {
        switch (name_) {
            case 7939:
                ret = stringToNewUTF8(webglGetExtensions().join(' '));
                break;
            case 7936:
            case 7937:
            case 37445:
            case 37446:
                var s = GLctx.getParameter(name_);
                if (!s) {
                    GL.recordError(1280);
                }
                ret = s ? stringToNewUTF8(s) : 0;
                break;
            case 7938:
                var webGLVersion = GLctx.getParameter(7938);
                var glVersion = `OpenGL ES 2.0 (${webGLVersion})`;
                ret = stringToNewUTF8(glVersion);
                break;
            case 35724:
                var glslVersion = GLctx.getParameter(35724);
                var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
                var ver_num = glslVersion.match(ver_re);
                if (ver_num !== null) {
                    if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + '0';
                    glslVersion = `OpenGL ES GLSL ES ${ver_num[1]} (${glslVersion})`;
                }
                ret = stringToNewUTF8(glslVersion);
                break;
            default:
                GL.recordError(1280);
        }
        GL.stringCache[name_] = ret;
    }
    return ret;
};
var _emscripten_glGetString = _glGetString;
var _glGetTexParameterfv = (target, pname, params) => {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    HEAPF32[params >> 2] = GLctx.getTexParameter(target, pname);
};
var _emscripten_glGetTexParameterfv = _glGetTexParameterfv;
var _glGetTexParameteriv = (target, pname, params) => {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    HEAP32[params >> 2] = GLctx.getTexParameter(target, pname);
};
var _emscripten_glGetTexParameteriv = _glGetTexParameteriv;
var jstoi_q = (str) => parseInt(str);
var webglGetLeftBracePos = (name) => name.slice(-1) == ']' && name.lastIndexOf('[');
var webglPrepareUniformLocationsBeforeFirstUse = (program) => {
    var uniformLocsById = program.uniformLocsById,
        uniformSizeAndIdsByName = program.uniformSizeAndIdsByName,
        i,
        j;
    if (!uniformLocsById) {
        program.uniformLocsById = uniformLocsById = {};
        program.uniformArrayNamesById = {};
        var numActiveUniforms = GLctx.getProgramParameter(program, 35718);
        for (i = 0; i < numActiveUniforms; ++i) {
            var u = GLctx.getActiveUniform(program, i);
            var nm = u.name;
            var sz = u.size;
            var lb = webglGetLeftBracePos(nm);
            var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
            var id = program.uniformIdCounter;
            program.uniformIdCounter += sz;
            uniformSizeAndIdsByName[arrayName] = [sz, id];
            for (j = 0; j < sz; ++j) {
                uniformLocsById[id] = j;
                program.uniformArrayNamesById[id++] = arrayName;
            }
        }
    }
};
var _glGetUniformLocation = (program, name) => {
    name = UTF8ToString(name);
    if ((program = GL.programs[program])) {
        webglPrepareUniformLocationsBeforeFirstUse(program);
        var uniformLocsById = program.uniformLocsById;
        var arrayIndex = 0;
        var uniformBaseName = name;
        var leftBrace = webglGetLeftBracePos(name);
        if (leftBrace > 0) {
            arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
            uniformBaseName = name.slice(0, leftBrace);
        }
        var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
        if (sizeAndId && arrayIndex < sizeAndId[0]) {
            arrayIndex += sizeAndId[1];
            if (
                (uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name))
            ) {
                return arrayIndex;
            }
        }
    } else {
        GL.recordError(1281);
    }
    return -1;
};
var _emscripten_glGetUniformLocation = _glGetUniformLocation;
var webglGetUniformLocation = (location) => {
    var p = GLctx.currentProgram;
    if (p) {
        var webglLoc = p.uniformLocsById[location];
        if (typeof webglLoc == 'number') {
            p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(
                p,
                p.uniformArrayNamesById[location] + (webglLoc > 0 ? `[${webglLoc}]` : '')
            );
        }
        return webglLoc;
    } else {
        GL.recordError(1282);
    }
};
var emscriptenWebGLGetUniform = (program, location, params, type) => {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    program = GL.programs[program];
    webglPrepareUniformLocationsBeforeFirstUse(program);
    var data = GLctx.getUniform(program, webglGetUniformLocation(location));
    if (typeof data == 'number' || typeof data == 'boolean') {
        switch (type) {
            case 0:
                HEAP32[params >> 2] = data;
                break;
            case 2:
                HEAPF32[params >> 2] = data;
                break;
        }
    } else {
        for (var i = 0; i < data.length; i++) {
            switch (type) {
                case 0:
                    HEAP32[(params + i * 4) >> 2] = data[i];
                    break;
                case 2:
                    HEAPF32[(params + i * 4) >> 2] = data[i];
                    break;
            }
        }
    }
};
var _glGetUniformfv = (program, location, params) => {
    emscriptenWebGLGetUniform(program, location, params, 2);
};
var _emscripten_glGetUniformfv = _glGetUniformfv;
var _glGetUniformiv = (program, location, params) => {
    emscriptenWebGLGetUniform(program, location, params, 0);
};
var _emscripten_glGetUniformiv = _glGetUniformiv;
var _glGetVertexAttribPointerv = (index, pname, pointer) => {
    if (!pointer) {
        GL.recordError(1281);
        return;
    }
    if (GL.currentContext.clientBuffers[index].enabled) {
        err('glGetVertexAttribPointer on client-side array: not supported, bad data returned');
    }
    HEAP32[pointer >> 2] = GLctx.getVertexAttribOffset(index, pname);
};
var _emscripten_glGetVertexAttribPointerv = _glGetVertexAttribPointerv;
var emscriptenWebGLGetVertexAttrib = (index, pname, params, type) => {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    if (GL.currentContext.clientBuffers[index].enabled) {
        err('glGetVertexAttrib*v on client-side array: not supported, bad data returned');
    }
    var data = GLctx.getVertexAttrib(index, pname);
    if (pname == 34975) {
        HEAP32[params >> 2] = data && data['name'];
    } else if (typeof data == 'number' || typeof data == 'boolean') {
        switch (type) {
            case 0:
                HEAP32[params >> 2] = data;
                break;
            case 2:
                HEAPF32[params >> 2] = data;
                break;
            case 5:
                HEAP32[params >> 2] = Math.fround(data);
                break;
        }
    } else {
        for (var i = 0; i < data.length; i++) {
            switch (type) {
                case 0:
                    HEAP32[(params + i * 4) >> 2] = data[i];
                    break;
                case 2:
                    HEAPF32[(params + i * 4) >> 2] = data[i];
                    break;
                case 5:
                    HEAP32[(params + i * 4) >> 2] = Math.fround(data[i]);
                    break;
            }
        }
    }
};
var _glGetVertexAttribfv = (index, pname, params) => {
    emscriptenWebGLGetVertexAttrib(index, pname, params, 2);
};
var _emscripten_glGetVertexAttribfv = _glGetVertexAttribfv;
var _glGetVertexAttribiv = (index, pname, params) => {
    emscriptenWebGLGetVertexAttrib(index, pname, params, 5);
};
var _emscripten_glGetVertexAttribiv = _glGetVertexAttribiv;
var _glHint = (x0, x1) => GLctx.hint(x0, x1);
var _emscripten_glHint = _glHint;
var _glIsBuffer = (buffer) => {
    var b = GL.buffers[buffer];
    if (!b) return 0;
    return GLctx.isBuffer(b);
};
var _emscripten_glIsBuffer = _glIsBuffer;
var _glIsEnabled = (x0) => GLctx.isEnabled(x0);
var _emscripten_glIsEnabled = _glIsEnabled;
var _glIsFramebuffer = (framebuffer) => {
    var fb = GL.framebuffers[framebuffer];
    if (!fb) return 0;
    return GLctx.isFramebuffer(fb);
};
var _emscripten_glIsFramebuffer = _glIsFramebuffer;
var _glIsProgram = (program) => {
    program = GL.programs[program];
    if (!program) return 0;
    return GLctx.isProgram(program);
};
var _emscripten_glIsProgram = _glIsProgram;
var _glIsQueryEXT = (id) => {
    var query = GL.queries[id];
    if (!query) return 0;
    return GLctx.disjointTimerQueryExt['isQueryEXT'](query);
};
var _emscripten_glIsQueryEXT = _glIsQueryEXT;
var _glIsRenderbuffer = (renderbuffer) => {
    var rb = GL.renderbuffers[renderbuffer];
    if (!rb) return 0;
    return GLctx.isRenderbuffer(rb);
};
var _emscripten_glIsRenderbuffer = _glIsRenderbuffer;
var _glIsShader = (shader) => {
    var s = GL.shaders[shader];
    if (!s) return 0;
    return GLctx.isShader(s);
};
var _emscripten_glIsShader = _glIsShader;
var _glIsTexture = (id) => {
    var texture = GL.textures[id];
    if (!texture) return 0;
    return GLctx.isTexture(texture);
};
var _emscripten_glIsTexture = _glIsTexture;
var _glIsVertexArray = (array) => {
    var vao = GL.vaos[array];
    if (!vao) return 0;
    return GLctx.isVertexArray(vao);
};
var _glIsVertexArrayOES = _glIsVertexArray;
var _emscripten_glIsVertexArrayOES = _glIsVertexArrayOES;
var _glLineWidth = (x0) => GLctx.lineWidth(x0);
var _emscripten_glLineWidth = _glLineWidth;
var _glLinkProgram = (program) => {
    program = GL.programs[program];
    GLctx.linkProgram(program);
    program.uniformLocsById = 0;
    program.uniformSizeAndIdsByName = {};
};
var _emscripten_glLinkProgram = _glLinkProgram;
var _glPixelStorei = (pname, param) => {
    if (pname == 3317) {
        GL.unpackAlignment = param;
    } else if (pname == 3314) {
        GL.unpackRowLength = param;
    }
    GLctx.pixelStorei(pname, param);
};
var _emscripten_glPixelStorei = _glPixelStorei;
var _glPolygonModeWEBGL = (face, mode) => {
    GLctx.webglPolygonMode['polygonModeWEBGL'](face, mode);
};
var _emscripten_glPolygonModeWEBGL = _glPolygonModeWEBGL;
var _glPolygonOffset = (x0, x1) => GLctx.polygonOffset(x0, x1);
var _emscripten_glPolygonOffset = _glPolygonOffset;
var _glPolygonOffsetClampEXT = (factor, units, clamp) => {
    GLctx.extPolygonOffsetClamp['polygonOffsetClampEXT'](factor, units, clamp);
};
var _emscripten_glPolygonOffsetClampEXT = _glPolygonOffsetClampEXT;
var _glQueryCounterEXT = (id, target) => {
    GLctx.disjointTimerQueryExt['queryCounterEXT'](GL.queries[id], target);
};
var _emscripten_glQueryCounterEXT = _glQueryCounterEXT;
var computeUnpackAlignedImageSize = (width, height, sizePerPixel) => {
    function roundedToNextMultipleOf(x, y) {
        return (x + y - 1) & -y;
    }
    var plainRowSize = (GL.unpackRowLength || width) * sizePerPixel;
    var alignedRowSize = roundedToNextMultipleOf(plainRowSize, GL.unpackAlignment);
    return height * alignedRowSize;
};
var colorChannelsInGlTextureFormat = (format) => {
    var colorChannels = { 5: 3, 6: 4, 8: 2, 29502: 3, 29504: 4 };
    return colorChannels[format - 6402] || 1;
};
var heapObjectForWebGLType = (type) => {
    type -= 5120;
    if (type == 1) return HEAPU8;
    if (type == 4) return HEAP32;
    if (type == 6) return HEAPF32;
    if (type == 5 || type == 28922) return HEAPU32;
    return HEAPU16;
};
var toTypedArrayIndex = (pointer, heap) => pointer >>> (31 - Math.clz32(heap.BYTES_PER_ELEMENT));
var emscriptenWebGLGetTexPixelData = (type, format, width, height, pixels, internalFormat) => {
    var heap = heapObjectForWebGLType(type);
    var sizePerPixel = colorChannelsInGlTextureFormat(format) * heap.BYTES_PER_ELEMENT;
    var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel);
    return heap.subarray(toTypedArrayIndex(pixels, heap), toTypedArrayIndex(pixels + bytes, heap));
};
var _glReadPixels = (x, y, width, height, format, type, pixels) => {
    var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
    if (!pixelData) {
        GL.recordError(1280);
        return;
    }
    GLctx.readPixels(x, y, width, height, format, type, pixelData);
};
var _emscripten_glReadPixels = _glReadPixels;
var _glReleaseShaderCompiler = () => {};
var _emscripten_glReleaseShaderCompiler = _glReleaseShaderCompiler;
var _glRenderbufferStorage = (x0, x1, x2, x3) => GLctx.renderbufferStorage(x0, x1, x2, x3);
var _emscripten_glRenderbufferStorage = _glRenderbufferStorage;
var _glSampleCoverage = (value, invert) => {
    GLctx.sampleCoverage(value, !!invert);
};
var _emscripten_glSampleCoverage = _glSampleCoverage;
var _glScissor = (x0, x1, x2, x3) => GLctx.scissor(x0, x1, x2, x3);
var _emscripten_glScissor = _glScissor;
var _glShaderBinary = (count, shaders, binaryformat, binary, length) => {
    GL.recordError(1280);
};
var _emscripten_glShaderBinary = _glShaderBinary;
var _glShaderSource = (shader, count, string, length) => {
    var source = GL.getSource(shader, count, string, length);
    GLctx.shaderSource(GL.shaders[shader], source);
};
var _emscripten_glShaderSource = _glShaderSource;
var _glStencilFunc = (x0, x1, x2) => GLctx.stencilFunc(x0, x1, x2);
var _emscripten_glStencilFunc = _glStencilFunc;
var _glStencilFuncSeparate = (x0, x1, x2, x3) => GLctx.stencilFuncSeparate(x0, x1, x2, x3);
var _emscripten_glStencilFuncSeparate = _glStencilFuncSeparate;
var _glStencilMask = (x0) => GLctx.stencilMask(x0);
var _emscripten_glStencilMask = _glStencilMask;
var _glStencilMaskSeparate = (x0, x1) => GLctx.stencilMaskSeparate(x0, x1);
var _emscripten_glStencilMaskSeparate = _glStencilMaskSeparate;
var _glStencilOp = (x0, x1, x2) => GLctx.stencilOp(x0, x1, x2);
var _emscripten_glStencilOp = _glStencilOp;
var _glStencilOpSeparate = (x0, x1, x2, x3) => GLctx.stencilOpSeparate(x0, x1, x2, x3);
var _emscripten_glStencilOpSeparate = _glStencilOpSeparate;
var _glTexImage2D = (target, level, internalFormat, width, height, border, format, type, pixels) => {
    var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null;
    GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixelData);
};
var _emscripten_glTexImage2D = _glTexImage2D;
var _glTexParameterf = (x0, x1, x2) => GLctx.texParameterf(x0, x1, x2);
var _emscripten_glTexParameterf = _glTexParameterf;
var _glTexParameterfv = (target, pname, params) => {
    var param = HEAPF32[params >> 2];
    GLctx.texParameterf(target, pname, param);
};
var _emscripten_glTexParameterfv = _glTexParameterfv;
var _glTexParameteri = (x0, x1, x2) => GLctx.texParameteri(x0, x1, x2);
var _emscripten_glTexParameteri = _glTexParameteri;
var _glTexParameteriv = (target, pname, params) => {
    var param = HEAP32[params >> 2];
    GLctx.texParameteri(target, pname, param);
};
var _emscripten_glTexParameteriv = _glTexParameteriv;
var _glTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, type, pixels) => {
    var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0) : null;
    GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
};
var _emscripten_glTexSubImage2D = _glTexSubImage2D;
var _glUniform1f = (location, v0) => {
    GLctx.uniform1f(webglGetUniformLocation(location), v0);
};
var _emscripten_glUniform1f = _glUniform1f;
var miniTempWebGLFloatBuffers = [];
var _glUniform1fv = (location, count, value) => {
    if (count <= 288) {
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; ++i) {
            view[i] = HEAPF32[(value + 4 * i) >> 2];
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 4) >> 2);
    }
    GLctx.uniform1fv(webglGetUniformLocation(location), view);
};
var _emscripten_glUniform1fv = _glUniform1fv;
var _glUniform1i = (location, v0) => {
    GLctx.uniform1i(webglGetUniformLocation(location), v0);
};
var _emscripten_glUniform1i = _glUniform1i;
var miniTempWebGLIntBuffers = [];
var _glUniform1iv = (location, count, value) => {
    if (count <= 288) {
        var view = miniTempWebGLIntBuffers[count];
        for (var i = 0; i < count; ++i) {
            view[i] = HEAP32[(value + 4 * i) >> 2];
        }
    } else {
        var view = HEAP32.subarray(value >> 2, (value + count * 4) >> 2);
    }
    GLctx.uniform1iv(webglGetUniformLocation(location), view);
};
var _emscripten_glUniform1iv = _glUniform1iv;
var _glUniform2f = (location, v0, v1) => {
    GLctx.uniform2f(webglGetUniformLocation(location), v0, v1);
};
var _emscripten_glUniform2f = _glUniform2f;
var _glUniform2fv = (location, count, value) => {
    if (count <= 144) {
        count *= 2;
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; i += 2) {
            view[i] = HEAPF32[(value + 4 * i) >> 2];
            view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 8) >> 2);
    }
    GLctx.uniform2fv(webglGetUniformLocation(location), view);
};
var _emscripten_glUniform2fv = _glUniform2fv;
var _glUniform2i = (location, v0, v1) => {
    GLctx.uniform2i(webglGetUniformLocation(location), v0, v1);
};
var _emscripten_glUniform2i = _glUniform2i;
var _glUniform2iv = (location, count, value) => {
    if (count <= 144) {
        count *= 2;
        var view = miniTempWebGLIntBuffers[count];
        for (var i = 0; i < count; i += 2) {
            view[i] = HEAP32[(value + 4 * i) >> 2];
            view[i + 1] = HEAP32[(value + (4 * i + 4)) >> 2];
        }
    } else {
        var view = HEAP32.subarray(value >> 2, (value + count * 8) >> 2);
    }
    GLctx.uniform2iv(webglGetUniformLocation(location), view);
};
var _emscripten_glUniform2iv = _glUniform2iv;
var _glUniform3f = (location, v0, v1, v2) => {
    GLctx.uniform3f(webglGetUniformLocation(location), v0, v1, v2);
};
var _emscripten_glUniform3f = _glUniform3f;
var _glUniform3fv = (location, count, value) => {
    if (count <= 96) {
        count *= 3;
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; i += 3) {
            view[i] = HEAPF32[(value + 4 * i) >> 2];
            view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
            view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 12) >> 2);
    }
    GLctx.uniform3fv(webglGetUniformLocation(location), view);
};
var _emscripten_glUniform3fv = _glUniform3fv;
var _glUniform3i = (location, v0, v1, v2) => {
    GLctx.uniform3i(webglGetUniformLocation(location), v0, v1, v2);
};
var _emscripten_glUniform3i = _glUniform3i;
var _glUniform3iv = (location, count, value) => {
    if (count <= 96) {
        count *= 3;
        var view = miniTempWebGLIntBuffers[count];
        for (var i = 0; i < count; i += 3) {
            view[i] = HEAP32[(value + 4 * i) >> 2];
            view[i + 1] = HEAP32[(value + (4 * i + 4)) >> 2];
            view[i + 2] = HEAP32[(value + (4 * i + 8)) >> 2];
        }
    } else {
        var view = HEAP32.subarray(value >> 2, (value + count * 12) >> 2);
    }
    GLctx.uniform3iv(webglGetUniformLocation(location), view);
};
var _emscripten_glUniform3iv = _glUniform3iv;
var _glUniform4f = (location, v0, v1, v2, v3) => {
    GLctx.uniform4f(webglGetUniformLocation(location), v0, v1, v2, v3);
};
var _emscripten_glUniform4f = _glUniform4f;
var _glUniform4fv = (location, count, value) => {
    if (count <= 72) {
        var view = miniTempWebGLFloatBuffers[4 * count];
        var heap = HEAPF32;
        value = value >> 2;
        count *= 4;
        for (var i = 0; i < count; i += 4) {
            var dst = value + i;
            view[i] = heap[dst];
            view[i + 1] = heap[dst + 1];
            view[i + 2] = heap[dst + 2];
            view[i + 3] = heap[dst + 3];
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 16) >> 2);
    }
    GLctx.uniform4fv(webglGetUniformLocation(location), view);
};
var _emscripten_glUniform4fv = _glUniform4fv;
var _glUniform4i = (location, v0, v1, v2, v3) => {
    GLctx.uniform4i(webglGetUniformLocation(location), v0, v1, v2, v3);
};
var _emscripten_glUniform4i = _glUniform4i;
var _glUniform4iv = (location, count, value) => {
    if (count <= 72) {
        count *= 4;
        var view = miniTempWebGLIntBuffers[count];
        for (var i = 0; i < count; i += 4) {
            view[i] = HEAP32[(value + 4 * i) >> 2];
            view[i + 1] = HEAP32[(value + (4 * i + 4)) >> 2];
            view[i + 2] = HEAP32[(value + (4 * i + 8)) >> 2];
            view[i + 3] = HEAP32[(value + (4 * i + 12)) >> 2];
        }
    } else {
        var view = HEAP32.subarray(value >> 2, (value + count * 16) >> 2);
    }
    GLctx.uniform4iv(webglGetUniformLocation(location), view);
};
var _emscripten_glUniform4iv = _glUniform4iv;
var _glUniformMatrix2fv = (location, count, transpose, value) => {
    if (count <= 72) {
        count *= 4;
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; i += 4) {
            view[i] = HEAPF32[(value + 4 * i) >> 2];
            view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
            view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
            view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 16) >> 2);
    }
    GLctx.uniformMatrix2fv(webglGetUniformLocation(location), !!transpose, view);
};
var _emscripten_glUniformMatrix2fv = _glUniformMatrix2fv;
var _glUniformMatrix3fv = (location, count, transpose, value) => {
    if (count <= 32) {
        count *= 9;
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; i += 9) {
            view[i] = HEAPF32[(value + 4 * i) >> 2];
            view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
            view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
            view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
            view[i + 4] = HEAPF32[(value + (4 * i + 16)) >> 2];
            view[i + 5] = HEAPF32[(value + (4 * i + 20)) >> 2];
            view[i + 6] = HEAPF32[(value + (4 * i + 24)) >> 2];
            view[i + 7] = HEAPF32[(value + (4 * i + 28)) >> 2];
            view[i + 8] = HEAPF32[(value + (4 * i + 32)) >> 2];
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 36) >> 2);
    }
    GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, view);
};
var _emscripten_glUniformMatrix3fv = _glUniformMatrix3fv;
var _glUniformMatrix4fv = (location, count, transpose, value) => {
    if (count <= 18) {
        var view = miniTempWebGLFloatBuffers[16 * count];
        var heap = HEAPF32;
        value = value >> 2;
        count *= 16;
        for (var i = 0; i < count; i += 16) {
            var dst = value + i;
            view[i] = heap[dst];
            view[i + 1] = heap[dst + 1];
            view[i + 2] = heap[dst + 2];
            view[i + 3] = heap[dst + 3];
            view[i + 4] = heap[dst + 4];
            view[i + 5] = heap[dst + 5];
            view[i + 6] = heap[dst + 6];
            view[i + 7] = heap[dst + 7];
            view[i + 8] = heap[dst + 8];
            view[i + 9] = heap[dst + 9];
            view[i + 10] = heap[dst + 10];
            view[i + 11] = heap[dst + 11];
            view[i + 12] = heap[dst + 12];
            view[i + 13] = heap[dst + 13];
            view[i + 14] = heap[dst + 14];
            view[i + 15] = heap[dst + 15];
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 64) >> 2);
    }
    GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view);
};
var _emscripten_glUniformMatrix4fv = _glUniformMatrix4fv;
var _glUseProgram = (program) => {
    program = GL.programs[program];
    GLctx.useProgram(program);
    GLctx.currentProgram = program;
};
var _emscripten_glUseProgram = _glUseProgram;
var _glValidateProgram = (program) => {
    GLctx.validateProgram(GL.programs[program]);
};
var _emscripten_glValidateProgram = _glValidateProgram;
var _glVertexAttrib1f = (x0, x1) => GLctx.vertexAttrib1f(x0, x1);
var _emscripten_glVertexAttrib1f = _glVertexAttrib1f;
var _glVertexAttrib1fv = (index, v) => {
    GLctx.vertexAttrib1f(index, HEAPF32[v >> 2]);
};
var _emscripten_glVertexAttrib1fv = _glVertexAttrib1fv;
var _glVertexAttrib2f = (x0, x1, x2) => GLctx.vertexAttrib2f(x0, x1, x2);
var _emscripten_glVertexAttrib2f = _glVertexAttrib2f;
var _glVertexAttrib2fv = (index, v) => {
    GLctx.vertexAttrib2f(index, HEAPF32[v >> 2], HEAPF32[(v + 4) >> 2]);
};
var _emscripten_glVertexAttrib2fv = _glVertexAttrib2fv;
var _glVertexAttrib3f = (x0, x1, x2, x3) => GLctx.vertexAttrib3f(x0, x1, x2, x3);
var _emscripten_glVertexAttrib3f = _glVertexAttrib3f;
var _glVertexAttrib3fv = (index, v) => {
    GLctx.vertexAttrib3f(index, HEAPF32[v >> 2], HEAPF32[(v + 4) >> 2], HEAPF32[(v + 8) >> 2]);
};
var _emscripten_glVertexAttrib3fv = _glVertexAttrib3fv;
var _glVertexAttrib4f = (x0, x1, x2, x3, x4) => GLctx.vertexAttrib4f(x0, x1, x2, x3, x4);
var _emscripten_glVertexAttrib4f = _glVertexAttrib4f;
var _glVertexAttrib4fv = (index, v) => {
    GLctx.vertexAttrib4f(index, HEAPF32[v >> 2], HEAPF32[(v + 4) >> 2], HEAPF32[(v + 8) >> 2], HEAPF32[(v + 12) >> 2]);
};
var _emscripten_glVertexAttrib4fv = _glVertexAttrib4fv;
var _glVertexAttribDivisor = (index, divisor) => {
    GLctx.vertexAttribDivisor(index, divisor);
};
var _glVertexAttribDivisorANGLE = _glVertexAttribDivisor;
var _emscripten_glVertexAttribDivisorANGLE = _glVertexAttribDivisorANGLE;
var _glVertexAttribPointer = (index, size, type, normalized, stride, ptr) => {
    var cb = GL.currentContext.clientBuffers[index];
    if (!GLctx.currentArrayBufferBinding) {
        cb.size = size;
        cb.type = type;
        cb.normalized = normalized;
        cb.stride = stride;
        cb.ptr = ptr;
        cb.clientside = true;
        cb.vertexAttribPointerAdaptor = function (index, size, type, normalized, stride, ptr) {
            this.vertexAttribPointer(index, size, type, normalized, stride, ptr);
        };
        return;
    }
    cb.clientside = false;
    GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
};
var _emscripten_glVertexAttribPointer = _glVertexAttribPointer;
var _glViewport = (x0, x1, x2, x3) => GLctx.viewport(x0, x1, x2, x3);
var _emscripten_glViewport = _glViewport;
var _emscripten_has_asyncify = () => 0;
var doRequestFullscreen = (target, strategy) => {
    if (!JSEvents.fullscreenEnabled()) return -1;
    target = findEventTarget(target);
    if (!target) return -4;
    if (!target.requestFullscreen && !target.webkitRequestFullscreen) {
        return -3;
    }
    if (!JSEvents.canPerformEventHandlerRequests()) {
        if (strategy.deferUntilInEventHandler) {
            JSEvents.deferCall(JSEvents_requestFullscreen, 1, [target, strategy]);
            return 1;
        }
        return -2;
    }
    return JSEvents_requestFullscreen(target, strategy);
};
var _emscripten_request_fullscreen_strategy = (target, deferUntilInEventHandler, fullscreenStrategy) => {
    var strategy = {
        scaleMode: HEAP32[fullscreenStrategy >> 2],
        canvasResolutionScaleMode: HEAP32[(fullscreenStrategy + 4) >> 2],
        filteringMode: HEAP32[(fullscreenStrategy + 8) >> 2],
        deferUntilInEventHandler,
        canvasResizedCallback: HEAP32[(fullscreenStrategy + 12) >> 2],
        canvasResizedCallbackUserData: HEAP32[(fullscreenStrategy + 16) >> 2],
    };
    return doRequestFullscreen(target, strategy);
};
var _emscripten_request_pointerlock = (target, deferUntilInEventHandler) => {
    target = findEventTarget(target);
    if (!target) return -4;
    if (!target.requestPointerLock) {
        return -1;
    }
    if (!JSEvents.canPerformEventHandlerRequests()) {
        if (deferUntilInEventHandler) {
            JSEvents.deferCall(requestPointerLock, 2, [target]);
            return 1;
        }
        return -2;
    }
    return requestPointerLock(target);
};
var getHeapMax = () => 2147483648;
var growMemory = (size) => {
    var b = wasmMemory.buffer;
    var pages = ((size - b.byteLength + 65535) / 65536) | 0;
    try {
        wasmMemory.grow(pages);
        updateMemoryViews();
        return 1;
    } catch (e) {}
};
var _emscripten_resize_heap = (requestedSize) => {
    var oldSize = HEAPU8.length;
    requestedSize >>>= 0;
    var maxHeapSize = getHeapMax();
    if (requestedSize > maxHeapSize) {
        return false;
    }
    for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
        var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
        var replacement = growMemory(newSize);
        if (replacement) {
            return true;
        }
    }
    return false;
};
var _emscripten_sample_gamepad_data = () => {
    try {
        if (navigator.getGamepads) return (JSEvents.lastGamepadState = navigator.getGamepads()) ? 0 : -1;
    } catch (e) {
        navigator.getGamepads = null;
    }
    return -1;
};
var registerBeforeUnloadEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString) => {
    var beforeUnloadEventHandlerFunc = (e = event) => {
        var confirmationMessage = ((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, 0, userData);
        if (confirmationMessage) {
            confirmationMessage = UTF8ToString(confirmationMessage);
        }
        if (confirmationMessage) {
            e.preventDefault();
            e.returnValue = confirmationMessage;
            return confirmationMessage;
        }
    };
    var eventHandler = {
        target: findEventTarget(target),
        eventTypeString,
        callbackfunc,
        handlerFunc: beforeUnloadEventHandlerFunc,
        useCapture,
    };
    return JSEvents.registerOrRemoveHandler(eventHandler);
};
var _emscripten_set_beforeunload_callback_on_thread = (userData, callbackfunc, targetThread) => {
    if (typeof onbeforeunload == 'undefined') return -1;
    if (targetThread !== 1) return -5;
    return registerBeforeUnloadEventCallback(2, userData, true, callbackfunc, 28, 'beforeunload');
};
var registerFocusEventCallback = (
    target,
    userData,
    useCapture,
    callbackfunc,
    eventTypeId,
    eventTypeString,
    targetThread
) => {
    JSEvents.focusEvent ||= _malloc(256);
    var focusEventHandlerFunc = (e = event) => {
        var nodeName = JSEvents.getNodeNameForTarget(e.target);
        var id = e.target.id ? e.target.id : '';
        var focusEvent = JSEvents.focusEvent;
        stringToUTF8(nodeName, focusEvent + 0, 128);
        stringToUTF8(id, focusEvent + 128, 128);
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, focusEvent, userData))
            e.preventDefault();
    };
    var eventHandler = {
        target: findEventTarget(target),
        eventTypeString,
        callbackfunc,
        handlerFunc: focusEventHandlerFunc,
        useCapture,
    };
    return JSEvents.registerOrRemoveHandler(eventHandler);
};
var _emscripten_set_blur_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerFocusEventCallback(target, userData, useCapture, callbackfunc, 12, 'blur', targetThread);
var _emscripten_set_element_css_size = (target, width, height) => {
    target = findEventTarget(target);
    if (!target) return -4;
    target.style.width = width + 'px';
    target.style.height = height + 'px';
    return 0;
};
var _emscripten_set_focus_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerFocusEventCallback(target, userData, useCapture, callbackfunc, 13, 'focus', targetThread);
var fillFullscreenChangeEventData = (eventStruct) => {
    var fullscreenElement =
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;
    var isFullscreen = !!fullscreenElement;
    HEAP8[eventStruct] = isFullscreen;
    HEAP8[eventStruct + 1] = JSEvents.fullscreenEnabled();
    var reportedElement = isFullscreen ? fullscreenElement : JSEvents.previousFullscreenElement;
    var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
    var id = reportedElement?.id || '';
    stringToUTF8(nodeName, eventStruct + 2, 128);
    stringToUTF8(id, eventStruct + 130, 128);
    HEAP32[(eventStruct + 260) >> 2] = reportedElement ? reportedElement.clientWidth : 0;
    HEAP32[(eventStruct + 264) >> 2] = reportedElement ? reportedElement.clientHeight : 0;
    HEAP32[(eventStruct + 268) >> 2] = screen.width;
    HEAP32[(eventStruct + 272) >> 2] = screen.height;
    if (isFullscreen) {
        JSEvents.previousFullscreenElement = fullscreenElement;
    }
};
var registerFullscreenChangeEventCallback = (
    target,
    userData,
    useCapture,
    callbackfunc,
    eventTypeId,
    eventTypeString,
    targetThread
) => {
    JSEvents.fullscreenChangeEvent ||= _malloc(276);
    var fullscreenChangeEventhandlerFunc = (e = event) => {
        var fullscreenChangeEvent = JSEvents.fullscreenChangeEvent;
        fillFullscreenChangeEventData(fullscreenChangeEvent);
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, fullscreenChangeEvent, userData))
            e.preventDefault();
    };
    var eventHandler = {
        target,
        eventTypeString,
        callbackfunc,
        handlerFunc: fullscreenChangeEventhandlerFunc,
        useCapture,
    };
    return JSEvents.registerOrRemoveHandler(eventHandler);
};
var _emscripten_set_fullscreenchange_callback_on_thread = (
    target,
    userData,
    useCapture,
    callbackfunc,
    targetThread
) => {
    if (!JSEvents.fullscreenEnabled()) return -1;
    target = findEventTarget(target);
    if (!target) return -4;
    registerFullscreenChangeEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        19,
        'webkitfullscreenchange',
        targetThread
    );
    return registerFullscreenChangeEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        19,
        'fullscreenchange',
        targetThread
    );
};
var registerGamepadEventCallback = (
    target,
    userData,
    useCapture,
    callbackfunc,
    eventTypeId,
    eventTypeString,
    targetThread
) => {
    JSEvents.gamepadEvent ||= _malloc(1240);
    var gamepadEventHandlerFunc = (e = event) => {
        var gamepadEvent = JSEvents.gamepadEvent;
        fillGamepadEventData(gamepadEvent, e['gamepad']);
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, gamepadEvent, userData))
            e.preventDefault();
    };
    var eventHandler = {
        target: findEventTarget(target),
        allowsDeferredCalls: true,
        eventTypeString,
        callbackfunc,
        handlerFunc: gamepadEventHandlerFunc,
        useCapture,
    };
    return JSEvents.registerOrRemoveHandler(eventHandler);
};
var _emscripten_set_gamepadconnected_callback_on_thread = (userData, useCapture, callbackfunc, targetThread) => {
    if (_emscripten_sample_gamepad_data()) return -1;
    return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 26, 'gamepadconnected', targetThread);
};
var _emscripten_set_gamepaddisconnected_callback_on_thread = (userData, useCapture, callbackfunc, targetThread) => {
    if (_emscripten_sample_gamepad_data()) return -1;
    return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 27, 'gamepaddisconnected', targetThread);
};
var registerKeyEventCallback = (
    target,
    userData,
    useCapture,
    callbackfunc,
    eventTypeId,
    eventTypeString,
    targetThread
) => {
    JSEvents.keyEvent ||= _malloc(160);
    var keyEventHandlerFunc = (e) => {
        var keyEventData = JSEvents.keyEvent;
        HEAPF64[keyEventData >> 3] = e.timeStamp;
        var idx = keyEventData >> 2;
        HEAP32[idx + 2] = e.location;
        HEAP8[keyEventData + 12] = e.ctrlKey;
        HEAP8[keyEventData + 13] = e.shiftKey;
        HEAP8[keyEventData + 14] = e.altKey;
        HEAP8[keyEventData + 15] = e.metaKey;
        HEAP8[keyEventData + 16] = e.repeat;
        HEAP32[idx + 5] = e.charCode;
        HEAP32[idx + 6] = e.keyCode;
        HEAP32[idx + 7] = e.which;
        stringToUTF8(e.key || '', keyEventData + 32, 32);
        stringToUTF8(e.code || '', keyEventData + 64, 32);
        stringToUTF8(e.char || '', keyEventData + 96, 32);
        stringToUTF8(e.locale || '', keyEventData + 128, 32);
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, keyEventData, userData))
            e.preventDefault();
    };
    var eventHandler = {
        target: findEventTarget(target),
        eventTypeString,
        callbackfunc,
        handlerFunc: keyEventHandlerFunc,
        useCapture,
    };
    return JSEvents.registerOrRemoveHandler(eventHandler);
};
var _emscripten_set_keydown_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, 'keydown', targetThread);
var _emscripten_set_keypress_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, 'keypress', targetThread);
var _emscripten_set_keyup_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, 'keyup', targetThread);
var _emscripten_set_main_loop = (func, fps, simulateInfiniteLoop) => {
    var iterFunc = () => dynCall_v(func);
    setMainLoop(iterFunc, fps, simulateInfiniteLoop);
};
var fillMouseEventData = (eventStruct, e, target) => {
    HEAPF64[eventStruct >> 3] = e.timeStamp;
    var idx = eventStruct >> 2;
    HEAP32[idx + 2] = e.screenX;
    HEAP32[idx + 3] = e.screenY;
    HEAP32[idx + 4] = e.clientX;
    HEAP32[idx + 5] = e.clientY;
    HEAP8[eventStruct + 24] = e.ctrlKey;
    HEAP8[eventStruct + 25] = e.shiftKey;
    HEAP8[eventStruct + 26] = e.altKey;
    HEAP8[eventStruct + 27] = e.metaKey;
    HEAP16[idx * 2 + 14] = e.button;
    HEAP16[idx * 2 + 15] = e.buttons;
    HEAP32[idx + 8] = e['movementX'];
    HEAP32[idx + 9] = e['movementY'];
    var rect = getBoundingClientRect(target);
    HEAP32[idx + 10] = e.clientX - (rect.left | 0);
    HEAP32[idx + 11] = e.clientY - (rect.top | 0);
};
var registerMouseEventCallback = (
    target,
    userData,
    useCapture,
    callbackfunc,
    eventTypeId,
    eventTypeString,
    targetThread
) => {
    JSEvents.mouseEvent ||= _malloc(64);
    target = findEventTarget(target);
    var mouseEventHandlerFunc = (e = event) => {
        fillMouseEventData(JSEvents.mouseEvent, e, target);
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, JSEvents.mouseEvent, userData))
            e.preventDefault();
    };
    var eventHandler = {
        target,
        allowsDeferredCalls:
            eventTypeString != 'mousemove' && eventTypeString != 'mouseenter' && eventTypeString != 'mouseleave',
        eventTypeString,
        callbackfunc,
        handlerFunc: mouseEventHandlerFunc,
        useCapture,
    };
    return JSEvents.registerOrRemoveHandler(eventHandler);
};
var _emscripten_set_mousedown_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, 'mousedown', targetThread);
var _emscripten_set_mouseenter_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerMouseEventCallback(target, userData, useCapture, callbackfunc, 33, 'mouseenter', targetThread);
var _emscripten_set_mouseleave_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerMouseEventCallback(target, userData, useCapture, callbackfunc, 34, 'mouseleave', targetThread);
var _emscripten_set_mousemove_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, 'mousemove', targetThread);
var _emscripten_set_mouseup_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, 'mouseup', targetThread);
var fillPointerlockChangeEventData = (eventStruct) => {
    var pointerLockElement =
        document.pointerLockElement ||
        document.mozPointerLockElement ||
        document.webkitPointerLockElement ||
        document.msPointerLockElement;
    var isPointerlocked = !!pointerLockElement;
    HEAP8[eventStruct] = isPointerlocked;
    var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
    var id = pointerLockElement?.id || '';
    stringToUTF8(nodeName, eventStruct + 1, 128);
    stringToUTF8(id, eventStruct + 129, 128);
};
var registerPointerlockChangeEventCallback = (
    target,
    userData,
    useCapture,
    callbackfunc,
    eventTypeId,
    eventTypeString,
    targetThread
) => {
    JSEvents.pointerlockChangeEvent ||= _malloc(257);
    var pointerlockChangeEventHandlerFunc = (e = event) => {
        var pointerlockChangeEvent = JSEvents.pointerlockChangeEvent;
        fillPointerlockChangeEventData(pointerlockChangeEvent);
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, pointerlockChangeEvent, userData))
            e.preventDefault();
    };
    var eventHandler = {
        target,
        eventTypeString,
        callbackfunc,
        handlerFunc: pointerlockChangeEventHandlerFunc,
        useCapture,
    };
    return JSEvents.registerOrRemoveHandler(eventHandler);
};
var _emscripten_set_pointerlockchange_callback_on_thread = (
    target,
    userData,
    useCapture,
    callbackfunc,
    targetThread
) => {
    if (
        !document ||
        !document.body ||
        (!document.body.requestPointerLock &&
            !document.body.mozRequestPointerLock &&
            !document.body.webkitRequestPointerLock &&
            !document.body.msRequestPointerLock)
    ) {
        return -1;
    }
    target = findEventTarget(target);
    if (!target) return -4;
    registerPointerlockChangeEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        20,
        'mozpointerlockchange',
        targetThread
    );
    registerPointerlockChangeEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        20,
        'webkitpointerlockchange',
        targetThread
    );
    registerPointerlockChangeEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        20,
        'mspointerlockchange',
        targetThread
    );
    return registerPointerlockChangeEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        20,
        'pointerlockchange',
        targetThread
    );
};
var registerUiEventCallback = (
    target,
    userData,
    useCapture,
    callbackfunc,
    eventTypeId,
    eventTypeString,
    targetThread
) => {
    JSEvents.uiEvent ||= _malloc(36);
    target = findEventTarget(target);
    var uiEventHandlerFunc = (e = event) => {
        if (e.target != target) {
            return;
        }
        var b = document.body;
        if (!b) {
            return;
        }
        var uiEvent = JSEvents.uiEvent;
        HEAP32[uiEvent >> 2] = 0;
        HEAP32[(uiEvent + 4) >> 2] = b.clientWidth;
        HEAP32[(uiEvent + 8) >> 2] = b.clientHeight;
        HEAP32[(uiEvent + 12) >> 2] = innerWidth;
        HEAP32[(uiEvent + 16) >> 2] = innerHeight;
        HEAP32[(uiEvent + 20) >> 2] = outerWidth;
        HEAP32[(uiEvent + 24) >> 2] = outerHeight;
        HEAP32[(uiEvent + 28) >> 2] = pageXOffset | 0;
        HEAP32[(uiEvent + 32) >> 2] = pageYOffset | 0;
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, uiEvent, userData))
            e.preventDefault();
    };
    var eventHandler = { target, eventTypeString, callbackfunc, handlerFunc: uiEventHandlerFunc, useCapture };
    return JSEvents.registerOrRemoveHandler(eventHandler);
};
var _emscripten_set_resize_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerUiEventCallback(target, userData, useCapture, callbackfunc, 10, 'resize', targetThread);
var registerTouchEventCallback = (
    target,
    userData,
    useCapture,
    callbackfunc,
    eventTypeId,
    eventTypeString,
    targetThread
) => {
    JSEvents.touchEvent ||= _malloc(1552);
    target = findEventTarget(target);
    var touchEventHandlerFunc = (e) => {
        var t,
            touches = {},
            et = e.touches;
        for (let t of et) {
            t.isChanged = t.onTarget = 0;
            touches[t.identifier] = t;
        }
        for (let t of e.changedTouches) {
            t.isChanged = 1;
            touches[t.identifier] = t;
        }
        for (let t of e.targetTouches) {
            touches[t.identifier].onTarget = 1;
        }
        var touchEvent = JSEvents.touchEvent;
        HEAPF64[touchEvent >> 3] = e.timeStamp;
        HEAP8[touchEvent + 12] = e.ctrlKey;
        HEAP8[touchEvent + 13] = e.shiftKey;
        HEAP8[touchEvent + 14] = e.altKey;
        HEAP8[touchEvent + 15] = e.metaKey;
        var idx = touchEvent + 16;
        var targetRect = getBoundingClientRect(target);
        var numTouches = 0;
        for (let t of Object.values(touches)) {
            var idx32 = idx >> 2;
            HEAP32[idx32 + 0] = t.identifier;
            HEAP32[idx32 + 1] = t.screenX;
            HEAP32[idx32 + 2] = t.screenY;
            HEAP32[idx32 + 3] = t.clientX;
            HEAP32[idx32 + 4] = t.clientY;
            HEAP32[idx32 + 5] = t.pageX;
            HEAP32[idx32 + 6] = t.pageY;
            HEAP8[idx + 28] = t.isChanged;
            HEAP8[idx + 29] = t.onTarget;
            HEAP32[idx32 + 8] = t.clientX - (targetRect.left | 0);
            HEAP32[idx32 + 9] = t.clientY - (targetRect.top | 0);
            idx += 48;
            if (++numTouches > 31) {
                break;
            }
        }
        HEAP32[(touchEvent + 8) >> 2] = numTouches;
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, touchEvent, userData))
            e.preventDefault();
    };
    var eventHandler = {
        target,
        allowsDeferredCalls: eventTypeString == 'touchstart' || eventTypeString == 'touchend',
        eventTypeString,
        callbackfunc,
        handlerFunc: touchEventHandlerFunc,
        useCapture,
    };
    return JSEvents.registerOrRemoveHandler(eventHandler);
};
var _emscripten_set_touchcancel_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, 'touchcancel', targetThread);
var _emscripten_set_touchend_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, 'touchend', targetThread);
var _emscripten_set_touchmove_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, 'touchmove', targetThread);
var _emscripten_set_touchstart_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
    registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, 'touchstart', targetThread);
var fillVisibilityChangeEventData = (eventStruct) => {
    var visibilityStates = ['hidden', 'visible', 'prerender', 'unloaded'];
    var visibilityState = visibilityStates.indexOf(document.visibilityState);
    HEAP8[eventStruct] = document.hidden;
    HEAP32[(eventStruct + 4) >> 2] = visibilityState;
};
var registerVisibilityChangeEventCallback = (
    target,
    userData,
    useCapture,
    callbackfunc,
    eventTypeId,
    eventTypeString,
    targetThread
) => {
    JSEvents.visibilityChangeEvent ||= _malloc(8);
    var visibilityChangeEventHandlerFunc = (e = event) => {
        var visibilityChangeEvent = JSEvents.visibilityChangeEvent;
        fillVisibilityChangeEventData(visibilityChangeEvent);
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, visibilityChangeEvent, userData))
            e.preventDefault();
    };
    var eventHandler = {
        target,
        eventTypeString,
        callbackfunc,
        handlerFunc: visibilityChangeEventHandlerFunc,
        useCapture,
    };
    return JSEvents.registerOrRemoveHandler(eventHandler);
};
var _emscripten_set_visibilitychange_callback_on_thread = (userData, useCapture, callbackfunc, targetThread) => {
    if (!specialHTMLTargets[1]) {
        return -4;
    }
    return registerVisibilityChangeEventCallback(
        specialHTMLTargets[1],
        userData,
        useCapture,
        callbackfunc,
        21,
        'visibilitychange',
        targetThread
    );
};
var registerWheelEventCallback = (
    target,
    userData,
    useCapture,
    callbackfunc,
    eventTypeId,
    eventTypeString,
    targetThread
) => {
    JSEvents.wheelEvent ||= _malloc(96);
    var wheelHandlerFunc = (e = event) => {
        var wheelEvent = JSEvents.wheelEvent;
        fillMouseEventData(wheelEvent, e, target);
        HEAPF64[(wheelEvent + 64) >> 3] = e['deltaX'];
        HEAPF64[(wheelEvent + 72) >> 3] = e['deltaY'];
        HEAPF64[(wheelEvent + 80) >> 3] = e['deltaZ'];
        HEAP32[(wheelEvent + 88) >> 2] = e['deltaMode'];
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, wheelEvent, userData))
            e.preventDefault();
    };
    var eventHandler = {
        target,
        allowsDeferredCalls: true,
        eventTypeString,
        callbackfunc,
        handlerFunc: wheelHandlerFunc,
        useCapture,
    };
    return JSEvents.registerOrRemoveHandler(eventHandler);
};
var _emscripten_set_wheel_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => {
    target = findEventTarget(target);
    if (!target) return -4;
    if (typeof target.onwheel != 'undefined') {
        return registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, 'wheel', targetThread);
    } else {
        return -1;
    }
};
var _emscripten_set_window_title = (title) => (document.title = UTF8ToString(title));
var _emscripten_sleep = () => {
    throw 'Please compile your program with async support in order to use asynchronous operations like emscripten_sleep';
};
var ENV = {};
var getExecutableName = () => thisProgram || './this.program';
var getEnvStrings = () => {
    if (!getEnvStrings.strings) {
        var lang =
            ((typeof navigator == 'object' && navigator.languages && navigator.languages[0]) || 'C').replace('-', '_') +
            '.UTF-8';
        var env = {
            USER: 'web_user',
            LOGNAME: 'web_user',
            PATH: '/',
            PWD: '/',
            HOME: '/home/web_user',
            LANG: lang,
            _: getExecutableName(),
        };
        for (var x in ENV) {
            if (ENV[x] === undefined) delete env[x];
            else env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
            strings.push(`${x}=${env[x]}`);
        }
        getEnvStrings.strings = strings;
    }
    return getEnvStrings.strings;
};
var stringToAscii = (str, buffer) => {
    for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++] = str.charCodeAt(i);
    }
    HEAP8[buffer] = 0;
};
var _environ_get = (__environ, environ_buf) => {
    var bufSize = 0;
    getEnvStrings().forEach((string, i) => {
        var ptr = environ_buf + bufSize;
        HEAPU32[(__environ + i * 4) >> 2] = ptr;
        stringToAscii(string, ptr);
        bufSize += string.length + 1;
    });
    return 0;
};
var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
    var strings = getEnvStrings();
    HEAPU32[penviron_count >> 2] = strings.length;
    var bufSize = 0;
    strings.forEach((string) => (bufSize += string.length + 1));
    HEAPU32[penviron_buf_size >> 2] = bufSize;
    return 0;
};
function _fd_close(fd) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return e.errno;
    }
}
function _fd_fdstat_get(fd, pbuf) {
    try {
        var rightsBase = 0;
        var rightsInheriting = 0;
        var flags = 0;
        {
            var stream = SYSCALLS.getStreamFromFD(fd);
            var type = stream.tty ? 2 : FS.isDir(stream.mode) ? 3 : FS.isLink(stream.mode) ? 7 : 4;
        }
        HEAP8[pbuf] = type;
        HEAP16[(pbuf + 2) >> 1] = flags;
        HEAP64[(pbuf + 8) >> 3] = BigInt(rightsBase);
        HEAP64[(pbuf + 16) >> 3] = BigInt(rightsInheriting);
        return 0;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return e.errno;
    }
}
var doReadv = (stream, iov, iovcnt, offset) => {
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2];
        var len = HEAPU32[(iov + 4) >> 2];
        iov += 8;
        var curr = FS.read(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) break;
        if (typeof offset != 'undefined') {
            offset += curr;
        }
    }
    return ret;
};
function _fd_read(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = doReadv(stream, iov, iovcnt);
        HEAPU32[pnum >> 2] = num;
        return 0;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return e.errno;
    }
}
function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
    try {
        if (isNaN(offset)) return 61;
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.llseek(stream, offset, whence);
        HEAP64[newOffset >> 3] = BigInt(stream.position);
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
        return 0;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return e.errno;
    }
}
var doWritev = (stream, iov, iovcnt, offset) => {
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2];
        var len = HEAPU32[(iov + 4) >> 2];
        iov += 8;
        var curr = FS.write(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) {
            break;
        }
        if (typeof offset != 'undefined') {
            offset += curr;
        }
    }
    return ret;
};
function _fd_write(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = doWritev(stream, iov, iovcnt);
        HEAPU32[pnum >> 2] = num;
        return 0;
    } catch (e) {
        if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
        return e.errno;
    }
}
var listenOnce = (object, event, func) => object.addEventListener(event, func, { once: true });
var autoResumeAudioContext = (ctx, elements) => {
    if (!elements) {
        elements = [document, document.getElementById('canvas')];
    }
    ['keydown', 'mousedown', 'touchstart'].forEach((event) => {
        elements.forEach((element) => {
            if (element) {
                listenOnce(element, event, () => {
                    if (ctx.state === 'suspended') ctx.resume();
                });
            }
        });
    });
};
var dynCallLegacy = (sig, ptr, args) => {
    sig = sig.replace(/p/g, 'i');
    var f = Module['dynCall_' + sig];
    return f(ptr, ...args);
};
var wasmTable;
var dynCall = (sig, ptr, args = []) => {
    var rtn = dynCallLegacy(sig, ptr, args);
    return rtn;
};
var FS_createPath = FS.createPath;
var FS_unlink = (path) => FS.unlink(path);
var FS_createLazyFile = FS.createLazyFile;
var FS_createDevice = FS.createDevice;
FS.createPreloadedFile = FS_createPreloadedFile;
FS.staticInit();
Module['FS_createPath'] = FS.createPath;
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;
Module['FS_unlink'] = FS.unlink;
Module['FS_createLazyFile'] = FS.createLazyFile;
Module['FS_createDevice'] = FS.createDevice;
MEMFS.doesNotExistError = new FS.ErrnoError(44);
MEMFS.doesNotExistError.stack = '<generic error, no stack>';
Module['requestFullscreen'] = Browser.requestFullscreen;
Module['setCanvasSize'] = Browser.setCanvasSize;
Module['getUserMedia'] = Browser.getUserMedia;
Module['createContext'] = Browser.createContext;
registerPreMainLoop(() => GL.newRenderingFrameStarted());
Module['requestAnimationFrame'] = MainLoop.requestAnimationFrame;
Module['pauseMainLoop'] = MainLoop.pause;
Module['resumeMainLoop'] = MainLoop.resume;
MainLoop.init();
for (var i = 0; i < 32; ++i) tempFixedLengthArray.push(new Array(i));
var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
for (var i = 0; i <= 288; ++i) {
    miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i);
}
var miniTempWebGLIntBuffersStorage = new Int32Array(288);
for (var i = 0; i <= 288; ++i) {
    miniTempWebGLIntBuffers[i] = miniTempWebGLIntBuffersStorage.subarray(0, i);
}
var wasmImports = {
    lb: ___syscall_chmod,
    mb: ___syscall_faccessat,
    O: ___syscall_fcntl64,
    hb: ___syscall_fstat64,
    Ua: ___syscall_getdents64,
    pb: ___syscall_ioctl,
    db: ___syscall_lstat64,
    ab: ___syscall_mkdirat,
    eb: ___syscall_newfstatat,
    K: ___syscall_openat,
    Va: ___syscall_pipe,
    Ta: ___syscall_rmdir,
    gb: ___syscall_stat64,
    Sa: ___syscall_symlinkat,
    I: ___syscall_unlinkat,
    Ra: ___syscall_utimensat,
    nb: __abort_js,
    Za: __localtime_js,
    _a: __mktime_js,
    Wa: __mmap_js,
    Ya: __munmap_js,
    $a: __tzset_js,
    kb: _clock_time_get,
    bc: _eglBindAPI,
    Sc: _eglChooseConfig,
    Na: _eglCreateContext,
    Pa: _eglCreateWindowSurface,
    Oa: _eglDestroyContext,
    Xa: _eglDestroySurface,
    bd: _eglGetConfigAttrib,
    P: _eglGetDisplay,
    Ma: _eglGetError,
    wc: _eglInitialize,
    fb: _eglMakeCurrent,
    La: _eglQueryString,
    ob: _eglSwapBuffers,
    vb: _eglSwapInterval,
    Hc: _eglTerminate,
    Rb: _eglWaitGL,
    Gb: _eglWaitNative,
    b: _emscripten_asm_const_int,
    a: _emscripten_asm_const_int_sync_on_main_thread,
    u: _emscripten_asm_const_ptr_sync_on_main_thread,
    j: _emscripten_cancel_main_loop,
    L: _emscripten_date_now,
    Fa: _emscripten_exit_fullscreen,
    Ja: _emscripten_exit_pointerlock,
    Ia: _emscripten_force_exit,
    e: _emscripten_get_device_pixel_ratio,
    c: _emscripten_get_element_css_size,
    k: _emscripten_get_gamepad_status,
    J: _emscripten_get_now,
    la: _emscripten_get_num_gamepads,
    Ka: _emscripten_get_screen_size,
    ka: _emscripten_glActiveTexture,
    ja: _emscripten_glAttachShader,
    Ba: _emscripten_glBeginQueryEXT,
    ia: _emscripten_glBindAttribLocation,
    ha: _emscripten_glBindBuffer,
    ga: _emscripten_glBindFramebuffer,
    fa: _emscripten_glBindRenderbuffer,
    ea: _emscripten_glBindTexture,
    ta: _emscripten_glBindVertexArrayOES,
    da: _emscripten_glBlendColor,
    ca: _emscripten_glBlendEquation,
    ba: _emscripten_glBlendEquationSeparate,
    aa: _emscripten_glBlendFunc,
    $: _emscripten_glBlendFuncSeparate,
    _: _emscripten_glBufferData,
    Z: _emscripten_glBufferSubData,
    Y: _emscripten_glCheckFramebufferStatus,
    X: _emscripten_glClear,
    W: _emscripten_glClearColor,
    V: _emscripten_glClearDepthf,
    U: _emscripten_glClearStencil,
    rb: _emscripten_glClipControlEXT,
    T: _emscripten_glColorMask,
    Pd: _emscripten_glCompileShader,
    Od: _emscripten_glCompressedTexImage2D,
    Nd: _emscripten_glCompressedTexSubImage2D,
    Md: _emscripten_glCopyTexImage2D,
    Ld: _emscripten_glCopyTexSubImage2D,
    Kd: _emscripten_glCreateProgram,
    Jd: _emscripten_glCreateShader,
    Id: _emscripten_glCullFace,
    Hd: _emscripten_glDeleteBuffers,
    Gd: _emscripten_glDeleteFramebuffers,
    Fd: _emscripten_glDeleteProgram,
    Da: _emscripten_glDeleteQueriesEXT,
    Ed: _emscripten_glDeleteRenderbuffers,
    Dd: _emscripten_glDeleteShader,
    Cd: _emscripten_glDeleteTextures,
    sa: _emscripten_glDeleteVertexArraysOES,
    Bd: _emscripten_glDepthFunc,
    Ad: _emscripten_glDepthMask,
    zd: _emscripten_glDepthRangef,
    yd: _emscripten_glDetachShader,
    xd: _emscripten_glDisable,
    wd: _emscripten_glDisableVertexAttribArray,
    vd: _emscripten_glDrawArrays,
    oa: _emscripten_glDrawArraysInstancedANGLE,
    pa: _emscripten_glDrawBuffersWEBGL,
    ud: _emscripten_glDrawElements,
    na: _emscripten_glDrawElementsInstancedANGLE,
    td: _emscripten_glEnable,
    sd: _emscripten_glEnableVertexAttribArray,
    Aa: _emscripten_glEndQueryEXT,
    rd: _emscripten_glFinish,
    qd: _emscripten_glFlush,
    pd: _emscripten_glFramebufferRenderbuffer,
    od: _emscripten_glFramebufferTexture2D,
    nd: _emscripten_glFrontFace,
    md: _emscripten_glGenBuffers,
    kd: _emscripten_glGenFramebuffers,
    Ea: _emscripten_glGenQueriesEXT,
    jd: _emscripten_glGenRenderbuffers,
    id: _emscripten_glGenTextures,
    ra: _emscripten_glGenVertexArraysOES,
    ld: _emscripten_glGenerateMipmap,
    hd: _emscripten_glGetActiveAttrib,
    gd: _emscripten_glGetActiveUniform,
    fd: _emscripten_glGetAttachedShaders,
    ed: _emscripten_glGetAttribLocation,
    dd: _emscripten_glGetBooleanv,
    cd: _emscripten_glGetBufferParameteriv,
    ad: _emscripten_glGetError,
    $c: _emscripten_glGetFloatv,
    _c: _emscripten_glGetFramebufferAttachmentParameteriv,
    Zc: _emscripten_glGetIntegerv,
    Xc: _emscripten_glGetProgramInfoLog,
    Yc: _emscripten_glGetProgramiv,
    va: _emscripten_glGetQueryObjecti64vEXT,
    xa: _emscripten_glGetQueryObjectivEXT,
    ua: _emscripten_glGetQueryObjectui64vEXT,
    wa: _emscripten_glGetQueryObjectuivEXT,
    ya: _emscripten_glGetQueryivEXT,
    Wc: _emscripten_glGetRenderbufferParameteriv,
    Uc: _emscripten_glGetShaderInfoLog,
    Tc: _emscripten_glGetShaderPrecisionFormat,
    Rc: _emscripten_glGetShaderSource,
    Vc: _emscripten_glGetShaderiv,
    Qc: _emscripten_glGetString,
    Pc: _emscripten_glGetTexParameterfv,
    Oc: _emscripten_glGetTexParameteriv,
    Lc: _emscripten_glGetUniformLocation,
    Nc: _emscripten_glGetUniformfv,
    Mc: _emscripten_glGetUniformiv,
    Ic: _emscripten_glGetVertexAttribPointerv,
    Kc: _emscripten_glGetVertexAttribfv,
    Jc: _emscripten_glGetVertexAttribiv,
    Gc: _emscripten_glHint,
    Fc: _emscripten_glIsBuffer,
    Ec: _emscripten_glIsEnabled,
    Dc: _emscripten_glIsFramebuffer,
    Cc: _emscripten_glIsProgram,
    Ca: _emscripten_glIsQueryEXT,
    Bc: _emscripten_glIsRenderbuffer,
    Ac: _emscripten_glIsShader,
    zc: _emscripten_glIsTexture,
    qa: _emscripten_glIsVertexArrayOES,
    yc: _emscripten_glLineWidth,
    xc: _emscripten_glLinkProgram,
    vc: _emscripten_glPixelStorei,
    qb: _emscripten_glPolygonModeWEBGL,
    uc: _emscripten_glPolygonOffset,
    sb: _emscripten_glPolygonOffsetClampEXT,
    za: _emscripten_glQueryCounterEXT,
    tc: _emscripten_glReadPixels,
    sc: _emscripten_glReleaseShaderCompiler,
    rc: _emscripten_glRenderbufferStorage,
    qc: _emscripten_glSampleCoverage,
    pc: _emscripten_glScissor,
    oc: _emscripten_glShaderBinary,
    nc: _emscripten_glShaderSource,
    mc: _emscripten_glStencilFunc,
    lc: _emscripten_glStencilFuncSeparate,
    kc: _emscripten_glStencilMask,
    jc: _emscripten_glStencilMaskSeparate,
    ic: _emscripten_glStencilOp,
    hc: _emscripten_glStencilOpSeparate,
    gc: _emscripten_glTexImage2D,
    fc: _emscripten_glTexParameterf,
    ec: _emscripten_glTexParameterfv,
    dc: _emscripten_glTexParameteri,
    cc: _emscripten_glTexParameteriv,
    ac: _emscripten_glTexSubImage2D,
    $b: _emscripten_glUniform1f,
    _b: _emscripten_glUniform1fv,
    Zb: _emscripten_glUniform1i,
    Yb: _emscripten_glUniform1iv,
    Xb: _emscripten_glUniform2f,
    Wb: _emscripten_glUniform2fv,
    Vb: _emscripten_glUniform2i,
    Ub: _emscripten_glUniform2iv,
    Tb: _emscripten_glUniform3f,
    Qb: _emscripten_glUniform3fv,
    Pb: _emscripten_glUniform3i,
    Ob: _emscripten_glUniform3iv,
    Nb: _emscripten_glUniform4f,
    Mb: _emscripten_glUniform4fv,
    Lb: _emscripten_glUniform4i,
    Kb: _emscripten_glUniform4iv,
    Jb: _emscripten_glUniformMatrix2fv,
    Ib: _emscripten_glUniformMatrix3fv,
    Hb: _emscripten_glUniformMatrix4fv,
    Fb: _emscripten_glUseProgram,
    Eb: _emscripten_glValidateProgram,
    Db: _emscripten_glVertexAttrib1f,
    Cb: _emscripten_glVertexAttrib1fv,
    Bb: _emscripten_glVertexAttrib2f,
    Ab: _emscripten_glVertexAttrib2fv,
    zb: _emscripten_glVertexAttrib3f,
    yb: _emscripten_glVertexAttrib3fv,
    xb: _emscripten_glVertexAttrib4f,
    wb: _emscripten_glVertexAttrib4fv,
    ma: _emscripten_glVertexAttribDivisorANGLE,
    ub: _emscripten_glVertexAttribPointer,
    tb: _emscripten_glViewport,
    i: _emscripten_has_asyncify,
    Ga: _emscripten_request_fullscreen_strategy,
    H: _emscripten_request_pointerlock,
    Qa: _emscripten_resize_heap,
    l: _emscripten_sample_gamepad_data,
    m: _emscripten_set_beforeunload_callback_on_thread,
    z: _emscripten_set_blur_callback_on_thread,
    d: _emscripten_set_canvas_element_size,
    g: _emscripten_set_element_css_size,
    A: _emscripten_set_focus_callback_on_thread,
    p: _emscripten_set_fullscreenchange_callback_on_thread,
    R: _emscripten_set_gamepadconnected_callback_on_thread,
    Q: _emscripten_set_gamepaddisconnected_callback_on_thread,
    s: _emscripten_set_keydown_callback_on_thread,
    q: _emscripten_set_keypress_callback_on_thread,
    r: _emscripten_set_keyup_callback_on_thread,
    S: _emscripten_set_main_loop,
    F: _emscripten_set_mousedown_callback_on_thread,
    D: _emscripten_set_mouseenter_callback_on_thread,
    C: _emscripten_set_mouseleave_callback_on_thread,
    G: _emscripten_set_mousemove_callback_on_thread,
    E: _emscripten_set_mouseup_callback_on_thread,
    t: _emscripten_set_pointerlockchange_callback_on_thread,
    o: _emscripten_set_resize_callback_on_thread,
    v: _emscripten_set_touchcancel_callback_on_thread,
    x: _emscripten_set_touchend_callback_on_thread,
    w: _emscripten_set_touchmove_callback_on_thread,
    y: _emscripten_set_touchstart_callback_on_thread,
    n: _emscripten_set_visibilitychange_callback_on_thread,
    B: _emscripten_set_wheel_callback_on_thread,
    Ha: _emscripten_set_window_title,
    h: _emscripten_sleep,
    ib: _environ_get,
    jb: _environ_sizes_get,
    Sb: _exit,
    f: _fd_close,
    cb: _fd_fdstat_get,
    N: _fd_read,
    bb: _fd_seek,
    M: _fd_write,
};
var wasmExports;
createWasm();
var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports['Rd'])();
var _malloc = (a0) => (_malloc = wasmExports['Td'])(a0);
var _main = (Module['_main'] = (a0, a1) => (_main = Module['_main'] = wasmExports['Ud'])(a0, a1));
var _emscripten_builtin_memalign = (a0, a1) => (_emscripten_builtin_memalign = wasmExports['Vd'])(a0, a1);
var __emscripten_stack_restore = (a0) => (__emscripten_stack_restore = wasmExports['Wd'])(a0);
var __emscripten_stack_alloc = (a0) => (__emscripten_stack_alloc = wasmExports['Xd'])(a0);
var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports['Yd'])();
var dynCall_vi = (Module['dynCall_vi'] = (a0, a1) => (dynCall_vi = Module['dynCall_vi'] = wasmExports['Zd'])(a0, a1));
var dynCall_viii = (Module['dynCall_viii'] = (a0, a1, a2, a3) =>
    (dynCall_viii = Module['dynCall_viii'] = wasmExports['_d'])(a0, a1, a2, a3));
var dynCall_vii = (Module['dynCall_vii'] = (a0, a1, a2) =>
    (dynCall_vii = Module['dynCall_vii'] = wasmExports['$d'])(a0, a1, a2));
var dynCall_v = (Module['dynCall_v'] = (a0) => (dynCall_v = Module['dynCall_v'] = wasmExports['ae'])(a0));
var dynCall_iii = (Module['dynCall_iii'] = (a0, a1, a2) =>
    (dynCall_iii = Module['dynCall_iii'] = wasmExports['be'])(a0, a1, a2));
var dynCall_ii = (Module['dynCall_ii'] = (a0, a1) => (dynCall_ii = Module['dynCall_ii'] = wasmExports['ce'])(a0, a1));
var dynCall_viiiiiii = (Module['dynCall_viiiiiii'] = (a0, a1, a2, a3, a4, a5, a6, a7) =>
    (dynCall_viiiiiii = Module['dynCall_viiiiiii'] = wasmExports['de'])(a0, a1, a2, a3, a4, a5, a6, a7));
var dynCall_viiiiii = (Module['dynCall_viiiiii'] = (a0, a1, a2, a3, a4, a5, a6) =>
    (dynCall_viiiiii = Module['dynCall_viiiiii'] = wasmExports['ee'])(a0, a1, a2, a3, a4, a5, a6));
var dynCall_vffiiii = (Module['dynCall_vffiiii'] = (a0, a1, a2, a3, a4, a5, a6) =>
    (dynCall_vffiiii = Module['dynCall_vffiiii'] = wasmExports['fe'])(a0, a1, a2, a3, a4, a5, a6));
var dynCall_viiii = (Module['dynCall_viiii'] = (a0, a1, a2, a3, a4) =>
    (dynCall_viiii = Module['dynCall_viiii'] = wasmExports['ge'])(a0, a1, a2, a3, a4));
var dynCall_viiiii = (Module['dynCall_viiiii'] = (a0, a1, a2, a3, a4, a5) =>
    (dynCall_viiiii = Module['dynCall_viiiii'] = wasmExports['he'])(a0, a1, a2, a3, a4, a5));
var dynCall_iiii = (Module['dynCall_iiii'] = (a0, a1, a2, a3) =>
    (dynCall_iiii = Module['dynCall_iiii'] = wasmExports['ie'])(a0, a1, a2, a3));
var dynCall_iiiii = (Module['dynCall_iiiii'] = (a0, a1, a2, a3, a4) =>
    (dynCall_iiiii = Module['dynCall_iiiii'] = wasmExports['je'])(a0, a1, a2, a3, a4));
var dynCall_iijii = (Module['dynCall_iijii'] = (a0, a1, a2, a3, a4) =>
    (dynCall_iijii = Module['dynCall_iijii'] = wasmExports['ke'])(a0, a1, a2, a3, a4));
var dynCall_i = (Module['dynCall_i'] = (a0) => (dynCall_i = Module['dynCall_i'] = wasmExports['le'])(a0));
var dynCall_iid = (Module['dynCall_iid'] = (a0, a1, a2) =>
    (dynCall_iid = Module['dynCall_iid'] = wasmExports['me'])(a0, a1, a2));
var dynCall_di = (Module['dynCall_di'] = (a0, a1) => (dynCall_di = Module['dynCall_di'] = wasmExports['ne'])(a0, a1));
var dynCall_iiiiii = (Module['dynCall_iiiiii'] = (a0, a1, a2, a3, a4, a5) =>
    (dynCall_iiiiii = Module['dynCall_iiiiii'] = wasmExports['oe'])(a0, a1, a2, a3, a4, a5));
var dynCall_iiiiiiii = (Module['dynCall_iiiiiiii'] = (a0, a1, a2, a3, a4, a5, a6, a7) =>
    (dynCall_iiiiiiii = Module['dynCall_iiiiiiii'] = wasmExports['pe'])(a0, a1, a2, a3, a4, a5, a6, a7));
var dynCall_iiiiiiiiii = (Module['dynCall_iiiiiiiiii'] = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) =>
    (dynCall_iiiiiiiiii = Module['dynCall_iiiiiiiiii'] = wasmExports['qe'])(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9));
var dynCall_iiiiiiiiiiiiiiff = (Module['dynCall_iiiiiiiiiiiiiiff'] = (
    a0,
    a1,
    a2,
    a3,
    a4,
    a5,
    a6,
    a7,
    a8,
    a9,
    a10,
    a11,
    a12,
    a13,
    a14,
    a15
) =>
    (dynCall_iiiiiiiiiiiiiiff = Module['dynCall_iiiiiiiiiiiiiiff'] = wasmExports['re'])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8,
        a9,
        a10,
        a11,
        a12,
        a13,
        a14,
        a15
    ));
var dynCall_iiiiiiiii = (Module['dynCall_iiiiiiiii'] = (a0, a1, a2, a3, a4, a5, a6, a7, a8) =>
    (dynCall_iiiiiiiii = Module['dynCall_iiiiiiiii'] = wasmExports['se'])(a0, a1, a2, a3, a4, a5, a6, a7, a8));
var dynCall_viiiiiiiiiii = (Module['dynCall_viiiiiiiiiii'] = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) =>
    (dynCall_viiiiiiiiiii = Module['dynCall_viiiiiiiiiii'] = wasmExports['te'])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8,
        a9,
        a10,
        a11
    ));
var dynCall_iiiiiidiiff = (Module['dynCall_iiiiiidiiff'] = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) =>
    (dynCall_iiiiiidiiff = Module['dynCall_iiiiiidiiff'] = wasmExports['ue'])(
        a0,
        a1,
        a2,
        a3,
        a4,
        a5,
        a6,
        a7,
        a8,
        a9,
        a10
    ));
var dynCall_jiji = (Module['dynCall_jiji'] = (a0, a1, a2, a3) =>
    (dynCall_jiji = Module['dynCall_jiji'] = wasmExports['ve'])(a0, a1, a2, a3));
var dynCall_ji = (Module['dynCall_ji'] = (a0, a1) => (dynCall_ji = Module['dynCall_ji'] = wasmExports['we'])(a0, a1));
var dynCall_vffff = (Module['dynCall_vffff'] = (a0, a1, a2, a3, a4) =>
    (dynCall_vffff = Module['dynCall_vffff'] = wasmExports['xe'])(a0, a1, a2, a3, a4));
var dynCall_vf = (Module['dynCall_vf'] = (a0, a1) => (dynCall_vf = Module['dynCall_vf'] = wasmExports['ye'])(a0, a1));
var dynCall_viiiiiiii = (Module['dynCall_viiiiiiii'] = (a0, a1, a2, a3, a4, a5, a6, a7, a8) =>
    (dynCall_viiiiiiii = Module['dynCall_viiiiiiii'] = wasmExports['ze'])(a0, a1, a2, a3, a4, a5, a6, a7, a8));
var dynCall_viiiiiiiii = (Module['dynCall_viiiiiiiii'] = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) =>
    (dynCall_viiiiiiiii = Module['dynCall_viiiiiiiii'] = wasmExports['Ae'])(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9));
var dynCall_vff = (Module['dynCall_vff'] = (a0, a1, a2) =>
    (dynCall_vff = Module['dynCall_vff'] = wasmExports['Be'])(a0, a1, a2));
var dynCall_vfi = (Module['dynCall_vfi'] = (a0, a1, a2) =>
    (dynCall_vfi = Module['dynCall_vfi'] = wasmExports['Ce'])(a0, a1, a2));
var dynCall_viif = (Module['dynCall_viif'] = (a0, a1, a2, a3) =>
    (dynCall_viif = Module['dynCall_viif'] = wasmExports['De'])(a0, a1, a2, a3));
var dynCall_vif = (Module['dynCall_vif'] = (a0, a1, a2) =>
    (dynCall_vif = Module['dynCall_vif'] = wasmExports['Ee'])(a0, a1, a2));
var dynCall_viff = (Module['dynCall_viff'] = (a0, a1, a2, a3) =>
    (dynCall_viff = Module['dynCall_viff'] = wasmExports['Fe'])(a0, a1, a2, a3));
var dynCall_vifff = (Module['dynCall_vifff'] = (a0, a1, a2, a3, a4) =>
    (dynCall_vifff = Module['dynCall_vifff'] = wasmExports['Ge'])(a0, a1, a2, a3, a4));
var dynCall_viffff = (Module['dynCall_viffff'] = (a0, a1, a2, a3, a4, a5) =>
    (dynCall_viffff = Module['dynCall_viffff'] = wasmExports['He'])(a0, a1, a2, a3, a4, a5));
var dynCall_vfff = (Module['dynCall_vfff'] = (a0, a1, a2, a3) =>
    (dynCall_vfff = Module['dynCall_vfff'] = wasmExports['Ie'])(a0, a1, a2, a3));
var dynCall_iidiiii = (Module['dynCall_iidiiii'] = (a0, a1, a2, a3, a4, a5, a6) =>
    (dynCall_iidiiii = Module['dynCall_iidiiii'] = wasmExports['Je'])(a0, a1, a2, a3, a4, a5, a6));
Module['addRunDependency'] = addRunDependency;
Module['removeRunDependency'] = removeRunDependency;
Module['FS_createPreloadedFile'] = FS_createPreloadedFile;
Module['FS_unlink'] = FS_unlink;
Module['FS_createPath'] = FS_createPath;
Module['FS_createDevice'] = FS_createDevice;
Module['FS_createDataFile'] = FS_createDataFile;
Module['FS_createLazyFile'] = FS_createLazyFile;
function callMain(args = []) {
    var entryFunction = _main;
    args.unshift(thisProgram);
    var argc = args.length;
    var argv = stackAlloc((argc + 1) * 4);
    var argv_ptr = argv;
    args.forEach((arg) => {
        HEAPU32[argv_ptr >> 2] = stringToUTF8OnStack(arg);
        argv_ptr += 4;
    });
    HEAPU32[argv_ptr >> 2] = 0;
    try {
        var ret = entryFunction(argc, argv);
        exitJS(ret, true);
        return ret;
    } catch (e) {
        return handleException(e);
    }
}
function run(args = arguments_) {
    if (runDependencies > 0) {
        dependenciesFulfilled = run;
        return;
    }
    preRun();
    if (runDependencies > 0) {
        dependenciesFulfilled = run;
        return;
    }
    function doRun() {
        Module['calledRun'] = true;
        if (ABORT) return;
        initRuntime();
        preMain();
        Module['onRuntimeInitialized']?.();
        var noInitialRun = Module['noInitialRun'];
        if (!noInitialRun) callMain(args);
        postRun();
    }
    if (Module['setStatus']) {
        Module['setStatus']('Running...');
        setTimeout(() => {
            setTimeout(() => Module['setStatus'](''), 1);
            doRun();
        }, 1);
    } else {
        doRun();
    }
}
if (Module['preInit']) {
    if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
    while (Module['preInit'].length > 0) {
        Module['preInit'].pop()();
    }
}
run();
