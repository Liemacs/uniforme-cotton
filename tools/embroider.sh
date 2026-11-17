#!/usr/bin/env bash
# Editează pieptul tunicii K006 prin OpenAI (images/edits): adaugă logoul brodat.
#
#   OPENAI_API_KEY=... bash tools/embroider.sh tools/embroider gpt-image-2 none
#   OPENAI_KEY_CMD='<comandă care tipărește cheia>' bash tools/embroider.sh tools/embroider gpt-image-2 none
#
# Cheia stă doar într-o variabilă și ajunge la curl prin stdin (-K -): nu apare în
# argumentele procesului, în ieșire sau pe disc. Rezultatul: <dir>/resp.json (b64).
set -euo pipefail
D="$1"; MODEL="${2:-gpt-image-2}"; FID="${3:-none}"
KEY="${OPENAI_API_KEY:-}"
if [ -z "$KEY" ] && [ -n "${OPENAI_KEY_CMD:-}" ]; then KEY="$(eval "$OPENAI_KEY_CMD" 2>/dev/null)"; fi
[ -n "$KEY" ] || { echo "Eroare: setează OPENAI_API_KEY sau OPENAI_KEY_CMD." >&2; exit 1; }
PROMPT='Edit only the transparent (masked) area on the wearer'"'"'s left chest of this black chef jacket photo. Add the brand wordmark shown in the second image (the word "cotton" in lowercase, thin geometric rounded letters) as a small machine embroidery, about 8 cm wide, horizontal and centered in the masked area. Thread colour: warm greige (#B5A99F). Dense satin stitch with fine visible thread lines, a subtle raised relief and a soft sheen from the studio light above. The embroidery sits naturally on the twill fabric and follows its gentle folds. Keep the jacket, its colour, the lighting, the background and everything outside the mask exactly as in the original photo. No other text, no other changes.'
ARGS=(-sS --max-time 300 -w "\nHTTP %{http_code}\n" -o "$D/resp.json"
  -F "model=$MODEL" -F "image[]=@$D/k006_src.png" -F "image[]=@$D/logo_ref.png" -F "mask=@$D/mask.png"
  -F "prompt=$PROMPT" -F "size=1024x1536" -F "quality=high" -F "n=2" -F "output_format=png")
[ "$FID" = "none" ] || ARGS+=(-F "input_fidelity=$FID")
printf 'header = "Authorization: Bearer %s"\n' "$KEY" | curl -K - "${ARGS[@]}" https://api.openai.com/v1/images/edits
unset KEY
