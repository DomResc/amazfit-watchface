"""Extract and validate an explicit Balance 2 XT device ZIP for local installation."""
import io
import json
import sys
import struct
import zipfile
from pathlib import Path


def blacken_padding(data, width, height):
    """Preserve image content and Zepp metadata while making padding RGB565 black."""
    pixels = bytearray(data)
    start = 18 + data[0]
    if len(data) < start + 2 * width * height:
        raise ValueError('Truncated preview pixel data')
    for y in range(height):
        for x in range(324, width):
            offset = start + 2 * (y * width + x)
            struct.pack_into('<H', pixels, offset, 0)
    return bytes(pixels)


def extract_device(bundle_path, app_id, version):
    with zipfile.ZipFile(bundle_path) as bundle:
        manifest = json.loads(bundle.read('manifest.json'))
        matches = [entry for entry in manifest['zpks']
                   if entry['platforms'] == [{'deviceSource': 10486017}]
                   and entry['appType'] == 'watchface'
                   and entry['version']['name'] == version]
        if len(matches) != 1:
            raise ValueError('Expected exactly one explicit Balance 2 XT package')
        with zipfile.ZipFile(io.BytesIO(bundle.read(matches[0]['name']))) as zpk:
            payload = zpk.read('device.zip')
        with zipfile.ZipFile(io.BytesIO(payload)) as device:
            app = json.loads(device.read('app.json'))
            if (str(app['app']['appId']) != str(app_id)
                    or app['app']['version']['name'] != version
                    or app['app']['appType'] != 'watchface'
                    or app['platforms'] != [{'deviceSource': 10486017}]):
                raise ValueError('Device identity or target does not match')
            for name in ['app.bin', 'watchface/index.bin', 'assets/icon.png']:
                if not device.read(name):
                    raise ValueError(f'Empty package entry: {name}')
        # Zeus pads RGB565 previews to a multiple of 16 pixels. Clear all
        # padding bits: bit 15 is red in RGB565, not an alpha flag.
        output = io.BytesIO()
        with zipfile.ZipFile(io.BytesIO(payload)) as source, zipfile.ZipFile(output, 'w') as target:
            for entry in source.infolist():
                data = source.read(entry.filename)
                if entry.filename == 'assets/icon.png':
                    if len(data) < 18 or data[2] != 2 or data[16] != 16:
                        raise ValueError('Unexpected Zeus preview encoding')
                    width, height = struct.unpack_from('<HH', data, 12)
                    if (width, height) != (336, 324):
                        raise ValueError('Unexpected preview dimensions')
                    data = blacken_padding(data, width, height)
                target.writestr(entry, data)
        return output.getvalue()


def package(dist, app_id, version):
    candidates = sorted(dist.glob('*.zab'), key=lambda p: p.stat().st_mtime_ns)
    if not candidates:
        raise ValueError('No Zeus bundle found')
    payload = extract_device(candidates[-1], app_id, version)
    output = dist / f'essential-{version}-10486017.zip'
    output.write_bytes(payload)
    print(f'Validated local installation package: {output.name} ({len(payload)} bytes)')


if __name__ == '__main__':
    package(Path(sys.argv[1]), sys.argv[2], sys.argv[3])
