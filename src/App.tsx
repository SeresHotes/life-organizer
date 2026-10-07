import { useRoute, navigate } from './hooks'
import { MainScreen } from './screens/MainScreen'
import { ProjectsScreen } from './screens/ProjectsScreen'
import { ProjectScreen } from './screens/ProjectScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { SpheresScreen, SphereScreen } from './screens/SpheresScreen'

export function App() {
  const [screen, arg] = useRoute()
  let content
  if (screen === 'projects') content = <ProjectsScreen />
  else if (screen === 'project' && arg) content = <ProjectScreen id={arg} />
  else if (screen === 'spheres') content = <SpheresScreen />
  else if (screen === 'sphere' && arg) content = <SphereScreen id={arg} />
  else if (screen === 'settings') content = <SettingsScreen />
  else content = <MainScreen />
  const tab = screen === 'project' ? 'projects' : screen === 'sphere' ? 'spheres' : (screen ?? '')
  return (
    <div className="app">
      <main className="content">{content}</main>
      <nav className="tabbar">
        <Tab id="" current={tab} icon="☰" label="Главная" />
        <Tab id="projects" current={tab} icon="▦" label="Проекты" />
        <Tab id="spheres" current={tab} icon="◐" label="Сферы" />
        <Tab id="settings" current={tab} icon="⚙" label="Настройки" />
      </nav>
    </div>
  )
}

function Tab({ id, current, icon, label }: { id: string; current: string; icon: string; label: string }) {
  return (
    <button className={'tab' + (id === current ? ' active' : '')} onClick={() => navigate(id)}>
      <span className="tab-icon">{icon}</span>
      <span>{label}</span>
    </button>
  )
}
