/**
 * ConsenTide API Gateway
 * RESTful API for GDPR consent management
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { consentRouter } from './routes/consent';
import { userRouter } from './routes/user';
import { controllerRouter } from './routes/controller';
import { complianceRouter } from './routes/compliance';
import { governanceRouter } from './routes/governance';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ConsenTide API Gateway',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/v1/consent', consentRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/controllers', controllerRouter);
app.use('/api/v1/compliance', complianceRouter);
app.use('/api/v1/governance', governanceRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: Date.now()
  });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 ConsenTide API Gateway running on port ${PORT}`);
  logger.info(`📖 API Documentation: http://localhost:${PORT}/api/v1`);
});

export default app;
