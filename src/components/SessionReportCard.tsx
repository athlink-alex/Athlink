import type { SessionReport } from '../lib/supabase'
import { StarRating } from './ui/StarRating'

interface SessionReportCardProps {
  report: SessionReport
  coachName?: string
}

export function SessionReportCard({ report, coachName }: SessionReportCardProps) {
  const dateStr = new Date(report.session_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-3 border-b border-[#E5E7EB] dark:border-gray-700">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Session Report
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {dateStr}{coachName ? ` · Coach ${coachName}` : ''}
        </p>
        {report.session_rating && (
          <div className="mt-2">
            <StarRating value={report.session_rating} readonly size="sm" />
          </div>
        )}
      </div>

      {/* Session Summary */}
      {report.session_summary && (
        <div className="border-l-4 border-[#2563EB] pl-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] mb-1">
            Session Summary
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {report.session_summary}
          </p>
        </div>
      )}

      {/* Strengths */}
      {(report.strength_1 || report.strength_2 || report.strength_3) && (
        <div className="border-l-4 border-[#16A34A] pl-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#16A34A] mb-1">
            Strengths Observed
          </h4>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {report.strength_1 && <li>• {report.strength_1}</li>}
            {report.strength_2 && <li>• {report.strength_2}</li>}
            {report.strength_3 && <li>• {report.strength_3}</li>}
          </ul>
        </div>
      )}

      {/* Development Areas */}
      {(report.improvement_1 || report.improvement_2 || report.improvement_3) && (
        <div className="border-l-4 border-[#D97706] pl-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D97706] mb-1">
            Development Areas
          </h4>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {report.improvement_1 && <li>• {report.improvement_1}</li>}
            {report.improvement_2 && <li>• {report.improvement_2}</li>}
            {report.improvement_3 && <li>• {report.improvement_3}</li>}
          </ul>
        </div>
      )}

      {/* Drill Plan */}
      {(report.drill_1_name || report.drill_2_name || report.drill_3_name) && (
        <div className="border-l-4 border-[#7C3AED] pl-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED] mb-1">
            Next Session Drill Plan
          </h4>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {report.drill_1_name && (
              <li>• {report.drill_1_name}{report.drill_1_frequency ? ` — ${report.drill_1_frequency}` : ''}</li>
            )}
            {report.drill_2_name && (
              <li>• {report.drill_2_name}{report.drill_2_frequency ? ` — ${report.drill_2_frequency}` : ''}</li>
            )}
            {report.drill_3_name && (
              <li>• {report.drill_3_name}{report.drill_3_frequency ? ` — ${report.drill_3_frequency}` : ''}</li>
            )}
          </ul>
        </div>
      )}

      {/* Next Session Objective */}
      {report.next_session_objective && (
        <div className="border-l-4 border-[#2563EB] pl-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] mb-1">
            Next Session Objective
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {report.next_session_objective}
          </p>
        </div>
      )}
    </div>
  )
}