import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), 'backend', 'ai_pipeline', 'data', 'training_data.csv')

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="training_data.csv"',
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export file' }, { status: 500 })
  }
}
