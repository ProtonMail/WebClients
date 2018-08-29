import linkit from '../../../src/helpers/linkifyHelper';

describe('linkit', () => {
    [
        {
            name: 'undelivered mail',
            input: `The mail system
<asd@asd.com>: host asd.com[198.46.84.198] said: 550 No Such User Here (in
    reply to RCPT TO command)
Reporting-MTA: dns; mail3.protonmail.ch
X-Postfix-Queue-ID: 2BCD9903
X-Postfix-Sender: rfc822; mtest100@protonmail.com
Arrival-Date: Fri,  9 Feb 2018 08:19:25`,
            output: `The mail system
&lt;<a target="_blank" rel="noreferrer nofollow noopener" href="mailto:asd@asd.com">asd@asd.com</a>&gt;: host <a target="_blank" rel="noreferrer nofollow noopener" href="http://asd.com">asd.com</a>[198.46.84.198] said: 550 No Such User Here (in
    reply to RCPT TO command)
Reporting-MTA: dns; <a target="_blank" rel="noreferrer nofollow noopener" href="http://mail3.protonmail.ch">mail3.protonmail.ch</a>
X-Postfix-Queue-ID: 2BCD9903
X-Postfix-Sender: rfc822; <a target="_blank" rel="noreferrer nofollow noopener" href="mailto:mtest100@protonmail.com">mtest100@protonmail.com</a>
Arrival-Date: Fri,  9 Feb 2018 08:19:25`
        },
        {
            name: 'email',
            input: `Pretty text with some links:
                http://angularjs.org/,
                us@somewhere.org,
                another@somewhere.org,
                and one more: ftp://127.0.0.1/.`,
            output: `Pretty text with some links:
                <a target="_blank" rel="noreferrer nofollow noopener" href="http://angularjs.org/">http://angularjs.org/</a>,
                <a target="_blank" rel="noreferrer nofollow noopener" href="mailto:us@somewhere.org">us@somewhere.org</a>,
                <a target="_blank" rel="noreferrer nofollow noopener" href="mailto:another@somewhere.org">another@somewhere.org</a>,
                and one more: <a target="_blank" rel="noreferrer nofollow noopener" href="ftp://127.0.0.1/">ftp://127.0.0.1/</a>.`
        }
    ].forEach(({ name, input, output }) => {
        it(`should add links for ${name}`, () => {
            expect(linkit(input))
                .toBe(output);
        });
    });

    it('should escape when there are no links matched', () => {
        expect(linkit('<hello>'))
            .toBe('&lt;hello&gt;');
    });
});
