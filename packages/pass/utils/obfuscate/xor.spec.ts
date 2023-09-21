import { deobfuscate, obfuscate } from './xor';

describe('XOR obfuscation / deobfuscation', () => {
    test('should work on empty strings', () => {
        const obfuscated = obfuscate('');
        expect(obfuscated.v.length).toEqual(0);
        expect(obfuscated.m.length).toEqual(0);
        expect(deobfuscate(obfuscated)).toEqual('');
    });

    test('should work on all character types', () => {
        [
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
        ].forEach((str) => {
            const obfuscated = obfuscate(str);
            expect(deobfuscate(obfuscated)).toEqual(str);
        });
    });
});
