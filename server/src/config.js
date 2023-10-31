import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = `${__dirname}/../../.env`;

if (fs.existsSync(filePath)) {
	dotenv.config({ path: `${__dirname}/../../.env` });
} else {
	const cutPoint = __dirname.indexOf('actions-runner');
	dotenv.config({ path: `${__dirname.substring(0, cutPoint)}/env/rulers.env` });
}
