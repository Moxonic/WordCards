import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiLogOut, FiChevronLeft, FiFileText } from 'react-icons/fi';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { UI_LANGS } from '../i18n/config';
import { saveUiLang } from '../data/prefs';
import Wordmark from './Wordmark';

export default function Shell() {
  const { user, signOutUser } = useAuth();
  const { lang, t } = useI18n();
  const nav = useNavigate();
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const atHome = loc.pathname === '/';

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <div className="flex h-full w-full justify-center bg-slate-200">
      <div className="relative flex h-full w-full max-w-[480px] flex-col overflow-hidden bg-slate-50 ring-1 ring-slate-200">
        <nav className="relative flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-3">
          <div className="flex min-w-0 items-center gap-1">
            {!atHome && (
              <button
                onClick={() => nav(-1)}
                title={t('common.back')}
                className="rounded-none p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>
            )}
          </div>

          <Wordmark className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-medium uppercase tracking-[0.28em] text-slate-700" />

          <div className="flex items-center gap-1">
            <Link
              to="/texts"
              title={t('shell.myTexts')}
              aria-label={t('shell.myTexts')}
              className="rounded-none p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <FiFileText className="h-5 w-5" />
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                title={t('common.account')}
                className="flex items-center gap-1 rounded-none pr-1 hover:bg-slate-100"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="h-8 w-8 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-sm text-slate-700">
                    {(user?.displayName || user?.email || '?').slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="text-xs text-slate-500">▾</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-none border border-slate-200 bg-white shadow-lg">
                  <div className="truncate border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
                    {user?.displayName || user?.email}
                  </div>

                  <label className="flex flex-col gap-1 border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
                    {t('shell.language')}
                    <select
                      value={lang}
                      onChange={(e) => {
                        if (user) saveUiLang(user.uid, e.target.value);
                      }}
                      className="rounded-none border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
                    >
                      {UI_LANGS.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.native}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    onClick={signOutUser}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-slate-50"
                  >
                    <FiLogOut className="h-4 w-4" />
                    {t('shell.signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
