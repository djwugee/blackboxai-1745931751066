#!/bin/bash
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
