"""Regression coverage for Zepp RGB565 preview padding."""
import importlib.util
import struct
import io
import json
import tempfile
import zipfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('packager', Path(__file__).resolve().parents[1] / 'scripts/package-watchface.py')
packager = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packager)


class PreviewPaddingTests(unittest.TestCase):
    def test_padding_is_black_in_rgb565_and_content_is_preserved(self):
        header = bytes([46]) + bytes(63)
        row = b'\x34\x12' * 324 + b'\xff\xff' * 12
        data = header + row * 2
        result = packager.blacken_padding(data, 336, 2)
        self.assertEqual(result[:64], header)
        for y in range(2):
            start = 64 + y * 336 * 2
            self.assertEqual(result[start:start + 648], row[:648])
            for x in range(324, 336):
                pixel = struct.unpack_from('<H', result, start + x * 2)[0]
                # Decode the same RGB565 channel bit fields as Gadgetbridge.
                self.assertEqual(((pixel >> 11) & 31, (pixel >> 5) & 63, pixel & 31), (0, 0, 0))

    def test_truncated_pixel_data_is_rejected(self):
        with self.assertRaises(ValueError):
            packager.blacken_padding(bytes(18), 336, 324)


class TargetPackageTests(unittest.TestCase):
    def make_bundle(self, path, platforms):
        preview = bytearray(64 + 336 * 324 * 2)
        preview[0] = 46
        preview[2] = 2
        preview[16] = 16
        struct.pack_into('<HH', preview, 12, 336, 324)
        app = {'app': {'appId': 1092702, 'appType': 'watchface',
                       'version': {'name': '0.1.3'}}, 'platforms': platforms}
        device = io.BytesIO()
        with zipfile.ZipFile(device, 'w') as archive:
            archive.writestr('app.json', json.dumps(app))
            archive.writestr('app.bin', b'app')
            archive.writestr('watchface/index.bin', b'watchface')
            archive.writestr('assets/icon.png', preview)
        zpk = io.BytesIO()
        with zipfile.ZipFile(zpk, 'w') as archive:
            archive.writestr('device.zip', device.getvalue())
        with zipfile.ZipFile(path, 'w') as archive:
            archive.writestr('device.zpk', zpk.getvalue())
            archive.writestr('manifest.json', json.dumps({'zpks': [{
                'name': 'device.zpk', 'platforms': platforms,
                'appType': 'watchface', 'version': {'name': '0.1.3'}}]}))

    def test_shared_package_preserves_all_supported_targets(self):
        platforms = [{'deviceSource': 10486017}, {'deviceSource': 230}]
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'bundle.zab'
            self.make_bundle(path, platforms)
            for device_source in [10486017, 230]:
                payload = packager.extract_device(path, 1092702, '0.1.3', device_source)
                with zipfile.ZipFile(io.BytesIO(payload)) as archive:
                    self.assertEqual(json.loads(archive.read('app.json'))['platforms'], platforms)
            with self.assertRaises(ValueError):
                packager.extract_device(path, 1092702, '0.1.3', 8519937)
            with self.assertRaises(ValueError):
                packager.extract_device(path, 1, '0.1.3', 10486017)

    def test_package_with_an_unlisted_target_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'bundle.zab'
            self.make_bundle(path, [{'deviceSource': 10486017}, {'deviceSource': 1}])
            with self.assertRaises(ValueError):
                packager.extract_device(path, 1092702, '0.1.3', 10486017)


if __name__ == '__main__':
    unittest.main()
