import { deobfuscate, deobfuscatePartialCreditCard, obfuscate } from './xor';

describe('XOR obfuscation / deobfuscation', () => {
    test('should work on empty strings', () => {
        const obfuscated = obfuscate('');
        expect(obfuscated.v.length).toEqual(0);
        expect(obfuscated.m.length).toEqual(0);
        expect(deobfuscate(obfuscated)).toEqual('');
    });

    test('should work on strings >65kB', () => {
        const str = Array.from({ length: 65_536 * 2 }, () => '.').join('');
        const obfuscated = obfuscate(str);
        expect(deobfuscate(obfuscated)).toEqual(str);
    });

    test.each([
        '🔥🌟!@JiK9j<;`CDJu3s*o#',
        'kPd}🎉8iR(>7|Wx;1@^=',
        'Lm}N4jD🙂&KzW]O6Z!;f<',
        'e*%b2^y🌟a9Rc0lY[Q~k7',
        'Y)Jr|qD#@F1Bw*💥g2vxU7',
        "=6Vu0❤️L8o|'w]k#m🎉rT$",
        '3dAe🌟o%gXyQ*J6WvB7|❤️',
        '1@T*9mZ]p~!lG<7j🔥5a$F',
        "b'2цАЖ❤️Птгф9sВ7#пЗ",
        '8к9ΣιΟ@θЬВеr1$7🌟',
        '𝐇𝐞𝐥𝐥𝐨, 𝑇ℎ𝑖𝑠 𝑖𝑠 𝑎 𝑚𝑖𝑥 𝑜𝑓 𝐋𝑎𝑡𝑖𝑛 𝑎𝑛𝑑 𝐂𝑦𝑟𝑖𝑙𝑙𝑖𝑐 𝑐𝘩𝑎𝑟𝑎𝑐𝑡𝑒𝑟𝑠!',
        'Καλημέρα, αυτό είναι ένα μείγμα των ελληνικών και λατινικών χαρακτήρων.',
        'Хороший день, это смесь русских и латинских символов.',
        'こんにちは、これは日本語と英語の文字の混合です。',
        '안녕하세요, 이것은 한글과 영어 문자의 혼합입니다.',
        '你好，这是中文和英文字符的混合。',
        'مرحبًا، هذا مزيج من الحروف العربية والإنجليزية.',
        'Merhaba, bu Türk ve İngiliz karakterlerin karışımıdır.',
        'שלום, זוהי תערובת של אותיות עבריות ואנגליות.',
    ])('should correctly handle UTF-8 string: "%s"', (input) => {
        const obfuscated = obfuscate(input);
        expect(deobfuscate(obfuscated)).toEqual(input);
    });

    test.each([
        ['4532015112830366', '4532********0366'],
        ['4532015112830', '4532*****2830'],
        ['5425233430109903', '5425********9903'],
        ['378282246310005', '3782*******0005'],
        ['6011111111111117', '6011********1117'],
        ['123456789012', '1234****9012'],
        ['12345678901234567', '1234*********4567'],
        ['123456789012345678', '1234**********5678'],
        ['1234567890123456789', '1234***********6789'],
        ['abc123def456ghi', 'abc1*******6ghi'],
        ['🔥12345678901234', '🔥**********1234'] /** edge-case: 4 bytes emoji */,
    ])('should partially deobfuscate cc "%s" -> "%s"', (input, expected) => {
        expect(deobfuscatePartialCreditCard(obfuscate(input))).toEqual(expected);
    });

    test.each([
        ['', ''],
        ['123', '***'],
        ['12345', '*****'],
        ['123456789', '*********'],
        ['12345678901', '***********'],
        ['null', '****'],
        ['undefined', '*********'],
        ['🔥', '****'],
    ])('should mask if invalid "%s" -> "%s"', (input, expected) => {
        expect(deobfuscatePartialCreditCard(obfuscate(input))).toEqual(expected);
    });
});
