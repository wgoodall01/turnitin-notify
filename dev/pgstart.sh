#!/usr/bin/env bash
set -e # Crash on error.

echo "[pgstart] Starting..."

DIR="$( cd "$(dirname "$0")" ; pwd -P )"

datapath="$DIR/pgdata"
cidpath="$DIR/pgcid"

mkdir -p "$datapath"

if [[ -e "$cidpath" ]]; then
  cid=$(cat "$cidpath")
  echo "[pgstart] Killing old container $cid"
  docker kill $cid >/dev/null 
  rm "$cidpath"
fi

cleanup(){
  rm "$cidpath"
  echo "[pgstart] Stopped"
}
trap cleanup EXIT

docker run\
  --rm\
  -i\
  --cidfile "$cidpath"\
  -p 5432:5432\
  --mount "type=bind,source=$datapath,target=/var/lib/postgresql/data"\
  postgres
