import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import collectionRoutes from './routes/collectionRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';

import globalErrorHandler from './controllers/errorController.js';
import APIError from './helpers/APIError.js';

const app = express();

app.use(cors());
app.use(express.json());

if (process.env.ENV === 'dev') app.use(morgan('dev'));

app.use(`/api/${process.env.API_VERSION}/auth`, authRoutes);
app.use(`/api/${process.env.API_VERSION}/collections`, collectionRoutes);
app.use(`/api/${process.env.API_VERSION}/trades`, tradeRoutes);

app.all('*', (req, res, next) => {
	next(new APIError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
