import { describe, it } from 'mocha';
import assert from 'assert';
import requireInject from 'require-inject';

import './setup';
import { AUTH_RESPONSE, SERVER_MODULUS, SERVER_MODULUS_FAKE, FAKE_RANDOM } from './srp.data';

const mockRandomValues = (buf) => new Uint8Array(FAKE_RANDOM.slice(0, buf.length));

const mocks = {
    '@proton/get-random-values': mockRandomValues
};

const { getRandomSrpVerifier, getSrp } = requireInject('../lib/srp', mocks);

describe('srp', () => {
    it('should generate verifier', async () => {
        const result = await getRandomSrpVerifier({ Modulus: SERVER_MODULUS, ModulusID: 1 }, { password: '123' });
        assert.deepStrictEqual(result, {
            version: 4,
            salt: 'SzHkg+YYA/eN1A==',
            verifier:
                'j2o8z9G+Xm5t07Y6D7rauq3bNi6v0ZqnM1nWuZHS8PgtQOl4Xgh8LjuzulhX1izaOqeIoW221Z/LDVkrUZzxAXwFdi5LfxMN+RHPJCg0Uk5OcigQHsO1xTMuk3hvoIXO7yIXXs2oCqpBwKNfuhMNjcwVlgjyh5ZC4FzhSV2lwlP7KE1me/USAOfq4FbW7KtDtvxX8fk6hezWIz9X8/bcAHwQkHobqOVTCE81Lg+WL7s4sMed72YHwx5p6S/YGm558zrZmeETv6PuS4MRkQ8vPRrIvmzPEQDUiOXCaqfLkGvBFeCbBjNtBM8AlbWcW8XE+gcb/GwWH8cHinzd4ddh4A=='
        });
    });

    it('should reject verify if it is unable to verify identity', async () => {
        const promise = getRandomSrpVerifier({ Modulus: SERVER_MODULUS_FAKE, ModulusID: 1 }, { password: 'hello' });
        await assert.rejects(promise, {
            name: 'Error',
            message: 'Unable to verify server identity'
        });
    });

    it('should generate auth parameters', async () => {
        const result = await getSrp(AUTH_RESPONSE, { password: '123' });
        assert.deepStrictEqual(result, {
            clientEphemeral: 'hlszWWqvmsVvSCYdu0Zvmn/Ow9dSkp91vfhd20yYvd8XTcNixlOloz7lbD+bFR/0mAUYrYuOyYwPDoARAqRiAijQTWSkfOsByeKvmHZN7scxsmMQSp/8BdkIpEcJzUBg762o4L2tgrOFdydtagYRH0++qaJI6iMWlGLVI1atJvEcQ1h9xRylYT8rtL+gqKcYOQbqYgl3mXlHE/9uT8qEBFIP8LthQfIntst1p/dUDYyN4GH5Pb3ajL0qehzrQrDkF5xMmggDXgqflwMtcJTSIB0WcyiG+ls8KhUy8NVwyNhJrbikkzAnhAk4Mq3HmTwtj82BNQzSnDDg1W1lvU1JrA==',
            clientProof: 'iuCo00BHgTVw4808ZU4EIESZhRR4BV8CQoNu8sZJ270hdz2ufRge7/Xpr8hdt08qoNCbDXT0M333d6CeyymLeMcWo7Lr13nGHzmoB5iRSjIjcmROHSD5YkjGAsCejnvoS2Pr0TzGKa32lBwYaxLEuT2162q98N6HpqpYNo2Iuvsd11gx1g9YJiLR7VESiD93NutcZIFta5M0vUQIBvzPI88Ev77d2CoEPyNFZctqcKxeZYsACN+JLq2sw+ME9sIPoSpujn6v6fK9NDSq/tldQmZ/upjFrXMhoLpxwK/daepvHHzfFVv8BbRrXJ2YH9jGPtJPVTUxUqnA2Lu1jBk+nw==',
            expectedServerProof: 'ZBdnSNfaP4mgqNoh//ZJgqbsuxBNqSDL+tEPSH7b1wYlamdXNzz1pnp7G1QRBmvSgksdrSQaTZR575hIZ9UbWZNB7qP2opgHKeQATtE69sIgC4ehBF4HZzX2hr/4WC9Q5U0XOdM+1/KWEtVCNjwkmdXJ/3jjRbPH+d2K1yNGAo0iAjTBkIrY5l3FwgDLREKxVZyMyp6CTqzY4XMNY29r/URs+WH+45j4OFOOzhtxE4BoHXTtIPAr6gMTaZ/GsXtDvdBWHZQAYL/lIoQk+BdJhm2riy+OXRwEu0CzMo7JhbbZUbmLDf8gqQFteQnlGdPJD+SEiQC8ebJv4RbbUGnD1g==',
            // eslint-disable-next-line max-len
            sharedSession: new Uint8Array([232, 138, 48, 101, 47, 10, 241, 220, 72, 46, 138, 53, 109, 224, 110, 199, 82, 78, 121, 186, 176, 217, 74, 235, 109, 115, 239, 55, 231, 173, 71, 100, 48, 42, 27, 154, 125, 254, 69, 244, 17, 161, 184, 143, 191, 248, 135, 102, 4, 144, 200, 240, 170, 189, 139, 106, 15, 106, 80, 55, 195, 98, 77, 203, 0, 123, 24, 88, 130, 151, 83, 26, 68, 25, 11, 243, 179, 9, 183, 247, 210, 38, 153, 156, 163, 201, 86, 94, 227, 103, 114, 102, 173, 36, 178, 34, 1, 191, 98, 29, 230, 191, 32, 132, 72, 182, 7, 40, 14, 103, 80, 232, 98, 43, 78, 147, 81, 69, 162, 157, 94, 119, 7, 132, 11, 96, 241, 14, 175, 64, 43, 144, 21, 103, 246, 112, 226, 239, 94, 25, 107, 47, 208, 98, 58, 67, 49, 242, 68, 156, 46, 16, 103, 89, 33, 73, 211, 139, 190, 198, 157, 57, 226, 186, 159, 227, 71, 70, 208, 230, 164, 179, 250, 62, 221, 163, 137, 114, 117, 166, 93, 236, 131, 247, 45, 125, 155, 16, 62, 235, 54, 147, 54, 195, 212, 134, 107, 60, 143, 66, 218, 200, 29, 209, 85, 238, 151, 75, 141, 29, 8, 70, 73, 158, 75, 174, 127, 3, 52, 99, 3, 40, 5, 159, 91, 208, 54, 123, 75, 89, 158, 187, 156, 179, 158, 100, 116, 101, 240, 81, 87, 249, 206, 198, 1, 243, 95, 159, 22, 42, 162, 131, 231, 45, 215, 68])
        });
    });

    it('should reject auth if it is unable to verify server', async () => {
        const promise = getSrp({ Modulus: SERVER_MODULUS_FAKE }, { password: '123' });
        await assert.rejects(promise, {
            name: 'Error',
            message: 'Unable to verify server identity'
        });
    });
});
