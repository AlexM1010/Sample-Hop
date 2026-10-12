"""Offline contracts for the showcase and the shared desktop preview."""
import json
import pathlib
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('src', 'href') and value and not value.startswith(('#', 'http:', 'https:', 'data:')):
                self.paths.append(value.split('#')[0].split('?')[0])


def check():
    for name in ['index.html', 'demo/index.html']:
        path = ROOT / name
        parser = Links()
        parser.feed(path.read_text(encoding='utf-8-sig'))
        for link in parser.paths:
            assert (path.parent / link).is_file(), f'{name}: missing {link}'
    data = json.loads((ROOT / 'demo/payload.json').read_text())
    samples = [n for n in data['nodes'] if n['k'] == 'sample']
    assert len(samples) == 300
    for sample in samples:
        assert (ROOT / 'demo' / sample['sp']).is_file()
        assert not pathlib.PurePosixPath(sample['sp']).is_absolute()
        assert '..' not in pathlib.PurePosixPath(sample['sp']).parts
    viewer = (ROOT / 'demo/index.html').read_text(encoding='utf-8')
    assert '__PAYLOAD__' not in viewer
    assert '<script src="adapter.js"></script>' in viewer
    assert 'C:\\Users\\' not in viewer and 'C:\\Development\\' not in viewer
    assert (ROOT / 'demo/CREDITS.md').is_file()
    print('Showcase links, public demo data and all 300 audio files verified.')


if __name__ == '__main__':
    check()
