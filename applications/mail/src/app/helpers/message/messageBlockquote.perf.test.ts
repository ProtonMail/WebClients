import { FORWARDED_MESSAGE } from '@proton/shared/lib/mail/messages';

import { locatePlaintextInternalBlockquotes } from './messageBlockquote';

const fiveHundred =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec leo eget augue sodales vestibulum ut eget turpis. Donec a ultricies diam, vel pellentesque augue. Nam dapibus, felis at tincidunt porta, sapien lacus commodo ante, eu tincidunt lacus tortor sit amet nulla. Morbi urna tellus, pulvinar at felis eu, dictum mollis nisi. Fusce luctus massa in lobortis bibendum. In porta sem sapien. Phasellus ultricies dui felis, id convallis odio rhoncus vitae. Integer iaculis tortor tempus, commodo magna ut, consectetur magna. Curabitur volutpat quam non ultrices tristique. Sed vel sem congue, blandit magna ac, bibendum mi. Suspendisse placerat dui eget leo facilisis, id dictum dui aliquet. Curabitur at purus dui. Suspendisse ornare lacus quis varius tincidunt. Cras sollicitudin tempus vehicula. Etiam ut pellentesque tellus, sollicitudin aliquam odio. Sed eget dictum odio, at aliquam tellus. Vestibulum accumsan augue at eros rutrum pharetra. Etiam eget est ut neque ornare fringilla. Aliquam volutpat risus dolor, a ultrices erat pellentesque quis. In molestie arcu non dui condimentum vulputate. Nullam sodales dictum suscipit. Nam a eros quis odio consequat molestie. Fusce blandit ipsum nec quam ullamcorper congue eu eget risus. Maecenas sapien ligula, convallis quis ullamcorper non, hendrerit non mauris. Sed venenatis pretium enim eu semper. Praesent blandit efficitur pulvinar. Fusce fringilla elit at lacus porttitor, sed faucibus arcu bibendum. Donec sit amet lectus a lacus tincidunt eleifend. Pellentesque volutpat sed orci at consectetur. Vivamus blandit sed ligula et efficitur. Aliquam ac erat sapien. Maecenas sit amet porttitor nisi, sit amet luctus eros. Donec dictum orci eu mi tempor vehicula. Morbi ultricies in libero ut finibus. Suspendisse feugiat nulla et purus hendrerit, vitae dapibus massa ultricies. Vivamus varius fermentum ultrices. Nulla pulvinar elit lorem, vitae sollicitudin purus blandit eu. Aliquam sollicitudin vulputate lectus, in finibus mauris finibus eu. Maecenas sagittis, ex congue maximus molestie, sapien nisl sollicitudin ipsum, quis blandit risus neque sed velit. Curabitur accumsan sapien vel diam accumsan, eget fermentum lectus vulputate. Donec venenatis est ante, vitae pellentesque nibh dapibus et. Etiam efficitur id dolor a vehicula. Phasellus aliquet at magna eu tincidunt. Vivamus porta pharetra risus, vitae pharetra turpis. Suspendisse potenti. Cras vestibulum eros pharetra, tincidunt eros quis, semper neque. Vestibulum nec turpis sem. Vestibulum finibus elit non placerat dictum. Sed congue ut dui nec venenatis. Vestibulum malesuada, neque sed finibus cursus, quam tellus interdum lectus, ac tristique justo tortor et dui. Morbi faucibus posuere enim quis tristique. Duis nec arcu nulla. Ut accumsan diam sed magna blandit feugiat in a est. Nulla non arcu nec augue aliquam interdum a quis magna. Mauris porta enim libero, eget placerat purus fringilla in. Mauris et tincidunt diam. Quisque magna urna, gravida vel fringilla a, scelerisque et velit. Phasellus a placerat sapien. In venenatis ornare enim, id sodales nisi. Sed vulputate nisl id gravida ornare. Etiam suscipit leo non arcu porta blandit. Vestibulum arcu purus, tincidunt vel fermentum sed, interdum eget arcu. Donec auctor libero velit, vehicula aliquam libero vestibulum eu. Duis leo nulla, hendrerit at vehicula non, suscipit non tortor. Mauris quis tempor diam. Ut.';

const generateText = (targetLength: number): string => {
    let result = '';
    while (result.length < targetLength) {
        result += fiveHundred;
    }

    return result.substring(0, targetLength);
};

const generateForwardedMessage = (targetLength: number): string => {
    let result = generateText(targetLength);
    const insertPosition = Math.floor(Math.random() * (result.length - FORWARDED_MESSAGE.length));

    const before = result.substring(0, insertPosition);
    const after = result.substring(insertPosition);

    result = before + `\n${FORWARDED_MESSAGE}\n` + after;
    return result.substring(0, targetLength);
};

