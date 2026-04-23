#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${GBDKDIR:-}" ]]; then
  lcc_path="$(command -v lcc)"
  if [[ -z "${lcc_path}" ]]; then
    echo "lcc not found in PATH" >&2
    exit 1
  fi
  GBDKDIR="$(cd "$(dirname "${lcc_path}")/.." && pwd)"
fi

case "${GBDKDIR}" in
  */) ;;
  *) GBDKDIR="${GBDKDIR}/" ;;
esac

npm run build:gb:data
mkdir -p gb/dist
GBDKDIR="${GBDKDIR}" lcc -Wm-yC -Wm-ys -o gb/dist/globalclaw-blog.gb gb/src/main.c gb/generated/posts_data.c
