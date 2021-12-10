import { Message } from '../../lib/interfaces/mail/Message';
import { isBounced } from '../../lib/mail/messages';

describe('isBounced helper', () => {
    const generateMessage = (sender: string, subject: string) =>
        ({ Sender: { Name: 'dummy', Address: sender }, Subject: subject } as Message);

    it('should return true for the typical bounced message by Proton', () => {
        expect(
            isBounced(generateMessage('MAILER-DAEMON@protonmail.com', 'Undelivered Mail Returned to Sender'))
        ).toEqual(true);
    });

    it('should be robust with respect to changes in the email sender and subject', () => {
        expect(isBounced(generateMessage('mailer-daemon@proton.ch', 'Delivery Status Notification (Failure)'))).toEqual(
            true
        );
    });

    it('should return false if the sender is not mailer-daemon', () => {
        expect(isBounced(generateMessage('me@protonmail.com', 'Undelivered Mail Returned to Sender'))).toEqual(false);
    });

    it('should return false if the subject is not about an undelivered message', () => {
        expect(isBounced(generateMessage('MAILER-DAEMON@protonmail.com', 'Do you like fishing?'))).toEqual(false);
    });
});
