import { styleText } from 'util';

export const logIntro = (name: string) => {
    console.info('\n');
    console.log();
    console.info(
        `${styleText(['yellowBright', 'bold'], '⚛')} Creating ${styleText(['yellowBright', 'bold'], name)} atom`
    );
    console.info('\n');
};

export const logItemCompletion = (successText: string) => {
    console.info(`${styleText(['green'], '✓')} ${successText}`);
};

export const logConclusion = () => {
    console.info('\n');
    console.info(styleText(['green', 'bold'], 'Atom created! 🚀'));
    console.info('\n');
};

export const logComponentCreationError = (componentName: string) => {
    console.info(`${styleText(['redBright', 'bold'], componentName)} already exists.`);
};
