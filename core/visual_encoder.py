from __future__ import annotations

"""Lossless Visual Encoding (LVE) engine for Aponi status icons."""

from pathlib import Path
from typing import Any, Dict, Tuple

from PIL import Image

ICON_SIZE = 32  # 32x32 pixels
MAX_CTS = 1000  # The score mapped to maximum green intensity
MIN_CTS = 0  # The score mapped to minimum green intensity
BASE_COLOR = (12, 23, 36)  # Dark background color


def _map_cts_to_color(cts: int) -> Tuple[int, int, int]:
    """Maps the CTS score to a green-intensity color."""

    clamped_cts = max(MIN_CTS, min(MAX_CTS, cts))
    intensity = int(12 + (255 - 12) * (clamped_cts / MAX_CTS))

    r = int(intensity * 0.1)
    g = intensity
    b = int(intensity * 0.4)

    return (r, g, b)


def generate_status_icon(
    agent_id: str,
    cts_score: int,
    cryovant_hash_snippet: str,
    target_path: Path,
) -> Dict[str, Any]:
    """
    Generates a 32x32 status icon (PNG) and saves it to target_path.

    - CTS is encoded in the central color intensity.
    - cryovant_hash_snippet is hidden via LSB steganography.
    """

    try:
        img = Image.new("RGB", (ICON_SIZE, ICON_SIZE), color=BASE_COLOR)
        pixels = img.load()
        center_color = _map_cts_to_color(cts_score)

        center_start = ICON_SIZE // 2 - 2
        center_end = ICON_SIZE // 2 + 2
        for x in range(center_start, center_end):
            for y in range(center_start, center_end):
                pixels[x, y] = center_color

        hash_bytes = cryovant_hash_snippet.encode("utf-8")[:4]
        if len(hash_bytes) < 4:
            hash_bytes += b"\x00" * (4 - len(hash_bytes))

        hash_bits = "".join(f"{byte:08b}" for byte in hash_bytes)

        bit_index = 0
        for x in range(ICON_SIZE):
            for y in range(ICON_SIZE):
                if bit_index >= len(hash_bits):
                    break

                r, g, b = pixels[x, y]
                bit = int(hash_bits[bit_index])

                new_r = (r & 0b11111110) | bit
                pixels[x, y] = (new_r, g, b)

                bit_index += 1
            if bit_index >= len(hash_bits):
                break

        target_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(target_path, "PNG")

        return {"ok": True, "path": str(target_path), "cts": cts_score}

    except Exception as exc:  # pragma: no cover - defensive logging path
        return {"ok": False, "error": f"LVE Encoding failed: {exc}"}
