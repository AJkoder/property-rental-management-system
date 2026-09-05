# My Project Notes — Property Rental Management System

This is my own personal notes file. Not for submission, not for anyone to grade — just for me, so that whenever I open this (before an interview, six months from now, whenever), I can remind myself exactly what I built, why I built it that way, and be able to talk about it confidently.

---

## PART 1: What is this project, in plain words?

Imagine a small company that manages rental properties for landlords. They have maybe 20-50 apartments/houses that they rent out. Every month, three things need to happen:

1. **Rent needs to come in** — someone has to track who paid, who didn't, who paid late
2. **Things break and need fixing** — a leaking tap, broken AC, whatever — someone reports it, someone fixes it, and someone needs to track that it actually got fixed
3. **Someone needs to see the big picture** — how many units are occupied, how many repairs are pending, is anyone behind on rent

Before this app, all of this happens on paper, in someone's head, or in a messy Excel sheet. My app replaces all of that with one clean system.

**There are two types of people who use it:**
- **Property Manager** — the boss. Sees everything. Adds units, assigns repair jobs to contractors, records rent, sees the dashboard.
- **Maintenance Contractor** — the repair guy. Only sees jobs assigned to them. Can't see rent, can't see other contractors' jobs, can't add units.

That separation (manager vs contractor) is enforced not just by hiding buttons on the screen, but by the actual server refusing to send that data if you're not allowed to see it. This matters a lot and I'll explain why later.

---

## PART 2: Why I built it with this specific tech stack

**Backend: Flask (Python) + PostgreSQL**
I picked this because I already had experience with Flask from an earlier project (CodeSentinel), so I could move fast instead of learning something new under time pressure. PostgreSQL (a proper relational database) made sense because this data is genuinely relational — a unit has many maintenance requests, a request can have many contractors, contractors can work on many requests. That's the kind of "many-to-many" relationship that a proper SQL database handles cleanly with foreign keys, versus something like MongoDB where I'd have to manage those relationships myself.

**Frontend: React (with Vite) + Tailwind CSS**
React because it's what I know best. Vite because it's the modern, fast way to set up a React project (the older tool, Create React App, is basically deprecated now). Tailwind for styling because it lets me write consistent spacing/colors quickly using utility classes, instead of writing tons of custom CSS files.

**Database hosting: Supabase**
Free, gives me a real production-grade PostgreSQL database without installing Postgres on my own laptop. One less thing to manage.

**App hosting: Render (backend) + Vercel (frontend)**
Both free tiers, both auto-deploy whenever I push to GitHub. This is literally the combination the assignment brief suggested, so I didn't have to think hard about this part.

---

## PART 3: The story — how this actually got built, in order

**Step 1 — Setup.** I started with nothing: just an empty folder. First thing I did was set up Flask using something called the "app factory pattern" — instead of one giant messy file with everything in it, the app is built inside a function, and different concerns (database setup, routes, config) live in separate files. This is considered a "proper" way to structure a Flask app rather than a beginner way.

I hit my first real bug immediately: my database password had an `@` symbol in it, and `@` is a special character in database connection URLs (it separates the password from the address). Had to learn about "URL encoding" to fix it — you replace `@` with `%40`.

**Step 2 — Login system.** Built signup/login using something called JWT (JSON Web Tokens). Here's the simple version: when you log in, the server gives you a signed "ticket" (the token) that says who you are and what role you have. Your browser stores that ticket and shows it on every future request, kind of like a wristband at an event. The server checks the wristband instead of asking "who are you" every single time.

Passwords are never stored as plain text — they're "hashed" using something called bcrypt, which scrambles them one-way. Even I, looking directly at the database, cannot see anyone's actual password, only the scrambled version.

**Step 3 — Units.** Built the basic "add/edit/view a rental unit" feature. Made a decision here that I'm proud of: when a manager "deletes" a unit, it doesn't actually get deleted from the database — it just gets marked as `archived`. Why? Because that unit probably has maintenance history and rent payment history attached to it, and permanently deleting it would either break those records or force me to delete them too, losing history that should stay for record-keeping.

**Step 4 — Maintenance requests, and THE hardest part: the status lifecycle.**
This is genuinely the trickiest logic in the whole app. A maintenance request moves through four stages: `Reported → Triaged → Scheduled → Resolved`. But there are rules:
- You can't skip a stage (can't go straight from Reported to Scheduled)
- You CANNOT move to "Scheduled" unless a contractor is actually assigned to fix it
- If something gets marked "Resolved" but the problem comes back, it "reopens" to Triaged, not all the way back to Reported

I built this as a small lookup table in code (basically: "if you're currently in stage X, here's the ONLY list of stages you're allowed to move to next") rather than writing a big messy pile of if/else statements. This makes the rule easy to read at a glance and easy to change later without breaking other code.

**Step 5 — Assignments (which contractor fixes what).**
One request can have multiple contractors assigned (rare, but possible for a big job). One contractor can be working on multiple requests. This is called a "many-to-many" relationship, and it needs its own separate table in the database to represent it properly — you can't just add a "contractor" column directly onto the request, because that would only allow ONE contractor per request.

