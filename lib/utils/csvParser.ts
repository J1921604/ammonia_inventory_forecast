/**
 * CSVパーサーユーティリティ
 * predictions.csv (7カラム形式)の読み込みとバリデーション
 */

export interface DataRow {
  date: string
  actual_power: string
  actual_ammonia: string
  is_refill: string
  predicted_ammonia: string
  prediction_error: string
  prediction_error_pct: string
}

export interface ParseResult {
  success: boolean
  data?: DataRow[]
  error?: string
  rowCount?: number
}

/**
 * CSV文字列をDataRow配列にパース
 * @param csvText - CSV形式の文字列
 * @returns ParseResult
 */
export function parseCSV(csvText: string): ParseResult {
  try {
    const lines = csvText.trim().split('\n').filter(Boolean)

    if (lines.length < 2) {
      return {
        success: false,
        error: 'CSVにデータが不足しています（ヘッダーとデータ行が必要です）',
      }
    }

    // ヘッダー検証
    const header = lines[0].split(',').map((h) => h.trim())
    const expectedColumns = [
      'date',
      'actual_power',
      'actual_ammonia',
      'is_refill',
      'predicted_ammonia',
      'prediction_error',
      'prediction_error_pct',
    ]

    if (!arraysEqual(header, expectedColumns)) {
      return {
        success: false,
        error: `無効なヘッダー形式です。期待: ${expectedColumns.join(', ')}`,
      }
    }

    // データ行のパース
    const data: DataRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].trim()
      if (!row) continue

      const values = row.split(',').map((v) => v.trim())

      if (values.length !== 7) {
        return {
          success: false,
          error: `行${i}: カラム数が7ではありません（${values.length}カラム）`,
        }
      }

      const dataRow: DataRow = {
        date: values[0],
        actual_power: values[1],
        actual_ammonia: values[2],
        is_refill: values[3],
        predicted_ammonia: values[4],
        prediction_error: values[5],
        prediction_error_pct: values[6],
      }

      // 基本的なバリデーション
      const validationResult = validateRow(dataRow, i)
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.error,
        }
      }

      data.push(dataRow)
    }

    return {
      success: true,
      data,
      rowCount: data.length,
    }
  } catch (error) {
    return {
      success: false,
      error: `CSVパースエラー: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * 配列が等しいかチェック
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((val, index) => val === b[index])
}

/**
 * DataRow の基本バリデーション
 */
function validateRow(row: DataRow, lineNumber: number): { valid: boolean; error?: string } {
  // 日付形式検証 (YYYY-MM-DD HH:MM:SS)
  const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
  if (!dateRegex.test(row.date)) {
    return {
      valid: false,
      error: `行${lineNumber}: 無効な日付形式です（期待: YYYY-MM-DD HH:MM:SS）`,
    }
  }

  // 数値検証
  const numericFields = [
    'actual_power',
    'actual_ammonia',
    'predicted_ammonia',
    'prediction_error',
    'prediction_error_pct',
  ] as const

  for (const field of numericFields) {
    const value = parseFloat(row[field])
    if (isNaN(value)) {
      return {
        valid: false,
        error: `行${lineNumber}: ${field}が数値ではありません`,
      }
    }
  }

  // is_refill は 0 または 1
  if (row.is_refill !== '0' && row.is_refill !== '1') {
    return {
      valid: false,
      error: `行${lineNumber}: is_refillは0または1である必要があります`,
    }
  }

  // actual_ammonia, predicted_ammonia は 0-1200 の範囲
  const actualAmmonia = parseFloat(row.actual_ammonia)
  const predictedAmmonia = parseFloat(row.predicted_ammonia)

  if (actualAmmonia < 0 || actualAmmonia > 1200) {
    return {
      valid: false,
      error: `行${lineNumber}: actual_ammoniaは0-1200の範囲である必要があります`,
    }
  }

  if (predictedAmmonia < 0 || predictedAmmonia > 1200) {
    return {
      valid: false,
      error: `行${lineNumber}: predicted_ammoniaは0-1200の範囲である必要があります`,
    }
  }

  return { valid: true }
}

/**
 * DataRow配列をCSV文字列に変換
 * @param data - DataRow配列
 * @returns CSV形式の文字列
 */
export function dataToCSV(data: DataRow[]): string {
  const header =
    'date,actual_power,actual_ammonia,is_refill,predicted_ammonia,prediction_error,prediction_error_pct'
  const rows = data.map(
    (row) =>
      `${row.date},${row.actual_power},${row.actual_ammonia},${row.is_refill},${row.predicted_ammonia},${row.prediction_error},${row.prediction_error_pct}`
  )
  return [header, ...rows].join('\n')
}
