"""Check the header links survived into the page GitHub Pages serves.

explore.html is viewer.html with the payload inlined, built by hand and committed.
Nothing rebuilds it on push, so the only thing standing between an edit to
viewer.html and a site that does not have it is somebody remembering. This is
that somebody.

Deliberately no regular expressions and no dependencies: it runs on a bare
runner and the things it looks for are literal.
"""

import pathlib
import sys

viewer = pathlib.Path("viewer.html").read_text(encoding="utf-8")
index = pathlib.Path("explore.html").read_text(encoding="utf-8")
bad = []


def block(text, opener, closer):
    """The span from opener to the first closer after it, or None."""
    i = text.find(opener)
    if i < 0:
        return None
    j = text.find(closer, i)
    return None if j < 0 else text[i:j + len(closer)]


# Verbatim rather than merely present. A stale explore.html can hold an older
# version of the same block, which is the failure worth catching: the link is
# there, it looks right, and it points somewhere that stopped being true.
PIECES = [
    ("the Microsoft Store link", '<a id="getstore"', "</a>"),
    ("its stylesheet rule", "#getstore {", "}"),
    ("the coffee link beside it", '<a id="bmc"', "</a>"),
]

for what, opener, closer in PIECES:
    want = block(viewer, opener, closer)
    if want is None:
        bad.append("viewer.html has no " + what + ".")
    elif want not in index:
        bad.append("explore.html does not have " + what + " as viewer.html now "
                   "writes it. Rebuild it: python -u producer_graph.py")

if bad:
    print("", *bad, sep="\n  - ", file=sys.stderr)
    sys.exit(1)

print("The header links are in explore.html as viewer.html writes them.")
