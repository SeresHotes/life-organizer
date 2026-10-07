import { useRef, useState } from 'react'
import { checkForUpdate, hardReload } from '../update'
import { pickData, useStore, type Data } from '../store'

export function SettingsScreen() {
  const s = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [updateMsg, setUpdateMsg] = useState('')

  const update = async () => {
    setUpdateMsg('Проверяю…')
    const r = await checkForUpdate()
    setUpdateMsg(
      r === 'updating' ? 'Скачиваю новую версию, приложение перезагрузится…' : r === 'latest' ? 'У вас последняя версия' : 'Не удалось проверить (нет интернета?)',
    )
  }

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

      <h2>Приложение</h2>
      <p className="hint">
        Версия {__APP_VERSION__} от {new Date(__BUILD_TIME__).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
      </p>
      <div className="row">
        <button onClick={update}>Обновить</button>
        {updateMsg && <span className="hint">{updateMsg}</span>}
      </div>
      <p className="hint">
        Если обновление не подтягивается —{' '}
        <button
          className="link-btn inline"
          onClick={() => confirm('Сбросить кэш приложения и загрузить заново? Данные не пострадают.') && hardReload()}
        >
          перезагрузить без кэша
        </button>
        .
      </p>
    </div>
  )
}
