import vCard from 'vcf';

import { removeProperty } from '../../../src/helpers/vCardProperties';
import uniqEmailSimple from '../../media/vcard/uniqEmailSimple.vcf';

const cardUniqEmailSimple = vCard.parse(uniqEmailSimple)[0];

describe('Helper vCardFields', () => {
    describe('removeProperty', () => {
        it('should remove email property', () => {
            const newCard = removeProperty(cardUniqEmailSimple, 'email', 'item1');
            expect(newCard.get('email')).toBeUndefined();
        });

        it('should not remove email property since the group is not mentionned', () => {
            const newCard = removeProperty(cardUniqEmailSimple, 'email');
            expect(newCard.get('email')).toBeDefined();
        });
    });
});
