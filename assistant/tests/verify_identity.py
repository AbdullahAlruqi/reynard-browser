"""Fail closed if the fork would overwrite the original app."""
from pathlib import Path
import plistlib
import re
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[2]
ID = "com.dawrak.Reynard"
def read(path):
    return (ROOT / path).read_text()
def plist(path):
    return plistlib.loads((ROOT / path).read_bytes())
def require(condition, message):
    if not condition:
        raise SystemExit(message)
project = read("browser/Reynard.xcodeproj/project.pbxproj")
ids = re.findall(r'PRODUCT_BUNDLE_IDENTIFIER = "([^"]+)";', project)
for expected in (ID, ID + ".Helper", ID + ".OpenIn", "com.dawrak.GeckoView"):
    require(ids.count(expected) == 2, f"Wrong Xcode IDs: {expected}")
require(not any(x.startswith("com.minh-ton.Reynard") for x in ids), "Original app ID retained")
for path, expected in (
    ("browser/Reynard/Entitlements/Reynard.private.entitlements", ID),
    ("browser/Helper/Entitlements/Reynard-Helper.private.entitlements", ID + ".Helper"),
):
    require(plist(path)["application-identifier"] == expected, path)
info = plist("browser/Reynard/Resources/Info.plist")
require(info["CFBundleURLTypes"][0]["CFBundleURLName"] == ID, "URL name")
require("dawrak-reynard" in info["CFBundleURLTypes"][0]["CFBundleURLSchemes"], "URL scheme")
require("reynard" not in info["CFBundleURLTypes"][0]["CFBundleURLSchemes"], "Original URL scheme")
require('dawrak-reynard://open' in read("browser/Extensions/OpenIn/OpenInViewController.swift"), "OpenIn routing")
require('scheme == "dawrak-reynard"' in read("browser/Reynard/SceneDelegate.swift"), "Scene routing")
require("APP_DISPLAY_NAME = Reynard AI" in read("browser/Configuration/Reynard.xcconfig"), "Display name")
packager = read("tools/release/create-ipa.sh")
require("com.minh-ton.Reynard" not in packager, "Packager restores original ID")
for expected in (ID, ID + ".Helper", ID + ".OpenIn"):
    require(f'-string "{expected}"' in packager, f"Packager ID {expected}")
if len(sys.argv) == 2:
    with zipfile.ZipFile(sys.argv[1]) as z:
        for path, expected in (
            ("Payload/Reynard.app/Info.plist", ID),
            ("Payload/Reynard.app/PlugIns/Reynard Helper.appex/Info.plist", ID + ".Helper"),
            ("Payload/Reynard.app/PlugIns/OpenIn.appex/Info.plist", ID + ".OpenIn"),
        ):
            p = plistlib.loads(z.read(path))
            require(p["CFBundleIdentifier"] == expected, f"Packaged ID {path}")
            if expected == ID:
                require(p["CFBundleDisplayName"] == "Reynard AI", "Packaged display name")
                require("dawrak-reynard" in p["CFBundleURLTypes"][0]["CFBundleURLSchemes"], "Packaged URL scheme")
        print("Package identity checks passed.")
print("Source identity checks passed.")
