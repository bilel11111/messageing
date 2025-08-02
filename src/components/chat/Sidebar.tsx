import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Room, Profile } from '../../lib/supabase';
import UserProfile from '../ui/UserProfile';
import { MessageCircle, Hash, Users, Settings, LogOut, User, Plus, Search } from 'lucide-react';

interface SidebarProps {
  selectedRoom: string;
  onRoomSelect: (roomId: string) => void;
}


export default function Sidebar({ selectedRoom, onRoomSelect }: SidebarProps) {
  const { user, profile, signOut } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Profile[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchOnlineUsers();
      subscribeToRooms();
      subscribeToProfiles();
    }
  }, [user]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('status', 'offline')
        .order('username');

      if (error) throw error;
      setOnlineUsers(data || []);
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
  };

  const subscribeToRooms = () => {
    const subscription = supabase
      .channel('rooms')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rooms' },
        () => fetchRooms()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const subscribeToProfiles = () => {
    const subscription = supabase
      .channel('profiles')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => fetchOnlineUsers()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .insert({
          name: newRoomName,
          type: 'public',
          created_by: user.id
        });

      if (error) throw error;
      
      setNewRoomName('');
      setShowCreateRoom(false);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="w-64 bg-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-blue-400" />
          <h1 className="text-xl font-bold text-white">GameChat</h1>
        </div>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Channels
            </h2>
            <button
              onClick={() => setShowCreateRoom(!showCreateRoom)}
              className="p-1 text-gray-400 hover:text-white transition-colors rounded"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          {showCreateRoom && (
            <form onSubmit={createRoom} className="mb-3">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name"
                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                autoFocus
              />
            </form>
          )}
          
          <div className="space-y-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onRoomSelect(room.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                  selectedRoom === room.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Hash className="h-4 w-4" />
                <span className="text-sm">{room.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Online Users */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Online - {onlineUsers.length}
            </h2>
          </div>
          <div className="space-y-1">
            {onlineUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 px-3 py-1 rounded-md text-gray-300"
              >
                <div className="relative">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.username}
                      className="h-4 w-4 rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <div
                    className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border border-slate-800 ${getStatusColor(user.status)}`}
                  />
                </div>
                <span className="text-sm">{user.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.username}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {profile?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-white text-sm font-medium">{profile?.username}</p>
              <p className="text-gray-400 text-xs capitalize">{profile?.status || 'offline'}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => setShowProfile(true)}
              className="p-1 text-gray-400 hover:text-white transition-colors rounded"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button 
              onClick={signOut}
              className="p-1 text-gray-400 hover:text-white transition-colors rounded"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      <UserProfile 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
    </div>
  );
}