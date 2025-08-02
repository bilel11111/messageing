import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aatktfwnqzkntpcgcisb.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database types
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  created_by?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'game_invite' | 'system';
  reply_to?: string;
  edited_at?: string;
  created_at: string;
  profiles?: Profile;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  profiles?: Profile;
}

export interface Game {
  id: string;
  room_id: string;
  game_type: 'chess' | 'tic-tac-toe';
  status: 'waiting' | 'active' | 'finished' | 'abandoned';
  player1_id?: string;
  player2_id?: string;
  current_turn?: string;
  winner_id?: string;
  game_state: any;
  created_at: string;
  finished_at?: string;
}

export interface GameMove {
  id: string;
  game_id: string;
  player_id: string;
  move_data: any;
  move_number: number;
  created_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  last_read_at: string;
  profiles?: Profile;
}