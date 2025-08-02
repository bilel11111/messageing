import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import GameArea from '../games/GameArea';
import { useGame } from '../../contexts/GameContext';

export default function ChatLayout() {
  const [selectedRoom, setSelectedRoom] = useState<string>('general');
  const { activeGame } = useGame();

  return (
    <div className="h-screen flex bg-slate-900">
      <Sidebar 
        selectedRoom={selectedRoom} 
        onRoomSelect={setSelectedRoom} 
      />
      
      <div className="flex-1 flex flex-col">
        <ChatArea roomId={selectedRoom} />
        
        {activeGame && (
          <div className="h-80 border-t border-gray-700">
            <GameArea />
          </div>
        )}
      </div>
    </div>
  );
}