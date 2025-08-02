import React, { useState, useRef, useEffect } from 'react';
import { Send, Gamepad2, Hash, Smile, Reply, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Message, MessageReaction } from '../../lib/supabase';


interface ChatAreaProps {
  roomId: string;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];

export default function ChatArea({ roomId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { startGame } = useGame();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (roomId && user) {
      fetchMessages();
      subscribeToMessages();
      subscribeToTyping();
    }
  }, [roomId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:user_id (username, avatar_url),
          reactions:message_reactions (
            id, emoji, user_id,
            profiles:user_id (username)
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`messages:${roomId}`)
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        () => fetchMessages()
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions'
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const subscribeToTyping = () => {
    const subscription = supabase
      .channel(`typing:${roomId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `room_id=eq.${roomId}`
        },
        async () => {
          const { data } = await supabase
            .from('typing_indicators')
            .select('profiles:user_id (username)')
            .eq('room_id', roomId)
            .neq('user_id', user?.id);
          
          setTypingUsers(data?.map(d => d.profiles?.username).filter(Boolean) || []);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!user) return;

    if (isTyping) {
      await supabase
        .from('typing_indicators')
        .upsert({ room_id: roomId, user_id: user.id });
    } else {
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const messageData = {
        room_id: roomId,
        user_id: user.id,
        content: newMessage,
        message_type: 'text' as const,
        reply_to: replyTo?.id || null
      };

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
      setReplyTo(null);
      await updateTypingStatus(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: editContent,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;
      
      setEditingMessage(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existing) {
        // Remove reaction
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji
          });
      }
      
      setShowEmojiPicker(null);
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const startEdit = (message: Message) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const handleStartGame = (gameType: 'chess' | 'tic-tac-toe') => {
    if (!user) return;

    try {
      // Create game in database
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          room_id: roomId,
          game_type: gameType,
          player1_id: user.id,
          status: 'waiting'
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Send system message
      await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          content: `${profile?.username} started a ${gameType} game`,
          message_type: 'system'
        });

      startGame(gameType, roomId);
    } catch (error) {
      console.error('Error starting game:', error);
    }
    
    setShowGameMenu(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const groupReactions = (reactions: MessageReaction[] = []) => {
    const grouped: { [emoji: string]: { count: number; users: string[] } } = {};
    
    reactions.forEach(reaction => {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = { count: 0, users: [] };
      }
      grouped[reaction.emoji].count++;
      grouped[reaction.emoji].users.push(reaction.profiles?.username || 'Unknown');
    });
    
    return grouped;
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-700 bg-slate-800">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white capitalize">{roomId}</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {replyTo && (
          <div className="bg-blue-600/20 border-l-4 border-blue-600 p-3 rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-400">Replying to {replyTo.profiles?.username}</span>
              <button 
                onClick={() => setReplyTo(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-300 mt-1">{replyTo.content}</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className="group">
            {message.message_type === 'system' ? (
              <div className="text-center">
                <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                  {message.content}
                </span>
              </div>
            ) : (
              <div className="flex gap-3 hover:bg-gray-800/50 p-2 rounded-lg transition-colors">
                {message.profiles?.avatar_url ? (
                  <img 
                    src={message.profiles.avatar_url} 
                    alt={message.profiles.username}
                    className="h-8 w-8 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">
                      {message.profiles?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {message.reply_to && (
                    <div className="text-xs text-gray-400 mb-1 border-l-2 border-gray-600 pl-2">
                      Replying to a message
                    </div>
                  )}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-white">{message.profiles?.username}</span>
                    <span className="text-xs text-gray-400">
                      {formatTime(new Date(message.created_at))}
                    </span>
                    {message.edited_at && (
                      <span className="text-xs text-gray-500">(edited)</span>
                    )}
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 ml-auto">
                      <button
                        onClick={() => setReplyTo(message)}
                        className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                      >
                        <Reply className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                        className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                      >
                        <Smile className="h-3 w-3" />
                      </button>
                      {message.user_id === user?.id && (
                        <>
                          <button
                            onClick={() => startEdit(message)}
                            className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {editingMessage === message.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditMessage(message.id);
                          } else if (e.key === 'Escape') {
                            setEditingMessage(null);
                            setEditContent('');
                          }
                        }}
                        className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditMessage(message.id)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-300 break-words">{message.content}</p>
                  )}
                  
                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(groupReactions(message.reactions)).map(([emoji, data]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(message.id, emoji)}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-xs transition-colors"
                          title={data.users.join(', ')}
                        >
                          <span>{emoji}</span>
                          <span className="text-gray-300">{data.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker === message.id && (
                    <div className="absolute z-10 bg-gray-800 border border-gray-600 rounded-lg p-2 shadow-lg mt-1">
                      <div className="grid grid-cols-4 gap-1">
                        {EMOJI_LIST.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(message.id, emoji)}
                            className="p-2 hover:bg-gray-700 rounded transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {typingUsers.length === 1 
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.join(', ')} are typing...`
              }
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowGameMenu(!showGameMenu)}
              className="p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors"
            >
              <Gamepad2 className="h-5 w-5" />
            </button>
            
            {showGameMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 min-w-[150px]">
                <button
                  onClick={() => handleStartGame('chess')}
                  className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  Start Chess Game
                </button>
                <button
                  onClick={() => handleStartGame('tic-tac-toe')}
                  className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  Start Tic-Tac-Toe
                </button>
              </div>
            )}
          </div>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              updateTypingStatus(e.target.value.length > 0);
            }}
            onBlur={() => updateTypingStatus(false)}
            placeholder={`Message #${roomId}`}
            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          
          <button
            type="submit"
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}