#!/usr/bin/env bash
set -e # Crash on error.

echo "[pgstart] Starting..."

DIR="$( cd "$(dirname "$0")" ; pwd -P )"

datapath="$DIR/pgdata"
mkdir -p "$datapath"


docker run\
  --rm\
  -i\
  --sig-proxy=true\
  -p 5432:5432\
  --mount "type=bind,source=$datapath,target=/var/lib/postgresql/data"\
  postgres
