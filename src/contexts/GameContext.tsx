import React, { createContext, useContext, useState, ReactNode } from 'react';

export type GameType = 'chess' | 'tic-tac-toe' | null;

export interface ChessPosition {
  row: number;
  col: number;
}

export interface ChessPiece {
  type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
  color: 'white' | 'black';
  position: ChessPosition;
}

export interface TicTacToeCell {
  value: 'X' | 'O' | null;
  index: number;
}

interface GameContextType {
  activeGame: GameType;
  gameRoom: string | null;
  chessBoard: (ChessPiece | null)[][];
  ticTacToeBoard: TicTacToeCell[];
  currentPlayer: 'white' | 'black' | 'X' | 'O';
  gameWinner: string | null;
  startGame: (type: GameType, roomId: string) => void;
  endGame: () => void;
  makeChessMove: (from: ChessPosition, to: ChessPosition) => void;
  makeTicTacToeMove: (index: number) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

interface GameProviderProps {
  children: ReactNode;
}

const initialChessBoard = (): (ChessPiece | null)[][] => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Initialize pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black', position: { row: 1, col } };
    board[6][col] = { type: 'pawn', color: 'white', position: { row: 6, col } };
  }
  
  // Initialize other pieces
  const pieces: ('rook' | 'knight' | 'bishop' | 'queen' | 'king')[] = 
    ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: pieces[col], color: 'black', position: { row: 0, col } };
    board[7][col] = { type: pieces[col], color: 'white', position: { row: 7, col } };
  }
  
  return board;
};

const initialTicTacToeBoard = (): TicTacToeCell[] => 
  Array(9).fill(null).map((_, index) => ({ value: null, index }));

export function GameProvider({ children }: GameProviderProps) {
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [gameRoom, setGameRoom] = useState<string | null>(null);
  const [chessBoard, setChessBoard] = useState<(ChessPiece | null)[][]>(initialChessBoard());
  const [ticTacToeBoard, setTicTacToeBoard] = useState<TicTacToeCell[]>(initialTicTacToeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black' | 'X' | 'O'>('white');
  const [gameWinner, setGameWinner] = useState<string | null>(null);

  const startGame = (type: GameType, roomId: string) => {
    setActiveGame(type);
    setGameRoom(roomId);
    setGameWinner(null);
    
    if (type === 'chess') {
      setChessBoard(initialChessBoard());
      setCurrentPlayer('white');
    } else if (type === 'tic-tac-toe') {
      setTicTacToeBoard(initialTicTacToeBoard());
      setCurrentPlayer('X');
    }
  };

  const endGame = () => {
    setActiveGame(null);
    setGameRoom(null);
    setGameWinner(null);
  };

  const makeChessMove = (from: ChessPosition, to: ChessPosition) => {
    const newBoard = chessBoard.map(row => [...row]);
    const piece = newBoard[from.row][from.col];
    
    if (piece && piece.color === currentPlayer) {
      newBoard[to.row][to.col] = { 
        ...piece, 
        position: { row: to.row, col: to.col } 
      };
      newBoard[from.row][from.col] = null;
      
      setChessBoard(newBoard);
      setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
    }
  };

  const checkTicTacToeWinner = (board: TicTacToeCell[]): string | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a].value && board[a].value === board[b].value && board[a].value === board[c].value) {
        return board[a].value!;
      }
    }

    return board.every(cell => cell.value !== null) ? 'tie' : null;
  };

  const makeTicTacToeMove = (index: number) => {
    if (ticTacToeBoard[index].value || gameWinner) return;

    const newBoard = [...ticTacToeBoard];
    newBoard[index] = { ...newBoard[index], value: currentPlayer as 'X' | 'O' };
    
    setTicTacToeBoard(newBoard);
    
    const winner = checkTicTacToeWinner(newBoard);
    if (winner) {
      setGameWinner(winner === 'tie' ? 'It\'s a tie!' : `${winner} wins!`);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const resetGame = () => {
    if (activeGame === 'chess') {
      setChessBoard(initialChessBoard());
      setCurrentPlayer('white');
    } else if (activeGame === 'tic-tac-toe') {
      setTicTacToeBoard(initialTicTacToeBoard());
      setCurrentPlayer('X');
    }
    setGameWinner(null);
  };

  const value = {
    activeGame,
    gameRoom,
    chessBoard,
    ticTacToeBoard,
    currentPlayer,
    gameWinner,
    startGame,
    endGame,
    makeChessMove,
    makeTicTacToeMove,
    resetGame,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}