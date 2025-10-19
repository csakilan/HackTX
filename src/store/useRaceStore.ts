import { create } from 'zustand';

export interface Driver {
  position: number;
  name: string;
  team: string;
  gap: string;
  interval: string;
  lastLap: string;
  teamColor: string;
  lapTimes: number[];
}

export interface Message {
  id: string;
  sender: 'driver' | 'ai' | 'engineer';
  text: string;
  timestamp: string;
  confidence?: number;
}

export interface Recommendation {
  id: string;
  type: string;
  text: string;
  confidence: number;
  timestamp: string;
}

interface RaceStore {
  drivers: Driver[];
  messages: Message[];
  recommendations: Recommendation[];
  isTranscribing: boolean;
  currentTranscription: string;
  waveformData: number[];
  
  setIsTranscribing: (value: boolean) => void;
  setCurrentTranscription: (text: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  addRecommendation: (recommendation: Omit<Recommendation, 'id' | 'timestamp'>) => void;
  updateWaveform: () => void;
  sendMessage: (messageId: string) => void;
  sendRecommendation: (recId: string) => void;
}

const mockDrivers: Driver[] = [
  { position: 1, name: 'M. VERSTAPPEN', team: 'Red Bull Racing', gap: 'LEADER', interval: '-', lastLap: '1:32.145', teamColor: '#3671C6', lapTimes: [92.5, 92.3, 92.1, 92.0, 91.8] },
  { position: 2, name: 'L. HAMILTON', team: 'Mercedes', gap: '+3.521', interval: '+3.521', lastLap: '1:32.389', teamColor: '#27F4D2', lapTimes: [92.8, 92.6, 92.4, 92.3, 92.2] },
  { position: 3, name: 'C. LECLERC', team: 'Ferrari', gap: '+5.892', interval: '+2.371', lastLap: '1:32.567', teamColor: '#E8002D', lapTimes: [93.0, 92.9, 92.7, 92.5, 92.4] },
  { position: 4, name: 'L. NORRIS', team: 'McLaren', gap: '+8.234', interval: '+2.342', lastLap: '1:32.701', teamColor: '#FF8000', lapTimes: [93.2, 93.0, 92.8, 92.7, 92.5] },
  { position: 5, name: 'C. SAINZ', team: 'Ferrari', gap: '+10.567', interval: '+2.333', lastLap: '1:32.834', teamColor: '#E8002D', lapTimes: [93.4, 93.2, 93.0, 92.9, 92.7] },
  { position: 6, name: 'S. PEREZ', team: 'Red Bull Racing', gap: '+12.123', interval: '+1.556', lastLap: '1:32.901', teamColor: '#3671C6', lapTimes: [93.5, 93.3, 93.1, 93.0, 92.8] },
  { position: 7, name: 'G. RUSSELL', team: 'Mercedes', gap: '+15.234', interval: '+3.111', lastLap: '1:33.056', teamColor: '#27F4D2', lapTimes: [93.7, 93.5, 93.3, 93.2, 93.0] },
  { position: 8, name: 'F. ALONSO', team: 'Aston Martin', gap: '+18.456', interval: '+3.222', lastLap: '1:33.234', teamColor: '#229971', lapTimes: [94.0, 93.8, 93.6, 93.4, 93.2] },
  { position: 9, name: 'O. PIASTRI', team: 'McLaren', gap: '+20.789', interval: '+2.333', lastLap: '1:33.401', teamColor: '#FF8000', lapTimes: [94.2, 94.0, 93.8, 93.6, 93.4] },
  { position: 10, name: 'P. GASLY', team: 'Alpine', gap: '+23.567', interval: '+2.778', lastLap: '1:33.589', teamColor: '#FF87BC', lapTimes: [94.5, 94.3, 94.1, 93.9, 93.7] },
];

const initialMessages: Message[] = [
  { id: '1', sender: 'driver', text: 'Tires feeling good, bit of understeer in Turn 3', timestamp: '14:32:15', confidence: undefined },
  { id: '2', sender: 'ai', text: 'Confirmed understeer Turn 3. Suggest front wing +1 next stop.', timestamp: '14:32:16', confidence: 87 },
  { id: '3', sender: 'driver', text: 'Copy that. How are we looking on strategy?', timestamp: '14:34:22', confidence: undefined },
  { id: '4', sender: 'ai', text: 'Optimal pit window opens Lap 23. Medium compound recommended.', timestamp: '14:34:23', confidence: 94 },
];

const initialRecommendations: Recommendation[] = [
  { id: 'r1', type: 'Strategy', text: 'Box Lap 23 for Medium tires - optimal pit window', confidence: 94, timestamp: '14:34:23' },
  { id: 'r2', type: 'Setup', text: 'Front wing +1 click to reduce understeer Turn 3', confidence: 87, timestamp: '14:32:16' },
  { id: 'r3', type: 'Pace', text: 'Target lap time: 1:32.5 to maintain P1', confidence: 91, timestamp: '14:30:45' },
];

export const useRaceStore = create<RaceStore>((set, get) => ({
  drivers: mockDrivers,
  messages: initialMessages,
  recommendations: initialRecommendations,
  isTranscribing: false,
  currentTranscription: '',
  waveformData: Array.from({ length: 50 }, () => Math.random() * 40 + 10),
  
  setIsTranscribing: (value) => set({ isTranscribing: value }),
  
  setCurrentTranscription: (text) => set({ currentTranscription: text }),
  
  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
    
    // Auto-generate AI response for engineer messages
    if (message.sender === 'engineer') {
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `Confirmed: "${message.text}". Analysis in progress.`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          confidence: Math.floor(Math.random() * 20) + 80,
        };
        set((state) => ({ messages: [...state.messages, aiResponse] }));
      }, 1000);
    }
  },
  
  addRecommendation: (recommendation) => {
    const newRec: Recommendation = {
      ...recommendation,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    };
    set((state) => ({ recommendations: [newRec, ...state.recommendations] }));
  },
  
  updateWaveform: () => {
    set({ waveformData: Array.from({ length: 50 }, () => Math.random() * 40 + 10) });
  },
  
  sendMessage: (messageId) => {
    console.log('Sending message:', messageId);
    // In a real app, this would send to backend
  },
  
  sendRecommendation: (recId) => {
    console.log('Sending recommendation:', recId);
    // In a real app, this would send to backend
  },
}));
