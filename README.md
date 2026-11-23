# LishAI Labs

Full-stack AI company website with separate React frontend and Node/Express/MySQL backend.

## Project Structure

- `lishai-labs-frontend` - React public website and admin console
- `lishai-labs-backend` - Express MVC API, MySQL models, authentication and uploads

## Backend Setup

1. Copy `lishai-labs-backend/.env.example` to `lishai-labs-backend/.env`.
2. Configure the local MySQL credentials.
3. Run `npm install` in `lishai-labs-backend`.
4. Run `npm run db:init`.
5. Run `npm run dev`.

Default API port: `5055`

Only-authorized admin credentials:
- Email: `masakarobert69@gmail.com`
- Password: `Godisgood@966`

Change these credentials immediately after the first login.

## Frontend Setup

1. Copy `lishai-labs-frontend/.env.example` to `lishai-labs-frontend/.env`.
2. Run `npm install` in `lishai-labs-frontend`.
3. Run `npm run dev`.

The frontend runs at `http://localhost:5173`.
