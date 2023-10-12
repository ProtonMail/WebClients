import ReactDOM from 'react-dom';

import '@proton/pass/styles/common.scss';

import { Onboarding } from './Onboarding';

const root = document.getElementById('root') as HTMLElement;
ReactDOM.render(<Onboarding />, root);
