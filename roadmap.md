# 🦆 Duckball: Roadmap

A simple, fast-to-build multiplayer browser basketball game featuring ducks with flashy moves. Inspired by NBA Street Vol. 2, but with quacks.

---

## ✅ Tech Stack

| Area        | Tech                                 |
| ----------- | ------------------------------------ |
| Game Engine | threejs                           |
| Multiplayer | Colyseus (Node.js)                   |
| Frontend    | HTML + Three.js                    |
| Backend     | Node.js + Colyseus                   |
| Hosting     | Vercel (frontend) + Render (backend) |
| Assets      | Blender + Mixamo                     |
| Auth        | Anonymous / Party Code               |

---

## 🔧 MVP Feature Set (Lean Scope)

* Duck avatars with random skins
* Real-time 2v2 or FFA gameplay
* Shooting, passing, dunking
* Minimal animations: run, shoot, dunk
* Anonymous login and auto-room join
* Score tracking and game reset
* Basic sound effects (quack, bounce, dunk)

---

## 🛠 Development Phases

### 📆 Phase 1: Core Setup

* [x] Set up Three.js project
* [x] Add static basketball court
* [x] Import basic duck model with Mixamo rig
* [x] Add movement + camera follow

### 🏀 Phase 2: Ball Mechanics

### 🏀 Phase 2: Ball Mechanics

* [x] Ball bounce + attach on pickup
* [ ] Dunk trigger + scoring logic
* [ ] Reset ball after score

### 🌐 Phase 3: Multiplayer Core

* [ ] Set up Colyseus server on Render
* [ ] Sync duck position + animation state
* [ ] Sync ball position + game score
* [ ] Handle disconnects/rejoins

### 📅 Phase 4: UI and Juice

* [ ] Auto-join open room or create new
* [ ] Display game score
* [ ] Add basic sound effects (quack, dunk, bounce)
* [ ] Add win message / restart button

---

## 🚀 MVP Launch Plan

1. Finish 1v1 working prototype
2. Add 2v2 support
3. Polish visuals + sounds
4. Deploy to Vercel
5. Record TikTok of a duck dunking

---

## ⚡ Known Risks

* WebGL performance on mobile
* Latency issues with room sync
* No user accounts (intentional for speed)

---

## 🛠 Tools & Assets

* [Mixamo](https://www.mixamo.com/)
* [Three.js](https://threejs.org/)
* [Colyseus](https://colyseus.io/)
* [Sketchfab](https://sketchfab.com/)
* [Freesound](https://freesound.org/)

---

**Let the ducks dunk.**
