import { LabelStack } from '@proton/components';

import mdx from './LabelStack.mdx';

export default {
    component: LabelStack,
    title: 'Components/Label Stack',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const labelList = [
    { color: '#8080FF', title: 'electron' },
    { color: '#EC3E7C', title: 'muon' },
    { color: '#DB60D6', title: 'tau' },
    { color: '#415DF0', title: 'neutrino' },
    { color: '#179FD9', title: 'z boson' },
    { color: '#1DA583', title: 'w boson' },
    { color: '#3CBB3A', title: 'quark' },
    { color: '#B4A40E', title: 'higgs' },
    { color: '#936D58', title: 'photon' },
    { color: '#F78400', title: 'gluon' },
].map(({ color, title }) => ({
    title,
    name: title,
    color: color,
}));

const labelListWithHandlers = labelList.map((label) => ({
    ...label,
    onClick() {
        alert(`You clicked on "${label.name}"`);
    },
    onDelete() {
        alert(`You deleted "${label.name}"`);
    },
}));

export const Basic = () => <LabelStack labels={labelList} />;

export const Clickable = () => <LabelStack labels={labelListWithHandlers} />;

export const WithDelete = () => <LabelStack labels={labelListWithHandlers} showDelete />;

export const Stacked = () => (
    <div className="flex justify-space-between">
        <LabelStack labels={labelList} isStacked leftToRight />
        <LabelStack labels={labelList} isStacked />
    </div>
);

export const Max = () => <LabelStack labels={labelList} maxNumber={5} />;

export const Dropdown = () => <LabelStack labels={labelListWithHandlers} showDropDown />;
