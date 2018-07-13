import _ from 'lodash';

import factory from '../../../../src/app/utils/services/mailUtils';
import browser from '../../../../src/helpers/browser';

const sanitize = {
    input: _.identity,
    message: _.identity
};

const tests = [
    {
        name: "mail + subject + body",
        input:
            'mailto:test@example.com?subject=foo&body=bar',
        output: {
            Subject: "foo",
            DecryptedBody: "bar",
            ToList: [
                {
                    Address: "test@example.com",
                    Name: "test@example.com"
                }
            ]
        }
    },
    {
        name: "only an email",
        input: 'mailto:test@example.com',
        output: {
            ToList: [
                {
                    Address: "test@example.com",
                    Name: "test@example.com"
                }
            ]
        }
    },
    {
        name: "email + subject",
        input: 'mailto:dew@free.fr?subject=dew',
        output: {
            Subject: "dew",
            ToList: [
                {
                    Address: "dew@free.fr",
                    Name: "dew@free.fr"
                }
            ]
        }
    },
    {
        name: "email + cc + bcc + subject",
        input:
            'mailto:dew@free.fr,jeanne@dew.fr?cc=robert@dew.fr&bcc=jesus@dew.de&subject=dew',
        output: {
            Subject: "dew",
            ToList: [
                {
                    Address: "dew@free.fr",
                    Name: "dew@free.fr"
                },
                {
                    Address: "jeanne@dew.fr",
                    Name: "jeanne@dew.fr"
                }
            ],
            CCList: [
                {
                    Address: "robert@dew.fr",
                    Name: "robert@dew.fr"
                }
            ],
            BCCList: [
                {
                    Address: "jesus@dew.de",
                    Name: "jesus@dew.de"
                }
            ]
        }
    },
    {
        name: "email + subject with accents",
        input:
            'mailto:dew@free.fr?subject=cet été au soleil',
        output: {
            Subject: "cet été au soleil",
            ToList: [
                {
                    Address: "dew@free.fr",
                    Name: "dew@free.fr"
                }
            ]
        }
    },
    {
        name: "email + subject encoded + body encoded",
        input:
            'mailto:person@example.com?subject=RE:%20Email%20Subject&body=%0D%0A%0D%0A--%0D%0A%20message',
        output: {
            Subject: "RE: Email Subject",
            DecryptedBody: "-- message",
            ToList: [
                {
                    Address: "person@example.com",
                    Name: "person@example.com"
                }
            ]
        }
    }
];


describe('MailUtils service', () => {

    describe('Parse string + create default message', () => {

        let service;

        beforeEach(() => {
            spyOn(sanitize, 'message').and.callThrough();
            spyOn(sanitize, 'input').and.callThrough();
            service = factory(sanitize);
        });

        tests.forEach(({ name, input, output }) => {

            if (/encoded/.test(name)) {
                return it(`should create a valid RAW message for: ${name}`, () => {
                    const message = service.mailtoParser(input);

                    expect(message.Subject).toEqual(output.Subject);

                    // Remove weird encoding from windows, (squire does it too)
                    const body = message.DecryptedBody
                        .split('\n')
                        .map((str) => str.trim().replace(/\s/g,''))
                        .filter(Boolean)
                        .join(' ');
                    expect(body).toEqual(output.DecryptedBody);
                    expect(message.ToList).toEqual(output.ToList);
                });
            }

            it(`should create a valid RAW message for: ${name}`, () => {
                expect(service.mailtoParser(input)).toEqual(output);
            });
        });

    });

});
