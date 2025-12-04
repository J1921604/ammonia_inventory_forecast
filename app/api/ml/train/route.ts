import path from 'node:path'
import { NextResponse } from 'next/server'
import { runPythonScript } from '@/lib/pythonRunner'

const BACKEND_DIR = path.join(process.cwd(), 'backend', 'ai_pipeline')

export async function POST() {
  try {
    const result = await runPythonScript('src/train.py', { cwd: BACKEND_DIR })

    if (!result.success) {
      return NextResponse.json(
        { ok: false, log: result.output || '学習に失敗しました。ログを確認してください。' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, log: result.output })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, log: message }, { status: 500 })
  }
}
