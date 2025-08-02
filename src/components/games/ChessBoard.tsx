import React, { useState } from 'react';
import { useGame, ChessPosition } from '../../contexts/GameContext';

export default function ChessBoard() {
  const { chessBoard, makeChessMove, currentPlayer } = useGame();
  const [selectedPiece, setSelectedPiece] = useState<ChessPosition | null>(null);

  const getPieceSymbol = (piece: any) => {
    const symbols = {
      white: {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙',
      },
      black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟',
      },
    };
    return symbols[piece.color as keyof typeof symbols][piece.type as keyof typeof symbols['white']];
  };

  const handleSquareClick = (row: number, col: number) => {
    const clickedPiece = chessBoard[row][col];
    
    if (selectedPiece) {
      // Try to make a move
      makeChessMove(selectedPiece, { row, col });
      setSelectedPiece(null);
    } else if (clickedPiece && clickedPiece.color === currentPlayer) {
      // Select a piece
      setSelectedPiece({ row, col });
    }
  };

  const isSquareSelected = (row: number, col: number) => {
    return selectedPiece?.row === row && selectedPiece?.col === col;
  };

  const isSquareLight = (row: number, col: number) => {
    return (row + col) % 2 === 0;
  };

  return (
    <div className="grid grid-cols-8 gap-0 border-2 border-gray-600 rounded-lg overflow-hidden">
      {chessBoard.map((row, rowIndex) =>
        row.map((piece, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            onClick={() => handleSquareClick(rowIndex, colIndex)}
            className={`
              w-12 h-12 flex items-center justify-center cursor-pointer transition-colors
              ${isSquareLight(rowIndex, colIndex) 
                ? 'bg-amber-100 hover:bg-amber-200' 
                : 'bg-amber-800 hover:bg-amber-700'
              }
              ${isSquareSelected(rowIndex, colIndex) 
                ? 'ring-4 ring-blue-400' 
                : ''
              }
            `}
          >
            {piece && (
              <span className="text-2xl select-none">
                {getPieceSymbol(piece)}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}