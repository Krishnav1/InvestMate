
import React, { useState, useEffect } from 'react';
import { generateQuizQuestion } from '../services/geminiService';
import { QuizQuestion } from '../types';
import { X, CheckCircle, XCircle, Trophy, BrainCircuit, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface QuizModalProps {
    onClose: () => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ onClose }) => {
    const { awardXP } = useApp();
    const [loading, setLoading] = useState(true);
    const [questionData, setQuestionData] = useState<QuizQuestion | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);

    useEffect(() => {
        const loadQuestion = async () => {
            const data = await generateQuizQuestion();
            setQuestionData(data);
            setLoading(false);
        };
        loadQuestion();
    }, []);

    const handleOptionClick = (index: number) => {
        if (selectedOption !== null) return; // Prevent changing answer
        setSelectedOption(index);
        
        if (questionData) {
            const correct = index === questionData.correctIndex;
            setIsCorrect(correct);
            setShowExplanation(true);
        }
    };

    const handleClaim = () => {
        if (isCorrect) {
            awardXP(50);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white dark:bg-dark-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative border border-slate-200 dark:border-dark-600 flex flex-col min-h-[400px]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 relative">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-white/70 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="flex items-center space-x-2 text-white/90 mb