import React from 'react';
import renderer from 'react-test-renderer';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Dropdown from './Dropdown';
import Button from '../button/Button';

const myDropdown = () => {
    return (
        <Dropdown content="Profile">
            <input />
        </Dropdown>
    );
};

Enzyme.configure({ adapter: new Adapter() });

describe('Dropdown', () => {
    const wrapper = shallow(myDropdown());

    it('renders without crashing', () => {
        expect(wrapper.find(Button).shallow().text()).toBe('Profile');
        expect(wrapper.find('input').exists()).toBe(false);
    });

    it('should display the children input after a click on the button', () => {
        wrapper.find(Button).simulate('click');
        expect(wrapper.find('input').exists()).toBe(true);
    });

    // it('should close the dropdown if we click outside', () => {
    //     wrapper.find('.outside').simulate('click');
    //     expect(wrapper.find('input').exists()).toBe(false);
    // });

    test('has a valid snapshot', () => {
        const component = renderer.create(myDropdown());
        const tree = component.toJSON();

        expect(tree).toMatchSnapshot();
    });
});