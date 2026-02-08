# Simple IRC Server (Docker Image)

This directory contains the Dockerfile for building the `simple-irc-server` image.

## Build Instructions

**IMPORTANT:** You must run the `docker build` command from inside this directory (`helmscharts/images/simple-irc-server/`), NOT from the root of the repository.

Correct command:

```bash
cd helmscharts/images/simple-irc-server
docker build -t simple-irc-server:latest .
```

If you try to build from the root directory using `-f`, the build context will be incorrect and `COPY` instructions will fail.
