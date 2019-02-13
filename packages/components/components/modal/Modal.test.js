import React, { Component } from 'react';
import renderer from 'react-test-renderer';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Modal from './Modal';
import Button from '../button/Button';

class myModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            show: true
        };
    }

    handleClose = () => {
        this.setState({ show: false });
    }

    render() {
        return (
            <Modal onClose={this.handleClose} show={this.state.show}>
                <Button onClick={this.handleClose}>Close</Button>
            </Modal>
        );
    }
}

Enzyme.configure({ adapter: new Adapter() });

fdescribe('Modal', () => {
    const wrapper = shallow(myModal());

    it('renders without crashing', () => {
        expect(wrapper.find(Button).shallow().text()).toBe('Close');
    });

    it('should close the modal by clicking on the button', () => {
        wrapper.find(Button).simulate('click');
        expect(wrapper.find(Button).exists()).toBe(false);
    });

    test('has a valid snapshot', () => {
        const component = renderer.create(myModal());
        const tree = component.toJSON();

        expect(tree).toMatchSnapshot();
    });
})