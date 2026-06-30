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
        className="styled-select-trigger flex items-center justify-between w-full h-11 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm shadow-xs hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex-1 min-w-0 text-left">
          {selected ? (
            <span className="flex items-center gap-3 text-sm font-medium text-gray-900">
              {selected.Icon && (
                <span className={`inline-flex items-center justify-center p-1.5 rounded-lg border shrink-0 ${selected.color}`}>
                  <selected.Icon size={14} aria-hidden />
                </span>
              )}
              <span className="truncate">
                {selected.label}
                {selected.subLabel && (
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    ({selected.subLabel})
                  </span>
                )}
              </span>
            </span>
          ) : (
            <span className="text-gray-400 text-sm font-normal">{placeholder}</span>
          )}
        </span>
        <HiChevronDown
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          size={18}
          aria-hidden
        />
      </button>

      {open && (
        <ul className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-xl space-y-1" role="listbox">
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
                  className={`flex w-full items-center gap-3 px-3 py-2 rounded-xl border text-sm transition-all hover:bg-gray-50 active:scale-[0.99] ${
                    isSelected ? 'ring-2 ring-green-600 ring-offset-1 border-transparent bg-green-50/20' : 'border-transparent bg-transparent'
                  }`}
                >
                  {Icon && (
                    <span className={`inline-flex items-center justify-center p-1.5 rounded-lg border shrink-0 ${opt.color}`}>
                      <Icon size={14} aria-hidden />
                    </span>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-gray-900 text-sm leading-tight truncate">{opt.label}</div>
                    {opt.subLabel && <div className="text-[11px] text-gray-400 mt-0.5 font-normal leading-none truncate">{opt.subLabel}</div>}
                  </div>
                  {isSelected && <HiCheck className="shrink-0 text-green-700 ml-auto" size={18} aria-hidden />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
