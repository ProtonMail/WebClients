import { uint8ArrayToBase64String } from '../helpers/encoding';

const Pbkdf2PRFKeySize = 32;
const Pbkdf2ChallengeSize = 3 * Pbkdf2PRFKeySize + 32 + 4;
const Pbkdf2OutputSize = 32;
const sha256Size = 32;
function areBuffersEqual(buf1: ArrayBuffer, buf2: Uint8Array<ArrayBuffer>): boolean {
    if (buf1.byteLength !== buf2.byteLength) {
        return false;
    }
    const dv1 = new Uint8Array(buf1);
    const dv2 = new Uint8Array(buf2);
    for (let i = 0; i !== buf1.byteLength; i++) {
        if (dv1[i] !== dv2[i]) {
            return false;
        }
    }
    return true;
}
async function solveChallengePbkdf2Preimage(b64challenge: string, deadlineUnixMilli: number) {
    const buffer = new ArrayBuffer(8);
    const challenge = Uint8Array.from(atob(b64challenge), (c) => c.charCodeAt(0));
    if (challenge.length !== Pbkdf2ChallengeSize) {
        throw new Error('Invalid challenge length');
    }
    const prfKeys = challenge.subarray(0, 3 * Pbkdf2PRFKeySize);
    const goal = challenge.subarray(3 * Pbkdf2PRFKeySize, 3 * Pbkdf2PRFKeySize + sha256Size);
    const pbkdf2Params = challenge.subarray(3 * Pbkdf2PRFKeySize + sha256Size, Pbkdf2ChallengeSize);
    const iterations = new DataView(pbkdf2Params.buffer, pbkdf2Params.byteOffset, pbkdf2Params.byteLength).getUint32(
        0,
        true
    );
    const startTime = Date.now();
    let stage: ArrayBuffer = new ArrayBuffer(0);
    let i: number = 0;
    const prePRFKey = await crypto.subtle.importKey(
        'raw',
        prfKeys.subarray(0, Pbkdf2PRFKeySize),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const postPRFKey = await crypto.subtle.importKey(
        'raw',
        prfKeys.subarray(2 * Pbkdf2PRFKeySize),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const salt = prfKeys.subarray(Pbkdf2PRFKeySize, 2 * Pbkdf2PRFKeySize);
    while (true) {
        if (Date.now() - startTime > deadlineUnixMilli) {
            throw new Error('Operation timed out');
        }
        new DataView(buffer).setUint32(0, i, true);
        const prePRFHash = await crypto.subtle.sign('HMAC', prePRFKey, buffer);
        const derivedKey = await crypto.subtle.importKey('raw', prePRFHash, 'PBKDF2', false, ['deriveBits']);
        stage = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: iterations,
                hash: 'SHA-256',
            },
            derivedKey,
            Pbkdf2OutputSize * 8
        );
        const postPRFHash = await crypto.subtle.sign('HMAC', postPRFKey, stage);
        if (areBuffersEqual(postPRFHash, goal)) {
            break;
        }
        i++;
    }
    const solution = new Uint8Array(buffer.byteLength + stage.byteLength);
    solution.set(new Uint8Array(buffer), 0);
    solution.set(new Uint8Array(stage), buffer.byteLength);

    const duration = Date.now() - startTime;
    return { solution, duration };
}

self.onmessage = async function (event) {
    const { b64Source } = event.data;

    const result = await solveChallengePbkdf2Preimage(b64Source, 15000);
    const b64 = uint8ArrayToBase64String(result.solution);
    self.postMessage(b64 + `, ${result.duration}`);
};
