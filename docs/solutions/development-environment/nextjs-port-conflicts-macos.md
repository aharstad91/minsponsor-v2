---
title: "Next.js Port Conflicts on macOS"
category: development-environment
tags: [nextjs, macos, port-conflict, dev-server]
symptoms:
  - "Port 5000 returns 403 or is already in use"
  - "Bad port: 6000 is reserved for x11"
  - "Dev server won't start on expected port"
root_cause: "macOS and Next.js reserve certain ports"
module: development
date_documented: 2026-01-27
---

# Next.js Port Conflicts on macOS

## Problem

When running `npm run dev -- -p <port>`, the dev server fails to start or returns unexpected responses.

### Symptom 1: Port 5000 is busy
```
$ curl http://localhost:5000
# Returns 403 Forbidden
$ lsof -i :5000
COMMAND   PID  USER   FD   TYPE  DEVICE  NODE NAME
ControlCe 602  user   12u  IPv4  ...     TCP *:commplex-main (LISTEN)
```

### Symptom 2: Port 6000 rejected by Next.js
```
Bad port: "6000" is reserved for x11
Read more: https://nextjs.org/docs/messages/reserved-port
```

## Root Cause

### Port 5000
macOS Monterey (12.0+) uses port 5000 for **AirPlay Receiver**. The `ControlCe` process (Control Center) binds to this port by default.

### Port 6000
Next.js explicitly blocks certain ports for security reasons:
- Port 6000 is reserved for X11 (X Window System)
- Other blocked ports: 6665-6669 (IRC), many others

## Solution

### Option 1: Use a Safe Port (Recommended)
Use ports that are not reserved by macOS or Next.js:

```bash
# Safe ports to use
npm run dev -- -p 3000  # Default, usually safe
npm run dev -- -p 4000  # Works
npm run dev -- -p 8000  # Works
npm run dev -- -p 8080  # Works
```

### Option 2: Disable AirPlay Receiver (for port 5000)
1. Open **System Settings** (or System Preferences on older macOS)
2. Go to **General → AirDrop & Handoff**
3. Turn off **AirPlay Receiver**

This frees port 5000 but disables AirPlay to your Mac.

### Option 3: Check What's Using a Port
```bash
# Find what's using a specific port
lsof -i :5000

# Kill the process if needed (be careful!)
kill -9 <PID>
```

## Prevention

1. **Default to port 3000 or 4000** - These are almost always available
2. **Document the port in `.env.local`** - Use `NEXT_PUBLIC_BASE_URL=http://localhost:<port>`
3. **Add to project README** - Note which port the project uses

## Related

- [Next.js Reserved Ports Documentation](https://nextjs.org/docs/messages/reserved-port)
- [Apple Support: AirPlay Receiver](https://support.apple.com/guide/mac-help/use-your-mac-as-an-airplay-receiver-mh42976/mac)
