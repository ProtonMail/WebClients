import fs from 'fs';
import path from 'path';
import prettier from 'prettier';

const currentPath = process.cwd();

const config = JSON.parse(
    fs.readFileSync(path.join(currentPath, '../../.prettierrc'), { encoding: 'utf-8', flag: 'r' })
);

const prettify = (text: string, parser = 'typescript') => prettier.format(text, { ...config, parser });

export default prettify;
