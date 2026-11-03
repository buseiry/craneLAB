# ==============================================================================
# CraneLab: ASVAM-Pulse - Single-File Offline Production Bundler
# TETFund - Tenstar Simulator Training Initiative
# Consortium: ASQ Development & Training UK / SAMMAX Global Services
# ==============================================================================
# This script bundles index.html, styles.css, and all JavaScript modules into a
# single, zero-dependency, self-contained HTML file: CraneLab_Offline_Release.html
# Designed for instant offline distribution via WhatsApp, USB flash, or local mesh.
# ==============================================================================

import os
import re
import sys
import base64
from pathlib import Path

# # State Block: Define source files and release artifact paths
WORKSPACE_DIR = Path(__file__).parent.resolve()
INDEX_FILE = WORKSPACE_DIR / "index.html"
CSS_FILE = WORKSPACE_DIR / "styles.css"
ICON_FILE = WORKSPACE_DIR / "icon.svg"
OUTPUT_FILE = WORKSPACE_DIR / "CraneLab_Offline_Release.html"

# Order of JS modules to inline
JS_MODULES = [
    "security_db.js",
    "inspection_gate.js",
    "crane_physics.js",
    "career_telemetry.js",
    "shutdown_reporting.js"
]

def generate_offline_bundle():
    # # Function: Execute parsing, asset inlining, and bundle synthesis
    print("=" * 70)
    print(" CraneLab: ASVAM-Pulse - Single-File Offline Bundler")
    print(" TETFund - Tenstar Simulator Training Initiative")
    print("=" * 70)

    # # Step 1: Read base HTML shell
    if not INDEX_FILE.exists():
        print(f"[!] Error: Root template {INDEX_FILE} not found.")
        sys.exit(1)

    html_content = INDEX_FILE.read_text(encoding="utf-8")
    print(f"[*] Read base HTML template: {INDEX_FILE.name} ({len(html_content):,} bytes)")

    # # Step 2: Inline CSS stylesheet into <style> block
    if CSS_FILE.exists():
        css_content = CSS_FILE.read_text(encoding="utf-8")
        # Replace external CSS link with inline <style>
        css_tag = f"<style id=\"cranelab-inlined-styles\">\n/* Inlined styles.css for 100% Offline Portability */\n{css_content}\n</style>"
        html_content = re.sub(
            r'<link\s+rel=["\']stylesheet["\']\s+href=["\'][./]*styles\.css["\']\s*/?>',
            lambda m: css_tag,
            html_content,
            flags=re.IGNORECASE
        )
        print(f"[*] Inlined stylesheet: {CSS_FILE.name} ({len(css_content):,} bytes)")
    else:
        print(f"[!] Warning: CSS file {CSS_FILE} not found, skipping CSS inlining.")

    # # Step 3: Inline SVG icon as Base64 Data URI for standalone favicon
    if ICON_FILE.exists():
        svg_bytes = ICON_FILE.read_bytes()
        b64_svg = base64.b64encode(svg_bytes).decode("ascii")
        data_uri = f"data:image/svg+xml;base64,{b64_svg}"
        html_content = re.sub(
            r'<link\s+rel=["\']icon["\']\s+type=["\']image/svg\+xml["\']\s+href=["\'][^"\']+["\']\s*/?>',
            f'<link rel="icon" type="image/svg+xml" href="{data_uri}">',
            html_content,
            flags=re.IGNORECASE
        )
        print(f"[*] Inlined vector favicon: {ICON_FILE.name} as Data URI")

    # # Step 4: Inline each JavaScript module in designated dependency order
    for js_name in JS_MODULES:
        js_path = WORKSPACE_DIR / js_name
        if js_path.exists():
            js_code = js_path.read_text(encoding="utf-8")
            inline_script_tag = f"<script id=\"cranelab-module-{js_name.replace('.', '-')}\">\n/* # Module: {js_name} (Inlined Offline Release) */\n{js_code}\n</script>"
            
            # Pattern matches <script src="./module.js"></script> or <script src="module.js"></script>
            pattern = rf'<script\s+src=["\'][./]*{re.escape(js_name)}["\']\s*></script>'
            if re.search(pattern, html_content, flags=re.IGNORECASE):
                html_content = re.sub(pattern, lambda m: inline_script_tag, html_content, flags=re.IGNORECASE)
                print(f"[*] Inlined script: {js_name} ({len(js_code):,} bytes)")
            else:
                # If script tag wasn't in index.html, inject before closing </body>
                html_content = html_content.replace("</body>", f"{inline_script_tag}\n</body>")
                print(f"[*] Appended script before </body>: {js_name} ({len(js_code):,} bytes)")
        else:
            print(f"[!] Warning: Script module {js_path.name} not found.")

    # # Step 5: Adjust Service Worker registration for local file:// protocol compatibility
    # When opened directly via file://, serviceWorker registration throws a security exception.
    # We guard registration so it runs on http/https, but smoothly bypasses on file://
    file_protocol_guard = """
        // # File-Protocol Guard: Bypass Service Worker registration when run as standalone local file
        if (location.protocol === 'file:') {
          console.log('[CraneLab-Offline] Operating from standalone file:// URL. Service worker registration bypassed for instant offline access.');
          return;
        }
    """
    html_content = html_content.replace(
        "if ('serviceWorker' in navigator) {",
        f"if ('serviceWorker' in navigator) {{\n{file_protocol_guard}"
    )

    # # Step 6: Write fully consolidated offline distribution artifact
    OUTPUT_FILE.write_text(html_content, encoding="utf-8")
    output_size_kb = OUTPUT_FILE.stat().st_size / 1024

    print("=" * 70)
    print(f"[✓] SUCCESS! Standalone offline bundle synthesized:")
    print(f"    File: {OUTPUT_FILE.name}")
    print(f"    Size: {output_size_kb:.2f} KB ({OUTPUT_FILE.stat().st_size:,} bytes)")
    print(f"    Path: {OUTPUT_FILE}")
    print("=" * 70)
    print("This single file can now be distributed via WhatsApp, Bluetooth, or USB")
    print("and launched directly in any browser (Chrome, Safari, Edge) without a server.")
    print("=" * 70)

if __name__ == "__main__":
    generate_offline_bundle()

