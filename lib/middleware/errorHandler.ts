/**
 * エラーハンドリングミドルウェア
 * APIルートで発生するエラーを統一的に処理
 */

import { NextResponse } from 'next/server'

export interface APIError {
  success: false
  error: string
  statusCode?: number
  details?: unknown
}

export interface APISuccess<T = unknown> {
  success: true
  data?: T
  message?: string
}

export type APIResponse<T = unknown> = APISuccess<T> | APIError

/**
 * エラーレスポンスを生成
 */
export function errorResponse(
  error: string,
  statusCode: number = 500,
  details?: unknown
): NextResponse<APIError> {
  return NextResponse.json(
    {
      success: false,
      error,
      statusCode,
      details,
    },
    { status: statusCode }
  )
}

/**
 * 成功レスポンスを生成
 */
export function successResponse<T>(
  data?: T,
  message?: string,
  statusCode: number = 200
): NextResponse<APISuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: statusCode }
  )
}

/**
 * localhost判定エラー
 */
export function localhostOnlyError(): NextResponse<APIError> {
  return errorResponse('この機能はローカル環境でのみ使用できます', 400)
}

/**
 * ファイルサイズエラー
 */
export function fileSizeError(maxSizeMB: number): NextResponse<APIError> {
  return errorResponse(`ファイルサイズが${maxSizeMB}MBを超えています`, 413)
}

/**
 * バリデーションエラー
 */
export function validationError(message: string): NextResponse<APIError> {
  return errorResponse(message, 400)
}

/**
 * ファイル未検出エラー
 */
export function fileNotFoundError(filename: string): NextResponse<APIError> {
  return errorResponse(`ファイルが見つかりません: ${filename}`, 404)
}

/**
 * 内部サーバーエラー
 */
export function internalServerError(error: unknown): NextResponse<APIError> {
  const message = error instanceof Error ? error.message : String(error)
  return errorResponse(`内部サーバーエラー: ${message}`, 500, error)
}

/**
 * エラーハンドリングラッパー
 * APIルート関数をラップしてエラーを自動キャッチ
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<APISuccess<T>>>
): Promise<NextResponse<APIResponse<T>>> {
  return handler().catch((error) => {
    console.error('API Error:', error)
    return internalServerError(error)
  })
}

/**
 * localhost環境チェック
 */
export function checkLocalhost(request: Request): boolean {
  const url = new URL(request.url)
  const hostname = url.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

/**
 * localhost専用APIラッパー
 */
export function localhostOnly<T>(
  request: Request,
  handler: () => Promise<NextResponse<APISuccess<T>>>
): Promise<NextResponse<APIResponse<T>>> {
  if (!checkLocalhost(request)) {
    return Promise.resolve(localhostOnlyError())
  }
  return withErrorHandler(handler)
}
