# Virag Training Solutions – Website (MERN)

Dynamic website for **ViragTrainingSolutions.com** with a full admin panel.
Courses, software products, services, portfolio, testimonials, enquiries and site settings are all managed from `/admin`, so no code changes are needed.

## Features

**Website:** Home · Courses (+ detail page with syllabus) · Ready-made Software (+ detail) · Services · Portfolio · Testimonials · About · Contact · WhatsApp button · Enquiry forms everywhere · SEO-friendly URLs · Mobile responsive

**Admin panel (`/admin`):**
- Dashboard with counts and the latest enquiries
- Add, edit and delete for Courses, Software Products, Services, Portfolio and Testimonials
- Image upload, publish/hide toggle, "featured on home page" toggle and sort order
- Enquiries inbox with status (new / contacted / converted / closed), notes, a WhatsApp link and CSV export
- Site settings: phone, WhatsApp, email, address, Google map, hero text, stats, about/mission/vision and social links
- Change password

## LMS, webinars & live batches

| Feature | Public URL | Admin |
|---|---|---|
| Online (recorded) courses with a sales landing page | `/learn`, `/learn/:slug` | Online Courses (curriculum builder) |
| Course player with progress tracking | `/learn/:slug/watch` | – |
| Certificate (printable, public verification link) | `/certificate/:id` | auto on 100% completion |
| Live batches with a landing page | `/batches`, `/batches/:slug` | Live Batches → **Manage** (classes, students, attendance) |
| Webinars with a landing page and registration | `/webinars`, `/webinars/:slug` | Webinars → **Registrations** (status, CSV, WhatsApp reminder) |
| Student login and dashboard | `/login`, `/register`, `/dashboard` | Students (manual enroll, reset password) |
| Payments | – | Orders (approve manual payments) |

**Payments:** add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `server/.env` to accept UPI, card and netbanking online. Without the keys, paid orders are saved as *pending*. The student sees your payment instructions (Admin → Site Settings), and you give access from **Admin → Orders → Approve**.
For reliable confirmation, also add a webhook in the Razorpay Dashboard: URL `https://yourdomain.com/api/checkout/webhook`, events `payment.captured` and `order.paid`. Put its secret in `RAZORPAY_WEBHOOK_SECRET`.

**Videos:** paste YouTube (unlisted), Vimeo, Google Drive or direct `.mp4` links in lessons. Only enrolled students receive non-preview lesson links from the API. Unlisted YouTube links can still be shared by a student, so use Vimeo (domain-restricted), Bunny Stream or similar for stronger protection.

**Live classes:** the student "Join Class" button opens 30 minutes before the start time. It checks enrollment, marks attendance automatically and only then reveals the Zoom/Meet link.

## Folder structure

```
server/   Express + MongoDB API (port 5000)
  src/models/index.js      all Mongoose models
  src/routes/index.js      API routes (one line per content type)
  src/utils/crudRouter.js  generic CRUD router
  src/seed.js              starter data
  uploads/                 uploaded images
client/   React (Vite) + Tailwind CSS
  src/pages/               public pages
  src/admin/resources.js   admin form/table config for each content type
```

## Setup (local)

Requirements: Node.js 18+ and MongoDB (local, or a free cloud database from MongoDB Atlas).

```bash
npm run install:all
cp server/.env.example server/.env    # then edit MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed                          # adds starter courses/services/products (only into empty collections)
npm run dev:server                    # terminal 1 → http://localhost:5000
npm run dev:client                    # terminal 2 → http://localhost:5173
```

Admin login: http://localhost:5173/admin/login, using the `ADMIN_EMAIL` / `ADMIN_PASSWORD` values from `.env`. The admin account is created automatically on the first server start. **Change the password after the first login.**

> ⚠️ The seed testimonials, portfolio items, stats, phone and address are **placeholders**. Replace them with real data from the admin panel before going live.

## Production deployment (VPS / Hostinger VPS / Render / Railway)

```bash
npm run install:all
npm run build          # builds client/dist
NODE_ENV=production npm start
```

The Express server serves the API **and** the built React site on one port. Put it behind Nginx with SSL (Let's Encrypt) for `viragtrainingsolutions.com`, and use `pm2` to keep it running:

```bash
npm i -g pm2
cd server && NODE_ENV=production pm2 start src/index.js --name virag && pm2 save
```

Back up the `server/uploads/` folder: it holds all uploaded images.
If you host the frontend separately (e.g. Netlify/Vercel), set `VITE_API_URL=https://api.yourdomain.com/api` and `VITE_ASSET_URL=https://api.yourdomain.com` in `client/.env`, and add the frontend URL to `CLIENT_URL` in `server/.env`.

## Adding a new content type (e.g. Blog, Team, FAQ)

1. `server/src/models/index.js`: add a schema and `schema.plugin(contentPlugin)` (+ `slugPlugin` if it needs its own URL).
2. `server/src/routes/index.js`: `router.use('/blogs', crudRouter(Blog));`
3. `client/src/admin/resources.js`: add a `blogs` entry with `fields` and `columns`.
4. Add a menu item in `client/src/admin/AdminPages.jsx` (`MENU`), and a public page if needed.

The admin list, form and image upload work automatically.

## API summary

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/{courses,products,services,portfolio,testimonials}` (`?featured=true&category=&search=&limit=`) | public |
| GET | `/api/{resource}/:slugOrId` | public |
| GET | `/api/{resource}/admin/all` | admin |
| POST / PUT / DELETE | `/api/{resource}` / `/:id` | admin |
| POST | `/api/enquiries` | public (rate limited) |
| GET / PATCH / DELETE | `/api/enquiries` | admin |
| GET / PUT | `/api/settings` | public / admin |
| POST | `/api/upload` (field `image`) | admin |
| POST | `/api/auth/login` · GET `/api/auth/me` · PUT `/api/auth/password` | — |
