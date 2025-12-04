'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface DataRow {
  date: string
  actual_power: string
  actual_ammonia: string
  is_refill: string
  predicted_ammonia: string
  prediction_error: string
  prediction_error_pct: string
}

export default function Dashboard() {
  const [chartData, setChartData] = useState<DataRow[]>([])
  const [baseDate, setBaseDate] = useState<string>('')
  const [refillLevel, setRefillLevel] = useState<number>(600)
  const [currentRange] = useState<number>(30)
  const [warningState, setWarningState] = useState({
    isWarning: false,
    title: '',
    text: '',
  })
  const [stats, setStats] = useState({
    currentStock: '-',
    accuracy: '-',
    avgError: '-',
    nextRefill: '-',
  })
  const [activeMonth, setActiveMonth] = useState<string>('')
  const [reloadKey, setReloadKey] = useState(0)
  const [isTraining, setIsTraining] = useState(false)
  const [isPredicting, setIsPredicting] = useState(false)
  const [isLocal, setIsLocal] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('-')
  const chartRef = useRef<ChartJS<'line'>>(null)

  useEffect(() => {
    // ローカル環境判定 (localhost または 127.0.0.1)
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      setIsLocal(hostname === 'localhost' || hostname === '127.0.0.1')
    }
  }, [])

  // ユーティリティ関数
  const ymd = (d: Date): string => {
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const parseJstDate = (iso: string): Date => {
    if (!iso) return new Date(NaN)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(iso)) {
      return new Date(iso.replace(' ', 'T') + '+09:00')
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(iso)) {
      return new Date(iso + '+09:00')
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return new Date(iso + 'T00:00:00+09:00')
    }
    return new Date(iso)
  }

  const jstTodayString = (): string => {
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    const japanTime = new Date(utc + 9 * 60 * 60000)
    return ymd(japanTime)
  }

  // CSVデータの読み込み
  useEffect(() => {
    const loadCsvData = async () => {
      try {
        // 静的ファイルとして public/data/predictions.csv を読み込む
        // GitHub Pages (production) では basePath が付与されるため、環境変数または相対パスで対応
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
        const response = await fetch(`${basePath}/data/predictions.csv`)
        const csvText = await response.text()
        
        const lines = csvText.split('\n').filter(Boolean)
        if (lines.length < 2) {
          console.error('CSVにデータが不足しています')
          return
        }

        const headers = lines[0].split(',').map((h) => h.trim())
        const data: DataRow[] = []

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i]
          if (!row.trim()) continue
          const values = row.split(',').map((v) => v.trim())
          const obj: any = {}
          headers.forEach((h, idx) => {
            obj[h] = values[idx] ?? ''
          })
          if (obj.date && !isNaN(Date.parse(obj.date))) {
            data.push(obj as DataRow)
          }
        }

        data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setChartData(data)

        // 最終更新日時を設定（ビルド時刻または現在時刻）
        if (data.length > 0) {
          // ビルド時刻が環境変数で設定されている場合はそれを使用、なければ現在時刻
          const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME
          if (buildTime) {
            setLastUpdate(buildTime)
          } else {
            const now = new Date()
            const formattedDate = now.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
            setLastUpdate(formattedDate)
          }
        }

        // 初期基準日の設定
        const todayStr = jstTodayString()
        const normalizedDates = data
          .map((d) => ymd(parseJstDate(d.date)))
          .filter(Boolean)
          .sort()

        if (normalizedDates.includes(todayStr)) {
          setBaseDate(todayStr)
        } else {
          const past = normalizedDates.filter((d) => d <= todayStr)
          if (past.length > 0) {
            setBaseDate(past[past.length - 1])
          } else {
            setBaseDate(normalizedDates[Math.floor(normalizedDates.length / 2)])
          }
        }
      } catch (error) {
        console.error('CSV読み込みエラー:', error)
      }
    }

    loadCsvData()
  }, [reloadKey])

  const isBeforeDateOnly = (a: Date, b: Date): boolean => {
    const ay = ymd(a)
    const by = ymd(b)
    return ay < by
  }

  const isAfterDateOnly = (a: Date, b: Date): boolean => {
    const ay = ymd(a)
    const by = ymd(b)
    return ay > by
  }

  // チャート更新
  useEffect(() => {
    if (chartData.length === 0 || !baseDate) return

    let baseDateObj = parseJstDate(baseDate)
    
    // データ範囲に合わせて baseDate をクランプする
    const dataStart = parseJstDate(chartData[0].date)
    const dataEnd = parseJstDate(chartData[chartData.length - 1].date)
    const effectiveDataEnd = dataEnd
    
    // 日付範囲チェックとクランプ
    if (isBeforeDateOnly(baseDateObj, dataStart)) {
      baseDateObj = new Date(dataStart)
      setBaseDate(ymd(dataStart))
    }
    
    if (isAfterDateOnly(baseDateObj, effectiveDataEnd)) {
      baseDateObj = new Date(effectiveDataEnd)
      setBaseDate(ymd(effectiveDataEnd))
      // データ範囲超過の警告を表示
      setWarningState({
        isWarning: true,
        title: '⚠️ 入力日がデータ範囲を超えています',
        text: `入力日はデータの最終日 (${ymd(effectiveDataEnd)}) を超えています。表示は最終データ日へクランプされています。`,
      })
    }

    const startDate = new Date(baseDateObj)
    startDate.setDate(startDate.getDate() - currentRange)
    const endDate = new Date(baseDateObj)
    endDate.setDate(endDate.getDate() + currentRange)

    const filteredData = chartData.filter((item) => {
      const d = parseJstDate(item.date)
      return d >= startDate && d <= endDate
    })

    if (filteredData.length === 0) return

    // データ範囲内の場合のみ警告チェック（範囲超過時は上書きしない）
    if (!isAfterDateOnly(baseDateObj, effectiveDataEnd)) {
      checkRefillWarning(filteredData, refillLevel, baseDateObj)
    }
    // 統計更新
    updateStats(filteredData, baseDateObj)
    // アクティブな月ボタン更新
    const key = `${baseDateObj.getFullYear()}-${String(baseDateObj.getMonth() + 1).padStart(2, '0')}`
    setActiveMonth(key)
  }, [chartData, baseDate, refillLevel, currentRange])

  const checkRefillWarning = (
    data: DataRow[],
    refillLvl: number,
    baseDateObj: Date
  ) => {
    const futureData = data.filter((item) => parseJstDate(item.date) >= baseDateObj)
    const warningDays: { days: number; level: number; date: string }[] = []

    for (const item of futureData) {
      const predictedLevel = parseFloat(item.predicted_ammonia) || 0
      if (predictedLevel < refillLvl) {
        const daysFromBase = Math.ceil(
          (parseJstDate(item.date).getTime() - baseDateObj.getTime()) / (1000 * 60 * 60 * 24)
        )
        warningDays.push({ days: daysFromBase, level: predictedLevel, date: item.date })
      }
    }

    if (warningDays.length > 0) {
      const nearestWarning = warningDays[0]
      setWarningState({
        isWarning: true,
        title: '⚠️ 補充警告',
        text: `${nearestWarning.days}日後（${nearestWarning.date}）に在庫レベルが補充レベル（${refillLvl} m³）を下回る予測です。\n予測在庫レベル: ${nearestWarning.level.toFixed(1)} m³`,
      })
    } else {
      setWarningState({
        isWarning: false,
        title: '✅ 警告なし',
        text: '予測期間内に補充レベルを下回る予測は有りません。',
      })
    }
  }

  const updateStats = (data: DataRow[], baseDateObj: Date) => {
    if (data.length === 0) return

    const baseDateStr = ymd(baseDateObj)
    const baseData = data.find((item) => {
      const itemDateStr = ymd(parseJstDate(item.date))
      return itemDateStr === baseDateStr
    })

    const currentStock = baseData ? parseFloat(baseData.actual_ammonia) : NaN
    const currentStockText = !isNaN(currentStock)
      ? `${currentStock.toFixed(1)} m³`
      : 'データ無し'

    const actualValues = data.map((item) => {
      const v = parseFloat(item.actual_ammonia)
      return !isNaN(v) ? v : 0
    })
    const predictedValues = data.map((item) => {
      const v = parseFloat(item.predicted_ammonia)
      return isFinite(v) ? v : 0
    })
    const r2 = calculateR2(actualValues, predictedValues)

    const errors = data.map((item) => Math.abs(parseFloat(item.prediction_error) || 0))
    const avgError = errors.reduce((s, e) => s + e, 0) / errors.length

    // 次回補充推奨
    const futureData = data.filter((item) => new Date(item.date) > baseDateObj)
    let nextRefillText = '予測データ無し'

    if (futureData.length > 0) {
      const nextRefillPrediction = futureData.find(
        (item) => parseFloat(item.predicted_ammonia) <= refillLevel
      )

      if (nextRefillPrediction) {
        const nextRefillDate = new Date(nextRefillPrediction.date)
        const daysUntilRefill = Math.ceil(
          (nextRefillDate.getTime() - baseDateObj.getTime()) / (1000 * 60 * 60 * 24)
        )
        const formattedDate = nextRefillDate.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        nextRefillText = `${formattedDate}（${daysUntilRefill}日後）`
      } else {
        const futureRefills = futureData.filter((item) => parseInt(item.is_refill, 10) === 1)
        if (futureRefills.length > 0) {
          const nextRefillDate = new Date(futureRefills[0].date)
          const daysUntilRefill = Math.ceil(
            (nextRefillDate.getTime() - baseDateObj.getTime()) / (1000 * 60 * 60 * 24)
          )
          const formattedDate = nextRefillDate.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
          nextRefillText = `${formattedDate}（${daysUntilRefill}日後）`
        } else {
          nextRefillText = '予測期間内に無し'
        }
      }
    }

    setStats({
      currentStock: currentStockText,
      accuracy: `${(r2 * 100).toFixed(1)}%`,
      avgError: `${avgError.toFixed(1)} m³`,
      nextRefill: nextRefillText,
    })
  }

  const calculateR2 = (actual: number[], predicted: number[]): number => {
    if (actual.length !== predicted.length || actual.length === 0) return 0
    const mean = actual.reduce((s, v) => s + v, 0) / actual.length
    const ssTot = actual.reduce((s, v) => s + Math.pow(v - mean, 2), 0)
    const ssRes = actual.reduce((s, v, i) => s + Math.pow(v - predicted[i], 2), 0)
    return ssTot === 0 ? 0 : 1 - ssRes / ssTot
  }

  // チャートデータの生成
  const getChartData = () => {
    if (chartData.length === 0 || !baseDate) return null

    const baseDateObj = parseJstDate(baseDate)
    const startDate = new Date(baseDateObj)
    startDate.setDate(startDate.getDate() - currentRange)
    const endDate = new Date(baseDateObj)
    endDate.setDate(endDate.getDate() + currentRange)

    const filteredData = chartData.filter((item) => {
      const d = parseJstDate(item.date)
      return d >= startDate && d <= endDate
    })

    const labels = filteredData.map((item) => {
      const d = parseJstDate(item.date)
      return `${d.getMonth() + 1}/${d.getDate()}`
    })
    const actualAmmoniaData = filteredData.map((item) => {
      const val = parseFloat(item.actual_ammonia)
      return !isNaN(val) && item.actual_ammonia !== '' ? val : null
    })
    const predictedAmmoniaData = filteredData.map(
      (item) => parseFloat(item.predicted_ammonia) || 0
    )
    const actualPowerData = filteredData.map((item) => parseFloat(item.actual_power) || 0)
    const refillLevelData = new Array(labels.length).fill(refillLevel)

    return {
      labels,
      datasets: [
        {
          label: '実績在庫 (m³)',
          data: actualAmmoniaData,
          borderColor: '#00ffff',
          backgroundColor: 'rgba(0, 255, 255, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          yAxisID: 'y',
          spanGaps: false,
        },
        {
          label: '予測在庫 (m³)',
          data: predictedAmmoniaData,
          borderColor: '#00ff88',
          backgroundColor: 'rgba(0, 255, 136, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.4,
          yAxisID: 'y',
          pointRadius: 0,
        },
        {
          label: '補充レベル (m³)',
          data: refillLevelData,
          borderColor: '#ff00ff',
          backgroundColor: 'rgba(255, 0, 255, 0.1)',
          borderWidth: 2,
          borderDash: [10, 5],
          tension: 0,
          yAxisID: 'y',
          pointRadius: 0,
        },
        {
          label: '発電実績 (kW)',
          data: actualPowerData,
          borderColor: '#ffaa00',
          backgroundColor: 'rgba(255,170,0,0.1)',
          borderWidth: 1,
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    }
  }

  // チャートオプション（baseDateに反応するようにuseMemoでメモ化）
  const chartOptions: any = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: '#e0e0e0', font: { size: 12 } } },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#00ffff',
        bodyColor: '#e0e0e0',
        borderColor: '#00ffff',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,255,255,0.1)' },
        ticks: { 
          color: (context: any) => {
            if (!baseDate) return '#e0e0e0'
            const bd = parseJstDate(baseDate)
            const baseDateLabel = `${bd.getMonth() + 1}/${bd.getDate()}`
            const currentLabel = context.chart.data.labels[context.index]
            return currentLabel === baseDateLabel ? 'red' : '#e0e0e0'
          },
          callback: function(this: any, value: any, index: number, ticks: any) {
            if (!baseDate) return this.getLabelForValue(value)
            const bd = parseJstDate(baseDate)
            const baseDateLabel = `${bd.getMonth() + 1}/${bd.getDate()}`
            const label = this.getLabelForValue(value)
            if (label === baseDateLabel) {
              return ['基準日', label]
            }
            return label
          },
          font: (context: any) => {
            if (!baseDate) return { weight: 'normal' }
            const bd = parseJstDate(baseDate)
            const baseDateLabel = `${bd.getMonth() + 1}/${bd.getDate()}`
            const currentLabel = context.chart.data.labels[context.index]
            return currentLabel === baseDateLabel ? { weight: 'bold' } : { weight: 'normal' }
          }
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: '在庫レベル (m³)', color: '#00ffff' },
        grid: { color: 'rgba(0,255,255,0.1)' },
        ticks: { color: '#e0e0e0' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: '発電量 (kW)', color: '#ffaa00' },
        grid: { drawOnChartArea: false },
        ticks: { color: '#e0e0e0' },
      },
    },
  }), [baseDate]) // baseDateが変更されたらオプションを再生成

  // 基準日の赤い縦線を描画するプラグイン（baseDate をクロージャで参照）
  const baseDateLinePlugin = React.useMemo(() => {
    return {
      id: 'baseDateLine',
      afterDraw: (chart: any) => {
        // baseDateをクロージャで参照
        if (!baseDate) {
          console.log('baseDateLinePlugin: baseDate is not set')
          return
        }
        
        const xScale = chart.scales.x
        const yScale = chart.scales.y
        
        // チャートのラベルを取得
        const labels = chart.data.labels
        let baseDateIndex = -1
        
        // 基準日のインデックスを探す
        const bd = parseJstDate(baseDate)
        const expectedLabel = `${bd.getMonth() + 1}/${bd.getDate()}`
        
        console.log(`baseDateLinePlugin: baseDate=${baseDate}, expectedLabel=${expectedLabel}`)
        console.log(`baseDateLinePlugin: labels=`, labels)
        
        for (let i = 0; i < labels.length; i++) {
          // baseDateは "YYYY-MM-DD" 形式、labelsは "M/D" 形式
          if (labels[i] === expectedLabel) {
            baseDateIndex = i
            console.log(`baseDateLinePlugin: Found baseDate at index ${i}`)
            break
          }
        }
        
        if (baseDateIndex === -1) {
          console.log(`baseDateLinePlugin: baseDate not found in labels. Expected: ${expectedLabel}`)
          return
        }
        
        const x = xScale.getPixelForValue(baseDateIndex)
        console.log(`baseDateLinePlugin: Drawing line at index ${baseDateIndex}, x=${x}`)
        
        const ctx = chart.ctx
        ctx.save()
        
  // より目立つ赤い縦線
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'
  ctx.lineWidth = 1
        ctx.setLineDash([8, 4])
        ctx.beginPath()
        ctx.moveTo(x, yScale.top)
        ctx.lineTo(x, yScale.bottom)
        ctx.stroke()
        
        // さらに強調するために薄い背景線も追加
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)'
        ctx.lineWidth = 8
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(x, yScale.top)
        ctx.lineTo(x, yScale.bottom)
        ctx.stroke()
        
        ctx.restore()
        console.log(`baseDateLinePlugin: Line drawn successfully`)
      }
    }
  }, [baseDate]) // baseDateが変更されたらプラグインを再生成

  // 年月ボタンの生成
  const getMonthButtons = () => {
    if (chartData.length === 0) return []

    const monthSet = new Set<string>()
    chartData.forEach((item) => {
      const date = parseJstDate(item.date)
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthSet.add(yearMonth)
    })

    return Array.from(monthSet)
      .sort()
      .map((yearMonth) => {
        const [year, month] = yearMonth.split('-')
        const shortYear = year.substring(2)
        return {
          key: yearMonth,
          label: `${shortYear}/${month}`,
          value: `${yearMonth}-01`,
        }
      })
  }

  const handleDateChange = (days: number) => {
    const currentDate = parseJstDate(baseDate)
    currentDate.setDate(currentDate.getDate() + days)
    setBaseDate(ymd(currentDate))
  }

  const handleRefillChange = (amount: number) => {
    const newValue = refillLevel + amount
    if (newValue >= 0 && newValue <= 1000) {
      setRefillLevel(newValue)
    }
  }

  const runTrain = async () => {
    if (!isLocal) {
      alert('学習機能はローカル環境（localhost）でのみ利用可能です。\nGitHub Pages (https://j1921604.github.io/ammonia_inventory_forecast/) では実行できません。')
      return
    }
    if (isTraining) return
    if (!confirm('全データを使用してAIモデルを再学習します。続行しますか？')) {
      return
    }

    setIsTraining(true)
    try {
      const response = await fetch('/api/ml/train', { method: 'POST' })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.log ?? '学習に失敗しました')
      }

      alert('学習が完了しました。\n\nコマンド出力:\n' + (payload.log ?? 'ログなし'))
    } catch (error) {
      console.error('学習エラー:', error)
      const message = error instanceof Error ? error.message : '学習中にエラーが発生しました'
      alert(message)
    } finally {
      setIsTraining(false)
    }
  }

  const runPredict = async () => {
    if (!isLocal) {
      alert('予測機能はローカル環境（localhost）でのみ利用可能です。\nGitHub Pages (https://j1921604.github.io/ammonia_inventory_forecast/) では実行できません。')
      return
    }
    if (isPredicting) return
    if (!confirm('最新データで1か月分の予測を再計算しますか？')) {
      return
    }

    setIsPredicting(true)
    try {
      const response = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forecastDays: 30 }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.log ?? '予測に失敗しました')
      }

      alert('予測が完了しました。最新データを再読み込みします。')
      setReloadKey((key) => key + 1)
    } catch (error) {
      console.error('予測エラー:', error)
      const message = error instanceof Error ? error.message : '予測中にエラーが発生しました'
      alert(message)
    } finally {
      setIsPredicting(false)
    }
  }

  const handleImportCSV = () => {
    if (!isLocal) {
      alert('インポート機能はローカル環境（localhost）でのみ利用可能です。\nGitHub Pages (https://j1921604.github.io/ammonia_inventory_forecast/) では利用できません。')
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      if (file.name !== 'training_data.csv') {
        alert('エラー: training_data.csv 以外のファイルはインポートできません。')
        return
      }

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/data/import', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('アップロードに失敗しました')
        }

        alert('CSVファイルをインポートしました。')
        // チャート再読み込みのためにリロードキー更新などが必要ならここで行う
        // ここでは簡易的にリロードを促すか、既存の読み込みロジックを呼ぶ
        if (confirm('データを反映するためにページをリロードしますか？')) {
          window.location.reload()
        }
      } catch (error) {
        console.error('Import error:', error)
        alert('インポートに失敗しました。')
      }
    }
    input.click()
  }

  const handleExportCSV = async () => {
    if (!isLocal) {
      alert('学習データの直接エクスポートはローカル環境でのみ可能です。\nGitHub Pages (https://j1921604.github.io/ammonia_inventory_forecast/) では利用できません。')
      return
    }

    try {
      const response = await fetch('/api/data/export')
      if (!response.ok) {
        throw new Error('エクスポートに失敗しました')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'training_data.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('エクスポートに失敗しました。')
    }
  }

  const data = getChartData()

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">
          アンモニア在庫レベル予測ダッシュボード（30日後まで予測）
        </h1>
      </div>

      <div className="control-panel">
        <div
          className={`control-group ${warningState.isWarning ? 'is-warning' : ''}`}
          id="warningContainer"
        >
          <h3 className="warning-title">{warningState.title}</h3>
          <div className="warning-text" style={{ whiteSpace: 'pre-line' }}>
            {warningState.text}
          </div>
        </div>

        <div className="control-group">
          <h3>基準日選択</h3>
          <div className="date-control">
            <div className="date-input-group">
              <button className="nav-btn" onClick={() => handleDateChange(-7)}>
                -7日
              </button>
              <button className="nav-btn" onClick={() => handleDateChange(-1)}>
                -1日
              </button>
              <div className="date-input-container">
                <input
                  type="date"
                  id="baseDate"
                  className="date-input"
                  value={baseDate}
                  onChange={(e) => setBaseDate(e.target.value)}
                />
              </div>
              <button className="nav-btn" onClick={() => handleDateChange(1)}>
                +1日
              </button>
              <button className="nav-btn" onClick={() => handleDateChange(7)}>
                +7日
              </button>
            </div>
            <div className="month-buttons">
              {getMonthButtons().map((month) => (
                <button
                  key={month.key}
                  className={`month-btn ${activeMonth === month.key ? 'active' : ''}`}
                  onClick={() => setBaseDate(month.value)}
                >
                  {month.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="control-group">
          <h3>補充レベル設定 [m³]</h3>
          <div className="refill-level-control">
            <button className="btn" onClick={() => handleRefillChange(-10)}>
              -10
            </button>
            <input
              type="number"
              id="refillLevel"
              className="input-field"
              value={refillLevel}
              min="0"
              max="1000"
              onChange={(e) => setRefillLevel(parseInt(e.target.value, 10))}
            />
            <button className="btn" onClick={() => handleRefillChange(10)}>
              +10
            </button>
          </div>
        </div>

        <div className="control-group">
          <h3>アンサンブル処理</h3>
          <p style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '10px' }}>
            RandomForest + GradientBoosting + Ridge回帰
          </p>
          <div
            className="refill-level-control"
            style={{
              flexDirection: 'column',
              gap: '15px',
              justifyContent: 'center',
              flexGrow: 1,
            }}
          >
            <button className="btn" onClick={runTrain} style={{ width: '120px' }} disabled={isTraining}>
              {isTraining ? '学習中...' : '学習'}
            </button>
            <button className="btn" onClick={runPredict} style={{ width: '120px' }} disabled={isPredicting}>
              {isPredicting ? '予測中...' : '予測'}
            </button>
          </div>
        </div>

        <div className="control-group">
          <h3>データ管理</h3>
          <p style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '10px' }}>
            training_data.csv のみ操作できます。
          </p>
          <div
            className="refill-level-control"
            style={{
              flexDirection: 'column',
              gap: '15px',
              justifyContent: 'center',
              flexGrow: 1,
            }}
          >
            <button className="btn" onClick={handleImportCSV} style={{ width: '120px' }}>
              インポート
            </button>
            <button className="btn" onClick={handleExportCSV} style={{ width: '120px' }}>
              エクスポート
            </button>
          </div>
        </div>
      </div>

      <div className="chart-container">
        {data && <Line key={baseDate} ref={chartRef} data={data} options={chartOptions} plugins={[baseDateLinePlugin]} />}
      </div>

      <div className="stats-panel">
        <div className="stat-card">
          <div className="stat-title">基準日の在庫レベル</div>
          <div className="stat-value">{stats.currentStock}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">予測精度 (R²)</div>
          <div className="stat-value">{stats.accuracy}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">平均予測誤差</div>
          <div className="stat-value">{stats.avgError}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">次回補充推奨</div>
          <div className="stat-value">{stats.nextRefill}</div>
        </div>
      </div>

      <div className="footer">
        <div className="update-info">
          最終更新: <span id="last-update">{lastUpdate}</span> | 次回更新予定: 毎日 07:00 (日本時間)
        </div>
      </div>
    </div>
  )
}
