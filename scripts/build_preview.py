"""Embed the desktop viewer unchanged, with public demo data and a web adapter.

python scripts/build_preview.py --desktop ../desktop
The release pipeline checks out the desktop repository at the requested commit.
"""
import argparse
import hashlib
import json
import pathlib
import shutil
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]


def build(desktop):
    desktop = pathlib.Path(desktop).resolve()
    viewer = (desktop / 'viewer.html').read_text(encoding='utf-8')
    # Keep app identity and its browser pitch engine in sync with the viewer.
    shutil.copyfile(desktop / 'app/src-tauri/icons/128x128@2x.png', ROOT / 'assets/app-logo.png')
    shutil.copyfile(desktop / 'app/src-tauri/icons/icon.ico', ROOT / 'favicon.ico')
    stretch = desktop / 'vendor/signalsmith-stretch'
    code = (stretch / 'SignalsmithStretch.js').read_text(encoding='utf-8').replace('</script', '<\\/script')
    notice = (stretch / 'LICENSE.txt').read_text(encoding='utf-8').replace('*/', '* /')
    viewer = viewer.replace('<!--__STRETCH__-->', '<script>\n/* Signalsmith Stretch licence:\n' + notice + '\n*/\n' + code + '\n</script>', 1)
    if viewer.count('__PAYLOAD__') != 1:
        raise ValueError('Desktop viewer payload contract changed; review the adapter.')
    payload = json.loads((ROOT / 'demo/payload.json').read_text(encoding='utf-8'))
    for node in payload['nodes']:
        if node['k'] == 'sample':
            path = pathlib.PurePosixPath(node['sp'])
            if path.is_absolute() or '..' in path.parts or not str(path).startswith('audio/'):
                raise ValueError('Demo audio must stay inside demo/audio')
            if not (ROOT / 'demo' / path).is_file():
                raise ValueError(f'Missing demo audio: {path}')
    encoded = json.dumps(payload, separators=(',', ':')).replace('<', '\\u003c')
    viewer = viewer.replace('__PAYLOAD__', encoded).replace('__VMBIN__', '')
    viewer = viewer.replace('<title>Sample library</title>', '<title>Sample Hop · Live desktop preview</title>')
    viewer = viewer.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">')
    # The adapter stays outside the desktop source. Every product control remains
    # the actual desktop implementation, including its existing browser fallbacks.
    boot = '<script>vmBoot();</script>'
    if boot not in viewer or 'function openKit(' not in viewer:
        raise ValueError('Desktop viewer boot/kit contract changed; review the adapter.')
    before, after = viewer.split(boot, 1)
    end = before.rfind('</script>')
    hook = "\nwindow.addEventListener('samplehop-kit', () => openKit(playing >= 0 ? playing : N.findIndex(n => n.role === 'kick')));\n"
    viewer = before[:end] + hook + before[end:] + '<script src="adapter.js"></script>\n' + boot + after
    (ROOT / 'demo/index.html').write_text(viewer, encoding='utf-8')
    sha = subprocess.check_output(['git', '-C', str(desktop), 'rev-parse', 'HEAD'], text=True).strip()
    meta = {'repository': 'AlexM1010/visualise-music-desktop', 'commit': sha,
            'viewer_sha256': hashlib.sha256((desktop / 'viewer.html').read_bytes()).hexdigest(),
            'samples': sum(n['k'] == 'sample' for n in payload['nodes'])}
    (ROOT / 'demo/source.json').write_text(json.dumps(meta, indent=2) + '\n', encoding='utf-8')
    print(f"Built desktop preview: {meta['samples']} sounds, desktop {sha[:12]}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--desktop', type=pathlib.Path, required=True)
    build(parser.parse_args().desktop)
