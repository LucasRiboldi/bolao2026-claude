/**
 * Consistent header for each admin tab — page title + description + optional
 * trailing actions slot. Standardizes the look across Users / Results /
 * Config / Tools so each tab feels part of the same dashboard.
 */
import type { ReactNode } from 'react'

interface AdminPageHeaderProps {
  icon: string
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminPageHeader({ icon, title, description, actions }: AdminPageHeaderProps) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-header__main">
        <span className="admin-page-header__icon" aria-hidden="true">{icon}</span>
        <div className="admin-page-header__text">
          <h2 className="admin-page-header__title">{title}</h2>
          {description && <p className="admin-page-header__desc">{description}</p>}
        </div>
      </div>
      {actions && <div className="admin-page-header__actions">{actions}</div>}
    </header>
  )
}
