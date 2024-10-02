import { removeLineBreaks } from 'proton-mail/helpers/string';
import { transformAnchors } from 'proton-mail/helpers/transforms/transforAnchors';

describe('transformAnchors', () => {
    const id = 'linkId';

    it('should transform parent anchor in span', () => {
        // Links are nested
        const expectedContent = `<span id="${id}">
<div>Some content</div>
<a href="#${id}">Here is a link to the top of the section</a>
</span>`;

        /**
         * I had to trick the code a bit in that case. If I put nested links in innerHTML, they will be automatically fixed,
         * which makes the test impossible. Instead, I had to append each child manually
         *
         * Using innerHTML, the following:
         * <a id="${id}">
         *      <div>Some content</div>
         *      <a href="#${id}">Here is a link to the top of the section</a>
         * </a>
         *
         * was transformed into:
         * <a id="${id}">
         *      <div>Some content</div>
         * </a>
         * <a href="#${id}">Here is a link to the top of the section</a>
         */

        // Create the container
        const doc = document.createElement('DIV');

        // Create the outer <a> element
        const outerLink = document.createElement('a');
        outerLink.setAttribute('id', id);

        // Create the <div> element and add content inside it
        const div = document.createElement('div');
        div.textContent = 'Some content';

        // Append the <div> to the outer <a>
        outerLink.appendChild(div);

        // Create the inner <a> element with href and content
        const innerLink = document.createElement('a');
        innerLink.setAttribute('href', `#${id}`);
        innerLink.textContent = 'Here is a link to the top of the section';

        // Manually append the inner <a> to the outer <a>
        outerLink.appendChild(innerLink);

        // Add the content into the document
        doc.appendChild(outerLink);

        transformAnchors(doc);
        expect(removeLineBreaks(doc.innerHTML)).toEqual(removeLineBreaks(expectedContent));
    });

    it('should not transform anchor in span', () => {
        // Links are not nested
        const content = `<a id="${id}"></a>
<div>Some content</div>
<a href="#${id}">Here is a link to the top of the section</a>
`;

        const doc = document.createElement('DIV');
        doc.innerHTML = content;

        transformAnchors(doc);
        expect(doc.innerHTML).toEqual(content);
    });
});
