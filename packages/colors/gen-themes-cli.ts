import { main } from './gen-themes';
import config from './themes.config';

config.forEach((config) => {
    main(config);
    console.log('created', config.output);
});
