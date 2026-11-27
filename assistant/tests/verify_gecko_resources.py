"""Validate the assistant resource list before allocating a macOS runner."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[2]
patch = (root / "patches/mobile/ios/app/moz.build.patch").read_text()
blocks = re.findall(r'\+FINAL_TARGET_FILES\.extensions\.dawrakassistant \+= \[\n((?:\+    "[^"]+",\n)+)\+\]', patch)
assert len(blocks) == 1, "Expected exactly one assistant resource list"
paths = re.findall(r'"([^"]+)"', blocks[0])
assert paths == sorted(paths), f"Unsorted Gecko resources: {paths}"
assert len(paths) == len(set(paths)), "Duplicate resources"
assert all(p.startswith("dawrakassistant/") for p in paths)
expected = {p.name for p in (root / "assistant/extension").iterdir() if p.is_file()}
assert {Path(p).name for p in paths} == expected, "Packaged resources differ from extension files"
print("Gecko assistant resource order and completeness checks passed")
