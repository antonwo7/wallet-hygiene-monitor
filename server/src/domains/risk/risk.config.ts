import { RiskLevel } from '@prisma/client'

export type RiskThreshold = { minScore: number; level: RiskLevel }

export const RISK_THRESHOLDS: RiskThreshold[] = [
	{ minScore: 80, level: RiskLevel.CRITICAL },
	{ minScore: 50, level: RiskLevel.HIGH },
	{ minScore: 20, level: RiskLevel.MEDIUM },
	{ minScore: 0, level: RiskLevel.LOW }
]

export function scoreToRiskLevel(score: number): RiskLevel {
	for (const t of RISK_THRESHOLDS) {
		if (score >= t.minScore) return t.level
	}
	return RiskLevel.LOW
}
