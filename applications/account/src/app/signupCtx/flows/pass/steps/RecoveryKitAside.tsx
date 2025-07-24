import { memo } from 'react';

import cryptoPatternImage from '../assets/images/crypto_pattern.svg';
import goldenKeyImage from '../assets/images/golden_key.svg';
import hiddenPasswordImage from '../assets/images/hidden_password.svg';

export const RecoveryKitAside = memo(() => (
    <div className="relative">
        <img src={cryptoPatternImage} alt="Pattern image" className="z-0 left-0 top-0" />
        <section
            className="pass-signup-card-glass absolute w-2/10 flex flex-column items-center py-16 px-4 rounded-lg min-w-custom z-1 top-custom left-custom"
            style={{
                '--min-w-custom': '20em',
                transform: 'translate(-50%, -50%)',
                '--top-custom': '50%',
                '--left-custom': '50%',
            }}
        >
            <img src={goldenKeyImage} alt="Key Logo" />
            <img src={hiddenPasswordImage} alt="Hidden password image" className="mt-8" />
        </section>
    </div>
));
