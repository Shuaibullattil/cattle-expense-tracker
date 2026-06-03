export default function LoadingSpinner({ size = 'md' }) {
  const sizeClass = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8'
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className={`${sizeClass} animate-spin rounded-full border-4 border-green-200 border-t-green-600`}
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}
