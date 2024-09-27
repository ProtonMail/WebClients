import InlineLinkButton from '@proton/atoms/InlineLinkButton/InlineLinkButton';

import mdx from './InlineLinkButton.mdx';

export default {
    component: InlineLinkButton,
    title: 'components/InlineLinkButton',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => (
    <InlineLinkButton onClick={() => alert('See? This is a real button.')}>text content</InlineLinkButton>
);

export const Example = () => (
    <p>
        Mr. Levet this day shewed me Dr. Johnsonʼs library, which was contained in two garrets{' '}
        <InlineLinkButton onClick={() => alert('See? This is a real button.')}>over his Chambers</InlineLinkButton>,
        where Lintot, son of the celebrated bookseller of that name, had formerly his warehouse. I found a number of
        good books, but very dusty and in great confusion. The floor was strewed with manuscript leaves, in Johnsonʼs
        own handwriting, which I beheld with a degree of veneration, supposing they perhaps might contain portions of
        The Rambler or of Rasselas. I observed an apparatus for{' '}
        <InlineLinkButton onClick={() => alert('See? This is a real button.')}>chymical experiments</InlineLinkButton>,
        of which Johnson was all his life very fond. The place seemed to be very favourable for{' '}
        <InlineLinkButton onClick={() => alert('See? This is a real button.')}>
            retirement and meditation
        </InlineLinkButton>
        . Johnson told me, that he went up thither without mentioning it to his servant, when he wanted to study, secure
        from interruption; for he would not allow his servant to say he was not at home when he really was. "A servantʼs
        strict regard for truth, — said he — must be weakened by such a practice. that it is merely a form of denial{' '}
        <InlineLinkButton onClick={() => alert('See? This is a real button.')}>A philosopher may know</InlineLinkButton>
        ; but few servants are such nice distinguishers. If I accustom a servant to tell a lie for ME, have I not reason
        to apprehend that he will tell many lies for HIMSELF."
    </p>
);
