import React, { useEffect, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { supabase, Game } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ChessBoard from './ChessBoard';
import TicTacToeBoard from './TicTacToeBoard';
import { X, RotateCcw } from 'lucide-react';

export default function GameArea() {
  const { activeGame, endGame, resetGame, gameWinner, currentPlayer, gameRoom } = useGame();
  const { user } = useAuth();
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  useEffect(() => {
    if (activeGame && gameRoom) {
      fetchCurrentGame();
      subscribeToGame();
    }
  }, [activeGame, gameRoom]);

  const fetchCurrentGame = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('room_id', gameRoom)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentGame(data);
    } catch (error) {
      console.error('Error fetching game:', error);
    }
  };

  const subscribeToGame = () => {
    if (!gameRoom) return;

    const subscription = supabase
      .channel(`game:${gameRoom}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `room_id=eq.${gameRoom}`
        },
        () => fetchCurrentGame()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  if (!activeGame) return null;

  return (
    <div className="h-full bg-slate-800 border-t border-gray-700 flex flex-col">
      {/* Game Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-white capitalize">
            {activeGame.replace('-', ' ')} Game
          </h3>
          {!gameWinner && (
            <div className="text-sm text-gray-300">
              Current turn: <span className="font-semibold text-white">{currentPlayer}</span>
            </div>
          )}
          {gameWinner && (
            <div className="text-sm font-semibold text-green-400">
              {gameWinner}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={resetGame}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
            title="Reset game"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={endGame}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
            title="Close game"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 p-4 flex items-center justify-center">
        {activeGame === 'chess' && <ChessBoard />}
        {activeGame === 'tic-tac-toe' && <TicTacToeBoard />}
      </div>
    </div>
  );
}