import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import { router as choreRouter } from './chores/chore.routes';
import { router as authRouter } from './auth/auth.routes';

const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// routes
app.use('/auth', authRouter);
app.use('/chores', choreRouter);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

// basic socket linkage
io.on('connection', socket => {
  console.log('Socket connected', socket.id);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));