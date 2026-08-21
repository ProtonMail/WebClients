import { useContext } from 'react';

import rightToLeftContext from './rightToLeftContext';

const useRightToLeft = () => useContext(rightToLeftContext);

export default useRightToLeft;
