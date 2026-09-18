# Import fixtures

All words and geometry here were created for MyLifeBook tests. They contain no personal archive or third-party artwork.

- `sample.md` exercises headings, emphasis, lists, a local image, and a safe external link.
- `sample.docx` is a real OOXML Word document generated with python-docx by `generate-fixtures.py`. It exercises Title/Heading styles, emphasis, lists, an embedded PNG with alt text, a caption, a small table, a footer, a safe link, and an intentionally unsafe `javascript:` link target. The importer must keep the unsafe link's visible label while removing its destination; do not click that test link in Word.
- `detail.png` is a 3 × 2 pixel original test image constructed from six RGB colors. It is embedded byte-for-byte in the DOCX.

To regenerate the binary files, run `python generate-fixtures.py` from any directory with python-docx installed. Regeneration may change ZIP timestamps and therefore the DOCX hash, which is expected; tests compare actual fixture bytes rather than a fixed hash.
