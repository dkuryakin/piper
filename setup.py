from distutils.core import setup
from pathlib import Path

with open(Path(__file__).parent.absolute() / 'requirements.txt') as fp:
    install_requires = fp.read()

setup(
    name='Piper',
    version='1.2.0',
    description='Flexible pipelines scheduler',
    author='David Kuryakin',
    author_email='dkuryakin@gmail.com',
    url='https://github.com/dkuryakin/piper',
    packages=['piper'],
    install_requires=install_requires,
)
