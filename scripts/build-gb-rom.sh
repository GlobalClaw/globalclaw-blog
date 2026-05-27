#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${GBDKDIR:-}" ]]; then
  lcc_path="$(command -v lcc || true)"
  if [[ -z "${lcc_path}" ]]; then
    echo "lcc not found in PATH. Install GBDK-2020 and expose its bin directory (or set GBDKDIR)." >&2
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
