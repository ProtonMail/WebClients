import { WasmMnemonic, WasmNetwork, WasmWallet, WasmWordCount } from '@proton/andromeda';

/**
 * Wallet creation must derive its seed from a cryptographically-secure source of randomness.
 * In the browser/wasm context that source is the WebCrypto API (`crypto.getRandomValues`):
 * andromeda generates mnemonics with `rand::thread_rng()`, whose OS seed routes through `getrandom` to WebCrypto
 * (see the `getRandomValues` imports in `packages/wasm/andromeda/index_bg.js`).
 *
 * `thread_rng` is a reseeding CSPRNG: it draws WebCrypto entropy lazily on first use, then reads from
 * the seeded generator and only reseeds after a large volume of output. A single mnemonic draws far too
 * little to trigger a reseed, so `getRandomValues` is observed only on the first generation in this
 * module, which is why the first test below must run before any other mnemonic is generated here.
 */
describe('andromeda wasm wallet creation entropy', () => {
    it('seeds its secure RNG from the WebCrypto API on first wallet creation', () => {
        const getRandomValuesSpy = vi.spyOn(globalThis.crypto, 'getRandomValues');

        // Generating a fresh mnemonic is what draws the random entropy for a new wallet.
        const mnemonic = new WasmMnemonic(WasmWordCount.Words12);

        // The entropy came from WebCrypto, not a weak source such as Math.random.
        expect(getRandomValuesSpy).toHaveBeenCalled();

        // WebCrypto was handed a typed-array view to fill with secure bytes.
        const [buffer] = getRandomValuesSpy.mock.calls[0];
        expect(ArrayBuffer.isView(buffer)).toBe(true);

        // The securely-generated phrase is a valid 12-word BIP39 mnemonic...
        const phrase = mnemonic.asString();
        expect(phrase.split(' ')).toHaveLength(12);

        // ...and yields a usable wallet.
        const wallet = new WasmWallet(WasmNetwork.Testnet, phrase, '');
        expect(wallet.getFingerprint()).toEqual(expect.any(String));

        getRandomValuesSpy.mockRestore();
    });

    it('generates distinct wallets from its seeded CSPRNG', () => {
        const first = new WasmMnemonic(WasmWordCount.Words12).asString();
        const second = new WasmMnemonic(WasmWordCount.Words12).asString();

        expect(first).not.toEqual(second);

        expect(new WasmWallet(WasmNetwork.Testnet, first, '').getFingerprint()).not.toEqual(
            new WasmWallet(WasmNetwork.Testnet, second, '').getFingerprint()
        );
    });
});
