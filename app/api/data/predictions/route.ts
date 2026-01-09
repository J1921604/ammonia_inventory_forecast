import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), 'backend', 'ai_pipeline', 'data', 'predictions.csv')

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/csv',
      },
    })
  } catch (error) {
    console.error('Predictions fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 })
  }
}
