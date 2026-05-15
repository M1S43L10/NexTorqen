import { Bell, CheckCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToUserNotifications,
} from '../services/notificationService'
import { formatDate } from '../utils/date'

export function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) return undefined
    return subscribeToUserNotifications(user, setNotifications)
  }, [user])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )

  const handleMarkAll = async () => {
    await markAllNotificationsRead(user)
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    )
  }

  const handleRead = async (notification) => {
    if (notification.read) return
    await markNotificationRead(notification.id)
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
    )
  }

  return (
    <div className="notification-shell">
      <button
        className="icon-button notification-button"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Ver notificaciones"
        title="Ver notificaciones"
      >
        <Bell size={19} />
        {unreadCount ? <span>{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="notification-popover card">
          <div className="notification-popover-header">
            <strong>Notificaciones</strong>
            <button className="btn btn-ghost" type="button" onClick={handleMarkAll}>
              <CheckCheck size={16} />
              Leídas
            </button>
          </div>

          <div className="notification-list">
            {notifications.length ? (
              notifications.slice(0, 8).map((notification) => (
                <button
                  className={`notification-item ${notification.read ? '' : 'notification-unread'}`}
                  key={notification.id}
                  type="button"
                  onClick={() => handleRead(notification)}
                >
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <small>{formatDate(notification.createdAt)}</small>
                </button>
              ))
            ) : (
              <div className="notification-empty">Sin notificaciones nuevas.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
