# core/visual_encoder.py (stdlib only)
import os
import struct
import binascii
import zlib
from typing import Any, Dict


def _chunk(tag: bytes, data: bytes) -> bytes:
    """Helper to format a PNG chunk (length + type + data + CRC)."""
    return (
        struct.pack("!I", len(data))
        + tag
        + data
        + struct.pack("!I", binascii.crc32(tag + data) & 0xFFFFFFFF)
    )


def _png_header(width: int, height: int) -> bytes:
    """Creates the PNG signature and IHDR chunk."""
    sig = b"\x89PNG\r\n\x1a\n"
    # 8-bit, RGB (type 2)
    ihdr = struct.pack("!IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return sig + _chunk(b"IHDR", ihdr)


def _scale_cts_to_g(cts: int) -> int:
    """Maps CTS value to an 8-bit green channel intensity [32, 224]."""
    lo, hi = -32768, 32768
    clamped = max(lo, min(hi, int(cts)))
    norm = (clamped - lo) / float(hi - lo)
    return int(32 + norm * (224 - 32))


def _embed_bits(pixels: bytearray, bits: str) -> None:
    """Embeds bits into the LSB of a pixel bytearray (R, G, B order)."""
    bit_index = 0
    for i, value in enumerate(pixels):
        if bit_index >= len(bits):
            break
        bit = 1 if bits[bit_index] == "1" else 0
        pixels[i] = (value & 0xFE) | bit
        bit_index += 1


def _to_bits(hex_prefix: str) -> str:
    """Converts a hex string prefix into a string of binary bits."""
    prefix = hex_prefix[: len(hex_prefix) & ~1]
    try:
        raw = bytes.fromhex(prefix)
    except ValueError:
        raw = b"\x00" * (len(prefix) // 2)
    return "".join(f"{byte:08b}" for byte in raw)


def generate_state_icon(cts: int, cryo_hash_hex: str, out_path: str, size: int = 24) -> Dict[str, Any]:
    """
    Generates a tiny RGB PNG icon. Green channel encodes CTS, LSBs embed hash prefix.
    """
    try:
        width = height = int(size)
        green = _scale_cts_to_g(cts)
        row_base = [32, green, 32]

        raw = bytearray()
        for _ in range(height):
            raw.append(0)
            raw.extend(row_base * width)

        hash_bits = _to_bits(cryo_hash_hex[:16])
        _embed_bits(raw, hash_bits)

        compressed = zlib.compress(bytes(raw), level=9)
        png = _png_header(width, height) + _chunk(b"IDAT", compressed) + _chunk(b"IEND", b"")

        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "wb") as file:
            file.write(png)

        return {"ok": True, "path": out_path, "cts": cts}
    except Exception as exc:  # pragma: no cover - defensive guard
        return {"ok": False, "error": f"LVE Encoder failed: {exc}"}
