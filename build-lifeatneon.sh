#!/usr/bin/env bash
set -euo pipefail
cat parts/part-*.b64 | base64 -d | gzip -dc > index.html
