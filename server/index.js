import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import { GoogleGenAI } from '@google/genai'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const KNOWLEDGE_PATH = path.join(__dirname, 'data', 'knowledge.json')

const PORT = process.env.PORT || 8787
const ADMIN_TOKEN = process.env.ADMIN_TOKEN

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

async function readKnowledge() {
  const raw = await readFile(KNOWLEDGE_PATH, 'utf-8')
  return JSON.parse(raw)
}

async function writeKnowledge(entries) {
  await writeFile(KNOWLEDGE_PATH, JSON.stringify(entries, null, 2) + '\n', 'utf-8')
}

function buildSystemPrompt(entries) {
  const facts = entries.map((entry) => `- ${entry.label}: ${entry.content}`).join('\n')
  return `You are the AI assistant embedded in Jessica Gomez's portfolio website.
Answer questions about her experience, skills, projects, education, and how to contact her,
using only the facts below. Keep answers to 2-3 sentences, friendly and concise. If asked
something unrelated to Jessica or her work, politely redirect to what you can help with.

${facts}`
}

function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) {
    return res.status(503).json({ error: 'Admin CMS is not configured (set ADMIN_TOKEN)' })
  }
  if (req.get('x-admin-token') !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Invalid admin token' })
  }
  next()
}

const app = express()
app.use(cors())
app.use(express.json())
app.use('/admin', express.static(path.join(__dirname, 'admin')))

app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body ?? {}

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' })
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Chat backend is not configured' })
  }

  try {
    const knowledge = await readKnowledge()
    const contents = [
      ...(Array.isArray(history) ? history : []).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.text ?? '') }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ]

    const response = await genAI.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents,
      config: {
        maxOutputTokens: 300,
        systemInstruction: buildSystemPrompt(knowledge)
      }
    })

    res.json({ reply: response.text ?? '' })
  } catch (err) {
    console.error('Chat request failed:', err)
    res.status(502).json({ error: 'Failed to reach the AI service' })
  }
})

// Public read-only feed so the frontend's offline fallback can mirror CMS edits
// even when ANTHROPIC_API_KEY isn't configured.
app.get('/api/knowledge', async (req, res) => {
  const entries = await readKnowledge()
  res.json(entries.map(({ id, label, content }) => ({ id, label, content })))
})

// --- CMS API for editing the chatbot's knowledge base (protected by ADMIN_TOKEN) ---

app.get('/api/admin/knowledge', requireAdmin, async (req, res) => {
  res.json(await readKnowledge())
})

app.post('/api/admin/knowledge', requireAdmin, async (req, res) => {
  const { label, content } = req.body ?? {}
  if (typeof label !== 'string' || !label.trim() || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'label and content are required' })
  }

  const entries = await readKnowledge()
  const entry = { id: randomUUID(), label: label.trim(), content: content.trim() }
  entries.push(entry)
  await writeKnowledge(entries)
  res.status(201).json(entry)
})

app.put('/api/admin/knowledge/:id', requireAdmin, async (req, res) => {
  const { label, content } = req.body ?? {}
  if (typeof label !== 'string' || !label.trim() || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'label and content are required' })
  }

  const entries = await readKnowledge()
  const index = entries.findIndex((entry) => entry.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: 'Entry not found' })
  }

  entries[index] = { ...entries[index], label: label.trim(), content: content.trim() }
  await writeKnowledge(entries)
  res.json(entries[index])
})

app.delete('/api/admin/knowledge/:id', requireAdmin, async (req, res) => {
  const entries = await readKnowledge()
  const next = entries.filter((entry) => entry.id !== req.params.id)
  if (next.length === entries.length) {
    return res.status(404).json({ error: 'Entry not found' })
  }

  await writeKnowledge(next)
  res.status(204).end()
})

app.listen(PORT, () => {
  console.log(`Chat API listening on http://localhost:${PORT}`)
  console.log(`CMS available at http://localhost:${PORT}/admin`)
})
