// Pit Wall installers, published on the public downloads repo (the source repo is private).
// When a new version is released there, update the file names, versions and sizes here.

export const pitWallReleasesUrl = 'https://github.com/jessrgomez/pit-wall-downloads/releases'

export interface PitWallDownload {
  os: 'windows' | 'ubuntu'
  label: string
  system: string
  file: string
  version: string
  size: string
  url: string
  note: string
  command?: string
}

export const pitWallDownloads: PitWallDownload[] = [
  {
    os: 'windows',
    label: 'Download for Windows',
    system: 'Windows 10 or 11',
    file: 'PitWall-RB-Buddy-Setup-1.2.0.exe',
    version: '1.2.0',
    size: '2.4 MB',
    url: `${pitWallReleasesUrl}/download/v1.2.0/PitWall-RB-Buddy-Setup-1.2.0.exe`,
    note: 'Run the installer; no admin rights needed. If SmartScreen says the app is unrecognised, click More info, then Run anyway.'
  },
  {
    os: 'ubuntu',
    label: 'Download for Ubuntu',
    system: 'Ubuntu, 64-bit',
    file: 'PitWall-RB-Buddy-1.2.0-amd64.deb',
    version: '1.2.0',
    size: '74 MB',
    url: `${pitWallReleasesUrl}/download/ubuntu-v1.2.0/PitWall-RB-Buddy-1.2.0-amd64.deb`,
    note: 'Double-click the .deb and choose Install, or run:',
    command: 'sudo apt install ./PitWall-RB-Buddy-1.2.0-amd64.deb'
  }
]
