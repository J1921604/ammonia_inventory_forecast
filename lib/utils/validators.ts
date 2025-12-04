/**
 * データバリデーションユーティリティ
 * 各種データの整合性チェックとバリデーション
 */

import { DataRow } from './csvParser'

export interface ValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
}

/**
 * 予測誤差の整合性を検証
 * prediction_error = predicted_ammonia - actual_ammonia
 */
export function validatePredictionError(row: DataRow): ValidationResult {
  const actualAmmonia = parseFloat(row.actual_ammonia)
  const predictedAmmonia = parseFloat(row.predicted_ammonia)
  const predictionError = parseFloat(row.prediction_error)

  const calculatedError = predictedAmmonia - actualAmmonia
  const diff = Math.abs(predictionError - calculatedError)

  if (diff > 0.01) {
    // 誤差0.01m³以内
    return {
      valid: false,
      error: `prediction_errorの値が不整合です（期待: ${calculatedError.toFixed(4)}, 実際: ${predictionError}）`,
    }
  }

  return { valid: true }
}

/**
 * 予測誤差率の整合性を検証
 * prediction_error_pct = (prediction_error / actual_ammonia) * 100
 */
export function validatePredictionErrorPct(row: DataRow): ValidationResult {
  const actualAmmonia = parseFloat(row.actual_ammonia)
  const predictionError = parseFloat(row.prediction_error)
  const predictionErrorPct = parseFloat(row.prediction_error_pct)

  if (actualAmmonia === 0) {
    // ゼロ除算回避
    return { valid: true, warnings: ['actual_ammoniaが0のため誤差率計算をスキップ'] }
  }

  const calculatedPct = (predictionError / actualAmmonia) * 100
  const diff = Math.abs(predictionErrorPct - calculatedPct)

  if (diff > 0.1) {
    // 誤差0.1%以内
    return {
      valid: false,
      error: `prediction_error_pctの値が不整合です（期待: ${calculatedPct.toFixed(4)}, 実際: ${predictionErrorPct}）`,
    }
  }

  return { valid: true }
}

/**
 * DataRow配列全体の整合性を検証
 */
export function validateDataset(data: DataRow[]): ValidationResult {
  const warnings: string[] = []

  for (let i = 0; i < data.length; i++) {
    const row = data[i]

    // prediction_error 検証
    const errorResult = validatePredictionError(row)
    if (!errorResult.valid) {
      return {
        valid: false,
        error: `行${i + 1}: ${errorResult.error}`,
      }
    }
    if (errorResult.warnings) {
      warnings.push(...errorResult.warnings.map((w) => `行${i + 1}: ${w}`))
    }

    // prediction_error_pct 検証
    const pctResult = validatePredictionErrorPct(row)
    if (!pctResult.valid) {
      return {
        valid: false,
        error: `行${i + 1}: ${pctResult.error}`,
      }
    }
    if (pctResult.warnings) {
      warnings.push(...pctResult.warnings.map((w) => `行${i + 1}: ${w}`))
    }
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * ファイルサイズを検証
 * @param bytes - ファイルサイズ（バイト）
 * @param maxSizeMB - 最大サイズ（MB）
 */
export function validateFileSize(bytes: number, maxSizeMB: number = 5): ValidationResult {
  const maxBytes = maxSizeMB * 1024 * 1024

  if (bytes > maxBytes) {
    return {
      valid: false,
      error: `ファイルサイズが${maxSizeMB}MBを超えています（${(bytes / 1024 / 1024).toFixed(2)}MB）`,
    }
  }

  return { valid: true }
}

/**
 * 日付の昇順ソート確認
 */
export function validateDateOrder(data: DataRow[]): ValidationResult {
  for (let i = 1; i < data.length; i++) {
    const prevDate = new Date(data[i - 1].date)
    const currDate = new Date(data[i].date)

    if (prevDate > currDate) {
      return {
        valid: false,
        error: `日付が昇順になっていません（行${i}: ${data[i - 1].date} > ${data[i].date}）`,
      }
    }
  }

  return { valid: true }
}

/**
 * 在庫レベルの急激な変化を検出
 * @param data - DataRow配列
 * @param threshold - 閾値（m³）
 */
export function detectAnomalies(data: DataRow[], threshold: number = 300): ValidationResult {
  const warnings: string[] = []

  for (let i = 1; i < data.length; i++) {
    const prevAmmonia = parseFloat(data[i - 1].actual_ammonia)
    const currAmmonia = parseFloat(data[i].actual_ammonia)
    const isRefill = data[i].is_refill === '1'

    const change = Math.abs(currAmmonia - prevAmmonia)

    // 補充フラグがない場合の急激な変化を検出
    if (!isRefill && change > threshold) {
      warnings.push(
        `行${i + 1}: 補充フラグなしで在庫レベルが${change.toFixed(1)}m³変化しています（${data[i - 1].date} → ${data[i].date}）`
      )
    }
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}
