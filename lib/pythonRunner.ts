import { spawn } from 'node:child_process'
import path from 'node:path'
import { access } from 'node:fs/promises'

interface RunPythonOptions {
  args?: string[]
  cwd?: string
}

export interface RunPythonResult {
  success: boolean
  output: string
}

const DEFAULT_WINDOWS_EXECUTABLES = ['python', 'py']
const DEFAULT_POSIX_EXECUTABLES = ['python3', 'python']

function resolvePythonExecutable(): string {
  if (process.env.PYTHON_EXECUTABLE) {
    return process.env.PYTHON_EXECUTABLE
  }
  if (process.env.PYTHON) {
    return process.env.PYTHON
  }
  const candidates = process.platform === 'win32' ? DEFAULT_WINDOWS_EXECUTABLES : DEFAULT_POSIX_EXECUTABLES
  return candidates[0]
}

export async function runPythonScript(scriptRelativePath: string, options: RunPythonOptions = {}): Promise<RunPythonResult> {
  const cwd = options.cwd ?? process.cwd()
  const args = options.args ?? []
  const scriptPath = path.isAbsolute(scriptRelativePath)
    ? scriptRelativePath
    : path.join(cwd, scriptRelativePath)

  try {
    await access(scriptPath)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      output: `スクリプトが見つかりません: ${scriptPath}\n${message}`,
    }
  }

  const pythonExecutable = resolvePythonExecutable()
  return new Promise<RunPythonResult>((resolve) => {
    const child = spawn(pythonExecutable, [scriptPath, ...args], {
      cwd,
      env: { ...process.env },
      windowsHide: true,
    })

    let combined = ''
    child.stdout.on('data', (chunk) => {
      combined += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      combined += chunk.toString()
    })

    child.on('close', (code) => {
      resolve({ success: code === 0, output: combined.trim() })
    })
    child.on('error', (error) => {
      resolve({ success: false, output: `Python実行エラー: ${error.message}` })
    })
  })
}
