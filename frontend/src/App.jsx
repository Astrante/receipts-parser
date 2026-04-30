import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QRScanner } from './presentation/components/QRScanner/QRScanner.jsx';
import { ReceiptList } from './presentation/components/ReceiptList/ReceiptList.jsx';
import { ReceiptDetail } from './presentation/components/ReceiptDetail/ReceiptDetail.jsx';
import { SplitReceipt } from './presentation/components/SplitReceipt/SplitReceipt.jsx';
import { SharedReceipt } from './presentation/components/SharedReceipt/SharedReceipt.jsx';
import { useReceiptStore } from './store/receiptStore.js';
import { useEffect } from 'react';

function App() {
  const { loadReceipts } = useReceiptStore();

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-beige">
        <nav className="bg-forest shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <h1 className="text-lg font-bold text-beige">Receipt Parser</h1>
          </div>
        </nav>

        <main className="py-4">
          <Routes>
            <Route path="/" element={<ReceiptList />} />
            <Route path="/scan" element={<QRScanner />} />
            <Route path="/receipt/:id" element={<ReceiptDetail />} />
            <Route path="/receipt/:id/split" element={<SplitReceipt />} />
            <Route path="/shared/:data" element={<SharedReceipt />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
