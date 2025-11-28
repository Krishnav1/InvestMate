import React, { useState, useEffect } from 'react';
import { ScanFace, Fingerprint, Lock, Check } from 'lucide-react';

const BiometricAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanSuccess, setScanSuccess] = useState(false);

    useEffect(() => {
        // Auto start scanning on mount
        setTimeout(() => setIsScanning(true), 500);
        
        // Simulate Scan Duration
        setTimeout(() => {
            setIsScanning(false);
            setScanSuccess(true);
            if (navigator.vibrate) navigator.vibrate(20);
        }, 2000);

        // Unlock
        setTimeout(() => {
            setIsAuthenticated(true);
        }, 2800);
    }, []);

    if (isAuthenticated) return <>{children}</>;

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-6 text-white">
            <div className="mb-8 relative">
                {scanSuccess ? (
                    <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center animate-pop shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                        <Check className="w-12 h-12 text-white" />
                    </div>
                ) : (
                    <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center relative overflow-hidden border border-zinc-800">
                        <ScanFace className={`w-12 h-12 text-blue-500 ${isScanning ? 'opacity-50' : 'opacity-100'}`} />
                        {isScanning && (
                             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-[shimmer_1.5s_infinite]"></div>
                        )}
                        {isScanning && (
                             <div className="absolute w-full h-1 bg-blue-500/80 top-0 left-0 shadow-[0_0_15px_rgba(59,130,246,1)] animate-[scan_1.5s_ease-in-out_infinite]"></div>
                        )}
                    </div>
                )}
            </div>

            <h1 className="text-3xl font-black mb-2 tracking-tight">InvestMate</h1>
            <p className="text-zinc-500 text-sm mb-8 font-medium">Secure Community Access</p>

            <div className="flex flex-col items-center space-y-4">
                <p className="text-xs font-mono text-blue-500 tracking-widest uppercase animate-pulse">
                    {scanSuccess ? 'IDENTITY VERIFIED' : isScanning ? 'VERIFYING BIOMETRICS...' : 'INITIALIZING...'}
                </p>
            </div>
            
            <style>{`
                @keyframes scan {
                    0%, 100% { top: 0%; }
                    50% { top: 100%; }
                }
            `}</style>
        </div>
    );
};

export default BiometricAuth;