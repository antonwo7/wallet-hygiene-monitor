'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMe } from '../../../hooks/useAuth'
import { useUserSettings, useUpdateUserSettings } from '../../../hooks/useSettings'

const thresholdOptions = [
	{ label: 'Any risk (>= 1)', value: 1 },
	{ label: 'Medium+ (>= 30)', value: 30 },
	{ label: 'High+ (>= 60)', value: 60 },
	{ label: 'Critical+ (>= 90)', value: 90 }
]

export default function SettingsPage() {
	const { user } = useMe()
	const { settings, isLoading } = useUserSettings()
	const { update, isLoading: saving } = useUpdateUserSettings()

	const [enabled, setEnabled] = useState(true)
	const [minRisk, setMinRisk] = useState(1)

	useEffect(() => {
		if (!settings) return
		setEnabled(Boolean(settings.emailNotificationsEnabled))
		setMinRisk(Number(settings.emailMinRiskScore ?? 1))
	}, [settings])

	const canSave = useMemo(() => {
		if (!settings) return false
		return (
			enabled !== Boolean(settings.emailNotificationsEnabled) ||
			minRisk !== Number(settings.emailMinRiskScore ?? 1)
		)
	}, [settings, enabled, minRisk])

	if (isLoading) {
		return <div className="mx-auto max-w-5xl p-6 text-slate-500">Loading…</div>
	}

	return (
		<div className="mx-auto max-w-5xl p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
				<p className="text-slate-600 mt-1">Minimal notification settings for MVP.</p>
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
				<div>
					<div className="text-sm text-slate-500">Email</div>
					<div className="font-medium text-slate-900">{user?.email}</div>
				</div>

				<label className="flex items-center gap-3">
					<input
						type="checkbox"
						className="h-4 w-4"
						checked={enabled}
						onChange={e => setEnabled(e.target.checked)}
					/>
					<span className="text-slate-800">Enable email notifications</span>
				</label>

				<div>
					<div className="text-sm text-slate-500 mb-1">Minimum risk threshold</div>
					<select
						className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
						value={minRisk}
						onChange={e => setMinRisk(Number(e.target.value))}
						disabled={!enabled}
					>
						{thresholdOptions.map(o => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
					<div className="text-xs text-slate-500 mt-2">
						We will email you only about events with riskScore ≥ selected threshold.
					</div>
				</div>

				<div className="flex flex-wrap gap-3 pt-2">
					<button
						className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
						disabled={!canSave || saving}
						onClick={() => update({ emailNotificationsEnabled: enabled, emailMinRiskScore: minRisk })}
					>
						{saving ? 'Saving…' : 'Save settings'}
					</button>
				</div>
			</div>
		</div>
	)
}
