import { render } from '@testing-library/react';

import noop from '@proton/utils/noop';

import RadioGroup from './RadioGroup';

describe('<RadioGroup />', () => {
    it('should be able to render multiple radio groups', () => {
        const { container } = render(
            <>
                <RadioGroup
                    name="a"
                    onChange={noop}
                    value={2}
                    options={[
                        { value: 1, label: '1' },
                        { value: 2, label: '2' },
                    ]}
                />
                <RadioGroup
                    name="b"
                    onChange={noop}
                    value={1}
                    options={[
                        { value: 1, label: '1' },
                        { value: 2, label: '2' },
                    ]}
                />
            </>
        );
        const inputNodes = container.querySelectorAll('input[type="radio"]');
        const ids = [...inputNodes].map((inputNode) => inputNode.getAttribute('id'));
        expect(ids.length).toBe(4);
        // Deduplicate the ids, ensure they are unique
        const set = new Set(ids);
        expect(set.size).toBe(4);
    });
});
