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

# Catch the exact runtime rejection missed by the original build.
import json
runtime = (root / "patches/mobile/shared/modules/geckoview/GeckoViewWebExtension.sys.mjs.patch").read_text()
assert '+      uri.spec === "resource://app/extensions/dawrakassistant/";' in runtime
assert '+    if (!isAndroidResource && !isIOSBuiltInResource) {' in runtime
assert '+    if (!isIOSBuiltInResource && uri.fileName !== "") {' in runtime
assert 'uri.spec === "resource://app/extensions/readerview/" ||' in runtime
for hunk in re.split(r"(?=^@@ -)", runtime, flags=re.M)[1:]:
    header, *lines = hunk.splitlines()
    a,b = re.search(r"@@ -\d+,(\d+) \+\d+,(\d+) @@",header).groups()
    assert int(a)==sum(x.startswith((" ","-")) for x in lines), header
    assert int(b)==sum(x.startswith((" ","+")) for x in lines), header
manifest=json.loads((root / "assistant/extension/manifest.json").read_text())
assert manifest["incognito"]=="not_allowed" and manifest["permissions"]==["activeTab"]
assert manifest["browser_specific_settings"]["gecko"]["id"]=="dawrak-assistant@local.example"
settings=(root / "browser/Reynard/Client/Interface/Library/Settings/Sections/General/Addons/AddonsPreferencesViewController.swift").read_text()
assert settings.count('!$0.isBuiltIn || $0.id == "dawrak-assistant@local.example"')==2
print("Runtime allowlist, patch counts, manifest and settings checks passed")
