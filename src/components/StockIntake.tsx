import React, { useState, useRef, useEffect } from 'react';
import { Product, Batch, Category } from '../types';
import { ScanLine, Plus, Camera, X, Loader2, Calendar as CalendarIcon, Hash } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface StockIntakeProps {
  products: Product[];
  onAddBatch: (batch: Batch, newProduct?: Product) => void;
}

const StockIntake: React.FC<StockIntakeProps> = ({ products, onAddBatch }) => {
  const [barcode, setBarcode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('');
  
  // New product form state
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Category>(Category.Household);
  const [newPrice, setNewPrice] = useState('');

  // Camera & AI State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // --- Camera Lifecycle Management ---
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const enableCamera = async () => {
      try {
        // Check if we're in a secure context (HTTPS or localhost)
        const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        
        if (!isSecureContext) {
          throw new Error("HTTPS_REQUIRED");
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Camera API not supported in this browser");
        }

        // Try environment (rear) camera first, fallback to any if failed
        let mediaStream;
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
        } catch (err) {
            console.warn("Rear camera not found, trying fallback...", err);
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: true 
            });
        }

        activeStream = mediaStream;
        setStream(mediaStream);
      } catch (err: any) {
        console.error("Camera Access Error:", err);
        setIsCameraOpen(false); // Close modal on error
        
        if (err.message === 'HTTPS_REQUIRED') {
          alert("Camera requires HTTPS connection.\n\nSolutions:\n1. Use ngrok: npx ngrok http 4173\n2. Access via localhost on your phone\n3. Deploy to a service with HTTPS\n\nSee CAMERA_SETUP.md for details.");
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
           alert("Permission denied. Please allow camera access in your browser settings (icon in address bar).");
        } else if (err.name === 'NotFoundError') {
           alert("No camera device found.");
        } else {
           alert(`Camera error: ${err.message || 'Could not start camera'}`);
        }
      }
    };

    if (isCameraOpen) {
      enableCamera();
    }

    // Cleanup function: stops tracks when modal closes or component unmounts
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
    };
  }, [isCameraOpen]);

  // Attach stream to video element once both exist
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isCameraOpen]);

  const startCamera = () => setIsCameraOpen(true);
  const stopCamera = () => setIsCameraOpen(false);

  const handleBarcodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;
    findProductByBarcode(barcode);
  };

  const findProductByBarcode = (code: string) => {
    const found = products.find(p => p.barcode === code);
    if (found) {
      setSelectedProduct(found);
      setIsNewProduct(false);
    } else {
      setSelectedProduct(null);
      setIsNewProduct(true);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    const context = canvasRef.current.getContext('2d');
    if (context) {
      // Set canvas size to match video source resolution
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      const base64Image = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
      
      try {
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
              { text: "Analyze this retail product image. Extract the Barcode (numbers), the Expiry Date (YYYY-MM-DD), the Product Name, and Category. If you can't clearly see the date, estimate or leave null." }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                barcode: { type: Type.STRING },
                expiryDate: { type: Type.STRING },
                productName: { type: Type.STRING },
                category: { type: Type.STRING, enum: Object.values(Category) },
              },
              required: ["barcode"]
            }
          }
        });

        const result = JSON.parse(response.text);
        
        if (result.barcode) {
          setBarcode(result.barcode);
          findProductByBarcode(result.barcode);
        }
        
        if (result.expiryDate) {
          setExpiryDate(result.expiryDate);
        }

        if (result.productName && !products.find(p => p.barcode === result.barcode)) {
            setNewName(result.productName);
        }
        
        if (result.category && !products.find(p => p.barcode === result.barcode)) {
            setNewCategory(result.category as Category);
        }

        stopCamera();

      } catch (error) {
        console.error("AI Analysis failed", error);
        alert("Could not analyze image. Please try again.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  // --- Form Handling ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expiryDate || !quantity) return;
    
    const batchId = `batch-${Date.now()}`;
    const newBatch: Batch = {
      id: batchId,
      barcode: barcode,
      expiryDate: expiryDate,
      quantity: parseInt(quantity),
      status: 'active',
      addedDate: new Date().toISOString().split('T')[0]
    };

    let productToAdd: Product | undefined = undefined;

    if (isNewProduct) {
      if (!newName) return;
      productToAdd = {
        barcode: barcode,
        name: newName,
        category: newCategory,
        price: parseFloat(newPrice) || 0
      };
    }

    onAddBatch(newBatch, productToAdd);
    resetForm();
  };

  const resetForm = () => {
    setBarcode('');
    setSelectedProduct(null);
    setExpiryDate('');
    setQuantity('');
    setIsNewProduct(false);
    setNewName('');
    setNewPrice('');
    barcodeInputRef.current?.focus();
  };

  // Quick date helpers
  const setDateRelative = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setExpiryDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
         <h2 className="text-2xl font-bold text-slate-800">Stock Intake</h2>
         <p className="text-slate-500">Scan barcode manually or use AI Camera.</p>
      </div>

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-black rounded-2xl overflow-hidden aspect-[3/4] shadow-2xl border border-slate-700">
             <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
             />
             <canvas ref={canvasRef} className="hidden" />
             
             {/* Overlays */}
             <div className="absolute inset-0 border-2 border-blue-500/30 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-2 border-blue-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                <p className="absolute top-[60%] left-0 right-0 text-center text-white/80 text-sm font-medium drop-shadow-md">
                  Position product & date in box
                </p>
             </div>

             <button 
               onClick={stopCamera}
               className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 z-10"
             >
               <X size={24} />
             </button>

             <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
               <button
                 onClick={captureAndAnalyze}
                 disabled={isAnalyzing || !stream}
                 className="w-20 h-20 bg-white rounded-full border-4 border-blue-500 flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
               >
                 {isAnalyzing ? <Loader2 className="animate-spin text-blue-600" size={32} /> : <div className="w-16 h-16 bg-blue-500 rounded-full border-2 border-white" />}
               </button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
        
        {/* Step 1: Scan / Identify */}
        <form onSubmit={handleBarcodeSearch} className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">Product Barcode</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startCamera}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 rounded-xl flex items-center justify-center border border-slate-200 transition-colors"
              title="Use AI Camera"
            >
               <Camera size={20} />
            </button>
            <div className="relative flex-1">
              <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                ref={barcodeInputRef}
                type="text" 
                value={barcode}
                onChange={(e) => {
                    setBarcode(e.target.value);
                    if (selectedProduct || isNewProduct) {
                        setSelectedProduct(null);
                        setIsNewProduct(false);
                    }
                }}
                placeholder="Scan or type barcode..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-lg"
                autoComplete="off"
              />
            </div>
            <button 
                type="submit"
                disabled={!barcode}
                className="bg-slate-900 text-white px-6 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
                Find
            </button>
          </div>
        </form>

        {/* Step 2: Product Details (Found or New) */}
        {(selectedProduct || isNewProduct) && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
               {selectedProduct ? (
                 <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-blue-900">{selectedProduct.name}</h3>
                        <p className="text-blue-600 text-sm">{selectedProduct.category} • £{selectedProduct.price.toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded font-mono">
                        {selectedProduct.barcode}
                    </div>
                 </div>
               ) : (
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                        <Plus size={18} />
                        <span className="font-bold text-sm">New Product Detected</span>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Product Name</label>
                        <input 
                            type="text" 
                            required
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="w-full p-2 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="e.g. Heinz Beans 415g"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Category</label>
                            <select 
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value as Category)}
                                className="w-full p-2 border border-blue-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 text-sm"
                            >
                                {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Price (£)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={newPrice}
                                onChange={e => setNewPrice(e.target.value)}
                                className="w-full p-2 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expiry Date */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Expiry Date</label>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="date" 
                            required
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => setDateRelative(3)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full">+3 days</button>
                        <button type="button" onClick={() => setDateRelative(7)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full">+1 week</button>
                        <button type="button" onClick={() => setDateRelative(30)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full">+1 month</button>
                    </div>
                </div>

                {/* Quantity */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="number" 
                            required
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 12"
                        />
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => setQuantity("6")} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full">6</button>
                        <button type="button" onClick={() => setQuantity("12")} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full">12</button>
                        <button type="button" onClick={() => setQuantity("24")} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full">24</button>
                    </div>
                </div>
            </div>

            <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform active:scale-[0.98]"
            >
                Confirm & Add Stock
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default StockIntake;

