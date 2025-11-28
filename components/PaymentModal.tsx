
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check, ShieldCheck, Zap, Lock, Star } from 'lucide-react';

const PaymentModal: React.FC = () => {
    const { closePaymentModal, upgradeToPro, paymentTrigger } = useApp();
    const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handlePayment = () => {
        if(navigator.vibrate) navigator.vibrate(20);
        setIsProcessing(true);

        // Simulate network request
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
            if(navigator.vibrate) navigator.vibrate([50, 50, 50]);
            
            setTimeout(() => {
                upgradeToPro();
            }, 1500);
        }, 2000);
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
                <div className="bg-white dark:bg-[#121212] w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-pop shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                        <Check className="w-10 h-10 text-white" strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Welcome to Pro!</h2>
                    <p className="text-slate-500 dark:text-zinc-400 mb-6">Your payment was successful. You now have full access to InvestMate Premium.</p>
                    <div className="w-full h-1 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 animate-[progress_1.5s_ease-out_forwards] w-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-[#121212] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative border border-slate-100 dark:border-white/10 flex flex-col max-h-[90vh]">
                
                {/* Header with trigger context */}
                <div className="bg-gradient-to-br from-brand-600 to-indigo-700 p-6 text-white relative shrink-0">
                    <button onClick={closePaymentModal} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="inline-flex items-center space-x-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-3 border border-white/20">
                        <Lock className="w-3 h-3" />
                        <span>Unlock Premium</span>
                    </div>
                    <h2 className="text-2xl font-black leading-tight mb-1">Upgrade to InvestMate Pro</h2>
                    <p className="text-indigo-100 text-sm font-medium opacity-90">
                        {paymentTrigger || "Unlock the full potential of your trading."}
                    </p>
                </div>

                <div className="p-6 overflow-y-auto">
                    {/* Benefits List */}
                    <div className="space-y-4 mb-6">
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-xl text-green-600 dark:text-green-400 shrink-0">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Real-time Trade Signals</h3>
                                <p className="text-xs text-slate-500 dark:text-zinc-500">Instant entry, target, and stop-loss levels from top Gurus.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
                                <Star className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Premium Clubs</h3>
                                <p className="text-xs text-slate-500 dark:text-zinc-500">Access exclusive "Inner Circle" communities and chats.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-xl text-orange-600 dark:text-orange-400 shrink-0">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Unlimited Audio Rooms</h3>
                                <p className="text-xs text-slate-500 dark:text-zinc-500">Listen to live market commentary without time limits.</p>
                            </div>
                        </div>
                    </div>

                    {/* Plan Selection */}
                    <div className="bg-slate-50 dark:bg-white/5 p-1.5 rounded-2xl flex mb-6">
                        <button 
                            onClick={() => setPlan('monthly')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${plan === 'monthly' ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-500'}`}
                        >
                            Monthly
                            <div className="text-[10px] opacity-70">₹899/mo</div>
                        </button>
                        <button 
                            onClick={() => setPlan('yearly')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all relative ${plan === 'yearly' ? 'bg-white dark:bg-dark-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-500'}`}
                        >
                            Yearly
                            <div className="text-[10px] opacity-70">₹599/mo</div>
                            <span className="absolute -top-2 -right-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm">SAVE 33%</span>
                        </button>
                    </div>

                    {/* Action Button */}
                    <button 
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                             <span className="flex items-center">
                                 <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></span>
                                 Processing...
                             </span>
                        ) : (
                            <span>Start 7-Day Free Trial</span>
                        )}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-3">Cancel anytime. Secure payment via Stripe.</p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
