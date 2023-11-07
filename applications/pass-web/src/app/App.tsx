import { c } from 'ttag';

import './app.scss';

const App = () => {
    return (
        <>
            <div className="text-bold text-4xl text-center w-full py-14">{c('Info').t`Hello from Pass web app`}</div>
            <div className="text-xl text-center w-full h-full pb-14">{c('Info').t`Comming soon...`}</div>
        </>
    );
};

export default App;
