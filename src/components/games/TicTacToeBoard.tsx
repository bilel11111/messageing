import React from 'react';
import { useGame } from '../../contexts/GameContext';

export default function TicTacToeBoard() {
  const { ticTacToeBoard, makeTicTacToeMove, gameWinner } = useGame();

  return (
    <div className="grid grid-cols-3 gap-2 p-4">
      {ticTacToeBoard.map((cell, index) => (
        <button
          key={index}
          onClick={() => makeTicTacToeMove(index)}
          disabled={!!cell.value || !!gameWinner}
          className="w-20 h-20 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg flex items-center justify-center text-3xl font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cell.value && (
            <span className={cell.value === 'X' ? 'text-blue-400' : 'text-red-400'}>
              {cell.value}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}