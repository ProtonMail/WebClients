import { getSender, getRecipients } from './messages';

describe('message', () => {
    describe('getSender', () => {
        it('should return Name over Address', () => {
            const message = { Sender: { Name: 'Name', Address: 'Address' } };
            expect(getSender(message)).toBe(message.Sender.Name);
        });
    });

    describe('getRecipients', () => {
        it('should return Name over Address', () => {
            const message = { ToList: [{ Name: 'Name', Address: 'Address' }] };
            expect(getRecipients(message)).toEqual([message.ToList[0].Name]);
        });

        it('should return recipients from all kinds', () => {
            const message = {
                ToList: [{ Name: 'Name1' }],
                CCList: [{ Address: 'Address2' }],
                BCCList: [{ Name: 'Name3' }]
            };
            expect(getRecipients(message)).toEqual([
                message.ToList[0].Name,
                message.CCList[0].Address,
                message.BCCList[0].Name
            ]);
        });
    });
});
