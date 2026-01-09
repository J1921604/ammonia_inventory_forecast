import path from 'node:path'
import { NextResponse } from 'next/server'
import { runPythonScript } from '@/lib/pythonRunner'

const BACKEND_DIR = path.join(process.cwd(), 'backend', 'ai_pipeline')

interface PredictRequestBody {
  refillThreshold?: number
  refillAmount?: number
  refillTargetPostLevel?: number
  forecastDays?: number
}

function buildArgs(body: PredictRequestBody): string[] {
  const args: string[] = []
  if (typeof body.refillThreshold === 'number') {
    args.push('--refill_threshold', String(body.refillThreshold))
  }
  if (typeof body.refillAmount === 'number') {
    args.push('--refill_amount', String(body.refillAmount))
  }
  if (typeof body.refillTargetPostLevel === 'number') {
    args.push('--refill_target_post_level', String(body.refillTargetPostLevel))
  }
  if (typeof body.forecastDays === 'number') {
    args.push('--forecast_days', String(body.forecastDays))
  }
  return args
}

export async function POST(request: Request) {
  try {
    const body: PredictRequestBody = await request.json().catch(() => ({}))
    const args = buildArgs(body)

    const result = await runPythonScript('src/predict.py', { cwd: BACKEND_DIR, args })

    if (!result.success) {
      return NextResponse.json(
        { ok: false, log: result.output || '予測に失敗しました。ログを確認してください。' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, log: result.output })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, log: message }, { status: 500 })
  }
}
