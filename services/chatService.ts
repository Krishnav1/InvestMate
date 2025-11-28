import { ChatMessage } from '../types';
import { CURRENT_USER } from '../constants';

type MessageHandler = (message: ChatMessage) => void;

class ChatService {
  private socket: WebSocket | null = null;
  private listeners: MessageHandler[] = [];
  private isMock: boolean = true;
  private mockInterval: any = null;

  /**
   * Connect to the WebSocket server.
   * If no URL is provided, it falls back to a simulated environment.
   */
  connect(url?: string) {
    if (url) {
        try {
            this.isMock = false;
            this.socket = new WebSocket(url);
            
            this.socket.onopen = () => {
                console.log("Connected to Chat WebSocket");
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.notifyListeners(data);
                } catch (e) {
                    console.error("Failed to parse incoming message", e);
                }
            };

            this.socket.onclose = () => {
                console.log("WebSocket disconnected. Reverting to simulation.");
                this.isMock = true; // Fallback
                this.startMockTraffic();
            };
        } catch (e) {
            console.error("WS Connection failed", e);
            this.isMock = true;
            this.startMockTraffic();
        }
    } else {
        // Mock mode for demo
        this.isMock = true;
        this.startMockTraffic();
    }
  }

  disconnect() {
    if (this.socket) {
        this.socket.close();
        this.socket = null;
    }
    if (this.mockInterval) {
        clearInterval(this.mockInterval);
    }
  }

  sendMessage(text: string) {
    const msg: ChatMessage = {
        id: Date.now().toString(),
        userId: CURRENT_USER.id,
        user: CURRENT_USER,
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(msg));
        // We assume the server broadcasts it back, but for optimistic UI updates we might want to return it
        // For this architecture, we will notify locally immediately
        this.notifyListeners(msg);
    } else {
        // Mock mode: Echo back immediately and simulate reply
        this.notifyListeners(msg);
        
        // Simulate a "bot" or "user" reply to specific keywords
        if (text.toLowerCase().includes('buy') || text.toLowerCase().includes('sell')) {
             setTimeout(() => {
                this.notifyListeners({
                    id: Date.now().toString(),
                    userId: 'bot',
                    user: { ...CURRENT_USER, id: 'bot', name: 'Market Bot', rank: 'Guru', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=market' },
                    text: `Analyzing sentiment for "${text}"... Market appears volatile.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isSystem: true
                });
             }, 1500);
        }
    }
  }

  onMessage(handler: MessageHandler) {
    this.listeners.push(handler);
    return () => {
        this.listeners = this.listeners.filter(h => h !== handler);
    };
  }

  private notifyListeners(msg: ChatMessage) {
    this.listeners.forEach(h => h(msg));
  }

  private startMockTraffic() {
     if (this.mockInterval) clearInterval(this.mockInterval);
     
     const randomPhrases = [
         "Nifty facing resistance at 19500.",
         "Anyone tracking $TATASTEEL?",
         "Volume spike in BankNifty just now!",
         "Global cues looking mixed.",
         "Buying the dip on IT stocks.",
         "Shorting $ADANIENT for intraday.",
         "Gap up opening expected tomorrow?"
     ];

     const randomUsers = [
         { name: "Rahul T", rank: "Novice" as const },
         { name: "Sneha P", rank: "Analyst" as const },
         { name: "Vikram S", rank: "Guru" as const }
     ];

     this.mockInterval = setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance every 3 seconds
            const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
            const text = randomPhrases[Math.floor(Math.random() * randomPhrases.length)];
            
            this.notifyListeners({
                id: Date.now().toString(),
                userId: `u_mock_${Date.now()}`,
                user: { 
                    ...CURRENT_USER, 
                    id: `u_mock_${Date.now()}`, 
                    name: randomUser.name, 
                    rank: randomUser.rank,
                    avatar: `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 100)}`
                },
                text: text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
        }
     }, 3000);
  }
}

export const chatService = new ChatService();