import { useRef } from 'react'
import { pickData, useStore, type Data } from '../store'

export function SettingsScreen() {
  const s = useStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(pickData(useStore.getState()), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `life-organizer-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importData = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as Data
      if (!Array.isArray(data.projects) || !Array.isArray(data.tasks)) throw new Error('bad format')
      if (confirm('Заменить все текущие данные данными из файла?')) s.importData(data)
    } catch {
      alert('Не удалось прочитать файл')
    }
  }

  return (
    <div className="page settings">
      <h2>День</h2>
      <label className="row">
        Новый день начинается в
        <select value={s.dayStartHour} onChange={(e) => s.setDayStartHour(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, '0')}:00
            </option>
          ))}
        </select>
      </label>
      <p className="hint">В это время рутинные задачи снова становятся открытыми.</p>

      <h2>Данные</h2>
      <p className="hint">
        Всё хранится только в этом браузере. Чтобы перенести данные на другое устройство, сделайте экспорт и импортируйте
        файл там.
      </p>
      <div className="row">
        <button onClick={exportData}>Экспорт</button>
        <button onClick={() => fileRef.current?.click()}>Импорт</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importData(f)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
