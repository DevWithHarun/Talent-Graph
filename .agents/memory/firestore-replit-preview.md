---
name: Firestore on Replit preview
description: Firestore transport behavior in the proxied Replit browser preview.
---

Use Firestore long-polling in the browser client when running through the Replit preview proxy.

**Why:** The proxied environment can cause Firebase WebChannel watch streams to enter an internal target-state assertion (`Unexpected state`, often with `ve: -1`), especially while listeners reconnect or are recreated.

**How to apply:** Configure `initializeFirestore` with `experimentalForceLongPolling: true` before obtaining the Firestore instance. Avoid tearing down and recreating every listener in response to Firebase's internal assertion logging; let the SDK recover over the stable transport instead.