**Step 6 — The audit trail (timeline).**
Every status change, every contractor assignment/removal, every note — all of it gets logged permanently in a table that can NEVER be edited or deleted, not even by me as the developer, not even by the manager using the app. There's literally no "edit" or "delete" button/route for this table anywhere in the code. This is what makes it trustworthy — if someone asks "who changed this and when," the answer is always available and can't have been tampered with.

**Step 7 — Search, filters, bulk rent, dashboard, alerts.**
Built out the remaining features: searching/filtering maintenance requests (done at the database level, not by loading everything and filtering in the browser — this matters a lot once there's real data volume), recording rent payments in bulk (drop in a list of "unit X paid ₹15,000 for September" and the system tells you which ones matched, underpaid, overpaid, or didn't match any unit), a dashboard with charts, and an alerts system that flags units with unpaid rent (but gives a few days' grace period first).

**Step 8 — Frontend, all six pages.**
Built the actual React interface people click on: Login, Signup, Units, Maintenance Requests, Rent/Payments, Dashboard, Alerts. Spent real time making sure it doesn't look like a generic AI-template — a proper color palette, consistent spacing, a sidebar that changes what it shows depending on whether you're a manager or contractor.

**Step 9 — Deployment.**
Put the backend on Render, the frontend on Vercel, connected them together with environment variables (a `.env` file holds secret values like database passwords — this file is NEVER uploaded to GitHub, it's specifically excluded via `.gitignore`).

**Step 10 — The most important step: going back and checking my own work against the ORIGINAL brief.**
This is the step I'm most proud of, honestly. After I thought I was done, I went back and re-read the *exact original wording* of the assignment (not my memory of what it said) and checked it line by line against what I'd actually built. I found real gaps — a missing filter, a field that couldn't be edited when it should have been, a dashboard missing some required numbers. I fixed all of them. The lesson I learned: when you work on something for a long time, you start working from your *memory* of the requirements instead of the actual requirements, and they quietly drift apart without you noticing.

**Step 11 — A proper security check.**
Even after all that, I did one more pass specifically checking: "is this actually protected on the SERVER, or does it just look protected because the button is hidden in the interface?" This found real problems — a contractor could technically ask the server directly for information they shouldn't see (like another contractor's job, or rent data), even though the app's screens never showed them a way to do that. I fixed every one of these. The lesson: hiding something in the UI is not security. Security has to be enforced by the server, every single time, on every single route — not just "most of them."

---

## PART 4: Key things I should be able to explain confidently

**"Why UUIDs instead of normal auto-incrementing numbers for IDs?"**
If IDs were 1, 2, 3, 4..., someone could guess "let me try ID 5" and probe for data that isn't theirs. UUIDs are long random strings, basically impossible to guess.

**"Why does a contractor only see their own jobs?"**
The database query itself filters by "give me only requests where this contractor is assigned" — the filtering happens before the data even leaves the database. It's not "fetch everything then hide some of it," which is an important distinction — the wrong data literally never gets sent over the network.

**"What does 'immutable audit log' actually mean technically?"**
It means there is no code anywhere in the entire application that can update or delete rows in that specific table. Not a special database lock, not a fancy trigger — just a deliberate choice to never write that code in the first place.

**"Why Numeric instead of Float for money?"**
Floats store numbers in binary, and binary can't perfectly represent some decimal numbers (like how 1/3 can't be perfectly written in decimal). This can cause tiny rounding errors — ₹19.999999 instead of ₹20.00. For money, that's unacceptable, so I used a data type that stores exact decimal values instead.

**"Tell me about a bug you found and fixed."**
I have several genuinely good ones to talk about:
- A contractor could view/edit a maintenance request that wasn't assigned to them, just by knowing (or guessing) its ID — even though the app's normal screens never showed them that request. This is called an IDOR bug (Insecure Direct Object Reference). Fixed by adding a check that runs on every single request-related route: "if you're a contractor, are you actually assigned to this?"
- A database migration failed because I tried adding a "required" column to a table that already had existing rows with no value for that column. Fixed using the standard safe pattern: add the column as optional first, fill in a default value for existing rows, then make it required.
- Two different features (Dashboard and Alerts) disagreed about what counted as "overdue rent" because one respected a grace period and the other didn't. Found by comparing their numbers side by side and noticing they didn't match.

---

## PART 5: Things I'm genuinely proud of vs. things I'd do differently

**Proud of:** the status lifecycle logic, the immutable audit trail, catching my own security bugs before submission instead of after, going back to re-check against the literal brief instead of trusting my memory of it.

**Would do differently:** I'd write the "is this user even allowed to touch this specific record" check as ONE reusable function from day one and force every route to use it, instead of writing similar-but-separately-typed checks in five different route files and getting it right in four of them but missing the fifth. That's exactly what caused the security bugs — not bad logic, just inconsistent repetition of the same logic.

**If I had more time:** I'd turn the rent-alerts feature (currently a button someone has to click) into something that runs automatically on a schedule, and I'd write a proper automated test suite instead of relying on me manually clicking through the app and running curl commands during development.