import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { getRecipients, getSender } from 'proton-shared/lib/mail/messages';

describe('message', () => {
    describe('getSender', () => {
        it('should return Sender', () => {
            const message = { Sender: { Name: 'Name', Address: 'Address' } } as Message;
            expect(getSender(message)).toBe(message.Sender);
        });
    });

    describe('getRecipients', () => {
        it('should return Name over Address', () => {
            const message = { ToList: [{ Name: 'Name', Address: 'Address' }] } as Message;
            expect(getRecipients(message)).toEqual([message.ToList[0]]);
        });

        it('should return recipients from all kinds', () => {
            const message = {
                ToList: [{ Name: 'Name1' }],
                CCList: [{ Address: 'Address2' }],
                BCCList: [{ Name: 'Name3' }]
            } as Message;
            expect(getRecipients(message)).toEqual([message.ToList[0], message.CCList[0], message.BCCList[0]]);
        });
    });
});
