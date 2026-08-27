import urlify from '../../lib/calendar/urlify';

describe('urlify', () => {
    it('urlifies', () => {
        const string = `asd https://dog.com
ftps://dog.das/asdasd21.31233#asdad?dog=awd
file://dog
mailto:asd@dd.fas> } ta
www.dog.com
dog.com
<a class="boop" href="dog.com">something else </a>
sms:+4444444
tel:+4444444
http://jdfasf.ffasdf
A <a href="line.com">line </a> with one https://link1.com and <a href="https://blob.com">another </a> https://link2.com
<https://asdasd.adfadf.adfasf>
<akdfjadf@aefasdf.adf.mailto:asd@adfasdf.dfadf>`;
        const result = `asd <a href="https://dog.com">https://dog.com</a>
<a href="ftps://dog.das/asdasd21.31233#asdad?dog=awd">ftps://dog.das/asdasd21.31233#asdad?dog=awd</a>
<a href="file://dog">file://dog</a>
<a href="mailto:asd@dd.fas">mailto:asd@dd.fas</a>> } ta
www.dog.com
dog.com
<a class="boop" href="dog.com">something else </a>
<a href="sms:+4444444">sms:+4444444</a>
<a href="tel:+4444444">tel:+4444444</a>
http://jdfasf.ffasdf
A <a href="line.com">line </a> with one <a href="https://link1.com">https://link1.com</a> and <a href="https://blob.com">another </a> <a href="https://link2.com">https://link2.com</a>
<<a href="https://asdasd.adfadf.adfasf">https://asdasd.adfadf.adfasf</a>>
<akdfjadf@aefasdf.adf.<a href="mailto:asd@adfasdf.dfadf">mailto:asd@adfasdf.dfadf</a>>`;
        expect(urlify(string)).toEqual(result);
    });

    it('should apply the proper target', () => {
        expect(urlify('test https://www.google.com')).toEqual(
            'test <a href="https://www.google.com">https://www.google.com</a>'
        );
        expect(urlify('test https://www.google.com', { target: '_blank' })).toEqual(
            'test <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">https://www.google.com</a>'
        );
        expect(urlify('test https://www.google.com', { target: '_top' })).toEqual(
            'test <a href="https://www.google.com" target="_top">https://www.google.com</a>'
        );
        expect(urlify('test https://www.google.com', { target: '_self' })).toEqual(
            'test <a href="https://www.google.com" target="_self">https://www.google.com</a>'
        );
    });
});
