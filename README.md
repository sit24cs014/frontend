# E:Revive – Frontend

React + Vite frontend for **E:Revive – A Smart E-Waste Management System Using Machine Learning**.

## Run
```bash
npm install
cp .env.example .env     # set VITE_API_URL to your backend
npm run dev              # http://localhost:5173
```

## Backend endpoints the frontend expects (edit `src/services/*.js` to match yours)
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /auth/register | `{name,email,password}` → `{token,user}` |
| POST | /auth/login | `{email,password}` → `{token,user}` |
| POST | /auth/forgot-password | `{email}` |
| GET  | /dashboard | `{ecoPoints,itemsAnalyzed,pickupsBooked,analyses[],pickups[]}` |
| POST | /analyze | multipart field `image` → `{id,component,reusability,price_min,price_max,repair_suggestion,co2_saved,image_url,created_at}` |
| GET  | /analyses/:id | one analysis |
| POST | /pickups | pickup form → `{id,reference,status}` |

## Demo mode
If the backend cannot be reached at all, the app switches to a clearly labelled **demo mode**
(yellow banner, data stored in the browser, results marked "not a real prediction").
Disable it with `VITE_DEMO_FALLBACK=false`.
