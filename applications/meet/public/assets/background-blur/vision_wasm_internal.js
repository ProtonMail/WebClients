// Build 631569433

var ModuleFactory = (() => {
    var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
    if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
    return function (moduleArg = {}) {
        var Module = moduleArg;
        var readyPromiseResolve, readyPromiseReject;
        Module['ready'] = new Promise((resolve, reject) => {
            readyPromiseResolve = resolve;
            readyPromiseReject = reject;
        });
        var moduleOverrides = Object.assign({}, Module);
        var arguments_ = [];
        var thisProgram = './this.program';
        var quit_ = (status, toThrow) => {
            throw toThrow;
        };
        var ENVIRONMENT_IS_WEB = typeof window == 'object';
        var ENVIRONMENT_IS_WORKER = typeof importScripts == 'function';
        var ENVIRONMENT_IS_NODE =
            typeof process == 'object' &&
            typeof process.versions == 'object' &&
            typeof process.versions.node == 'string';
        var scriptDirectory = '';
        function locateFile(path) {
            if (Module['locateFile']) {
                return Module['locateFile'](path, scriptDirectory);
            }
            return scriptDirectory + path;
        }
        var read_, readAsync, readBinary;
        if (ENVIRONMENT_IS_NODE) {
            var fs = require('fs');
            var nodePath = require('path');
            if (ENVIRONMENT_IS_WORKER) {
                scriptDirectory = nodePath.dirname(scriptDirectory) + '/';
            } else {
                scriptDirectory = __dirname + '/';
            }
            read_ = (filename, binary) => {
                filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
                return fs.readFileSync(filename, binary ? undefined : 'utf8');
            };
            readBinary = (filename) => {
                var ret = read_(filename, true);
                if (!ret.buffer) {
                    ret = new Uint8Array(ret);
                }
                return ret;
            };
            readAsync = (filename, onload, onerror, binary = true) => {
                filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
                fs.readFile(filename, binary ? undefined : 'utf8', (err, data) => {
                    if (err) onerror(err);
                    else onload(binary ? data.buffer : data);
                });
            };
            if (!Module['thisProgram'] && process.argv.length > 1) {
                thisProgram = process.argv[1].replace(/\\/g, '/');
            }
            arguments_ = process.argv.slice(2);
            quit_ = (status, toThrow) => {
                process.exitCode = status;
                throw toThrow;
            };
            Module['inspect'] = () => '[Emscripten Module object]';
        } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
            if (ENVIRONMENT_IS_WORKER) {
                scriptDirectory = self.location.href;
            } else if (typeof document != 'undefined' && document.currentScript) {
                scriptDirectory = document.currentScript.src;
            }
            if (_scriptDir) {
                scriptDirectory = _scriptDir;
            }
            if (scriptDirectory.indexOf('blob:') !== 0) {
                scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, '').lastIndexOf('/') + 1);
            } else {
                scriptDirectory = '';
            }
            {
                read_ = (url) => {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, false);
                    xhr.send(null);
                    return xhr.responseText;
                };
                if (ENVIRONMENT_IS_WORKER) {
                    readBinary = (url) => {
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', url, false);
                        xhr.responseType = 'arraybuffer';
                        xhr.send(null);
                        return new Uint8Array(xhr.response);
                    };
                }
                readAsync = (url, onload, onerror) => {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.responseType = 'arraybuffer';
                    xhr.onload = () => {
                        if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
                            onload(xhr.response);
                            return;
                        }
                        onerror();
                    };
                    xhr.onerror = onerror;
                    xhr.send(null);
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
        if (Module['quit']) quit_ = Module['quit'];
        var wasmBinary;
        if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];
        if (typeof WebAssembly != 'object') {
            abort('no native wasm support detected');
        }
        var wasmMemory;
        var ABORT = false;
        var EXITSTATUS;
        function assert(condition, text) {
            if (!condition) {
                abort(text);
            }
        }
        var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
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
        }
        var __ATPRERUN__ = [];
        var __ATINIT__ = [];
        var __ATEXIT__ = [];
        var __ATPOSTRUN__ = [];
        var runtimeInitialized = false;
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
            if (!Module['noFSInit'] && !FS.init.initialized) FS.init();
            FS.ignorePermissions = false;
            TTY.init();
            callRuntimeCallbacks(__ATINIT__);
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
        var runDependencyWatcher = null;
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
                if (runDependencyWatcher !== null) {
                    clearInterval(runDependencyWatcher);
                    runDependencyWatcher = null;
                }
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
            EXITSTATUS = 1;
            what += '. Build with -sASSERTIONS for more info.';
            var e = new WebAssembly.RuntimeError(what);
            readyPromiseReject(e);
            throw e;
        }
        var dataURIPrefix = 'data:application/octet-stream;base64,';
        var isDataURI = (filename) => filename.startsWith(dataURIPrefix);
        var isFileURI = (filename) => filename.startsWith('file://');
        var wasmBinaryFile;
        wasmBinaryFile = 'vision_wasm_internal.wasm';
        if (!isDataURI(wasmBinaryFile)) {
            wasmBinaryFile = locateFile(wasmBinaryFile);
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
        function getBinaryPromise(binaryFile) {
            if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
                if (typeof fetch == 'function' && !isFileURI(binaryFile)) {
                    return fetch(binaryFile, { credentials: 'same-origin' })
                        .then((response) => {
                            if (!response['ok']) {
                                throw "failed to load wasm binary file at '" + binaryFile + "'";
                            }
                            return response['arrayBuffer']();
                        })
                        .catch(() => getBinarySync(binaryFile));
                } else if (readAsync) {
                    return new Promise((resolve, reject) => {
                        readAsync(binaryFile, (response) => resolve(new Uint8Array(response)), reject);
                    });
                }
            }
            return Promise.resolve().then(() => getBinarySync(binaryFile));
        }
        function instantiateArrayBuffer(binaryFile, imports, receiver) {
            return getBinaryPromise(binaryFile)
                .then((binary) => WebAssembly.instantiate(binary, imports))
                .then((instance) => instance)
                .then(receiver, (reason) => {
                    err(`failed to asynchronously prepare wasm: ${reason}`);
                    abort(reason);
                });
        }
        function instantiateAsync(binary, binaryFile, imports, callback) {
            if (
                !binary &&
                typeof WebAssembly.instantiateStreaming == 'function' &&
                !isDataURI(binaryFile) &&
                !isFileURI(binaryFile) &&
                !ENVIRONMENT_IS_NODE &&
                typeof fetch == 'function'
            ) {
                return fetch(binaryFile, { credentials: 'same-origin' }).then((response) => {
                    var result = WebAssembly.instantiateStreaming(response, imports);
                    return result.then(callback, function (reason) {
                        err(`wasm streaming compile failed: ${reason}`);
                        err('falling back to ArrayBuffer instantiation');
                        return instantiateArrayBuffer(binaryFile, imports, callback);
                    });
                });
            }
            return instantiateArrayBuffer(binaryFile, imports, callback);
        }
        function createWasm() {
            var info = { a: wasmImports };
            function receiveInstance(instance, module) {
                wasmExports = instance.exports;
                wasmMemory = wasmExports['rd'];
                updateMemoryViews();
                wasmTable = wasmExports['ud'];
                addOnInit(wasmExports['sd']);
                removeRunDependency('wasm-instantiate');
                return wasmExports;
            }
            addRunDependency('wasm-instantiate');
            function receiveInstantiationResult(result) {
                receiveInstance(result['instance']);
            }
            if (Module['instantiateWasm']) {
                try {
                    return Module['instantiateWasm'](info, receiveInstance);
                } catch (e) {
                    err(`Module.instantiateWasm callback failed with error: ${e}`);
                    readyPromiseReject(e);
                }
            }
            instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult).catch(readyPromiseReject);
            return {};
        }
        var tempDouble;
        var tempI64;
        var ASM_CONSTS = {
            1245803: ($0) => {
                const canvas = Emval.toValue($0);
                const context = canvas.getContext('webgpu');
                return JsValStore.add(context.getCurrentTexture());
            },
            1245938: ($0, $1, $2, $3, $4) => {
                const drawable = Emval.toValue($0);
                const device = JsValStore.get($1);
                const texture = JsValStore.get($2);
                const width = $3;
                const height = $4;
                device.queue.copyExternalImageToTexture({ source: drawable }, { texture: texture }, [width, height]);
            },
            1246189: ($0, $1, $2, $3) => {
                const sourceExtTex = Emval.toValue($0);
                const device = JsValStore.get($1);
                const sampler = JsValStore.get($2);
                const bgLayout = JsValStore.get($3);
                const bindGroup = device.createBindGroup({
                    layout: bgLayout,
                    entries: [
                        { binding: 0, resource: sampler },
                        { binding: 1, resource: sourceExtTex },
                    ],
                });
                return JsValStore.add(bindGroup);
            },
            1246537: ($0, $1) => {
                const input = Emval.toValue($0);
                const output = Emval.toValue($1);
                const ctx = output.getContext('2d');
                ctx.drawImage(input, 0, 0, output.width, output.height);
            },
            1246702: ($0, $1) => {
                const inputArray = Emval.toValue($0);
                const output = Emval.toValue($1);
                const ctx = output.getContext('2d');
                const image_data = new ImageData(inputArray, output.width, output.height);
                ctx.putImageData(image_data, 0, 0);
            },
            1246926: ($0, $1) => {
                const input = Emval.toValue($0);
                const outputArray = Emval.toValue($1);
                const ctx = input.getContext('2d');
                const data = ctx.getImageData(0, 0, input.width, input.height);
                outputArray.set(data.data);
            },
            1247130: () => typeof HTMLCanvasElement !== 'undefined',
            1247185: () => !!Module['preinitializedWebGPUDevice'],
            1247236: () => {
                specialHTMLTargets['#canvas'] = Module.canvas;
            },
            1247287: () => typeof wasmOffsetConverter !== 'undefined',
        };
        function JsWrapImageConverter() {
            if (!Module._imageConverter) {
                Module._imageConverter = (
                    binaryPtr,
                    binarySize,
                    width,
                    height,
                    numChannels,
                    makeDeepCopy,
                    outputType
                ) => {
                    const imageData = new outputType(
                        makeDeepCopy
                            ? Module.HEAPU8.slice(binaryPtr, binaryPtr + binarySize).buffer
                            : Module.HEAPU8.buffer,
                        binaryPtr,
                        width * height * numChannels
                    );
                    return { data: imageData, width: width, height: height };
                };
            }
        }
        function JsOnUint8ArrayImageListener(
            output_stream_name,
            binary_ptr,
            binary_size,
            width,
            height,
            num_channels,
            make_deep_copy,
            timestamp_ms
        ) {
            const image = Module._imageConverter(
                binary_ptr,
                binary_size,
                width,
                height,
                num_channels,
                make_deep_copy,
                Uint8Array
            );
            Module._wrapSimpleListenerOutput(output_stream_name, image, timestamp_ms);
        }
        function JsOnFloat32ArrayImageListener(
            output_stream_name,
            binary_ptr,
            binary_size,
            width,
            height,
            num_channels,
            make_deep_copy,
            timestamp_ms
        ) {
            const image = Module._imageConverter(
                binary_ptr,
                binary_size,
                width,
                height,
                num_channels,
                make_deep_copy,
                Float32Array
            );
            Module._wrapSimpleListenerOutput(output_stream_name, image, timestamp_ms);
        }
        function JsOnWebGLTextureListener(output_stream_name, name, width, height, timestamp_ms) {
            Module._wrapSimpleListenerOutput(
                output_stream_name,
                { data: GL.textures[name], width: width, height: height },
                timestamp_ms
            );
        }
        function JsOnUint8ArrayImageVectorListener(
            output_stream_name,
            binary_ptr,
            binary_size,
            width,
            height,
            num_channels,
            make_deep_copy,
            timestamp_ms
        ) {
            const image = Module._imageConverter(
                binary_ptr,
                binary_size,
                width,
                height,
                num_channels,
                make_deep_copy,
                Uint8Array
            );
            Module._wrapSimpleListenerOutput(output_stream_name, image, false, timestamp_ms);
        }
        function JsOnFloat32ArrayImageVectorListener(
            output_stream_name,
            binary_ptr,
            binary_size,
            width,
            height,
            num_channels,
            make_deep_copy,
            timestamp_ms
        ) {
            const image = Module._imageConverter(
                binary_ptr,
                binary_size,
                width,
                height,
                num_channels,
                make_deep_copy,
                Float32Array
            );
            Module._wrapSimpleListenerOutput(output_stream_name, image, false, timestamp_ms);
        }
        function JsOnWebGLTextureVectorListener(output_stream_name, name, width, height, timestamp_ms) {
            Module._wrapSimpleListenerOutput(
                output_stream_name,
                { data: GL.textures[name], width: width, height: height },
                false,
                timestamp_ms
            );
        }
        function JsOnEmptyPacketListener(output_stream_name, timestamp) {
            Module._wrapEmptyPacketListenerOutput(output_stream_name, timestamp);
        }
        function JsOnVectorFinishedListener(output_stream_name, timestamp) {
            Module._wrapSimpleListenerOutput(output_stream_name, undefined, true, timestamp);
        }
        function JsOnSimpleListenerBool(output_stream_name, out_data, timestamp) {
            Module._wrapSimpleListenerOutput(output_stream_name, out_data, timestamp);
        }
        function JsOnVectorListenerBool(output_stream_name, out_data, timestamp) {
            Module._wrapSimpleListenerOutput(output_stream_name, out_data, false, timestamp);
        }
        function JsOnSimpleListenerInt(output_stream_name, out_data, timestamp) {
            Module._wrapSimpleListenerOutput(output_stream_name, out_data, timestamp);
        }
        function JsOnVectorListenerInt(output_stream_name, out_data, timestamp) {
            Module._wrapSimpleListenerOutput(output_stream_name, out_data, false, timestamp);
        }
        function JsOnSimpleListenerUint(output_stream_name, out_data, timestamp) {
            Module._wrapSimpleListenerOutput(output_stream_name, out_data, timestamp);
        }
        function JsOnVectorListenerUint(output_stream_name, out_data, timestamp) {
            Module._wrapSimpleListenerOutput(output_stream_name, out_data, false, timestamp);
        }
        function JsOnSimpleListenerDouble(output_stream_name, out_data, timestamp) {
            Module._wrapSimpleListenerOutput(output_stream_name, out_data, timestamp);
        }
        function JsOnVectorListenerDouble(output_stream_name, out_data, timestamp) {
            Module._wrapSimpleListenerOutput(output_stream_name, out_data, false, timestamp);
        }
        function JsOnSimpleListenerFloat(output_stream_name, out_data, timestamp) {
            Module._wrapSimpleListenerOutput(output_stream_name, out_data, timestamp);
        }
        function JsOnVectorListenerFloat(output_stream_name, out_data, timestamp) {
            Module._wrapSimpleListenerOutput(output_stream_name, out_data, false, timestamp);
        }
        function JsOnSimpleListenerString(output_stream_name, out_data, timestamp) {
            Module._wrapSimpleListenerOutput(output_stream_name, UTF8ToString(out_data), timestamp);
        }
        function JsOnVectorListenerString(output_stream_name, out_data, timestamp) {
            Module._wrapSimpleListenerOutput(output_stream_name, UTF8ToString(out_data), false, timestamp);
        }
        function JsOnVectorListenerProto(output_stream_name, proto_ptr, proto_size, make_deep_copy, timestamp) {
            const newProtoArray = make_deep_copy
                ? Module.HEAPU8.slice(proto_ptr, proto_ptr + proto_size)
                : new Uint8Array(Module.HEAPU8.buffer, proto_ptr, proto_size);
            Module._wrapSimpleListenerOutput(output_stream_name, newProtoArray, false, timestamp);
        }
        function JsWrapSimpleListeners() {
            if (!Module._wrapSimpleListenerOutput) {
                Module._wrapSimpleListenerOutput = (outputStreamName, ...args) => {
                    if (Module.simpleListeners) {
                        const streamName = UTF8ToString(outputStreamName);
                        if (Module.simpleListeners[streamName]) {
                            Module.simpleListeners[streamName](...args);
                        }
                    }
                };
            }
            if (!Module._wrapEmptyPacketListenerOutput) {
                Module._wrapEmptyPacketListenerOutput = (outputStreamName, timestamp) => {
                    if (Module.emptyPacketListeners) {
                        const streamName = UTF8ToString(outputStreamName);
                        if (Module.emptyPacketListeners[streamName]) {
                            Module.emptyPacketListeners[streamName](timestamp);
                        }
                    }
                };
            }
        }
        function JsOnSimpleListenerBinaryArray(output_stream_name, binary_ptr, binary_size, make_deep_copy, timestamp) {
            const newProtoArray = make_deep_copy
                ? Module.HEAPU8.slice(binary_ptr, binary_ptr + binary_size)
                : new Uint8Array(Module.HEAPU8.buffer, binary_ptr, binary_size);
            Module._wrapSimpleListenerOutput(output_stream_name, newProtoArray, timestamp);
        }
        function mediapipe_import_external_texture(device_handle, source_handle) {
            const device = WebGPU.mgrDevice.get(device_handle);
            const source = Emval.toValue(source_handle);
            const externalTexture = device.importExternalTexture({ source: source });
            return Emval.toHandle(externalTexture);
        }
        function mediapipe_create_utility_canvas2d() {
            let canvas;
            if (typeof HTMLCanvasElement !== 'undefined') {
                canvas = document.createElement('canvas');
                canvas.style.display = 'none';
            } else {
                canvas = new OffscreenCanvas(0, 0);
            }
            return Emval.toHandle(canvas);
        }
        function GetAdapterVendor() {
            const device = Module['preinitializedWebGPUDevice'];
            const vendor = device.adapterInfo ? device.adapterInfo.vendor : 'Unknown';
            return stringToNewUTF8(vendor);
        }
        function hardware_concurrency() {
            return self.navigator.hardwareConcurrency;
        }
        function xnnLoadWasmModuleJS(code, offset, offset_end, invalid_function_index) {
            const tableOriginalSize = wasmTable.length;
            const binary = new Uint8Array(HEAPU8.slice(code + offset, code + offset_end));
            try {
                var module = new WebAssembly.Module(binary);
                var instance = new WebAssembly.Instance(module, { env: { memory: wasmMemory } });
                for (var symName in instance.exports) {
                    var value = instance.exports[symName];
                    addFunction(value);
                }
                if (tableOriginalSize < wasmTable.length) {
                    return tableOriginalSize;
                }
                return invalid_function_index;
            } catch (error) {
                console.log(error);
                return invalid_function_index;
            }
        }
        function JsWrapErrorListener(code, message) {
            if (Module.errorListener) {
                const stringMessage = UTF8ToString(message);
                Module.errorListener(code, stringMessage);
            }
        }
        function UseBottomLeftGpuOrigin() {
            return Module && Module.gpuOriginForWebTexturesIsBottomLeft;
        }
        function custom_emscripten_dbgn(str, len) {
            if (typeof dbg !== 'undefined') {
                dbg(UTF8ToString(str, len));
            } else {
                if (typeof custom_dbg === 'undefined') {
                    function custom_dbg(text) {
                        console.warn.apply(console, arguments);
                    }
                }
                custom_dbg(UTF8ToString(str, len));
            }
        }
        function HaveOffsetConverter() {
            return typeof wasmOffsetConverter !== 'undefined';
        }
        var _emscripten_set_main_loop_timing = (mode, value) => {
            Browser.mainLoop.timingMode = mode;
            Browser.mainLoop.timingValue = value;
            if (!Browser.mainLoop.func) {
                return 1;
            }
            if (!Browser.mainLoop.running) {
                Browser.mainLoop.running = true;
            }
            if (mode == 0) {
                Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
                    var timeUntilNextTick =
                        Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
                    setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
                };
                Browser.mainLoop.method = 'timeout';
            } else if (mode == 1) {
                Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
                    Browser.requestAnimationFrame(Browser.mainLoop.runner);
                };
                Browser.mainLoop.method = 'rAF';
            } else if (mode == 2) {
                if (typeof Browser.setImmediate == 'undefined') {
                    if (typeof setImmediate == 'undefined') {
                        var setImmediates = [];
                        var emscriptenMainLoopMessageId = 'setimmediate';
                        var Browser_setImmediate_messageHandler = (event) => {
                            if (
                                event.data === emscriptenMainLoopMessageId ||
                                event.data.target === emscriptenMainLoopMessageId
                            ) {
                                event.stopPropagation();
                                setImmediates.shift()();
                            }
                        };
                        addEventListener('message', Browser_setImmediate_messageHandler, true);
                        Browser.setImmediate = function Browser_emulated_setImmediate(func) {
                            setImmediates.push(func);
                            if (ENVIRONMENT_IS_WORKER) {
                                if (Module['setImmediates'] === undefined) Module['setImmediates'] = [];
                                Module['setImmediates'].push(func);
                                postMessage({ target: emscriptenMainLoopMessageId });
                            } else postMessage(emscriptenMainLoopMessageId, '*');
                        };
                    } else {
                        Browser.setImmediate = setImmediate;
                    }
                }
                Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
                    Browser.setImmediate(Browser.mainLoop.runner);
                };
                Browser.mainLoop.method = 'immediate';
            }
            return 0;
        };
        var _emscripten_get_now;
        _emscripten_get_now = () => performance.now();
        var setMainLoop = (browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
            assert(
                !Browser.mainLoop.func,
                'emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.'
            );
            Browser.mainLoop.func = browserIterationFunc;
            Browser.mainLoop.arg = arg;
            var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
            function checkIsRunning() {
                if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
                    return false;
                }
                return true;
            }
            Browser.mainLoop.running = false;
            Browser.mainLoop.runner = function Browser_mainLoop_runner() {
                if (ABORT) return;
                if (Browser.mainLoop.queue.length > 0) {
                    var start = Date.now();
                    var blocker = Browser.mainLoop.queue.shift();
                    blocker.func(blocker.arg);
                    if (Browser.mainLoop.remainingBlockers) {
                        var remaining = Browser.mainLoop.remainingBlockers;
                        var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
                        if (blocker.counted) {
                            Browser.mainLoop.remainingBlockers = next;
                        } else {
                            next = next + 0.5;
                            Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
                        }
                    }
                    Browser.mainLoop.updateStatus();
                    if (!checkIsRunning()) return;
                    setTimeout(Browser.mainLoop.runner, 0);
                    return;
                }
                if (!checkIsRunning()) return;
                Browser.mainLoop.currentFrameNumber = (Browser.mainLoop.currentFrameNumber + 1) | 0;
                if (
                    Browser.mainLoop.timingMode == 1 &&
                    Browser.mainLoop.timingValue > 1 &&
                    Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0
                ) {
                    Browser.mainLoop.scheduler();
                    return;
                } else if (Browser.mainLoop.timingMode == 0) {
                    Browser.mainLoop.tickStartTime = _emscripten_get_now();
                }
                GL.newRenderingFrameStarted();
                Browser.mainLoop.runIter(browserIterationFunc);
                if (!checkIsRunning()) return;
                if (typeof SDL == 'object') SDL.audio?.queueNewAudioData?.();
                Browser.mainLoop.scheduler();
            };
            if (!noSetTiming) {
                if (fps && fps > 0) {
                    _emscripten_set_main_loop_timing(0, 1e3 / fps);
                } else {
                    _emscripten_set_main_loop_timing(1, 1);
                }
                Browser.mainLoop.scheduler();
            }
            if (simulateInfiniteLoop) {
                throw 'unwind';
            }
        };
        var handleException = (e) => {
            if (e instanceof ExitStatus || e == 'unwind') {
                return EXITSTATUS;
            }
            quit_(1, e);
        };
        function ExitStatus(status) {
            this.name = 'ExitStatus';
            this.message = `Program terminated with exit(${status})`;
            this.status = status;
        }
        var runtimeKeepaliveCounter = 0;
        var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
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
            basename: (path) => {
                if (path === '/') return '/';
                path = PATH.normalize(path);
                path = path.replace(/\/$/, '');
                var lastSlash = path.lastIndexOf('/');
                if (lastSlash === -1) return path;
                return path.substr(lastSlash + 1);
            },
            join: function () {
                var paths = Array.prototype.slice.call(arguments);
                return PATH.normalize(paths.join('/'));
            },
            join2: (l, r) => PATH.normalize(l + '/' + r),
        };
        var initRandomFill = () => {
            if (typeof crypto == 'object' && typeof crypto['getRandomValues'] == 'function') {
                return (view) => crypto.getRandomValues(view);
            } else if (ENVIRONMENT_IS_NODE) {
                try {
                    var crypto_module = require('crypto');
                    var randomFillSync = crypto_module['randomFillSync'];
                    if (randomFillSync) {
                        return (view) => crypto_module['randomFillSync'](view);
                    }
                    var randomBytes = crypto_module['randomBytes'];
                    return (view) => (view.set(randomBytes(view.byteLength)), view);
                } catch (e) {}
            }
            abort('initRandomDevice');
        };
        var randomFill = (view) => (randomFill = initRandomFill())(view);
        var PATH_FS = {
            resolve: function () {
                var resolvedPath = '',
                    resolvedAbsolute = false;
                for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                    var path = i >= 0 ? arguments[i] : FS.cwd();
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
        var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf8') : undefined;
        var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
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
                        bytesRead = fs.readSync(fd, buf);
                    } catch (e) {
                        if (e.toString().includes('EOF')) bytesRead = 0;
                        else throw e;
                    }
                    if (bytesRead > 0) {
                        result = buf.slice(0, bytesRead).toString('utf-8');
                    } else {
                        result = null;
                    }
                } else if (typeof window != 'undefined' && typeof window.prompt == 'function') {
                    result = window.prompt('Input: ');
                    if (result !== null) {
                        result += '\n';
                    }
                } else if (typeof readline == 'function') {
                    result = readline();
                    if (result !== null) {
                        result += '\n';
                    }
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
                TTY.ttys[dev] = { input: [], output: [], ops: ops };
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
                        stream.node.timestamp = Date.now();
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
                        stream.node.timestamp = Date.now();
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
                        out(UTF8ArrayToString(tty.output, 0));
                        tty.output = [];
                    } else {
                        if (val != 0) tty.output.push(val);
                    }
                },
                fsync(tty) {
                    if (tty.output && tty.output.length > 0) {
                        out(UTF8ArrayToString(tty.output, 0));
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
                            3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                            0, 0, 0, 0, 0,
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
                        err(UTF8ArrayToString(tty.output, 0));
                        tty.output = [];
                    } else {
                        if (val != 0) tty.output.push(val);
                    }
                },
                fsync(tty) {
                    if (tty.output && tty.output.length > 0) {
                        err(UTF8ArrayToString(tty.output, 0));
                        tty.output = [];
                    }
                },
            },
        };
        var zeroMemory = (address, size) => {
            HEAPU8.fill(0, address, address + size);
            return address;
        };
        var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
        var mmapAlloc = (size) => {
            size = alignMemory(size, 65536);
            var ptr = _emscripten_builtin_memalign(65536, size);
            if (!ptr) return 0;
            return zeroMemory(ptr, size);
        };
        var MEMFS = {
            ops_table: null,
            mount(mount) {
                return MEMFS.createNode(null, '/', 16384 | 511, 0);
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
                node.timestamp = Date.now();
                if (parent) {
                    parent.contents[name] = node;
                    parent.timestamp = node.timestamp;
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
                newCapacity = Math.max(
                    newCapacity,
                    (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>> 0
                );
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
                    attr.atime = new Date(node.timestamp);
                    attr.mtime = new Date(node.timestamp);
                    attr.ctime = new Date(node.timestamp);
                    attr.blksize = 4096;
                    attr.blocks = Math.ceil(attr.size / attr.blksize);
                    return attr;
                },
                setattr(node, attr) {
                    if (attr.mode !== undefined) {
                        node.mode = attr.mode;
                    }
                    if (attr.timestamp !== undefined) {
                        node.timestamp = attr.timestamp;
                    }
                    if (attr.size !== undefined) {
                        MEMFS.resizeFileStorage(node, attr.size);
                    }
                },
                lookup(parent, name) {
                    throw FS.genericErrors[44];
                },
                mknod(parent, name, mode, dev) {
                    return MEMFS.createNode(parent, name, mode, dev);
                },
                rename(old_node, new_dir, new_name) {
                    if (FS.isDir(old_node.mode)) {
                        var new_node;
                        try {
                            new_node = FS.lookupNode(new_dir, new_name);
                        } catch (e) {}
                        if (new_node) {
                            for (var i in new_node.contents) {
                                throw new FS.ErrnoError(55);
                            }
                        }
                    }
                    delete old_node.parent.contents[old_node.name];
                    old_node.parent.timestamp = Date.now();
                    old_node.name = new_name;
                    new_dir.contents[new_name] = old_node;
                    new_dir.timestamp = old_node.parent.timestamp;
                    old_node.parent = new_dir;
                },
                unlink(parent, name) {
                    delete parent.contents[name];
                    parent.timestamp = Date.now();
                },
                rmdir(parent, name) {
                    var node = FS.lookupNode(parent, name);
                    for (var i in node.contents) {
                        throw new FS.ErrnoError(55);
                    }
                    delete parent.contents[name];
                    parent.timestamp = Date.now();
                },
                readdir(node) {
                    var entries = ['.', '..'];
                    for (var key of Object.keys(node.contents)) {
                        entries.push(key);
                    }
                    return entries;
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
                    node.timestamp = Date.now();
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
                    if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
                        allocated = false;
                        ptr = contents.byteOffset;
                    } else {
                        if (position > 0 || position + length < contents.length) {
                            if (contents.subarray) {
                                contents = contents.subarray(position, position + length);
                            } else {
                                contents = Array.prototype.slice.call(contents, position, position + length);
                            }
                        }
                        allocated = true;
                        ptr = mmapAlloc(length);
                        if (!ptr) {
                            throw new FS.ErrnoError(48);
                        }
                        HEAP8.set(contents, ptr);
                    }
                    return { ptr: ptr, allocated: allocated };
                },
                msync(stream, buffer, offset, length, mmapFlags) {
                    MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
                    return 0;
                },
            },
        };
        var asyncLoad = (url, onload, onerror, noRunDep) => {
            var dep = !noRunDep ? getUniqueRunDependency(`al ${url}`) : '';
            readAsync(
                url,
                (arrayBuffer) => {
                    assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
                    onload(new Uint8Array(arrayBuffer));
                    if (dep) removeRunDependency(dep);
                },
                (event) => {
                    if (onerror) {
                        onerror();
                    } else {
                        throw `Loading data file "${url}" failed.`;
                    }
                }
            );
            if (dep) addRunDependency(dep);
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
                asyncLoad(url, (byteArray) => processData(byteArray), onerror);
            } else {
                processData(url);
            }
        };
        var FS_modeStringToFlags = (str) => {
            var flagModes = {
                r: 0,
                'r+': 2,
                w: 512 | 64 | 1,
                'w+': 512 | 64 | 2,
                a: 1024 | 64 | 1,
                'a+': 1024 | 64 | 2,
            };
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
            ErrnoError: null,
            genericErrors: {},
            filesystems: null,
            syncFSRequests: 0,
            lookupPath(path, opts = {}) {
                path = PATH_FS.resolve(path);
                if (!path) return { path: '', node: null };
                var defaults = { follow_mount: true, recurse_count: 0 };
                opts = Object.assign(defaults, opts);
                if (opts.recurse_count > 8) {
                    throw new FS.ErrnoError(32);
                }
                var parts = path.split('/').filter((p) => !!p);
                var current = FS.root;
                var current_path = '/';
                for (var i = 0; i < parts.length; i++) {
                    var islast = i === parts.length - 1;
                    if (islast && opts.parent) {
                        break;
                    }
                    current = FS.lookupNode(current, parts[i]);
                    current_path = PATH.join2(current_path, parts[i]);
                    if (FS.isMountpoint(current)) {
                        if (!islast || (islast && opts.follow_mount)) {
                            current = current.mounted.root;
                        }
                    }
                    if (!islast || opts.follow) {
                        var count = 0;
                        while (FS.isLink(current.mode)) {
                            var link = FS.readlink(current_path);
                            current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                            var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count + 1 });
                            current = lookup.node;
                            if (count++ > 40) {
                                throw new FS.ErrnoError(32);
                            }
                        }
                    }
                }
                return { path: current_path, node: current };
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
                    throw new FS.ErrnoError(errCode, parent);
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
                var errCode = FS.nodePermissions(dir, 'x');
                if (errCode) return errCode;
                if (!dir.node_ops.lookup) return 2;
                return 0;
            },
            mayCreate(dir, name) {
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
                    if (FS.flagsToPermissionString(flags) !== 'r' || flags & 512) {
                        return 31;
                    }
                }
                return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
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
                if (!FS.FSStream) {
                    FS.FSStream = function () {
                        this.shared = {};
                    };
                    FS.FSStream.prototype = {};
                    Object.defineProperties(FS.FSStream.prototype, {
                        object: {
                            get() {
                                return this.node;
                            },
                            set(val) {
                                this.node = val;
                            },
                        },
                        isRead: {
                            get() {
                                return (this.flags & 2097155) !== 1;
                            },
                        },
                        isWrite: {
                            get() {
                                return (this.flags & 2097155) !== 0;
                            },
                        },
                        isAppend: {
                            get() {
                                return this.flags & 1024;
                            },
                        },
                        flags: {
                            get() {
                                return this.shared.flags;
                            },
                            set(val) {
                                this.shared.flags = val;
                            },
                        },
                        position: {
                            get() {
                                return this.shared.position;
                            },
                            set(val) {
                                this.shared.position = val;
                            },
                        },
                    });
                }
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
                    check.push.apply(check, m.mounts);
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
                    err(
                        `warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`
                    );
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
                var mount = { type: type, opts: opts, mountpoint: mountpoint, mounts: [] };
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
                if (!name || name === '.' || name === '..') {
                    throw new FS.ErrnoError(28);
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
            create(path, mode) {
                mode = mode !== undefined ? mode : 438;
                mode &= 4095;
                mode |= 32768;
                return FS.mknod(path, mode, 0);
            },
            mkdir(path, mode) {
                mode = mode !== undefined ? mode : 511;
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
                if (!node.node_ops.readdir) {
                    throw new FS.ErrnoError(54);
                }
                return node.node_ops.readdir(node);
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
                return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
            },
            stat(path, dontFollow) {
                var lookup = FS.lookupPath(path, { follow: !dontFollow });
                var node = lookup.node;
                if (!node) {
                    throw new FS.ErrnoError(44);
                }
                if (!node.node_ops.getattr) {
                    throw new FS.ErrnoError(63);
                }
                return node.node_ops.getattr(node);
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
                if (!node.node_ops.setattr) {
                    throw new FS.ErrnoError(63);
                }
                node.node_ops.setattr(node, { mode: (mode & 4095) | (node.mode & ~4095), timestamp: Date.now() });
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
                if (!node.node_ops.setattr) {
                    throw new FS.ErrnoError(63);
                }
                node.node_ops.setattr(node, { timestamp: Date.now() });
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
                if (!node.node_ops.setattr) {
                    throw new FS.ErrnoError(63);
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
                node.node_ops.setattr(node, { size: len, timestamp: Date.now() });
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
                node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) });
            },
            open(path, flags, mode) {
                if (path === '') {
                    throw new FS.ErrnoError(44);
                }
                flags = typeof flags == 'string' ? FS_modeStringToFlags(flags) : flags;
                mode = typeof mode == 'undefined' ? 438 : mode;
                if (flags & 64) {
                    mode = (mode & 4095) | 32768;
                } else {
                    mode = 0;
                }
                var node;
                if (typeof path == 'object') {
                    node = path;
                } else {
                    path = PATH.normalize(path);
                    try {
                        var lookup = FS.lookupPath(path, { follow: !(flags & 131072) });
                        node = lookup.node;
                    } catch (e) {}
                }
                var created = false;
                if (flags & 64) {
                    if (node) {
                        if (flags & 128) {
                            throw new FS.ErrnoError(20);
                        }
                    } else {
                        node = FS.mknod(path, mode, 0);
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
                    node: node,
                    path: FS.getPath(node),
                    flags: flags,
                    seekable: true,
                    position: 0,
                    stream_ops: node.stream_ops,
                    ungotten: [],
                    error: false,
                });
                if (stream.stream_ops.open) {
                    stream.stream_ops.open(stream);
                }
                if (Module['logReadFiles'] && !(flags & 1)) {
                    if (!FS.readFiles) FS.readFiles = {};
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
                return stream.stream_ops.mmap(stream, length, position, prot, flags);
            },
            msync(stream, buffer, offset, length, mmapFlags) {
                if (!stream.stream_ops.msync) {
                    return 0;
                }
                return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
            },
            munmap: (stream) => 0,
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
                    ret = UTF8ArrayToString(buf, 0);
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
                        randomLeft = randomFill(randomBuffer).byteLength;
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
                            var node = FS.createNode(proc_self, 'fd', 16384 | 511, 73);
                            node.node_ops = {
                                lookup(parent, name) {
                                    var fd = +name;
                                    var stream = FS.getStreamChecked(fd);
                                    var ret = {
                                        parent: null,
                                        mount: { mountpoint: 'fake' },
                                        node_ops: { readlink: () => stream.path },
                                    };
                                    ret.parent = ret;
                                    return ret;
                                },
                            };
                            return node;
                        },
                    },
                    {},
                    '/proc/self/fd'
                );
            },
            createStandardStreams() {
                if (Module['stdin']) {
                    FS.createDevice('/dev', 'stdin', Module['stdin']);
                } else {
                    FS.symlink('/dev/tty', '/dev/stdin');
                }
                if (Module['stdout']) {
                    FS.createDevice('/dev', 'stdout', null, Module['stdout']);
                } else {
                    FS.symlink('/dev/tty', '/dev/stdout');
                }
                if (Module['stderr']) {
                    FS.createDevice('/dev', 'stderr', null, Module['stderr']);
                } else {
                    FS.symlink('/dev/tty1', '/dev/stderr');
                }
                var stdin = FS.open('/dev/stdin', 0);
                var stdout = FS.open('/dev/stdout', 1);
                var stderr = FS.open('/dev/stderr', 1);
            },
            ensureErrnoError() {
                if (FS.ErrnoError) return;
                FS.ErrnoError = function ErrnoError(errno, node) {
                    this.name = 'ErrnoError';
                    this.node = node;
                    this.setErrno = function (errno) {
                        this.errno = errno;
                    };
                    this.setErrno(errno);
                    this.message = 'FS error';
                };
                FS.ErrnoError.prototype = new Error();
                FS.ErrnoError.prototype.constructor = FS.ErrnoError;
                [44].forEach((code) => {
                    FS.genericErrors[code] = new FS.ErrnoError(code);
                    FS.genericErrors[code].stack = '<generic error, no stack>';
                });
            },
            staticInit() {
                FS.ensureErrnoError();
                FS.nameTable = new Array(4096);
                FS.mount(MEMFS, {}, '/');
                FS.createDefaultDirectories();
                FS.createDefaultDevices();
                FS.createSpecialDirectories();
                FS.filesystems = { MEMFS: MEMFS };
            },
            init(input, output, error) {
                FS.init.initialized = true;
                FS.ensureErrnoError();
                Module['stdin'] = input || Module['stdin'];
                Module['stdout'] = output || Module['stdout'];
                Module['stderr'] = error || Module['stderr'];
                FS.createStandardStreams();
            },
            quit() {
                FS.init.initialized = false;
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
                if (!FS.createDevice.major) FS.createDevice.major = 64;
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
                            stream.node.timestamp = Date.now();
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
                            stream.node.timestamp = Date.now();
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
                } else if (read_) {
                    try {
                        obj.contents = intArrayFromString(read_(obj.url), true);
                        obj.usedBytes = obj.contents.length;
                    } catch (e) {
                        throw new FS.ErrnoError(29);
                    }
                } else {
                    throw new Error('Cannot load without read() or XMLHttpRequest.');
                }
            },
            createLazyFile(parent, name, url, canRead, canWrite) {
                function LazyUint8Array() {
                    this.lengthKnown = false;
                    this.chunks = [];
                }
                LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
                    if (idx > this.length - 1 || idx < 0) {
                        return undefined;
                    }
                    var chunkOffset = idx % this.chunkSize;
                    var chunkNum = (idx / this.chunkSize) | 0;
                    return this.getter(chunkNum)[chunkOffset];
                };
                LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
                    this.getter = getter;
                };
                LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
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
                        if (from > to)
                            throw new Error('invalid range (' + from + ', ' + to + ') or no bytes requested!');
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
                };
                if (typeof XMLHttpRequest != 'undefined') {
                    if (!ENVIRONMENT_IS_WORKER)
                        throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
                    var lazyArray = new LazyUint8Array();
                    Object.defineProperties(lazyArray, {
                        length: {
                            get: function () {
                                if (!this.lengthKnown) {
                                    this.cacheLength();
                                }
                                return this._length;
                            },
                        },
                        chunkSize: {
                            get: function () {
                                if (!this.lengthKnown) {
                                    this.cacheLength();
                                }
                                return this._chunkSize;
                            },
                        },
                    });
                    var properties = { isDevice: false, contents: lazyArray };
                } else {
                    var properties = { isDevice: false, url: url };
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
                    stream_ops[key] = function forceLoadLazyFile() {
                        FS.forceLoadFile(node);
                        return fn.apply(null, arguments);
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
                    return { ptr: ptr, allocated: true };
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
                return PATH.join2(dir, path);
            },
            doStat(func, path, buf) {
                try {
                    var stat = func(path);
                } catch (e) {
                    if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                        return -54;
                    }
                    throw e;
                }
                HEAP32[buf >> 2] = stat.dev;
                HEAP32[(buf + 4) >> 2] = stat.mode;
                HEAPU32[(buf + 8) >> 2] = stat.nlink;
                HEAP32[(buf + 12) >> 2] = stat.uid;
                HEAP32[(buf + 16) >> 2] = stat.gid;
                HEAP32[(buf + 20) >> 2] = stat.rdev;
                ((tempI64 = [
                    stat.size >>> 0,
                    ((tempDouble = stat.size),
                    +Math.abs(tempDouble) >= 1
                        ? tempDouble > 0
                            ? +Math.floor(tempDouble / 4294967296) >>> 0
                            : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0
                        : 0),
                ]),
                    (HEAP32[(buf + 24) >> 2] = tempI64[0]),
                    (HEAP32[(buf + 28) >> 2] = tempI64[1]));
                HEAP32[(buf + 32) >> 2] = 4096;
                HEAP32[(buf + 36) >> 2] = stat.blocks;
                var atime = stat.atime.getTime();
                var mtime = stat.mtime.getTime();
                var ctime = stat.ctime.getTime();
                ((tempI64 = [
                    Math.floor(atime / 1e3) >>> 0,
                    ((tempDouble = Math.floor(atime / 1e3)),
                    +Math.abs(tempDouble) >= 1
                        ? tempDouble > 0
                            ? +Math.floor(tempDouble / 4294967296) >>> 0
                            : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0
                        : 0),
                ]),
                    (HEAP32[(buf + 40) >> 2] = tempI64[0]),
                    (HEAP32[(buf + 44) >> 2] = tempI64[1]));
                HEAPU32[(buf + 48) >> 2] = (atime % 1e3) * 1e3;
                ((tempI64 = [
                    Math.floor(mtime / 1e3) >>> 0,
                    ((tempDouble = Math.floor(mtime / 1e3)),
                    +Math.abs(tempDouble) >= 1
                        ? tempDouble > 0
                            ? +Math.floor(tempDouble / 4294967296) >>> 0
                            : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0
                        : 0),
                ]),
                    (HEAP32[(buf + 56) >> 2] = tempI64[0]),
                    (HEAP32[(buf + 60) >> 2] = tempI64[1]));
                HEAPU32[(buf + 64) >> 2] = (mtime % 1e3) * 1e3;
                ((tempI64 = [
                    Math.floor(ctime / 1e3) >>> 0,
                    ((tempDouble = Math.floor(ctime / 1e3)),
                    +Math.abs(tempDouble) >= 1
                        ? tempDouble > 0
                            ? +Math.floor(tempDouble / 4294967296) >>> 0
                            : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0
                        : 0),
                ]),
                    (HEAP32[(buf + 72) >> 2] = tempI64[0]),
                    (HEAP32[(buf + 76) >> 2] = tempI64[1]));
                HEAPU32[(buf + 80) >> 2] = (ctime % 1e3) * 1e3;
                ((tempI64 = [
                    stat.ino >>> 0,
                    ((tempDouble = stat.ino),
                    +Math.abs(tempDouble) >= 1
                        ? tempDouble > 0
                            ? +Math.floor(tempDouble / 4294967296) >>> 0
                            : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0
                        : 0),
                ]),
                    (HEAP32[(buf + 88) >> 2] = tempI64[0]),
                    (HEAP32[(buf + 92) >> 2] = tempI64[1]));
                return 0;
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
            varargs: undefined,
            get() {
                var ret = HEAP32[+SYSCALLS.varargs >> 2];
                SYSCALLS.varargs += 4;
                return ret;
            },
            getp() {
                return SYSCALLS.get();
            },
            getStr(ptr) {
                var ret = UTF8ToString(ptr);
                return ret;
            },
            getStreamFromFD(fd) {
                var stream = FS.getStreamChecked(fd);
                return stream;
            },
        };
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
            mainLoop: {
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
                pause() {
                    Browser.mainLoop.scheduler = null;
                    Browser.mainLoop.currentlyRunningMainloop++;
                },
                resume() {
                    Browser.mainLoop.currentlyRunningMainloop++;
                    var timingMode = Browser.mainLoop.timingMode;
                    var timingValue = Browser.mainLoop.timingValue;
                    var func = Browser.mainLoop.func;
                    Browser.mainLoop.func = null;
                    setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
                    _emscripten_set_main_loop_timing(timingMode, timingValue);
                    Browser.mainLoop.scheduler();
                },
                updateStatus() {
                    if (Module['setStatus']) {
                        var message = Module['statusMessage'] || 'Please wait...';
                        var remaining = Browser.mainLoop.remainingBlockers;
                        var expected = Browser.mainLoop.expectedBlockers;
                        if (remaining) {
                            if (remaining < expected) {
                                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
                            } else {
                                Module['setStatus'](message);
                            }
                        } else {
                            Module['setStatus']('');
                        }
                    }
                },
                runIter(func) {
                    if (ABORT) return;
                    if (Module['preMainLoop']) {
                        var preRet = Module['preMainLoop']();
                        if (preRet === false) {
                            return;
                        }
                    }
                    callUserCallback(func);
                    Module['postMainLoop']?.();
                },
            },
            isFullscreen: false,
            pointerLock: false,
            moduleContextCreatedCallbacks: [],
            workers: [],
            init() {
                if (Browser.initted) return;
                Browser.initted = true;
                var imagePlugin = {};
                imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
                    return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
                };
                imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
                    var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
                    if (b.size !== byteArray.length) {
                        b = new Blob([new Uint8Array(byteArray).buffer], { type: Browser.getMimetype(name) });
                    }
                    var url = URL.createObjectURL(b);
                    var img = new Image();
                    img.onload = () => {
                        assert(img.complete, `Image ${name} could not be decoded`);
                        var canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        var ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        preloadedImages[name] = canvas;
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
                    return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
                };
                audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
                    var done = false;
                    function finish(audio) {
                        if (done) return;
                        done = true;
                        preloadedAudios[name] = audio;
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
                if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
                var ctx;
                var contextHandle;
                if (useWebGL) {
                    var contextAttributes = {
                        antialias: false,
                        alpha: false,
                        majorVersion: typeof WebGL2RenderingContext != 'undefined' ? 2 : 1,
                    };
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
                    if (!useWebGL)
                        assert(
                            typeof GLctx == 'undefined',
                            'cannot set in module if GLctx is used, but we are a non-GL context that would replace it'
                        );
                    Module.ctx = ctx;
                    if (useWebGL) GL.makeContextCurrent(contextHandle);
                    Module.useWebGL = useWebGL;
                    Browser.moduleContextCreatedCallbacks.forEach((callback) => callback());
                    Browser.init();
                }
                return ctx;
            },
            destroyContext(canvas, useWebGL, setInModule) {},
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
            nextRAF: 0,
            fakeRequestAnimationFrame(func) {
                var now = Date.now();
                if (Browser.nextRAF === 0) {
                    Browser.nextRAF = now + 1e3 / 60;
                } else {
                    while (now + 2 >= Browser.nextRAF) {
                        Browser.nextRAF += 1e3 / 60;
                    }
                }
                var delay = Math.max(Browser.nextRAF - now, 0);
                setTimeout(func, delay);
            },
            requestAnimationFrame(func) {
                if (typeof requestAnimationFrame == 'function') {
                    requestAnimationFrame(func);
                    return;
                }
                var RAF = Browser.fakeRequestAnimationFrame;
                RAF(func);
            },
            safeSetTimeout(func, timeout) {
                return safeSetTimeout(func, timeout);
            },
            safeRequestAnimationFrame(func) {
                return Browser.requestAnimationFrame(() => {
                    callUserCallback(func);
                });
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
                const { x: x, y: y } = Browser.calculateMouseCoords(pageX, pageY);
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
                    if (typeof SDL != 'undefined') {
                        Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
                        Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
                    } else {
                        Browser.mouseX += Browser.mouseMovementX;
                        Browser.mouseY += Browser.mouseMovementY;
                    }
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
        var callRuntimeCallbacks = (callbacks) => {
            while (callbacks.length > 0) {
                callbacks.shift()(Module);
            }
        };
        var noExitRuntime = Module['noExitRuntime'] || true;
        function ExceptionInfo(excPtr) {
            this.excPtr = excPtr;
            this.ptr = excPtr - 24;
            this.set_type = function (type) {
                HEAPU32[(this.ptr + 4) >> 2] = type;
            };
            this.get_type = function () {
                return HEAPU32[(this.ptr + 4) >> 2];
            };
            this.set_destructor = function (destructor) {
                HEAPU32[(this.ptr + 8) >> 2] = destructor;
            };
            this.get_destructor = function () {
                return HEAPU32[(this.ptr + 8) >> 2];
            };
            this.set_caught = function (caught) {
                caught = caught ? 1 : 0;
                HEAP8[(this.ptr + 12) >> 0] = caught;
            };
            this.get_caught = function () {
                return HEAP8[(this.ptr + 12) >> 0] != 0;
            };
            this.set_rethrown = function (rethrown) {
                rethrown = rethrown ? 1 : 0;
                HEAP8[(this.ptr + 13) >> 0] = rethrown;
            };
            this.get_rethrown = function () {
                return HEAP8[(this.ptr + 13) >> 0] != 0;
            };
            this.init = function (type, destructor) {
                this.set_adjusted_ptr(0);
                this.set_type(type);
                this.set_destructor(destructor);
            };
            this.set_adjusted_ptr = function (adjustedPtr) {
                HEAPU32[(this.ptr + 16) >> 2] = adjustedPtr;
            };
            this.get_adjusted_ptr = function () {
                return HEAPU32[(this.ptr + 16) >> 2];
            };
            this.get_exception_ptr = function () {
                var isPointer = ___cxa_is_pointer_type(this.get_type());
                if (isPointer) {
                    return HEAPU32[this.excPtr >> 2];
                }
                var adjusted = this.get_adjusted_ptr();
                if (adjusted !== 0) return adjusted;
                return this.excPtr;
            };
        }
        var exceptionLast = 0;
        var uncaughtExceptionCount = 0;
        var ___cxa_throw = (ptr, type, destructor) => {
            var info = new ExceptionInfo(ptr);
            info.init(type, destructor);
            exceptionLast = ptr;
            uncaughtExceptionCount++;
            throw exceptionLast;
        };
        var setErrNo = (value) => {
            HEAP32[___errno_location() >> 2] = value;
            return value;
        };
        function ___syscall_fcntl64(fd, cmd, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var stream = SYSCALLS.getStreamFromFD(fd);
                switch (cmd) {
                    case 0: {
                        var arg = SYSCALLS.get();
                        if (arg < 0) {
                            return -28;
                        }
                        while (FS.streams[arg]) {
                            arg++;
                        }
                        var newStream;
                        newStream = FS.createStream(stream, arg);
                        return newStream.fd;
                    }
                    case 1:
                    case 2:
                        return 0;
                    case 3:
                        return stream.flags;
                    case 4: {
                        var arg = SYSCALLS.get();
                        stream.flags |= arg;
                        return 0;
                    }
                    case 12: {
                        var arg = SYSCALLS.getp();
                        var offset = 0;
                        HEAP16[(arg + offset) >> 1] = 2;
                        return 0;
                    }
                    case 13:
                    case 14:
                        return 0;
                    case 16:
                    case 8:
                        return -28;
                    case 9:
                        setErrNo(28);
                        return -1;
                    default: {
                        return -28;
                    }
                }
            } catch (e) {
                if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
                return -e.errno;
            }
        }
        function ___syscall_fstat64(fd, buf) {
            try {
                var stream = SYSCALLS.getStreamFromFD(fd);
                return SYSCALLS.doStat(FS.stat, stream.path, buf);
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
                            var argp = SYSCALLS.getp();
                            HEAP32[argp >> 2] = termios.c_iflag || 0;
                            HEAP32[(argp + 4) >> 2] = termios.c_oflag || 0;
                            HEAP32[(argp + 8) >> 2] = termios.c_cflag || 0;
                            HEAP32[(argp + 12) >> 2] = termios.c_lflag || 0;
                            for (var i = 0; i < 32; i++) {
                                HEAP8[(argp + i + 17) >> 0] = termios.c_cc[i] || 0;
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
                            var argp = SYSCALLS.getp();
                            var c_iflag = HEAP32[argp >> 2];
                            var c_oflag = HEAP32[(argp + 4) >> 2];
                            var c_cflag = HEAP32[(argp + 8) >> 2];
                            var c_lflag = HEAP32[(argp + 12) >> 2];
                            var c_cc = [];
                            for (var i = 0; i < 32; i++) {
                                c_cc.push(HEAP8[(argp + i + 17) >> 0]);
                            }
                            return stream.tty.ops.ioctl_tcsets(stream.tty, op, {
                                c_iflag: c_iflag,
                                c_oflag: c_oflag,
                                c_cflag: c_cflag,
                                c_lflag: c_lflag,
                                c_cc: c_cc,
                            });
                        }
                        return 0;
                    }
                    case 21519: {
                        if (!stream.tty) return -59;
                        var argp = SYSCALLS.getp();
                        HEAP32[argp >> 2] = 0;
                        return 0;
                    }
                    case 21520: {
                        if (!stream.tty) return -59;
                        return -28;
                    }
                    case 21531: {
                        var argp = SYSCALLS.getp();
                        return FS.ioctl(stream, op, argp);
                    }
                    case 21523: {
                        if (!stream.tty) return -59;
                        if (stream.tty.ops.ioctl_tiocgwinsz) {
                            var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
                            var argp = SYSCALLS.getp();
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
                return SYSCALLS.doStat(FS.lstat, path, buf);
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
                return SYSCALLS.doStat(nofollow ? FS.lstat : FS.stat, path, buf);
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
                var mode = varargs ? SYSCALLS.get() : 0;
                return FS.open(path, flags, mode).fd;
            } catch (e) {
                if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
                return -e.errno;
            }
        }
        function ___syscall_stat64(path, buf) {
            try {
                path = SYSCALLS.getStr(path);
                return SYSCALLS.doStat(FS.stat, path, buf);
            } catch (e) {
                if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
                return -e.errno;
            }
        }
        var __embind_register_bigint = (primitiveType, name, size, minRange, maxRange) => {};
        var embind_init_charCodes = () => {
            var codes = new Array(256);
            for (var i = 0; i < 256; ++i) {
                codes[i] = String.fromCharCode(i);
            }
            embind_charCodes = codes;
        };
        var embind_charCodes;
        var readLatin1String = (ptr) => {
            var ret = '';
            var c = ptr;
            while (HEAPU8[c]) {
                ret += embind_charCodes[HEAPU8[c++]];
            }
            return ret;
        };
        var awaitingDependencies = {};
        var registeredTypes = {};
        var typeDependencies = {};
        var BindingError;
        var throwBindingError = (message) => {
            throw new BindingError(message);
        };
        var InternalError;
        function sharedRegisterType(rawType, registeredInstance, options = {}) {
            var name = registeredInstance.name;
            if (!rawType) {
                throwBindingError(`type "${name}" must have a positive integer typeid pointer`);
            }
            if (registeredTypes.hasOwnProperty(rawType)) {
                if (options.ignoreDuplicateRegistrations) {
                    return;
                } else {
                    throwBindingError(`Cannot register type '${name}' twice`);
                }
            }
            registeredTypes[rawType] = registeredInstance;
            delete typeDependencies[rawType];
            if (awaitingDependencies.hasOwnProperty(rawType)) {
                var callbacks = awaitingDependencies[rawType];
                delete awaitingDependencies[rawType];
                callbacks.forEach((cb) => cb());
            }
        }
        function registerType(rawType, registeredInstance, options = {}) {
            if (!('argPackAdvance' in registeredInstance)) {
                throw new TypeError('registerType registeredInstance requires argPackAdvance');
            }
            return sharedRegisterType(rawType, registeredInstance, options);
        }
        var GenericWireTypeSize = 8;
        var __embind_register_bool = (rawType, name, trueValue, falseValue) => {
            name = readLatin1String(name);
            registerType(rawType, {
                name: name,
                fromWireType: function (wt) {
                    return !!wt;
                },
                toWireType: function (destructors, o) {
                    return o ? trueValue : falseValue;
                },
                argPackAdvance: GenericWireTypeSize,
                readValueFromPointer: function (pointer) {
                    return this['fromWireType'](HEAPU8[pointer]);
                },
                destructorFunction: null,
            });
        };
        function handleAllocatorInit() {
            Object.assign(HandleAllocator.prototype, {
                get(id) {
                    return this.allocated[id];
                },
                has(id) {
                    return this.allocated[id] !== undefined;
                },
                allocate(handle) {
                    var id = this.freelist.pop() || this.allocated.length;
                    this.allocated[id] = handle;
                    return id;
                },
                free(id) {
                    this.allocated[id] = undefined;
                    this.freelist.push(id);
                },
            });
        }
        function HandleAllocator() {
            this.allocated = [undefined];
            this.freelist = [];
        }
        var emval_handles = new HandleAllocator();
        var __emval_decref = (handle) => {
            if (handle >= emval_handles.reserved && 0 === --emval_handles.get(handle).refcount) {
                emval_handles.free(handle);
            }
        };
        var count_emval_handles = () => {
            var count = 0;
            for (var i = emval_handles.reserved; i < emval_handles.allocated.length; ++i) {
                if (emval_handles.allocated[i] !== undefined) {
                    ++count;
                }
            }
            return count;
        };
        var init_emval = () => {
            emval_handles.allocated.push({ value: undefined }, { value: null }, { value: true }, { value: false });
            emval_handles.reserved = emval_handles.allocated.length;
            Module['count_emval_handles'] = count_emval_handles;
        };
        var Emval = {
            toValue: (handle) => {
                if (!handle) {
                    throwBindingError('Cannot use deleted val. handle = ' + handle);
                }
                return emval_handles.get(handle).value;
            },
            toHandle: (value) => {
                switch (value) {
                    case undefined:
                        return 1;
                    case null:
                        return 2;
                    case true:
                        return 3;
                    case false:
                        return 4;
                    default: {
                        return emval_handles.allocate({ refcount: 1, value: value });
                    }
                }
            },
        };
        function simpleReadValueFromPointer(pointer) {
            return this['fromWireType'](HEAP32[pointer >> 2]);
        }
        var __embind_register_emval = (rawType, name) => {
            name = readLatin1String(name);
            registerType(rawType, {
                name: name,
                fromWireType: (handle) => {
                    var rv = Emval.toValue(handle);
                    __emval_decref(handle);
                    return rv;
                },
                toWireType: (destructors, value) => Emval.toHandle(value),
                argPackAdvance: GenericWireTypeSize,
                readValueFromPointer: simpleReadValueFromPointer,
                destructorFunction: null,
            });
        };
        var floatReadValueFromPointer = (name, width) => {
            switch (width) {
                case 4:
                    return function (pointer) {
                        return this['fromWireType'](HEAPF32[pointer >> 2]);
                    };
                case 8:
                    return function (pointer) {
                        return this['fromWireType'](HEAPF64[pointer >> 3]);
                    };
                default:
                    throw new TypeError(`invalid float width (${width}): ${name}`);
            }
        };
        var __embind_register_float = (rawType, name, size) => {
            name = readLatin1String(name);
            registerType(rawType, {
                name: name,
                fromWireType: (value) => value,
                toWireType: (destructors, value) => value,
                argPackAdvance: GenericWireTypeSize,
                readValueFromPointer: floatReadValueFromPointer(name, size),
                destructorFunction: null,
            });
        };
        var integerReadValueFromPointer = (name, width, signed) => {
            switch (width) {
                case 1:
                    return signed ? (pointer) => HEAP8[pointer >> 0] : (pointer) => HEAPU8[pointer >> 0];
                case 2:
                    return signed ? (pointer) => HEAP16[pointer >> 1] : (pointer) => HEAPU16[pointer >> 1];
                case 4:
                    return signed ? (pointer) => HEAP32[pointer >> 2] : (pointer) => HEAPU32[pointer >> 2];
                default:
                    throw new TypeError(`invalid integer width (${width}): ${name}`);
            }
        };
        var __embind_register_integer = (primitiveType, name, size, minRange, maxRange) => {
            name = readLatin1String(name);
            if (maxRange === -1) {
                maxRange = 4294967295;
            }
            var fromWireType = (value) => value;
            if (minRange === 0) {
                var bitshift = 32 - 8 * size;
                fromWireType = (value) => (value << bitshift) >>> bitshift;
            }
            var isUnsignedType = name.includes('unsigned');
            var checkAssertions = (value, toTypeName) => {};
            var toWireType;
            if (isUnsignedType) {
                toWireType = function (destructors, value) {
                    checkAssertions(value, this.name);
                    return value >>> 0;
                };
            } else {
                toWireType = function (destructors, value) {
                    checkAssertions(value, this.name);
                    return value;
                };
            }
            registerType(primitiveType, {
                name: name,
                fromWireType: fromWireType,
                toWireType: toWireType,
                argPackAdvance: GenericWireTypeSize,
                readValueFromPointer: integerReadValueFromPointer(name, size, minRange !== 0),
                destructorFunction: null,
            });
        };
        var __embind_register_memory_view = (rawType, dataTypeIndex, name) => {
            var typeMapping = [
                Int8Array,
                Uint8Array,
                Int16Array,
                Uint16Array,
                Int32Array,
                Uint32Array,
                Float32Array,
                Float64Array,
            ];
            var TA = typeMapping[dataTypeIndex];
            function decodeMemoryView(handle) {
                var size = HEAPU32[handle >> 2];
                var data = HEAPU32[(handle + 4) >> 2];
                return new TA(HEAP8.buffer, data, size);
            }
            name = readLatin1String(name);
            registerType(
                rawType,
                {
                    name: name,
                    fromWireType: decodeMemoryView,
                    argPackAdvance: GenericWireTypeSize,
                    readValueFromPointer: decodeMemoryView,
                },
                { ignoreDuplicateRegistrations: true }
            );
        };
        function readPointer(pointer) {
            return this['fromWireType'](HEAPU32[pointer >> 2]);
        }
        var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
        var __embind_register_std_string = (rawType, name) => {
            name = readLatin1String(name);
            var stdStringIsUTF8 = name === 'std::string';
            registerType(rawType, {
                name: name,
                fromWireType(value) {
                    var length = HEAPU32[value >> 2];
                    var payload = value + 4;
                    var str;
                    if (stdStringIsUTF8) {
                        var decodeStartPtr = payload;
                        for (var i = 0; i <= length; ++i) {
                            var currentBytePtr = payload + i;
                            if (i == length || HEAPU8[currentBytePtr] == 0) {
                                var maxRead = currentBytePtr - decodeStartPtr;
                                var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
                                if (str === undefined) {
                                    str = stringSegment;
                                } else {
                                    str += String.fromCharCode(0);
                                    str += stringSegment;
                                }
                                decodeStartPtr = currentBytePtr + 1;
                            }
                        }
                    } else {
                        var a = new Array(length);
                        for (var i = 0; i < length; ++i) {
                            a[i] = String.fromCharCode(HEAPU8[payload + i]);
                        }
                        str = a.join('');
                    }
                    _free(value);
                    return str;
                },
                toWireType(destructors, value) {
                    if (value instanceof ArrayBuffer) {
                        value = new Uint8Array(value);
                    }
                    var length;
                    var valueIsOfTypeString = typeof value == 'string';
                    if (
                        !(
                            valueIsOfTypeString ||
                            value instanceof Uint8Array ||
                            value instanceof Uint8ClampedArray ||
                            value instanceof Int8Array
                        )
                    ) {
                        throwBindingError('Cannot pass non-string to std::string');
                    }
                    if (stdStringIsUTF8 && valueIsOfTypeString) {
                        length = lengthBytesUTF8(value);
                    } else {
                        length = value.length;
                    }
                    var base = _malloc(4 + length + 1);
                    var ptr = base + 4;
                    HEAPU32[base >> 2] = length;
                    if (stdStringIsUTF8 && valueIsOfTypeString) {
                        stringToUTF8(value, ptr, length + 1);
                    } else {
                        if (valueIsOfTypeString) {
                            for (var i = 0; i < length; ++i) {
                                var charCode = value.charCodeAt(i);
                                if (charCode > 255) {
                                    _free(ptr);
                                    throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                                }
                                HEAPU8[ptr + i] = charCode;
                            }
                        } else {
                            for (var i = 0; i < length; ++i) {
                                HEAPU8[ptr + i] = value[i];
                            }
                        }
                    }
                    if (destructors !== null) {
                        destructors.push(_free, base);
                    }
                    return base;
                },
                argPackAdvance: GenericWireTypeSize,
                readValueFromPointer: readPointer,
                destructorFunction(ptr) {
                    _free(ptr);
                },
            });
        };
        var UTF16Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf-16le') : undefined;
        var UTF16ToString = (ptr, maxBytesToRead) => {
            var endPtr = ptr;
            var idx = endPtr >> 1;
            var maxIdx = idx + maxBytesToRead / 2;
            while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
            endPtr = idx << 1;
            if (endPtr - ptr > 32 && UTF16Decoder) return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
            var str = '';
            for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
                var codeUnit = HEAP16[(ptr + i * 2) >> 1];
                if (codeUnit == 0) break;
                str += String.fromCharCode(codeUnit);
            }
            return str;
        };
        var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
            maxBytesToWrite ??= 2147483647;
            if (maxBytesToWrite < 2) return 0;
            maxBytesToWrite -= 2;
            var startPtr = outPtr;
            var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
            for (var i = 0; i < numCharsToWrite; ++i) {
                var codeUnit = str.charCodeAt(i);
                HEAP16[outPtr >> 1] = codeUnit;
                outPtr += 2;
            }
            HEAP16[outPtr >> 1] = 0;
            return outPtr - startPtr;
        };
        var lengthBytesUTF16 = (str) => str.length * 2;
        var UTF32ToString = (ptr, maxBytesToRead) => {
            var i = 0;
            var str = '';
            while (!(i >= maxBytesToRead / 4)) {
                var utf32 = HEAP32[(ptr + i * 4) >> 2];
                if (utf32 == 0) break;
                ++i;
                if (utf32 >= 65536) {
                    var ch = utf32 - 65536;
                    str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
                } else {
                    str += String.fromCharCode(utf32);
                }
            }
            return str;
        };
        var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
            maxBytesToWrite ??= 2147483647;
            if (maxBytesToWrite < 4) return 0;
            var startPtr = outPtr;
            var endPtr = startPtr + maxBytesToWrite - 4;
            for (var i = 0; i < str.length; ++i) {
                var codeUnit = str.charCodeAt(i);
                if (codeUnit >= 55296 && codeUnit <= 57343) {
                    var trailSurrogate = str.charCodeAt(++i);
                    codeUnit = (65536 + ((codeUnit & 1023) << 10)) | (trailSurrogate & 1023);
                }
                HEAP32[outPtr >> 2] = codeUnit;
                outPtr += 4;
                if (outPtr + 4 > endPtr) break;
            }
            HEAP32[outPtr >> 2] = 0;
            return outPtr - startPtr;
        };
        var lengthBytesUTF32 = (str) => {
            var len = 0;
            for (var i = 0; i < str.length; ++i) {
                var codeUnit = str.charCodeAt(i);
                if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
                len += 4;
            }
            return len;
        };
        var __embind_register_std_wstring = (rawType, charSize, name) => {
            name = readLatin1String(name);
            var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
            if (charSize === 2) {
                decodeString = UTF16ToString;
                encodeString = stringToUTF16;
                lengthBytesUTF = lengthBytesUTF16;
                getHeap = () => HEAPU16;
                shift = 1;
            } else if (charSize === 4) {
                decodeString = UTF32ToString;
                encodeString = stringToUTF32;
                lengthBytesUTF = lengthBytesUTF32;
                getHeap = () => HEAPU32;
                shift = 2;
            }
            registerType(rawType, {
                name: name,
                fromWireType: (value) => {
                    var length = HEAPU32[value >> 2];
                    var HEAP = getHeap();
                    var str;
                    var decodeStartPtr = value + 4;
                    for (var i = 0; i <= length; ++i) {
                        var currentBytePtr = value + 4 + i * charSize;
                        if (i == length || HEAP[currentBytePtr >> shift] == 0) {
                            var maxReadBytes = currentBytePtr - decodeStartPtr;
                            var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
                            if (str === undefined) {
                                str = stringSegment;
                            } else {
                                str += String.fromCharCode(0);
                                str += stringSegment;
                            }
                            decodeStartPtr = currentBytePtr + charSize;
                        }
                    }
                    _free(value);
                    return str;
                },
                toWireType: (destructors, value) => {
                    if (!(typeof value == 'string')) {
                        throwBindingError(`Cannot pass non-string to C++ string type ${name}`);
                    }
                    var length = lengthBytesUTF(value);
                    var ptr = _malloc(4 + length + charSize);
                    HEAPU32[ptr >> 2] = length >> shift;
                    encodeString(value, ptr + 4, length + charSize);
                    if (destructors !== null) {
                        destructors.push(_free, ptr);
                    }
                    return ptr;
                },
                argPackAdvance: GenericWireTypeSize,
                readValueFromPointer: simpleReadValueFromPointer,
                destructorFunction(ptr) {
                    _free(ptr);
                },
            });
        };
        var __embind_register_void = (rawType, name) => {
            name = readLatin1String(name);
            registerType(rawType, {
                isVoid: true,
                name: name,
                argPackAdvance: 0,
                fromWireType: () => undefined,
                toWireType: (destructors, o) => undefined,
            });
        };
        var nowIsMonotonic = 1;
        var __emscripten_get_now_is_monotonic = () => nowIsMonotonic;
        var getTypeName = (type) => {
            var ptr = ___getTypeName(type);
            var rv = readLatin1String(ptr);
            _free(ptr);
            return rv;
        };
        var requireRegisteredType = (rawType, humanName) => {
            var impl = registeredTypes[rawType];
            if (undefined === impl) {
                throwBindingError(humanName + ' has unknown type ' + getTypeName(rawType));
            }
            return impl;
        };
        var emval_returnValue = (returnType, destructorsRef, handle) => {
            var destructors = [];
            var result = returnType['toWireType'](destructors, handle);
            if (destructors.length) {
                HEAPU32[destructorsRef >> 2] = Emval.toHandle(destructors);
            }
            return result;
        };
        var __emval_as = (handle, returnType, destructorsRef) => {
            handle = Emval.toValue(handle);
            returnType = requireRegisteredType(returnType, 'emval::as');
            return emval_returnValue(returnType, destructorsRef, handle);
        };
        var emval_symbols = {};
        var getStringOrSymbol = (address) => {
            var symbol = emval_symbols[address];
            if (symbol === undefined) {
                return readLatin1String(address);
            }
            return symbol;
        };
        var emval_get_global = () => {
            if (typeof globalThis == 'object') {
                return globalThis;
            }
            function testGlobal(obj) {
                obj['$$$embind_global$$$'] = obj;
                var success = typeof $$$embind_global$$$ == 'object' && obj['$$$embind_global$$$'] == obj;
                if (!success) {
                    delete obj['$$$embind_global$$$'];
                }
                return success;
            }
            if (typeof $$$embind_global$$$ == 'object') {
                return $$$embind_global$$$;
            }
            if (typeof global == 'object' && testGlobal(global)) {
                $$$embind_global$$$ = global;
            } else if (typeof self == 'object' && testGlobal(self)) {
                $$$embind_global$$$ = self;
            }
            if (typeof $$$embind_global$$$ == 'object') {
                return $$$embind_global$$$;
            }
            throw Error('unable to get global object.');
        };
        var __emval_get_global = (name) => {
            if (name === 0) {
                return Emval.toHandle(emval_get_global());
            } else {
                name = getStringOrSymbol(name);
                return Emval.toHandle(emval_get_global()[name]);
            }
        };
        var __emval_get_property = (handle, key) => {
            handle = Emval.toValue(handle);
            key = Emval.toValue(key);
            return Emval.toHandle(handle[key]);
        };
        var __emval_incref = (handle) => {
            if (handle > 4) {
                emval_handles.get(handle).refcount += 1;
            }
        };
        var __emval_instanceof = (object, constructor) => {
            object = Emval.toValue(object);
            constructor = Emval.toValue(constructor);
            return object instanceof constructor;
        };
        var __emval_new_cstring = (v) => Emval.toHandle(getStringOrSymbol(v));
        var runDestructors = (destructors) => {
            while (destructors.length) {
                var ptr = destructors.pop();
                var del = destructors.pop();
                del(ptr);
            }
        };
        var __emval_run_destructors = (handle) => {
            var destructors = Emval.toValue(handle);
            runDestructors(destructors);
            __emval_decref(handle);
        };
        var __emval_set_property = (handle, key, value) => {
            handle = Emval.toValue(handle);
            key = Emval.toValue(key);
            value = Emval.toValue(value);
            handle[key] = value;
        };
        var __emval_take_value = (type, arg) => {
            type = requireRegisteredType(type, '_emval_take_value');
            var v = type['readValueFromPointer'](arg);
            return Emval.toHandle(v);
        };
        var __emval_typeof = (handle) => {
            handle = Emval.toValue(handle);
            return Emval.toHandle(typeof handle);
        };
        var convertI32PairToI53Checked = (lo, hi) =>
            (hi + 2097152) >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
        function __gmtime_js(time_low, time_high, tmPtr) {
            var time = convertI32PairToI53Checked(time_low, time_high);
            var date = new Date(time * 1e3);
            HEAP32[tmPtr >> 2] = date.getUTCSeconds();
            HEAP32[(tmPtr + 4) >> 2] = date.getUTCMinutes();
            HEAP32[(tmPtr + 8) >> 2] = date.getUTCHours();
            HEAP32[(tmPtr + 12) >> 2] = date.getUTCDate();
            HEAP32[(tmPtr + 16) >> 2] = date.getUTCMonth();
            HEAP32[(tmPtr + 20) >> 2] = date.getUTCFullYear() - 1900;
            HEAP32[(tmPtr + 24) >> 2] = date.getUTCDay();
            var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
            var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
            HEAP32[(tmPtr + 28) >> 2] = yday;
        }
        var isLeapYear = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        var MONTH_DAYS_LEAP_CUMULATIVE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
        var MONTH_DAYS_REGULAR_CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        var ydayFromDate = (date) => {
            var leap = isLeapYear(date.getFullYear());
            var monthDaysCumulative = leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE;
            var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
            return yday;
        };
        function __localtime_js(time_low, time_high, tmPtr) {
            var time = convertI32PairToI53Checked(time_low, time_high);
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
            var dst =
                (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
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
                    setErrNo(61);
                    return -1;
                }
                return timeMs / 1e3;
            })();
            return (
                setTempRet0(
                    ((tempDouble = ret),
                    +Math.abs(tempDouble) >= 1
                        ? tempDouble > 0
                            ? +Math.floor(tempDouble / 4294967296) >>> 0
                            : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0
                        : 0)
                ),
                ret >>> 0
            );
        };
        function __mmap_js(len, prot, flags, fd, offset_low, offset_high, allocated, addr) {
            var offset = convertI32PairToI53Checked(offset_low, offset_high);
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
        function __munmap_js(addr, len, prot, flags, fd, offset_low, offset_high) {
            var offset = convertI32PairToI53Checked(offset_low, offset_high);
            try {
                if (isNaN(offset)) return 61;
                var stream = SYSCALLS.getStreamFromFD(fd);
                if (prot & 2) {
                    SYSCALLS.doMsync(addr, stream, len, flags, offset);
                }
                FS.munmap(stream);
            } catch (e) {
                if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
                return -e.errno;
            }
        }
        var stringToNewUTF8 = (str) => {
            var size = lengthBytesUTF8(str) + 1;
            var ret = _malloc(size);
            if (ret) stringToUTF8(str, ret, size);
            return ret;
        };
        var __tzset_js = (timezone, daylight, tzname) => {
            var currentYear = new Date().getFullYear();
            var winter = new Date(currentYear, 0, 1);
            var summer = new Date(currentYear, 6, 1);
            var winterOffset = winter.getTimezoneOffset();
            var summerOffset = summer.getTimezoneOffset();
            var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
            HEAPU32[timezone >> 2] = stdTimezoneOffset * 60;
            HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
            function extractZone(date) {
                var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
                return match ? match[1] : 'GMT';
            }
            var winterName = extractZone(winter);
            var summerName = extractZone(summer);
            var winterNamePtr = stringToNewUTF8(winterName);
            var summerNamePtr = stringToNewUTF8(summerName);
            if (summerOffset < winterOffset) {
                HEAPU32[tzname >> 2] = winterNamePtr;
                HEAPU32[(tzname + 4) >> 2] = summerNamePtr;
            } else {
                HEAPU32[tzname >> 2] = summerNamePtr;
                HEAPU32[(tzname + 4) >> 2] = winterNamePtr;
            }
        };
        var _abort = () => {
            abort('');
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
                    ch == 112 ? HEAPU32[buf >> 2] : ch == 105 ? HEAP32[buf >> 2] : HEAPF64[buf >> 3]
                );
                buf += wide ? 8 : 4;
            }
            return readEmAsmArgsArray;
        };
        var runEmAsmFunction = (code, sigPtr, argbuf) => {
            var args = readEmAsmArgs(sigPtr, argbuf);
            return ASM_CONSTS[code].apply(null, args);
        };
        var _emscripten_asm_const_int = (code, sigPtr, argbuf) => runEmAsmFunction(code, sigPtr, argbuf);
        var _emscripten_date_now = () => Date.now();
        var _emscripten_errn = (str, len) => err(UTF8ToString(str, len));
        var getHeapMax = () => 2147483648;
        var _emscripten_get_heap_max = () => getHeapMax();
        var _emscripten_memcpy_js = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);
        var _emscripten_outn = (str, len) => out(UTF8ToString(str, len));
        var _emscripten_pc_get_function = (pc) => {
            abort('Cannot use emscripten_pc_get_function without -sUSE_OFFSET_CONVERTER');
            return 0;
        };
        var growMemory = (size) => {
            var b = wasmMemory.buffer;
            var pages = (size - b.byteLength + 65535) / 65536;
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
            var alignUp = (x, multiple) => x + ((multiple - (x % multiple)) % multiple);
            for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
                var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
                overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
                var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
                var replacement = growMemory(newSize);
                if (replacement) {
                    return true;
                }
            }
            return false;
        };
        var convertFrameToPC = (frame) => {
            abort('Cannot use convertFrameToPC (needed by __builtin_return_address) without -sUSE_OFFSET_CONVERTER');
            return 0;
        };
        var UNWIND_CACHE = {};
        var saveInUnwindCache = (callstack) => {
            callstack.forEach((frame) => {
                var pc = convertFrameToPC(frame);
                if (pc) {
                    UNWIND_CACHE[pc] = frame;
                }
            });
        };
        function jsStackTrace() {
            var error = new Error();
            if (!error.stack) {
                try {
                    throw new Error();
                } catch (e) {
                    error = e;
                }
                if (!error.stack) {
                    return '(no stack trace available)';
                }
            }
            return error.stack.toString();
        }
        function _emscripten_stack_snapshot() {
            var callstack = jsStackTrace().split('\n');
            if (callstack[0] == 'Error') {
                callstack.shift();
            }
            saveInUnwindCache(callstack);
            UNWIND_CACHE.last_addr = convertFrameToPC(callstack[3]);
            UNWIND_CACHE.last_stack = callstack;
            return UNWIND_CACHE.last_addr;
        }
        var _emscripten_stack_unwind_buffer = (addr, buffer, count) => {
            var stack;
            if (UNWIND_CACHE.last_addr == addr) {
                stack = UNWIND_CACHE.last_stack;
            } else {
                stack = jsStackTrace().split('\n');
                if (stack[0] == 'Error') {
                    stack.shift();
                }
                saveInUnwindCache(stack);
            }
            var offset = 3;
            while (stack[offset] && convertFrameToPC(stack[offset]) != addr) {
                ++offset;
            }
            for (var i = 0; i < count && stack[i + offset]; ++i) {
                HEAP32[(buffer + i * 4) >> 2] = convertFrameToPC(stack[i + offset]);
            }
            return i;
        };
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
        var webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance = (ctx) =>
            !!(ctx.dibvbi = ctx.getExtension('WEBGL_draw_instanced_base_vertex_base_instance'));
        var webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance = (ctx) =>
            !!(ctx.mdibvbi = ctx.getExtension('WEBGL_multi_draw_instanced_base_vertex_base_instance'));
        var webgl_enable_WEBGL_multi_draw = (ctx) => !!(ctx.multiDrawWebgl = ctx.getExtension('WEBGL_multi_draw'));
        var GL = {
            counter: 1,
            buffers: [],
            mappedBuffers: {},
            programs: [],
            framebuffers: [],
            renderbuffers: [],
            textures: [],
            shaders: [],
            vaos: [],
            contexts: [],
            offscreenCanvases: {},
            queries: [],
            samplers: [],
            transformFeedbacks: [],
            syncs: [],
            byteSizeByTypeRoot: 5120,
            byteSizeByType: [1, 1, 2, 2, 4, 4, 4, 2, 3, 4, 8],
            stringCache: {},
            stringiCache: {},
            unpackAlignment: 4,
            recordError: function recordError(errorCode) {
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
            getTempVertexBuffer: function getTempVertexBuffer(sizeBytes) {
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
            getTempIndexBuffer: function getTempIndexBuffer(sizeBytes) {
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
            newRenderingFrameStarted: function newRenderingFrameStarted() {
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
                    var len = length ? HEAP32[(length + i * 4) >> 2] : -1;
                    source += UTF8ToString(HEAP32[(string + i * 4) >> 2], len < 0 ? undefined : len);
                }
                return source;
            },
            calcBufLength: function calcBufLength(size, type, stride, count) {
                if (stride > 0) {
                    return count * stride;
                }
                var typeSize = GL.byteSizeByType[type - GL.byteSizeByTypeRoot];
                return size * typeSize * count;
            },
            usedTempBuffers: [],
            preDrawHandleClientVertexAttribBindings: function preDrawHandleClientVertexAttribBindings(count) {
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
            postDrawHandleClientVertexAttribBindings: function postDrawHandleClientVertexAttribBindings() {
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
                var ctx =
                    webGLContextAttributes.majorVersion > 1
                        ? canvas.getContext('webgl2', webGLContextAttributes)
                        : canvas.getContext('webgl', webGLContextAttributes);
                if (!ctx) return 0;
                var handle = GL.registerContext(ctx, webGLContextAttributes);
                var _allSupportedExtensions = ctx.getSupportedExtensions;
                var supportedExtensionsForGetProcAddress = [
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
                    'EXT_color_buffer_float',
                    'EXT_disjoint_timer_query_webgl2',
                    'EXT_texture_norm16',
                    'WEBGL_clip_cull_distance',
                    'EXT_color_buffer_half_float',
                    'EXT_float_blend',
                    'EXT_texture_compression_bptc',
                    'EXT_texture_compression_rgtc',
                    'EXT_texture_filter_anisotropic',
                    'KHR_parallel_shader_compile',
                    'OES_texture_float_linear',
                    'WEBGL_compressed_texture_s3tc',
                    'WEBGL_compressed_texture_s3tc_srgb',
                    'WEBGL_debug_renderer_info',
                    'WEBGL_debug_shaders',
                    'WEBGL_lose_context',
                    'WEBGL_multi_draw',
                ];
                ctx.getSupportedExtensions = function () {
                    return (_allSupportedExtensions.apply(this) || []).filter((ext) =>
                        supportedExtensionsForGetProcAddress.includes(ext)
                    );
                };
                return handle;
            },
            registerContext: (ctx, webGLContextAttributes) => {
                var handle = GL.getNewId(GL.contexts);
                var context = {
                    handle: handle,
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
                Module.ctx = GLctx = GL.currentContext?.GLctx;
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
                webgl_enable_ANGLE_instanced_arrays(GLctx);
                webgl_enable_OES_vertex_array_object(GLctx);
                webgl_enable_WEBGL_draw_buffers(GLctx);
                webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(GLctx);
                webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(GLctx);
                if (context.version >= 2) {
                    GLctx.disjointTimerQueryExt = GLctx.getExtension('EXT_disjoint_timer_query_webgl2');
                }
                if (context.version < 2 || !GLctx.disjointTimerQueryExt) {
                    GLctx.disjointTimerQueryExt = GLctx.getExtension('EXT_disjoint_timer_query');
                }
                webgl_enable_WEBGL_multi_draw(GLctx);
                var exts = GLctx.getSupportedExtensions() || [];
                exts.forEach((ext) => {
                    if (!ext.includes('lose_context') && !ext.includes('debug')) {
                        GLctx.getExtension(ext);
                    }
                });
            },
            getExtensions() {
                var exts = GLctx.getSupportedExtensions() || [];
                exts = exts.concat(exts.map((e) => 'GL_' + e));
                return exts;
            },
        };
        var withStackSave = (f) => {
            var stack = stackSave();
            var ret = f();
            stackRestore(stack);
            return ret;
        };
        var JSEvents = {
            inEventHandler: 0,
            removeAllEventListeners() {
                for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
                    JSEvents._removeHandler(i);
                }
                JSEvents.eventHandlers = [];
                JSEvents.deferredCalls = [];
            },
            registerRemoveEventListeners() {
                if (!JSEvents.removeEventListenersRegistered) {
                    __ATEXIT__.push(JSEvents.removeAllEventListeners);
                    JSEvents.removeEventListenersRegistered = true;
                }
            },
            deferredCalls: [],
            deferCall(targetFunction, precedence, argsList) {
                function arraysHaveEqualContent(arrA, arrB) {
                    if (arrA.length != arrB.length) return false;
                    for (var i in arrA) {
                        if (arrA[i] != arrB[i]) return false;
                    }
                    return true;
                }
                for (var i in JSEvents.deferredCalls) {
                    var call = JSEvents.deferredCalls[i];
                    if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
                        return;
                    }
                }
                JSEvents.deferredCalls.push({
                    targetFunction: targetFunction,
                    precedence: precedence,
                    argsList: argsList,
                });
                JSEvents.deferredCalls.sort((x, y) => x.precedence < y.precedence);
            },
            removeDeferredCalls(targetFunction) {
                for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
                    if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
                        JSEvents.deferredCalls.splice(i, 1);
                        --i;
                    }
                }
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
                for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
                    var call = JSEvents.deferredCalls[i];
                    JSEvents.deferredCalls.splice(i, 1);
                    --i;
                    call.targetFunction.apply(null, call.argsList);
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
                var jsEventHandler = function jsEventHandler(event) {
                    ++JSEvents.inEventHandler;
                    JSEvents.currentEventHandler = eventHandler;
                    JSEvents.runDeferredCalls();
                    eventHandler.handlerFunc(event);
                    JSEvents.runDeferredCalls();
                    --JSEvents.inEventHandler;
                };
                if (eventHandler.callbackfunc) {
                    eventHandler.eventListenerFunc = jsEventHandler;
                    eventHandler.target.addEventListener(
                        eventHandler.eventTypeString,
                        jsEventHandler,
                        eventHandler.useCapture
                    );
                    JSEvents.eventHandlers.push(eventHandler);
                    JSEvents.registerRemoveEventListeners();
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
        var emscripten_webgl_power_preferences = ['default', 'low-power', 'high-performance'];
        var specialHTMLTargets = [
            0,
            typeof document != 'undefined' ? document : 0,
            typeof window != 'undefined' ? window : 0,
        ];
        var findEventTarget = (target) => {
            try {
                if (!target) return window;
                if (typeof target == 'number') target = specialHTMLTargets[target] || UTF8ToString(target);
                if (target === '#window') return window;
                else if (target === '#document') return document;
                else if (target === '#screen') return screen;
                else if (target === '#canvas') return Module['canvas'];
                return typeof target == 'string' ? document.getElementById(target) : target;
            } catch (e) {
                return null;
            }
        };
        var findCanvasEventTarget = (target) => {
            if (typeof target == 'number') target = UTF8ToString(target);
            if (!target || target === '#canvas') {
                if (typeof GL != 'undefined' && GL.offscreenCanvases['canvas']) return GL.offscreenCanvases['canvas'];
                return Module['canvas'];
            }
            if (typeof GL != 'undefined' && GL.offscreenCanvases[target]) return GL.offscreenCanvases[target];
            return findEventTarget(target);
        };
        var _emscripten_webgl_do_create_context = (target, attributes) => {
            var a = attributes >> 2;
            var powerPreference = HEAP32[a + (24 >> 2)];
            var contextAttributes = {
                alpha: !!HEAP32[a + (0 >> 2)],
                depth: !!HEAP32[a + (4 >> 2)],
                stencil: !!HEAP32[a + (8 >> 2)],
                antialias: !!HEAP32[a + (12 >> 2)],
                premultipliedAlpha: !!HEAP32[a + (16 >> 2)],
                preserveDrawingBuffer: !!HEAP32[a + (20 >> 2)],
                powerPreference: emscripten_webgl_power_preferences[powerPreference],
                failIfMajorPerformanceCaveat: !!HEAP32[a + (28 >> 2)],
                majorVersion: HEAP32[a + (32 >> 2)],
                minorVersion: HEAP32[a + (36 >> 2)],
                enableExtensionsByDefault: HEAP32[a + (40 >> 2)],
                explicitSwapControl: HEAP32[a + (44 >> 2)],
                proxyContextToMainThread: HEAP32[a + (48 >> 2)],
                renderViaOffscreenBackBuffer: HEAP32[a + (52 >> 2)],
            };
            var canvas = findCanvasEventTarget(target);
            if (!canvas) {
                return 0;
            }
            if (contextAttributes.explicitSwapControl) {
                return 0;
            }
            var contextHandle = GL.createContext(canvas, contextAttributes);
            return contextHandle;
        };
        var _emscripten_webgl_create_context = _emscripten_webgl_do_create_context;
        var _emscripten_webgl_destroy_context = (contextHandle) => {
            if (GL.currentContext == contextHandle) GL.currentContext = 0;
            GL.deleteContext(contextHandle);
        };
        var _emscripten_webgl_get_context_attributes = (c, a) => {
            if (!a) return -5;
            c = GL.contexts[c];
            if (!c) return -3;
            var t = c.GLctx;
            if (!t) return -3;
            t = t.getContextAttributes();
            HEAP32[a >> 2] = t.alpha;
            HEAP32[(a + 4) >> 2] = t.depth;
            HEAP32[(a + 8) >> 2] = t.stencil;
            HEAP32[(a + 12) >> 2] = t.antialias;
            HEAP32[(a + 16) >> 2] = t.premultipliedAlpha;
            HEAP32[(a + 20) >> 2] = t.preserveDrawingBuffer;
            var power = t['powerPreference'] && emscripten_webgl_power_preferences.indexOf(t['powerPreference']);
            HEAP32[(a + 24) >> 2] = power;
            HEAP32[(a + 28) >> 2] = t.failIfMajorPerformanceCaveat;
            HEAP32[(a + 32) >> 2] = c.version;
            HEAP32[(a + 36) >> 2] = 0;
            HEAP32[(a + 40) >> 2] = c.attributes.enableExtensionsByDefault;
            return 0;
        };
        var _emscripten_webgl_do_get_current_context = () => (GL.currentContext ? GL.currentContext.handle : 0);
        var _emscripten_webgl_get_current_context = _emscripten_webgl_do_get_current_context;
        var _emscripten_webgl_init_context_attributes = (attributes) => {
            var a = attributes >> 2;
            for (var i = 0; i < 56 >> 2; ++i) {
                HEAP32[a + i] = 0;
            }
            HEAP32[a + (0 >> 2)] =
                HEAP32[a + (4 >> 2)] =
                HEAP32[a + (12 >> 2)] =
                HEAP32[a + (16 >> 2)] =
                HEAP32[a + (32 >> 2)] =
                HEAP32[a + (40 >> 2)] =
                    1;
        };
        var _emscripten_webgl_make_context_current = (contextHandle) => {
            var success = GL.makeContextCurrent(contextHandle);
            return success ? 0 : -5;
        };
        var stringToUTF8OnStack = (str) => {
            var size = lengthBytesUTF8(str) + 1;
            var ret = stackAlloc(size);
            stringToUTF8(str, ret, size);
            return ret;
        };
        var wasmTableMirror = [];
        var wasmTable;
        var getWasmTableEntry = (funcPtr) => {
            var func = wasmTableMirror[funcPtr];
            if (!func) {
                if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
                wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
            }
            return func;
        };
        var WebGPU = {
            errorCallback: (callback, type, message, userdata) => {
                withStackSave(() => {
                    var messagePtr = stringToUTF8OnStack(message);
                    getWasmTableEntry(callback)(type, messagePtr, userdata);
                });
            },
            initManagers: () => {
                if (WebGPU.mgrDevice) return;
                function Manager() {
                    this.objects = {};
                    this.nextId = 1;
                    this.create = function (object, wrapper = {}) {
                        var id = this.nextId++;
                        wrapper.refcount = 1;
                        wrapper.object = object;
                        this.objects[id] = wrapper;
                        return id;
                    };
                    this.get = function (id) {
                        if (!id) return undefined;
                        var o = this.objects[id];
                        return o.object;
                    };
                    this.reference = function (id) {
                        var o = this.objects[id];
                        o.refcount++;
                    };
                    this.release = function (id) {
                        var o = this.objects[id];
                        o.refcount--;
                        if (o.refcount <= 0) {
                            delete this.objects[id];
                        }
                    };
                }
                WebGPU.mgrSurface = WebGPU.mgrSurface || new Manager();
                WebGPU.mgrSwapChain = WebGPU.mgrSwapChain || new Manager();
                WebGPU.mgrAdapter = WebGPU.mgrAdapter || new Manager();
                WebGPU.mgrDevice = WebGPU.mgrDevice || new Manager();
                WebGPU.mgrQueue = WebGPU.mgrQueue || new Manager();
                WebGPU.mgrCommandBuffer = WebGPU.mgrCommandBuffer || new Manager();
                WebGPU.mgrCommandEncoder = WebGPU.mgrCommandEncoder || new Manager();
                WebGPU.mgrRenderPassEncoder = WebGPU.mgrRenderPassEncoder || new Manager();
                WebGPU.mgrComputePassEncoder = WebGPU.mgrComputePassEncoder || new Manager();
                WebGPU.mgrBindGroup = WebGPU.mgrBindGroup || new Manager();
                WebGPU.mgrBuffer = WebGPU.mgrBuffer || new Manager();
                WebGPU.mgrSampler = WebGPU.mgrSampler || new Manager();
                WebGPU.mgrTexture = WebGPU.mgrTexture || new Manager();
                WebGPU.mgrTextureView = WebGPU.mgrTextureView || new Manager();
                WebGPU.mgrQuerySet = WebGPU.mgrQuerySet || new Manager();
                WebGPU.mgrBindGroupLayout = WebGPU.mgrBindGroupLayout || new Manager();
                WebGPU.mgrPipelineLayout = WebGPU.mgrPipelineLayout || new Manager();
                WebGPU.mgrRenderPipeline = WebGPU.mgrRenderPipeline || new Manager();
                WebGPU.mgrComputePipeline = WebGPU.mgrComputePipeline || new Manager();
                WebGPU.mgrShaderModule = WebGPU.mgrShaderModule || new Manager();
                WebGPU.mgrRenderBundleEncoder = WebGPU.mgrRenderBundleEncoder || new Manager();
                WebGPU.mgrRenderBundle = WebGPU.mgrRenderBundle || new Manager();
            },
            makeColor: (ptr) => ({
                r: HEAPF64[ptr >> 3],
                g: HEAPF64[(ptr + 8) >> 3],
                b: HEAPF64[(ptr + 16) >> 3],
                a: HEAPF64[(ptr + 24) >> 3],
            }),
            makeExtent3D: (ptr) => ({
                width: HEAPU32[ptr >> 2],
                height: HEAPU32[(ptr + 4) >> 2],
                depthOrArrayLayers: HEAPU32[(ptr + 8) >> 2],
            }),
            makeOrigin3D: (ptr) => ({ x: HEAPU32[ptr >> 2], y: HEAPU32[(ptr + 4) >> 2], z: HEAPU32[(ptr + 8) >> 2] }),
            makeImageCopyTexture: (ptr) => ({
                texture: WebGPU.mgrTexture.get(HEAPU32[(ptr + 4) >> 2]),
                mipLevel: HEAPU32[(ptr + 8) >> 2],
                origin: WebGPU.makeOrigin3D(ptr + 12),
                aspect: WebGPU.TextureAspect[HEAPU32[(ptr + 24) >> 2]],
            }),
            makeTextureDataLayout: (ptr) => {
                var bytesPerRow = HEAPU32[(ptr + 16) >> 2];
                var rowsPerImage = HEAPU32[(ptr + 20) >> 2];
                return {
                    offset: HEAPU32[(ptr + 4 + 8) >> 2] * 4294967296 + HEAPU32[(ptr + 8) >> 2],
                    bytesPerRow: bytesPerRow === 4294967295 ? undefined : bytesPerRow,
                    rowsPerImage: rowsPerImage === 4294967295 ? undefined : rowsPerImage,
                };
            },
            makeImageCopyBuffer: (ptr) => {
                var layoutPtr = ptr + 8;
                var bufferCopyView = WebGPU.makeTextureDataLayout(layoutPtr);
                bufferCopyView['buffer'] = WebGPU.mgrBuffer.get(HEAPU32[(ptr + 32) >> 2]);
                return bufferCopyView;
            },
            makePipelineConstants: (constantCount, constantsPtr) => {
                if (!constantCount) return;
                var constants = {};
                for (var i = 0; i < constantCount; ++i) {
                    var entryPtr = constantsPtr + 16 * i;
                    var key = UTF8ToString(HEAPU32[(entryPtr + 4) >> 2]);
                    constants[key] = HEAPF64[(entryPtr + 8) >> 3];
                }
                return constants;
            },
            makePipelineLayout: (layoutPtr) => {
                if (!layoutPtr) return 'auto';
                return WebGPU.mgrPipelineLayout.get(layoutPtr);
            },
            makeProgrammableStageDescriptor: (ptr) => {
                if (!ptr) return undefined;
                var desc = {
                    module: WebGPU.mgrShaderModule.get(HEAPU32[(ptr + 4) >> 2]),
                    constants: WebGPU.makePipelineConstants(HEAPU32[(ptr + 12) >> 2], HEAPU32[(ptr + 16) >> 2]),
                };
                var entryPointPtr = HEAPU32[(ptr + 8) >> 2];
                if (entryPointPtr) desc['entryPoint'] = UTF8ToString(entryPointPtr);
                return desc;
            },
            BufferMapState: ['unmapped', 'pending', 'mapped'],
            CompilationMessageType: ['error', 'warning', 'info'],
            DeviceLostReason: { undefined: 0, destroyed: 1 },
            PreferredFormat: { rgba8unorm: 18, bgra8unorm: 23 },
            AddressMode: ['repeat', 'mirror-repeat', 'clamp-to-edge'],
            BlendFactor: [
                'zero',
                'one',
                'src',
                'one-minus-src',
                'src-alpha',
                'one-minus-src-alpha',
                'dst',
                'one-minus-dst',
                'dst-alpha',
                'one-minus-dst-alpha',
                'src-alpha-saturated',
                'constant',
                'one-minus-constant',
            ],
            BlendOperation: ['add', 'subtract', 'reverse-subtract', 'min', 'max'],
            BufferBindingType: [, 'uniform', 'storage', 'read-only-storage'],
            CompareFunction: [
                ,
                'never',
                'less',
                'less-equal',
                'greater',
                'greater-equal',
                'equal',
                'not-equal',
                'always',
            ],
            CompilationInfoRequestStatus: ['success', 'error', 'device-lost', 'unknown'],
            CullMode: ['none', 'front', 'back'],
            ErrorFilter: ['validation', 'out-of-memory', 'internal'],
            FeatureName: [
                ,
                'depth-clip-control',
                'depth32float-stencil8',
                'timestamp-query',
                'texture-compression-bc',
                'texture-compression-etc2',
                'texture-compression-astc',
                'indirect-first-instance',
                'shader-f16',
                'rg11b10ufloat-renderable',
                'bgra8unorm-storage',
                'float32filterable',
            ],
            FilterMode: ['nearest', 'linear'],
            FrontFace: ['ccw', 'cw'],
            IndexFormat: [, 'uint16', 'uint32'],
            LoadOp: [, 'clear', 'load'],
            MipmapFilterMode: ['nearest', 'linear'],
            PowerPreference: [, 'low-power', 'high-performance'],
            PrimitiveTopology: ['point-list', 'line-list', 'line-strip', 'triangle-list', 'triangle-strip'],
            QueryType: ['occlusion', 'timestamp'],
            SamplerBindingType: [, 'filtering', 'non-filtering', 'comparison'],
            StencilOperation: [
                'keep',
                'zero',
                'replace',
                'invert',
                'increment-clamp',
                'decrement-clamp',
                'increment-wrap',
                'decrement-wrap',
            ],
            StorageTextureAccess: [, 'write-only'],
            StoreOp: [, 'store', 'discard'],
            TextureAspect: ['all', 'stencil-only', 'depth-only'],
            TextureDimension: ['1d', '2d', '3d'],
            TextureFormat: [
                ,
                'r8unorm',
                'r8snorm',
                'r8uint',
                'r8sint',
                'r16uint',
                'r16sint',
                'r16float',
                'rg8unorm',
                'rg8snorm',
                'rg8uint',
                'rg8sint',
                'r32float',
                'r32uint',
                'r32sint',
                'rg16uint',
                'rg16sint',
                'rg16float',
                'rgba8unorm',
                'rgba8unorm-srgb',
                'rgba8snorm',
                'rgba8uint',
                'rgba8sint',
                'bgra8unorm',
                'bgra8unorm-srgb',
                'rgb10a2unorm',
                'rg11b10ufloat',
                'rgb9e5ufloat',
                'rg32float',
                'rg32uint',
                'rg32sint',
                'rgba16uint',
                'rgba16sint',
                'rgba16float',
                'rgba32float',
                'rgba32uint',
                'rgba32sint',
                'stencil8',
                'depth16unorm',
                'depth24plus',
                'depth24plus-stencil8',
                'depth32float',
                'depth32float-stencil8',
                'bc1-rgba-unorm',
                'bc1-rgba-unorm-srgb',
                'bc2-rgba-unorm',
                'bc2-rgba-unorm-srgb',
                'bc3-rgba-unorm',
                'bc3-rgba-unorm-srgb',
                'bc4-r-unorm',
                'bc4-r-snorm',
                'bc5-rg-unorm',
                'bc5-rg-snorm',
                'bc6h-rgb-ufloat',
                'bc6h-rgb-float',
                'bc7-rgba-unorm',
                'bc7-rgba-unorm-srgb',
                'etc2-rgb8unorm',
                'etc2-rgb8unorm-srgb',
                'etc2-rgb8a1unorm',
                'etc2-rgb8a1unorm-srgb',
                'etc2-rgba8unorm',
                'etc2-rgba8unorm-srgb',
                'eac-r11unorm',
                'eac-r11snorm',
                'eac-rg11unorm',
                'eac-rg11snorm',
                'astc-4x4-unorm',
                'astc-4x4-unorm-srgb',
                'astc-5x4-unorm',
                'astc-5x4-unorm-srgb',
                'astc-5x5-unorm',
                'astc-5x5-unorm-srgb',
                'astc-6x5-unorm',
                'astc-6x5-unorm-srgb',
                'astc-6x6-unorm',
                'astc-6x6-unorm-srgb',
                'astc-8x5-unorm',
                'astc-8x5-unorm-srgb',
                'astc-8x6-unorm',
                'astc-8x6-unorm-srgb',
                'astc-8x8-unorm',
                'astc-8x8-unorm-srgb',
                'astc-10x5-unorm',
                'astc-10x5-unorm-srgb',
                'astc-10x6-unorm',
                'astc-10x6-unorm-srgb',
                'astc-10x8-unorm',
                'astc-10x8-unorm-srgb',
                'astc-10x10-unorm',
                'astc-10x10-unorm-srgb',
                'astc-12x10-unorm',
                'astc-12x10-unorm-srgb',
                'astc-12x12-unorm',
                'astc-12x12-unorm-srgb',
            ],
            TextureSampleType: [, 'float', 'unfilterable-float', 'depth', 'sint', 'uint'],
            TextureViewDimension: [, '1d', '2d', '2d-array', 'cube', 'cube-array', '3d'],
            VertexFormat: [
                ,
                'uint8x2',
                'uint8x4',
                'sint8x2',
                'sint8x4',
                'unorm8x2',
                'unorm8x4',
                'snorm8x2',
                'snorm8x4',
                'uint16x2',
                'uint16x4',
                'sint16x2',
                'sint16x4',
                'unorm16x2',
                'unorm16x4',
                'snorm16x2',
                'snorm16x4',
                'float16x2',
                'float16x4',
                'float32',
                'float32x2',
                'float32x3',
                'float32x4',
                'uint32',
                'uint32x2',
                'uint32x3',
                'uint32x4',
                'sint32',
                'sint32x2',
                'sint32x3',
                'sint32x4',
            ],
            VertexStepMode: ['vertex', 'instance'],
            FeatureNameString2Enum: {
                undefined: '0',
                'depth-clip-control': '1',
                'depth32float-stencil8': '2',
                'timestamp-query': '3',
                'texture-compression-bc': '4',
                'texture-compression-etc2': '5',
                'texture-compression-astc': '6',
                'indirect-first-instance': '7',
                'shader-f16': '8',
                'rg11b10ufloat-renderable': '9',
                'bgra8unorm-storage': '10',
                float32filterable: '11',
            },
        };
        var JsValStore = {
            values: {},
            next_id: 1,
            add(js_val) {
                var id;
                do {
                    id = JsValStore.next_id++;
                    if (JsValStore.next_id > 2147483647) JsValStore.next_id = 1;
                } while (id in JsValStore.values);
                JsValStore.values[id] = js_val;
                return id;
            },
            remove(id) {
                delete JsValStore.values[id];
            },
            get(id) {
                return JsValStore.values[id];
            },
        };
        var _emscripten_webgpu_export_bind_group_layout = (handle) =>
            JsValStore.add(WebGPU.mgrBindGroupLayout.get(handle));
        var _emscripten_webgpu_export_device = (handle) => JsValStore.add(WebGPU.mgrDevice.get(handle));
        var _emscripten_webgpu_export_sampler = (handle) => JsValStore.add(WebGPU.mgrSampler.get(handle));
        var _emscripten_webgpu_export_texture = (handle) => JsValStore.add(WebGPU.mgrTexture.get(handle));
        var _emscripten_webgpu_get_device = () => {
            if (WebGPU.preinitializedDeviceId === undefined) {
                var device = Module['preinitializedWebGPUDevice'];
                var deviceWrapper = { queueId: WebGPU.mgrQueue.create(device['queue']) };
                WebGPU.preinitializedDeviceId = WebGPU.mgrDevice.create(device, deviceWrapper);
            }
            WebGPU.mgrDevice.reference(WebGPU.preinitializedDeviceId);
            return WebGPU.preinitializedDeviceId;
        };
        var _emscripten_webgpu_import_bind_group = (handle) => WebGPU.mgrBindGroup.create(JsValStore.get(handle));
        var _emscripten_webgpu_import_texture = (handle) => WebGPU.mgrTexture.create(JsValStore.get(handle));
        var _emscripten_webgpu_release_js_handle = (id) => JsValStore.remove(id);
        var ENV = {};
        var getExecutableName = () => thisProgram || './this.program';
        var getEnvStrings = () => {
            if (!getEnvStrings.strings) {
                var lang =
                    ((typeof navigator == 'object' && navigator.languages && navigator.languages[0]) || 'C').replace(
                        '-',
                        '_'
                    ) + '.UTF-8';
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
                HEAP8[buffer++ >> 0] = str.charCodeAt(i);
            }
            HEAP8[buffer >> 0] = 0;
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
                if (typeof offset !== 'undefined') {
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
        function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
            var offset = convertI32PairToI53Checked(offset_low, offset_high);
            try {
                if (isNaN(offset)) return 61;
                var stream = SYSCALLS.getStreamFromFD(fd);
                FS.llseek(stream, offset, whence);
                ((tempI64 = [
                    stream.position >>> 0,
                    ((tempDouble = stream.position),
                    +Math.abs(tempDouble) >= 1
                        ? tempDouble > 0
                            ? +Math.floor(tempDouble / 4294967296) >>> 0
                            : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0
                        : 0),
                ]),
                    (HEAP32[newOffset >> 2] = tempI64[0]),
                    (HEAP32[(newOffset + 4) >> 2] = tempI64[1]));
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
                if (typeof offset !== 'undefined') {
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
        var _getentropy = (buffer, size) => {
            randomFill(HEAPU8.subarray(buffer, buffer + size));
            return 0;
        };
        function _glActiveTexture(x0) {
            GLctx.activeTexture(x0);
        }
        var _glAttachShader = (program, shader) => {
            GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
        };
        var _glBindAttribLocation = (program, index, name) => {
            GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
        };
        var _glBindBuffer = (target, buffer) => {
            if (target == 34962) {
                GLctx.currentArrayBufferBinding = buffer;
            } else if (target == 34963) {
                GLctx.currentElementArrayBufferBinding = buffer;
            }
            if (target == 35051) {
                GLctx.currentPixelPackBufferBinding = buffer;
            } else if (target == 35052) {
                GLctx.currentPixelUnpackBufferBinding = buffer;
            }
            GLctx.bindBuffer(target, GL.buffers[buffer]);
        };
        var _glBindBufferBase = (target, index, buffer) => {
            GLctx.bindBufferBase(target, index, GL.buffers[buffer]);
        };
        var _glBindFramebuffer = (target, framebuffer) => {
            GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
        };
        var _glBindTexture = (target, texture) => {
            GLctx.bindTexture(target, GL.textures[texture]);
        };
        var _glBindVertexArray = (vao) => {
            GLctx.bindVertexArray(GL.vaos[vao]);
            var ibo = GLctx.getParameter(34965);
            GLctx.currentElementArrayBufferBinding = ibo ? ibo.name | 0 : 0;
        };
        function _glBlendEquation(x0) {
            GLctx.blendEquation(x0);
        }
        function _glBlendFunc(x0, x1) {
            GLctx.blendFunc(x0, x1);
        }
        var _glBufferData = (target, size, data, usage) => {
            if (GL.currentContext.version >= 2) {
                if (data && size) {
                    GLctx.bufferData(target, HEAPU8, usage, data, size);
                } else {
                    GLctx.bufferData(target, size, usage);
                }
            } else {
                GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage);
            }
        };
        function _glClear(x0) {
            GLctx.clear(x0);
        }
        function _glClearColor(x0, x1, x2, x3) {
            GLctx.clearColor(x0, x1, x2, x3);
        }
        var convertI32PairToI53 = (lo, hi) => (lo >>> 0) + hi * 4294967296;
        var _glClientWaitSync = (sync, flags, timeout_low, timeout_high) => {
            var timeout = convertI32PairToI53(timeout_low, timeout_high);
            return GLctx.clientWaitSync(GL.syncs[sync], flags, timeout);
        };
        var _glCompileShader = (shader) => {
            GLctx.compileShader(GL.shaders[shader]);
        };
        var _glCreateProgram = () => {
            var id = GL.getNewId(GL.programs);
            var program = GLctx.createProgram();
            program.name = id;
            program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
            program.uniformIdCounter = 1;
            GL.programs[id] = program;
            return id;
        };
        var _glCreateShader = (shaderType) => {
            var id = GL.getNewId(GL.shaders);
            GL.shaders[id] = GLctx.createShader(shaderType);
            return id;
        };
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
                if (id == GLctx.currentPixelPackBufferBinding) GLctx.currentPixelPackBufferBinding = 0;
                if (id == GLctx.currentPixelUnpackBufferBinding) GLctx.currentPixelUnpackBufferBinding = 0;
            }
        };
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
        var _glDeleteSync = (id) => {
            if (!id) return;
            var sync = GL.syncs[id];
            if (!sync) {
                GL.recordError(1281);
                return;
            }
            GLctx.deleteSync(sync);
            sync.name = 0;
            GL.syncs[id] = null;
        };
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
        var _glDeleteVertexArrays = (n, vaos) => {
            for (var i = 0; i < n; i++) {
                var id = HEAP32[(vaos + i * 4) >> 2];
                GLctx.deleteVertexArray(GL.vaos[id]);
                GL.vaos[id] = null;
            }
        };
        var _glDetachShader = (program, shader) => {
            GLctx.detachShader(GL.programs[program], GL.shaders[shader]);
        };
        function _glDisable(x0) {
            GLctx.disable(x0);
        }
        var _glDisableVertexAttribArray = (index) => {
            var cb = GL.currentContext.clientBuffers[index];
            cb.enabled = false;
            GLctx.disableVertexAttribArray(index);
        };
        var _glDrawArrays = (mode, first, count) => {
            GL.preDrawHandleClientVertexAttribBindings(first + count);
            GLctx.drawArrays(mode, first, count);
            GL.postDrawHandleClientVertexAttribBindings();
        };
        var tempFixedLengthArray = [];
        var _glDrawBuffers = (n, bufs) => {
            var bufArray = tempFixedLengthArray[n];
            for (var i = 0; i < n; i++) {
                bufArray[i] = HEAP32[(bufs + i * 4) >> 2];
            }
            GLctx.drawBuffers(bufArray);
        };
        function _glEnable(x0) {
            GLctx.enable(x0);
        }
        var _glEnableVertexAttribArray = (index) => {
            var cb = GL.currentContext.clientBuffers[index];
            cb.enabled = true;
            GLctx.enableVertexAttribArray(index);
        };
        var _glFenceSync = (condition, flags) => {
            var sync = GLctx.fenceSync(condition, flags);
            if (sync) {
                var id = GL.getNewId(GL.syncs);
                sync.name = id;
                GL.syncs[id] = sync;
                return id;
            }
            return 0;
        };
        function _glFinish() {
            GLctx.finish();
        }
        function _glFlush() {
            GLctx.flush();
        }
        var _glFramebufferTexture2D = (target, attachment, textarget, texture, level) => {
            GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level);
        };
        var _glFramebufferTextureLayer = (target, attachment, texture, level, layer) => {
            GLctx.framebufferTextureLayer(target, attachment, GL.textures[texture], level, layer);
        };
        var __glGenObject = (n, buffers, createFunction, objectTable) => {
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
        };
        var _glGenBuffers = (n, buffers) => {
            __glGenObject(n, buffers, 'createBuffer', GL.buffers);
        };
        var _glGenFramebuffers = (n, ids) => {
            __glGenObject(n, ids, 'createFramebuffer', GL.framebuffers);
        };
        var _glGenTextures = (n, textures) => {
            __glGenObject(n, textures, 'createTexture', GL.textures);
        };
        function _glGenVertexArrays(n, arrays) {
            __glGenObject(n, arrays, 'createVertexArray', GL.vaos);
        }
        var _glGetAttribLocation = (program, name) => GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
        var _glGetError = () => {
            var error = GLctx.getError() || GL.lastError;
            GL.lastError = 0;
            return error;
        };
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
                case 34814:
                case 36345:
                    ret = 0;
                    break;
                case 34466:
                    var formats = GLctx.getParameter(34467);
                    ret = formats ? formats.length : 0;
                    break;
                case 33309:
                    if (GL.currentContext.version < 2) {
                        GL.recordError(1282);
                        return;
                    }
                    var exts = GLctx.getSupportedExtensions() || [];
                    ret = 2 * exts.length;
                    break;
                case 33307:
                case 33308:
                    if (GL.currentContext.version < 2) {
                        GL.recordError(1280);
                        return;
                    }
                    ret = name_ == 33307 ? 3 : 0;
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
                                case 36662:
                                case 36663:
                                case 35053:
                                case 35055:
                                case 36010:
                                case 35097:
                                case 35869:
                                case 32874:
                                case 36389:
                                case 35983:
                                case 35368:
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
                                        HEAP8[(p + i) >> 0] = result[i] ? 1 : 0;
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
                    HEAP8[p >> 0] = ret ? 1 : 0;
                    break;
            }
        };
        var _glGetIntegerv = (name_, p) => emscriptenWebGLGet(name_, p, 0);
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
                    for (var i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
                        program.maxUniformLength = Math.max(
                            program.maxUniformLength,
                            GLctx.getActiveUniform(program, i).name.length + 1
                        );
                    }
                }
                HEAP32[p >> 2] = program.maxUniformLength;
            } else if (pname == 35722) {
                if (!program.maxAttributeLength) {
                    for (var i = 0; i < GLctx.getProgramParameter(program, 35721); ++i) {
                        program.maxAttributeLength = Math.max(
                            program.maxAttributeLength,
                            GLctx.getActiveAttrib(program, i).name.length + 1
                        );
                    }
                }
                HEAP32[p >> 2] = program.maxAttributeLength;
            } else if (pname == 35381) {
                if (!program.maxUniformBlockNameLength) {
                    for (var i = 0; i < GLctx.getProgramParameter(program, 35382); ++i) {
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
        var _glGetShaderInfoLog = (shader, maxLength, length, infoLog) => {
            var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
            if (log === null) log = '(unknown error)';
            var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
            if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
        };
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
        var _glGetString = (name_) => {
            var ret = GL.stringCache[name_];
            if (!ret) {
                switch (name_) {
                    case 7939:
                        ret = stringToNewUTF8(GL.getExtensions().join(' '));
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
                        var glVersion = GLctx.getParameter(7938);
                        if (GL.currentContext.version >= 2) glVersion = `OpenGL ES 3.0 (${glVersion})`;
                        else {
                            glVersion = `OpenGL ES 2.0 (${glVersion})`;
                        }
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
        var _glGetUniformBlockIndex = (program, uniformBlockName) =>
            GLctx.getUniformBlockIndex(GL.programs[program], UTF8ToString(uniformBlockName));
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
                for (i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
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
                        (uniformLocsById[arrayIndex] =
                            uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name))
                    ) {
                        return arrayIndex;
                    }
                }
            } else {
                GL.recordError(1281);
            }
            return -1;
        };
        var _glLinkProgram = (program) => {
            program = GL.programs[program];
            GLctx.linkProgram(program);
            program.uniformLocsById = 0;
            program.uniformSizeAndIdsByName = {};
        };
        var _glPixelStorei = (pname, param) => {
            if (pname == 3317) {
                GL.unpackAlignment = param;
            }
            GLctx.pixelStorei(pname, param);
        };
        var computeUnpackAlignedImageSize = (width, height, sizePerPixel, alignment) => {
            function roundedToNextMultipleOf(x, y) {
                return (x + y - 1) & -y;
            }
            var plainRowSize = width * sizePerPixel;
            var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
            return height * alignedRowSize;
        };
        var colorChannelsInGlTextureFormat = (format) => {
            var colorChannels = { 5: 3, 6: 4, 8: 2, 29502: 3, 29504: 4, 26917: 2, 26918: 2, 29846: 3, 29847: 4 };
            return colorChannels[format - 6402] || 1;
        };
        var heapObjectForWebGLType = (type) => {
            type -= 5120;
            if (type == 0) return HEAP8;
            if (type == 1) return HEAPU8;
            if (type == 2) return HEAP16;
            if (type == 4) return HEAP32;
            if (type == 6) return HEAPF32;
            if (type == 5 || type == 28922 || type == 28520 || type == 30779 || type == 30782) return HEAPU32;
            return HEAPU16;
        };
        var heapAccessShiftForWebGLHeap = (heap) => 31 - Math.clz32(heap.BYTES_PER_ELEMENT);
        var emscriptenWebGLGetTexPixelData = (type, format, width, height, pixels, internalFormat) => {
            var heap = heapObjectForWebGLType(type);
            var shift = heapAccessShiftForWebGLHeap(heap);
            var byteSize = 1 << shift;
            var sizePerPixel = colorChannelsInGlTextureFormat(format) * byteSize;
            var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
            return heap.subarray(pixels >> shift, (pixels + bytes) >> shift);
        };
        var _glReadPixels = (x, y, width, height, format, type, pixels) => {
            if (GL.currentContext.version >= 2) {
                if (GLctx.currentPixelPackBufferBinding) {
                    GLctx.readPixels(x, y, width, height, format, type, pixels);
                } else {
                    var heap = heapObjectForWebGLType(type);
                    GLctx.readPixels(
                        x,
                        y,
                        width,
                        height,
                        format,
                        type,
                        heap,
                        pixels >> heapAccessShiftForWebGLHeap(heap)
                    );
                }
                return;
            }
            var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
            if (!pixelData) {
                GL.recordError(1280);
                return;
            }
            GLctx.readPixels(x, y, width, height, format, type, pixelData);
        };
        var _glShaderSource = (shader, count, string, length) => {
            var source = GL.getSource(shader, count, string, length);
            GLctx.shaderSource(GL.shaders[shader], source);
        };
        var _glTexImage2D = (target, level, internalFormat, width, height, border, format, type, pixels) => {
            if (GL.currentContext.version >= 2) {
                if (GLctx.currentPixelUnpackBufferBinding) {
                    GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels);
                } else if (pixels) {
                    var heap = heapObjectForWebGLType(type);
                    GLctx.texImage2D(
                        target,
                        level,
                        internalFormat,
                        width,
                        height,
                        border,
                        format,
                        type,
                        heap,
                        pixels >> heapAccessShiftForWebGLHeap(heap)
                    );
                } else {
                    GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, null);
                }
                return;
            }
            GLctx.texImage2D(
                target,
                level,
                internalFormat,
                width,
                height,
                border,
                format,
                type,
                pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null
            );
        };
        function _glTexParameterf(x0, x1, x2) {
            GLctx.texParameterf(x0, x1, x2);
        }
        var _glTexParameterfv = (target, pname, params) => {
            var param = HEAPF32[params >> 2];
            GLctx.texParameterf(target, pname, param);
        };
        function _glTexParameteri(x0, x1, x2) {
            GLctx.texParameteri(x0, x1, x2);
        }
        function _glTexStorage2D(x0, x1, x2, x3, x4) {
            GLctx.texStorage2D(x0, x1, x2, x3, x4);
        }
        function _glTexStorage3D(x0, x1, x2, x3, x4, x5) {
            GLctx.texStorage3D(x0, x1, x2, x3, x4, x5);
        }
        var _glTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, type, pixels) => {
            if (GL.currentContext.version >= 2) {
                if (GLctx.currentPixelUnpackBufferBinding) {
                    GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels);
                } else if (pixels) {
                    var heap = heapObjectForWebGLType(type);
                    GLctx.texSubImage2D(
                        target,
                        level,
                        xoffset,
                        yoffset,
                        width,
                        height,
                        format,
                        type,
                        heap,
                        pixels >> heapAccessShiftForWebGLHeap(heap)
                    );
                } else {
                    GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, null);
                }
                return;
            }
            var pixelData = null;
            if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
            GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
        };
        var _glTexSubImage3D = (
            target,
            level,
            xoffset,
            yoffset,
            zoffset,
            width,
            height,
            depth,
            format,
            type,
            pixels
        ) => {
            if (GLctx.currentPixelUnpackBufferBinding) {
                GLctx.texSubImage3D(
                    target,
                    level,
                    xoffset,
                    yoffset,
                    zoffset,
                    width,
                    height,
                    depth,
                    format,
                    type,
                    pixels
                );
            } else if (pixels) {
                var heap = heapObjectForWebGLType(type);
                GLctx.texSubImage3D(
                    target,
                    level,
                    xoffset,
                    yoffset,
                    zoffset,
                    width,
                    height,
                    depth,
                    format,
                    type,
                    heap,
                    pixels >> heapAccessShiftForWebGLHeap(heap)
                );
            } else {
                GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, null);
            }
        };
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
        var _glUniform1f = (location, v0) => {
            GLctx.uniform1f(webglGetUniformLocation(location), v0);
        };
        var _glUniform1i = (location, v0) => {
            GLctx.uniform1i(webglGetUniformLocation(location), v0);
        };
        var _glUniform2f = (location, v0, v1) => {
            GLctx.uniform2f(webglGetUniformLocation(location), v0, v1);
        };
        var miniTempWebGLFloatBuffers = [];
        var _glUniform2fv = (location, count, value) => {
            if (GL.currentContext.version >= 2) {
                count && GLctx.uniform2fv(webglGetUniformLocation(location), HEAPF32, value >> 2, count * 2);
                return;
            }
            if (count <= 144) {
                var view = miniTempWebGLFloatBuffers[2 * count - 1];
                for (var i = 0; i < 2 * count; i += 2) {
                    view[i] = HEAPF32[(value + 4 * i) >> 2];
                    view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
                }
            } else {
                var view = HEAPF32.subarray(value >> 2, (value + count * 8) >> 2);
            }
            GLctx.uniform2fv(webglGetUniformLocation(location), view);
        };
        var _glUniform3f = (location, v0, v1, v2) => {
            GLctx.uniform3f(webglGetUniformLocation(location), v0, v1, v2);
        };
        var _glUniform4fv = (location, count, value) => {
            if (GL.currentContext.version >= 2) {
                count && GLctx.uniform4fv(webglGetUniformLocation(location), HEAPF32, value >> 2, count * 4);
                return;
            }
            if (count <= 72) {
                var view = miniTempWebGLFloatBuffers[4 * count - 1];
                var heap = HEAPF32;
                value >>= 2;
                for (var i = 0; i < 4 * count; i += 4) {
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
        var miniTempWebGLIntBuffers = [];
        var _glUniform4iv = (location, count, value) => {
            if (GL.currentContext.version >= 2) {
                count && GLctx.uniform4iv(webglGetUniformLocation(location), HEAP32, value >> 2, count * 4);
                return;
            }
            if (count <= 72) {
                var view = miniTempWebGLIntBuffers[4 * count - 1];
                for (var i = 0; i < 4 * count; i += 4) {
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
        var _glUniformBlockBinding = (program, uniformBlockIndex, uniformBlockBinding) => {
            program = GL.programs[program];
            GLctx.uniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding);
        };
        var _glUniformMatrix4fv = (location, count, transpose, value) => {
            if (GL.currentContext.version >= 2) {
                count &&
                    GLctx.uniformMatrix4fv(
                        webglGetUniformLocation(location),
                        !!transpose,
                        HEAPF32,
                        value >> 2,
                        count * 16
                    );
                return;
            }
            if (count <= 18) {
                var view = miniTempWebGLFloatBuffers[16 * count - 1];
                var heap = HEAPF32;
                value >>= 2;
                for (var i = 0; i < 16 * count; i += 16) {
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
        var _glUseProgram = (program) => {
            program = GL.programs[program];
            GLctx.useProgram(program);
            GLctx.currentProgram = program;
        };
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
        function _glViewport(x0, x1, x2, x3) {
            GLctx.viewport(x0, x1, x2, x3);
        }
        function _mediapipe_find_canvas_event_target(canvasSelector) {
            let target = findCanvasEventTarget(canvasSelector);
            if (Module && !target) {
                target = Module.canvasWebGpu;
            }
            return Emval.toHandle(target);
        }
        function _mediapipe_webgl_tex_image_drawable(drawableHandle) {
            const drawable = Emval.toValue(drawableHandle);
            GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA, GLctx.UNSIGNED_BYTE, drawable);
        }
        var arraySum = (array, index) => {
            var sum = 0;
            for (var i = 0; i <= index; sum += array[i++]) {}
            return sum;
        };
        var MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var addDays = (date, days) => {
            var newDate = new Date(date.getTime());
            while (days > 0) {
                var leap = isLeapYear(newDate.getFullYear());
                var currentMonth = newDate.getMonth();
                var daysInCurrentMonth = (leap ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[currentMonth];
                if (days > daysInCurrentMonth - newDate.getDate()) {
                    days -= daysInCurrentMonth - newDate.getDate() + 1;
                    newDate.setDate(1);
                    if (currentMonth < 11) {
                        newDate.setMonth(currentMonth + 1);
                    } else {
                        newDate.setMonth(0);
                        newDate.setFullYear(newDate.getFullYear() + 1);
                    }
                } else {
                    newDate.setDate(newDate.getDate() + days);
                    return newDate;
                }
            }
            return newDate;
        };
        var writeArrayToMemory = (array, buffer) => {
            HEAP8.set(array, buffer);
        };
        var _strftime = (s, maxsize, format, tm) => {
            var tm_zone = HEAPU32[(tm + 40) >> 2];
            var date = {
                tm_sec: HEAP32[tm >> 2],
                tm_min: HEAP32[(tm + 4) >> 2],
                tm_hour: HEAP32[(tm + 8) >> 2],
                tm_mday: HEAP32[(tm + 12) >> 2],
                tm_mon: HEAP32[(tm + 16) >> 2],
                tm_year: HEAP32[(tm + 20) >> 2],
                tm_wday: HEAP32[(tm + 24) >> 2],
                tm_yday: HEAP32[(tm + 28) >> 2],
                tm_isdst: HEAP32[(tm + 32) >> 2],
                tm_gmtoff: HEAP32[(tm + 36) >> 2],
                tm_zone: tm_zone ? UTF8ToString(tm_zone) : '',
            };
            var pattern = UTF8ToString(format);
            var EXPANSION_RULES_1 = {
                '%c': '%a %b %d %H:%M:%S %Y',
                '%D': '%m/%d/%y',
                '%F': '%Y-%m-%d',
                '%h': '%b',
                '%r': '%I:%M:%S %p',
                '%R': '%H:%M',
                '%T': '%H:%M:%S',
                '%x': '%m/%d/%y',
                '%X': '%H:%M:%S',
                '%Ec': '%c',
                '%EC': '%C',
                '%Ex': '%m/%d/%y',
                '%EX': '%H:%M:%S',
                '%Ey': '%y',
                '%EY': '%Y',
                '%Od': '%d',
                '%Oe': '%e',
                '%OH': '%H',
                '%OI': '%I',
                '%Om': '%m',
                '%OM': '%M',
                '%OS': '%S',
                '%Ou': '%u',
                '%OU': '%U',
                '%OV': '%V',
                '%Ow': '%w',
                '%OW': '%W',
                '%Oy': '%y',
            };
            for (var rule in EXPANSION_RULES_1) {
                pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
            }
            var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            var MONTHS = [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
            ];
            function leadingSomething(value, digits, character) {
                var str = typeof value == 'number' ? value.toString() : value || '';
                while (str.length < digits) {
                    str = character[0] + str;
                }
                return str;
            }
            function leadingNulls(value, digits) {
                return leadingSomething(value, digits, '0');
            }
            function compareByDay(date1, date2) {
                function sgn(value) {
                    return value < 0 ? -1 : value > 0 ? 1 : 0;
                }
                var compare;
                if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
                    if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                        compare = sgn(date1.getDate() - date2.getDate());
                    }
                }
                return compare;
            }
            function getFirstWeekStartDate(janFourth) {
                switch (janFourth.getDay()) {
                    case 0:
                        return new Date(janFourth.getFullYear() - 1, 11, 29);
                    case 1:
                        return janFourth;
                    case 2:
                        return new Date(janFourth.getFullYear(), 0, 3);
                    case 3:
                        return new Date(janFourth.getFullYear(), 0, 2);
                    case 4:
                        return new Date(janFourth.getFullYear(), 0, 1);
                    case 5:
                        return new Date(janFourth.getFullYear() - 1, 11, 31);
                    case 6:
                        return new Date(janFourth.getFullYear() - 1, 11, 30);
                }
            }
            function getWeekBasedYear(date) {
                var thisDate = addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
                var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
                var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
                var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
                var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
                if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
                    if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                        return thisDate.getFullYear() + 1;
                    }
                    return thisDate.getFullYear();
                }
                return thisDate.getFullYear() - 1;
            }
            var EXPANSION_RULES_2 = {
                '%a': (date) => WEEKDAYS[date.tm_wday].substring(0, 3),
                '%A': (date) => WEEKDAYS[date.tm_wday],
                '%b': (date) => MONTHS[date.tm_mon].substring(0, 3),
                '%B': (date) => MONTHS[date.tm_mon],
                '%C': (date) => {
                    var year = date.tm_year + 1900;
                    return leadingNulls((year / 100) | 0, 2);
                },
                '%d': (date) => leadingNulls(date.tm_mday, 2),
                '%e': (date) => leadingSomething(date.tm_mday, 2, ' '),
                '%g': (date) => getWeekBasedYear(date).toString().substring(2),
                '%G': (date) => getWeekBasedYear(date),
                '%H': (date) => leadingNulls(date.tm_hour, 2),
                '%I': (date) => {
                    var twelveHour = date.tm_hour;
                    if (twelveHour == 0) twelveHour = 12;
                    else if (twelveHour > 12) twelveHour -= 12;
                    return leadingNulls(twelveHour, 2);
                },
                '%j': (date) =>
                    leadingNulls(
                        date.tm_mday +
                            arraySum(
                                isLeapYear(date.tm_year + 1900) ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR,
                                date.tm_mon - 1
                            ),
                        3
                    ),
                '%m': (date) => leadingNulls(date.tm_mon + 1, 2),
                '%M': (date) => leadingNulls(date.tm_min, 2),
                '%n': () => '\n',
                '%p': (date) => {
                    if (date.tm_hour >= 0 && date.tm_hour < 12) {
                        return 'AM';
                    }
                    return 'PM';
                },
                '%S': (date) => leadingNulls(date.tm_sec, 2),
                '%t': () => '\t',
                '%u': (date) => date.tm_wday || 7,
                '%U': (date) => {
                    var days = date.tm_yday + 7 - date.tm_wday;
                    return leadingNulls(Math.floor(days / 7), 2);
                },
                '%V': (date) => {
                    var val = Math.floor((date.tm_yday + 7 - ((date.tm_wday + 6) % 7)) / 7);
                    if ((date.tm_wday + 371 - date.tm_yday - 2) % 7 <= 2) {
                        val++;
                    }
                    if (!val) {
                        val = 52;
                        var dec31 = (date.tm_wday + 7 - date.tm_yday - 1) % 7;
                        if (dec31 == 4 || (dec31 == 5 && isLeapYear((date.tm_year % 400) - 1))) {
                            val++;
                        }
                    } else if (val == 53) {
                        var jan1 = (date.tm_wday + 371 - date.tm_yday) % 7;
                        if (jan1 != 4 && (jan1 != 3 || !isLeapYear(date.tm_year))) val = 1;
                    }
                    return leadingNulls(val, 2);
                },
                '%w': (date) => date.tm_wday,
                '%W': (date) => {
                    var days = date.tm_yday + 7 - ((date.tm_wday + 6) % 7);
                    return leadingNulls(Math.floor(days / 7), 2);
                },
                '%y': (date) => (date.tm_year + 1900).toString().substring(2),
                '%Y': (date) => date.tm_year + 1900,
                '%z': (date) => {
                    var off = date.tm_gmtoff;
                    var ahead = off >= 0;
                    off = Math.abs(off) / 60;
                    off = (off / 60) * 100 + (off % 60);
                    return (ahead ? '+' : '-') + String('0000' + off).slice(-4);
                },
                '%Z': (date) => date.tm_zone,
                '%%': () => '%',
            };
            pattern = pattern.replace(/%%/g, '\0\0');
            for (var rule in EXPANSION_RULES_2) {
                if (pattern.includes(rule)) {
                    pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
                }
            }
            pattern = pattern.replace(/\0\0/g, '%');
            var bytes = intArrayFromString(pattern, false);
            if (bytes.length > maxsize) {
                return 0;
            }
            writeArrayToMemory(bytes, s);
            return bytes.length - 1;
        };
        var _strftime_l = (s, maxsize, format, tm, loc) => _strftime(s, maxsize, format, tm);
        var _wgpuBindGroupLayoutRelease = (id) => WebGPU.mgrBindGroupLayout.release(id);
        var _wgpuBindGroupRelease = (id) => WebGPU.mgrBindGroup.release(id);
        var _wgpuBufferGetMappedRange = (bufferId, offset, size) => {
            var bufferWrapper = WebGPU.mgrBuffer.objects[bufferId];
            if (size === 0) warnOnce('getMappedRange size=0 no longer means WGPU_WHOLE_MAP_SIZE');
            if (size == -1) size = undefined;
            if (bufferWrapper.mapMode !== 2) {
                return 0;
            }
            var mapped;
            try {
                mapped = bufferWrapper.object['getMappedRange'](offset, size);
            } catch (ex) {
                return 0;
            }
            var data = _memalign(16, mapped.byteLength);
            HEAPU8.fill(0, data, mapped.byteLength);
            bufferWrapper.onUnmap.push(() => {
                new Uint8Array(mapped).set(HEAPU8.subarray(data, data + mapped.byteLength));
                _free(data);
            });
            return data;
        };
        var _wgpuBufferReference = (id) => WebGPU.mgrBuffer.reference(id);
        var _wgpuBufferRelease = (id) => WebGPU.mgrBuffer.release(id);
        var _wgpuBufferUnmap = (bufferId) => {
            var bufferWrapper = WebGPU.mgrBuffer.objects[bufferId];
            if (!bufferWrapper.onUnmap) {
                return;
            }
            for (var i = 0; i < bufferWrapper.onUnmap.length; ++i) {
                bufferWrapper.onUnmap[i]();
            }
            bufferWrapper.onUnmap = undefined;
            bufferWrapper.object['unmap']();
        };
        var _wgpuCommandBufferRelease = (id) => WebGPU.mgrCommandBuffer.release(id);
        var _wgpuCommandEncoderBeginComputePass = (encoderId, descriptor) => {
            var desc;
            function makeComputePassTimestampWrites(twPtr) {
                if (twPtr === 0) return undefined;
                return {
                    querySet: WebGPU.mgrQuerySet.get(HEAPU32[twPtr >> 2]),
                    beginningOfPassWriteIndex: HEAPU32[(twPtr + 4) >> 2],
                    endOfPassWriteIndex: HEAPU32[(twPtr + 8) >> 2],
                };
            }
            if (descriptor) {
                desc = {
                    label: undefined,
                    timestampWrites: makeComputePassTimestampWrites(HEAPU32[(descriptor + 8) >> 2]),
                };
                var labelPtr = HEAPU32[(descriptor + 4) >> 2];
                if (labelPtr) desc['label'] = UTF8ToString(labelPtr);
            }
            var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
            return WebGPU.mgrComputePassEncoder.create(commandEncoder['beginComputePass'](desc));
        };
        var _wgpuCommandEncoderBeginRenderPass = (encoderId, descriptor) => {
            function makeColorAttachment(caPtr) {
                var viewPtr = HEAPU32[(caPtr + 4) >> 2];
                if (viewPtr === 0) {
                    return undefined;
                }
                var loadOpInt = HEAPU32[(caPtr + 12) >> 2];
                var storeOpInt = HEAPU32[(caPtr + 16) >> 2];
                var clearValue = WebGPU.makeColor(caPtr + 24);
                return {
                    view: WebGPU.mgrTextureView.get(viewPtr),
                    resolveTarget: WebGPU.mgrTextureView.get(HEAPU32[(caPtr + 8) >> 2]),
                    clearValue: clearValue,
                    loadOp: WebGPU.LoadOp[loadOpInt],
                    storeOp: WebGPU.StoreOp[storeOpInt],
                };
            }
            function makeColorAttachments(count, caPtr) {
                var attachments = [];
                for (var i = 0; i < count; ++i) {
                    attachments.push(makeColorAttachment(caPtr + 56 * i));
                }
                return attachments;
            }
            function makeDepthStencilAttachment(dsaPtr) {
                if (dsaPtr === 0) return undefined;
                return {
                    view: WebGPU.mgrTextureView.get(HEAPU32[dsaPtr >> 2]),
                    depthClearValue: HEAPF32[(dsaPtr + 12) >> 2],
                    depthLoadOp: WebGPU.LoadOp[HEAPU32[(dsaPtr + 4) >> 2]],
                    depthStoreOp: WebGPU.StoreOp[HEAPU32[(dsaPtr + 8) >> 2]],
                    depthReadOnly: HEAP8[(dsaPtr + 16) >> 0] !== 0,
                    stencilClearValue: HEAPU32[(dsaPtr + 28) >> 2],
                    stencilLoadOp: WebGPU.LoadOp[HEAPU32[(dsaPtr + 20) >> 2]],
                    stencilStoreOp: WebGPU.StoreOp[HEAPU32[(dsaPtr + 24) >> 2]],
                    stencilReadOnly: HEAP8[(dsaPtr + 32) >> 0] !== 0,
                };
            }
            function makeRenderPassTimestampWrites(twPtr) {
                if (twPtr === 0) return undefined;
                return {
                    querySet: WebGPU.mgrQuerySet.get(HEAPU32[twPtr >> 2]),
                    beginningOfPassWriteIndex: HEAPU32[(twPtr + 4) >> 2],
                    endOfPassWriteIndex: HEAPU32[(twPtr + 8) >> 2],
                };
            }
            function makeRenderPassDescriptor(descriptor) {
                var nextInChainPtr = HEAPU32[descriptor >> 2];
                var maxDrawCount = undefined;
                if (nextInChainPtr !== 0) {
                    var sType = HEAPU32[(nextInChainPtr + 4) >> 2];
                    var renderPassDescriptorMaxDrawCount = nextInChainPtr;
                    maxDrawCount =
                        HEAPU32[(renderPassDescriptorMaxDrawCount + 4 + 8) >> 2] * 4294967296 +
                        HEAPU32[(renderPassDescriptorMaxDrawCount + 8) >> 2];
                }
                var desc = {
                    label: undefined,
                    colorAttachments: makeColorAttachments(
                        HEAPU32[(descriptor + 8) >> 2],
                        HEAPU32[(descriptor + 12) >> 2]
                    ),
                    depthStencilAttachment: makeDepthStencilAttachment(HEAPU32[(descriptor + 16) >> 2]),
                    occlusionQuerySet: WebGPU.mgrQuerySet.get(HEAPU32[(descriptor + 20) >> 2]),
                    timestampWrites: makeRenderPassTimestampWrites(HEAPU32[(descriptor + 24) >> 2]),
                    maxDrawCount: maxDrawCount,
                };
                var labelPtr = HEAPU32[(descriptor + 4) >> 2];
                if (labelPtr) desc['label'] = UTF8ToString(labelPtr);
                return desc;
            }
            var desc = makeRenderPassDescriptor(descriptor);
            var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
            return WebGPU.mgrRenderPassEncoder.create(commandEncoder['beginRenderPass'](desc));
        };
        var _wgpuCommandEncoderCopyBufferToTexture = (encoderId, srcPtr, dstPtr, copySizePtr) => {
            var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
            var copySize = WebGPU.makeExtent3D(copySizePtr);
            commandEncoder['copyBufferToTexture'](
                WebGPU.makeImageCopyBuffer(srcPtr),
                WebGPU.makeImageCopyTexture(dstPtr),
                copySize
            );
        };
        var _wgpuCommandEncoderCopyTextureToTexture = (encoderId, srcPtr, dstPtr, copySizePtr) => {
            var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
            var copySize = WebGPU.makeExtent3D(copySizePtr);
            commandEncoder['copyTextureToTexture'](
                WebGPU.makeImageCopyTexture(srcPtr),
                WebGPU.makeImageCopyTexture(dstPtr),
                copySize
            );
        };
        var _wgpuCommandEncoderFinish = (encoderId, descriptor) => {
            var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
            return WebGPU.mgrCommandBuffer.create(commandEncoder['finish']());
        };
        var _wgpuCommandEncoderRelease = (id) => WebGPU.mgrCommandEncoder.release(id);
        var _wgpuComputePassEncoderDispatchWorkgroups = (passId, x, y, z) => {
            var pass = WebGPU.mgrComputePassEncoder.get(passId);
            pass['dispatchWorkgroups'](x, y, z);
        };
        var _wgpuComputePassEncoderEnd = (passId) => {
            var pass = WebGPU.mgrComputePassEncoder.get(passId);
            pass['end']();
        };
        var _wgpuComputePassEncoderRelease = (id) => WebGPU.mgrComputePassEncoder.release(id);
        var _wgpuComputePassEncoderSetBindGroup = (
            passId,
            groupIndex,
            groupId,
            dynamicOffsetCount,
            dynamicOffsetsPtr
        ) => {
            var pass = WebGPU.mgrComputePassEncoder.get(passId);
            var group = WebGPU.mgrBindGroup.get(groupId);
            if (dynamicOffsetCount == 0) {
                pass['setBindGroup'](groupIndex, group);
            } else {
                var offsets = [];
                for (var i = 0; i < dynamicOffsetCount; i++, dynamicOffsetsPtr += 4) {
                    offsets.push(HEAPU32[dynamicOffsetsPtr >> 2]);
                }
                pass['setBindGroup'](groupIndex, group, offsets);
            }
        };
        var _wgpuComputePassEncoderSetPipeline = (passId, pipelineId) => {
            var pass = WebGPU.mgrComputePassEncoder.get(passId);
            var pipeline = WebGPU.mgrComputePipeline.get(pipelineId);
            pass['setPipeline'](pipeline);
        };
        var _wgpuComputePipelineGetBindGroupLayout = (pipelineId, groupIndex) => {
            var pipeline = WebGPU.mgrComputePipeline.get(pipelineId);
            return WebGPU.mgrBindGroupLayout.create(pipeline['getBindGroupLayout'](groupIndex));
        };
        var _wgpuComputePipelineRelease = (id) => WebGPU.mgrComputePipeline.release(id);
        var readI53FromI64 = (ptr) => HEAPU32[ptr >> 2] + HEAP32[(ptr + 4) >> 2] * 4294967296;
        var _wgpuDeviceCreateBindGroup = (deviceId, descriptor) => {
            function makeEntry(entryPtr) {
                var bufferId = HEAPU32[(entryPtr + 8) >> 2];
                var samplerId = HEAPU32[(entryPtr + 32) >> 2];
                var textureViewId = HEAPU32[(entryPtr + 36) >> 2];
                var binding = HEAPU32[(entryPtr + 4) >> 2];
                if (bufferId) {
                    var size = readI53FromI64(entryPtr + 24);
                    if (size == -1) size = undefined;
                    return {
                        binding: binding,
                        resource: {
                            buffer: WebGPU.mgrBuffer.get(bufferId),
                            offset: HEAPU32[(entryPtr + 4 + 16) >> 2] * 4294967296 + HEAPU32[(entryPtr + 16) >> 2],
                            size: size,
                        },
                    };
                } else if (samplerId) {
                    return { binding: binding, resource: WebGPU.mgrSampler.get(samplerId) };
                } else {
                    return { binding: binding, resource: WebGPU.mgrTextureView.get(textureViewId) };
                }
            }
            function makeEntries(count, entriesPtrs) {
                var entries = [];
                for (var i = 0; i < count; ++i) {
                    entries.push(makeEntry(entriesPtrs + 40 * i));
                }
                return entries;
            }
            var desc = {
                label: undefined,
                layout: WebGPU.mgrBindGroupLayout.get(HEAPU32[(descriptor + 8) >> 2]),
                entries: makeEntries(HEAPU32[(descriptor + 12) >> 2], HEAPU32[(descriptor + 16) >> 2]),
            };
            var labelPtr = HEAPU32[(descriptor + 4) >> 2];
            if (labelPtr) desc['label'] = UTF8ToString(labelPtr);
            var device = WebGPU.mgrDevice.get(deviceId);
            return WebGPU.mgrBindGroup.create(device['createBindGroup'](desc));
        };
        var _wgpuDeviceCreateBuffer = (deviceId, descriptor) => {
            var mappedAtCreation = HEAP8[(descriptor + 24) >> 0] !== 0;
            var desc = {
                label: undefined,
                usage: HEAPU32[(descriptor + 8) >> 2],
                size: HEAPU32[(descriptor + 4 + 16) >> 2] * 4294967296 + HEAPU32[(descriptor + 16) >> 2],
                mappedAtCreation: mappedAtCreation,
            };
            var labelPtr = HEAPU32[(descriptor + 4) >> 2];
            if (labelPtr) desc['label'] = UTF8ToString(labelPtr);
            var device = WebGPU.mgrDevice.get(deviceId);
            var bufferWrapper = {};
            var id = WebGPU.mgrBuffer.create(device['createBuffer'](desc), bufferWrapper);
            if (mappedAtCreation) {
                bufferWrapper.mapMode = 2;
                bufferWrapper.onUnmap = [];
            }
            return id;
        };
        var _wgpuDeviceCreateCommandEncoder = (deviceId, descriptor) => {
            var desc;
            if (descriptor) {
                desc = { label: undefined };
                var labelPtr = HEAPU32[(descriptor + 4) >> 2];
                if (labelPtr) desc['label'] = UTF8ToString(labelPtr);
            }
            var device = WebGPU.mgrDevice.get(deviceId);
            return WebGPU.mgrCommandEncoder.create(device['createCommandEncoder'](desc));
        };
        var _wgpuDeviceCreateComputePipeline = (deviceId, descriptor) => {
            var desc = {
                label: undefined,
                layout: WebGPU.makePipelineLayout(HEAPU32[(descriptor + 8) >> 2]),
                compute: WebGPU.makeProgrammableStageDescriptor(descriptor + 12),
            };
            var labelPtr = HEAPU32[(descriptor + 4) >> 2];
            if (labelPtr) desc['label'] = UTF8ToString(labelPtr);
            var device = WebGPU.mgrDevice.get(deviceId);
            return WebGPU.mgrComputePipeline.create(device['createComputePipeline'](desc));
        };
        var generateRenderPipelineDesc = (descriptor) => {
            function makePrimitiveState(rsPtr) {
                if (!rsPtr) return undefined;
                return {
                    topology: WebGPU.PrimitiveTopology[HEAPU32[(rsPtr + 4) >> 2]],
                    stripIndexFormat: WebGPU.IndexFormat[HEAPU32[(rsPtr + 8) >> 2]],
                    frontFace: WebGPU.FrontFace[HEAPU32[(rsPtr + 12) >> 2]],
                    cullMode: WebGPU.CullMode[HEAPU32[(rsPtr + 16) >> 2]],
                };
            }
            function makeBlendComponent(bdPtr) {
                if (!bdPtr) return undefined;
                return {
                    operation: WebGPU.BlendOperation[HEAPU32[bdPtr >> 2]],
                    srcFactor: WebGPU.BlendFactor[HEAPU32[(bdPtr + 4) >> 2]],
                    dstFactor: WebGPU.BlendFactor[HEAPU32[(bdPtr + 8) >> 2]],
                };
            }
            function makeBlendState(bsPtr) {
                if (!bsPtr) return undefined;
                return { alpha: makeBlendComponent(bsPtr + 12), color: makeBlendComponent(bsPtr + 0) };
            }
            function makeColorState(csPtr) {
                var formatInt = HEAPU32[(csPtr + 4) >> 2];
                return formatInt === 0
                    ? undefined
                    : {
                          format: WebGPU.TextureFormat[formatInt],
                          blend: makeBlendState(HEAPU32[(csPtr + 8) >> 2]),
                          writeMask: HEAPU32[(csPtr + 12) >> 2],
                      };
            }
            function makeColorStates(count, csArrayPtr) {
                var states = [];
                for (var i = 0; i < count; ++i) {
                    states.push(makeColorState(csArrayPtr + 16 * i));
                }
                return states;
            }
            function makeStencilStateFace(ssfPtr) {
                return {
                    compare: WebGPU.CompareFunction[HEAPU32[ssfPtr >> 2]],
                    failOp: WebGPU.StencilOperation[HEAPU32[(ssfPtr + 4) >> 2]],
                    depthFailOp: WebGPU.StencilOperation[HEAPU32[(ssfPtr + 8) >> 2]],
                    passOp: WebGPU.StencilOperation[HEAPU32[(ssfPtr + 12) >> 2]],
                };
            }
            function makeDepthStencilState(dssPtr) {
                if (!dssPtr) return undefined;
                return {
                    format: WebGPU.TextureFormat[HEAPU32[(dssPtr + 4) >> 2]],
                    depthWriteEnabled: HEAP8[(dssPtr + 8) >> 0] !== 0,
                    depthCompare: WebGPU.CompareFunction[HEAPU32[(dssPtr + 12) >> 2]],
                    stencilFront: makeStencilStateFace(dssPtr + 16),
                    stencilBack: makeStencilStateFace(dssPtr + 32),
                    stencilReadMask: HEAPU32[(dssPtr + 48) >> 2],
                    stencilWriteMask: HEAPU32[(dssPtr + 52) >> 2],
                    depthBias: HEAP32[(dssPtr + 56) >> 2],
                    depthBiasSlopeScale: HEAPF32[(dssPtr + 60) >> 2],
                    depthBiasClamp: HEAPF32[(dssPtr + 64) >> 2],
                };
            }
            function makeVertexAttribute(vaPtr) {
                return {
                    format: WebGPU.VertexFormat[HEAPU32[vaPtr >> 2]],
                    offset: HEAPU32[(vaPtr + 4 + 8) >> 2] * 4294967296 + HEAPU32[(vaPtr + 8) >> 2],
                    shaderLocation: HEAPU32[(vaPtr + 16) >> 2],
                };
            }
            function makeVertexAttributes(count, vaArrayPtr) {
                var vas = [];
                for (var i = 0; i < count; ++i) {
                    vas.push(makeVertexAttribute(vaArrayPtr + i * 24));
                }
                return vas;
            }
            function makeVertexBuffer(vbPtr) {
                if (!vbPtr) return undefined;
                var stepModeInt = HEAPU32[(vbPtr + 8) >> 2];
                return stepModeInt === 2
                    ? null
                    : {
                          arrayStride: HEAPU32[(vbPtr + 4) >> 2] * 4294967296 + HEAPU32[vbPtr >> 2],
                          stepMode: WebGPU.VertexStepMode[stepModeInt],
                          attributes: makeVertexAttributes(HEAPU32[(vbPtr + 12) >> 2], HEAPU32[(vbPtr + 16) >> 2]),
                      };
            }
            function makeVertexBuffers(count, vbArrayPtr) {
                if (!count) return undefined;
                var vbs = [];
                for (var i = 0; i < count; ++i) {
                    vbs.push(makeVertexBuffer(vbArrayPtr + i * 24));
                }
                return vbs;
            }
            function makeVertexState(viPtr) {
                if (!viPtr) return undefined;
                var desc = {
                    module: WebGPU.mgrShaderModule.get(HEAPU32[(viPtr + 4) >> 2]),
                    constants: WebGPU.makePipelineConstants(HEAPU32[(viPtr + 12) >> 2], HEAPU32[(viPtr + 16) >> 2]),
                    buffers: makeVertexBuffers(HEAPU32[(viPtr + 20) >> 2], HEAPU32[(viPtr + 24) >> 2]),
                };
                var entryPointPtr = HEAPU32[(viPtr + 8) >> 2];
                if (entryPointPtr) desc['entryPoint'] = UTF8ToString(entryPointPtr);
                return desc;
            }
            function makeMultisampleState(msPtr) {
                if (!msPtr) return undefined;
                return {
                    count: HEAPU32[(msPtr + 4) >> 2],
                    mask: HEAPU32[(msPtr + 8) >> 2],
                    alphaToCoverageEnabled: HEAP8[(msPtr + 12) >> 0] !== 0,
                };
            }
            function makeFragmentState(fsPtr) {
                if (!fsPtr) return undefined;
                var desc = {
                    module: WebGPU.mgrShaderModule.get(HEAPU32[(fsPtr + 4) >> 2]),
                    constants: WebGPU.makePipelineConstants(HEAPU32[(fsPtr + 12) >> 2], HEAPU32[(fsPtr + 16) >> 2]),
                    targets: makeColorStates(HEAPU32[(fsPtr + 20) >> 2], HEAPU32[(fsPtr + 24) >> 2]),
                };
                var entryPointPtr = HEAPU32[(fsPtr + 8) >> 2];
                if (entryPointPtr) desc['entryPoint'] = UTF8ToString(entryPointPtr);
                return desc;
            }
            var desc = {
                label: undefined,
                layout: WebGPU.makePipelineLayout(HEAPU32[(descriptor + 8) >> 2]),
                vertex: makeVertexState(descriptor + 12),
                primitive: makePrimitiveState(descriptor + 40),
                depthStencil: makeDepthStencilState(HEAPU32[(descriptor + 60) >> 2]),
                multisample: makeMultisampleState(descriptor + 64),
                fragment: makeFragmentState(HEAPU32[(descriptor + 80) >> 2]),
            };
            var labelPtr = HEAPU32[(descriptor + 4) >> 2];
            if (labelPtr) desc['label'] = UTF8ToString(labelPtr);
            return desc;
        };
        var _wgpuDeviceCreateRenderPipeline = (deviceId, descriptor) => {
            var desc = generateRenderPipelineDesc(descriptor);
            var device = WebGPU.mgrDevice.get(deviceId);
            return WebGPU.mgrRenderPipeline.create(device['createRenderPipeline'](desc));
        };
        var _wgpuDeviceCreateSampler = (deviceId, descriptor) => {
            var desc;
            if (descriptor) {
                desc = {
                    label: undefined,
                    addressModeU: WebGPU.AddressMode[HEAPU32[(descriptor + 8) >> 2]],
                    addressModeV: WebGPU.AddressMode[HEAPU32[(descriptor + 12) >> 2]],
                    addressModeW: WebGPU.AddressMode[HEAPU32[(descriptor + 16) >> 2]],
                    magFilter: WebGPU.FilterMode[HEAPU32[(descriptor + 20) >> 2]],
                    minFilter: WebGPU.FilterMode[HEAPU32[(descriptor + 24) >> 2]],
                    mipmapFilter: WebGPU.MipmapFilterMode[HEAPU32[(descriptor + 28) >> 2]],
                    lodMinClamp: HEAPF32[(descriptor + 32) >> 2],
                    lodMaxClamp: HEAPF32[(descriptor + 36) >> 2],
                    compare: WebGPU.CompareFunction[HEAPU32[(descriptor + 40) >> 2]],
                };
                var labelPtr = HEAPU32[(descriptor + 4) >> 2];
                if (labelPtr) desc['label'] = UTF8ToString(labelPtr);
            }
            var device = WebGPU.mgrDevice.get(deviceId);
            return WebGPU.mgrSampler.create(device['createSampler'](desc));
        };
        var _wgpuDeviceCreateShaderModule = (deviceId, descriptor) => {
            var nextInChainPtr = HEAPU32[descriptor >> 2];
            var sType = HEAPU32[(nextInChainPtr + 4) >> 2];
            var desc = { label: undefined, code: '' };
            var labelPtr = HEAPU32[(descriptor + 4) >> 2];
            if (labelPtr) desc['label'] = UTF8ToString(labelPtr);
            switch (sType) {
                case 5: {
                    var count = HEAPU32[(nextInChainPtr + 8) >> 2];
                    var start = HEAPU32[(nextInChainPtr + 12) >> 2];
                    var offset = start >> 2;
                    desc['code'] = HEAPU32.subarray(offset, offset + count);
                    break;
                }
                case 6: {
                    var sourcePtr = HEAPU32[(nextInChainPtr + 8) >> 2];
                    if (sourcePtr) {
                        desc['code'] = UTF8ToString(sourcePtr);
                    }
                    break;
                }
            }
            var device = WebGPU.mgrDevice.get(deviceId);
            return WebGPU.mgrShaderModule.create(device['createShaderModule'](desc));
        };
        var _wgpuDeviceCreateTexture = (deviceId, descriptor) => {
            var desc = {
                label: undefined,
                size: WebGPU.makeExtent3D(descriptor + 16),
                mipLevelCount: HEAPU32[(descriptor + 32) >> 2],
                sampleCount: HEAPU32[(descriptor + 36) >> 2],
                dimension: WebGPU.TextureDimension[HEAPU32[(descriptor + 12) >> 2]],
                format: WebGPU.TextureFormat[HEAPU32[(descriptor + 28) >> 2]],
                usage: HEAPU32[(descriptor + 8) >> 2],
            };
            var labelPtr = HEAPU32[(descriptor + 4) >> 2];
            if (labelPtr) desc['label'] = UTF8ToString(labelPtr);
            var viewFormatCount = HEAPU32[(descriptor + 40) >> 2];
            if (viewFormatCount) {
                var viewFormatsPtr = HEAPU32[(descriptor + 44) >> 2];
                desc['viewFormats'] = Array.from(
                    HEAP32.subarray(viewFormatsPtr >> 2, (viewFormatsPtr + viewFormatCount * 4) >> 2),
                    function (format) {
                        return WebGPU.TextureFormat[format];
                    }
                );
            }
            var device = WebGPU.mgrDevice.get(deviceId);
            return WebGPU.mgrTexture.create(device['createTexture'](desc));
        };
        var _wgpuDeviceGetQueue = (deviceId) => {
            var queueId = WebGPU.mgrDevice.objects[deviceId].queueId;
            WebGPU.mgrQueue.reference(queueId);
            return queueId;
        };
        var _wgpuDeviceReference = (id) => WebGPU.mgrDevice.reference(id);
        var _wgpuDeviceRelease = (id) => WebGPU.mgrDevice.release(id);
        var _wgpuPipelineLayoutRelease = (id) => WebGPU.mgrPipelineLayout.release(id);
        var _wgpuQuerySetRelease = (id) => WebGPU.mgrQuerySet.release(id);
        var _wgpuQueueRelease = (id) => WebGPU.mgrQueue.release(id);
        var _wgpuQueueSubmit = (queueId, commandCount, commands) => {
            var queue = WebGPU.mgrQueue.get(queueId);
            var cmds = Array.from(HEAP32.subarray(commands >> 2, (commands + commandCount * 4) >> 2), function (id) {
                return WebGPU.mgrCommandBuffer.get(id);
            });
            queue['submit'](cmds);
        };
        function _wgpuQueueWriteBuffer(queueId, bufferId, bufferOffset_low, bufferOffset_high, data, size) {
            var bufferOffset = convertI32PairToI53Checked(bufferOffset_low, bufferOffset_high);
            var queue = WebGPU.mgrQueue.get(queueId);
            var buffer = WebGPU.mgrBuffer.get(bufferId);
            var subarray = HEAPU8.subarray(data, data + size);
            queue['writeBuffer'](buffer, bufferOffset, subarray, 0, size);
        }
        var _wgpuRenderPassEncoderDraw = (passId, vertexCount, instanceCount, firstVertex, firstInstance) => {
            var pass = WebGPU.mgrRenderPassEncoder.get(passId);
            pass['draw'](vertexCount, instanceCount, firstVertex, firstInstance);
        };
        var _wgpuRenderPassEncoderEnd = (encoderId) => {
            var encoder = WebGPU.mgrRenderPassEncoder.get(encoderId);
            encoder['end']();
        };
        var _wgpuRenderPassEncoderRelease = (id) => WebGPU.mgrRenderPassEncoder.release(id);
        var _wgpuRenderPassEncoderSetBindGroup = (
            passId,
            groupIndex,
            groupId,
            dynamicOffsetCount,
            dynamicOffsetsPtr
        ) => {
            var pass = WebGPU.mgrRenderPassEncoder.get(passId);
            var group = WebGPU.mgrBindGroup.get(groupId);
            if (dynamicOffsetCount == 0) {
                pass['setBindGroup'](groupIndex, group);
            } else {
                var offsets = [];
                for (var i = 0; i < dynamicOffsetCount; i++, dynamicOffsetsPtr += 4) {
                    offsets.push(HEAPU32[dynamicOffsetsPtr >> 2]);
                }
                pass['setBindGroup'](groupIndex, group, offsets);
            }
        };
        var _wgpuRenderPassEncoderSetPipeline = (passId, pipelineId) => {
            var pass = WebGPU.mgrRenderPassEncoder.get(passId);
            var pipeline = WebGPU.mgrRenderPipeline.get(pipelineId);
            pass['setPipeline'](pipeline);
        };
        var _wgpuRenderPipelineGetBindGroupLayout = (pipelineId, groupIndex) => {
            var pipeline = WebGPU.mgrRenderPipeline.get(pipelineId);
            return WebGPU.mgrBindGroupLayout.create(pipeline['getBindGroupLayout'](groupIndex));
        };
        var _wgpuRenderPipelineRelease = (id) => WebGPU.mgrRenderPipeline.release(id);
        var _wgpuSamplerReference = (id) => WebGPU.mgrSampler.reference(id);
        var _wgpuSamplerRelease = (id) => WebGPU.mgrSampler.release(id);
        var _wgpuShaderModuleReference = (id) => WebGPU.mgrShaderModule.reference(id);
        var _wgpuShaderModuleRelease = (id) => WebGPU.mgrShaderModule.release(id);
        var _wgpuTextureCreateView = (textureId, descriptor) => {
            var desc;
            if (descriptor) {
                var mipLevelCount = HEAPU32[(descriptor + 20) >> 2];
                var arrayLayerCount = HEAPU32[(descriptor + 28) >> 2];
                desc = {
                    format: WebGPU.TextureFormat[HEAPU32[(descriptor + 8) >> 2]],
                    dimension: WebGPU.TextureViewDimension[HEAPU32[(descriptor + 12) >> 2]],
                    baseMipLevel: HEAPU32[(descriptor + 16) >> 2],
                    mipLevelCount: mipLevelCount === 4294967295 ? undefined : mipLevelCount,
                    baseArrayLayer: HEAPU32[(descriptor + 24) >> 2],
                    arrayLayerCount: arrayLayerCount === 4294967295 ? undefined : arrayLayerCount,
                    aspect: WebGPU.TextureAspect[HEAPU32[(descriptor + 32) >> 2]],
                };
                var labelPtr = HEAPU32[(descriptor + 4) >> 2];
                if (labelPtr) desc['label'] = UTF8ToString(labelPtr);
            }
            var texture = WebGPU.mgrTexture.get(textureId);
            return WebGPU.mgrTextureView.create(texture['createView'](desc));
        };
        var _wgpuTextureDestroy = (textureId) => WebGPU.mgrTexture.get(textureId)['destroy']();
        var _wgpuTextureReference = (id) => WebGPU.mgrTexture.reference(id);
        var _wgpuTextureRelease = (id) => WebGPU.mgrTexture.release(id);
        var _wgpuTextureViewReference = (id) => WebGPU.mgrTextureView.reference(id);
        var _wgpuTextureViewRelease = (id) => WebGPU.mgrTextureView.release(id);
        var getCFunc = (ident) => {
            var func = Module['_' + ident];
            return func;
        };
        var ccall = (ident, returnType, argTypes, args, opts) => {
            var toC = {
                string: (str) => {
                    var ret = 0;
                    if (str !== null && str !== undefined && str !== 0) {
                        ret = stringToUTF8OnStack(str);
                    }
                    return ret;
                },
                array: (arr) => {
                    var ret = stackAlloc(arr.length);
                    writeArrayToMemory(arr, ret);
                    return ret;
                },
            };
            function convertReturnValue(ret) {
                if (returnType === 'string') {
                    return UTF8ToString(ret);
                }
                if (returnType === 'boolean') return Boolean(ret);
                return ret;
            }
            var func = getCFunc(ident);
            var cArgs = [];
            var stack = 0;
            if (args) {
                for (var i = 0; i < args.length; i++) {
                    var converter = toC[argTypes[i]];
                    if (converter) {
                        if (stack === 0) stack = stackSave();
                        cArgs[i] = converter(args[i]);
                    } else {
                        cArgs[i] = args[i];
                    }
                }
            }
            var ret = func.apply(null, cArgs);
            function onDone(ret) {
                if (stack !== 0) stackRestore(stack);
                return convertReturnValue(ret);
            }
            ret = onDone(ret);
            return ret;
        };
        Module['requestFullscreen'] = Browser.requestFullscreen;
        Module['requestAnimationFrame'] = Browser.requestAnimationFrame;
        Module['setCanvasSize'] = Browser.setCanvasSize;
        Module['pauseMainLoop'] = Browser.mainLoop.pause;
        Module['resumeMainLoop'] = Browser.mainLoop.resume;
        Module['getUserMedia'] = Browser.getUserMedia;
        Module['createContext'] = Browser.createContext;
        var preloadedImages = {};
        var preloadedAudios = {};
        var FSNode = function (parent, name, mode, rdev) {
            if (!parent) {
                parent = this;
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
        };
        var readMode = 292 | 73;
        var writeMode = 146;
        Object.defineProperties(FSNode.prototype, {
            read: {
                get: function () {
                    return (this.mode & readMode) === readMode;
                },
                set: function (val) {
                    val ? (this.mode |= readMode) : (this.mode &= ~readMode);
                },
            },
            write: {
                get: function () {
                    return (this.mode & writeMode) === writeMode;
                },
                set: function (val) {
                    val ? (this.mode |= writeMode) : (this.mode &= ~writeMode);
                },
            },
            isFolder: {
                get: function () {
                    return FS.isDir(this.mode);
                },
            },
            isDevice: {
                get: function () {
                    return FS.isChrdev(this.mode);
                },
            },
        });
        FS.FSNode = FSNode;
        FS.createPreloadedFile = FS_createPreloadedFile;
        FS.staticInit();
        Module['FS_createPath'] = FS.createPath;
        Module['FS_createDataFile'] = FS.createDataFile;
        Module['FS_createPreloadedFile'] = FS.createPreloadedFile;
        Module['FS_unlink'] = FS.unlink;
        Module['FS_createLazyFile'] = FS.createLazyFile;
        Module['FS_createDevice'] = FS.createDevice;
        embind_init_charCodes();
        BindingError = Module['BindingError'] = class BindingError extends Error {
            constructor(message) {
                super(message);
                this.name = 'BindingError';
            }
        };
        InternalError = Module['InternalError'] = class InternalError extends Error {
            constructor(message) {
                super(message);
                this.name = 'InternalError';
            }
        };
        handleAllocatorInit();
        init_emval();
        var GLctx;
        WebGPU.initManagers();
        for (var i = 0; i < 32; ++i) tempFixedLengthArray.push(new Array(i));
        var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
        for (var i = 0; i < 288; ++i) {
            miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i + 1);
        }
        var miniTempWebGLIntBuffersStorage = new Int32Array(288);
        for (var i = 0; i < 288; ++i) {
            miniTempWebGLIntBuffers[i] = miniTempWebGLIntBuffersStorage.subarray(0, i + 1);
        }
        var wasmImports = {
            qd: GetAdapterVendor,
            pd: HaveOffsetConverter,
            od: JsOnEmptyPacketListener,
            nd: JsOnFloat32ArrayImageListener,
            md: JsOnFloat32ArrayImageVectorListener,
            Oa: JsOnSimpleListenerBinaryArray,
            ld: JsOnSimpleListenerBool,
            kd: JsOnSimpleListenerDouble,
            jd: JsOnSimpleListenerFloat,
            id: JsOnSimpleListenerInt,
            hd: JsOnSimpleListenerString,
            gd: JsOnSimpleListenerUint,
            fd: JsOnUint8ArrayImageListener,
            ed: JsOnUint8ArrayImageVectorListener,
            H: JsOnVectorFinishedListener,
            dd: JsOnVectorListenerBool,
            cd: JsOnVectorListenerDouble,
            bd: JsOnVectorListenerFloat,
            ad: JsOnVectorListenerInt,
            $c: JsOnVectorListenerProto,
            _c: JsOnVectorListenerString,
            Zc: JsOnVectorListenerUint,
            Yc: JsOnWebGLTextureListener,
            Xc: JsOnWebGLTextureVectorListener,
            ma: JsWrapErrorListener,
            Na: JsWrapImageConverter,
            q: JsWrapSimpleListeners,
            Ma: UseBottomLeftGpuOrigin,
            p: ___cxa_throw,
            La: ___syscall_fcntl64,
            Wc: ___syscall_fstat64,
            Vc: ___syscall_ioctl,
            Uc: ___syscall_lstat64,
            Tc: ___syscall_newfstatat,
            Ka: ___syscall_openat,
            Sc: ___syscall_stat64,
            Zb: __embind_register_bigint,
            Nc: __embind_register_bool,
            Mc: __embind_register_emval,
            Ia: __embind_register_float,
            F: __embind_register_integer,
            o: __embind_register_memory_view,
            Ha: __embind_register_std_string,
            ka: __embind_register_std_wstring,
            Lc: __embind_register_void,
            Kc: __emscripten_get_now_is_monotonic,
            ja: __emval_as,
            n: __emval_decref,
            ia: __emval_get_global,
            Ga: __emval_get_property,
            Fa: __emval_incref,
            ha: __emval_instanceof,
            da: __emval_new_cstring,
            ga: __emval_run_destructors,
            Ea: __emval_set_property,
            ca: __emval_take_value,
            Jc: __emval_typeof,
            Yb: __gmtime_js,
            Xb: __localtime_js,
            Wb: __mktime_js,
            Vb: __mmap_js,
            Ub: __munmap_js,
            Ic: __tzset_js,
            a: _abort,
            Hc: custom_emscripten_dbgn,
            E: _emscripten_asm_const_int,
            Gc: _emscripten_date_now,
            fa: _emscripten_errn,
            Fc: _emscripten_get_heap_max,
            u: _emscripten_get_now,
            Ec: _emscripten_memcpy_js,
            Dc: _emscripten_outn,
            Cc: _emscripten_pc_get_function,
            Bc: _emscripten_resize_heap,
            Ac: _emscripten_stack_snapshot,
            zc: _emscripten_stack_unwind_buffer,
            yc: _emscripten_webgl_create_context,
            xc: _emscripten_webgl_destroy_context,
            wc: _emscripten_webgl_get_context_attributes,
            Da: _emscripten_webgl_get_current_context,
            vc: _emscripten_webgl_init_context_attributes,
            uc: _emscripten_webgl_make_context_current,
            tc: _emscripten_webgpu_export_bind_group_layout,
            Ca: _emscripten_webgpu_export_device,
            sc: _emscripten_webgpu_export_sampler,
            rc: _emscripten_webgpu_export_texture,
            M: _emscripten_webgpu_get_device,
            qc: _emscripten_webgpu_import_bind_group,
            pc: _emscripten_webgpu_import_texture,
            U: _emscripten_webgpu_release_js_handle,
            Rc: _environ_get,
            Qc: _environ_sizes_get,
            Ba: _exit,
            la: _fd_close,
            Pc: _fd_read,
            _b: _fd_seek,
            Ja: _fd_write,
            oc: _getentropy,
            c: _glActiveTexture,
            ba: _glAttachShader,
            nc: _glBindAttribLocation,
            e: _glBindBuffer,
            mc: _glBindBufferBase,
            v: _glBindFramebuffer,
            b: _glBindTexture,
            s: _glBindVertexArray,
            Aa: _glBlendEquation,
            lc: _glBlendFunc,
            l: _glBufferData,
            x: _glClear,
            aa: _glClearColor,
            P: _glClientWaitSync,
            za: _glCompileShader,
            ya: _glCreateProgram,
            xa: _glCreateShader,
            B: _glDeleteBuffers,
            L: _glDeleteFramebuffers,
            i: _glDeleteProgram,
            T: _glDeleteShader,
            $: _glDeleteSync,
            z: _glDeleteTextures,
            K: _glDeleteVertexArrays,
            wa: _glDetachShader,
            J: _glDisable,
            r: _glDisableVertexAttribArray,
            m: _glDrawArrays,
            S: _glDrawBuffers,
            kc: _glEnable,
            k: _glEnableVertexAttribArray,
            va: _glFenceSync,
            _: _glFinish,
            A: _glFlush,
            y: _glFramebufferTexture2D,
            ua: _glFramebufferTextureLayer,
            w: _glGenBuffers,
            O: _glGenFramebuffers,
            D: _glGenTextures,
            I: _glGenVertexArrays,
            ta: _glGetAttribLocation,
            Z: _glGetError,
            t: _glGetIntegerv,
            jc: _glGetProgramiv,
            ic: _glGetShaderInfoLog,
            hc: _glGetShaderiv,
            G: _glGetString,
            gc: _glGetUniformBlockIndex,
            g: _glGetUniformLocation,
            sa: _glLinkProgram,
            Y: _glPixelStorei,
            ea: _glReadPixels,
            ra: _glShaderSource,
            C: _glTexImage2D,
            X: _glTexParameterf,
            qa: _glTexParameterfv,
            d: _glTexParameteri,
            W: _glTexStorage2D,
            fc: _glTexStorage3D,
            R: _glTexSubImage2D,
            ec: _glTexSubImage3D,
            Q: _glUniform1f,
            f: _glUniform1i,
            dc: _glUniform2f,
            cc: _glUniform2fv,
            pa: _glUniform3f,
            oa: _glUniform4fv,
            bc: _glUniform4iv,
            ac: _glUniformBlockBinding,
            na: _glUniformMatrix4fv,
            h: _glUseProgram,
            j: _glVertexAttribPointer,
            N: _glViewport,
            $b: hardware_concurrency,
            Sb: mediapipe_create_utility_canvas2d,
            Rb: _mediapipe_find_canvas_event_target,
            Qb: mediapipe_import_external_texture,
            Pb: _mediapipe_webgl_tex_image_drawable,
            Oc: _proc_exit,
            V: _strftime,
            Ob: _strftime_l,
            Nb: _wgpuBindGroupLayoutRelease,
            Mb: _wgpuBindGroupRelease,
            Lb: _wgpuBufferGetMappedRange,
            Kb: _wgpuBufferReference,
            Jb: _wgpuBufferRelease,
            Ib: _wgpuBufferUnmap,
            Hb: _wgpuCommandBufferRelease,
            Gb: _wgpuCommandEncoderBeginComputePass,
            Fb: _wgpuCommandEncoderBeginRenderPass,
            Eb: _wgpuCommandEncoderCopyBufferToTexture,
            Db: _wgpuCommandEncoderCopyTextureToTexture,
            Cb: _wgpuCommandEncoderFinish,
            Bb: _wgpuCommandEncoderRelease,
            Ab: _wgpuComputePassEncoderDispatchWorkgroups,
            zb: _wgpuComputePassEncoderEnd,
            yb: _wgpuComputePassEncoderRelease,
            xb: _wgpuComputePassEncoderSetBindGroup,
            wb: _wgpuComputePassEncoderSetPipeline,
            vb: _wgpuComputePipelineGetBindGroupLayout,
            ub: _wgpuComputePipelineRelease,
            tb: _wgpuDeviceCreateBindGroup,
            sb: _wgpuDeviceCreateBuffer,
            rb: _wgpuDeviceCreateCommandEncoder,
            qb: _wgpuDeviceCreateComputePipeline,
            pb: _wgpuDeviceCreateRenderPipeline,
            ob: _wgpuDeviceCreateSampler,
            nb: _wgpuDeviceCreateShaderModule,
            mb: _wgpuDeviceCreateTexture,
            lb: _wgpuDeviceGetQueue,
            kb: _wgpuDeviceReference,
            jb: _wgpuDeviceRelease,
            ib: _wgpuPipelineLayoutRelease,
            hb: _wgpuQuerySetRelease,
            gb: _wgpuQueueRelease,
            fb: _wgpuQueueSubmit,
            Tb: _wgpuQueueWriteBuffer,
            eb: _wgpuRenderPassEncoderDraw,
            db: _wgpuRenderPassEncoderEnd,
            cb: _wgpuRenderPassEncoderRelease,
            bb: _wgpuRenderPassEncoderSetBindGroup,
            ab: _wgpuRenderPassEncoderSetPipeline,
            $a: _wgpuRenderPipelineGetBindGroupLayout,
            _a: _wgpuRenderPipelineRelease,
            Za: _wgpuSamplerReference,
            Ya: _wgpuSamplerRelease,
            Xa: _wgpuShaderModuleReference,
            Wa: _wgpuShaderModuleRelease,
            Va: _wgpuTextureCreateView,
            Ua: _wgpuTextureDestroy,
            Ta: _wgpuTextureReference,
            Sa: _wgpuTextureRelease,
            Ra: _wgpuTextureViewReference,
            Qa: _wgpuTextureViewRelease,
            Pa: xnnLoadWasmModuleJS,
        };
        var wasmExports = createWasm();
        var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports['sd'])();
        var _free = (Module['_free'] = (a0) => (_free = Module['_free'] = wasmExports['td'])(a0));
        var _malloc = (Module['_malloc'] = (a0) => (_malloc = Module['_malloc'] = wasmExports['vd'])(a0));
        var ___errno_location = () => (___errno_location = wasmExports['wd'])();
        var _addBoundTextureAsImageToStream = (Module['_addBoundTextureAsImageToStream'] = (a0, a1, a2, a3) =>
            (_addBoundTextureAsImageToStream = Module['_addBoundTextureAsImageToStream'] = wasmExports['xd'])(
                a0,
                a1,
                a2,
                a3
            ));
        var _attachImageListener = (Module['_attachImageListener'] = (a0, a1) =>
            (_attachImageListener = Module['_attachImageListener'] = wasmExports['yd'])(a0, a1));
        var _attachImageVectorListener = (Module['_attachImageVectorListener'] = (a0, a1) =>
            (_attachImageVectorListener = Module['_attachImageVectorListener'] = wasmExports['zd'])(a0, a1));
        var _registerModelResourcesGraphService = (Module['_registerModelResourcesGraphService'] = () =>
            (_registerModelResourcesGraphService = Module['_registerModelResourcesGraphService'] =
                wasmExports['Ad'])());
        var _bindTextureToStream = (Module['_bindTextureToStream'] = (a0) =>
            (_bindTextureToStream = Module['_bindTextureToStream'] = wasmExports['Bd'])(a0));
        var _addBoundTextureToStream = (Module['_addBoundTextureToStream'] = (a0, a1, a2, a3) =>
            (_addBoundTextureToStream = Module['_addBoundTextureToStream'] = wasmExports['Cd'])(a0, a1, a2, a3));
        var _addDoubleToInputStream = (Module['_addDoubleToInputStream'] = (a0, a1, a2) =>
            (_addDoubleToInputStream = Module['_addDoubleToInputStream'] = wasmExports['Dd'])(a0, a1, a2));
        var _addFloatToInputStream = (Module['_addFloatToInputStream'] = (a0, a1, a2) =>
            (_addFloatToInputStream = Module['_addFloatToInputStream'] = wasmExports['Ed'])(a0, a1, a2));
        var _addBoolToInputStream = (Module['_addBoolToInputStream'] = (a0, a1, a2) =>
            (_addBoolToInputStream = Module['_addBoolToInputStream'] = wasmExports['Fd'])(a0, a1, a2));
        var _addIntToInputStream = (Module['_addIntToInputStream'] = (a0, a1, a2) =>
            (_addIntToInputStream = Module['_addIntToInputStream'] = wasmExports['Gd'])(a0, a1, a2));
        var _addUintToInputStream = (Module['_addUintToInputStream'] = (a0, a1, a2) =>
            (_addUintToInputStream = Module['_addUintToInputStream'] = wasmExports['Hd'])(a0, a1, a2));
        var _addStringToInputStream = (Module['_addStringToInputStream'] = (a0, a1, a2) =>
            (_addStringToInputStream = Module['_addStringToInputStream'] = wasmExports['Id'])(a0, a1, a2));
        var _addRawDataSpanToInputStream = (Module['_addRawDataSpanToInputStream'] = (a0, a1, a2, a3) =>
            (_addRawDataSpanToInputStream = Module['_addRawDataSpanToInputStream'] = wasmExports['Jd'])(
                a0,
                a1,
                a2,
                a3
            ));
        var _allocateBoolVector = (Module['_allocateBoolVector'] = (a0) =>
            (_allocateBoolVector = Module['_allocateBoolVector'] = wasmExports['Kd'])(a0));
        var _allocateFloatVector = (Module['_allocateFloatVector'] = (a0) =>
            (_allocateFloatVector = Module['_allocateFloatVector'] = wasmExports['Ld'])(a0));
        var _allocateDoubleVector = (Module['_allocateDoubleVector'] = (a0) =>
            (_allocateDoubleVector = Module['_allocateDoubleVector'] = wasmExports['Md'])(a0));
        var _allocateIntVector = (Module['_allocateIntVector'] = (a0) =>
            (_allocateIntVector = Module['_allocateIntVector'] = wasmExports['Nd'])(a0));
        var _allocateUintVector = (Module['_allocateUintVector'] = (a0) =>
            (_allocateUintVector = Module['_allocateUintVector'] = wasmExports['Od'])(a0));
        var _allocateStringVector = (Module['_allocateStringVector'] = (a0) =>
            (_allocateStringVector = Module['_allocateStringVector'] = wasmExports['Pd'])(a0));
        var _addBoolVectorEntry = (Module['_addBoolVectorEntry'] = (a0, a1) =>
            (_addBoolVectorEntry = Module['_addBoolVectorEntry'] = wasmExports['Qd'])(a0, a1));
        var _addFloatVectorEntry = (Module['_addFloatVectorEntry'] = (a0, a1) =>
            (_addFloatVectorEntry = Module['_addFloatVectorEntry'] = wasmExports['Rd'])(a0, a1));
        var _addDoubleVectorEntry = (Module['_addDoubleVectorEntry'] = (a0, a1) =>
            (_addDoubleVectorEntry = Module['_addDoubleVectorEntry'] = wasmExports['Sd'])(a0, a1));
        var _addIntVectorEntry = (Module['_addIntVectorEntry'] = (a0, a1) =>
            (_addIntVectorEntry = Module['_addIntVectorEntry'] = wasmExports['Td'])(a0, a1));
        var _addUintVectorEntry = (Module['_addUintVectorEntry'] = (a0, a1) =>
            (_addUintVectorEntry = Module['_addUintVectorEntry'] = wasmExports['Ud'])(a0, a1));
        var _addStringVectorEntry = (Module['_addStringVectorEntry'] = (a0, a1) =>
            (_addStringVectorEntry = Module['_addStringVectorEntry'] = wasmExports['Vd'])(a0, a1));
        var _addBoolVectorToInputStream = (Module['_addBoolVectorToInputStream'] = (a0, a1, a2) =>
            (_addBoolVectorToInputStream = Module['_addBoolVectorToInputStream'] = wasmExports['Wd'])(a0, a1, a2));
        var _addFloatVectorToInputStream = (Module['_addFloatVectorToInputStream'] = (a0, a1, a2) =>
            (_addFloatVectorToInputStream = Module['_addFloatVectorToInputStream'] = wasmExports['Xd'])(a0, a1, a2));
        var _addDoubleVectorToInputStream = (Module['_addDoubleVectorToInputStream'] = (a0, a1, a2) =>
            (_addDoubleVectorToInputStream = Module['_addDoubleVectorToInputStream'] = wasmExports['Yd'])(a0, a1, a2));
        var _addIntVectorToInputStream = (Module['_addIntVectorToInputStream'] = (a0, a1, a2) =>
            (_addIntVectorToInputStream = Module['_addIntVectorToInputStream'] = wasmExports['Zd'])(a0, a1, a2));
        var _addUintVectorToInputStream = (Module['_addUintVectorToInputStream'] = (a0, a1, a2) =>
            (_addUintVectorToInputStream = Module['_addUintVectorToInputStream'] = wasmExports['_d'])(a0, a1, a2));
        var _addStringVectorToInputStream = (Module['_addStringVectorToInputStream'] = (a0, a1, a2) =>
            (_addStringVectorToInputStream = Module['_addStringVectorToInputStream'] = wasmExports['$d'])(a0, a1, a2));
        var _addFlatHashMapToInputStream = (Module['_addFlatHashMapToInputStream'] = (a0, a1, a2, a3, a4) =>
            (_addFlatHashMapToInputStream = Module['_addFlatHashMapToInputStream'] = wasmExports['ae'])(
                a0,
                a1,
                a2,
                a3,
                a4
            ));
        var _addProtoToInputStream = (Module['_addProtoToInputStream'] = (a0, a1, a2, a3, a4) =>
            (_addProtoToInputStream = Module['_addProtoToInputStream'] = wasmExports['be'])(a0, a1, a2, a3, a4));
        var _addEmptyPacketToInputStream = (Module['_addEmptyPacketToInputStream'] = (a0, a1) =>
            (_addEmptyPacketToInputStream = Module['_addEmptyPacketToInputStream'] = wasmExports['ce'])(a0, a1));
        var _addBoolToInputSidePacket = (Module['_addBoolToInputSidePacket'] = (a0, a1) =>
            (_addBoolToInputSidePacket = Module['_addBoolToInputSidePacket'] = wasmExports['de'])(a0, a1));
        var _addDoubleToInputSidePacket = (Module['_addDoubleToInputSidePacket'] = (a0, a1) =>
            (_addDoubleToInputSidePacket = Module['_addDoubleToInputSidePacket'] = wasmExports['ee'])(a0, a1));
        var _addFloatToInputSidePacket = (Module['_addFloatToInputSidePacket'] = (a0, a1) =>
            (_addFloatToInputSidePacket = Module['_addFloatToInputSidePacket'] = wasmExports['fe'])(a0, a1));
        var _addIntToInputSidePacket = (Module['_addIntToInputSidePacket'] = (a0, a1) =>
            (_addIntToInputSidePacket = Module['_addIntToInputSidePacket'] = wasmExports['ge'])(a0, a1));
        var _addUintToInputSidePacket = (Module['_addUintToInputSidePacket'] = (a0, a1) =>
            (_addUintToInputSidePacket = Module['_addUintToInputSidePacket'] = wasmExports['he'])(a0, a1));
        var _addStringToInputSidePacket = (Module['_addStringToInputSidePacket'] = (a0, a1) =>
            (_addStringToInputSidePacket = Module['_addStringToInputSidePacket'] = wasmExports['ie'])(a0, a1));
        var _addRawDataSpanToInputSidePacket = (Module['_addRawDataSpanToInputSidePacket'] = (a0, a1, a2) =>
            (_addRawDataSpanToInputSidePacket = Module['_addRawDataSpanToInputSidePacket'] = wasmExports['je'])(
                a0,
                a1,
                a2
            ));
        var _addProtoToInputSidePacket = (Module['_addProtoToInputSidePacket'] = (a0, a1, a2, a3) =>
            (_addProtoToInputSidePacket = Module['_addProtoToInputSidePacket'] = wasmExports['ke'])(a0, a1, a2, a3));
        var _addBoolVectorToInputSidePacket = (Module['_addBoolVectorToInputSidePacket'] = (a0, a1) =>
            (_addBoolVectorToInputSidePacket = Module['_addBoolVectorToInputSidePacket'] = wasmExports['le'])(a0, a1));
        var _addDoubleVectorToInputSidePacket = (Module['_addDoubleVectorToInputSidePacket'] = (a0, a1) =>
            (_addDoubleVectorToInputSidePacket = Module['_addDoubleVectorToInputSidePacket'] = wasmExports['me'])(
                a0,
                a1
            ));
        var _addFloatVectorToInputSidePacket = (Module['_addFloatVectorToInputSidePacket'] = (a0, a1) =>
            (_addFloatVectorToInputSidePacket = Module['_addFloatVectorToInputSidePacket'] = wasmExports['ne'])(
                a0,
                a1
            ));
        var _addIntVectorToInputSidePacket = (Module['_addIntVectorToInputSidePacket'] = (a0, a1) =>
            (_addIntVectorToInputSidePacket = Module['_addIntVectorToInputSidePacket'] = wasmExports['oe'])(a0, a1));
        var _addUintVectorToInputSidePacket = (Module['_addUintVectorToInputSidePacket'] = (a0, a1) =>
            (_addUintVectorToInputSidePacket = Module['_addUintVectorToInputSidePacket'] = wasmExports['pe'])(a0, a1));
        var _addStringVectorToInputSidePacket = (Module['_addStringVectorToInputSidePacket'] = (a0, a1) =>
            (_addStringVectorToInputSidePacket = Module['_addStringVectorToInputSidePacket'] = wasmExports['qe'])(
                a0,
                a1
            ));
        var _attachBoolListener = (Module['_attachBoolListener'] = (a0) =>
            (_attachBoolListener = Module['_attachBoolListener'] = wasmExports['re'])(a0));
        var _attachBoolVectorListener = (Module['_attachBoolVectorListener'] = (a0) =>
            (_attachBoolVectorListener = Module['_attachBoolVectorListener'] = wasmExports['se'])(a0));
        var _attachDoubleListener = (Module['_attachDoubleListener'] = (a0) =>
            (_attachDoubleListener = Module['_attachDoubleListener'] = wasmExports['te'])(a0));
        var _attachDoubleVectorListener = (Module['_attachDoubleVectorListener'] = (a0) =>
            (_attachDoubleVectorListener = Module['_attachDoubleVectorListener'] = wasmExports['ue'])(a0));
        var _attachFloatListener = (Module['_attachFloatListener'] = (a0) =>
            (_attachFloatListener = Module['_attachFloatListener'] = wasmExports['ve'])(a0));
        var _attachFloatVectorListener = (Module['_attachFloatVectorListener'] = (a0) =>
            (_attachFloatVectorListener = Module['_attachFloatVectorListener'] = wasmExports['we'])(a0));
        var _attachIntListener = (Module['_attachIntListener'] = (a0) =>
            (_attachIntListener = Module['_attachIntListener'] = wasmExports['xe'])(a0));
        var _attachIntVectorListener = (Module['_attachIntVectorListener'] = (a0) =>
            (_attachIntVectorListener = Module['_attachIntVectorListener'] = wasmExports['ye'])(a0));
        var _attachUintListener = (Module['_attachUintListener'] = (a0) =>
            (_attachUintListener = Module['_attachUintListener'] = wasmExports['ze'])(a0));
        var _attachUintVectorListener = (Module['_attachUintVectorListener'] = (a0) =>
            (_attachUintVectorListener = Module['_attachUintVectorListener'] = wasmExports['Ae'])(a0));
        var _attachStringListener = (Module['_attachStringListener'] = (a0) =>
            (_attachStringListener = Module['_attachStringListener'] = wasmExports['Be'])(a0));
        var _attachStringVectorListener = (Module['_attachStringVectorListener'] = (a0) =>
            (_attachStringVectorListener = Module['_attachStringVectorListener'] = wasmExports['Ce'])(a0));
        var _attachProtoListener = (Module['_attachProtoListener'] = (a0, a1) =>
            (_attachProtoListener = Module['_attachProtoListener'] = wasmExports['De'])(a0, a1));
        var _attachProtoVectorListener = (Module['_attachProtoVectorListener'] = (a0, a1) =>
            (_attachProtoVectorListener = Module['_attachProtoVectorListener'] = wasmExports['Ee'])(a0, a1));
        var _getGraphConfig = (Module['_getGraphConfig'] = (a0, a1) =>
            (_getGraphConfig = Module['_getGraphConfig'] = wasmExports['Fe'])(a0, a1));
        var _clearSubgraphs = (Module['_clearSubgraphs'] = () =>
            (_clearSubgraphs = Module['_clearSubgraphs'] = wasmExports['Ge'])());
        var _pushBinarySubgraph = (Module['_pushBinarySubgraph'] = (a0, a1) =>
            (_pushBinarySubgraph = Module['_pushBinarySubgraph'] = wasmExports['He'])(a0, a1));
        var _pushTextSubgraph = (Module['_pushTextSubgraph'] = (a0, a1) =>
            (_pushTextSubgraph = Module['_pushTextSubgraph'] = wasmExports['Ie'])(a0, a1));
        var _changeBinaryGraph = (Module['_changeBinaryGraph'] = (a0, a1) =>
            (_changeBinaryGraph = Module['_changeBinaryGraph'] = wasmExports['Je'])(a0, a1));
        var _changeTextGraph = (Module['_changeTextGraph'] = (a0, a1) =>
            (_changeTextGraph = Module['_changeTextGraph'] = wasmExports['Ke'])(a0, a1));
        var _processGl = (Module['_processGl'] = (a0) => (_processGl = Module['_processGl'] = wasmExports['Le'])(a0));
        var _process = (Module['_process'] = (a0) => (_process = Module['_process'] = wasmExports['Me'])(a0));
        var _bindTextureToCanvas = (Module['_bindTextureToCanvas'] = () =>
            (_bindTextureToCanvas = Module['_bindTextureToCanvas'] = wasmExports['Ne'])());
        var _requestShaderRefreshOnGraphChange = (Module['_requestShaderRefreshOnGraphChange'] = () =>
            (_requestShaderRefreshOnGraphChange = Module['_requestShaderRefreshOnGraphChange'] = wasmExports['Oe'])());
        var _waitUntilIdle = (Module['_waitUntilIdle'] = () =>
            (_waitUntilIdle = Module['_waitUntilIdle'] = wasmExports['Pe'])());
        var _closeGraph = (Module['_closeGraph'] = () => (_closeGraph = Module['_closeGraph'] = wasmExports['Qe'])());
        var _setAutoRenderToScreen = (Module['_setAutoRenderToScreen'] = (a0) =>
            (_setAutoRenderToScreen = Module['_setAutoRenderToScreen'] = wasmExports['Re'])(a0));
        var ___getTypeName = (a0) => (___getTypeName = wasmExports['Se'])(a0);
        var _emscripten_builtin_memalign = (a0, a1) => (_emscripten_builtin_memalign = wasmExports['Te'])(a0, a1);
        var _memalign = (a0, a1) => (_memalign = wasmExports['Ue'])(a0, a1);
        var setTempRet0 = (a0) => (setTempRet0 = wasmExports['Ve'])(a0);
        var stackSave = () => (stackSave = wasmExports['We'])();
        var stackRestore = (a0) => (stackRestore = wasmExports['Xe'])(a0);
        var stackAlloc = (a0) => (stackAlloc = wasmExports['Ye'])(a0);
        var ___cxa_is_pointer_type = (a0) => (___cxa_is_pointer_type = wasmExports['Ze'])(a0);
        var _kVersionStampBuildChangelistStr = (Module['_kVersionStampBuildChangelistStr'] = 1024);
        var _kVersionStampCitcSnapshotStr = (Module['_kVersionStampCitcSnapshotStr'] = 1056);
        var _kVersionStampCitcWorkspaceIdStr = (Module['_kVersionStampCitcWorkspaceIdStr'] = 1088);
        var _kVersionStampSourceUriStr = (Module['_kVersionStampSourceUriStr'] = 1600);
        var _kVersionStampBuildClientStr = (Module['_kVersionStampBuildClientStr'] = 2112);
        var _kVersionStampBuildClientMintStatusStr = (Module['_kVersionStampBuildClientMintStatusStr'] = 2624);
        var _kVersionStampBuildCompilerStr = (Module['_kVersionStampBuildCompilerStr'] = 2656);
        var _kVersionStampBuildDateTimePstStr = (Module['_kVersionStampBuildDateTimePstStr'] = 3168);
        var _kVersionStampBuildDepotPathStr = (Module['_kVersionStampBuildDepotPathStr'] = 3200);
        var _kVersionStampBuildIdStr = (Module['_kVersionStampBuildIdStr'] = 3712);
        var _kVersionStampBuildInfoStr = (Module['_kVersionStampBuildInfoStr'] = 4224);
        var _kVersionStampBuildLabelStr = (Module['_kVersionStampBuildLabelStr'] = 4736);
        var _kVersionStampBuildTargetStr = (Module['_kVersionStampBuildTargetStr'] = 5248);
        var _kVersionStampBuildTimestampStr = (Module['_kVersionStampBuildTimestampStr'] = 5760);
        var _kVersionStampBuildToolStr = (Module['_kVersionStampBuildToolStr'] = 5792);
        var _kVersionStampG3BuildTargetStr = (Module['_kVersionStampG3BuildTargetStr'] = 6304);
        var _kVersionStampVerifiableStr = (Module['_kVersionStampVerifiableStr'] = 6816);
        var _kVersionStampBuildFdoTypeStr = (Module['_kVersionStampBuildFdoTypeStr'] = 6848);
        var _kVersionStampBuildBaselineChangelistStr = (Module['_kVersionStampBuildBaselineChangelistStr'] = 6880);
        var _kVersionStampBuildLtoTypeStr = (Module['_kVersionStampBuildLtoTypeStr'] = 6912);
        var _kVersionStampBuildPropellerTypeStr = (Module['_kVersionStampBuildPropellerTypeStr'] = 6944);
        var _kVersionStampBuildPghoTypeStr = (Module['_kVersionStampBuildPghoTypeStr'] = 6976);
        var _kVersionStampBuildUsernameStr = (Module['_kVersionStampBuildUsernameStr'] = 7008);
        var _kVersionStampBuildHostnameStr = (Module['_kVersionStampBuildHostnameStr'] = 7520);
        var _kVersionStampBuildDirectoryStr = (Module['_kVersionStampBuildDirectoryStr'] = 8032);
        var _kVersionStampBuildChangelistInt = (Module['_kVersionStampBuildChangelistInt'] = 8544);
        var _kVersionStampCitcSnapshotInt = (Module['_kVersionStampCitcSnapshotInt'] = 8552);
        var _kVersionStampBuildClientMintStatusInt = (Module['_kVersionStampBuildClientMintStatusInt'] = 8556);
        var _kVersionStampBuildTimestampInt = (Module['_kVersionStampBuildTimestampInt'] = 8560);
        var _kVersionStampVerifiableInt = (Module['_kVersionStampVerifiableInt'] = 8568);
        var _kVersionStampBuildCoverageEnabledInt = (Module['_kVersionStampBuildCoverageEnabledInt'] = 8572);
        var _kVersionStampBuildBaselineChangelistInt = (Module['_kVersionStampBuildBaselineChangelistInt'] = 8576);
        var _kVersionStampPrecookedTimestampStr = (Module['_kVersionStampPrecookedTimestampStr'] = 8592);
        var _kVersionStampPrecookedClientInfoStr = (Module['_kVersionStampPrecookedClientInfoStr'] = 9104);
        var ___start_em_js = (Module['___start_em_js'] = 1237828);
        var ___stop_em_js = (Module['___stop_em_js'] = 1245803);
        Module['addRunDependency'] = addRunDependency;
        Module['removeRunDependency'] = removeRunDependency;
        Module['FS_createPath'] = FS.createPath;
        Module['FS_createLazyFile'] = FS.createLazyFile;
        Module['FS_createDevice'] = FS.createDevice;
        Module['ccall'] = ccall;
        Module['stringToNewUTF8'] = stringToNewUTF8;
        Module['FS_createPreloadedFile'] = FS.createPreloadedFile;
        Module['FS_createDataFile'] = FS.createDataFile;
        Module['FS_unlink'] = FS.unlink;
        var calledRun;
        dependenciesFulfilled = function runCaller() {
            if (!calledRun) run();
            if (!calledRun) dependenciesFulfilled = runCaller;
        };
        function run() {
            if (runDependencies > 0) {
                return;
            }
            preRun();
            if (runDependencies > 0) {
                return;
            }
            function doRun() {
                if (calledRun) return;
                calledRun = true;
                Module['calledRun'] = true;
                if (ABORT) return;
                initRuntime();
                readyPromiseResolve(Module);
                if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();
                postRun();
            }
            if (Module['setStatus']) {
                Module['setStatus']('Running...');
                setTimeout(function () {
                    setTimeout(function () {
                        Module['setStatus']('');
                    }, 1);
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

        return moduleArg.ready;
    };
})();
if (typeof exports === 'object' && typeof module === 'object') module.exports = ModuleFactory;
else if (typeof define === 'function' && define['amd']) define([], () => ModuleFactory);
