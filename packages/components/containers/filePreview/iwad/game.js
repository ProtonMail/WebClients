const statusElement = document.getElementById('status');
const canvasElement = document.getElementById('canvas');

window.addEventListener('load', () => {
    window.parent.postMessage('FRAME_READY', '*');
});

window.addEventListener('message', async (event) => {
    if (event.data.type === 'LOAD_GAME') {
        const fileName = event.data.fileName;
        const fileData = event.data.fileData;

        statusElement.innerHTML = `
<div class="spinner"></div>
<p>Loading ${fileName}...</p>
`;
        initGame(fileName, fileData);
    }
});

function handleResize() {
    console.info('Detected window resize: ' + canvasElement.width + 'x' + canvasElement.height);
    let dVW, dVH, aspX, aspY;

    if (window.CSS.supports('height', '1dvh')) {
        dVW = '100dvw';
        dVH = '100dvh';
    } else {
        dVW = '100vw';
        dVH = '100vh';
    }

    aspX = canvasElement.width + ' / ' + canvasElement.height;
    aspY = canvasElement.height + ' / ' + canvasElement.width;

    canvasElement.style.width = 'calc(min(' + dVW + ', ' + dVH + ' * ' + aspX + '))';
    canvasElement.style.height = 'calc(min(' + dVH + ', ' + dVW + ' * ' + aspY + '))';
    canvasElement.style.marginTop = 'calc(0.5 * (' + dVH + ' - (min(' + dVH + ', ' + dVW + ' * ' + aspY + '))))';
}

var Module = {
    canvas: (function () {
        canvasElement.addEventListener(
            'webglcontextlost',
            function (e) {
                e.preventDefault();
                alert('WebGL context lost. Please reload the page!');
            },
            false
        );
        return canvasElement;
    })(),
    print: function (text) {
        console.log(text);
        if (
            text.includes('PNAMES not found') ||
            text.includes('COLORMAP not found') ||
            text.includes('failed to read directory')
        ) {
            window.parent.postMessage('FAILED_RUNNING_GAME', '*');
        }
    },
    printErr: function (text) {
        console.error(text);
        window.parent.postMessage('FAILED_RUNNING_GAME', '*');
    },
    setStatus: function (text) {
        if (!text) {
            statusElement.style.display = 'none';
        } else {
            statusElement.style.display = 'block';
            statusElement.innerHTML = `
<div class="spinner"></div>
<p>${text}</p>
`;
        }
    },
    onRuntimeInitialized: function () {},
    winResized: function () {
        handleResize();
    },
    captureMouse: function () {
        if (!Module._attemptPointerLock()) {
            document.addEventListener('keydown', Module._lockPointerOnKey);
        }
    },
    _attemptPointerLock: function () {
        if (document.pointerLockElement === null) {
            canvasElement.requestPointerLock();
        }
        return document.pointerLockElement !== null;
    },
    _lockPointerOnKey: function (event) {
        if (event.key === 'Escape' || Module._attemptPointerLock()) {
            document.removeEventListener('keydown', Module._lockPointerOnKey);
            console.info('Delayed pointer lock complete.');
        }
    },
    locateFile: function (path) {
        console.info('Loading from path: /assets/static/iwad/' + path);
        return '/assets/static/iwad/' + path;
    },
    arguments: [],
};

function initGame(fileName, fileData) {
    const writeToDoomFS = () => {
        try {
            console.info('Writing to MemFS: freedoom1.wad (' + fileData.length + ' bytes)');
            const destFile = FS.open('/freedoom1.wad', 'w');
            FS.write(destFile, fileData, 0, fileData.length, 0);
            FS.close(destFile);

            Module.arguments = ['-iwad', 'freedoom1.wad'];

            statusElement.innerHTML = `
<div class="spinner"></div>
<p>Starting game...</p>
`;
        } catch (e) {
            console.error('Error writing file:', e);
            statusElement.innerHTML = `<p>Error loading game: ${e.message}</p>`;
        }
    };

    if (typeof FS === 'undefined') {
        Module.setStatus('Loading DOOM engine...');

        const script = document.createElement('script');
        script.src = '/assets/static/iwad/index.js';
        script.async = true;
        script.onload = () => {
            console.log('DOOM engine loaded');
        };
        document.body.appendChild(script);

        Module.onRuntimeInitialized = function () {
            writeToDoomFS();
            this.setStatus('');
            handleResize();
        };
    } else {
        writeToDoomFS();
    }
}

canvasElement.addEventListener('click', () => {
    if (document.pointerLockElement !== canvasElement) {
        canvasElement.requestPointerLock();
    }
});

canvasElement.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

window.addEventListener('resize', handleResize);

canvasElement.addEventListener('focus', () => {
    console.info('Canvas focused');
});
