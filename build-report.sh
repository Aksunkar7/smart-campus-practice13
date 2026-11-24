#!/usr/bin/env bash
# Builds the submission report from the markdown sections in report/.
# The markdown files are the single source of truth; the .docx and .pdf are
# generated artefacts.
set -euo pipefail
cd "$(dirname "$0")"
OUT="Practice13_Myktybek_Aksungkar"
pandoc report/0*.md report/10-appendices.md \
  --from=markdown+pipe_tables+yaml_metadata_block \
  --highlight-style=tango \
  -o "${OUT}.docx"
soffice --headless --convert-to pdf "${OUT}.docx" --outdir . >/dev/null 2>&1
echo "built ${OUT}.docx and ${OUT}.pdf"
