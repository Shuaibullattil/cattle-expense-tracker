import { useEffect, useRef, useState } from 'react'
import { HiChevronDown, HiCheck } from 'react-icons/hi2'

export default function StyledSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className = '',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [])

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="styled-select-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex-1 min-w-0 text-left">
          {selected ? (
            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-sm font-medium ${selected.color}`}>
              {selected.Icon && <selected.Icon className="shrink-0" size={16} aria-hidden />}
              <span className="truncate">{selected.label}</span>
            </span>
          ) : (
            <span className="text-gray-500 text-sm">{placeholder}</span>
          )}
        </span>
        <HiChevronDown
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          size={18}
          aria-hidden
        />
      </button>

      {open && (
        <ul className="styled-select-menu" role="listbox">
          {options.map((opt) => {
            const isSelected = opt.value === value
            const Icon = opt.Icon
            return (
              <li key={opt.value || '__empty'} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`styled-select-option ${opt.color} ${isSelected ? 'ring-2 ring-green-500 ring-offset-1' : ''}`}
                >
                  {Icon && <Icon className="shrink-0" size={18} aria-hidden />}
                  <span className="flex-1 text-left font-medium">{opt.label}</span>
                  {isSelected && <HiCheck className="shrink-0 text-green-700" size={18} aria-hidden />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
