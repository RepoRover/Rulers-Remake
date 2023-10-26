import { v4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import Busboy from 'busboy';

const uploadAvatarMiddleware = (req, res, next) => {
	if (!req.headers['content-type'].startsWith('multipart/')) {
		return next(new Error('Request is not multipart, please upload a file.'));
	}

	const busboy = Busboy({
		headers: req.headers,
		limits: {
			fileSize: 3 * 1024 * 1024, // 3MB in bytes
			files: 1
		}
	});

	const saveToPath = path.join(__dirname, './../../../src/assets/users/'); // Replace `path_to_save_files` with the desired path

	busboy.on('file', (fieldname, event, fileMeta) => {
		const allowedMimetypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

		if (!allowedMimetypes.includes(fileMeta.mimeType)) {
			return next(new Error('Unsupported file type.'));
		}

		const newFilename = `${v4()}${path.extname(fileMeta.filename)}`; // Get the original name of the file
		const saveTo = path.join(saveToPath, newFilename);

		let uploadedBytes = 0; // Initialize a counter for uploaded bytes

		event.on('data', (data) => {
			uploadedBytes += data.length;
			if (uploadedBytes > 3 * 1024 * 1024) {
				// Check the size
				return next(new Error('File size limit exceeded.'));
			}
		});

		event.pipe(fs.createWriteStream(saveTo));

		event.on('end', () => {
			req.file = {
				filename: newFilename
			};
			next();
		});
	});

	busboy.on('finish', () => {
		if (!req.file) {
			return next(new Error('No file uploaded.'));
		}
	});

	req.pipe(busboy);
};

export default uploadAvatarMiddleware;
