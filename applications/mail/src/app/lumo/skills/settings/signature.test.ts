import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ActionRequest } from '@proton/llm/lib/lumoAgent/contracts/types';
import { ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';

import type { MailToolDeps } from '../../toolModule';
import {
    ChangeSignatureField,
    changeSignatureCardRenderer,
    changeSignatureModule,
    readSignatureModule,
} from './signature';

const primaryAddress = (Signature: string): Address =>
    ({
        ID: 'ADDRESS_ID_1',
        Email: 'bob@proton.me',
        DisplayName: 'Bob Smith',
        Status: ADDRESS_STATUS.STATUS_ENABLED,
        Receive: ADDRESS_RECEIVE.RECEIVE_YES,
        Send: ADDRESS_SEND.SEND_YES,
        Signature,
    }) as Address;

const disabledAddress = (): Address => ({ ...primaryAddress(''), Status: ADDRESS_STATUS.STATUS_DISABLED });

const setUp = (addresses: Address[]) => {
    const updateAddress = jest.fn().mockResolvedValue(undefined);
    const deps = { getAddresses: () => addresses, updateAddress } as unknown as MailToolDeps;

    return {
        updateAddress,
        read: () => readSignatureModule.createHandler(deps)({}, {} as any),
        change: (text: string) => changeSignatureModule.createHandler(deps)({ text }, {} as any),
    };
};

const IMAGE_ONLY_SIGNATURE = '<div><img src="https://acme.example/logo.png" /></div>';

describe('readSignatureModule', () => {
    it('flattens the stored HTML to plain text', async () => {
        const { read } = setUp([primaryAddress('Bob Smith<br /><a href="https://acme.example">Acme Ltd</a>')]);

        await expect(read()).resolves.toEqual({ signature: 'Bob Smith\nAcme Ltd', isSetWithoutText: false });
    });

    it('reports no signature when the address has none', async () => {
        const { read } = setUp([primaryAddress('')]);

        await expect(read()).resolves.toEqual({ signature: '', isSetWithoutText: false });
    });

    // Flattening drops images, so this reads back as empty; saying "no signature is set" would be false.
    it('separates a signature that holds no text from an absent one', async () => {
        const { read } = setUp([primaryAddress(IMAGE_ONLY_SIGNATURE)]);

        await expect(read()).resolves.toEqual({ signature: '', isSetWithoutText: true });
    });
});

describe('changeSignatureModule', () => {
    // The field stores HTML, so the user's text has to survive as text: markup in it is escaped rather
    // than stored as markup, and its newlines become the breaks that read back as newlines.
    it('escapes the text and writes its newlines as breaks, leaving the display name as stored', async () => {
        const { updateAddress, change } = setUp([primaryAddress('Bob')]);

        await change('Bob <b>Smith</b>\nAcme & Co');

        expect(updateAddress).toHaveBeenCalledWith({
            address: expect.objectContaining({ ID: 'ADDRESS_ID_1' }),
            displayName: 'Bob Smith',
            signature: 'Bob &lt;b&gt;Smith&lt;/b&gt;<br />Acme &amp; Co',
        });
    });

    it('trims the surrounding blank lines rather than storing them as breaks', async () => {
        const { updateAddress, change } = setUp([primaryAddress('Bob')]);

        await change('\nBob Smith\n\n');

        expect(updateAddress).toHaveBeenCalledWith(expect.objectContaining({ signature: 'Bob Smith' }));
    });

    it('round-trips through the read: what is written reads back as what was asked for', async () => {
        const stored: Address[] = [primaryAddress('')];
        const { updateAddress, read, change } = setUp(stored);

        await change('Bob "Smith" & Co\n\n<not a tag>');
        stored[0] = primaryAddress(updateAddress.mock.calls[0][0].signature);

        await expect(read()).resolves.toEqual({
            signature: 'Bob "Smith" & Co\n\n<not a tag>',
            isSetWithoutText: false,
        });
    });

    it('refuses a write that would leave the signature reading exactly as it does now', async () => {
        const { updateAddress, change } = setUp([primaryAddress('Bob Smith<br />Acme Ltd')]);

        await expect(change('Bob Smith\nAcme Ltd')).rejects.toThrow(ToolInputError);
        expect(updateAddress).not.toHaveBeenCalled();
    });

    // The guard compares plain text, so re-sending a rich signature's flattened form is refused rather
    // than quietly stripping the formatting the tool cannot express. The refusal has to name that as the
    // reason, or the model reports back that the signature already reads the way the user asked for.
    it('refuses a write that differs from the stored signature only in its formatting', async () => {
        const { updateAddress, change } = setUp([primaryAddress('<div><b>Bob Smith</b></div>')]);

        await expect(change('Bob Smith')).rejects.toThrow(/formatting/);
        expect(updateAddress).not.toHaveBeenCalled();
    });

    // A signature of only images flattens to no text, so a plain-text comparison would read it as already
    // empty and leave the user unable to remove it.
    it('removes a signature that holds no text, rather than reading it as already removed', async () => {
        const { updateAddress, change } = setUp([primaryAddress(IMAGE_ONLY_SIGNATURE)]);

        await change('');

        expect(updateAddress).toHaveBeenCalledWith(expect.objectContaining({ signature: '' }));
    });

    it('refuses a removal when there is no signature to remove', async () => {
        const { updateAddress, change } = setUp([primaryAddress('')]);

        await expect(change('')).rejects.toThrow(ToolInputError);
        expect(updateAddress).not.toHaveBeenCalled();
    });

    it('rejects the call when no address is active, rather than writing to a disabled one', async () => {
        const { updateAddress, change } = setUp([disabledAddress()]);

        await expect(change('Bob Smith')).rejects.toThrow(ToolInputError);
        expect(updateAddress).not.toHaveBeenCalled();
    });
});

describe('changeSignatureCardRenderer', () => {
    const settled = (text: string): ActionRequest => ({
        type: 'change_signature',
        [ChangeSignatureField.TEXT]: text,
    });

    it.each([
        ['the first line of a multi-line signature', 'Bob Smith\nAcme Ltd', 'Bob Smith'],
        ['nothing at all for an emptied signature', '', undefined],
        ['the first written line, not a leading blank one', '\nBob Smith', 'Bob Smith'],
    ])('shows %s on the settled tile', (_case, text, detail) => {
        expect(changeSignatureCardRenderer.detail?.(settled(text), {})).toBe(detail);
    });
});
