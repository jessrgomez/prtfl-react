import { useState, type MouseEvent } from 'react'
import { useF1Buddy } from '../composables/useF1Buddy'
import { pitWallDownloads, pitWallReleasesUrl, type PitWallDownload as Download } from '../data/pitWall'

const tech = ['PowerShell', 'WPF / XAML', 'WebView2', 'Electron', 'REST APIs']

function OsIcon({ os }: { os: Download['os'] }) {
  if (os === 'windows') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <rect x="3" y="3" width="8.5" height="8.5" />
        <rect x="12.5" y="3" width="8.5" height="8.5" />
        <rect x="3" y="12.5" width="8.5" height="8.5" />
        <rect x="12.5" y="12.5" width="8.5" height="8.5" />
      </svg>
    )
  }
  // Ubuntu's circle of friends, simplified: a ring broken in front of each of the three heads.
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5.6" strokeDasharray="8.53 3.2" strokeDashoffset="-1.6" />
      <circle cx="21.2" cy="12" r="2.3" fill="currentColor" stroke="none" />
      <circle cx="7.4" cy="19.97" r="2.3" fill="currentColor" stroke="none" />
      <circle cx="7.4" cy="4.03" r="2.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

// Side project card under Projects: Pit Wall, the desktop app the F1 Buddy comes from, with its installers.
export default function PitWallDownload() {
  const { active: buddyOn, launch: launchBuddy, park: parkBuddy } = useF1Buddy()
  const [copied, setCopied] = useState(false)

  const toggleBuddy = (event: MouseEvent<HTMLButtonElement>) => {
    if (buddyOn) {
      parkBuddy()
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    launchBuddy({ x: rect.left + rect.width / 2, y: rect.top })
  }

  const copyCommand = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable: the command stays on screen to copy by hand
    }
  }

  return (
    <article id="pit-wall" className="pitwall-card">
      <div className="pitwall-info">
        <p className="section-kicker">Side project · Desktop app</p>
        <h3>Pit Wall: RB Buddy</h3>
        <p>
          An F1 car that drives along your screen and acts as your race engineer. It keeps your tasks, radios “Box, box!”
          when something is due, and calls out your Jira, Trello, Slack and Lark items. Install it and try it as your own
          task tracker buddy.
        </p>
        <p className="pitwall-start">
          <strong>No account needed to start:</strong> open Pit Wall and type <code>/add call the bank at 3pm</code> in
          Talk. Connect any account in Settings to open the Tasks tab.
        </p>
        <div className="project-tech">
          {tech.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <button className="btn btn-outline" type="button" onClick={toggleBuddy}>
          {buddyOn ? 'Park the F1 Buddy' : 'Try it in your browser'}
        </button>
      </div>

      <div className="pitwall-downloads">
        {pitWallDownloads.map((download) => (
          <div key={download.os} className="pitwall-download">
            <a className="pitwall-download-link" href={download.url} rel="noopener">
              <OsIcon os={download.os} />
              <span>
                <strong>{download.label}</strong>
                <span className="pitwall-download-meta">
                  {download.system} · v{download.version} · {download.size}
                </span>
              </span>
              <svg className="pitwall-download-arrow" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v12M6 11l6 6 6-6M5 20h14" />
              </svg>
            </a>
            <p className="pitwall-note">{download.note}</p>
            {download.command && (
              <div className="pitwall-command">
                <code>{download.command}</code>
                <button type="button" onClick={() => copyCommand(download.command ?? '')}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        ))}
        <a className="pitwall-releases" href={pitWallReleasesUrl} target="_blank" rel="noopener noreferrer">
          All versions and install steps →
        </a>
      </div>
    </article>
  )
}
