import React from 'react';
import PropTypes from 'prop-types';
import { render } from 'react-testing-library';
import ObserverSections from './ObserverSections';
import { Bordered } from 'react-components';

const dummyText =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pretium enim nec massa fringilla, ac ultrices tortor posuere. Fusce sed quam vitae arcu pharetra congue. Quisque in elementum nibh.';
const repeatText = (text, n) => {
    return Array(n)
        .fill(text)
        .reduce((acc, cur) => cur + acc, '');
};

const DummyComponent = ({ index, text }) => {
    return <div>{repeatText(text, index)}</div>;
};
DummyComponent.propTypes = {
    index: PropTypes.number,
    text: PropTypes.string,
    id: PropTypes.string
};

describe('ObserverSections component', () => {
    it('should render the observer sections properly', () => {
        const { container } = render(
            <ObserverSections granularity={20} wait={500}>
                <DummyComponent index={1} text={dummyText} id="section1" />
                <DummyComponent index={2} text={dummyText} id="section2" />
                <DummyComponent index={3} text={dummyText} id="section3" />
                <DummyComponent index={4} text={dummyText} id="section4" />
                <DummyComponent index={5} text={dummyText} id="section5" />
            </ObserverSections>
        );

        const sections = [].slice.call(container.querySelectorAll('section'));

        expect(sections.length).toBe(5);

        sections.forEach((section, index) => {
            expect(section.getAttribute('id')).toBe(`section${index + 1}`);
            expect(section.textContent).toBe(repeatText(dummyText, index + 1));
        });
    });

    it('should observe a generic component (e. g. Bordered component)', () => {
        const { container } = render(
            <ObserverSections>
                <Bordered id="bordered">
                    <h1>A bordered section</h1>
                </Bordered>
            </ObserverSections>
        );

        const sections = [].slice.call(container.querySelectorAll('section'));

        expect(sections.length).toBe(1);
        expect(sections[0].getAttribute('id')).toBe('bordered');
    });

    it('should throw an error if it has no children', () => {
        expect(() => {
            render(<ObserverSections />);
        }).toThrowError();
    });

    it('should throw an error if some child has no id', () => {
        expect(() => {
            render(
                <ObserverSections granularity={20} wait={500}>
                    <DummyComponent index={1} text={dummyText} id="section1" />
                    <DummyComponent index={2} text={dummyText} id="section2" />
                    <DummyComponent index={3} text={dummyText} />
                    <DummyComponent index={4} text={dummyText} id="section4" />
                    <DummyComponent index={5} text={dummyText} id="section5" />
                </ObserverSections>
            );
        }).toThrowError('All sections to be observed need an id');
    });
});
