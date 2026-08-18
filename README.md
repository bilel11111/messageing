# GameChat

A realtime chat application with shared rooms, user profiles, and built-in chess and tic-tac-toe experiences.

## Overview

GameChat combines conversation and lightweight multiplayer interaction in one responsive interface. Authenticated users can join rooms, exchange messages, view profiles, react to activity, and start a game without leaving the conversation.

## Highlights

- Realtime room-based messaging.
- Authentication and profile management.
- Chess and tic-tac-toe game boards.
- Activity indicators and room presence patterns.
- Responsive layout for desktop and mobile screens.

## Technology

- React 18 and TypeScript
- Vite
- Tailwind CSS
- Supabase authentication, persistence, and realtime subscriptions

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and configure the required Supabase values. Never commit local environment files or private service credentials.

## Project structure

Chat features live under `src/components/chat/`, game flows under `src/components/games/`, and shared authentication/application state under `src/contexts/`.

## Status

A portfolio project demonstrating realtime communication, protected routes, and interactive multiplayer UI.

## License

No license has been declared yet. Add a license before accepting external contributions or distributing the project.

## Author

**Bilel JM** — [GitHub](https://github.com/bilel11111)
