import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { statusNames } from '../utils/format';

export function Button({
  children,
  onClick,
  kind = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn ${kind}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export function Status({ value }) {
  const tone = ['PAYEE', 'DISPONIBLE', 'CONFIRMEE', 'TERMINEE'].includes(value)
    ? 'ok'
    : ['EN_ATTENTE', 'PARTIELLEMENT_PAYEE', 'EN_NETTOYAGE'].includes(value)
      ? 'warn'
      : ['ANNULEE', 'EN_MAINTENANCE', 'NON_PAYEE'].includes(value)
        ? 'bad'
        : 'info';

  return (
    <span className={`status ${tone}`}>
      {statusNames[value] || value}
    </span>
  );
}

export function ToastHost() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleToast = (event) => {
      setMessage(event.detail);
      window.setTimeout(() => setMessage(''), 3200);
    };
    window.addEventListener('auberge-toast', handleToast);
    return () => window.removeEventListener('auberge-toast', handleToast);
  }, []);

  return message ? (
    <div className="toast" role="status">
      {message}
    </div>
  ) : null;
}

export function PageHead({ title, subtitle, action }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && (
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Metric({ label, value, icon: Icon, note }) {
  return (
    <div className="metric">
      <div className="metric-top">
        {label}
        <Icon size={18} color="#b28c4b" />
      </div>
      <div className="metric-value">{value}</div>
      {note && (
        <div className="muted" style={{ fontSize: 11, marginTop: 5 }}>
          {note}
        </div>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) =>
        event.target === event.currentTarget && onClose()
      }
    >
      <div className="modal">
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            aria-label="Fermer"
            className="btn small"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Input({ label, ...props }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      <input className="input" {...props} />
    </div>
  );
}

export function Select({ label, options, ...props }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      <select className="select" {...props}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FormButton({ children }) {
  return (
    <button className="btn primary" type="submit">
      {children}
    </button>
  );
}
