import { NavLink, Outlet } from 'react-router-dom'

const linkCls = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-violet-600/15 text-violet-200 border border-violet-700/30'
      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100 border border-transparent',
  ].join(' ')

const navItems = [
  {
    to: '/',
    end: true,
    label: 'Ончейн-анализ',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7.5" cy="7.5" r="2" />
        <path d="M7.5 1v2M7.5 12v2M1 7.5h2M12 7.5h2M3.2 3.2l1.4 1.4M10.4 10.4l1.4 1.4M3.2 11.8l1.4-1.4M10.4 4.6l1.4-1.4" />
      </svg>
    ),
  },
  {
    to: '/import',
    end: false,
    label: 'Импорт следов',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 11h11M7.5 2v7M4.5 6l3 3 3-3" />
      </svg>
    ),
  },
  {
    to: '/about',
    end: false,
    label: 'О методах',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7.5" cy="7.5" r="6" />
        <path d="M7.5 7v4M7.5 4.5v.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function AppShell() {
  return (
    <div className="flex min-h-svh">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950 md:flex">
        {/* Logo area */}
        <div className="border-b border-zinc-800/80 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 border border-violet-700/40">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#a78bfa" strokeWidth="1.5">
                <path d="M8 1L1 5v6l7 4 7-4V5L8 1z" />
                <path d="M1 5l7 4 7-4M8 9v6" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-100 leading-tight">Крипто-следы</div>
              <div className="text-xs text-zinc-600">статистический анализ</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkCls} end={item.end}>
              <span className="opacity-70">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-800/80 px-5 py-4">
          <p className="text-xs text-zinc-700 leading-relaxed">
            Учебный проект · BTC / ETH<br />
            Данные: mempool.space, Etherscan
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-violet-600/20">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#a78bfa" strokeWidth="1.5">
                <path d="M8 1L1 5v6l7 4 7-4V5L8 1z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-zinc-100">Крипто-следы</span>
          </div>
          <nav className="flex gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-violet-600/20 text-violet-200 border border-violet-700/30'
                      : 'bg-zinc-800/60 text-zinc-400 border border-transparent',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 py-8 md:px-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
