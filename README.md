# LishAI Labs

Full-stack AI company website with separate React frontend and Node/Express/MySQL backend.

## Project Structure

- `lishai-labs-frontend` - React public website and admin console
- `lishai-labs-backend` - Express MVC API, MySQL models, authentication and uploads

## Backend Setup

1. Copy `lishai-labs-backend/.env.example` to `lishai-labs-backend/.env`.
2. Configure the local MySQL credentials.
3. Run `npm install` in `lishai-labs-backend`.
4. To create a first administrator, set `ADMIN_NAME`, `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD` in the environment, then run `npm run db:init`. Existing accounts are not changed.
5. Run `npm run dev`.

Default API port: `5055`

Administrators sign in with their account email, password and an emailed OTP. Newly provisioned accounts must change their password before accessing the console. Use unique, strong temporary passwords; email addresses are predictable. Existing databases receive the password-change column on API startup or through `npm run db:init`.

## Frontend Setup

1. Copy `lishai-labs-frontend/.env.example` to `lishai-labs-frontend/.env`.
2. Run `npm install` in `lishai-labs-frontend`.
3. Run `npm run dev`.

The frontend runs at `http://localhost:5173`.
