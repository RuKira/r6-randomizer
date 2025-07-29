# R6 Operator Randomizer 🎲

A stylish, customizable Rainbow Six Siege Operator Randomizer with full team syncing and operator health checking. Built in **React + Vite** and deployed on GitHub Pages.

---

## 🔥 Core Features

### 🎯 Weighted Randomization
- All operators have a default weight of 10
- Weights increase when not selected, decrease when picked
- Prevents repetition and biases

### 🔀 Smart Rerolling
- Reroll individual operators without affecting locked ones
- ✅ Played operators are faded and removed
- 🔒 Locked operators stay persistent
- 🌀 Automatically rerolls disabled picks

### 🎮 Operator Grid
- Toggle any operator on/off
- Hover tooltips for names
- Color-coded states:
    - 🟡 Locked
    - 🔵 Rerolled
    - 🟢 Played

---

## 👥 Multiplayer Support

### 🔗 Team Link System
- Share a code to sync your rolls in real time
- Each teammate sees others' locked/played/rerolled operators
- Syncs independently for each user under one shared team code

---

## 🧠 Team Health Check
- Runs after each roll, including synced teammates
- Uses Ubisoft role tags (e.g. `Breach`, `Intel`, `Support`, `Anti-Entry`, etc.)
- Shows alerts like:
    - ❌ Not enough Hard Breachers
    - ❌ Missing Anti-Gadget coverage
    - ✅ Balanced Team Setup
- Dynamically updates across all users

---

## 💾 Persistent Storage
- Save/load disabled operators and weight settings
- LocalStorage-based presets
- Reset to default anytime

---

## 🧱 UI Layout
- 7-wide grid for easy viewing
- Full dual-panel layout (Attack/Defense)
- Sticky buttons for control flow
- Version tag rendered from `package.json`

---

## 📦 Getting Started

### 1. Clone
```bash
git clone https://github.com/your-username/r6-randomizer.git
cd r6-randomizer
```

### 2. Install
```bash
npm install
```

### 3. Run Dev Server
```bash
npm run dev
```

Visit http://localhost:5173 to start rolling.

---

## 🚀 Deployment

This project uses Vite + GitHub Pages. Customize the `base` in `vite.config.js`:

```js
export default defineConfig({
  base: '/r6-randomizer/',
});
```

Then deploy:
```bash
npm run deploy
```

Or auto-bump version and deploy:
```bash
npm run deploy:minor
```

---

## 📁 Project Structure

```bash
r6-randomizer/
│
├── public/
│   └── images/operators/         # All operator icons
│
├── src/
│   ├── components/               # Grid, teammates, chosen list
│   ├── hooks/                    # Custom logic (Firebase, scaling, state)
│   ├── utils/                    # Roll logic, state tracking, presets, roles
│   ├── styles/                   # CSS: buttons, layout, grid
│   └── OperatorRandomizerUI.jsx  # Main app component
│
├── package.json
├── vite.config.js
└── README.md
```

---

## 🙏 Credits

Built by [RuKira](https://github.com/RuKira)  
Helped by ChatGPT — for implementation, UI brainstorming, and chaos.
