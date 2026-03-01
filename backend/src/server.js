import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import receiptProxyRoutes from './proxy/receiptProxy.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

app.use(express.json());
app.use('/api/receipts', receiptProxyRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
