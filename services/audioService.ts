
import { AudioRoomSpeaker, TranscriptSegment } from "../types";

type LevelCallback = (speakerId: string, level: number) => void;
type TranscriptCallback = (segment: TranscriptSegment) => void;

class AudioService {
    private levelInterval: any = null;
    private transcriptInterval: any = null;
    private levelListeners: LevelCallback[] = [];
    private transcriptListeners: TranscriptCallback[] = [];
    private activeSpeakers: AudioRoomSpeaker[] = [];

    connect(speakers: AudioRoomSpeaker[]) {
        this.activeSpeakers = speakers;
        this.startSimulation();
    }

    disconnect() {
        if (this.levelInterval) clearInterval(this.levelInterval);
        if (this.transcriptInterval) clearInterval(this.transcriptInterval);
        this.activeSpeakers = [];
    }

    updateSpeakers(speakers: AudioRoomSpeaker[]) {
        this.activeSpeakers = speakers;
    }

    onAudioLevel(callback: LevelCallback) {
        this.levelListeners.push(callback);
        return () => {
            this.levelListeners = this.levelListeners.filter(cb => cb !== callback);
        };
    }

    onTranscript(callback: TranscriptCallback) {
        this.transcriptListeners.push(callback);
        return () => {
            this.transcriptListeners = this.transcriptListeners.filter(cb => cb !== callback);
        };
    }

    private startSimulation() {
        // 1. Simulate Audio Levels (Speaking Animation)
        this.levelInterval = setInterval(() => {
            // Randomly pick one speaker to be "dominant"
            const talkingSpeaker = this.activeSpeakers.find(s => s.role !== 'LISTENER' && !s.isMuted && Math.random() > 0.6);
            
            if (talkingSpeaker) {
                this.levelListeners.forEach(cb => cb(talkingSpeaker.id, Math.random() * 100)); // Emit high level
            }

            // Occasionally emit silence or low noise for others
            this.activeSpeakers.forEach(s => {
                if (s !== talkingSpeaker && s.role !== 'LISTENER') {
                     this.levelListeners.forEach(cb => cb(s.id, Math.random() * 10)); // Low noise
                }
            });

        }, 200);

        // 2. Simulate AI Transcription
        const phrases = [
            "If you look at the 15-minute chart, Nifty is forming a double bottom.",
            "I think the banking sector is going to drag the index down today.",
            "Does anyone have a view on Reliance results?",
            "Exactly, the open interest data suggests a short covering rally.",
            "Let's wait for the candle to close above 19,500.",
            "Good morning everyone, thanks for joining the pre-market session.",
            "The Fed minutes are going to be crucial tonight.",
            "I am seeing huge volume in midcaps right now."
        ];

        this.transcriptInterval = setInterval(() => {
            const speaker = this.activeSpeakers.find(s => s.role !== 'LISTENER' && !s.isMuted);
            if (speaker && Math.random() > 0.7) {
                const text = phrases[Math.floor(Math.random() * phrases.length)];
                const segment: TranscriptSegment = {
                    id: Date.now().toString(),
                    userId: speaker.userId,
                    userName: speaker.user.name,
                    text: text,
                    timestamp: new Date().toLocaleTimeString()
                };
                this.transcriptListeners.forEach(cb => cb(segment));
            }
        }, 4000);
    }
}

export const audioService = new AudioService();