const generateReplyMessage = (targetLength: number): string => {
    let result = generateText(targetLength);

    const insertPosition = Math.floor(Math.random() * result.length);
    const before = result.substring(0, insertPosition);
    const after = result.substring(insertPosition);
    result = `${before}\nOn Tuesday, 24 september 2024 at 4:00 PM, Sender <sender@proton.me> wrote:\n\n> ${after.trimStart()}\n`;
    return result;
};

const generateWithRandomColon = (targetLength: number): string => {
    let result = generateText(targetLength);

    const insertPosition = Math.floor(Math.random() * result.length);
    const before = result.substring(0, insertPosition);
    const after = result.substring(insertPosition);
    result = `${before}:\n${after.trimStart()}\n`;
    return result;
};

describe('locatePlaintextInternalBlockquotes performances', () => {
    describe('no match', () => {
        it('should test simple text for no match and 500 words content', () => {
            const text = generateText(500);
            const startTime = performance.now();
            locatePlaintextInternalBlockquotes(text);
            const endTime = performance.now();
            const duration = endTime - startTime;
            expect(duration).toBeLessThanOrEqual(1);
        });

        it('should test simple text for no match and 10k words content', () => {
            const text = generateText(10_000);
            const startTime = performance.now();
            locatePlaintextInternalBlockquotes(text);
            const endTime = performance.now();
            const duration = endTime - startTime;
            expect(duration).toBeLessThanOrEqual(1);
        });

        it('should test simple text for no match and 100k words content', () => {
            const text = generateText(100_000);
            const startTime = performance.now();
            locatePlaintextInternalBlockquotes(text);
            const endTime = performance.now();
            const duration = endTime - startTime;
            expect(duration).toBeLessThanOrEqual(1);
        });

        it('should test text with a colon at end of line and 500 words content', () => {
            const text = generateWithRandomColon(500);
            const startTime = performance.now();
            locatePlaintextInternalBlockquotes(text);
            const endTime = performance.now();
            const duration = endTime - startTime;
            expect(duration).toBeLessThanOrEqual(1);
        });

        it('should test text with a colon at end of line and 10k words content', () => {
            const text = generateWithRandomColon(10_000);
            const startTime = performance.now();
            locatePlaintextInternalBlockquotes(text);
            const endTime = performance.now();
            const duration = endTime - startTime;
            expect(duration).toBeLessThanOrEqual(1);
        });

        it('should test text with a colon at end of line and 100k words content', () => {
            const text = generateWithRandomColon(100_000);
            const startTime = performance.now();
            locatePlaintextInternalBlockquotes(text);
            const endTime = performance.now();
            const duration = endTime - startTime;
            expect(duration).toBeLessThanOrEqual(1);
        });
    });

    describe('match a blockquote', () => {
        describe('forward blockquotes', () => {
            it('should test for 500 words', () => {
                const text = generateForwardedMessage(500);
                const startTime = performance.now();
                locatePlaintextInternalBlockquotes(text);
                const endTime = performance.now();
                const duration = endTime - startTime;
                expect(duration).toBeLessThanOrEqual(1);
            });

            it('should test for 10k words', () => {
                const text = generateForwardedMessage(10_000);
                const startTime = performance.now();
                locatePlaintextInternalBlockquotes(text);
                const endTime = performance.now();
                const duration = endTime - startTime;
                expect(duration).toBeLessThanOrEqual(1);
            });

            it('should test for 100k words', () => {
                const text = generateForwardedMessage(100_000);
                const startTime = performance.now();
                locatePlaintextInternalBlockquotes(text);
                const endTime = performance.now();
                const duration = endTime - startTime;
                expect(duration).toBeLessThanOrEqual(1);
            });
        });

        describe('reply blockquotes', () => {
            it('should test for 500 words', () => {
                const text = generateReplyMessage(500);
                const startTime = performance.now();
                locatePlaintextInternalBlockquotes(text);
                const endTime = performance.now();
                const duration = endTime - startTime;
                expect(duration).toBeLessThanOrEqual(1);
            });

            it('should test for 10k words', () => {
                const text = generateReplyMessage(10_000);
                const startTime = performance.now();
                locatePlaintextInternalBlockquotes(text);
                const endTime = performance.now();
                const duration = endTime - startTime;
                expect(duration).toBeLessThanOrEqual(1);
            });

            it('should test for 100k words', () => {
                const text = generateReplyMessage(100_000);
                const startTime = performance.now();
                locatePlaintextInternalBlockquotes(text);
                const endTime = performance.now();
                const duration = endTime - startTime;
                expect(duration).toBeLessThanOrEqual(1);
            });
        });
    });
});
