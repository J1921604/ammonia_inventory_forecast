import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { runPythonScript } from '@/lib/pythonRunner'

const BACKEND_DIR = path.join(process.cwd(), 'backend', 'ai_pipeline')
const TRAINING_DATA_PATH = path.join(BACKEND_DIR, 'data', 'training_data.csv')

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (file.name !== 'training_data.csv') {
      return NextResponse.json({ error: 'Invalid file name. Only training_data.csv is allowed.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // ディレクトリが存在することを確認
    const dirPath = path.dirname(TRAINING_DATA_PATH)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    fs.writeFileSync(TRAINING_DATA_PATH, buffer)

    const prepareResult = await runPythonScript('src/prepare_data.py', {
      cwd: BACKEND_DIR,
    })

    if (!prepareResult.success) {
      return NextResponse.json({
        error: 'アップロード後のデータ整形に失敗しました。ログを確認してください。',
        log: prepareResult.output,
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'training_data.csv をアップロードし、データ整形を完了しました。',
      path: TRAINING_DATA_PATH,
      log: prepareResult.output,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
