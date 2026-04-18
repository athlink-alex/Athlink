import { useEffect, useRef } from 'react'

export default function CoachApply() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src*="261068470271051"]'
    )
    if (existingScript) existingScript.remove()

    const script = document.createElement('script')
    script.src = 'https://form.jotform.com/jsform/261068470271051'
    script.type = 'text/javascript'
    script.async = true

    if (containerRef.current) {
      containerRef.current.appendChild(script)
    }

    return () => {
      const s = document.querySelector('script[src*="261068470271051"]')
      if (s) s.remove()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-sm font-medium px-3 py-1 rounded-full mb-4">
          Become a Coach
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Join Athlink as a Coach
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Fill out the application below. Our team reviews every coach
          personally before they go live on the platform — usually within
          24 hours.
        </p>

        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-400">
          <span>Manual verification</span>
          <span>Secure payments</span>
          <span>South Bay local</span>
        </div>
      </div>

      <div
        className="max-w-3xl mx-auto px-4 pb-16"
        ref={containerRef}
      />
    </div>
  )
}